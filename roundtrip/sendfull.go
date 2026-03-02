//go:build ignore

package main

// go run sendfull.go
// Sends the entire custom-library SysEx file as a single ALL DATA DUMP (0x50)

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
	wm                  = syscall.NewLazyDLL("winmm.dll")
	_midiOutOpen        = wm.NewProc("midiOutOpen")
	_midiOutClose       = wm.NewProc("midiOutClose")
	_midiOutLongMsg     = wm.NewProc("midiOutLongMsg")
	_midiOutPrepHdr     = wm.NewProc("midiOutPrepareHeader")
	_midiOutUnprepHdr   = wm.NewProc("midiOutUnprepareHeader")
	_midiInOpen         = wm.NewProc("midiInOpen")
	_midiInClose        = wm.NewProc("midiInClose")
	_midiInStart        = wm.NewProc("midiInStart")
	_midiInStop         = wm.NewProc("midiInStop")
	_midiInAddBuffer    = wm.NewProc("midiInAddBuffer")
	_midiInPrepHdr      = wm.NewProc("midiInPrepareHeader")
	_midiInUnprepHdr    = wm.NewProc("midiInUnprepareHeader")
)

type HDR struct {
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

var anyMsg uint32

var cb = syscall.NewCallback(func(h, msg, inst, p1, p2 uintptr) uintptr {
	const (
		MIM_DATA     = 0x3C3
		MIM_LONGDATA = 0x3C4
	)
	atomic.StoreUint32(&anyMsg, 1)
	if msg == MIM_DATA {
		fmt.Printf("  MIDI: %08X\n", p1)
	} else if msg == MIM_LONGDATA {
		hdr := (*HDR)(unsafe.Pointer(p1))
		fmt.Printf("  SysEx response: %d bytes\n", hdr.dwBytesRecorded)
	}
	return 0
})

func sendLong(h uintptr, data []byte) error {
	buf := make([]byte, len(data))
	copy(buf, data)
	runtime.KeepAlive(buf)
	hdr := HDR{lpData: uintptr(unsafe.Pointer(&buf[0])), dwBufferLength: uint32(len(buf))}
	_midiOutPrepHdr.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	r, _, _ := _midiOutLongMsg.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 {
		return fmt.Errorf("midiOutLongMsg: %d", r)
	}
	deadline := time.Now().Add(30 * time.Second)
	for atomic.LoadUint32(&hdr.dwFlags)&1 == 0 {
		if time.Now().After(deadline) {
			return fmt.Errorf("timeout sending")
		}
		runtime.Gosched()
		time.Sleep(1 * time.Millisecond)
	}
	_midiOutUnprepHdr.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	return nil
}

func main() {
	// Find library file
	entries, _ := os.ReadDir("../patches")
	libraryFile := ""
	for _, e := range entries {
		n := e.Name()
		if !e.IsDir() && len(n) > 15 && n[:15] == "custom-library-" {
			libraryFile = "../patches/" + n
		}
	}
	if libraryFile == "" {
		fmt.Println("ERROR: No custom-library-*.syx in patches/")
		os.Exit(1)
	}

	data, err := os.ReadFile(libraryFile)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Library: %s (%d bytes)\n", libraryFile, len(data))
	fmt.Printf("Header: % X\n", data[:5])
	fmt.Printf("Ends with F7: %v\n\n", data[len(data)-1] == 0xF7)

	if data[0] != 0xF0 || data[len(data)-1] != 0xF7 {
		fmt.Println("ERROR: File is not a valid SysEx message")
		os.Exit(1)
	}

	// Open MIDI out port 2
	var outH uintptr
	r, _, _ := _midiOutOpen.Call(uintptr(unsafe.Pointer(&outH)), 2, 0, 0, 0)
	if r != 0 {
		fmt.Printf("ERROR: midiOutOpen failed: %d\n", r)
		os.Exit(1)
	}
	defer _midiOutClose.Call(outH)
	fmt.Println("✅ MIDI out port 2 open")

	// Open MIDI in port 1 for monitoring
	var inH uintptr
	const CALLBACK_FUNCTION = 0x30000
	r, _, _ = _midiInOpen.Call(uintptr(unsafe.Pointer(&inH)), 1, cb, 0, CALLBACK_FUNCTION)
	if r == 0 {
		rxBuf := make([]byte, 65536)
		runtime.KeepAlive(rxBuf)
		rxHdr := HDR{lpData: uintptr(unsafe.Pointer(&rxBuf[0])), dwBufferLength: uint32(len(rxBuf))}
		_midiInPrepHdr.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
		_midiInAddBuffer.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
		_midiInStart.Call(inH)
		defer func() {
			_midiInStop.Call(inH)
			_midiInUnprepHdr.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
			_midiInClose.Call(inH)
		}()
		fmt.Println("✅ MIDI in port 1 open (monitoring)")
	} else {
		fmt.Println("⚠️  MIDI in port 1 unavailable (continuing without monitor)")
	}

	fmt.Printf("\nSending ALL DATA DUMP (%d bytes)...\n", len(data))
	fmt.Println("Watch microKORG for loading spinner...")

	start := time.Now()
	if err := sendLong(outH, data); err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✅ Sent in %v\n", time.Since(start).Round(time.Millisecond))

	// Wait a moment for any response
	fmt.Println("Waiting 3s for any response...")
	time.Sleep(3 * time.Second)

	if atomic.LoadUint32(&anyMsg) != 0 {
		fmt.Println("✅ Got response from microKORG")
	} else {
		fmt.Println("(No response — normal for ALL DATA DUMP)")
	}
	fmt.Println("\nDone. Check microKORG for loaded patches.")
}
