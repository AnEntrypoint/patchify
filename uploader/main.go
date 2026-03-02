package main

import (
	"fmt"
	"os"
	"syscall"
	"time"
	"unsafe"
)

var (
	winmm           = syscall.NewLazyDLL("winmm.dll")
	midiOutGetNumDevs = winmm.NewProc("midiOutGetNumDevs")
	midiOutGetDevCapsW = winmm.NewProc("midiOutGetDevCapsW")
	midiOutOpen     = winmm.NewProc("midiOutOpen")
	midiOutClose    = winmm.NewProc("midiOutClose")
	midiOutLongMsg  = winmm.NewProc("midiOutLongMsg")
	midiOutPrepareHeader = winmm.NewProc("midiOutPrepareHeader")
	midiOutUnprepareHeader = winmm.NewProc("midiOutUnprepareHeader")
)

type MIDIOUTCAPS struct {
	wMid           uint16
	wPid           uint16
	vDriverVersion uint32
	szPname        [32]uint16
	wTechnology    uint16
	wVoices        uint16
	wNotes         uint16
	wChannelMask   uint16
	dwSupport      uint32
}

type MIDIHDR struct {
	lpData          uintptr
	dwBufferLength  uint32
	dwBytesRecorded uint32
	dwUser          uintptr
	dwFlags         uint32
	lpNext          uintptr
	reserved        uintptr
	dwOffset        uint32
	dwReserved      [4]uintptr
}

func listMidiOutPorts() {
	n, _, _ := midiOutGetNumDevs.Call()
	fmt.Printf("MIDI output ports (%d):\n", n)
	for i := uintptr(0); i < n; i++ {
		var caps MIDIOUTCAPS
		midiOutGetDevCapsW.Call(i, uintptr(unsafe.Pointer(&caps)), unsafe.Sizeof(caps))
		name := syscall.UTF16ToString(caps.szPname[:])
		fmt.Printf("  %d: %s\n", i, name)
	}
}

func findFocusritePort() int {
	n, _, _ := midiOutGetNumDevs.Call()
	for i := uintptr(0); i < n; i++ {
		var caps MIDIOUTCAPS
		midiOutGetDevCapsW.Call(i, uintptr(unsafe.Pointer(&caps)), unsafe.Sizeof(caps))
		name := syscall.UTF16ToString(caps.szPname[:])
		for _, keyword := range []string{"Focusrite", "microKORG", "KORG"} {
			for j := 0; j+len(keyword) <= len(name); j++ {
				if name[j:j+len(keyword)] == keyword {
					return int(i)
				}
			}
		}
	}
	return -1
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
		if len(group) < 7 {
			result = append(result, 0)
		}
	}
	return result
}

func sendSysEx(handle uintptr, data []byte) error {
	buf := make([]byte, len(data))
	copy(buf, data)

	hdr := MIDIHDR{
		lpData:         uintptr(unsafe.Pointer(&buf[0])),
		dwBufferLength: uint32(len(buf)),
	}

	r, _, _ := midiOutPrepareHeader.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 {
		return fmt.Errorf("midiOutPrepareHeader failed: %d", r)
	}

	r, _, _ = midiOutLongMsg.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 {
		return fmt.Errorf("midiOutLongMsg failed: %d", r)
	}

	// Wait for send to complete
	for {
		if hdr.dwFlags&0x00000001 != 0 { // MHDR_DONE
			break
		}
		time.Sleep(1 * time.Millisecond)
	}

	midiOutUnprepareHeader.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	return nil
}

func main() {
	fmt.Println("=== microKORG Patch Uploader (Go) ===")
	fmt.Println()

	listMidiOutPorts()
	fmt.Println()

	port := findFocusritePort()
	if port < 0 {
		fmt.Println("ERROR: Focusrite not found")
		os.Exit(1)
	}
	fmt.Printf("Using port %d\n\n", port)

	// Open MIDI out
	var handle uintptr
	r, _, _ := midiOutOpen.Call(
		uintptr(unsafe.Pointer(&handle)),
		uintptr(port),
		0, 0, 0,
	)
	if r != 0 {
		fmt.Printf("ERROR: midiOutOpen failed: %d\n", r)
		os.Exit(1)
	}
	defer midiOutClose.Call(handle)

	// Find library file
	libraryFile := ""
	entries, _ := os.ReadDir("patches")
	for _, e := range entries {
		if !e.IsDir() && len(e.Name()) > 15 && e.Name()[:15] == "custom-library-" {
			libraryFile = "patches/" + e.Name()
		}
	}
	if libraryFile == "" {
		fmt.Println("ERROR: No custom-library-*.syx found in patches/")
		os.Exit(1)
	}
	fmt.Printf("Library: %s\n\n", libraryFile)

	data, err := os.ReadFile(libraryFile)
	if err != nil {
		fmt.Printf("ERROR reading file: %v\n", err)
		os.Exit(1)
	}

	const patchStart = 5
	const patchSize = 254
	const totalPatches = 256

	fmt.Printf("Uploading %d patches...\n\n", totalPatches)

	success := 0
	for i := 0; i < totalPatches; i++ {
		offset := patchStart + i*patchSize
		patchData := data[offset : offset+patchSize]

		encoded := encode7bit(patchData)

		// F0 42 30 58 40 [7-bit data] F7
		sysex := make([]byte, 0, 5+len(encoded)+1)
		sysex = append(sysex, 0xF0, 0x42, 0x30, 0x58, 0x40)
		sysex = append(sysex, encoded...)
		sysex = append(sysex, 0xF7)

		err := sendSysEx(handle, sysex)
		if err != nil {
			fmt.Printf("✗")
		} else {
			fmt.Printf(".")
			success++
		}

		if (i+1)%32 == 0 {
			fmt.Printf(" [%d/%d]\n", i+1, totalPatches)
		}

		time.Sleep(300 * time.Millisecond)
	}

	fmt.Printf("\n\nDone: %d/%d patches uploaded\n", success, totalPatches)
	if success == totalPatches {
		fmt.Println("✅ All patches uploaded successfully!")
	}
}
