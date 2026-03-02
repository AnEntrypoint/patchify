//go:build ignore

package main

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
	wmf          = syscall.NewLazyDLL("winmm.dll")
	fmoOpen      = wmf.NewProc("midiOutOpen")
	fmoClose     = wmf.NewProc("midiOutClose")
	fmoLongMsg   = wmf.NewProc("midiOutLongMsg")
	fmoPrepHdr   = wmf.NewProc("midiOutPrepareHeader")
	fmoUnprepHdr = wmf.NewProc("midiOutUnprepareHeader")
)

type FHDR struct {
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

func main() {
	file := "../FactoryBackUpDoResetAfter.syx"
	if len(os.Args) > 1 {
		file = os.Args[1]
	}
	data, err := os.ReadFile(file)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Sending: %s (%d bytes)\n", file, len(data))
	fmt.Printf("Header: % X\n\n", data[:5])

	var h uintptr
	r, _, _ := fmoOpen.Call(uintptr(unsafe.Pointer(&h)), 2, 0, 0, 0)
	if r != 0 {
		fmt.Printf("midiOutOpen failed: %d\n", r)
		os.Exit(1)
	}
	defer fmoClose.Call(h)
	fmt.Println("✅ MIDI out port 2 open")
	fmt.Println("Sending... watch microKORG for spinner")

	buf := make([]byte, len(data))
	copy(buf, data)
	runtime.KeepAlive(buf)
	hdr := FHDR{lpData: uintptr(unsafe.Pointer(&buf[0])), dwBufferLength: uint32(len(buf))}
	fmoPrepHdr.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	r, _, _ = fmoLongMsg.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 {
		fmt.Printf("midiOutLongMsg failed: %d\n", r)
		os.Exit(1)
	}

	// At MIDI bandwidth (31250 bps, 10 bits/byte) = 3125 bytes/sec
	// 36420 bytes takes ~11.7 seconds. Wait at least 15s.
	start := time.Now()
	fmt.Println("Waiting 15s for MIDI transmission to complete...")
	time.Sleep(15 * time.Second)

	doneBefore15 := atomic.LoadUint32(&hdr.dwFlags)&1 != 0
	deadline := time.Now().Add(10 * time.Second)
	for atomic.LoadUint32(&hdr.dwFlags)&1 == 0 {
		if time.Now().After(deadline) {
			fmt.Println("timeout waiting for DONE flag")
			break
		}
		runtime.Gosched()
		time.Sleep(1 * time.Millisecond)
	}
	fmoUnprepHdr.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	elapsed := time.Since(start).Round(time.Millisecond)
	if doneBefore15 {
		fmt.Printf("✅ DONE flag was set before 15s wait (driver buffered)\n")
	}
	fmt.Printf("✅ Complete in %v — check microKORG patches now\n", elapsed)
}
