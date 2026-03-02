//go:build ignore

package main

// go run listen.go
// Listens for SysEx dump from microKORG S
// Trigger dump manually: SHIFT + DATA DUMP key on the device

import (
	"fmt"
	"os"
	"runtime"
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

	lmoOpen      = lwm.NewProc("midiOutOpen")
	lmoClose     = lwm.NewProc("midiOutClose")
	lmoLongMsg   = lwm.NewProc("midiOutLongMsg")
	lmoPrepHdr   = lwm.NewProc("midiOutPrepareHeader")
	lmoUnprepHdr = lwm.NewProc("midiOutUnprepareHeader")
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
	gotSysex    uint32
	sysexBytes  uint32
	sysexHeader [8]byte
)

var lcb = syscall.NewCallback(func(h, msg, inst, p1, p2 uintptr) uintptr {
	const (
		MIM_DATA     = 0x3C3
		MIM_LONGDATA = 0x3C4
	)
	if msg == MIM_DATA {
		b := byte(p1)
		if b != 0xFE && b != 0xF8 {
			fmt.Printf("  short: %02X\n", b)
		}
		atomic.AddUint32(&sysexBytes, 1) // reuse as "alive" counter
	} else if msg == MIM_LONGDATA {
		hdr := (*LHDR)(unsafe.Pointer(p1))
		n := hdr.dwBytesRecorded
		if n > 0 {
			src := (*[131072]byte)(unsafe.Pointer(hdr.lpData))
			copy(sysexHeader[:], src[:])
			atomic.StoreUint32(&sysexBytes, n)
			atomic.StoreUint32(&gotSysex, 1)
			fmt.Printf("\n✅ SysEx received: %d bytes\n", n)
			fmt.Printf("   Header: % X\n", sysexHeader[:8])
		}
	}
	return 0
})

func sendReq(h uintptr, data []byte) {
	buf := make([]byte, len(data))
	copy(buf, data)
	runtime.KeepAlive(buf)
	hdr := LHDR{lpData: uintptr(unsafe.Pointer(&buf[0])), dwBufferLength: uint32(len(buf))}
	lmoPrepHdr.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	lmoLongMsg.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	time.Sleep(200 * time.Millisecond)
	lmoUnprepHdr.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
}

func main() {
	n, _, _ := lmiGetNum.Call()
	fmt.Printf("MIDI in devices: %d\n\n", n)

	// Open MIDI out
	var outH uintptr
	lmoOpen.Call(uintptr(unsafe.Pointer(&outH)), 2, 0, 0, 0)
	defer lmoClose.Call(outH)

	// Try opening MIDI in on port 1 then 0
	var inH uintptr
	port := uintptr(1)
	const CALLBACK_FUNCTION = 0x30000
	r, _, _ := lmiOpen.Call(uintptr(unsafe.Pointer(&inH)), port, lcb, port, CALLBACK_FUNCTION)
	if r != 0 {
		port = 0
		r, _, _ = lmiOpen.Call(uintptr(unsafe.Pointer(&inH)), port, lcb, port, CALLBACK_FUNCTION)
		if r != 0 {
			fmt.Printf("ERROR: midiInOpen failed on both ports\n")
			os.Exit(1)
		}
	}
	fmt.Printf("✅ MIDI in port %d open\n", port)
	defer lmiClose.Call(inH)

	// Pre-allocate ONE large SysEx buffer (256KB)
	rxBuf := make([]byte, 262144)
	runtime.KeepAlive(rxBuf)
	rxHdr := LHDR{
		lpData:         uintptr(unsafe.Pointer(&rxBuf[0])),
		dwBufferLength: uint32(len(rxBuf)),
	}
	lmiPrepHdr.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
	lmiAddBuf.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
	lmiStart.Call(inH)

	// Send dump requests
	fmt.Println("Sending dump requests...")
	sendReq(outH, []byte{0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x0E, 0xF7})
	sendReq(outH, []byte{0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x10, 0xF7})
	sendReq(outH, []byte{0xF0, 0x42, 0x30, 0x58, 0x0E, 0xF7})
	sendReq(outH, []byte{0xF0, 0x42, 0x30, 0x58, 0x10, 0xF7})

	fmt.Println("\n>>> TRIGGER DUMP ON microKORG S NOW <<<")
	fmt.Println("    SHIFT + DATA DUMP key → select ALL → WRITE")
	fmt.Println("Listening for 60 seconds...\n")

	deadline := time.Now().Add(60 * time.Second)
	prev := uint32(0)
	for time.Now().Before(deadline) {
		if atomic.LoadUint32(&gotSysex) != 0 {
			break
		}
		cur := atomic.LoadUint32(&sysexBytes)
		if cur != prev && cur > 1 {
			fmt.Printf("  MIDI activity: %d msgs\n", cur)
			prev = cur
		}
		runtime.Gosched()
		time.Sleep(100 * time.Millisecond)
	}

	lmiStop.Call(inH)
	lmiUnprepHdr.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))

	if atomic.LoadUint32(&gotSysex) == 0 {
		// Check if buffer was filled directly
		n2 := rxHdr.dwBytesRecorded
		if n2 > 0 {
			fmt.Printf("\n✅ Buffer filled: %d bytes\n", n2)
			fmt.Printf("   Header: % X\n", rxBuf[:8])
			os.WriteFile("dump-from-microkorg-s.syx", rxBuf[:n2], 0644)
			fmt.Println("   Saved to dump-from-microkorg-s.syx")
		} else {
			fmt.Println("❌ No SysEx received")
			fmt.Println("   MIDI out (sending) works. MIDI in (receiving) not catching SysEx.")
			fmt.Println("   The Focusrite may need SysEx pass-through enabled in its settings.")
		}
		return
	}

	// Save from buffer
	n2 := atomic.LoadUint32(&sysexBytes)
	os.WriteFile("dump-from-microkorg-s.syx", rxBuf[:n2], 0644)
	fmt.Printf("Saved %d bytes to dump-from-microkorg-s.syx\n", n2)
}
