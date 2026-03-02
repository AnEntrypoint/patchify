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
	winmm                  = syscall.NewLazyDLL("winmm.dll")
	midiOutOpen            = winmm.NewProc("midiOutOpen")
	midiOutClose           = winmm.NewProc("midiOutClose")
	midiOutLongMsg         = winmm.NewProc("midiOutLongMsg")
	midiOutPrepareHeader   = winmm.NewProc("midiOutPrepareHeader")
	midiOutUnprepareHeader = winmm.NewProc("midiOutUnprepareHeader")
)

// MIDIHDR layout must exactly match Windows 64-bit struct
type MIDIHDR struct {
	lpData          uintptr
	dwBufferLength  uint32
	dwBytesRecorded uint32
	dwUser          uintptr
	dwFlags         uint32
	_               uint32 // padding
	lpNext          uintptr
	reserved        uintptr
	dwOffset        uint32
	_               uint32 // padding
	dwReserved      [4]uintptr
}

func encode7bit(data []byte) []byte {
	var result []byte
	for i := 0; i < len(data); i += 7 {
		end := i + 7
		if end > len(data) {
			end = len(data)
		}
		group := data[i:end]
		var msbs byte
		for j, b := range group {
			if b&0x80 != 0 {
				msbs |= 1 << j
			}
		}
		result = append(result, msbs&0x7F)
		for _, b := range group {
			result = append(result, b&0x7F)
		}
		// No padding - incomplete last group stays as-is
	}
	return result
}

func sendSysEx(handle uintptr, data []byte) error {
	// Pin buf so GC doesn't move it while winmm holds a pointer
	buf := make([]byte, len(data))
	copy(buf, data)
	runtime.KeepAlive(buf)

	hdr := MIDIHDR{
		lpData:         uintptr(unsafe.Pointer(&buf[0])),
		dwBufferLength: uint32(len(buf)),
	}

	r, _, _ := midiOutPrepareHeader.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 {
		return fmt.Errorf("midiOutPrepareHeader: %d", r)
	}

	r, _, _ = midiOutLongMsg.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 {
		midiOutUnprepareHeader.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
		return fmt.Errorf("midiOutLongMsg: %d", r)
	}

	// Wait for MHDR_DONE (bit 0) with timeout
	deadline := time.Now().Add(10 * time.Second)
	for {
		flags := atomic.LoadUint32(&hdr.dwFlags)
		if flags&0x00000001 != 0 {
			break
		}
		if time.Now().After(deadline) {
			return fmt.Errorf("timeout waiting for send completion")
		}
		runtime.Gosched()
		time.Sleep(1 * time.Millisecond)
	}

	midiOutUnprepareHeader.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	return nil
}

func main() {
	// Default port 2, override with first arg
	port := uintptr(2)
	if len(os.Args) > 1 {
		var p int
		fmt.Sscanf(os.Args[1], "%d", &p)
		port = uintptr(p)
	}

	fmt.Println("=== microKORG Patch Uploader ===")
	fmt.Printf("Opening MIDI port %d directly...\n\n", port)

	var handle uintptr
	r, _, _ := midiOutOpen.Call(
		uintptr(unsafe.Pointer(&handle)),
		port,
		0, 0, 0,
	)
	if r != 0 {
		fmt.Printf("ERROR: midiOutOpen(port %d) failed: %d\n", port, r)
		fmt.Println("Try a different port: ./uploader.exe 1  or  ./uploader.exe 3")
		os.Exit(1)
	}
	defer midiOutClose.Call(handle)
	fmt.Printf("✅ Opened port %d\n\n", port)

	// Find library file
	libraryFile := ""
	entries, _ := os.ReadDir("patches")
	for _, e := range entries {
		n := e.Name()
		if !e.IsDir() && len(n) > 15 && n[:15] == "custom-library-" {
			libraryFile = "patches/" + n
		}
	}
	if libraryFile == "" {
		fmt.Println("ERROR: No custom-library-*.syx in patches/")
		os.Exit(1)
	}
	fmt.Printf("Library: %s\n\n", libraryFile)

	data, err := os.ReadFile(libraryFile)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}

	const patchStart = 5
	const patchSize = 254
	// Calculate actual patch count from file size
	totalPatches := (len(data) - patchStart) / patchSize
	if totalPatches > 128 {
		totalPatches = 128
	}

	fmt.Printf("Uploading %d patches (0x40 load + 0x11 write, two-step)...\n\n", totalPatches)

	success := 0
	for i := 0; i < totalPatches; i++ {
		offset := patchStart + i*patchSize
		patchData := data[offset : offset+patchSize]
		encoded := encode7bit(patchData)

		// Step 1: Load patch data into working memory (0x40)
		sysex := make([]byte, 0, 5+len(encoded)+1)
		sysex = append(sysex, 0xF0, 0x42, 0x30, 0x58, 0x40)
		sysex = append(sysex, encoded...)
		sysex = append(sysex, 0xF7)

		if err := sendSysEx(handle, sysex); err != nil {
			fmt.Printf("✗")
			if (i+1)%32 == 0 {
				fmt.Printf(" [%d/%d]\n", i+1, totalPatches)
			}
			time.Sleep(300 * time.Millisecond)
			continue
		}

		time.Sleep(100 * time.Millisecond)

		// Step 2: Write to bank slot (0x11) - address = patch index (0-127)
		writeReq := []byte{0xF0, 0x42, 0x30, 0x58, 0x11, 0x00, byte(i), 0xF7}
		if err := sendSysEx(handle, writeReq); err != nil {
			fmt.Printf("✗")
		} else {
			fmt.Printf(".")
			success++
		}

		if (i+1)%32 == 0 {
			fmt.Printf(" [%d/%d]\n", i+1, totalPatches)
		}

		time.Sleep(200 * time.Millisecond)
	}

	fmt.Printf("\n\nResult: %d/%d patches uploaded\n", success, totalPatches)
	if success == totalPatches {
		fmt.Println("✅ All patches sent!")
	}
}
