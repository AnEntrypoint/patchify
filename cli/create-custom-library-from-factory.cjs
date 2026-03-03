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

// Absolute byte offsets within a 254-byte patch
const T1 = 38;   // Timbre 1 start
const T2 = 146;  // Timbre 2 start

// Factory init patch — ground truth from initpatch.syx decoded with slice(7,-1)
// All 254 bytes verbatim. Use as base for every patch.
const FACTORY_INIT = Buffer.from([
  0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20, // B000-011 name
  0x00,0x00,0x07,0x00, // B012-015
  0x40,0x00,0x3c,0x05, // B016-019  VOICE_MODE=0x40
  0x28,0x00,0x00,0x14,0x00,0x00, // B020-025  DELAY_TIME=0x28,DELAY_TYPE=0x00,MOD_TYPE=0x00
  0x14,0x40,0x0f,0x40, // B026-029  EQ
  0x00,0x78,0x00,0x00,0x50,0x01,0x00,0x00, // B030-037  ARP(tempo=120),KBD_OCTAVE=0x00
  // Timbre 1 (B038-B145)
  0xff,0x70,0x0a,0x40,0x42,0x40,0x45,0x00,0x00,0x00,0x00,0x00, // +00..+11
  0x00,0x40,0x40,0x00,0x7f,0x00,0x00,0x01,0x7f,0x14,0x40,0x40, // +12..+23
  0x40,0x7f,0x40,0x00,0x40,0x40,0x00,0x40,0x7f,0x00,0x00,0x40, // +24..+35
  0x7f,0x00,0x02,0x0a,0x03,0x02,0x46,0x0c, // +36..+43
  0x02,0x40,0x03,0x40,0x42,0x40,0x43,0x40,0x43,0x71,0x01,0x01, // +44..+55
  0x40,0x40,0x40,0xc0,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40, // +56..+67
  0x40,0x40,0x40,0x40,0x00,0x01,0x40,0x40,0x40,0x40,0x40,0x40, // +68..+79
  0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x00,0x01, // +80..+91
  0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0xc0,0x40, // +92..+103
  0x40,0x40,0x40,0x40, // +104..+107
  // Timbre 2 (B146-B253)
  0x7f,0x70,0x0a,0x40,0x42,0x40,0x45,0x00,0x00,0x00,0x00,0x00, // +00..+11
  0x00,0x40,0x40,0x00,0x7f,0x00,0x00,0x01,0x7f,0x14,0x40,0x40, // +12..+23
  0x40,0x7f,0x40,0x00,0x40,0x40,0x00,0x40,0x7f,0x00,0x00,0x40, // +24..+35
  0x7f,0x00,0x02,0x0a,0x03,0x02,0x46,0x0c, // +36..+43
  0x02,0x40,0x03,0x40,0x42,0x40,0x43,0x40,0x43,0xf1,0x01,0x01, // +44..+55  (0xf1 vs T1's 0x71)
  0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40, // +56..+67
  0x40,0x40,0x40,0x40,0x00,0x01,0x40,0x40,0x40,0x40,0x40,0x40, // +68..+79
  0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x00,0x01, // +80..+91
  0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x40, // +92..+103
  0x40,0x40,0x40,0x40, // +104..+107
]);

// Build offset helpers for timbre params
function t(timbreBase, offset) { return timbreBase + offset; }

function createPatch(name, cfg = {}) {
  // Start from factory init — every byte correct by default
  const patch = new Uint8Array(FACTORY_INIT);

  // Name: 12 bytes, space-padded
  const nameBytes = Buffer.from(name.padEnd(12, ' ').slice(0, 12), 'ascii');
  for (let i = 0; i < 12; i++) patch[i] = nameBytes[i];

  const tb = T1;

  // Vibrato: factory default is +5 (0x45); our default is 0 (0x40, center/off)
  const vibrato = cfg.vibratoIntensity !== undefined
    ? 64 + clamp(cfg.vibratoIntensity, -63, 63)
    : 0x40;
  patch[t(tb, 6)]  = vibrato;
  patch[t(T2, 6)]  = vibrato;

  // Transpose: T1+5 and T1+13=OSC2_SEMI both affect pitch; use T1+5 for transpose
  // Factory T1+5=0x40 (center). Encoding: 64 + semitones
  if (cfg.transpose !== undefined) {
    patch[t(tb, 5)] = 64 + clamp(cfg.transpose, -24, 24);
  }

  // OSC1
  if (cfg.osc1Wave  !== undefined) patch[t(tb, 7)]  = clamp(cfg.osc1Wave, 0, 7);
  if (cfg.osc1Ctrl1 !== undefined) patch[t(tb, 8)]  = clamp(cfg.osc1Ctrl1);
  if (cfg.osc1Ctrl2 !== undefined) patch[t(tb, 9)]  = clamp(cfg.osc1Ctrl2);

  // OSC2
  if (cfg.osc2Mod !== undefined || cfg.osc2Wave !== undefined)
    patch[t(tb, 12)] = (clamp(cfg.osc2Mod || 0, 0, 3) << 4) | clamp(cfg.osc2Wave || 0, 0, 2);
  if (cfg.osc2Semi !== undefined) patch[t(tb, 13)] = 64 + clamp(cfg.osc2Semi, -24, 24);
  if (cfg.osc2Tune !== undefined) patch[t(tb, 14)] = 64 + clamp(cfg.osc2Tune, -63, 63);

  // Mixer
  if (cfg.osc1Level  !== undefined) patch[t(tb, 16)] = clamp(cfg.osc1Level);
  if (cfg.osc2Level  !== undefined) patch[t(tb, 17)] = clamp(cfg.osc2Level);
  if (cfg.noiseLevel !== undefined) patch[t(tb, 18)] = clamp(cfg.noiseLevel);

  // Filter (type: factory=0x01=12LPF; 0=24LPF,1=12LPF,2=12BPF,3=12HPF)
  if (cfg.filterType      !== undefined) patch[t(tb, 19)] = clamp(cfg.filterType, 0, 3);
  if (cfg.filterCutoff    !== undefined) patch[t(tb, 20)] = clamp(cfg.filterCutoff);
  if (cfg.filterResonance !== undefined) patch[t(tb, 21)] = clamp(cfg.filterResonance);
  if (cfg.filterEgInt     !== undefined) patch[t(tb, 22)] = 64 + clamp(cfg.filterEgInt, -63, 63);

  // AMP
  if (cfg.ampLevel !== undefined) patch[t(tb, 25)] = clamp(cfg.ampLevel);

  // Filter EG
  if (cfg.filterAttack  !== undefined) patch[t(tb, 30)] = clamp(cfg.filterAttack);
  if (cfg.filterDecay   !== undefined) patch[t(tb, 31)] = clamp(cfg.filterDecay);
  if (cfg.filterSustain !== undefined) patch[t(tb, 32)] = clamp(cfg.filterSustain);
  if (cfg.filterRelease !== undefined) patch[t(tb, 33)] = clamp(cfg.filterRelease);

  // Amp EG
  if (cfg.ampAttack  !== undefined) patch[t(tb, 34)] = clamp(cfg.ampAttack);
  if (cfg.ampDecay   !== undefined) patch[t(tb, 35)] = clamp(cfg.ampDecay);
  if (cfg.ampSustain !== undefined) patch[t(tb, 36)] = clamp(cfg.ampSustain);
  if (cfg.ampRelease !== undefined) patch[t(tb, 37)] = clamp(cfg.ampRelease);

  // LFO1
  if (cfg.lfo1Wave !== undefined) patch[t(tb, 38)] = clamp(cfg.lfo1Wave, 0, 3);
  if (cfg.lfo1Rate !== undefined) patch[t(tb, 39)] = clamp(cfg.lfo1Rate);

  // LFO2
  if (cfg.lfo2Wave !== undefined) patch[t(tb, 41)] = clamp(cfg.lfo2Wave, 0, 3);
  if (cfg.lfo2Rate !== undefined) patch[t(tb, 42)] = clamp(cfg.lfo2Rate);

  // Keyboard Octave (byte 37): 0=normal, -1=0x7F, encoding: low 7 bits of value
  if (cfg.kbdOctave !== undefined) patch[37] = cfg.kbdOctave & 0x7F;

  // Virtual Patches
  if (cfg.vp1Src !== undefined && cfg.vp1Dst !== undefined) {
    patch[t(tb, 44)] = (clamp(cfg.vp1Dst, 0, 15) << 4) | clamp(cfg.vp1Src, 0, 15);
    patch[t(tb, 45)] = 64 + clamp(cfg.vp1Int || 0, -63, 63);
  }
  if (cfg.vp2Src !== undefined && cfg.vp2Dst !== undefined) {
    patch[t(tb, 46)] = (clamp(cfg.vp2Dst, 0, 15) << 4) | clamp(cfg.vp2Src, 0, 15);
    patch[t(tb, 47)] = 64 + clamp(cfg.vp2Int || 0, -63, 63);
  }

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
    const patchCfg = i < 128 ? { kbdOctave: -1, ...cfg } : cfg;
    allRaw.set(createPatch(patchCfg.name, patchCfg), i * PATCH_SIZE);
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
