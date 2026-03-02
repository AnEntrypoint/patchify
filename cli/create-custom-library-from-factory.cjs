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
  patch[t(tb, 12)] = (clamp(cfg.osc2Mod  || 0, 0, 3) << 4) | clamp(cfg.osc2Wave || 0, 0, 2);
  patch[t(tb, 13)] = 64 + clamp(cfg.osc2Semi || 0, -24, 24); // Semitone offset from center
  patch[t(tb, 14)] = 64 + clamp(cfg.osc2Tune || 0, -63, 63); // Fine tune ±63 cents
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

// osc1Wave: 0=Saw 1=Pulse 2=Tri 3=Sin 4=VoxWave 5=DWGS 6=Noise
// osc2Wave: 0=Saw 1=Square 2=Tri   osc2Mod: 0=Off 1=Ring 2=Sync 3=Ring+Sync
// VP Src: 0=EG1 1=EG2 2=LFO1 3=LFO2 4=Velocity 5=KBDTrack 6=PBend 7=Mod
// VP Dst: 0=Pitch 1=OSC2Pitch 2=OSC1Ctrl1 3=NoiseLvl 4=Cutoff 5=AMP 6=Pan 7=LFO2Freq
// filterType: 0=24LPF 1=12LPF 2=BPF 3=HPF
const patches = [

  // ── DEEP TECHNO BASSES (1–16) ────────────────────────────────────────────

  // 1. Sub Kick — pure sine sub, tight decay, the foundation
  { name: 'Sub Kick',
    osc1Wave:3, osc1Level:115,
    filterCutoff:50, filterResonance:10,
    ampAttack:0, ampDecay:35, ampSustain:60, ampRelease:25 },

  // 2. 303 Acid — the classic: saw, sharp filter EG, high resonance, portamento
  { name: '303 Acid',
    osc1Wave:0, osc1Level:110,
    filterCutoff:45, filterResonance:100, filterEgInt:55, filterAttack:0, filterDecay:28, filterSustain:0,
    portamento:20,
    ampAttack:0, ampDecay:30, ampSustain:80, ampRelease:20 },

  // 3. Reese Bass — detuned dual saws, beating together, classic jungle/techno
  { name: 'Reese Bass',
    osc1Wave:0, osc2Wave:0, osc2Tune:-7, osc1Level:95, osc2Level:95,
    filterCutoff:75, filterResonance:55,
    ampAttack:3, ampSustain:100, ampRelease:40 },

  // 4. Hoover — sync-detuned saw, heavy portamento, classic rave sub
  { name: 'Hoover',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Semi:0, osc2Tune:20, osc1Level:100, osc2Level:70,
    filterCutoff:80, filterResonance:60,
    portamento:35,
    ampAttack:2, ampSustain:100, ampRelease:50 },

  // 5. Dark Sub — minimal saw sub, very closed filter, sub-only feel
  { name: 'Dark Sub',
    osc1Wave:0, osc1Level:115,
    filterCutoff:38, filterResonance:30,
    ampAttack:3, ampSustain:100, ampRelease:50 },

  // 6. Techno Thud — punchy kick-bass hybrid, big transient, quick decay
  { name: 'Techno Thud',
    osc1Wave:0, osc1Level:115,
    filterCutoff:90, filterResonance:50, filterEgInt:45, filterAttack:0, filterDecay:22,
    ampAttack:0, ampDecay:28, ampSustain:0, ampRelease:15 },

  // 7. Acid Pulse — square wave acid, grittier than saw, hard-edged
  { name: 'Acid Pulse',
    osc1Wave:1, osc1Level:110,
    filterCutoff:40, filterResonance:110, filterEgInt:60, filterAttack:0, filterDecay:32, filterSustain:0,
    portamento:15,
    ampAttack:0, ampDecay:35, ampSustain:70, ampRelease:20 },

  // 8. Murky Sub — osc2 an octave down adds sub weight, dark and rolling
  { name: 'Murky Sub',
    osc1Wave:0, osc2Wave:0, osc2Semi:-12, osc1Level:90, osc2Level:70,
    filterCutoff:45, filterResonance:40,
    ampAttack:3, ampSustain:100, ampRelease:55 },

  // 9. Distorto — pulse wave with distortion enabled, industrial grind
  { name: 'Distorto',
    osc1Wave:1, osc1Level:110,
    filterCutoff:65, filterResonance:80, filterEgInt:40, filterDecay:25,
    ampAttack:1, ampSustain:85, ampRelease:30 },

  // 10. Modular Roll — LFO on cutoff creates hypnotic rolling movement
  { name: 'Modular Roll',
    osc1Wave:0, osc1Level:110,
    filterCutoff:60, filterResonance:70,
    lfo1Wave:2, lfo1Rate:38,
    vp1Src:2, vp1Dst:4, vp1Int:48,
    ampAttack:2, ampSustain:100, ampRelease:40 },

  // 11. Rubber Acid — slow portamento + EG filter, bendy and alive
  { name: 'Rubber Acid',
    osc1Wave:0, osc1Level:110,
    filterCutoff:50, filterResonance:90, filterEgInt:50, filterAttack:0, filterDecay:40, filterSustain:0,
    portamento:40,
    ampAttack:0, ampSustain:90, ampRelease:30 },

  // 12. Pump Ready — pre-shaped for sidechain pumping, quick attack, wide open
  { name: 'Pump Ready',
    osc1Wave:0, osc1Level:115,
    filterCutoff:95, filterResonance:25,
    ampAttack:8, ampDecay:50, ampSustain:80, ampRelease:30 },

  // 13. Sync Grunt — osc2 sync for that digital bite, harsh and driven
  { name: 'Sync Grunt',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:32, osc1Level:105, osc2Level:60,
    filterCutoff:70, filterResonance:75, filterEgInt:35, filterDecay:28,
    ampAttack:1, ampSustain:90, ampRelease:35 },

  // 14. Detroit Deep — slow filter sweep, warm, classic Motor City
  { name: 'Detroit Deep',
    osc1Wave:0, osc2Wave:2, osc2Tune:-5, osc1Level:100, osc2Level:50,
    filterCutoff:55, filterResonance:45,
    lfo1Wave:2, lfo1Rate:12,
    vp1Src:2, vp1Dst:4, vp1Int:30,
    ampAttack:3, ampSustain:100, ampRelease:60 },

  // 15. Minimal Saw — no frills, pure single saw, wide filter, full sustain
  { name: 'Minimal Saw',
    osc1Wave:0, osc1Level:110,
    filterCutoff:85, filterResonance:15,
    ampAttack:2, ampSustain:100, ampRelease:40 },

  // 16. TB Pluck — 303-style pluck, very short decay, accent feel
  { name: 'TB Pluck',
    osc1Wave:0, osc1Level:110,
    filterCutoff:60, filterResonance:95, filterEgInt:58, filterAttack:0, filterDecay:18, filterSustain:0,
    ampAttack:0, ampDecay:20, ampSustain:0, ampRelease:12 },


  // ── DEEP TECHNO LEADS / STABS (17–32) ────────────────────────────────────

  // 17. Sync Lead — hard sync OSC2, bright and serrated, classic techno lead
  { name: 'Sync Lead',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:28, osc1Level:100, osc2Level:55,
    filterCutoff:90, filterResonance:65, filterEgInt:40, filterDecay:30,
    ampAttack:1, ampDecay:50, ampSustain:80, ampRelease:30,
    delayTime:42, delayDepth:35 },

  // 18. Hard Stab — quick attack and decay, chordal techno stab character
  { name: 'Hard Stab',
    osc1Wave:0, osc2Wave:1, osc2Semi:7, osc1Level:100, osc2Level:60,
    filterCutoff:100, filterResonance:50, filterEgInt:30, filterDecay:20,
    ampAttack:0, ampDecay:22, ampSustain:0, ampRelease:15 },

  // 19. PWM Lead — pulse wave with LFO modulating pulse width (Ctrl1), rich chorus effect
  { name: 'PWM Lead',
    osc1Wave:1, osc1Level:105,
    filterCutoff:88, filterResonance:35,
    lfo1Wave:2, lfo1Rate:32,
    vp1Src:2, vp1Dst:2, vp1Int:40,
    ampAttack:5, ampSustain:100, ampRelease:35,
    delayTime:38, delayDepth:30 },

  // 20. Metal Stab — ring modulation makes it clangy and industrial
  { name: 'Metal Stab',
    osc1Wave:0, osc2Wave:0, osc2Mod:1, osc2Semi:5, osc1Level:100, osc2Level:80,
    filterCutoff:85, filterResonance:70, filterEgInt:35, filterDecay:25,
    ampAttack:0, ampDecay:28, ampSustain:0, ampRelease:18 },

  // 21. Techno Pluck — tight pluck, fast EG, snappy transient
  { name: 'Techno Pluck',
    osc1Wave:0, osc1Level:110,
    filterCutoff:95, filterResonance:55, filterEgInt:45, filterAttack:0, filterDecay:20, filterSustain:0,
    ampAttack:0, ampDecay:18, ampSustain:0, ampRelease:15 },

  // 22. Screech Lead — near-self-oscillating filter, pure resonance howl
  { name: 'Screech Lead',
    osc1Wave:0, osc1Level:90,
    filterCutoff:72, filterResonance:118, filterEgInt:45, filterDecay:35,
    ampAttack:2, ampDecay:45, ampSustain:70, ampRelease:30 },

  // 23. Noise Hit — white noise burst through high-res filter, percussive
  { name: 'Noise Hit',
    osc1Wave:6, osc1Level:105, noiseLevel:80,
    filterCutoff:80, filterResonance:75, filterEgInt:40, filterDecay:22,
    ampAttack:0, ampDecay:25, ampSustain:0, ampRelease:18 },

  // 24. Mono Lead — pure monophonic lead, slight filter resonance, expressive
  { name: 'Mono Lead',
    osc1Wave:0, osc1Level:110,
    filterCutoff:92, filterResonance:40, filterEgInt:28, filterDecay:30,
    portamento:10,
    ampAttack:3, ampSustain:100, ampRelease:35 },

  // 25. Detuned Saw — osc2 slightly sharp for fat chorus-width sound
  { name: 'Detuned Saw',
    osc1Wave:0, osc2Wave:0, osc2Tune:12, osc1Level:95, osc2Level:95,
    filterCutoff:88, filterResonance:30,
    ampAttack:4, ampSustain:100, ampRelease:40,
    delayTime:35, delayDepth:28 },

  // 26. Dark Lead — low filter, melancholic, Berghain-esque
  { name: 'Dark Lead',
    osc1Wave:0, osc1Level:105,
    filterCutoff:62, filterResonance:50, filterEgInt:30, filterDecay:40,
    ampAttack:4, ampSustain:90, ampRelease:50,
    delayTime:50, delayDepth:40 },

  // 27. S&H Glitch — sample-and-hold LFO on pitch, unpredictable bleeps
  { name: 'S&H Glitch',
    osc1Wave:1, osc1Level:100,
    filterCutoff:85, filterResonance:60,
    lfo1Wave:3, lfo1Rate:75,
    vp1Src:2, vp1Dst:0, vp1Int:35,
    ampAttack:1, ampDecay:30, ampSustain:60, ampRelease:20 },

  // 28. Laser Drop — pitch envelope falls sharply, sci-fi laser
  { name: 'Laser Drop',
    osc1Wave:0, osc1Level:105,
    filterCutoff:100, filterResonance:55,
    vp1Src:1, vp1Dst:0, vp1Int:-50,
    ampAttack:0, ampDecay:25, ampSustain:0, ampRelease:20 },

  // 29. Trance Gate — LFO on amp creates rhythmic gating at medium rate
  { name: 'Trance Gate',
    osc1Wave:0, osc2Wave:0, osc2Tune:-8, osc1Level:100, osc2Level:100,
    filterCutoff:90, filterResonance:35,
    lfo1Wave:1, lfo1Rate:62,
    vp1Src:2, vp1Dst:5, vp1Int:50,
    ampAttack:2, ampSustain:100, ampRelease:30 },

  // 30. Pitch Fall — EG2 on pitch, dramatic drop on note trigger
  { name: 'Pitch Fall',
    osc1Wave:0, osc1Level:110,
    filterCutoff:80, filterResonance:55,
    vp1Src:0, vp1Dst:0, vp1Int:-42,
    ampAttack:0, ampDecay:35, ampSustain:50, ampRelease:30 },

  // 31. Techno Chord — wide detuned lead for background chords
  { name: 'Techno Chord',
    osc1Wave:0, osc2Wave:2, osc2Semi:7, osc2Tune:8, osc1Level:95, osc2Level:80,
    filterCutoff:80, filterResonance:30,
    ampAttack:8, ampSustain:100, ampRelease:60,
    delayTime:45, delayDepth:38 },

  // 32. Acid Sine — sine into high-resonance filter, smooth acid
  { name: 'Acid Sine',
    osc1Wave:3, osc1Level:110,
    filterCutoff:48, filterResonance:105, filterEgInt:55, filterAttack:0, filterDecay:30, filterSustain:0,
    portamento:18,
    ampAttack:0, ampSustain:90, ampRelease:25 },


  // ── G-FUNK BASSES (33–48) ─────────────────────────────────────────────────

  // 33. G-Funk Sub — warm sine sub, the foundation of west coast bass
  { name: 'G-Funk Sub',
    osc1Wave:3, osc2Wave:0, osc2Semi:-12, osc1Level:110, osc2Level:35,
    filterCutoff:62, filterResonance:20,
    ampAttack:5, ampSustain:100, ampRelease:60,
    delayTime:30, delayDepth:18 },

  // 34. Parliament Bass — envelope-filter saw bass, funky and self-cleaning
  { name: 'Parliament',
    osc1Wave:0, osc1Level:110,
    filterCutoff:35, filterResonance:75, filterEgInt:60, filterAttack:0, filterDecay:45, filterSustain:0,
    ampAttack:2, ampSustain:90, ampRelease:45 },

  // 35. Lowrider — heavy and slow, sub weight with creeping portamento
  { name: 'Lowrider',
    osc1Wave:0, osc2Wave:2, osc2Semi:-12, osc1Level:105, osc2Level:55,
    filterCutoff:50, filterResonance:35,
    portamento:30,
    ampAttack:5, ampSustain:100, ampRelease:70 },

  // 36. Bounce Bass — quick filter snap creates rhythmic bounce
  { name: 'Bounce Bass',
    osc1Wave:0, osc1Level:110,
    filterCutoff:45, filterResonance:65, filterEgInt:55, filterAttack:0, filterDecay:35, filterSustain:20,
    ampAttack:1, ampDecay:40, ampSustain:70, ampRelease:30 },

  // 37. Slap Synth — percussive hit, fast amp decay, tight fingers
  { name: 'Slap Synth',
    osc1Wave:0, osc1Level:115,
    filterCutoff:105, filterResonance:45, filterEgInt:35, filterDecay:18,
    ampAttack:0, ampDecay:22, ampSustain:40, ampRelease:20 },

  // 38. Funk Wah — LFO envelope wah feel, the quintessential funk bass
  { name: 'Funk Wah',
    osc1Wave:0, osc1Level:110,
    filterCutoff:40, filterResonance:80, filterEgInt:58, filterAttack:0, filterDecay:50, filterSustain:0,
    lfo1Wave:2, lfo1Rate:22,
    vp1Src:2, vp1Dst:4, vp1Int:30,
    ampAttack:2, ampSustain:85, ampRelease:40 },

  // 39. Pocket Bass — medium filter, laid-back feel, no frills groove
  { name: 'Pocket Bass',
    osc1Wave:0, osc2Wave:2, osc2Tune:5, osc1Level:105, osc2Level:45,
    filterCutoff:72, filterResonance:30,
    ampAttack:3, ampSustain:100, ampRelease:50 },

  // 40. 808 Boom — 808-style pitched boom, sine with long decay
  { name: '808 Boom',
    osc1Wave:3, osc1Level:115,
    filterCutoff:55, filterResonance:15,
    vp1Src:1, vp1Dst:0, vp1Int:-25,
    ampAttack:0, ampDecay:80, ampSustain:50, ampRelease:60 },

  // 41. Compton Sub — west coast production sub, pure and deep
  { name: 'Compton Sub',
    osc1Wave:3, osc1Level:115,
    filterCutoff:48, filterResonance:10,
    ampAttack:3, ampSustain:100, ampRelease:55 },

  // 42. Portamento Funk — gliding bass with slow porta, Herbie Hancock style
  { name: 'Porta Funk',
    osc1Wave:0, osc1Level:105,
    filterCutoff:80, filterResonance:40, filterEgInt:35, filterDecay:40,
    portamento:45,
    ampAttack:4, ampSustain:100, ampRelease:50 },

  // 43. Phased Bass — phase LFO creates swirling motion
  { name: 'Phased Bass',
    osc1Wave:0, osc2Wave:0, osc2Tune:-3, osc1Level:95, osc2Level:95,
    filterCutoff:78, filterResonance:25,
    lfo1Wave:2, lfo1Rate:18,
    vp1Src:2, vp1Dst:6, vp1Int:35,
    ampAttack:5, ampSustain:100, ampRelease:55 },

  // 44. G Midrange — mid-cut eq feel, sits in the mix perfectly
  { name: 'G Midrange',
    osc1Wave:0, osc1Level:108,
    filterType:2, filterCutoff:75, filterResonance:50, filterEgInt:40, filterDecay:35,
    ampAttack:2, ampSustain:100, ampRelease:45 },

  // 45. Sticky Groove — slow filter EG, each note has a character
  { name: 'Sticky Groove',
    osc1Wave:0, osc1Level:108,
    filterCutoff:42, filterResonance:55, filterEgInt:50, filterAttack:2, filterDecay:55, filterSustain:20,
    ampAttack:3, ampSustain:90, ampRelease:50 },

  // 46. Pluck Funk — short pluck with bright tone, James Brown rhythm section
  { name: 'Pluck Funk',
    osc1Wave:0, osc1Level:112,
    filterCutoff:100, filterResonance:55, filterEgInt:40, filterAttack:0, filterDecay:22,
    ampAttack:0, ampDecay:30, ampSustain:0, ampRelease:20 },

  // 47. Snap Bass — finger snap bass, very short and crisp
  { name: 'Snap Bass',
    osc1Wave:0, osc1Level:115,
    filterCutoff:112, filterResonance:40, filterEgInt:30, filterDecay:15,
    ampAttack:0, ampDecay:18, ampSustain:0, ampRelease:12 },

  // 48. The Bump — iconic low-bass thud, NWA-era, deep and room-filling
  { name: 'The Bump',
    osc1Wave:3, osc2Wave:0, osc2Tune:-10, osc1Level:112, osc2Level:40,
    filterCutoff:55, filterResonance:22,
    ampAttack:0, ampDecay:50, ampSustain:65, ampRelease:40 },


  // ── G-FUNK LEADS / PADS (49–64) ──────────────────────────────────────────

  // 49. Whistle Lead — THE G-funk signature: sine + vibrato = Dr. Dre, Snoop, Nate Dogg
  { name: 'Whistle Lead',
    osc1Wave:3, osc1Level:110,
    filterCutoff:100, filterResonance:10,
    lfo2Wave:2, lfo2Rate:45,
    vp1Src:3, vp1Dst:0, vp1Int:22,
    portamento:12,
    ampAttack:8, ampSustain:100, ampRelease:45,
    delayTime:40, delayDepth:28 },

  // 50. Dog Whistle — higher register sine, fast vibrato, piercing
  { name: 'Dog Whistle',
    osc1Wave:3, osc1Level:108,
    filterCutoff:110, filterResonance:8,
    lfo2Wave:2, lfo2Rate:60,
    vp1Src:3, vp1Dst:0, vp1Int:30,
    portamento:8,
    ampAttack:5, ampSustain:100, ampRelease:35 },

  // 51. Squeal Lead — filter self-oscillation scream, West Coast attitude
  { name: 'Squeal Lead',
    osc1Wave:0, osc1Level:100,
    filterCutoff:68, filterResonance:115, filterEgInt:38, filterDecay:35,
    portamento:20,
    ampAttack:3, ampDecay:50, ampSustain:80, ampRelease:40,
    delayTime:38, delayDepth:30 },

  // 52. Talk Box — vowel formant sweep via filter, Roger Troutman style
  { name: 'Talk Box',
    osc1Wave:0, osc2Wave:1, osc2Semi:12, osc1Level:100, osc2Level:55,
    filterType:2, filterCutoff:65, filterResonance:85, filterEgInt:55, filterDecay:40,
    lfo1Wave:2, lfo1Rate:20,
    vp1Src:2, vp1Dst:4, vp1Int:40,
    portamento:15,
    ampAttack:5, ampSustain:95, ampRelease:40 },

  // 53. West Strings — slow-attack string pad, melodic cushion behind the beat
  { name: 'West Strings',
    osc1Wave:0, osc2Wave:0, osc2Tune:8, osc1Level:90, osc2Level:90,
    filterCutoff:78, filterResonance:20,
    ampAttack:22, ampSustain:100, ampRelease:75,
    delayTime:50, delayDepth:40 },

  // 54. Synth Strings — classic string pad, lush and full
  { name: 'Synth Strings',
    osc1Wave:0, osc2Wave:2, osc2Tune:6, osc1Level:90, osc2Level:80,
    filterCutoff:82, filterResonance:18,
    ampAttack:20, ampSustain:100, ampRelease:70,
    delayTime:55, delayDepth:45 },

  // 55. Smooth Pad — ultra-lush, no sharp edges, perfect for smooth rap intros
  { name: 'Smooth Pad',
    osc1Wave:2, osc2Wave:2, osc2Tune:9, osc1Level:90, osc2Level:85,
    filterCutoff:75, filterResonance:15,
    ampAttack:28, ampSustain:100, ampRelease:90,
    delayTime:60, delayDepth:48 },

  // 56. Moog Lead — classic moog-ish lead, warm 24dB filter, expressive
  { name: 'Moog Lead',
    osc1Wave:0, osc2Wave:0, osc2Semi:12, osc1Level:100, osc2Level:40,
    filterCutoff:85, filterResonance:60, filterEgInt:35, filterDecay:38,
    portamento:18,
    ampAttack:5, ampSustain:100, ampRelease:50 },

  // 57. Funky Clav — clavinet-style bright pluck, choppy rhythm feel
  { name: 'Funky Clav',
    osc1Wave:1, osc1Level:110,
    filterCutoff:105, filterResonance:50, filterEgInt:40, filterDecay:18,
    ampAttack:0, ampDecay:30, ampSustain:40, ampRelease:20 },

  // 58. Neon Pad — bright, modern R&B pad with shimmer
  { name: 'Neon Pad',
    osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:90, osc2Level:75,
    filterCutoff:88, filterResonance:30,
    lfo1Wave:2, lfo1Rate:20,
    vp1Src:2, vp1Dst:4, vp1Int:18,
    ampAttack:18, ampSustain:100, ampRelease:65,
    delayTime:45, delayDepth:38 },

  // 59. Velvet Lead — smooth lead, singing quality, perfect for melodies
  { name: 'Velvet Lead',
    osc1Wave:3, osc2Wave:0, osc2Semi:12, osc1Level:100, osc2Level:30,
    filterCutoff:90, filterResonance:25, filterEgInt:20, filterDecay:40,
    portamento:15,
    lfo2Wave:2, lfo2Rate:40,
    vp1Src:3, vp1Dst:0, vp1Int:15,
    ampAttack:6, ampSustain:100, ampRelease:50 },

  // 60. Sample Hold Funk — S&H modulation on filter, quirky rhythmic texture
  { name: 'S&H Funk',
    osc1Wave:0, osc1Level:105,
    filterCutoff:65, filterResonance:70,
    lfo1Wave:3, lfo1Rate:50,
    vp1Src:2, vp1Dst:4, vp1Int:45,
    ampAttack:3, ampSustain:90, ampRelease:35 },

  // 61. Slow Vibe — slow vibrato pad, melancholic and warm
  { name: 'Slow Vibe',
    osc1Wave:3, osc2Wave:2, osc2Tune:7, osc1Level:95, osc2Level:70,
    filterCutoff:80, filterResonance:15,
    lfo2Wave:2, lfo2Rate:25,
    vp1Src:3, vp1Dst:0, vp1Int:18,
    ampAttack:20, ampSustain:100, ampRelease:70,
    delayTime:48, delayDepth:35 },

  // 62. G-Chord — layered pad for chord stabs, thick and present
  { name: 'G-Chord',
    osc1Wave:0, osc2Wave:1, osc2Semi:7, osc2Tune:5, osc1Level:95, osc2Level:80,
    filterCutoff:85, filterResonance:25, filterEgInt:25, filterDecay:35,
    ampAttack:5, ampDecay:50, ampSustain:70, ampRelease:50,
    delayTime:40, delayDepth:30 },

  // 63. Warm Keys — smooth synth keys for melody, balanced tone
  { name: 'Warm Keys',
    osc1Wave:5, osc1Level:105,
    filterCutoff:92, filterResonance:22,
    ampAttack:5, ampDecay:45, ampSustain:75, ampRelease:50,
    delayTime:42, delayDepth:28 },

  // 64. Sunset Pad — ultra-warm long pad, cinematic G-funk backgrounds
  { name: 'Sunset Pad',
    osc1Wave:2, osc2Wave:2, osc2Tune:11, osc1Level:88, osc2Level:88,
    filterCutoff:70, filterResonance:18,
    ampAttack:35, ampSustain:100, ampRelease:100,
    delayTime:65, delayDepth:55 },


  // ── PSY BASSES (65–80) ────────────────────────────────────────────────────

  // 65. Goa Acid — fast LFO on cutoff, driving and hypnotic, classic Goa
  { name: 'Goa Acid',
    osc1Wave:0, osc1Level:112,
    filterCutoff:50, filterResonance:100, filterEgInt:55, filterDecay:25,
    lfo1Wave:2, lfo1Rate:72,
    vp1Src:2, vp1Dst:4, vp1Int:45,
    ampAttack:0, ampSustain:100, ampRelease:30 },

  // 66. Forest Bass — dark and rolling, psychedelic forest trance feel
  { name: 'Forest Bass',
    osc1Wave:0, osc2Wave:0, osc2Tune:-9, osc1Level:105, osc2Level:65,
    filterCutoff:48, filterResonance:80, filterEgInt:50, filterDecay:30,
    lfo1Wave:2, lfo1Rate:55,
    vp1Src:2, vp1Dst:4, vp1Int:40,
    ampAttack:0, ampSustain:100, ampRelease:35 },

  // 67. Full On — aggressive psy full-on bass, punching through a 4/4 kick
  { name: 'Full On',
    osc1Wave:0, osc1Level:115,
    filterCutoff:55, filterResonance:90, filterEgInt:58, filterAttack:0, filterDecay:28, filterSustain:0,
    ampAttack:0, ampDecay:35, ampSustain:60, ampRelease:25 },

  // 68. Morning Acid — brighter psy bass, morning set energy
  { name: 'Morning Acid',
    osc1Wave:0, osc1Level:108,
    filterCutoff:65, filterResonance:88, filterEgInt:50, filterDecay:28,
    lfo1Wave:2, lfo1Rate:45,
    vp1Src:2, vp1Dst:4, vp1Int:38,
    portamento:12,
    ampAttack:0, ampSustain:100, ampRelease:30 },

  // 69. Alien Bass — ring mod on osc creates inharmonic metallic tones
  { name: 'Alien Bass',
    osc1Wave:0, osc2Wave:0, osc2Mod:1, osc2Semi:4, osc1Level:100, osc2Level:75,
    filterCutoff:55, filterResonance:85, filterEgInt:50, filterDecay:30,
    lfo1Wave:2, lfo1Rate:60,
    vp1Src:2, vp1Dst:4, vp1Int:42,
    ampAttack:0, ampSustain:100, ampRelease:35 },

  // 70. Twister — LFO-modulated pitch + filter, spiraling psy effect
  { name: 'Twister',
    osc1Wave:0, osc2Wave:0, osc2Tune:-6, osc1Level:105, osc2Level:80,
    filterCutoff:52, filterResonance:95,
    lfo1Wave:2, lfo1Rate:65,
    vp1Src:2, vp1Dst:4, vp1Int:48,
    vp2Src:2, vp2Dst:0, vp2Int:12,
    ampAttack:0, ampSustain:100, ampRelease:35 },

  // 71. Dark Psy — dark minimal psy, almost drone-like, very low filter
  { name: 'Dark Psy',
    osc1Wave:0, osc2Wave:1, osc2Tune:-5, osc1Level:108, osc2Level:60,
    filterCutoff:38, filterResonance:70, filterEgInt:45, filterDecay:35,
    ampAttack:2, ampSustain:100, ampRelease:50 },

  // 72. Fractal — complex patch with dual VP routing, evolving texture
  { name: 'Fractal',
    osc1Wave:1, osc2Wave:2, osc2Tune:14, osc1Level:95, osc2Level:75,
    filterCutoff:50, filterResonance:95,
    lfo1Wave:2, lfo1Rate:70,
    vp1Src:2, vp1Dst:4, vp1Int:50,
    vp2Src:3, vp2Dst:2, vp2Int:30,
    lfo2Rate:40,
    ampAttack:0, ampSustain:100, ampRelease:40 },

  // 73. Psy Kick Sub — sub sine shaped to sit under kick, fast attack
  { name: 'Psy Kick Sub',
    osc1Wave:3, osc1Level:115,
    filterCutoff:52, filterResonance:12,
    ampAttack:0, ampDecay:45, ampSustain:55, ampRelease:30 },

  // 74. Terror Sync — sync bass with extreme detuning, aggressive psy
  { name: 'Terror Sync',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:40, osc1Level:108, osc2Level:50,
    filterCutoff:55, filterResonance:85, filterEgInt:48, filterDecay:28,
    ampAttack:0, ampSustain:100, ampRelease:30 },

  // 75. Wobble Psy — LFO wobble bass, Shpongle-style transitions
  { name: 'Wobble Psy',
    osc1Wave:0, osc1Level:110,
    filterCutoff:60, filterResonance:85,
    lfo1Wave:2, lfo1Rate:30,
    vp1Src:2, vp1Dst:4, vp1Int:55,
    ampAttack:2, ampSustain:100, ampRelease:45,
    delayTime:38, delayDepth:30 },

  // 76. Cosmic Sub — deep detuned layers, enormous and space-filling
  { name: 'Cosmic Sub',
    osc1Wave:0, osc2Wave:0, osc2Semi:-12, osc2Tune:-8, osc1Level:100, osc2Level:80,
    filterCutoff:42, filterResonance:30,
    ampAttack:5, ampSustain:100, ampRelease:65 },

  // 77. Resonant Drive — high filter resonance with EG drive, textural
  { name: 'Resonant Drv',
    osc1Wave:0, osc1Level:108,
    filterCutoff:45, filterResonance:108, filterEgInt:52, filterAttack:0, filterDecay:32, filterSustain:10,
    lfo1Wave:2, lfo1Rate:48,
    vp1Src:2, vp1Dst:4, vp1Int:35,
    ampAttack:0, ampSustain:100, ampRelease:40 },

  // 78. Suomi — Finnish underground psy sound, very tight and driving
  { name: 'Suomi',
    osc1Wave:0, osc2Wave:0, osc2Tune:5, osc1Level:108, osc2Level:85,
    filterCutoff:52, filterResonance:95, filterEgInt:55, filterDecay:26,
    ampAttack:0, ampSustain:100, ampRelease:25 },

  // 79. Gate Sub — LFO square on amp creates rhythmic gates in the sub
  { name: 'Gate Sub',
    osc1Wave:3, osc1Level:115,
    filterCutoff:50, filterResonance:18,
    lfo1Wave:1, lfo1Rate:55,
    vp1Src:2, vp1Dst:5, vp1Int:55,
    ampAttack:0, ampSustain:100, ampRelease:20 },

  // 80. Underground — deep, dense, subterranean — made for large systems
  { name: 'Underground',
    osc1Wave:0, osc2Wave:0, osc2Tune:-11, osc1Level:105, osc2Level:90,
    filterCutoff:40, filterResonance:60, filterEgInt:42, filterDecay:35,
    ampAttack:3, ampSustain:100, ampRelease:55 },


  // ── PSY LEADS / FX (81–96) ────────────────────────────────────────────────

  // 81. Psy Sync 1 — sync lead with filter modulation, classic Infected Mushroom
  { name: 'Psy Sync 1',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:25, osc1Level:105, osc2Level:55,
    filterCutoff:80, filterResonance:75, filterEgInt:45, filterDecay:35,
    ampAttack:2, ampDecay:50, ampSustain:80, ampRelease:35,
    delayTime:45, delayDepth:38 },

  // 82. Psy Lead Fast — fast LFO on pitch for trance-style melodies
  { name: 'Psy Lead Fast',
    osc1Wave:0, osc1Level:108,
    filterCutoff:88, filterResonance:55, filterEgInt:38, filterDecay:30,
    lfo1Wave:2, lfo1Rate:85,
    vp1Src:2, vp1Dst:0, vp1Int:20,
    ampAttack:2, ampSustain:100, ampRelease:35,
    delayTime:40, delayDepth:32 },

  // 83. Trance Sync — harder sync for full-power psy-trance drops
  { name: 'Trance Sync',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:38, osc1Level:108, osc2Level:60,
    filterCutoff:90, filterResonance:70, filterEgInt:40, filterDecay:28,
    ampAttack:1, ampDecay:45, ampSustain:85, ampRelease:30,
    delayTime:42, delayDepth:35 },

  // 84. Alien Squeal — resonance peak becomes the note, beyond self-oscillation
  { name: 'Alien Squeal',
    osc1Wave:6, osc1Level:80, noiseLevel:60,
    filterCutoff:72, filterResonance:122, filterEgInt:42, filterDecay:38,
    lfo1Wave:2, lfo1Rate:68,
    vp1Src:2, vp1Dst:4, vp1Int:30,
    ampAttack:3, ampDecay:45, ampSustain:70, ampRelease:35 },

  // 85. Tribal Stab — sharp ethnic percussion stab character, atonal hit
  { name: 'Tribal Stab',
    osc1Wave:0, osc2Wave:0, osc2Mod:1, osc2Semi:3, osc1Level:100, osc2Level:90,
    filterCutoff:90, filterResonance:65, filterEgInt:35, filterDecay:18,
    ampAttack:0, ampDecay:22, ampSustain:0, ampRelease:18 },

  // 86. Cosmic Ray — sweeping psy lead, EG on pitch + filter
  { name: 'Cosmic Ray',
    osc1Wave:0, osc1Level:108,
    filterCutoff:75, filterResonance:65, filterEgInt:48, filterDecay:40,
    vp1Src:0, vp1Dst:0, vp1Int:35,
    portamento:25,
    ampAttack:3, ampDecay:55, ampSustain:80, ampRelease:45,
    delayTime:50, delayDepth:42 },

  // 87. S&H Lead — unpredictable random lead, breakbeat glitch feel
  { name: 'S&H Lead',
    osc1Wave:1, osc1Level:105,
    filterCutoff:82, filterResonance:60,
    lfo1Wave:3, lfo1Rate:80,
    vp1Src:2, vp1Dst:0, vp1Int:40,
    vp2Src:2, vp2Dst:4, vp2Int:35,
    lfo2Rate:55,
    ampAttack:1, ampDecay:35, ampSustain:65, ampRelease:25 },

  // 88. Psy Pluck — fast-attack pluck into resonant filter, laser-tight
  { name: 'Psy Pluck',
    osc1Wave:0, osc1Level:110,
    filterCutoff:88, filterResonance:80, filterEgInt:50, filterAttack:0, filterDecay:22, filterSustain:0,
    ampAttack:0, ampDecay:25, ampSustain:0, ampRelease:18,
    delayTime:38, delayDepth:35 },

  // 89. Resonant Arc — slow filter sweep arc, meditative psy lead
  { name: 'Resonant Arc',
    osc1Wave:0, osc2Wave:2, osc2Tune:7, osc1Level:100, osc2Level:65,
    filterCutoff:55, filterResonance:100, filterEgInt:52, filterAttack:5, filterDecay:65,
    portamento:22,
    ampAttack:4, ampSustain:90, ampRelease:50,
    delayTime:55, delayDepth:45 },

  // 90. Morning Dew — gentle psy lead for sunrise sets, clean and dewey
  { name: 'Morning Dew',
    osc1Wave:3, osc2Wave:2, osc2Tune:9, osc1Level:100, osc2Level:55,
    filterCutoff:92, filterResonance:30, filterEgInt:25, filterDecay:35,
    lfo2Wave:2, lfo2Rate:35,
    vp1Src:3, vp1Dst:0, vp1Int:18,
    portamento:15,
    ampAttack:5, ampSustain:100, ampRelease:50,
    delayTime:45, delayDepth:35 },

  // 91. Spiral Lead — detuned sync + delay ping-pong, spiraling in space
  { name: 'Spiral Lead',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:22, osc1Level:100, osc2Level:60,
    filterCutoff:78, filterResonance:72, filterEgInt:40, filterDecay:32,
    ampAttack:2, ampSustain:90, ampRelease:40,
    delayTime:48, delayDepth:45 },

  // 92. Morph Lead — slow filter morph, shape-shifting psy lead
  { name: 'Morph Lead',
    osc1Wave:0, osc2Wave:1, osc2Tune:11, osc1Level:95, osc2Level:80,
    filterCutoff:55, filterResonance:90, filterEgInt:55, filterAttack:8, filterDecay:70,
    portamento:20,
    ampAttack:5, ampSustain:90, ampRelease:55,
    delayTime:50, delayDepth:40 },

  // 93. Warp Lead — pitch envelope + sync = warp drive sound
  { name: 'Warp Lead',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:18, osc1Level:105, osc2Level:65,
    filterCutoff:85, filterResonance:60,
    vp1Src:0, vp1Dst:0, vp1Int:40,
    ampAttack:1, ampDecay:40, ampSustain:80, ampRelease:35 },

  // 94. Thunder FX — low oscillation + noise for weather-like effect
  { name: 'Thunder FX',
    osc1Wave:2, osc1Level:90, noiseLevel:70,
    filterCutoff:40, filterResonance:55,
    lfo1Wave:3, lfo1Rate:12,
    vp1Src:2, vp1Dst:4, vp1Int:40,
    vp2Src:2, vp2Dst:3, vp2Int:50,
    lfo2Rate:20,
    ampAttack:10, ampSustain:100, ampRelease:80,
    delayTime:55, delayDepth:50 },

  // 95. Laser Beam — rising pitch sweep, classic psy build-up effect
  { name: 'Laser Beam',
    osc1Wave:0, osc1Level:110,
    filterCutoff:95, filterResonance:50,
    vp1Src:1, vp1Dst:0, vp1Int:55,
    ampAttack:0, ampDecay:40, ampSustain:0, ampRelease:25 },

  // 96. Alien Vox — vox wave through resonant filter, otherworldly voice
  { name: 'Alien Vox',
    osc1Wave:4, osc1Level:108,
    filterCutoff:72, filterResonance:88, filterEgInt:45, filterDecay:50,
    lfo1Wave:2, lfo1Rate:35,
    vp1Src:2, vp1Dst:4, vp1Int:35,
    portamento:20,
    ampAttack:5, ampSustain:90, ampRelease:55,
    delayTime:45, delayDepth:38 },


  // ── CROSS-GENRE UTILITY (97–128) ──────────────────────────────────────────

  // 97. Deep House — warm Chicago-style house bass, smooth and rolling
  { name: 'Deep House',
    osc1Wave:0, osc2Wave:2, osc2Tune:6, osc1Level:105, osc2Level:50,
    filterCutoff:68, filterResonance:35, filterEgInt:40, filterDecay:40,
    portamento:15,
    ampAttack:3, ampSustain:100, ampRelease:55,
    delayTime:35, delayDepth:22 },

  // 98. UK Garage — punchy, forward UK garage bass line character
  { name: 'UK Garage',
    osc1Wave:0, osc1Level:112,
    filterCutoff:78, filterResonance:60, filterEgInt:45, filterDecay:28,
    ampAttack:0, ampDecay:32, ampSustain:60, ampRelease:25 },

  // 99. Minimal Stab — sparse minimal techno stab, almost no sustain
  { name: 'Minimal Stab',
    osc1Wave:0, osc2Wave:1, osc2Semi:12, osc1Level:100, osc2Level:50,
    filterCutoff:95, filterResonance:45, filterEgInt:30, filterDecay:18,
    ampAttack:0, ampDecay:20, ampSustain:0, ampRelease:15 },

  // 100. TR-808 Style — pitched 808 boom, hip-hop essential
  { name: 'TR-808',
    osc1Wave:3, osc1Level:115,
    filterCutoff:50, filterResonance:8,
    vp1Src:1, vp1Dst:0, vp1Int:-30,
    ampAttack:0, ampDecay:90, ampSustain:50, ampRelease:65 },

  // 101. Rave Lead — 90s rave super-detuned lead, massive
  { name: 'Rave Lead',
    osc1Wave:0, osc2Wave:0, osc2Tune:14, osc1Level:100, osc2Level:100,
    filterCutoff:95, filterResonance:50, filterEgInt:35, filterDecay:30,
    ampAttack:2, ampSustain:100, ampRelease:40,
    delayTime:40, delayDepth:38 },

  // 102. Supersaw — stacked detuned oscillators, trance anthem wall of sound
  { name: 'Supersaw',
    osc1Wave:0, osc2Wave:0, osc2Tune:10, osc1Level:95, osc2Level:95,
    filterCutoff:90, filterResonance:25,
    lfo1Wave:2, lfo1Rate:25,
    vp1Src:2, vp1Dst:4, vp1Int:20,
    ampAttack:8, ampSustain:100, ampRelease:60,
    delayTime:50, delayDepth:45 },

  // 103. Trance Pad — classic soaring trance pad, huge and wide
  { name: 'Trance Pad',
    osc1Wave:0, osc2Wave:0, osc2Tune:12, osc1Level:90, osc2Level:90,
    filterCutoff:82, filterResonance:22,
    ampAttack:25, ampSustain:100, ampRelease:85,
    delayTime:60, delayDepth:55 },

  // 104. Cinematic — epic swelling orchestra replacement pad
  { name: 'Cinematic',
    osc1Wave:0, osc2Wave:2, osc2Tune:8, osc1Level:88, osc2Level:82,
    filterCutoff:70, filterResonance:18,
    ampAttack:35, ampSustain:100, ampRelease:100,
    delayTime:70, delayDepth:60 },

  // 105. Bass Drop — huge filter sweep down, festival drop moment
  { name: 'Bass Drop',
    osc1Wave:0, osc1Level:115,
    filterCutoff:100, filterResonance:70,
    vp1Src:1, vp1Dst:4, vp1Int:-55,
    ampAttack:0, ampDecay:80, ampSustain:60, ampRelease:50 },

  // 106. Perc Noise — noise burst tuned with filter, snap percussion
  { name: 'Perc Noise',
    osc1Wave:6, osc1Level:100, noiseLevel:90,
    filterCutoff:85, filterResonance:70, filterEgInt:40, filterDecay:18,
    ampAttack:0, ampDecay:20, ampSustain:0, ampRelease:15 },

  // 107. Bell Pad — pure bell decay into soft pad tail
  { name: 'Bell Pad',
    osc1Wave:3, osc2Wave:0, osc2Mod:1, osc2Semi:7, osc1Level:100, osc2Level:60,
    filterCutoff:95, filterResonance:35,
    ampAttack:0, ampDecay:60, ampSustain:25, ampRelease:80,
    delayTime:50, delayDepth:40 },

  // 108. Pluck Synth — bright plucked synth, versatile for any genre
  { name: 'Pluck Synth',
    osc1Wave:0, osc1Level:112,
    filterCutoff:105, filterResonance:50, filterEgInt:45, filterAttack:0, filterDecay:20, filterSustain:0,
    ampAttack:0, ampDecay:28, ampSustain:0, ampRelease:20 },

  // 109. Gate Pad — rhythmically gated pad, driving and trancey
  { name: 'Gate Pad',
    osc1Wave:0, osc2Wave:2, osc2Tune:9, osc1Level:90, osc2Level:85,
    filterCutoff:78, filterResonance:22,
    lfo1Wave:1, lfo1Rate:58,
    vp1Src:2, vp1Dst:5, vp1Int:50,
    ampAttack:5, ampSustain:100, ampRelease:40,
    delayTime:42, delayDepth:35 },

  // 110. Vowel Lead — formant-filtering creates vowel sweep lead
  { name: 'Vowel Lead',
    osc1Wave:0, osc1Level:108,
    filterType:2, filterCutoff:70, filterResonance:90, filterEgInt:50, filterDecay:45,
    portamento:20,
    lfo1Wave:2, lfo1Rate:22,
    vp1Src:2, vp1Dst:4, vp1Int:35,
    ampAttack:4, ampSustain:95, ampRelease:45 },

  // 111. Space Echo — ambient echo pad, floating and sparse
  { name: 'Space Echo',
    osc1Wave:2, osc2Wave:2, osc2Tune:10, osc1Level:85, osc2Level:80,
    filterCutoff:72, filterResonance:20,
    ampAttack:18, ampSustain:100, ampRelease:80,
    delayTime:68, delayDepth:58 },

  // 112. Atmosphere — dark ambient texture, slowly evolving
  { name: 'Atmosphere',
    osc1Wave:2, osc1Level:88,
    filterCutoff:58, filterResonance:25,
    lfo1Wave:2, lfo1Rate:8,
    vp1Src:2, vp1Dst:4, vp1Int:28,
    ampAttack:30, ampSustain:100, ampRelease:100,
    delayTime:72, delayDepth:62 },

  // 113. Future Bass — modern trap/future bass lead, wide with bite
  { name: 'Future Bass',
    osc1Wave:0, osc2Wave:0, osc2Tune:13, osc1Level:95, osc2Level:90,
    filterCutoff:88, filterResonance:40, filterEgInt:30, filterDecay:30,
    ampAttack:5, ampSustain:100, ampRelease:50,
    delayTime:38, delayDepth:30 },

  // 114. Arp Seed — clean mid tone, ideal for fast arpeggiator patterns
  { name: 'Arp Seed',
    osc1Wave:0, osc2Wave:2, osc2Semi:12, osc1Level:100, osc2Level:55,
    filterCutoff:92, filterResonance:30, filterEgInt:25, filterDecay:22,
    ampAttack:1, ampDecay:25, ampSustain:50, ampRelease:20 },

  // 115. Vintage Keys — warm vintage synth keys, Roland Juno character
  { name: 'Vintage Keys',
    osc1Wave:0, osc2Wave:0, osc2Tune:7, osc1Level:95, osc2Level:80,
    filterCutoff:85, filterResonance:28,
    lfo1Wave:2, lfo1Rate:30,
    vp1Src:2, vp1Dst:4, vp1Int:18,
    ampAttack:8, ampDecay:45, ampSustain:80, ampRelease:55,
    delayTime:40, delayDepth:28 },

  // 116. Riser — automated pitch + filter rise for buildups
  { name: 'Riser',
    osc1Wave:6, osc1Level:95, noiseLevel:65,
    filterCutoff:30, filterResonance:55,
    vp1Src:0, vp1Dst:4, vp1Int:58,
    vp2Src:0, vp2Dst:0, vp2Int:45,
    ampAttack:80, ampSustain:100, ampRelease:30 },

  // 117. Lo-Fi Sub — vinyl-ish dusty sub, boom-bap 90s hip-hop
  { name: 'Lo-Fi Sub',
    osc1Wave:3, osc2Wave:0, osc2Tune:-15, osc1Level:108, osc2Level:30,
    filterCutoff:52, filterResonance:18,
    ampAttack:3, ampSustain:100, ampRelease:55 },

  // 118. Vaporwave — slow detune drift, nostalgic dreamy synth
  { name: 'Vaporwave',
    osc1Wave:5, osc2Wave:0, osc2Tune:8, osc1Level:90, osc2Level:70,
    filterCutoff:78, filterResonance:22,
    lfo1Wave:2, lfo1Rate:10,
    vp1Src:2, vp1Dst:0, vp1Int:12,
    ampAttack:20, ampSustain:100, ampRelease:80,
    delayTime:55, delayDepth:48 },

  // 119. Chord Stab — major 7th character stab for house and nu-disco
  { name: 'Chord Stab',
    osc1Wave:0, osc2Wave:1, osc2Semi:7, osc2Tune:4, osc1Level:95, osc2Level:80,
    filterCutoff:90, filterResonance:30, filterEgInt:28, filterDecay:30,
    ampAttack:3, ampDecay:35, ampSustain:0, ampRelease:28 },

  // 120. Euphoric Lead — bright, uplifting, classic hands-in-the-air moment
  { name: 'Euphoric Lead',
    osc1Wave:0, osc2Wave:0, osc2Tune:11, osc1Level:100, osc2Level:90,
    filterCutoff:96, filterResonance:45, filterEgInt:32, filterDecay:30,
    lfo2Wave:2, lfo2Rate:40,
    vp1Src:3, vp1Dst:0, vp1Int:15,
    ampAttack:3, ampSustain:100, ampRelease:45,
    delayTime:44, delayDepth:38 },

  // 121. Acid Loop — looping acid texture, self-contained movement
  { name: 'Acid Loop',
    osc1Wave:0, osc1Level:110,
    filterCutoff:45, filterResonance:102, filterEgInt:52, filterAttack:0, filterDecay:28, filterSustain:0,
    lfo1Wave:1, lfo1Rate:48,
    vp1Src:2, vp1Dst:4, vp1Int:40,
    portamento:20,
    ampAttack:0, ampSustain:100, ampRelease:25 },

  // 122. Electro Hit — classic electro synth hit, punchy and short
  { name: 'Electro Hit',
    osc1Wave:0, osc2Wave:0, osc2Mod:1, osc2Semi:4, osc1Level:105, osc2Level:85,
    filterCutoff:95, filterResonance:55, filterEgInt:35, filterDecay:20,
    ampAttack:0, ampDecay:25, ampSustain:0, ampRelease:18 },

  // 123. Siren — oscillating siren sweep, emergency/rave air-horn
  { name: 'Siren',
    osc1Wave:0, osc1Level:110,
    filterCutoff:95, filterResonance:35,
    lfo1Wave:2, lfo1Rate:22,
    vp1Src:2, vp1Dst:0, vp1Int:55,
    ampAttack:5, ampSustain:100, ampRelease:35 },

  // 124. Hi-Res Sweep — high resonance automated sweep, filter effect
  { name: 'Hi-Res Sweep',
    osc1Wave:0, osc1Level:108,
    filterCutoff:30, filterResonance:115, filterEgInt:58, filterAttack:0, filterDecay:65,
    ampAttack:0, ampSustain:100, ampRelease:40 },

  // 125. Drone Low — low bass drone, continuous meditative tone
  { name: 'Drone Low',
    osc1Wave:0, osc2Wave:2, osc2Tune:-9, osc1Level:95, osc2Level:88,
    filterCutoff:45, filterResonance:30,
    lfo1Wave:2, lfo1Rate:6,
    vp1Src:2, vp1Dst:4, vp1Int:22,
    ampAttack:50, ampSustain:100, ampRelease:100 },

  // 126. Drone High — upper register drone, harmonic texture layer
  { name: 'Drone High',
    osc1Wave:2, osc2Wave:0, osc2Tune:11, osc1Level:88, osc2Level:88,
    filterCutoff:75, filterResonance:25,
    lfo1Wave:2, lfo1Rate:9,
    vp1Src:2, vp1Dst:4, vp1Int:20,
    ampAttack:45, ampSustain:100, ampRelease:100,
    delayTime:62, delayDepth:52 },

  // 127. Movement — rhythmic LFO modulation, self-animated texture
  { name: 'Movement',
    osc1Wave:0, osc2Wave:1, osc2Tune:6, osc1Level:100, osc2Level:70,
    filterCutoff:65, filterResonance:78,
    lfo1Wave:2, lfo1Rate:65,
    vp1Src:2, vp1Dst:4, vp1Int:52,
    vp2Src:2, vp2Dst:6, vp2Int:38,
    lfo2Rate:30,
    ampAttack:5, ampSustain:100, ampRelease:45,
    delayTime:42, delayDepth:35 },

  // 128. Energy — driving psy/techno crossover lead, full power closing patch
  { name: 'Energy',
    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:30, osc1Level:108, osc2Level:60,
    filterCutoff:85, filterResonance:72, filterEgInt:45, filterDecay:30,
    lfo1Wave:2, lfo1Rate:75,
    vp1Src:2, vp1Dst:4, vp1Int:42,
    ampAttack:1, ampSustain:100, ampRelease:40,
    delayTime:42, delayDepth:35 },
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
  console.log(`\nBank A (1–128) — Custom patches:`);
  console.log(`    1–16:  Deep Techno Basses`);
  console.log(`   17–32:  Deep Techno Leads/Stabs`);
  console.log(`   33–48:  G-Funk Basses`);
  console.log(`   49–64:  G-Funk Leads/Pads`);
  console.log(`   65–80:  Psy Basses`);
  console.log(`   81–96:  Psy Leads/FX`);
  console.log(`   97–128: Cross-Genre Utility`);
  console.log(`\nBank B (129–256) — Factory presets (preserved from device dump)`);
  console.log(`\nSend with midi-tool/index.html in Chrome/Edge.`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
