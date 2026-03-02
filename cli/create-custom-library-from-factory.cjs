#!/usr/bin/env node

/**
 * Create Custom microKORG Patch Library
 *
 * Correct byte map sourced from the official Korg MS2000/microKORG SysEx spec.
 *
 * File format:  F0 42 30 58 50 [128 × 254 bytes] [system data] F7
 *
 * Patch layout (254 bytes):
 *   [0–11]   Program name (12 ASCII chars, space-padded)
 *   [12–13]  Dummy
 *   [14–37]  Global patch params (voice mode, delay/mod FX, EQ, arp, kbd oct)
 *   [38–145] Timbre 1 data (108 bytes)
 *   [146–253] Timbre 2 data (108 bytes, unused in Single voice mode)
 *
 * Timbre layout (108 bytes, offsets relative to timbre start):
 *   +0   MIDI Channel (0xFF = global)
 *   +1   Assign / Key Priority  (B6,7 = mode: 0=Mono,1=Poly,2=Unison)
 *   +2   Unison Detune
 *   +3   Tune (64=0, range 64±50 cents)
 *   +4   Bend Range (64=0, range 64±12 semitones)
 *   +5   Transpose (64=0, range 64±24 semitones)
 *   +6   Vibrato Intensity
 *   +7   OSC1 Wave (0=Saw,1=Pulse,2=Tri,3=Sin/Cross,4=VoxWave,5=DWGS,6=Noise,7=Audio In)
 *   +8   OSC1 Ctrl1
 *   +9   OSC1 Ctrl2
 *   +10  DWGS Wave number (0–63)
 *   +11  Dummy
 *   +12  OSC2 (B4,5=Mod: 0=Off,1=Ring,2=Sync,3=RingSync; B0,1=Wave: 0=Saw,1=Squ,2=Tri)
 *   +13  OSC2 Semitone (64=0)
 *   +14  OSC2 Tune (64=0)
 *   +15  Portamento Time
 *   +16  OSC1 Level       ← must be non-zero for sound
 *   +17  OSC2 Level
 *   +18  Noise Level
 *   +19  Filter Type (0=24LPF,1=12LPF,2=12BPF,3=12HPF)
 *   +20  Filter Cutoff
 *   +21  Filter Resonance
 *   +22  Filter EG Intensity (64=0)
 *   +23  Filter Velocity Sense (64=0)
 *   +24  Filter KBD Track (64=0)
 *   +25  AMP Level        ← must be non-zero for sound
 *   +26  AMP Panpot (64=center)
 *   +27  AMP flags (B6=EG2 sw, B0=Distortion)
 *   +28  AMP Velocity Sense (64=0)
 *   +29  AMP KBD Track (64=0)
 *   +30  EG1 (Filter) Attack
 *   +31  EG1 Decay
 *   +32  EG1 Sustain
 *   +33  EG1 Release
 *   +34  EG2 (Amp) Attack
 *   +35  EG2 Decay
 *   +36  EG2 Sustain
 *   +37  EG2 Release
 *   +38  LFO1 (B4,5=KeySync; B0,1=Wave: 0=Saw,1=Squ,2=Tri,3=S&H)
 *   +39  LFO1 Frequency
 *   +40  LFO1 Sync
 *   +41  LFO2 flags
 *   +42  LFO2 Frequency
 *   +43  LFO2 Sync
 *   +44–51  Virtual Patches (4×2 bytes: dst/src nibbles + intensity)
 *   +52–107 Dummy (padding)
 */

const fs = require('fs');

const PATCH_SIZE = 254;
const TOTAL_PATCHES = 256; // microKORG S has 256 patches (2 banks of 128)

// Absolute byte offsets within a 254-byte patch
const T1 = 38;   // Timbre 1 start
const T2 = 146;  // Timbre 2 start

const P = {
  // Name
  NAME: 0,       // 12 bytes, space-padded ASCII

  // Global (byte 16: voice mode — 0=Single,2=Layer,3=Vocoder in B4,5)
  VOICE_MODE: 16,

  // Delay FX
  DELAY_SYNC_BASE: 19,
  DELAY_TIME: 20,
  DELAY_DEPTH: 21,
  DELAY_TYPE: 22,

  // Mod FX
  MOD_RATE: 23,
  MOD_DEPTH: 24,
  MOD_TYPE: 25,

  // EQ
  EQ_HI_FREQ: 26,
  EQ_HI_GAIN: 27,   // 64 = 0 dB
  EQ_LOW_FREQ: 28,
  EQ_LOW_GAIN: 29,  // 64 = 0 dB

  // Arp
  ARP_TEMPO_MSB: 30,
  ARP_TEMPO_LSB: 31,
  ARP_FLAGS: 32,   // B7=on/off, B6=latch, B4,5=target, B0=keysync
  ARP_TYPE_RANGE: 33,
  ARP_GATE: 34,
  ARP_RESOLUTION: 35,
  ARP_SWING: 36,

  KBD_OCTAVE: 37,
};

// Build offset helpers for timbre params
function t(timbreBase, offset) { return timbreBase + offset; }

function createPatch(name, cfg = {}) {
  const patch = new Uint8Array(PATCH_SIZE);
  // Initialize all bytes to 0x40 (center value for parameters like Tune, Bend, Transpose, Filter EG, AMP Pan, etc.)
  patch.fill(0x40);

  // Name: 12 bytes, space-padded
  const nameBytes = Buffer.from(name.padEnd(12, ' ').slice(0, 12), 'ascii');
  for (let i = 0; i < 12; i++) patch[i] = nameBytes[i];

  // Global: single voice, no arp, flat EQ, no FX, normal octave
  // CRITICAL: Use FACTORY DEFAULTS, not 0
  patch[P.VOICE_MODE] = 0x40;       // Single voice (factory: 0x40)
  patch[P.DELAY_TIME] = 0;          // Delay time = 0
  patch[P.DELAY_DEPTH] = 0;         // Delay depth = 0
  patch[P.DELAY_TYPE] = 0;          // Delay type OFF
  patch[P.MOD_RATE] = 0;            // Mod rate = 0
  patch[P.MOD_DEPTH] = 0;           // Mod depth = 0
  patch[P.MOD_TYPE] = 1;            // Mod type OFF (factory: 0x01, NOT 0!)
  patch[P.EQ_HI_GAIN] = 64;         // 0 dB
  patch[P.EQ_LOW_GAIN] = 64;        // 0 dB
  patch[P.ARP_TEMPO_MSB] = 0;
  patch[P.ARP_TEMPO_LSB] = 120;     // 120 BPM
  patch[P.KBD_OCTAVE] = 0x7F;       // Keyboard octave = 0 (factory: 0x7F=127, NOT 0!)

  // Optional global delay (override defaults if specified)
  if (cfg.delayTime  !== undefined) patch[P.DELAY_TIME]  = clamp(cfg.delayTime);
  if (cfg.delayDepth !== undefined) patch[P.DELAY_DEPTH] = clamp(cfg.delayDepth);
  if (cfg.delayType  !== undefined) patch[P.DELAY_TYPE]  = clamp(cfg.delayType, 0, 2);
  if (cfg.modRate    !== undefined) patch[P.MOD_RATE]    = clamp(cfg.modRate);
  if (cfg.modDepth   !== undefined) patch[P.MOD_DEPTH]   = clamp(cfg.modDepth);
  if (cfg.modType    !== undefined) patch[P.MOD_TYPE]    = clamp(cfg.modType, 0, 2);

  // Timbre 1 defaults (must produce audible sound)
  const tb = T1;
  patch[t(tb, 0)]  = 0xFF & 0x7F;   // MIDI Channel = global (stored as high value; device clips)
  patch[t(tb, 1)]  = 0b01000000;     // Poly assign
  patch[t(tb, 3)]  = 64;             // Tune = 0 cents
  patch[t(tb, 4)]  = 64;             // Bend range = 0
  patch[t(tb, 5)]  = 64;             // Transpose = 0 (legacy offset, kept for stability)
  // CRITICAL: Actual transpose is at T1+74 (byte 112 absolute), discovered via hardware dump analysis
  // Value encoding: 64=0, range 64±24 semitones. E.g., 52=−12, 40=−24
  patch[t(tb, 74)] = 64 + clamp(cfg.transpose || 0, -24, 24); // Write transpose to CORRECT offset
  // Vibrato Intensity: factory default 0x41 (65), not 0x40!
  patch[t(tb, 6)]  = cfg.vibratoIntensity !== undefined ? 64 + clamp(cfg.vibratoIntensity, -63, 63) : 0x41;
  patch[t(tb, 7)]  = cfg.osc1Wave  !== undefined ? clamp(cfg.osc1Wave, 0, 7) : 0;  // Saw
  patch[t(tb, 8)]  = cfg.osc1Ctrl1 !== undefined ? clamp(cfg.osc1Ctrl1) : 0;
  patch[t(tb, 9)]  = cfg.osc1Ctrl2 !== undefined ? clamp(cfg.osc1Ctrl2) : 0;
  patch[t(tb, 12)] = (clamp(cfg.osc2Mod  || 0, 0, 3) << 4) | clamp(cfg.osc2Wave || 0, 0, 2);
  patch[t(tb, 13)] = 64 + clamp(cfg.osc2Semi || 0, -24, 24); // Semitone offset from center
  patch[t(tb, 14)] = 64 + clamp(cfg.osc2Tune || 0, -63, 63); // Fine tune ±63 cents
  patch[t(tb, 15)] = cfg.portamento !== undefined ? clamp(cfg.portamento) : 0;
  patch[t(tb, 16)] = cfg.osc1Level  !== undefined ? clamp(cfg.osc1Level)  : 100; // OSC1 Level
  patch[t(tb, 17)] = cfg.osc2Level  !== undefined ? clamp(cfg.osc2Level)  : 0;
  patch[t(tb, 18)] = cfg.noiseLevel !== undefined ? clamp(cfg.noiseLevel) : 0;
  // Filter Type: factory default 0x01 (12LPF), not 0x00 (which enables HPF!)
  patch[t(tb, 19)] = cfg.filterType !== undefined ? clamp(cfg.filterType, 0, 3) : 1;
  patch[t(tb, 20)] = cfg.filterCutoff    !== undefined ? clamp(cfg.filterCutoff)    : 100;
  patch[t(tb, 21)] = cfg.filterResonance !== undefined ? clamp(cfg.filterResonance) : 0;
  patch[t(tb, 22)] = 64 + clamp(cfg.filterEgInt || 0, -63, 63); // EG intensity (signed)
  patch[t(tb, 23)] = 64;             // Filter velocity sense = 0
  patch[t(tb, 24)] = 64;             // Filter KBD track = 0
  patch[t(tb, 25)] = cfg.ampLevel   !== undefined ? clamp(cfg.ampLevel)   : 100; // AMP Level
  patch[t(tb, 26)] = 64;             // AMP Panpot = center
  patch[t(tb, 28)] = 64;             // AMP velocity sense = 0
  patch[t(tb, 29)] = 64;             // AMP KBD track = 0
  // EG1 (Filter)
  patch[t(tb, 30)] = cfg.filterAttack  !== undefined ? clamp(cfg.filterAttack)  : 0;
  patch[t(tb, 31)] = cfg.filterDecay   !== undefined ? clamp(cfg.filterDecay)   : 50;
  patch[t(tb, 32)] = cfg.filterSustain !== undefined ? clamp(cfg.filterSustain) : 0;
  patch[t(tb, 33)] = cfg.filterRelease !== undefined ? clamp(cfg.filterRelease) : 50;
  // EG2 (Amp)
  patch[t(tb, 34)] = cfg.ampAttack  !== undefined ? clamp(cfg.ampAttack)  : 5;
  patch[t(tb, 35)] = cfg.ampDecay   !== undefined ? clamp(cfg.ampDecay)   : 50;
  patch[t(tb, 36)] = cfg.ampSustain !== undefined ? clamp(cfg.ampSustain) : 100;
  patch[t(tb, 37)] = cfg.ampRelease !== undefined ? clamp(cfg.ampRelease) : 50;
  // LFO1
  patch[t(tb, 38)] = cfg.lfo1Wave !== undefined ? (clamp(cfg.lfo1Wave, 0, 3)) : 0;
  patch[t(tb, 39)] = cfg.lfo1Rate !== undefined ? clamp(cfg.lfo1Rate) : 0;
  // LFO2
  patch[t(tb, 41)] = cfg.lfo2Wave !== undefined ? (clamp(cfg.lfo2Wave, 0, 3)) : 0;
  patch[t(tb, 42)] = cfg.lfo2Rate !== undefined ? clamp(cfg.lfo2Rate) : 0;
  // Virtual Patch 1 (modulation routing)
  if (cfg.vp1Src !== undefined && cfg.vp1Dst !== undefined) {
    patch[t(tb, 44)] = (clamp(cfg.vp1Dst, 0, 7) << 4) | clamp(cfg.vp1Src, 0, 7);
    patch[t(tb, 45)] = 64 + clamp(cfg.vp1Int || 0, -63, 63);
  } else {
    patch[t(tb, 45)] = 64;
  }
  if (cfg.vp2Src !== undefined && cfg.vp2Dst !== undefined) {
    patch[t(tb, 46)] = (clamp(cfg.vp2Dst, 0, 7) << 4) | clamp(cfg.vp2Src, 0, 7);
    patch[t(tb, 47)] = 64 + clamp(cfg.vp2Int || 0, -63, 63);
  } else {
    patch[t(tb, 47)] = 64;
  }
  patch[t(tb, 49)] = 64;
  patch[t(tb, 51)] = 64;

  return patch;
}

function clamp(v, lo = 0, hi = 127) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// ── Patch Definitions ─────────────────────────────────────────────────────────
// Loaded from patches-data.cjs — 256 patches across 4 banks:
//   Bank A (1–64):   Basses  (sub, acid, funk, detuned, pluck, modulating, psy, specialty)
//   Bank B (65–128): Keys    (bright, warm, bells, mono leads, whistle, sync, wah, wide)
//   Bank C (129–192):Pads    (warm, evolving, strings, ambient, twilight, resonant, chorus, dub)
//   Bank D (193–256):FX      (dub FX, bubble, psy movement, arp tones, stabs, sweeps, alien, drones)
// Every patch has mod wheel (VP Src=6) routed to a useful destination. Src=7 is PitchBend.
// Arps: off by default everywhere.
const patches = require('./patches-data.cjs');

// ── Build SysEx ───────────────────────────────────────────────────────────────

/**
 * 7-bit encode: every 7 raw bytes → 8 encoded bytes
 * MSB byte collects bit7 of each data byte, then 7 bytes with high bits cleared.
 * Encoding: MSB bit(7-j) = raw[j] >> 7, for j=0..6
 */
function encode7bit(raw) {
  const out = [];
  for (let i = 0; i < raw.length; i += 7) {
    let msb = 0;
    const chunk = raw.slice(i, Math.min(i + 7, raw.length));
    // MSB byte: bits 6..0 hold the high-bit of data bytes 0..6 (bit7 of MSB stays 0 = valid MIDI byte)
    for (let j = 0; j < chunk.length; j++) {
      msb |= ((chunk[j] >> 7) & 1) << (6 - j);
    }
    out.push(msb);
    for (let j = 0; j < chunk.length; j++) {
      out.push(chunk[j] & 0x7F);
    }
  }
  return Buffer.from(out);
}

async function main() {
  if (patches.length !== 256) {
    console.error(`❌ Expected 256 patches, got ${patches.length}`);
    process.exit(1);
  }

  const allRaw = Buffer.alloc(256 * PATCH_SIZE);
  patches.forEach((cfg, i) => {
    allRaw.set(createPatch(cfg.name, cfg), i * PATCH_SIZE);
  });

  console.log(`Raw patch data: ${allRaw.length} bytes (${allRaw.length / PATCH_SIZE} patches)`);

  const encoded = encode7bit(allRaw);
  console.log(`7-bit encoded: ${encoded.length} bytes`);

  const header = Buffer.from([0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x50]);
  const footer = Buffer.from([0xF7]);
  const sysex  = Buffer.concat([header, encoded, footer]);

  const outFile = `patches/custom-library-${new Date().toISOString().split('T')[0]}.syx`;
  fs.writeFileSync(outFile, sysex);

  console.log(`\n✅ ${outFile}  (${sysex.length} bytes)`);
  console.log(`   Header: F0 42 30 00 01 40 50 — microKORG S native format`);
  console.log(`\nBank A (1–64) — Basses:`);
  console.log(`    1–8:   Sub basses`);
  console.log(`    9–16:  Acid basses`);
  console.log(`   17–24:  Funk/groove basses`);
  console.log(`   25–32:  Detuned/layered basses`);
  console.log(`   33–40:  Pluck/stab basses`);
  console.log(`   41–48:  Modulating basses`);
  console.log(`   49–56:  Psy basses`);
  console.log(`   57–64:  Specialty basses`);
  console.log(`\nBank B (65–128) — Keys:`);
  console.log(`   65–72:  Bright keys / plucks`);
  console.log(`   73–80:  Warm / vintage keys`);
  console.log(`   81–88:  Bells / mallets`);
  console.log(`   89–96:  Mono leads`);
  console.log(`   97–104: Whistle / sine leads`);
  console.log(`  105–112: Sync / hard leads`);
  console.log(`  113–120: Wah / funky leads`);
  console.log(`  121–128: Wide / detuned leads`);
  console.log(`\nBank C (129–192) — Pads:`);
  console.log(`  129–136: Warm / lush pads`);
  console.log(`  137–144: Evolving pads`);
  console.log(`  145–152: String pads`);
  console.log(`  153–160: Ambient / space pads`);
  console.log(`  161–168: Twilight pads`);
  console.log(`  169–176: Resonant pads`);
  console.log(`  177–184: Wide / chorus pads`);
  console.log(`  185–192: Dub pads`);
  console.log(`\nBank D (193–256) — FX:`);
  console.log(`  193–200: Dub FX`);
  console.log(`  201–208: Bubble / filter FX`);
  console.log(`  209–216: Psy movement`);
  console.log(`  217–224: Arp tones (arps off)`);
  console.log(`  225–232: Stabs / hits`);
  console.log(`  233–240: Sweeps / risers`);
  console.log(`  241–248: Alien / psy FX`);
  console.log(`  249–256: Drones / texture`);
  console.log(`\nSend with midi-tool/index.html in Chrome/Edge.`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
