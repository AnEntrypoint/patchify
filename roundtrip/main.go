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
	midiOutGetNumDevs      = winmm.NewProc("midiOutGetNumDevs")

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

var (
	rxData    []byte
	rxDone    uint32
	rxPort    int
	anyRx     uint32
)

// One callback handles all ports; dwInstance carries port index
var midiInCb uintptr

func init() {
	midiInCb = syscall.NewCallback(func(hMidiIn, wMsg, dwInstance, dwParam1, dwParam2 uintptr) uintptr {
		const (
			MIM_DATA     = 0x3C3
			MIM_LONGDATA = 0x3C4
		)
		port := int(dwInstance)
		switch wMsg {
		case MIM_DATA:
			atomic.StoreUint32(&anyRx, 1)
			fmt.Printf("\n[port %d] short MIDI: %08X\n", port, dwParam1)
		case MIM_LONGDATA:
			hdr := (*MIDIHDR)(unsafe.Pointer(dwParam1))
			if hdr.dwBytesRecorded > 0 {
				data := make([]byte, hdr.dwBytesRecorded)
				copy(data, (*[65536]byte)(unsafe.Pointer(hdr.lpData))[:hdr.dwBytesRecorded])
				fmt.Printf("\n[port %d] SysEx received: %d bytes\n", port, len(data))
				rxData = data
				rxPort = port
				atomic.StoreUint32(&rxDone, 1)
				atomic.StoreUint32(&anyRx, 1)
			}
		}
		return 0
	})
}

type inPort struct {
	handle uintptr
	buf    []byte
	hdr    MIDIHDR
}

func openInPort(port uintptr) (*inPort, error) {
	p := &inPort{}
	const CALLBACK_FUNCTION = 0x30000
	r, _, _ := midiInOpen.Call(
		uintptr(unsafe.Pointer(&p.handle)),
		port,
		midiInCb,
		port, // dwInstance = port number for identification
		CALLBACK_FUNCTION,
	)
	if r != 0 {
		return nil, fmt.Errorf("midiInOpen(%d): %d", port, r)
	}
	p.buf = make([]byte, 8192)
	runtime.KeepAlive(p.buf)
	p.hdr = MIDIHDR{
		lpData:         uintptr(unsafe.Pointer(&p.buf[0])),
		dwBufferLength: uint32(len(p.buf)),
	}
	midiInPrepareHeader.Call(p.handle, uintptr(unsafe.Pointer(&p.hdr)), unsafe.Sizeof(p.hdr))
	midiInAddBuffer.Call(p.handle, uintptr(unsafe.Pointer(&p.hdr)), unsafe.Sizeof(p.hdr))
	midiInStart.Call(p.handle)
	return p, nil
}

func (p *inPort) close() {
	midiInStop.Call(p.handle)
	midiInUnprepareHeader.Call(p.handle, uintptr(unsafe.Pointer(&p.hdr)), unsafe.Sizeof(p.hdr))
	midiInClose.Call(p.handle)
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
		if i+1 >= len(data) {
			break
		}
		end := i + 8
		if end > len(data) {
			end = len(data)
		}
		chunk := data[i:end]
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
		if atomic.LoadUint32(&hdr.dwFlags)&1 != 0 {
			break
		}
		if time.Now().After(deadline) {
			return fmt.Errorf("timeout waiting for send")
		}
		runtime.Gosched()
		time.Sleep(1 * time.Millisecond)
	}
	midiOutUnprepareHeader.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	return nil
}

func main() {
	nOut, _, _ := midiOutGetNumDevs.Call()
	nIn, _, _ := midiInGetNumDevs.Call()
	fmt.Printf("MIDI out devices: %d  |  MIDI in devices: %d\n\n", nOut, nIn)

	// Open MIDI out port 2
	var outHandle uintptr
	r, _, _ := midiOutOpen.Call(uintptr(unsafe.Pointer(&outHandle)), 2, 0, 0, 0)
	if r != 0 {
		fmt.Printf("ERROR: midiOutOpen(2) failed: %d\n", r)
		os.Exit(1)
	}
	defer midiOutClose.Call(outHandle)
	fmt.Println("✅ MIDI out port 2 open")

	// Open ALL available MIDI in ports
	var ports []*inPort
	for i := uintptr(0); i < nIn; i++ {
		p, err := openInPort(i)
		if err != nil {
			fmt.Printf("   MIDI in port %d: FAILED (%v)\n", i, err)
		} else {
			fmt.Printf("✅ MIDI in port %d open\n", i)
			ports = append(ports, p)
		}
	}
	defer func() {
		for _, p := range ports {
			p.close()
		}
	}()

	if len(ports) == 0 {
		fmt.Println("ERROR: No MIDI in ports available")
		os.Exit(1)
	}

	// Load patch 0 from library
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

	const patchStart = 5
	const patchSize = 254
	patchData := data[patchStart : patchStart+patchSize]

	nonZero := 0
	for _, b := range patchData {
		if b != 0 {
			nonZero++
		}
	}
	encoded := encode7bit(patchData)
	fmt.Printf("\nPatch 0: %d non-zero bytes, encoded to %d bytes\n\n", nonZero, len(encoded))

	// Step 1: Send 0x40 (load to current)
	fmt.Print("Step 1: 0x40 load... ")
	msg40 := append([]byte{0xF0, 0x42, 0x30, 0x58, 0x40}, append(encoded, 0xF7)...)
	if err := sendSysEx(outHandle, msg40); err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅")
	time.Sleep(200 * time.Millisecond)

	// Step 2: Send 0x11 (write to slot 0)
	fmt.Print("Step 2: 0x11 write to slot 0... ")
	msg11 := []byte{0xF0, 0x42, 0x30, 0x58, 0x11, 0x00, 0x00, 0xF7}
	if err := sendSysEx(outHandle, msg11); err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅")
	time.Sleep(500 * time.Millisecond)

	// Step 3: Request dump (0x10)
	fmt.Print("Step 3: 0x10 dump request... ")
	msg10 := []byte{0xF0, 0x42, 0x30, 0x58, 0x10, 0xF7}
	if err := sendSysEx(outHandle, msg10); err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ — waiting for response...")

	// Wait up to 8 seconds
	deadline := time.Now().Add(8 * time.Second)
	for {
		if atomic.LoadUint32(&rxDone) != 0 {
			break
		}
		if time.Now().After(deadline) {
			if atomic.LoadUint32(&anyRx) != 0 {
				fmt.Println("\n⚠️  Got some MIDI data but no SysEx response")
			} else {
				fmt.Println("\n❌ Timeout: no MIDI data received on any port")
				fmt.Println("   Possible causes:")
				fmt.Println("   - microKORG SysEx Rx disabled (check Global settings)")
				fmt.Println("   - Wrong MIDI channel (currently using channel 1 = 0x30)")
				fmt.Println("   - MIDI cable from microKORG OUT not connected")
			}
			os.Exit(1)
		}
		runtime.Gosched()
		time.Sleep(10 * time.Millisecond)
	}

	// Decode and compare
	fmt.Printf("\n✅ Response on MIDI in port %d: %d bytes\n", rxPort, len(rxData))
	if len(rxData) < 6 {
		fmt.Println("❌ Response too short to parse")
		os.Exit(1)
	}
	fmt.Printf("   Header: % X\n", rxData[:5])

	rxPayload := rxData[5 : len(rxData)-1]
	decoded := decode7bit(rxPayload)
	fmt.Printf("   Payload decoded: %d bytes\n\n", len(decoded))

	rxNonZero := 0
	for _, b := range decoded {
		if b != 0 {
			rxNonZero++
		}
	}

	minLen := len(decoded)
	if len(patchData) < minLen {
		minLen = len(patchData)
	}
	mismatches := 0
	for i := 0; i < minLen; i++ {
		if patchData[i] != decoded[i] {
			if mismatches < 5 {
				fmt.Printf("   byte %3d: sent 0x%02X  got 0x%02X\n", i, patchData[i], decoded[i])
			}
			mismatches++
		}
	}

	fmt.Printf("Sent non-zero: %d\n", nonZero)
	fmt.Printf("Recv non-zero: %d\n", rxNonZero)
	fmt.Printf("Mismatches:    %d / %d\n\n", mismatches, minLen)

	if mismatches == 0 && len(decoded) == patchSize {
		fmt.Println("✅ ROUNDTRIP MATCH — patch sent and received correctly!")
	} else if rxNonZero > 0 {
		fmt.Println("⚠️  Got non-zero data back but mismatches exist — check encoding")
	} else {
		fmt.Println("❌ Received all zeros — patch data not written correctly")
	}
}
