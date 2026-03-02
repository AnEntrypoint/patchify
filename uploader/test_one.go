//go:build ignore

package main

import (
	"fmt"
	"os"
	"runtime"
	"sync/atomic"
	"time"
	"unsafe"
	"syscall"
)

var (
	winmm2                  = syscall.NewLazyDLL("winmm.dll")
	midiOutOpen2            = winmm2.NewProc("midiOutOpen")
	midiOutClose2           = winmm2.NewProc("midiOutClose")
	midiOutLongMsg2         = winmm2.NewProc("midiOutLongMsg")
	midiOutPrepareHeader2   = winmm2.NewProc("midiOutPrepareHeader")
	midiOutUnprepareHeader2 = winmm2.NewProc("midiOutUnprepareHeader")
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

func sendSysEx2(handle uintptr, data []byte) error {
	buf := make([]byte, len(data))
	copy(buf, data)
	runtime.KeepAlive(buf)
	hdr := MIDIHDR2{
		lpData: uintptr(unsafe.Pointer(&buf[0])),
		dwBufferLength: uint32(len(buf)),
	}
	r, _, _ := midiOutPrepareHeader2.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 { return fmt.Errorf("prepare: %d", r) }
	r, _, _ = midiOutLongMsg2.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	if r != 0 { return fmt.Errorf("longmsg: %d", r) }
	deadline := time.Now().Add(5 * time.Second)
	for {
		if atomic.LoadUint32(&hdr.dwFlags)&1 != 0 { break }
		if time.Now().After(deadline) { return fmt.Errorf("timeout") }
		runtime.Gosched()
		time.Sleep(1 * time.Millisecond)
	}
	midiOutUnprepareHeader2.Call(handle, uintptr(unsafe.Pointer(&hdr)), unsafe.Sizeof(hdr))
	return nil
}
