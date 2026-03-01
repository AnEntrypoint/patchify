# Complete MIDI Routing Setup for Patchify

## The Problem
Messages aren't flowing from Korg Sound Editor through loopMIDI to the monitor.

## The Solution
Set up proper MIDI routing in 3 places:

---

## Step 1: Configure Korg Sound Editor

In **Korg Sound Editor**:

1. Open **Preferences** or **Settings**
2. Go to **MIDI** tab
3. Set **MIDI Output Port** to: `loopMIDI Port` (NOT Focusrite directly!)
4. Set **MIDI Input Port** to: `Focusrite USB MIDI` (for hardware responses)
5. Click **Save** or **Apply**
6. **RESTART** Korg Sound Editor (close completely and reopen)

Why restart? Many apps cache MIDI port connections at startup.

---

## Step 2: Configure Windows MIDI Routing

This ensures loopMIDI messages reach the hardware:

### Option A: Using MIDI Mapper (Built-in Windows)

1. Open **Settings** → **Sound**
2. Scroll to **Advanced** section
3. Click **Volume mixer** or **App volume and device preferences**
4. Find `loopMIDI` in the list
5. Click it and set output to: `Focusrite USB MIDI`

### Option B: Using loopMIDI Application

1. Keep **loopMIDI application** open (system tray)
2. Right-click loopMIDI port → **Properties** or **Routing**
3. Configure output destination to `Focusrite`

---

## Step 3: Verify the Signal Chain

The complete flow should be:

```
Korg Sound Editor
        ↓
    (configured to output to)
        ↓
loopMIDI Port (INPUT) ← Monitor listens here
        ↓
    (Windows MIDI routing)
        ↓
Focusrite USB MIDI (OUTPUT)
        ↓
microKORG S Hardware
```

---

## Step 4: Test the Connection

Once configured:

1. **Start monitor:**
   ```bash
   bun cli/monitor-midi.cjs
   ```

2. **In Korg Sound Editor:**
   - Load any patch
   - Click **"Send to Device"** (or equivalent)

3. **In monitor window:**
   - Should see: `[SysEx received - 260 bytes]`
   - Hex output starting with `F0 42 30 58 4C`

4. **If captured successfully:**
   - Press Ctrl+C to stop monitor
   - Run upload: `bun cli/send-patches-individually.cjs`

---

## Troubleshooting Checklist

- [ ] loopMIDI is **running** (check system tray)
- [ ] loopMIDI has a **virtual port created** ("++" in loopMIDI window)
- [ ] Korg editor MIDI **OUTPUT** set to loopMIDI (not Focusrite)
- [ ] Korg editor **RESTARTED** after changing settings
- [ ] Windows MIDI routing points loopMIDI → Focusrite
- [ ] Monitor showing "✅ Found loopMIDI at input port"
- [ ] Focusrite MIDI cables connected properly

---

## Common Issues

**Monitor not seeing messages:**
- Korg editor still sending to Focusrite directly (restart it!)
- loopMIDI port not created or not selected in Korg
- Windows MIDI routing not configured

**Messages going to hardware but not captured:**
- Monitor listening on wrong port
- loopMIDI input port not properly exposed to Bun/jazz-midi

**"No loopMIDI found" error:**
- loopMIDI application not running
- loopMIDI needs a virtual port created (click "+")
- Restart Bun/monitor script after creating port

---

## Quick Test

Don't have Korg editor open? Test the routing:

```bash
# Sends test SysEx to loopMIDI
bun test-send-bytes.cjs

# Should capture in monitor (if listening)
# Otherwise routing is broken
```

