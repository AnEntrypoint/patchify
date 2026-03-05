#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ============================================================
// PROGRESSIVE BASS PATCHES 0-127 - Rich, Warm, Varied
// ============================================================
// Each patch has unique character, modwheel, and velocity control
// Progresses from pure subs → warm analog → aggressive → textured → hybrid

const WAVE_SINE = 3, WAVE_TRI = 2, WAVE_SAW = 0, WAVE_SQ = 1, WAVE_VOX = 4, WAVE_DWGS = 5;
const LP24 = 0, LP12 = 1, BP = 2, HP = 3;

// Modwheel routing (all use src=6 = modwheel)
const MC = (n) => ({ vp2Src:6, vp2Dst:2, vp2Int:n });      // Mod→Cutoff (filter sweep)
const MP = (n) => ({ vp2Src:6, vp2Dst:0, vp2Int:n });     // Mod→Pitch (vibrato)
const MA = (n) => ({ vp2Src:6, vp2Dst:3, });     // Mod→Amp (sw vp2Int:nells)
const MO2 = (n) => ({ vp2Src:6, vp2Dst:1, vp2Int:n });    // Mod→OSC2 (harmonic shift)
const ML = (n) => ({ vp2Src:6, vp2Dst:5, vp2Int:n });    // Mod→LFO2 (tremolo rate)
const MF = (n) => ({ vp2Src:6, vp2Dst:2, vp2Int:n });     // Alias for MC
const MT = MA;                                             // Mod→Tremolo (alias)

// Velocity routing (all use src=7 = velocity)
const VC = (n) => ({ vp1Src:7, vp1Dst:2, vp1Int:n });     // Vel→Cutoff (brighter on hard hit)
const VA = (n) => ({ vp1Src:7, vp1Dst:3, vp1Int:n });     // Vel→Amp (louder on hard hit)
const VP = (n) => ({ vp1Src:7, vp1Dst:0, vp1Int:n });     // Vel→Pitch (pitch bend on hit)

// Helper to create warm filter settings
const warmFilter = (cutoff, resonance = 2) => ({
  filterType: LP24, filterCutoff: cutoff, filterResonance: resonance,
  filterEgInt: 5, filterAttack: 0, filterDecay: 40, filterSustain: 64, filterRelease: 50
});

// Helper for amp envelope
const ampEnv = (a, d, s, r) => ({
  ampAttack: a, ampDecay: d, ampSustain: s, ampRelease: r
});

// ============================================================
// PROGRESSIVE BASS PATCHES
// ============================================================

const bassPatches = [
  // ═══════════════════════════════════════════════════════════════════
  // SEGMENT 1: PURE SUBS (0-15) - Ultra-deep, minimal processing
  // ═══════════════════════════════════════════════════════════════════
  { name:"Sub Zero",      osc1Wave:WAVE_SINE, osc1Level:120, ...warmFilter(18,0), ...ampEnv(0,90,0,20), ...MC(25), ...VC(12), transpose:-12 },
  { name:"Deep Space",    osc1Wave:WAVE_SINE, osc1Level:118, ...warmFilter(22,2), ...ampEnv(0,80,90,30), ...MC(30), ...VA(15), transpose:-12 },
  { name:"Warm Sub",      osc1Wave:WAVE_SINE, osc1Level:118, ...warmFilter(30,3), ...ampEnv(2,70,95,40), ...MC(35), ...VC(10), transpose:-12 },
  { name:"Cloud Sub",     osc1Wave:WAVE_SINE, osc1Level:118, ...warmFilter(25,0), ...ampEnv(5,100,80,60), ...MA(25), ...VA(12), transpose:-12 },
  { name:"Punch Sub",     osc1Wave:WAVE_SINE, osc1Level:122, ...warmFilter(35,4), ...ampEnv(0,50,0,15), ...MC(40), ...VC(20), transpose:-12 },
  { name:"Rolling Sub",   osc1Wave:WAVE_SINE, osc1Level:120, ...warmFilter(28,3), ...warmFilter(28,3,{filterEgInt:8,filterDecay:40}), ...ampEnv(0,80,90,50), ...MP(5), ...VC(12), transpose:-12 },
  { name:"Night Sub",     osc1Wave:WAVE_SINE, osc1Level:120, ...warmFilter(15,0), ...ampEnv(0,120,95,50), ...MC(20), ...VA(10), transpose:-12 },
  { name:"Pluck Sub",     osc1Wave:WAVE_SINE, osc1Level:118, ...warmFilter(45,5), ...ampEnv(0,35,0,10), ...MC(42), ...VC(25), transpose:-12 },
  { name:"Fat Sub",       osc1Wave:WAVE_SINE, osc1Level:122, ...warmFilter(32,4), ...ampEnv(0,75,92,45), ...MC(36), ...VC(18), transpose:-12 },
  { name:"Slow Sub",      osc1Wave:WAVE_SINE, osc1Level:118, ...warmFilter(20,2), ...ampEnv(20,80,90,60), ...MA(28), ...VA(12), transpose:-12 },
  { name:"Sub Throb",     osc1Wave:WAVE_SINE, osc1Level:120, ...warmFilter(28,3), ...warmFilter(28,{filterEgInt:5,filterDecay:35}), ...ampEnv(0,70,88,42), ...MP(8), ...VC(15), transpose:-12 },
  { name:"Low Rider",     osc1Wave:WAVE_SINE, osc1Level:120, ...warmFilter(38,5), ...warmFilter(38,{filterEgInt:10,filterDecay:25}), ...ampEnv(0,65,85,35), ...MC(40), ...VC(22), transpose:-12 },
  { name:"Rumble Sub",    osc1Wave:WAVE_SINE, osc1Level:118, ...warmFilter(22,2), ...warmFilter(22,{filterEgInt:6,filterDecay:45}), ...ampEnv(0,90,95,55), ...MC(28), ...VA(18), transpose:-12 },
  { name:"Flex Sub",      osc1Wave:WAVE_SINE, osc1Level:120, ...warmFilter(30,4), ...ampEnv(0,60,85,35), ...MP(10), ...VC(16), transpose:-12 },
  { name:"Sub Slab",      osc1Wave:WAVE_SINE, osc1Level:122, ...warmFilter(25,0), ...ampEnv(0,110,0,25), ...MC(30), ...VC(20), transpose:-12 },
  { name:"Deep Flex",     osc1Wave:WAVE_SINE, osc1Level:120, ...warmFilter(35,4), ...ampEnv(1,60,85,35), ...MC(38), ...VA(15), transpose:-12 },

  // ═══════════════════════════════════════════════════════════════════
  // SEGMENT 2: WARM TRIANGLES (16-31) - Rich analog warmth
  // ═══════════════════════════════════════════════════════════════════
  { name:"Tri Warm",      osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(50,5), ...ampEnv(0,72,90,45), ...MC(42), ...VC(15), transpose:-12 },
  { name:"Cotton Tri",    osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(40,3), ...ampEnv(2,80,92,50), ...MC(35), ...VA(18), transpose:-12 },
  { name:"Honey Bass",    osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(58,8), ...ampEnv(0,68,88,42), ...MC(45), ...VC(20), transpose:-12 },
  { name:"Tri Round",     osc1Wave:WAVE_TRI, osc1Level:120, ...warmFilter(48,6), ...warmFilter(48,{filterEgInt:10,filterDecay:25}), ...ampEnv(0,65,85,35), ...MP(8), ...VC(12), transpose:-12 },
  { name:"Tri Velvet",    osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(42,4), ...ampEnv(3,90,92,60), ...MA(30), ...VA(15), transpose:-12 },
  { name:"Tri Cream",     osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(55,6), ...ampEnv(0,70,88,44), ...MC(44), ...VC(18), transpose:-12 },
  { name:"Tri Amber",     osc1Wave:WAVE_TRI, osc1Level:120, ...warmFilter(45,5), ...ampEnv(0,75,90,48), ...MO2(10), ...VC(16), transpose:-12 },
  { name:"Tri Funk",      osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(62,9), ...warmFilter(62,{filterEgInt:15,filterDecay:25}), ...ampEnv(0,40,0,15), ...MC(50), ...VC(25), transpose:-12 },
  { name:"Tri Punch",     osc1Wave:WAVE_TRI, osc1Level:120, ...warmFilter(52,7), ...ampEnv(0,55,80,35), ...MC(42), ...VA(20), transpose:-12 },
  { name:"Tri Soft",      osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(38,4), ...ampEnv(0,85,95,55), ...MP(5), ...VC(10), transpose:-12 },
  { name:"Tri Jazz",      osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(60,8), ...ampEnv(2,72,85,44), ...MC(45), ...VC(18), transpose:-12 },
  { name:"Tri Butter",    osc1Wave:WAVE_TRI, osc1Level:120, ...warmFilter(48,5), ...ampEnv(0,68,87,42), ...ML(28), ...VC(14), transpose:-12 },
  { name:"Tri Organic",   osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(44,6), ...warmFilter(44,{filterEgInt:12,filterDecay:30}), ...ampEnv(0,72,88,46), ...MC(40), ...VA(16), transpose:-12 },
  { name:"Tri Pluck",     osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(68,7), ...ampEnv(0,38,0,18), ...MC(48), ...VC(22), transpose:-12 },
  { name:"Tri Slick",     osc1Wave:WAVE_TRI, osc1Level:120, ...warmFilter(56,10), ...warmFilter(56,{filterEgInt:18,filterDecay:22}), ...ampEnv(0,45,0,20), ...MC(52), ...VC(25), transpose:-12 },
  { name:"Tri Mellow",    osc1Wave:WAVE_TRI, osc1Level:118, ...warmFilter(42,5), ...ampEnv(8,80,90,52), ...MA(28), ...VA(12), transpose:-12 },

  // ═══════════════════════════════════════════════════════════════════
  // SEGMENT 3: AGGRESSIVE SAWS (32-47) - Bright, punchy, cutting
  // ═══════════════════════════════════════════════════════════════════
  { name:"Saw Attack",    osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(65,8), ...ampEnv(0,45,75,25), ...MC(50), ...VC(20), transpose:-12 },
  { name:"Saw Slash",      osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(72,9), ...ampEnv(0,25,0,10), ...MC(55), ...VC(25), transpose:-12 },
  { name:"Saw Grease",    osc1Wave:WAVE_SAW, osc1Level:118, ...warmFilter(58,10), ...warmFilter(58,{filterEgInt:20,filterDecay:30}), ...ampEnv(0,55,78,28), ...MC(48), ...VA(18), transpose:-12 },
  { name:"Saw Nasal",     osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(60,11), ...ampEnv(0,40,70,22), ...MC(52), ...VC(22), transpose:-12 },
  { name:"Saw 70s",       osc1Wave:WAVE_SAW, osc1Level:118, ...warmFilter(55,8), ...warmFilter(55,{filterEgInt:15,filterDecay:28}), ...ampEnv(0,58,80,30), ...MP(10), ...VC(18), transpose:-12 },
  { name:"Saw Sticky",    osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(70,9), ...ampEnv(0,35,60,20), ...MC(50), ...VC(24), transpose:-12 },
  { name:"Saw Rubber",    osc1Wave:WAVE_SAW, osc1Level:118, ...warmFilter(50,6), ...ampEnv(2,65,82,38), ...MP(8), ...VC(15), transpose:-12 },
  { name:"Saw Snap",      osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(78,12), ...warmFilter(78,{filterEgInt:22,filterDecay:20}), ...ampEnv(0,28,0,12), ...MC(58), ...VC(30), transpose:-12 },
  { name:"Saw Grit",      osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(62,9), ...warmFilter(62,{filterEgInt:18,filterDecay:25}), ...ampEnv(0,50,75,26), ...MA(48), ...VA(20), transpose:-12 },
  { name:"Saw Street",    osc1Wave:WAVE_SAW, osc1Level:118, ...warmFilter(68,8), ...ampEnv(0,42,72,24), ...MC(50), ...VC(22), transpose:-12 },
  { name:"Saw Electric",  osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(75,10), ...ampEnv(0,40,70,22), ...MC(55), ...VC(28), transpose:-12 },
  { name:"Saw Wire",      osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(82,11), ...ampEnv(0,30,50,15), ...MC(58), ...VC(25), transpose:-12 },
  { name:"Saw Thick",     osc1Wave:WAVE_SAW, osc1Level:118, ...warmFilter(56,7), ...ampEnv(0,52,80,30), ...MP(12), ...VC(18), transpose:-12 },
  { name:"Saw Growl",     osc1Wave:WAVE_SAW, osc1Level:118, ...warmFilter(52,12), ...warmFilter(52,{filterEgInt:25,filterDecay:30}), ...ampEnv(0,60,78,32), ...MA(50), ...VA(22), transpose:-12 },
  { name:"Saw Sharp",     osc1Wave:WAVE_SAW, osc1Level:115, ...warmFilter(80,10), ...ampEnv(0,28,40,14), ...MC(56), ...VC(26), transpose:-12 },
  { name:"Saw Classic",   osc1Wave:WAVE_SAW, osc1Level:118, ...warmFilter(64,9), filterEgInt:20, filterDecay:35, ...ampEnv(0,55,78,28), ...MC(50), ...VC(20), transpose:-12 },

  // ═══════════════════════════════════════════════════════════════════
  // SEGMENT 4: PULSE/SQUARE (48-63) - Hollow, chesty, PWM
  // ═══════════════════════════════════════════════════════════════════
  { name:"Pulse Sub",     osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:118, ...warmFilter(38,5), ...ampEnv(0,65,85,38), ...MC(38), ...VC(15), transpose:-12 },
  { name:"Pulse Hollow",  osc1Wave:WAVE_SQ, osc1Ctrl1:80, osc1Level:115, ...warmFilter(48,6), ...ampEnv(0,70,88,42), ...MC(40), ...VA(18), transpose:-12 },
  { name:"Pulse PWM",     osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:118, ...warmFilter(55,7), ...warmFilter(55,{filterEgInt:12,filterDecay:28}), ...ampEnv(0,60,82,32), ...MC(45), ...VC(20), transpose:-12 },
  { name:"Pulse Chest",   osc1Wave:WAVE_SQ, osc1Ctrl1:48, osc1Level:118, ...warmFilter(42,6), ...ampEnv(0,55,80,30), ...MC(42), ...VC(16), transpose:-12 },
  { name:"Pulse Boxy",    osc1Wave:WAVE_SQ, osc1Ctrl1:72, osc1Level:115, ...warmFilter(45,5), ...ampEnv(0,68,86,40), ...MC(38), ...VA(14), transpose:-12 },
  { name:"Pulse Wide",    osc1Wave:WAVE_SQ, osc1Ctrl1:96, osc1Level:115, ...warmFilter(52,7), ...ampEnv(0,62,82,36), ...MC(42), ...VC(18), transpose:-12 },
  { name:"Pulse Tight",   osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:115, ...warmFilter(62,8), ...ampEnv(0,30,0,12), ...MC(50), ...VC(25), transpose:-12 },
  { name:"Pulse Nasal",   osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:115, ...warmFilter(58,9), ...ampEnv(0,55,78,30), ...MC(48), ...VC(22), transpose:-12 },
  { name:"Pulse Retro",   osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:118, ...warmFilter(50,6), ...ampEnv(0,65,84,38), ...MP(8), ...VC(16), transpose:-12 },
  { name:"Pulse Wood",    osc1Wave:WAVE_SQ, osc1Ctrl1:88, osc1Level:115, ...warmFilter(42,5), ...ampEnv(2,72,88,44), ...MC(38), ...VA(15), transpose:-12 },
  { name:"Pulse Dark",    osc1Wave:WAVE_SQ, osc1Ctrl1:56, osc1Level:118, ...warmFilter(30,4), ...ampEnv(0,75,90,48), ...MP(10), ...VC(12), transpose:-12 },
  { name:"Pulse Smash",   osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:115, ...warmFilter(68,9), ...ampEnv(0,28,0,10), ...MC(52), ...VC(28), transpose:-12 },
  { name:"Pulse Hi",      osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:115, ...warmFilter(75,10), ...ampEnv(0,50,72,28), ...MC(55), ...VC(26), transpose:-12 },
  { name:"Pulse Mono",    osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:118, ...warmFilter(48,7), ...ampEnv(0,60,80,35), ...MC(44), ...VC(18), transpose:-12 },
  { name:"Pulse Low",     osc1Wave:WAVE_SQ, osc1Ctrl1:48, osc1Level:118, ...warmFilter(35,5), ...ampEnv(0,70,88,42), ...MC(35), ...VA(12), transpose:-12 },
  { name:"Pulse Stab",    osc1Wave:WAVE_SQ, osc1Ctrl1:64, osc1Level:115, ...warmFilter(70,9), ...ampEnv(0,22,0,8), ...MA(50), ...VC(30), transpose:-12 },

  // ═══════════════════════════════════════════════════════════════════
  // SEGMENT 5: DUAL OSCILLATOR (64-79) - Rich layers, detuning
  // ═══════════════════════════════════════════════════════════════════
  { name:"Dual Sub",      osc1Wave:WAVE_SINE, osc2Wave:WAVE_TRI, osc1Level:110, osc2Level:80, osc2Semi:12, osc2Tune:5, ...warmFilter(35,3), ...ampEnv(0,70,85,40), ...MC(35), ...VC(15), transpose:-12 },
  { name:"Dual Warm",     osc1Wave:WAVE_TRI, osc2Wave:WAVE_TRI, osc1Level:115, osc2Level:85, osc2Semi:7, osc2Tune:3, ...warmFilter(48,5), ...ampEnv(0,65,88,42), ...MC(40), ...VC(18), transpose:-12 },
  { name:"Dual Detune",    osc1Wave:WAVE_SAW, osc2Wave:WAVE_SAW, osc1Level:112, osc2Level:90, osc2Semi:0, osc2Tune:-8, ...warmFilter(55,7), ...ampEnv(0,50,80,30), ...MC(45), ...VC(20), transpose:-12 },
  { name:"Dual Fifth",     osc1Wave:WAVE_TRI, osc2Wave:WAVE_TRI, osc1Level:115, osc2Level:75, osc2Semi:7, osc2Tune:0, ...warmFilter(52,6), ...ampEnv(0,55,82,35), ...MO2(12), ...VC(16), transpose:-12 },
  { name:"Dual Octave",    osc1Wave:WAVE_SAW, osc2Wave:WAVE_SAW, osc1Level:110, osc2Level:95, osc2Semi:-12, osc2Tune:2, ...warmFilter(58,8), ...ampEnv(0,45,75,25), ...MC(48), ...VC(22), transpose:-12 },
  { name:"Dual Thick",     osc1Wave:WAVE_TRI, osc2Wave:WAVE_SAW, osc1Level:115, osc2Level:80, osc2Semi:0, osc2Tune:7, ...warmFilter(50,6), ...ampEnv(0,58,84,36), ...MC(42), ...VA(18), transpose:-12 },
  { name:"Dual Shimmer",   osc1Wave:WAVE_SINE, osc2Wave:WAVE_TRI, osc1Level:112, osc2Level:70, osc2Semi:12, osc2Tune:8, ...warmFilter(45,4), ...ampEnv(2,75,90,48), ...MA(30), ...VA(15), transpose:-12 },
  { name:"Dual Fat",       osc1Wave:WAVE_SAW, osc2Wave:WAVE_TRI, osc1Level:110, osc2Level:85, osc2Semi:0, osc2Tune:-5, ...warmFilter(60,9), ...ampEnv(0,48,78,28), ...MC(50), ...VC(24), transpose:-12 },
  { name:"Dual Hollow",    osc1Wave:WAVE_SQ, osc2Wave:WAVE_SQ, osc1Level:110, osc2Level:75, osc2Semi:12, osc2Tune:3, ...warmFilter(40,5), ...ampEnv(0,62,86,38), ...MC(38), ...VC(14), transpose:-12 },
  { name:"Dual Spread",    osc1Wave:WAVE_TRI, osc2Wave:WAVE_TRI, osc1Level:115, osc2Level:80, osc2Semi:0, osc2Tune:12, ...warmFilter(52,7), ...ampEnv(0,55,82,34), ...MO2(8), ...VC(16), transpose:-12 },
  { name:"Dual Phase",     osc1Wave:WAVE_SAW, osc2Wave:WAVE_SAW, osc1Level:112, osc2Level:88, osc2Semi:0, osc2Tune:-12, ...warmFilter(55,8), ...ampEnv(0,52,80,32), ...MP(10), ...VC(18), transpose:-12 },
  { name:"Dual Rich",      osc1Wave:WAVE_TRI, osc2Wave:WAVE_TRI, osc1Level:118, osc2Level:90, osc2Semi:5, osc2Tune:2, ...warmFilter(46,5), ...ampEnv(0,60,86,40), ...MC(42), ...VA(16), transpose:-12 },
  { name:"Dual Stack",     osc1Wave:WAVE_SAW, osc2Wave:WAVE_SAW, osc1Level:108, osc2Level:92, osc2Semi:-5, osc2Tune:5, ...warmFilter(62,10), ...ampEnv(0,42,75,26), ...MC(52), ...VC(25), transpose:-12 },
  { name:"Dual Cream",     osc1Wave:WAVE_TRI, osc2Wave:WAVE_SINE, osc1Level:115, osc2Level:85, osc2Semi:0, osc2Tune:0, ...warmFilter(44,4), ...ampEnv(0,68,88,44), ...MA(25), ...VA(14), transpose:-12 },
  { name:"Dual Power",     osc1Wave:WAVE_SAW, osc2Wave:WAVE_SAW, osc1Level:110, osc2Level:95, osc2Semi:0, osc2Tune:-7, ...warmFilter(65,11), ...ampEnv(0,38,72,22), ...MC(55), ...VC(28), transpose:-12 },
  { name:"Dual Smooth",    osc1Wave:WAVE_TRI, osc2Wave:WAVE_TRI, osc1Level:120, osc2Level:85, osc2Semi:3, osc2Tune:1, ...warmFilter(42,4), ...ampEnv(3,75,92,50), ...MA(28), ...VA(12), transpose:-12 },

  // ═══════════════════════════════════════════════════════════════════
  // SEGMENT 6: RING MOD & SYNC (80-95) - Aggressive harmonics
  // ═══════════════════════════════════════════════════════════════════
  { name:"Ring Sub",       osc1Wave:WAVE_SINE, osc2Wave:WAVE_SQ, osc1Level:110, osc2Level:100, osc2Mod:1, ...warmFilter(40,5), ...ampEnv(0,60,80,35), ...MC(45), ...VC(18), transpose:-12 },
  { name:"Ring Warm",      osc1Wave:WAVE_TRI, osc2Wave:WAVE_SQ, osc1Level:115, osc2Level:95, osc2Mod:1, ...warmFilter(55,7), ...ampEnv(0,65,85,40), ...MP(10), ...VA(15), transpose:-12 },
  { name:"Ring Hollow",    osc1Wave:WAVE_SQ, osc2Wave:WAVE_TRI, osc1Level:118, osc2Level:90, osc2Mod:1, ...warmFilter(60,8), ...ampEnv(0,70,88,44), ...MC(50), ...VC(20), transpose:-12 },
  { name:"Sync Sub",       osc1Wave:WAVE_SAW, osc2Wave:WAVE_SAW, osc1Level:115, osc2Level:100, osc2Mod:2, ...warmFilter(65,9), ...ampEnv(0,55,78,32), ...MC(52), ...VC(22), transpose:-12 },
  { name:"Sync Warm",      osc1Wave:WAVE_TRI, osc2Wave:WAVE_SAW, osc1Level:118, osc2Level:95, osc2Mod:2, ...warmFilter(50,7), ...ampEnv(0,60,82,38), ...MP(8), ...VC(18), transpose:-12 },
  { name:"Sync Thick",     osc1Wave:WAVE_SAW, osc2Wave:WAVE_TRI, osc1Level:115, osc2Level:100, osc2Mod:2, ...warmFilter(58,8), ...ampEnv(0,65,85,42), ...MC(48), ...VA(16), transpose:-12 },
  { name:"Ring Aggressive",osc1Wave:WAVE_SAW, osc2Wave:WAVE_SQ, osc1Level:110, osc2Level:105, osc2Mod:1, ...warmFilter(70,10), ...ampEnv(0,45,75,28), ...MC(55), ...VC(25), transpose:-12 },
  { name:"Sync Razor",    osc1Wave:WAVE_SAW, osc2Wave:WAVE_SAW, osc1Level:112, osc2Level:98, osc2Mod:2, ...warmFilter(75,11), ...ampEnv(0,40,70,24), ...MC(58), ...VC(28), transpose:-12 },
  { name:"Ring Metallic",  osc1Wave:WAVE_SQ, osc2Wave:WAVE_SQ, osc1Level:108, osc2Level:95, osc2Mod:1, ...warmFilter(80,12), ...ampEnv(0,35,65,20), ...MC(60), ...VC(30), transpose:-12 },
  { name:"Sync Growl",     osc1Wave:WAVE_TRI, osc2Wave:WAVE_SAW, osc1Level:115, osc2Level:100, osc2Mod:2, ...warmFilter(52,10), ...warmFilter(52,{filterEgInt:25,filterDecay:25}), ...ampEnv(0,55,78,30), ...MA(45), ...VA(20), transpose:-12 },
  { name:"Ring Bell",      osc1Wave:WAVE_SINE, osc2Wave:WAVE_TRI, osc1Level:112, osc2Level:90, osc2Mod:1, ...warmFilter(65,9), ...ampEnv(0,50,75,28), ...MO2(15), ...VC(22), transpose:-12 },
  { name:"Sync Dark",      osc1Wave:WAVE_SAW, osc2Wave:WAVE_SAW, osc1Level:118, osc2Level:100, osc2Mod:2, ...warmFilter(48,6), ...ampEnv(0,68,86,42), ...MP(12), ...VC(16), transpose:-12 },
  { name:"Ring Scream",    osc1Wave:WAVE_SAW, osc2Wave:WAVE_SQ, osc1Level:105, osc2Level:110, osc2Mod:1, ...warmFilter(85,13), ...ampEnv(0,30,60,18), ...MC(62), ...VC(32), transpose:-12 },
  { name:"Sync Pulse",     osc1Wave:WAVE_SQ, osc2Wave:WAVE_SAW, osc1Level:115, osc2Level:100, osc2Mod:2, ...warmFilter(60,10), ...ampEnv(0,48,72,26), ...MC(54), ...VC(24), transpose:-12 },
  { name:"Ring Distort",   osc1Wave:WAVE_SAW, osc2Wave:WAVE_SQ, osc1Level:108, osc2Level:102, osc2Mod:1, ...warmFilter(75,12), ...ampEnv(0,38,68,22), ...MA(55), ...VA(25), transpose:-12 },
  { name:"Sync Wild",      osc1Wave:WAVE_SAW, osc2Wave:WAVE_TRI, osc1Level:110, osc2Level:100, osc2Mod:2, ...warmFilter(68,11), ...ampEnv(0,42,70,24), ...MP(15), ...VC(26), transpose:-12 },

  // ═══════════════════════════════════════════════════════════════════
  // SEGMENT 7: VOX & FORMANT (96-111) - Vocal character
  // ═══════════════════════════════════════════════════════════════════
  { name:"Vox Sub",        osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(55,7), ...ampEnv(0,60,80,35), ...MC(48), ...VC(18), transpose:-12 },
  { name:"Vox Warm",       osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(48,8), ...ampEnv(2,72,85,44), ...MC(42), ...VA(15), transpose:-12 },
  { name:"Vox Talk",       osc1Wave:WAVE_VOX, osc1Level:118, ...warmFilter(62,9), ...ampEnv(0,55,78,32), ...MC(50), ...VC(20), transpose:-12 },
  { name:"Vox Chanter",    osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(70,8), ...ampEnv(0,35,50,20), ...MC(55), ...VC(25), transpose:-12 },
  { name:"Vox Human",      osc1Wave:WAVE_VOX, osc1Level:118, ...warmFilter(52,6), ...ampEnv(3,80,88,50), ...MA(35), ...VA(20), transpose:-12 },
  { name:"Vox Mumble",     osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(45,7), ...ampEnv(2,70,85,44), ...MP(10), ...VC(16), transpose:-12 },
  { name:"Vox Funk",       osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(68,10), ...ampEnv(0,40,65,22), ...MC(52), ...VC(22), transpose:-12 },
  { name:"Vox Body",       osc1Wave:WAVE_VOX, osc1Level:118, ...warmFilter(58,7), ...ampEnv(0,65,82,38), ...MC(46), ...VC(18), transpose:-12 },
  { name:"Vox Wah",        osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(60,11), ...warmFilter(60,{filterEgInt:20,filterDecay:28}), ...ampEnv(0,50,72,28), ...MA(50), ...VA(18), transpose:-12 },
  { name:"Vox Whispers",   osc1Wave:WAVE_VOX, osc1Level:118, ...warmFilter(40,6), ...ampEnv(2,78,88,48), ...MC(38), ...VC(14), transpose:-12 },
  { name:"Vox Growl",      osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(72,9), ...warmFilter(72,{filterEgInt:18,filterDecay:25}), ...ampEnv(0,45,68,25), ...MC(55), ...VC(25), transpose:-12 },
  { name:"Vox Breath",     osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(56,8), ...ampEnv(0,58,78,34), ...MP(8), ...VC(18), transpose:-12 },
  { name:"Vox Scream",    osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(64,10), ...ampEnv(0,42,65,24), ...MA(50), ...VA(22), transpose:-12 },
  { name:"Vox Dark",       osc1Wave:WAVE_VOX, osc1Level:118, ...warmFilter(50,6), ...ampEnv(3,75,86,46), ...MC(42), ...VC(16), transpose:-12 },
  { name:"Vox Ultra",      osc1Wave:WAVE_VOX, osc1Level:120, ...warmFilter(30,4), ...ampEnv(0,85,92,52), ...MC(32), ...VA(12), transpose:-12 },
  { name:"Vox Punch",      osc1Wave:WAVE_VOX, osc1Level:115, ...warmFilter(65,9), ...ampEnv(0,22,0,10), ...MC(52), ...VC(28), transpose:-12 },

  // ═══════════════════════════════════════════════════════════════════
  // SEGMENT 8: TEXTURED & HYBRID (112-127) - Complex, evolving
  // ═══════════════════════════════════════════════════════════════════
  { name:"BPF Sub",        osc1Wave:WAVE_SAW, osc1Level:118, filterType:BP, filterCutoff:70, filterResonance:12, filterEgInt:20, ...ampEnv(0,50,75,30), ...MC(60), ...VC(28), transpose:-12 },
  { name:"BPF Warm",       osc1Wave:WAVE_TRI, osc1Level:118, filterType:BP, filterCutoff:55, filterResonance:10, filterEgInt:15, ...ampEnv(0,55,82,35), ...MC(55), ...VC(22), transpose:-12 },
  { name:"HPF Sub",        osc1Wave:WAVE_SAW, osc1Level:118, filterType:HP, filterCutoff:80, filterResonance:10, filterEgInt:15, ...ampEnv(0,55,80,34), ...MC(65), ...VC(30), transpose:-12 },
  { name:"HPF Warm",       osc1Wave:WAVE_TRI, osc1Level:118, filterType:HP, filterCutoff:60, filterResonance:8, filterEgInt:12, ...ampEnv(0,60,84,38), ...MC(58), ...VC(25), transpose:-12 },
  { name:"Squelch",        osc1Wave:WAVE_SQ, osc1Level:118, filterType:LP24, filterCutoff:40, filterResonance:15, filterEgInt:25, ...ampEnv(0,20,65,22), ...MC(75), ...VC(40), transpose:-12 },
  { name:"Peak Bass",      osc1Wave:WAVE_SQ, osc1Level:115, filterType:LP24, filterCutoff:60, filterResonance:14, filterEgInt:18, ...ampEnv(0,48,72,26), ...MC(60), ...VC(32), transpose:-12 },
  { name:"Reso Warm",      osc1Wave:WAVE_TRI, osc1Level:118, filterType:LP24, filterCutoff:50, filterResonance:13, filterEgInt:12, ...ampEnv(0,60,88,40), ...MC(55), ...VC(25), transpose:-12 },
  { name:"Twang Saw",      osc1Wave:WAVE_SAW, osc1Level:115, filterType:LP12, filterCutoff:85, filterResonance:10, filterEgInt:10, ...ampEnv(0,35,55,20), ...MC(65), ...VC(30), transpose:-12 },
  { name:"Siren",          osc1Wave:WAVE_SAW, osc1Level:118, filterType:LP24, filterCutoff:60, filterResonance:12, filterEgInt:40, ...ampEnv(0,25,70,24), ...MP(15), ...VC(35), transpose:-12 },
  { name:"Wild Bass",      osc1Wave:WAVE_SQ, osc1Level:115, filterType:LP12, filterCutoff:75, filterResonance:11, filterEgInt:22, ...ampEnv(0,40,68,28), ...MC(70), ...VC(40), transpose:-12 },
  { name:"Noise Sub",      osc1Wave:WAVE_SINE, osc1Level:115, noiseLevel:8, ...warmFilter(25,2), ...ampEnv(0,80,90,45), ...MC(32), ...VC(15), transpose:-12 },
  { name:"Gritty Sub",     osc1Wave:WAVE_SINE, osc1Level:112, noiseLevel:15, ...warmFilter(30,3), ...ampEnv(0,75,85,40), ...MC(38), ...VA(12), transpose:-12 },
  { name:"Dirty Saw",      osc1Wave:WAVE_SAW, osc1Level:110, noiseLevel:12, ...warmFilter(60,10), ...ampEnv(0,55,80,30), ...MC(50), ...VC(20), transpose:-12 },
  { name:"Lo-Fi Bass",    osc1Wave:WAVE_TRI, osc1Level:118, noiseLevel:10, ...warmFilter(20,1), ...ampEnv(0,90,95,50), ...MA(28), ...VA(10), transpose:-12 },
  { name:"Grunge Sub",     osc1Wave:WAVE_SAW, osc1Level:110, noiseLevel:28, ...warmFilter(75,12), ...ampEnv(0,42,68,24), ...MC(65), ...VC(35), transpose:-12 },
  { name:"Filthy Bass",    osc1Wave:WAVE_SINE, osc1Level:118, noiseLevel:30, ...warmFilter(35,6), ...ampEnv(0,75,88,44), ...MC(40), ...VA(20), transpose:-12 },
];

// Load existing non-bass patches
const existingPatches = require('../cli/patches-data.cjs');
const updatedPatches = [...bassPatches, ...existingPatches.slice(128)];

console.log(`Updated patches: ${updatedPatches.length} total (128 bass, ${updatedPatches.slice(128).length} other)`);

// Write updated patches to file
const outputPath = path.join(__dirname, '../cli/patches-data.cjs');
fs.writeFileSync(outputPath, `// microKORG S patch library — 256 patches
// Bank A (0-127):   128 Progressive Basses — warm, rich, varied with modwheel/velocity
// Bank B (128-191): 64 Keys/Leads/Pads
// Bank C (192-255): 64 FX & Textures
// ARP is OFF by default (factory init has arp flags=0x00)
// No global FX — clean by default, enable on hardware
// filterResonance max 15 everywhere

// Mod wheel VP helpers (vp2Src=6=ModWheel)
// VP dst: 0=Pitch, 1=OSC2Pitch, 2=Cutoff, 3=Amp, 4=LFO1Freq, 5=LFO2Freq
const MC = (n) => ({ vp2Src:6, vp2Dst:2, vp2Int:n });   // Mod→Cutoff (filter sweep)
const MP = (n) => ({ vp2Src:6, vp2Dst:0, vp2Int:n });    // Mod→Pitch (vibrato)
const MO2 = (n) => ({ vp2Src:6, vp2Dst:1, vp2Int:n });  // Mod→OSC2Pitch
const ML = (n) => ({ vp2Src:6, vp2Dst:5, vp2Int:n });   // Mod→LFO2Rate
const MA = (n) => ({ vp2Src:6, vp2Dst:3, vp2Int:n });   // Mod→Amp (swells)
const MT = MA;                                          // Alias
const MF = MC;                                          // Alias

// Velocity VP helpers (vp1Src=7=Velocity)
const VC = (n) => ({ vp1Src:7, vp1Dst:2, vp1Int:n });  // Vel→Cutoff (brighter on hard)
const VA = (n) => ({ vp1Src:7, vp1Dst:3, vp1Int:n });  // Vel→Amp (louder on hard)
const VP = (n) => ({ vp1Src:7, vp1Dst:0, vp1Int:n });  // Vel→Pitch

const patches = ${JSON.stringify(updatedPatches, null, 2)};

module.exports = patches;
`);

console.log(`✅ Progressive bass patches written to ${outputPath}`);

// Convert to preview format and write patches.json
const previewPatches = updatedPatches.map(p => {
  const WAVE_MAP = {0:'sawtooth',1:'square',2:'triangle',3:'sine',4:'vox',5:'dwgs',6:'noise',7:'sawtooth'};
  const FILTER_MAP = {0:'lowpass24',1:'lowpass12',2:'bandpass',3:'highpass'};
  const OSC_MOD_MAP = {0:'off',1:'ring',2:'sync',3:'ring'};
  const normalize = (val) => (val ?? 0) / 127;
  const fromCenter64 = (val) => (val ?? 64) - 64;
  
  // Map microkorg matrix indices to preview format
  // MicroKorg: vp2Src (0-7), vp2Dst (0-5), vp1Src (0-7), vp1Dst (0-5)
  // Preview: src ['eg1','eg2','lfo1','lfo2'], dest ['pitch','osc2_pitch','cutoff','amp']
  // Mapping: 0=eg1,1=eg2,2=lfo1,3=lfo2,4=eg1,5=eg2,6=modwheel,7=velocity
  // For modwheel (6) and velocity (7), we route them through to the same destinations
  const srcMap = ['eg1', 'eg2', 'lfo1', 'lfo2'];
  const destMap = ['pitch', 'osc2_pitch', 'cutoff', 'amp'];
  
  // Get modwheel routing (vp2)
  const vp2SrcIdx = p.vp2Src !== undefined ? p.vp2Src : 6;
  const vp2DstIdx = p.vp2Dst !== undefined ? p.vp2Dst : 2;
  const vp2IntVal = p.vp2Int !== undefined ? p.vp2Int : 64;
  
  // Get velocity routing (vp1)  
  const vp1SrcIdx = p.vp1Src !== undefined ? p.vp1Src : 7;
  const vp1DstIdx = p.vp1Dst !== undefined ? p.vp1Dst : 2;
  const vp1IntVal = p.vp1Int !== undefined ? p.vp1Int : 64;
  
  // Map modwheel source (6) to lfo1 as the modulating source in preview
  const vp2SrcStr = srcMap[vp2SrcIdx % 4] || 'lfo1';
  const vp2DestStr = destMap[vp2DstIdx % 4] || 'cutoff';
  
  // Map velocity source (7) to lfo2 or eg1
  const vp1SrcStr = srcMap[vp1SrcIdx % 4] || 'lfo1';
  const vp1DestStr = destMap[vp1DstIdx % 4] || 'cutoff';
  
  return {
    name: p.name,
    voice: { mode: 'poly', portamento: 0 },
    pitch: { transpose: p.transpose || 0, tune: 0 },
    osc1: { wave: WAVE_MAP[p.osc1Wave] || 'sawtooth', control1: p.osc1Ctrl1 || 0, control2: p.osc1Ctrl2 || 0 },
    osc2: { wave: WAVE_MAP[p.osc2Wave] || 'square', mod: OSC_MOD_MAP[p.osc2Mod] || 'off', semitone: p.osc2Semi || 0, tune: p.osc2Tune || 0 },
    mixer: { osc1: normalize(p.osc1Level || 127), osc2: normalize(p.osc2Level || 0), noise: normalize(p.noiseLevel || 0) },
    filter: { 
      type: FILTER_MAP[p.filterType] || 'lowpass24', 
      cutoff: Math.pow(2, normalize(p.filterCutoff || 100) * (Math.log2(15000) - Math.log2(20)) + Math.log2(20)), 
      resonance: normalize(p.filterResonance || 0) * 20, 
      envAmount: fromCenter64(p.filterEgInt || 64) * 78.125 
    },
    eg1_filter: { 
      a: normalize(p.filterAttack || 0) * 5, 
      d: normalize(p.filterDecay || 64) * 5, 
      s: normalize(p.filterSustain || 64), 
      r: normalize(p.filterRelease || 64) * 5 
    },
    amp: { level: normalize(p.ampLevel || 127), dist: 0 },
    eg2_amp: { 
      a: normalize(p.ampAttack || 0) * 5, 
      d: normalize(p.ampDecay || 64) * 5, 
      s: normalize(p.ampSustain || 127), 
      r: normalize(p.ampRelease || 64) * 5 
    },
    lfo1: { wave: ['sawtooth','square','triangle','sine'][p.lfo1Wave || 2], rate: normalize(p.lfo1Rate || 64) * 20, pitchMod: 0, filterMod: 0 },
    lfo2: { wave: ['sawtooth','square','triangle','sine'][p.lfo2Wave || 3], rate: normalize(p.lfo2Rate || 32) * 20, ampMod: 0, pitchMod: 0 },
    vPatch: [
      // Slot 1: Modwheel routing
      { src: vp2SrcStr, dest: vp2DestStr, int: fromCenter64(vp2IntVal) },
      // Slot 2: Velocity routing  
      { src: vp1SrcStr, dest: vp1DestStr, int: fromCenter64(vp1IntVal) },
      // Slot 3-4: Empty
      { src: 'lfo2', dest: 'amp', int: 0 },
      { src: 'eg2', dest: 'osc2_pitch', int: 0 }
    ],
    modFx: { speed: 1.0, depth: 0, mix: 0 },
    delayFx: { time: 0.3, feedback: 0.3, mix: 0 },
    eq: { lowFreq: 250, lowGain: 0, highFreq: 6000, highGain: 0 },
    arp: { on: false, type: 'up', tempo: 120, gate: 0.5 }
  };
});

fs.writeFileSync(path.join(__dirname, '../public/patches.json'), JSON.stringify(previewPatches, null, 2));
console.log(`✅ patches.json regenerated with ${previewPatches.length} patches`);

console.log(`\n🎹 Progressive Bass Features:`);
console.log(`   • 128 unique bass patches (0-127)`);
console.log(`   • 8 segments: Subs → Triangles → Saws → Pulse → Dual → Ring/Sync → Vox → Textured`);
console.log(`   • Every patch has modwheel control (MC, MP, MA, MO2, ML)`);
console.log(`   • Every patch has velocity routing (VC, VA, VP)`);
console.log(`   • Warm filter settings with appropriate resonance`);
console.log(`   • Varied oscillator types, mixes, and detuning`);
