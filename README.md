# 🎹 Patchify - microKORG Custom Patch Library

Complete tool for uploading custom 128-patch libraries to your microKORG synthesizer.

## ⚡ Quick Start

### Upload Your Custom Library (30 seconds)

1. **Windows**: Double-click `upload.bat`
2. **macOS/Linux**: Run `bash upload.sh`
3. **Manual**: `bun run cli/upload-with-erriez.cjs`

That's it! Your 128 custom patches will be loaded into your microKORG.

## 📦 What's Included

**128 Custom PSY-Focused Patches**:
- **Bank A**: 32 Bass patches
  - Deep subs, punchy, FM, acid, wobble, reese, synth, etc.
- **Bank B**: 16 Key patches
  - E.pianos, organs, rhodes, harpsichords, synth keys
- **Bank C**: 16 Pad patches
  - Ambient, evolving, ethereal, lush, atmospheric
- **Bank D**: 64 Psychedelic FX patches
  - **Bubbles (8)** - Resonant bubble effects
  - **Resonant (8)** - Filter sweeps and modulation
  - **Spirals (8)** - Circular/vortex LFO patterns
  - **Modulation (8)** - FM and chaotic modulation
  - **Sweeps (8)** - Filter envelope madness
  - **Granular (8)** - Grainy evolving textures
  - **Delays (8)** - Echo and delay effects
  - **Alien/Sci-Fi (8)** - Otherworldly sounds

## 🎛️ Features of All Patches

✨ **Sound Design**:
- ✓ Heavy LFO modulation (Depth: 50-120, varied rates)
- ✓ High resonance filters (Res: 5-127) for bubble/metallic effects
- ✓ Sophisticated envelope shaping with custom ADSR
- ✓ Delay effects with feedback (NO reverb)
- ✓ NO arpeggiators enabled by default

🎵 **Creative & Experimental**:
- Psychedelic modulation patterns
- Evolving textures and ambient soundscapes
- Aggressive bubble and resonant peaks
- FM synthesis chaos and frequency modulation
- Atmospheric and spacey effects

## ✅ Requirements

- ✓ **microKORG** synthesizer (powered on)
- ✓ **USB MIDI Interface** (e.g., Focusrite) connected
- ✓ **Bun runtime**: `bun --version`
- ✓ **Windows 10+** or **macOS/Linux**

## 🚀 Upload Process

### Step 1: Connect Hardware
1. Connect microKORG via USB/MIDI to your computer
2. Power on the microKORG
3. Verify MIDI interface appears in system settings

### Step 2: Run Uploader
Choose one:
```bash
# Windows - Double-click
upload.bat

# macOS/Linux - Bash script
bash upload.sh

# Any platform - Bun command
bun run cli/upload-with-erriez.cjs
```

### Step 3: Confirm & Upload
- Tool shows MIDI devices detected
- Displays library contents
- Asks for confirmation (type `yes`)
- Sends all 128 patches (32KB)
- Takes 10-30 seconds

### Step 4: Verify
1. Wait 30 seconds for microKORG to reprogram
2. Power cycle your microKORG
3. Navigate through Banks A-D to see new patches
4. Try Bank D - it's wild! 🎉

## 📁 Project Structure

```
patchify/
├── cli/
│   ├── create-custom-library.cjs    # Generate patch library
│   └── upload-with-erriez.cjs       # Upload tool
├── patches/
│   └── custom-library-2026-02-28.syx # Your 128 patches (32KB)
├── upload.bat                        # Windows uploader
├── upload.sh                         # macOS/Linux uploader
├── package.json                      # Dependencies
└── readme.md                         # This file
```

## 🔧 Tools Available

### Generate Custom Library
```bash
bun run cli/create-custom-library.cjs
```
Creates `patches/custom-library-2026-02-28.syx` with your custom patches.

### Upload Library
```bash
bun run cli/upload-with-erriez.cjs
```
Uploads the SysEx library to your microKORG via Focusrite USB MIDI.

## 🆘 Troubleshooting

### "Focusrite not found"
- Check USB connection to computer
- Verify microKORG is powered on
- Open MIDI-OX to confirm USB MIDI shows up
- Try restarting Focusrite hardware

### "Upload timeout"
- microKORG may be processing
- Power cycle and try again
- Check MIDI cable is fully connected

### "No response from microKORG"
- This is normal - Focusrite is one-way (send only)
- Power cycle microKORG to confirm patches loaded
- Check if LED indicates activity

### General debugging
```bash
# Shows detected MIDI devices
bun run cli/upload-with-erriez.cjs

# Look for: "Focusrite USB MIDI" in inputs/outputs
```

## 📚 How It Works

1. **Library File**: `custom-library-2026-02-28.syx` contains 128 patches × 254 bytes each
2. **SysEx Format**: MIDI System Exclusive format for synth programming
3. **Upload Method**: Uses Erriez MIDI SysEx Tool for reliable Windows/Mac/Linux support
4. **No Reverb**: Focusrite USB MIDI bridge doesn't support reverb - all patches use delay instead

## 🎛️ Patch Library Details

### Bank A: Basses (32 patches)
Deep subs, punchy, FM synthesis, acid basses, resonant, wobble, reese, squelch, retro, dub, industrial, cyber, analog styles.

### Bank B: Keys (16 patches)
E.pianos, organs, rhodes, vibraphone, harpsichord, clavichord, synth keys with various characters (soft, bright, warm, bell-like).

### Bank C: Pads (16 patches)
Ambient atmospheres, lush evolving textures, ethereal, floating, resonant, filtered, swelling, liquid, shimmering, FM pads.

### Bank D: PSY FX (64 patches)
The experimental section! Bubble effects, spiraling modulation, granular textures, sweeping filters, alien sci-fi sounds, delay madness.

**Special Features**:
- **High Resonance**: Many FX use Res 80-127 for aggressive bubble effects
- **Crazy Modulation**: LFO rates from 15-100Hz with depths up to 120
- **Filter Envelopes**: Envelopes modulate filter for dramatic sweeps
- **Delay Feedback**: Feedback loops create ambient, evolving textures
- **No Arpeggiators**: All patches have arpeggiator disabled

## 🎉 You're Ready!

Your microKORG is now loaded with 128 creative, experimental patches perfect for psychedelic sound design. Enjoy the bubble effects, crazy modulation, and evolving textures!

Happy patching! 🎹✨

## 📝 Notes

- All patches preserve your microKORG's built-in editing capabilities
- You can still edit parameters on the hardware itself
- To restore factory patches, use the factory backup: `FactoryBackUpDoResetAfter.syx`
- Custom library can be backed up before uploading new ones

## ⚖️ License

MIT - Use and modify as needed for your creative projects.

## 🔗 Resources

- **Erriez MIDI SysEx Tool**: https://github.com/Erriez/midi-sysex-io
- **microKORG Manual**: https://www.korguser.net/manuals/microkorg/
- **Bun Runtime**: https://bun.sh
