//go:build ignore

package main

// go run dumpback.go
// Requests ALL DATA DUMP from microKORG (0x0E), saves to dump-received.syx
// Then compares against our custom library file

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
	wm2               = syscall.NewLazyDLL("winmm.dll")
	mo2Open           = wm2.NewProc("midiOutOpen")
	mo2Close          = wm2.NewProc("midiOutClose")
	mo2LongMsg        = wm2.NewProc("midiOutLongMsg")
	mo2PrepHdr        = wm2.NewProc("midiOutPrepareHeader")
	mo2UnprepHdr      = wm2.NewProc("midiOutUnprepareHeader")
	mi2Open           = wm2.NewProc("midiInOpen")
	mi2Close          = wm2.NewProc("midiInClose")
	mi2Start          = wm2.NewProc("midiInStart")
	mi2Stop           = wm2.NewProc("midiInStop")
	mi2AddBuffer      = wm2.NewProc("midiInAddBuffer")
	mi2PrepHdr        = wm2.NewProc("midiInPrepareHeader")
	mi2UnprepHdr      = wm2.NewProc("midiInUnprepareHeader")
)

type H2 struct {
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

var rx2Data []byte
var rx2Done uint32

var cb2 = syscall.NewCallback(func(h, msg, inst, p1, p2 uintptr) uintptr {
	const MIM_LONGDATA = 0x3C4
	if msg == MIM_LONGDATA {
		hdr := (*H2)(unsafe.Pointer(p1))
		if hdr.dwBytesRecorded > 0 {
			data := make([]byte, hdr.dwBytesRecorded)
			copy(data, (*[131072]byte)(unsafe.Pointer(hdr.lpData))[:hdr.dwBytesRecorded])
			rx2Data = append(rx2Data, data...)
			fmt.Printf("  chunk: %d bytes (total: %d)\n", hdr.dwBytesRecorded, len(rx2Data))
			// Check if we have a complete SysEx (ends with F7)
			if len(rx2Data) > 0 && rx2Data[len(rx2Data)-1] == 0xF7 {
				atomic.StoreUint32(&rx2Done, 1)
			}
		}
	}
	return 0
})

func send2(h uintptr, data []byte) error {
	buf := make([]byte, len(data))
	copy(buf, data)
	runtime.KeepAlive(buf)
	hdr := H2{lpData: uintptr(unsafe.Pointer(&buf[0])), dwBufferLength: uint32(len(buf))}
	mo2PrepHdr.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	r, _, _ := mo2LongMsg.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 {
		return fmt.Errorf("midiOutLongMsg: %d", r)
	}
	deadline := time.Now().Add(5 * time.Second)
	for atomic.LoadUint32(&hdr.dwFlags)&1 == 0 {
		if time.Now().After(deadline) {
			return fmt.Errorf("timeout")
		}
		runtime.Gosched()
		time.Sleep(1 * time.Millisecond)
	}
	mo2UnprepHdr.Call(h, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	return nil
}

func main() {
	// Open MIDI out
	var outH uintptr
	r, _, _ := mo2Open.Call(uintptr(unsafe.Pointer(&outH)), 2, 0, 0, 0)
	if r != 0 {
		fmt.Printf("midiOutOpen failed: %d\n", r)
		os.Exit(1)
	}
	defer mo2Close.Call(outH)
	fmt.Println("✅ MIDI out port 2")

	// Open MIDI in port 1 with large buffer for 36KB response
	var inH uintptr
	const CALLBACK_FUNCTION = 0x30000
	r, _, _ = mi2Open.Call(uintptr(unsafe.Pointer(&inH)), 1, cb2, 0, CALLBACK_FUNCTION)
	if r != 0 {
		fmt.Printf("midiInOpen failed: %d\n", r)
		os.Exit(1)
	}
	defer mi2Close.Call(inH)

	// Add a large buffer (64KB) — the response will be ~36KB
	rxBuf := make([]byte, 65536)
	runtime.KeepAlive(rxBuf)
	rxHdr := H2{lpData: uintptr(unsafe.Pointer(&rxBuf[0])), dwBufferLength: uint32(len(rxBuf))}
	mi2PrepHdr.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
	mi2AddBuffer.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
	mi2Start.Call(inH)
	fmt.Println("✅ MIDI in port 1")

	// microKORG S model ID is 00 01 40 (3 bytes), NOT 58 like regular microKORG
	// SysEx format: F0 42 3n 00 01 40 ff [data] F7
	fmt.Println("\nSending dump requests with microKORG S model ID (00 01 40)...")
	send2(outH, []byte{0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x0E, 0xF7}) // ALL DATA DUMP REQUEST
	time.Sleep(300 * time.Millisecond)
	send2(outH, []byte{0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x10, 0xF7}) // CURRENT PROGRAM DUMP REQUEST
	fmt.Println("Requests sent.")
	fmt.Println("\nAlso trigger manually: SHIFT + MIDI DATA DUMP on the device")
	fmt.Println("Listening for 30 seconds...")

	deadline := time.Now().Add(30 * time.Second)
	for time.Now().Before(deadline) {
		if atomic.LoadUint32(&rx2Done) != 0 {
			break
		}
		runtime.Gosched()
		time.Sleep(50 * time.Millisecond)
	}

	mi2Stop.Call(inH)
	mi2UnprepHdr.Call(inH, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))

	if len(rx2Data) == 0 {
		fmt.Println("❌ No data received")
		fmt.Println("   Try pressing [GLOBAL] + [WRITE/DUMP] on the microKORG to trigger dump manually")
		os.Exit(1)
	}

	fmt.Printf("\n✅ Received %d bytes\n", len(rx2Data))
	fmt.Printf("   Header: % X\n", rx2Data[:min3(5, len(rx2Data))])
	fmt.Printf("   Last byte: %02X\n", rx2Data[len(rx2Data)-1])

	// Save received dump
	outFile := "dump-received.syx"
	os.WriteFile(outFile, rx2Data, 0644)
	fmt.Printf("   Saved to %s\n\n", outFile)

	// Compare against our library
	entries, _ := os.ReadDir("../patches")
	libraryFile := ""
	for _, e := range entries {
		n := e.Name()
		if !e.IsDir() && len(n) > 15 && n[:15] == "custom-library-" {
			libraryFile = "../patches/" + n
		}
	}
	if libraryFile == "" {
		fmt.Println("No library file to compare against")
		return
	}

	sent, _ := os.ReadFile(libraryFile)
	fmt.Printf("Sent:     %d bytes\n", len(sent))
	fmt.Printf("Received: %d bytes\n", len(rx2Data))

	minLen := len(sent)
	if len(rx2Data) < minLen {
		minLen = len(rx2Data)
	}

	mismatches := 0
	for i := 0; i < minLen; i++ {
		if sent[i] != rx2Data[i] {
			if mismatches < 5 {
				fmt.Printf("  byte %d: sent %02X got %02X\n", i, sent[i], rx2Data[i])
			}
			mismatches++
		}
	}

	fmt.Printf("\nMismatches: %d / %d bytes\n", mismatches, minLen)
	if mismatches == 0 && len(sent) == len(rx2Data) {
		fmt.Println("✅ PERFECT MATCH — patches loaded correctly!")
	} else if mismatches < 100 {
		fmt.Println("⚠️  Minor differences (may be normal for timestamps/global settings)")
	} else {
		fmt.Println("❌ Significant differences — patches may not have loaded")
	}
}

func min3(a, b int) int {
	if a < b {
		return a
	}
	return b
}
