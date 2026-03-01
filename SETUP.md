# Patchify MIDI System Setup Guide

## Current Status
- ❌ loopMIDI not installed
- ❌ Focusrite not connected/detected

## Phase 1: Install loopMIDI (Virtual MIDI Router)

loopMIDI allows you to route MIDI between applications virtually, so you can monitor what the Korg editor sends without needing a second MIDI interface.

### Installation Steps

1. **Download loopMIDI**
   - Visit: https://www.tobias-erichsen.de/software/virtualmidi/
   - Download the latest installer (torisoft-loopmidi-installer_*.exe)

2. **Install loopMIDI**
   - Run the installer
   - Accept default settings
   - Complete installation

3. **Launch loopMIDI**
   - Find "loopMIDI" in Start Menu
   - Click the "+" button at the bottom
   - A new virtual MIDI port will appear (e.g., "loopMIDI Port 1")
   - Keep loopMIDI running

4. **Verify Installation**
   - Run diagnostic: `bun cli/setup-midi.cjs`
   - Should show loopMIDI in available ports

## Phase 2: Connect Focusrite MIDI (Hardware)

Your Focusrite USB interface needs to be connected to your computer and detected by Windows.

### Connection Steps

1. **Physical Connection**
   - Connect microKORG S MIDI OUT → Focusrite MIDI IN
   - Connect microKORG S MIDI IN → Focusrite MIDI OUT
   - Connect Focusrite USB to computer

2. **Configure microKORG S**
   - Power on microKORG S
   - Press **Shift + 4** (Global menu)
   - Navigate to "E-E" (Edit Enable)
   - Set to **ON** (enables SysEx receive)
   - Press **Shift + 8** (System)
   - Navigate to "Write Protect"
   - Set to **OFF** (allows writing patches)

3. **Verify Windows Detection**
   - Open Windows Settings → Sound → Volume & device preferences
   - Scroll to "Advanced" → App volume and device preferences
   - Look for "Focusrite" in the list
   - If not visible, driver may need installation

4. **Verify Patchify Detection**
   - Run diagnostic: `bun cli/setup-midi.cjs`
   - Should show Focusrite in MIDI output ports

## Phase 3: Configure MIDI Routing

Once both loopMIDI and Focusrite are detected, set up the routing chain.

### Routing Configuration

You'll create this signal flow:

```
Korg Editor
    ↓
loopMIDI (virtual port)
    ↓
Windows MIDI Routing (configured in Sound settings)
    ↓
Focusrite USB
    ↓
microKORG S Hardware
```

**In Korg Sound Editor:**
1. Open Sound Editor settings
2. Set MIDI Output Port to "loopMIDI Port 1" (or whichever port you created)

**In Windows MIDI Settings:**
1. Right-click Sound icon in system tray
2. Open "Sound settings"
3. Go to "Advanced" → "Volume mixer" or MIDI configuration
4. Route "loopMIDI output" → "Focusrite input"
5. (Optional) Route "Focusrite output" → "loopMIDI input" for feedback

## Phase 4: Test the Complete System

Once setup is complete:

```bash
# 1. Verify all ports are detected
bun cli/setup-midi.cjs

# 2. Start monitoring
bun cli/monitor-midi.cjs

# 3. In Korg Sound Editor:
#    - Open any patch
#    - Click "Send to Device"
#    - Monitor should display captured SysEx
#    - Press Ctrl+C to save capture

# 4. Upload all patches
bun cli/send-patches-individually.cjs

# 5. On microKORG S:
#    - Power cycle to refresh display
#    - Check Banks A-D populated with patches
```

## Troubleshooting

### loopMIDI installation fails
- Try running as Administrator
- Disable antivirus temporarily
- Restart computer after installation

### loopMIDI port not appearing in applications
- Restart the application
- Restart loopMIDI
- Check Windows Sound settings that loopMIDI port exists

### Focusrite not detected
- Check USB connection
- Try different USB port
- Install latest Focusrite drivers from manufacturer
- Restart computer after driver installation

### Monitor shows "Focusrite not found"
- Verify MIDI cables are connected correctly:
  - microKORG MIDI OUT → Focusrite IN
  - microKORG MIDI IN → Focusrite OUT
- Check microKORG settings (Shift+4 must be ON)
- Restart both devices

### Patches don't upload to hardware
- Run diagnostic first: `bun cli/setup-midi.cjs`
- Verify Focusrite shows in MIDI outputs
- Confirm microKORG write protect is OFF (Shift+8)
- Check MIDI cables and connections
- Try different patch to isolate issue

## Quick Checklist

Before proceeding to monitoring:

- [ ] loopMIDI installed and running
- [ ] loopMIDI shows in `bun cli/setup-midi.cjs` output
- [ ] microKORG S connected via MIDI to Focusrite
- [ ] Focusrite connected to computer via USB
- [ ] microKORG S SysEx enabled (Shift+4 = E-E: ON)
- [ ] microKORG S write protect disabled (Shift+8 = OFF)
- [ ] Focusrite shows in `bun cli/setup-midi.cjs` output
- [ ] Korg Sound Editor MIDI output set to loopMIDI

Once all checked, you're ready to:
```bash
bun cli/monitor-midi.cjs
```

Happy patching! 🎹
