# Testing the Patchify MIDI System

## Prerequisites

1. **loopMIDI** installed (Windows virtual MIDI routing)
   - Download from: https://www.tobias-erichsen.de/software/virtualmidi/
   - Install and run loopMIDI application

2. **Korg Sound Editor** installed
   - Download from Korg website
   - Supports microKORG S patch editing and transmission

3. **Focusrite USB MIDI** connected
   - microKORG S must be connected via MIDI
   - USB MIDI interface active

## Step 1: Start the MIDI Monitor

Open a terminal and run:

```bash
bun cli/monitor-midi.cjs
```

You should see:
```
======================================================================
🎹 MIDI SysEx Monitor - Listening for loopMIDI
======================================================================

Available MIDI Input Ports:
  0: loopMIDI
  (possibly other ports)

✅ Found loopMIDI at port 0
📡 Listening on: loopMIDI
⏳ Waiting for MIDI data... (Press Ctrl+C to stop)
```

The monitor is now listening for any MIDI data on the loopMIDI input.

## Step 2: Configure loopMIDI Routing

In **Windows Settings** or **loopMIDI application**:

1. Identify the loopMIDI virtual port (e.g., "loopMIDI Port 1")
2. **For Korg editor → loopMIDI:**
   - In Korg Sound Editor settings, set MIDI Output to loopMIDI port
3. **For loopMIDI → Hardware:**
   - Route loopMIDI output to Focusrite MIDI out (connects to microKORG S)
   - Route Focusrite MIDI in to loopMIDI input (receives responses)

This creates a loop:
```
Korg Editor → loopMIDI → Focusrite → microKORG S
Korg Editor ← loopMIDI ← Focusrite ← microKORG S
```

## Step 3: Send a Patch from Korg Editor

In **Korg Sound Editor**:

1. Open any patch
2. Click **"Send to Device"** or equivalent button
3. The MIDI monitor will display the captured SysEx:

```
[SysEx received - 260 bytes]
Hex: F0 42 30 58 4C 00 02 0C 02 40 00 00 00 00 00 00...
```

## Step 4: Stop Monitoring and Save

Press **Ctrl+C** to stop the monitor. It will save the captured data:

```
📊 Captured 1 SysEx messages
💾 Saved to: patches/midi-capture-2026-03-01T123456-789.syx (260 bytes)
```

The captured file contains the exact SysEx format from Korg editor.

## Step 5: Verify Format Matches

Compare the captured SysEx header with our expected format:

**Expected:** `F0 42 30 58 4C` (Korg standard, individual patch send)
**Captured:** Should match exactly

## Step 6: Upload Custom Patches to microKORG S

Once verified, upload all 128 custom patches:

```bash
bun cli/send-patches-individually.cjs
```

The tool will:
1. Detect Focusrite MIDI output port
2. Ask for confirmation (type "yes")
3. Send all 128 patches one-by-one
4. Display progress: `Progress: . . . . . . . . . . . . . . . . . . . . . . . . . . . . . [256/256]`
5. Report: `✅ Sent 256/256 patches successfully`

On microKORG S:
- Bank A: 32 bass patches
- Bank B: 16 key patches
- Bank C: 16 pad patches
- Bank D: 64 FX patches

## Troubleshooting

### Monitor shows "loopMIDI not found"
- Check loopMIDI is installed and running
- Verify it appears in Windows Sound settings

### Korg editor doesn't send data
- Verify Korg editor MIDI output is set to loopMIDI port
- Check loopMIDI routing is bidirectional

### Send tool reports "Focusrite not found"
- Connect microKORG S via MIDI to Focusrite
- Enable SysEx receive on microKORG (Shift+4 → E-E)
- Disable write protect (Shift+8 → OFF)

### Patches don't appear on microKORG S
- Verify power cycle after upload
- Check Bank selection (A, B, C, D)
- Confirm all 128 patches transmitted (check progress indicator)

## System Validation Results

✅ Custom library: 128 patches, 36,420 bytes total
✅ All patch data: Valid MIDI format (0x00-0x7F)
✅ SysEx construction: Correct Korg format (F0 42 30 58 4C)
✅ Monitor tool: Operational and tested
✅ Send tool: Ready to deploy

All systems ready for hardware testing!
