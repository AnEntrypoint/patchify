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

	midiInOpen            = winmm.NewProc("midiInOpen")
	midiInClose           = winmm.NewProc("midiInClose")
	midiInStart           = winmm.NewProc("midiInStart")
	midiInStop            = winmm.NewProc("midiInStop")
	midiInAddBuffer       = winmm.NewProc("midiInAddBuffer")
	midiInPrepareHeader   = winmm.NewProc("midiInPrepareHeader")
	midiInUnprepareHeader = winmm.NewProc("midiInUnprepareHeader")
	midiInGetNumDevs      = winmm.NewProc("midiInGetNumDevs")
)

type MIDIHDR struct {
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

// Global receive state
var (
	rxData []byte
	rxDone uint32
)

var midiInCb uintptr

func init() {
	midiInCb = syscall.NewCallback(func(hMidiIn, wMsg, dwInstance, dwParam1, dwParam2 uintptr) uintptr {
		const MIM_LONGDATA = 0x3C4
		if wMsg == MIM_LONGDATA {
			hdr := (*MIDIHDR)(unsafe.Pointer(dwParam1))
			if hdr.dwBytesRecorded > 0 {
				data := make([]byte, hdr.dwBytesRecorded)
				copy(data, (*[65536]byte)(unsafe.Pointer(hdr.lpData))[:hdr.dwBytesRecorded])
				rxData = data
				atomic.StoreUint32(&rxDone, 1)
			}
		}
		return 0
	})
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
	}
	return result
}

func decode7bit(data []byte) []byte {
	var result []byte
	for i := 0; i < len(data); i += 8 {
		end := i + 8
		if end > len(data) {
			end = len(data)
		}
		chunk := data[i:end]
		if len(chunk) < 2 {
			break
		}
		msbs := chunk[0]
		for j, b := range chunk[1:] {
			restored := b
			if msbs&(1<<uint(j)) != 0 {
				restored |= 0x80
			}
			result = append(result, restored)
		}
	}
	return result
}

func sendSysEx(handle uintptr, data []byte) error {
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
	outPort := uintptr(2)
	inPort := uintptr(2)

	if len(os.Args) > 1 {
		var p int
		fmt.Sscanf(os.Args[1], "%d", &p)
		outPort = uintptr(p)
		inPort = uintptr(p)
	}
	if len(os.Args) > 2 {
		var p int
		fmt.Sscanf(os.Args[2], "%d", &p)
		inPort = uintptr(p)
	}

	// List MIDI in devices
	nIn, _, _ := midiInGetNumDevs.Call()
	fmt.Printf("MIDI in devices: %d\n", nIn)

	fmt.Printf("Opening MIDI out port %d, in port %d\n\n", outPort, inPort)

	// Open MIDI out
	var outHandle uintptr
	r, _, _ := midiOutOpen.Call(uintptr(unsafe.Pointer(&outHandle)), outPort, 0, 0, 0)
	if r != 0 {
		fmt.Printf("ERROR: midiOutOpen(%d) failed: %d\n", outPort, r)
		os.Exit(1)
	}
	defer midiOutClose.Call(outHandle)
	fmt.Printf("✅ MIDI out port %d open\n", outPort)

	// Open MIDI in with callback
	var inHandle uintptr
	const CALLBACK_FUNCTION = 0x30000
	r, _, _ = midiInOpen.Call(uintptr(unsafe.Pointer(&inHandle)), inPort, midiInCb, 0, CALLBACK_FUNCTION)
	if r != 0 {
		fmt.Printf("ERROR: midiInOpen(%d) failed: %d\n", inPort, r)
		fmt.Println("Try: ./roundtrip.exe 2 1  (out=2 in=1)")
		os.Exit(1)
	}
	defer midiInClose.Call(inHandle)
	fmt.Printf("✅ MIDI in port %d open\n\n", inPort)

	// Add a receive buffer for SysEx (large enough for a patch response)
	rxBuf := make([]byte, 4096)
	runtime.KeepAlive(rxBuf)
	rxHdr := MIDIHDR{
		lpData:         uintptr(unsafe.Pointer(&rxBuf[0])),
		dwBufferLength: uint32(len(rxBuf)),
	}
	midiInPrepareHeader.Call(inHandle, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
	midiInAddBuffer.Call(inHandle, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
	midiInStart.Call(inHandle)

	// Load test patch from file
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
	fmt.Printf("Library: %s\n\n", libraryFile)

	data, err := os.ReadFile(libraryFile)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}

	const patchStart = 5
	const patchSize = 254
	patchData := data[patchStart : patchStart+patchSize]

	// Count non-zero bytes in what we're sending
	nonZero := 0
	for _, b := range patchData {
		if b != 0 {
			nonZero++
		}
	}
	fmt.Printf("Patch 0 non-zero bytes: %d / %d\n\n", nonZero, patchSize)

	encoded := encode7bit(patchData)
	fmt.Printf("Encoded size: %d bytes\n\n", len(encoded))

	// Step 1: Send patch data (0x40)
	fmt.Println("Step 1: Sending 0x40 (load to current)...")
	sysex := make([]byte, 0, 5+len(encoded)+1)
	sysex = append(sysex, 0xF0, 0x42, 0x30, 0x58, 0x40)
	sysex = append(sysex, encoded...)
	sysex = append(sysex, 0xF7)

	if err := sendSysEx(outHandle, sysex); err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("  ✅ Sent")
	time.Sleep(100 * time.Millisecond)

	// Step 2: Write to slot 0 (0x11)
	fmt.Println("Step 2: Sending 0x11 (write to slot 0)...")
	writeReq := []byte{0xF0, 0x42, 0x30, 0x58, 0x11, 0x00, 0x00, 0xF7}
	if err := sendSysEx(outHandle, writeReq); err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("  ✅ Sent")
	time.Sleep(200 * time.Millisecond)

	// Step 3: Request dump of current program (0x10)
	fmt.Println("Step 3: Sending 0x10 (dump request)...")
	dumpReq := []byte{0xF0, 0x42, 0x30, 0x58, 0x10, 0xF7}
	if err := sendSysEx(outHandle, dumpReq); err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("  ✅ Sent — waiting for response...")

	// Wait for response
	deadline := time.Now().Add(5 * time.Second)
	for {
		if atomic.LoadUint32(&rxDone) != 0 {
			break
		}
		if time.Now().After(deadline) {
			fmt.Println("\n❌ Timeout: no response from microKORG")
			fmt.Println("   Check: SysEx enabled on microKORG? Correct MIDI in port?")
			midiInStop.Call(inHandle)
			midiInUnprepareHeader.Call(inHandle, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))
			os.Exit(1)
		}
		runtime.Gosched()
		time.Sleep(10 * time.Millisecond)
	}

	midiInStop.Call(inHandle)
	midiInUnprepareHeader.Call(inHandle, uintptr(unsafe.Pointer(&rxHdr)), unsafe.Sizeof(rxHdr))

	fmt.Printf("\n✅ Got response: %d bytes\n", len(rxData))
	fmt.Printf("   Header: %02X %02X %02X %02X %02X\n",
		rxData[0], rxData[1], rxData[2], rxData[3], rxData[4])

	// Decode response (strip 5-byte header + 1-byte end)
	if len(rxData) < 7 {
		fmt.Println("❌ Response too short")
		os.Exit(1)
	}
	rxPayload := rxData[5 : len(rxData)-1]
	decoded := decode7bit(rxPayload)

	fmt.Printf("   Decoded: %d bytes\n\n", len(decoded))

	// Compare
	minLen := len(decoded)
	if len(patchData) < minLen {
		minLen = len(patchData)
	}

	mismatches := 0
	for i := 0; i < minLen; i++ {
		if patchData[i] != decoded[i] {
			if mismatches < 10 {
				fmt.Printf("   MISMATCH byte %d: sent 0x%02X got 0x%02X\n", i, patchData[i], decoded[i])
			}
			mismatches++
		}
	}

	rxNonZero := 0
	for _, b := range decoded {
		if b != 0 {
			rxNonZero++
		}
	}

	fmt.Printf("Sent non-zero: %d\n", nonZero)
	fmt.Printf("Recv non-zero: %d\n", rxNonZero)
	fmt.Printf("Mismatches:    %d / %d\n\n", mismatches, minLen)

	if mismatches == 0 {
		fmt.Println("✅ ROUNDTRIP MATCH — patch data survived send/receive!")
	} else {
		fmt.Println("❌ MISMATCH — data does not match")
	}
}
