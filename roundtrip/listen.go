//go:build ignore

package main

// go run listen.go
// Listens on ALL midi in ports for ANY SysEx from microKORG S
// Trigger dump manually on the device while this is running

import (
	"fmt"
	"os"
	"runtime"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
	"unsafe"
)

var (
	lwm          = syscall.NewLazyDLL("winmm.dll")
	lmiOpen      = lwm.NewProc("midiInOpen")
	lmiClose     = lwm.NewProc("midiInClose")
	lmiStart     = lwm.NewProc("midiInStart")
	lmiStop      = lwm.NewProc("midiInStop")
	lmiAddBuf    = lwm.NewProc("midiInAddBuffer")
	lmiPrepHdr   = lwm.NewProc("midiInPrepareHeader")
	lmiUnprepHdr = lwm.NewProc("midiInUnprepareHeader")
	lmiGetNum    = lwm.NewProc("midiInGetNumDevs")
)

type LHDR struct {
	lpData          uintptr
	dwBufferLength  uint32
	dwBytesRecorded uint32
	dwUser          uintptr
	dwFlags         uint32
	_               uint32
	lpNext          uintptr
	reserved        uintptr
	dwOffset        uint32
	_               uint32
	dwReserved      [4]uintptr
}

var (
	mu       sync.Mutex
	received []byte
	rxDoneL  uint32
)

type portState struct {
	handle uintptr
	port   uintptr
	bufs   [][]byte
	hdrs   []*LHDR
}

var ports []*portState

var lcb = syscall.NewCallback(func(h, msg, inst, p1, p2 uintptr) uintptr {
	const (
		MIM_DATA     = 0x3C3
		MIM_LONGDATA = 0x3C4
	)
	port := int(inst)
	switch msg {
	case MIM_DATA:
		b0 := byte(p1)
		if b0 != 0xFE && b0 != 0xF8 { // ignore active sensing and clock
			fmt.Printf("[port %d] short: %08X\n", port, p1)
		}
	case MIM_LONGDATA:
		hdr := (*LHDR)(unsafe.Pointer(p1))
		if hdr.dwBytesRecorded > 0 {
			data := make([]byte, hdr.dwBytesRecorded)
			copy(data, (*[131072]byte)(unsafe.Pointer(hdr.lpData))[:hdr.dwBytesRecorded])
			mu.Lock()
			received = append(received, data...)
			fmt.Printf("[port %d] SysEx chunk: %d bytes (total: %d)\n  Header: % X\n",
				port, len(data), len(received), data[:min4(8, len(data))])
			if len(received) > 4 && received[len(received)-1] == 0xF7 {
				atomic.StoreUint32(&rxDoneL, 1)
			}
			mu.Unlock()
			// Re-add the buffer so we can receive more chunks
			hdr.dwBytesRecorded = 0
			hdr.dwFlags = 0
			lmiPrepHdr.Call(h, p1, unsafe.Sizeof(*hdr))
			lmiAddBuf.Call(h, p1, unsafe.Sizeof(*hdr))
		}
	}
	return 0
})

func min4(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func main() {
	n, _, _ := lmiGetNum.Call()
	fmt.Printf("MIDI in devices: %d\n\n", n)

	const CALLBACK_FUNCTION = 0x30000

	for i := uintptr(0); i < n; i++ {
		ps := &portState{port: i}
		var h uintptr
		r, _, _ := lmiOpen.Call(uintptr(unsafe.Pointer(&h)), i, lcb, i, CALLBACK_FUNCTION)
		if r != 0 {
			fmt.Printf("Port %d: FAILED (%d)\n", i, r)
			continue
		}
		ps.handle = h

		// Add 4 large buffers per port to handle chunked delivery
		for j := 0; j < 4; j++ {
			buf := make([]byte, 65536)
			runtime.KeepAlive(buf)
			hdr := &LHDR{lpData: uintptr(unsafe.Pointer(&buf[0])), dwBufferLength: uint32(len(buf))}
			lmiPrepHdr.Call(h, uintptr(unsafe.Pointer(hdr)), unsafe.Sizeof(*hdr))
			lmiAddBuf.Call(h, uintptr(unsafe.Pointer(hdr)), unsafe.Sizeof(*hdr))
			ps.bufs = append(ps.bufs, buf)
			ps.hdrs = append(ps.hdrs, hdr)
		}
		lmiStart.Call(h)
		fmt.Printf("✅ Port %d: listening\n", i)
		ports = append(ports, ps)
	}

	if len(ports) == 0 {
		fmt.Println("No MIDI in ports available")
		os.Exit(1)
	}

	fmt.Println("\n>>> TRIGGER DUMP ON microKORG S NOW <<<")
	fmt.Println("    Look in GLOBAL settings for MIDI DUMP / SysEx dump")
	fmt.Println("    Listening for 45 seconds...\n")

	deadline := time.Now().Add(45 * time.Second)
	for time.Now().Before(deadline) {
		if atomic.LoadUint32(&rxDoneL) != 0 {
			break
		}
		runtime.Gosched()
		time.Sleep(100 * time.Millisecond)
	}

	for _, ps := range ports {
		lmiStop.Call(ps.handle)
		for _, hdr := range ps.hdrs {
			lmiUnprepHdr.Call(ps.handle, uintptr(unsafe.Pointer(hdr)), unsafe.Sizeof(*hdr))
		}
		lmiClose.Call(ps.handle)
	}

	mu.Lock()
	total := len(received)
	mu.Unlock()

	if total == 0 {
		fmt.Println("❌ No SysEx received")
		fmt.Println("   Enable SysEx in microKORG S Global > MIDI settings first")
		os.Exit(1)
	}

	fmt.Printf("\n✅ Total received: %d bytes\n", total)
	fmt.Printf("   Header: % X\n", received[:min4(8, total)])
	fmt.Printf("   Footer: % X\n", received[max4(0, total-4):])

	outFile := "dump-from-microkorg-s.syx"
	os.WriteFile(outFile, received, 0644)
	fmt.Printf("   Saved to %s\n", outFile)
}

func max4(a, b int) int {
	if a > b {
		return a
	}
	return b
}
