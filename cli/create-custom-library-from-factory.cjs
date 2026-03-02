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

  // Name: 12 bytes, space-padded
  const nameBytes = Buffer.from(name.padEnd(12, ' ').slice(0, 12), 'ascii');
  for (let i = 0; i < 12; i++) patch[i] = nameBytes[i];

  // Global: single voice, no arp, flat EQ
  patch[P.VOICE_MODE] = 0;          // Single voice
  patch[P.EQ_HI_GAIN] = 64;         // 0 dB
  patch[P.EQ_LOW_GAIN] = 64;        // 0 dB
  patch[P.ARP_TEMPO_MSB] = 0;
  patch[P.ARP_TEMPO_LSB] = 120;     // 120 BPM

  // Optional global delay
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
  patch[t(tb, 5)]  = 64;             // Transpose = 0
  patch[t(tb, 7)]  = cfg.osc1Wave  !== undefined ? clamp(cfg.osc1Wave, 0, 7) : 0;  // Saw
  patch[t(tb, 8)]  = cfg.osc1Ctrl1 !== undefined ? clamp(cfg.osc1Ctrl1) : 0;
  patch[t(tb, 9)]  = cfg.osc1Ctrl2 !== undefined ? clamp(cfg.osc1Ctrl2) : 0;
  patch[t(tb, 12)] = cfg.osc2Mod   !== undefined ? clamp(cfg.osc2Mod, 0, 3) << 4 : 0;
  patch[t(tb, 13)] = 64 + clamp(cfg.osc2Semi || 0, -24, 24); // Semitone offset from center
  patch[t(tb, 14)] = 64;             // OSC2 Tune = 0
  patch[t(tb, 15)] = cfg.portamento !== undefined ? clamp(cfg.portamento) : 0;
  patch[t(tb, 16)] = cfg.osc1Level  !== undefined ? clamp(cfg.osc1Level)  : 100; // OSC1 Level
  patch[t(tb, 17)] = cfg.osc2Level  !== undefined ? clamp(cfg.osc2Level)  : 0;
  patch[t(tb, 18)] = cfg.noiseLevel !== undefined ? clamp(cfg.noiseLevel) : 0;
  patch[t(tb, 19)] = cfg.filterType !== undefined ? clamp(cfg.filterType, 0, 3) : 0;
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
// VP sources: 0=EG1, 1=EG2, 2=LFO1, 3=LFO2, 4=Velocity, 5=KBD Track, 6=PBend, 7=Mod
// VP destinations: 0=Pitch, 1=OSC2 Pitch, 2=OSC1 Ctrl1, 3=Noise Level, 4=Cutoff, 5=AMP, 6=Pan, 7=LFO2 Freq

const patches = [
  // ── BASSES (32) ─────────────────────────────────────────────────────────
  { name: 'Deep Sub',        osc1Wave:0, osc1Level:110, filterCutoff:60,  filterResonance:20, ampAttack:3,  ampDecay:60,  ampSustain:80,  ampRelease:40  },
  { name: 'Punchy 808',      osc1Wave:0, osc1Level:110, filterCutoff:100, filterResonance:30, ampAttack:1,  ampDecay:30,  ampSustain:60,  ampRelease:20, filterEgInt:40 },
  { name: 'Acid Squelch',    osc1Wave:0, osc1Level:100, filterCutoff:50,  filterResonance:90, ampAttack:1,  ampDecay:40,  ampSustain:70,  ampRelease:30, filterEgInt:60, filterDecay:30 },
  { name: 'Wobble Bass',     osc1Wave:0, osc1Level:100, filterCutoff:70,  filterResonance:60, lfo1Rate:40,  vp1Src:2, vp1Dst:4, vp1Int:50, ampSustain:100 },
  { name: 'Reese Bass',      osc1Wave:0, osc2Level:80,  osc1Level:80,  osc2Semi:12, filterCutoff:80, filterResonance:70, ampSustain:100, lfo1Rate:20, vp1Src:2, vp1Dst:0, vp1Int:15 },
  { name: 'Synth Bass',      osc1Wave:0, osc1Level:110, filterCutoff:100, filterResonance:50, filterEgInt:50, filterDecay:30, ampAttack:1, ampSustain:90 },
  { name: 'Dub Bass',        osc1Wave:0, osc1Level:100, filterCutoff:70,  filterResonance:30, delayTime:50, delayDepth:40, ampDecay:80,  ampSustain:60  },
  { name: 'Industrial',      osc1Wave:1, osc1Level:110, filterCutoff:60,  filterResonance:100, ampAttack:2, ampDecay:40,  ampSustain:50  },
  { name: 'Cyber Sub',       osc1Wave:0, osc2Level:60,  osc1Level:100, osc2Semi:-12, filterCutoff:50, filterResonance:80, ampSustain:100 },
  { name: 'Smooth Low',      osc1Wave:2, osc1Level:100, filterCutoff:80,  filterResonance:20, ampAttack:10, ampSustain:100, ampRelease:40 },
  { name: 'Plucky Bass',     osc1Wave:0, osc1Level:110, filterCutoff:110, filterResonance:40, filterEgInt:50, filterDecay:20, ampAttack:1, ampDecay:25, ampSustain:0 },
  { name: 'Analog Warmth',   osc1Wave:0, osc2Level:40,  osc1Level:100, osc2Semi:12, filterCutoff:75, filterResonance:25, ampSustain:100 },
  { name: 'Bouncy Sub',      osc1Wave:0, osc1Level:110, filterCutoff:90,  filterResonance:50, filterEgInt:40, filterDecay:25, ampDecay:35, ampSustain:50 },
  { name: 'Filter Sweep',    osc1Wave:0, osc1Level:100, filterCutoff:30,  filterResonance:70, filterEgInt:80, filterAttack:5, filterDecay:60, ampSustain:90 },
  { name: 'Psychedelic',     osc1Wave:1, osc1Level:90,  filterCutoff:50,  filterResonance:90, lfo1Rate:80, vp1Src:2, vp1Dst:4, vp1Int:60, ampSustain:80 },
  { name: 'Dark Sub',        osc1Wave:0, osc1Level:110, filterCutoff:40,  filterResonance:50, ampAttack:3,  ampSustain:100, ampRelease:50 },
  { name: 'Bright Punch',    osc1Wave:0, osc1Level:110, filterCutoff:120, filterResonance:40, filterEgInt:30, ampAttack:1, ampDecay:30, ampSustain:0 },
  { name: 'Wobbling FM',     osc1Wave:1, osc2Level:60,  osc1Level:80,  filterCutoff:80, filterResonance:80, lfo1Rate:50, vp1Src:2, vp1Dst:4, vp1Int:50 },
  { name: 'Velvet Bass',     osc1Wave:2, osc2Level:50,  osc1Level:90,  filterCutoff:90,  filterResonance:20, ampSustain:100, delayTime:30, delayDepth:25 },
  { name: 'Aggressive',      osc1Wave:1, osc1Level:110, filterCutoff:60,  filterResonance:110, filterEgInt:50, filterDecay:25, ampAttack:2 },
  { name: 'Sidechain Ready', osc1Wave:0, osc1Level:110, filterCutoff:90,  filterResonance:40, ampAttack:5,  ampDecay:30,  ampSustain:70, ampRelease:20 },
  { name: 'Subby Fat',       osc1Wave:0, osc2Level:50,  osc1Level:100, osc2Semi:-12, filterCutoff:55, filterResonance:60, ampSustain:100 },
  { name: 'Rubbery',         osc1Wave:0, osc1Level:100, filterCutoff:80,  filterResonance:60, filterEgInt:60, filterAttack:2, filterDecay:40, ampSustain:90 },
  { name: 'Hypnotic',        osc1Wave:0, osc2Level:30,  osc1Level:100, filterCutoff:60, filterResonance:80, lfo1Rate:35, vp1Src:2, vp1Dst:4, vp1Int:55, delayDepth:40 },
  { name: 'Glassy Bass',     osc1Wave:2, osc1Level:100, filterCutoff:110, filterResonance:50, ampAttack:5, ampDecay:40, ampSustain:60, ampRelease:30 },
  { name: 'Heavy Low',       osc1Wave:0, osc2Level:70,  osc1Level:110, osc2Semi:12, filterCutoff:35, filterResonance:70, ampSustain:100 },
  { name: 'Analog Buzz',     osc1Wave:1, osc1Level:100, filterCutoff:70,  filterResonance:90, filterEgInt:45, filterDecay:30, ampSustain:80 },
  { name: 'Mysterious',      osc1Wave:0, osc1Level:90,  filterCutoff:65,  filterResonance:60, filterEgInt:70, filterAttack:3, filterDecay:60, lfo1Rate:20, vp1Src:2, vp1Dst:4, vp1Int:30 },
  { name: 'Pulsing Low',     osc1Wave:1, osc1Level:100, filterCutoff:75,  filterResonance:70, filterEgInt:55, filterDecay:35, lfo1Rate:30, vp1Src:1, vp1Dst:4, vp1Int:40 },
  { name: 'Analog Dream',    osc1Wave:0, osc2Level:60,  osc1Level:90,  osc2Semi:7, filterCutoff:85, filterResonance:45, ampSustain:100, delayTime:40, delayDepth:35 },
  { name: 'Retro Sub',       osc1Wave:0, osc1Level:110, filterCutoff:50,  filterResonance:30, ampAttack:1, ampDecay:70, ampSustain:80, ampRelease:60 },
  { name: 'Groove Bass',     osc1Wave:0, osc1Level:110, filterCutoff:95,  filterResonance:55, filterEgInt:45, filterDecay:20, ampAttack:2, ampSustain:90 },

  // ── KEYS (16) ────────────────────────────────────────────────────────────
  { name: 'E.Piano Warm',    osc1Wave:5, osc1Level:100, filterCutoff:90,  filterResonance:20, ampAttack:5,  ampDecay:40, ampSustain:70, ampRelease:40, delayTime:40, delayDepth:20 },
  { name: 'Bright Bell',     osc1Wave:3, osc1Level:100, filterCutoff:110, filterResonance:30, filterEgInt:40, ampAttack:2, ampDecay:50, ampSustain:0 },
  { name: 'Organ Deep',      osc1Wave:2, osc2Level:80,  osc1Level:90,  filterCutoff:100, ampSustain:127, delayTime:30, delayDepth:25 },
  { name: 'Rhodes Lush',     osc1Wave:5, osc1Level:100, filterCutoff:95,  filterResonance:25, ampAttack:3, ampDecay:50, ampSustain:70, ampRelease:50, delayTime:50, delayDepth:30 },
  { name: 'Vibraphone',      osc1Wave:3, osc1Level:110, filterCutoff:100, ampAttack:2, ampDecay:30, ampSustain:0, ampRelease:40, lfo1Rate:50, vp1Src:2, vp1Dst:5, vp1Int:20 },
  { name: 'Harpsichord',     osc1Wave:1, osc1Level:110, filterCutoff:110, filterResonance:20, filterEgInt:30, ampAttack:1, ampDecay:60, ampSustain:0 },
  { name: 'Clavichord',      osc1Wave:1, osc1Level:100, filterCutoff:105, filterResonance:25, filterEgInt:40, ampAttack:1, ampDecay:45, ampSustain:0, ampRelease:20 },
  { name: 'Synth Keys',      osc1Wave:0, osc2Level:50,  osc1Level:90,  osc2Semi:12, filterCutoff:90, filterResonance:50, filterEgInt:50, filterDecay:30, ampSustain:90 },
  { name: 'Mellow Keys',     osc1Wave:2, osc1Level:100, filterCutoff:75,  filterResonance:20, ampAttack:8, ampSustain:90, ampRelease:60, delayTime:40, delayDepth:30 },
  { name: 'Bright Keys',     osc1Wave:0, osc1Level:110, filterCutoff:120, filterResonance:40, filterEgInt:35, ampAttack:3, ampSustain:90 },
  { name: 'Soft Bell',       osc1Wave:3, osc1Level:90,  filterCutoff:90,  ampAttack:6, ampDecay:55, ampSustain:0, ampRelease:50, delayTime:45, delayDepth:30 },
  { name: 'Warm Pad Keys',   osc1Wave:2, osc1Level:100, filterCutoff:80,  filterResonance:20, ampAttack:12, ampSustain:100, ampRelease:60, delayTime:50, delayDepth:35 },
  { name: 'Electric Piano',  osc1Wave:5, osc1Level:100, filterCutoff:100, filterResonance:30, ampDecay:40, ampSustain:70, ampRelease:40, delayTime:40, delayDepth:25 },
  { name: 'Twinkle Keys',    osc1Wave:3, osc1Level:100, filterCutoff:105, filterResonance:25, filterEgInt:35, ampAttack:4, ampDecay:30, ampSustain:50, delayTime:35, delayDepth:30 },
  { name: 'Rich Strings',    osc1Wave:0, osc2Level:70,  osc1Level:90,  osc2Semi:12, filterCutoff:85, ampAttack:18, ampSustain:100, ampRelease:60 },
  { name: 'Modern Synth',    osc1Wave:0, osc2Level:60,  osc1Level:90,  filterCutoff:95, filterResonance:50, filterEgInt:45, filterDecay:25, ampSustain:90 },

  // ── PADS (16) ────────────────────────────────────────────────────────────
  { name: 'Ambient Drift',   osc1Wave:2, osc2Level:50, osc1Level:90,  filterCutoff:70,  filterResonance:25, ampAttack:25, ampSustain:100, ampRelease:80, delayTime:60, delayDepth:50 },
  { name: 'Ethereal Float',  osc1Wave:3, osc1Level:90,  filterCutoff:75,  filterResonance:20, ampAttack:30, ampSustain:100, ampRelease:90, delayTime:70, delayDepth:55, lfo1Rate:15, vp1Src:2, vp1Dst:4, vp1Int:20 },
  { name: 'Lush Swell',      osc1Wave:2, osc2Level:60, osc1Level:90,  filterCutoff:80,  filterResonance:20, ampAttack:20, ampSustain:100, ampRelease:80, delayTime:55, delayDepth:45 },
  { name: 'Evolving Pad',    osc1Wave:2, osc1Level:90,  filterCutoff:65,  filterResonance:25, filterEgInt:50, filterAttack:15, filterDecay:60, ampAttack:22, ampSustain:100, ampRelease:90 },
  { name: 'Atmospheric',     osc1Wave:3, osc1Level:85,  filterCutoff:70,  filterResonance:15, ampAttack:25, ampSustain:100, ampRelease:100, delayTime:65, delayDepth:55, lfo1Rate:10, vp1Src:2, vp1Dst:4, vp1Int:25 },
  { name: 'Resonant Bloom',  osc1Wave:2, osc1Level:90,  filterCutoff:85,  filterResonance:50, filterEgInt:40, filterAttack:10, filterDecay:55, ampAttack:18, ampSustain:100 },
  { name: 'Floating Cloud',  osc1Wave:2, osc2Level:55, osc1Level:85,  filterCutoff:75,  filterResonance:15, ampAttack:35, ampSustain:100, ampRelease:100, delayTime:70, delayDepth:50 },
  { name: 'Shimmering',      osc1Wave:3, osc1Level:90,  filterCutoff:90,  filterResonance:30, ampAttack:20, ampSustain:100, ampRelease:80, lfo1Rate:40, vp1Src:2, vp1Dst:5, vp1Int:20, delayTime:50, delayDepth:40 },
  { name: 'Deep Space',      osc1Wave:2, osc1Level:85,  filterCutoff:60,  filterResonance:20, ampAttack:28, ampSustain:100, ampRelease:100, delayTime:75, delayDepth:60, lfo1Rate:8, vp1Src:2, vp1Dst:4, vp1Int:30 },
  { name: 'Liquid Smooth',   osc1Wave:2, osc2Level:60, osc1Level:90,  filterCutoff:80,  filterResonance:25, filterEgInt:30, filterAttack:10, ampAttack:20, ampSustain:100, delayTime:55, delayDepth:45 },
  { name: 'Glowing Pad',     osc1Wave:3, osc1Level:90,  filterCutoff:85,  filterResonance:30, ampAttack:18, ampSustain:100, ampRelease:80, lfo1Rate:30, vp1Src:2, vp1Dst:4, vp1Int:25, delayTime:45, delayDepth:35 },
  { name: 'Swelling Chorus', osc1Wave:2, osc2Level:70, osc1Level:85,  filterCutoff:80,  filterResonance:20, ampAttack:25, ampSustain:100, ampRelease:90, lfo1Rate:45, vp1Src:2, vp1Dst:5, vp1Int:25 },
  { name: 'Dreamy',          osc1Wave:3, osc1Level:85,  filterCutoff:70,  filterResonance:15, filterEgInt:35, filterAttack:12, filterDecay:50, ampAttack:30, ampSustain:100, ampRelease:90, delayTime:65, delayDepth:55 },
  { name: 'Harmonic Wash',   osc1Wave:2, osc2Level:55, osc1Level:90,  filterCutoff:75,  filterResonance:35, ampAttack:20, ampSustain:100, delayTime:55, delayDepth:45, lfo1Rate:20, vp1Src:2, vp1Dst:4, vp1Int:20 },
  { name: 'Floating Veil',   osc1Wave:2, osc1Level:80,  filterCutoff:65,  filterResonance:15, ampAttack:35, ampSustain:100, ampRelease:110, delayTime:70, delayDepth:60 },
  { name: 'Crystalline',     osc1Wave:3, osc1Level:95,  filterCutoff:90,  filterResonance:45, ampAttack:15, ampDecay:60, ampSustain:60, ampRelease:50, lfo1Rate:50, vp1Src:2, vp1Dst:5, vp1Int:25 },

  // ── PSY FX (64) ──────────────────────────────────────────────────────────
  // Bubbles ×8
  ...Array.from({length:8}, (_, i) => ({ name: `Bubble ${i+1}`,    osc1Wave:0, osc1Level:90, filterCutoff:60+i*7, filterResonance:90+i*3, lfo1Rate:50+i*8, vp1Src:2, vp1Dst:4, vp1Int:50+i*4, delayTime:30+i*5, delayDepth:30+i*3 })),
  // Resonant ×8
  ...Array.from({length:8}, (_, i) => ({ name: `Resonant ${i+1}`,  osc1Wave:1, osc1Level:90, filterCutoff:70+i*5, filterResonance:80+i*5, filterEgInt:50+i*5, filterDecay:30-i*2, lfo1Rate:40+i*7, vp1Src:1, vp1Dst:4, vp1Int:50+i*4 })),
  // Spiral ×8
  ...Array.from({length:8}, (_, i) => ({ name: `Spiral ${i+1}`,    osc1Wave:2, osc2Level:50, osc1Level:90, osc2Semi:7+i, filterCutoff:50+i*8, filterResonance:75+i*5, lfo1Rate:60+i*6, vp1Src:2, vp1Dst:4, vp1Int:55+i*4, delayTime:40+i*5, delayDepth:35+i*4 })),
  // Modulation ×8
  ...Array.from({length:8}, (_, i) => ({ name: `Modulation ${i+1}`,osc1Wave:i%3, osc2Level:60, osc1Level:85, filterCutoff:65+i*6, filterResonance:70+i*5, lfo1Rate:70+i*5, vp1Src:2, vp1Dst:2, vp1Int:50+i*5, lfo2Rate:40+i*5, vp2Src:3, vp2Dst:4, vp2Int:40+i*4 })),
  // Sweep ×8
  ...Array.from({length:8}, (_, i) => ({ name: `Sweep ${i+1}`,     osc1Wave:0, osc1Level:100, filterCutoff:40+i*10, filterResonance:60+i*5, filterEgInt:60+i*5, filterAttack:5+i*2, filterDecay:50+i*3, lfo1Rate:30+i*6, vp1Src:1, vp1Dst:4, vp1Int:55+i*4 })),
  // Granular ×8
  ...Array.from({length:8}, (_, i) => ({ name: `Granular ${i+1}`,  osc1Wave:6, osc1Level:90, filterCutoff:60+i*7, filterResonance:65+i*6, lfo1Rate:80+i*5, vp1Src:2, vp1Dst:2, vp1Int:50+i*5, ampDecay:40+i*5, ampSustain:60-i*3 })),
  // Delay ×8
  ...Array.from({length:8}, (_, i) => ({ name: `Delay ${i+1}`,     osc1Wave:2, osc1Level:90, filterCutoff:70+i*6, filterResonance:30+i*4, delayTime:20+i*8, delayDepth:60+i*6, lfo1Rate:25+i*5, vp1Src:2, vp1Dst:4, vp1Int:30+i*4 })),
  // Alien Sci-Fi ×8
  ...Array.from({length:8}, (_, i) => ({ name: `Alien SCI-Fi ${i+1}`, osc1Wave:1, osc2Level:70, osc1Level:90, osc2Semi:-12+i*3, filterCutoff:50+i*8, filterResonance:90+i*3, lfo1Rate:90-i*6, vp1Src:2, vp1Dst:0, vp1Int:40+i*5, lfo2Rate:60+i*5, vp2Src:3, vp2Dst:4, vp2Int:50+i*4 })),
];

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
  // Load factory bank B from saved dump (patches 128-255, intact from device)
  const bankBPath = 'patches/factory-bank-b.bin';
  if (!fs.existsSync(bankBPath)) {
    console.error('❌ patches/factory-bank-b.bin not found.');
    console.error('   Run the dump capture first via midi-tool/index.html to get factory bank B.');
    process.exit(1);
  }
  const factoryBankB = fs.readFileSync(bankBPath);
  if (factoryBankB.length !== 128 * PATCH_SIZE) {
    console.error(`❌ factory-bank-b.bin wrong size: ${factoryBankB.length} (expected ${128 * PATCH_SIZE})`);
    process.exit(1);
  }

  // Build bank A (our 128 custom patches)
  const bankA = Buffer.alloc(128 * PATCH_SIZE);
  patches.forEach((cfg, i) => {
    bankA.set(createPatch(cfg.name, cfg), i * PATCH_SIZE);
  });

  // Combine: 256 patches = bank A + factory bank B
  const allRaw = Buffer.concat([bankA, factoryBankB]); // 65,024 bytes
  console.log(`Raw patch data: ${allRaw.length} bytes (${allRaw.length / PATCH_SIZE} patches)`);

  // 7-bit encode
  const encoded = encode7bit(allRaw);
  console.log(`7-bit encoded: ${encoded.length} bytes`);

  // microKORG S ALL DATA DUMP format: F0 42 30 00 01 40 50 [encoded] F7
  const header = Buffer.from([0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x50]);
  const footer = Buffer.from([0xF7]);
  const sysex  = Buffer.concat([header, encoded, footer]);

  const outFile = `patches/custom-library-${new Date().toISOString().split('T')[0]}.syx`;
  fs.writeFileSync(outFile, sysex);

  console.log(`\n✅ ${outFile}  (${sysex.length} bytes)`);
  console.log(`   Header: F0 42 30 00 01 40 50 — microKORG S native format`);
  console.log(`\nBank A (1–128) — Custom PSY/Electronic patches:`);
  console.log(`   1–32:  Basses`);
  console.log(`   33–48: Keys`);
  console.log(`   49–64: Pads`);
  console.log(`   65–128: PSY FX (Bubbles, Resonant, Spiral, Mod, Sweep, Granular, Delay, Alien)`);
  console.log(`\nBank B (129–256) — Factory presets (preserved from device dump)`);
  console.log(`\nSend with midi-tool/index.html in Chrome/Edge.`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
