//go:build ignore

package main

// Run with: go run dumponly.go
// Tests JUST the dump request without sending any patch data first

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
	winmm2                  = syscall.NewLazyDLL("winmm.dll")
	midiOutOpen2            = winmm2.NewProc("midiOutOpen")
	midiOutClose2           = winmm2.NewProc("midiOutClose")
	midiOutLongMsg2         = winmm2.NewProc("midiOutLongMsg")
	midiOutPrepareHeader2   = winmm2.NewProc("midiOutPrepareHeader")
	midiOutUnprepareHeader2 = winmm2.NewProc("midiOutUnprepareHeader")
	midiInOpen2             = winmm2.NewProc("midiInOpen")
	midiInClose2            = winmm2.NewProc("midiInClose")
	midiInStart2            = winmm2.NewProc("midiInStart")
	midiInStop2             = winmm2.NewProc("midiInStop")
	midiInAddBuffer2        = winmm2.NewProc("midiInAddBuffer")
	midiInPrepareHeader2    = winmm2.NewProc("midiInPrepareHeader")
	midiInUnprepareHeader2  = winmm2.NewProc("midiInUnprepareHeader")
)

type MIDIHDR2 struct {
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

var rx2Done uint32
var rx2Data []byte

var cb2 = syscall.NewCallback(func(hMidiIn, wMsg, dwInstance, dwParam1, dwParam2 uintptr) uintptr {
	const (
		MIM_DATA     = 0x3C3
		MIM_LONGDATA = 0x3C4
	)
	switch wMsg {
	case MIM_DATA:
		fmt.Printf("  short msg: %08X\n", dwParam1)
	case MIM_LONGDATA:
		hdr := (*MIDIHDR2)(unsafe.Pointer(dwParam1))
		if hdr.dwBytesRecorded > 0 {
			data := make([]byte, hdr.dwBytesRecorded)
			copy(data, (*[65536]byte)(unsafe.Pointer(hdr.lpData))[:hdr.dwBytesRecorded])
			fmt.Printf("  SysEx: %d bytes — % X\n", len(data), data[:min2(len(data), 12)])
			rx2Data = data
			atomic.StoreUint32(&rx2Done, 1)
		}
	}
	return 0
})

func min2(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func sendMsg(handle uintptr, data []byte) error {
	buf := make([]byte, len(data))
	copy(buf, data)
	runtime.KeepAlive(buf)
	hdr := MIDIHDR2{lpData: uintptr(unsafe.Pointer(&buf[0])), dwBufferLength: uint32(len(buf))}
	midiOutPrepareHeader2.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	r, _, _ := midiOutLongMsg2.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
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
	midiOutUnprepareHeader2.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	return nil
}

func main() {
	var outHandle uintptr
	r, _, _ := midiOutOpen2.Call(uintptr(unsafe.Pointer(&outHandle)), 2, 0, 0, 0)
	if r != 0 {
		fmt.Printf("midiOutOpen failed: %d\n", r)
		os.Exit(1)
	}
	defer midiOutClose2.Call(outHandle)

	var inHandle uintptr
	const CALLBACK_FUNCTION = 0x30000
	r, _, _ = midiInOpen2.Call(uintptr(unsafe.Pointer(&inHandle)), 1, cb2, 0, CALLBACK_FUNCTION)
	if r != 0 {
		fmt.Printf("midiInOpen failed: %d\n", r)
		os.Exit(1)
	}
	defer midiInClose2.Call(inHandle)

	buf := make([]byte, 8192)
	runtime.KeepAlive(buf)
	hdr := MIDIHDR2{lpData: uintptr(unsafe.Pointer(&buf[0])), dwBufferLength: uint32(len(buf))}
	midiInPrepareHeader2.Call(inHandle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	midiInAddBuffer2.Call(inHandle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	midiInStart2.Call(inHandle)

	// Try all 16 channels with both 0x10 and 0x1C request types
	msgs := []struct {
		label string
		data  []byte
	}{
		{"0x10 ch1", []byte{0xF0, 0x42, 0x30, 0x58, 0x10, 0xF7}},
		{"0x1C ch1 slot0", []byte{0xF0, 0x42, 0x30, 0x58, 0x1C, 0x00, 0x00, 0xF7}},
		{"0x10 ch2", []byte{0xF0, 0x42, 0x31, 0x58, 0x10, 0xF7}},
		{"0x1C ch2 slot0", []byte{0xF0, 0x42, 0x31, 0x58, 0x1C, 0x00, 0x00, 0xF7}},
		{"0x10 ch3", []byte{0xF0, 0x42, 0x32, 0x58, 0x10, 0xF7}},
		{"0x10 ch4", []byte{0xF0, 0x42, 0x33, 0x58, 0x10, 0xF7}},
		{"0x10 ch5", []byte{0xF0, 0x42, 0x34, 0x58, 0x10, 0xF7}},
		{"0x10 ch6", []byte{0xF0, 0x42, 0x35, 0x58, 0x10, 0xF7}},
		{"0x10 ch7", []byte{0xF0, 0x42, 0x36, 0x58, 0x10, 0xF7}},
		{"0x10 ch8", []byte{0xF0, 0x42, 0x37, 0x58, 0x10, 0xF7}},
		{"0x10 ch9", []byte{0xF0, 0x42, 0x38, 0x58, 0x10, 0xF7}},
		{"0x10 ch10", []byte{0xF0, 0x42, 0x39, 0x58, 0x10, 0xF7}},
		{"0x10 ch11", []byte{0xF0, 0x42, 0x3A, 0x58, 0x10, 0xF7}},
		{"0x10 ch12", []byte{0xF0, 0x42, 0x3B, 0x58, 0x10, 0xF7}},
		{"0x10 ch13", []byte{0xF0, 0x42, 0x3C, 0x58, 0x10, 0xF7}},
		{"0x10 ch14", []byte{0xF0, 0x42, 0x3D, 0x58, 0x10, 0xF7}},
		{"0x10 ch15", []byte{0xF0, 0x42, 0x3E, 0x58, 0x10, 0xF7}},
		{"0x10 ch16", []byte{0xF0, 0x42, 0x3F, 0x58, 0x10, 0xF7}},
	}

	for _, m := range msgs {
		if atomic.LoadUint32(&rx2Done) != 0 {
			break
		}
		fmt.Printf("Trying %s... ", m.label)
		if err := sendMsg(outHandle, m.data); err != nil {
			fmt.Printf("send error: %v\n", err)
			continue
		}
		fmt.Print("sent, waiting 1.5s... ")
		deadline2 := time.Now().Add(1500 * time.Millisecond)
		for time.Now().Before(deadline2) {
			if atomic.LoadUint32(&rx2Done) != 0 {
				break
			}
			runtime.Gosched()
			time.Sleep(10 * time.Millisecond)
		}
		if atomic.LoadUint32(&rx2Done) != 0 {
			fmt.Println("✅ GOT RESPONSE!")
			break
		}
		fmt.Println("no response")
	}

	if atomic.LoadUint32(&rx2Done) != 0 {
		fmt.Printf("\n✅ Got SysEx response: %d bytes\n", len(rx2Data))
	} else {
		fmt.Println("❌ No SysEx response on any channel/function code")
		fmt.Println("   microKORG Global > MIDI > SysEx may need to be enabled")
	}

	midiInStop2.Call(inHandle)
	midiInUnprepareHeader2.Call(inHandle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
}
