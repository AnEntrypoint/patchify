// microKORG S patch library — 256 patches
// Bank A (0-127):   128 Basses — 8 segments, darkest→brightest→textured
// Bank B (128-191): 64 Keys/Leads/Pads
// Bank C (192-255): 64 FX & Textures
// ARP is OFF by default (factory init has arp flags=0x00)
// No global FX — clean by default, enable on hardware
// filterResonance max 15 everywhere

// Mod wheel VP helpers (vp2Src=6=ModWheel)
// VP dst: 0=Pitch, 1=OSC2Pitch, 2=Cutoff, 3=Amp, 4=LFO1Freq, 5=LFO2Freq
const MC  = (n) => ({ vp2Src:6, vp2Dst:2, vp2Int:n });   // Mod→Cutoff
const MP  = (n) => ({ vp2Src:6, vp2Dst:0, vp2Int:n });   // Mod→Pitch
const MO2 = (n) => ({ vp2Src:6, vp2Dst:1, vp2Int:n });   // Mod→OSC2Pitch
const MC1 = MC;                                            // alias (pulse width patches)
const ML  = (n) => ({ vp2Src:6, vp2Dst:5, vp2Int:n });   // Mod→LFO2Freq
const MA  = (n) => ({ vp2Src:6, vp2Dst:3, vp2Int:n });   // Mod→Amp
const MFE = MA;                                            // alias (amp swell)

// ─── A BANK: 128 Basses (patches 0-127) ──────────────────────────────────────
// kbdOctave:-1 applied automatically by generator for all A bank patches
// Segment 1 (0-15):   Pure Subs — sine, ultra-deep, envelope character
// Segment 2 (16-31):  Warm Analogs — triangle, smooth
// Segment 3 (32-47):  Funky Saw — sawtooth, punchy
// Segment 4 (48-63):  Pulse/Square — hollow, chest character
// Segment 5 (64-79):  VoxWave — formant/vocal basses
// Segment 6 (80-95):  DWGS Digital — unique digital timbres
// Segment 7 (96-111): Noise-Blend — texture and grit
// Segment 8 (112-127): Special/Hybrid — ring mod, BPF, HPF

const patches = [

  // ─ Segment 1: Pure Subs (0-15) ───────────────────────────────────────────
  // Sine wave, ultra-deep. Varied by envelope shape, cutoff, filterEgInt.
  { name:"808 Sub",     osc1Wave:3, osc1Level:122, filterType:0, filterCutoff:18, filterResonance:0,  ampAttack:0,  ampDecay:90,  ampSustain:0,   ampRelease:20, transpose:-12, ...MC(30) },
  { name:"Deep Sub",    osc1Wave:3, osc1Level:120, filterType:0, filterCutoff:22, filterResonance:2,  ampAttack:0,  ampDecay:80,  ampSustain:90,  ampRelease:30, transpose:-12, ...MC(35) },
  { name:"Warm Sub",    osc1Wave:3, osc1Level:118, filterType:0, filterCutoff:30, filterResonance:3,  ampAttack:2,  ampDecay:70,  ampSustain:95,  ampRelease:40, transpose:-12, ...MC(38) },
  { name:"Pillow Sub",  osc1Wave:3, osc1Level:118, filterType:0, filterCutoff:25, filterResonance:0,  ampAttack:5,  ampDecay:100, ampSustain:80,  ampRelease:60, transpose:-12, ...MA(30) },
  { name:"Punchy Sub",  osc1Wave:3, osc1Level:122, filterType:0, filterCutoff:35, filterResonance:4,  ampAttack:0,  ampDecay:50,  ampSustain:0,   ampRelease:15, transpose:-12, ...MC(40) },
  { name:"Roll Sub",    osc1Wave:3, osc1Level:120, filterType:0, filterCutoff:28, filterResonance:3,  filterEgInt:8,filterDecay:40,ampDecay:80,   ampSustain:90, ampRelease:50, transpose:-12, ...MC(32) },
  { name:"Midnight Sub",osc1Wave:3, osc1Level:120, filterType:0, filterCutoff:15, filterResonance:0,  ampAttack:0,  ampDecay:120, ampSustain:95,  ampRelease:50, transpose:-12, ...MC(25) },
  { name:"Pluck Sub",   osc1Wave:3, osc1Level:118, filterType:0, filterCutoff:45, filterResonance:5,  ampAttack:0,  ampDecay:35,  ampSustain:0,   ampRelease:10, transpose:-12, ...MC(42) },
  { name:"Fat Sub",     osc1Wave:3, osc1Level:122, filterType:0, filterCutoff:32, filterResonance:4,  ampAttack:0,  ampDecay:75,  ampSustain:92,  ampRelease:45, transpose:-12, ...MC(36) },
  { name:"Slow Sub",    osc1Wave:3, osc1Level:118, filterType:0, filterCutoff:20, filterResonance:2,  ampAttack:20, ampDecay:80,  ampSustain:90,  ampRelease:60, transpose:-12, ...MA(28) },
  { name:"Sub Throb",   osc1Wave:3, osc1Level:120, filterType:0, filterCutoff:28, filterResonance:3,  filterEgInt:5,filterDecay:35,ampDecay:70,   ampSustain:88, ampRelease:42, transpose:-12, ...MC(30) },
  { name:"Low Rider",   osc1Wave:3, osc1Level:120, filterType:0, filterCutoff:38, filterResonance:5,  filterEgInt:10,filterDecay:25,ampDecay:65,  ampSustain:85, ampRelease:35, transpose:-12, ...MC(40) },
  { name:"Rumble Sub",  osc1Wave:3, osc1Level:118, filterType:0, filterCutoff:22, filterResonance:2,  filterEgInt:6,filterDecay:45,ampDecay:90,   ampSustain:95, ampRelease:55, transpose:-12, ...MC(28) },
  { name:"Flex Sub",    osc1Wave:3, osc1Level:120, filterType:1, filterCutoff:30, filterResonance:4,  ampAttack:0,  ampDecay:60,  ampSustain:85,  ampRelease:35, transpose:-12, ...MC(35) },
  { name:"Sub Slab",    osc1Wave:3, osc1Level:122, filterType:0, filterCutoff:25, filterResonance:0,  ampAttack:0,  ampDecay:110, ampSustain:0,   ampRelease:25, transpose:-12, ...MC(30) },
  { name:"Deep Flex",   osc1Wave:3, osc1Level:120, filterType:0, filterCutoff:35, filterResonance:4,  ampAttack:1,  ampDecay:60,  ampSustain:85,  ampRelease:35, transpose:-12, ...MC(38) },

  // ─ Segment 2: Warm Analogs (16-31) ───────────────────────────────────────
  // Triangle wave, cutoff 35-68, smooth character, varied filter type.
  { name:"Tri Smooth",  osc1Wave:2, osc1Level:118, filterType:1, filterCutoff:50, filterResonance:5,  ampAttack:0,  ampDecay:72,  ampSustain:90,  ampRelease:45, transpose:-12, ...MC(42) },
  { name:"Cotton Low",  osc1Wave:2, osc1Level:118, filterType:0, filterCutoff:40, filterResonance:3,  ampAttack:2,  ampDecay:80,  ampSustain:92,  ampRelease:50, transpose:-12, ...MC(35) },
  { name:"Honey Bass",  osc1Wave:2, osc1Level:118, filterType:2, filterCutoff:58, filterResonance:8,  ampAttack:0,  ampDecay:68,  ampSustain:88,  ampRelease:42, transpose:-12, ...MC(45) },
  { name:"Round Low",   osc1Wave:2, osc1Level:120, filterType:1, filterCutoff:48, filterResonance:6,  filterEgInt:10,filterDecay:25,ampDecay:65,  ampSustain:85, ampRelease:35, transpose:-12, ...MC(40) },
  { name:"Velvet",      osc1Wave:2, osc1Level:118, filterType:0, filterCutoff:42, filterResonance:4,  ampAttack:3,  ampDecay:90,  ampSustain:92,  ampRelease:60, transpose:-12, ...MA(30) },
  { name:"Cream Bass",  osc1Wave:2, osc1Level:118, filterType:1, filterCutoff:55, filterResonance:6,  ampAttack:0,  ampDecay:70,  ampSustain:88,  ampRelease:44, transpose:-12, ...MC(44) },
  { name:"Amber Low",   osc1Wave:2, osc1Level:120, filterType:0, filterCutoff:45, filterResonance:5,  ampAttack:0,  ampDecay:75,  ampSustain:90,  ampRelease:48, transpose:-12, ...MC(38) },
  { name:"Warm Funk",   osc1Wave:2, osc1Level:118, filterType:1, filterCutoff:62, filterResonance:9,  filterEgInt:15,filterDecay:25,ampDecay:40,  ampSustain:0,  ampRelease:15, transpose:-12, ...MC(50) },
  { name:"Soft Punch",  osc1Wave:2, osc1Level:120, filterType:1, filterCutoff:52, filterResonance:7,  ampAttack:0,  ampDecay:55,  ampSustain:80,  ampRelease:35, transpose:-12, ...MC(42) },
  { name:"Low Cotton",  osc1Wave:2, osc1Level:118, filterType:0, filterCutoff:38, filterResonance:4,  ampAttack:0,  ampDecay:85,  ampSustain:95,  ampRelease:55, transpose:-12, ...MC(32) },
  { name:"Jazz Low",    osc1Wave:2, osc1Level:118, filterType:2, filterCutoff:60, filterResonance:8,  ampAttack:2,  ampDecay:72,  ampSustain:85,  ampRelease:44, transpose:-12, ...MC(45) },
  { name:"Butter Bass", osc1Wave:2, osc1Level:120, filterType:1, filterCutoff:48, filterResonance:5,  ampAttack:0,  ampDecay:68,  ampSustain:87,  ampRelease:42, transpose:-12, ...ML(28) },
  { name:"Organic",     osc1Wave:2, osc1Level:118, filterType:0, filterCutoff:44, filterResonance:6,  filterEgInt:12,filterDecay:30,ampDecay:72,  ampSustain:88, ampRelease:46, transpose:-12, ...MC(40) },
  { name:"Warm Pluck",  osc1Wave:2, osc1Level:118, filterType:1, filterCutoff:68, filterResonance:7,  ampAttack:0,  ampDecay:38,  ampSustain:0,   ampRelease:18, transpose:-12, ...MC(48) },
  { name:"Smooth Funk", osc1Wave:2, osc1Level:120, filterType:1, filterCutoff:56, filterResonance:10, filterEgInt:18,filterDecay:22,ampDecay:45,  ampSustain:0,  ampRelease:20, transpose:-12, ...MC(52) },
  { name:"Rounded",     osc1Wave:2, osc1Level:118, filterType:0, filterCutoff:42, filterResonance:5,  ampAttack:8,  ampDecay:80,  ampSustain:90,  ampRelease:52, transpose:-12, ...MA(28) },

  // ─ Segment 3: Funky Saw (32-47) ──────────────────────────────────────────
  // Sawtooth, punchy envelopes, cutoff 45-82. BPF for nasal funk.
  { name:"Funk Saw",    osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:65, filterResonance:8,  ampAttack:0,  ampDecay:45,  ampSustain:75,  ampRelease:25, transpose:-12, ...MC(50) },
  { name:"Slap Saw",    osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:72, filterResonance:9,  ampAttack:0,  ampDecay:25,  ampSustain:0,   ampRelease:10, transpose:-12, ...MC(55) },
  { name:"Grease Bass", osc1Wave:0, osc1Level:118, filterType:1, filterCutoff:58, filterResonance:10, filterEgInt:20,filterDecay:30,ampDecay:55,  ampSustain:78, ampRelease:28, transpose:-12, ...MC(48) },
  { name:"Nasal Funk",  osc1Wave:0, osc1Level:115, filterType:2, filterCutoff:60, filterResonance:11, ampAttack:0,  ampDecay:40,  ampSustain:70,  ampRelease:22, transpose:-12, ...MC(52) },
  { name:"70s Bass",    osc1Wave:0, osc1Level:118, filterType:1, filterCutoff:55, filterResonance:8,  filterEgInt:15,filterDecay:28,ampDecay:58,  ampSustain:80, ampRelease:30, transpose:-12, ...MC(46) },
  { name:"Sticky",      osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:70, filterResonance:9,  ampAttack:0,  ampDecay:35,  ampSustain:60,  ampRelease:20, transpose:-12, ...MC(50) },
  { name:"Rubber",      osc1Wave:0, osc1Level:118, filterType:0, filterCutoff:50, filterResonance:6,  ampAttack:2,  ampDecay:65,  ampSustain:82,  ampRelease:38, transpose:-12, ...MC(42) },
  { name:"Snap",        osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:78, filterResonance:12, filterEgInt:22,filterDecay:20,ampDecay:28,  ampSustain:0,  ampRelease:12, transpose:-12, ...MC(58) },
  { name:"Grit Funk",   osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:62, filterResonance:9,  filterEgInt:18,filterDecay:25,ampDecay:50,  ampSustain:75, ampRelease:26, transpose:-12, ...MFE(48) },
  { name:"Street Bass", osc1Wave:0, osc1Level:118, filterType:1, filterCutoff:68, filterResonance:8,  ampAttack:0,  ampDecay:42,  ampSustain:72,  ampRelease:24, transpose:-12, ...MC(50) },
  { name:"Electric",    osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:75, filterResonance:10, ampAttack:0,  ampDecay:40,  ampSustain:70,  ampRelease:22, transpose:-12, ...MC(55) },
  { name:"Wire",        osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:82, filterResonance:11, ampAttack:0,  ampDecay:30,  ampSustain:50,  ampRelease:15, transpose:-12, ...MC(58) },
  { name:"Thick Funk",  osc1Wave:0, osc1Level:118, filterType:0, filterCutoff:56, filterResonance:7,  ampAttack:0,  ampDecay:52,  ampSustain:80,  ampRelease:30, transpose:-12, ...MC(46) },
  { name:"Growl Saw",   osc1Wave:0, osc1Level:118, filterType:1, filterCutoff:52, filterResonance:12, filterEgInt:25,filterDecay:30,ampDecay:60,  ampSustain:78, ampRelease:32, transpose:-12, ...MFE(50) },
  { name:"Sharp Funk",  osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:80, filterResonance:10, ampAttack:0,  ampDecay:28,  ampSustain:40,  ampRelease:14, transpose:-12, ...MC(56) },
  { name:"Classic Funk",osc1Wave:0, osc1Level:118, filterType:1, filterCutoff:64, filterResonance:9,  filterEgInt:20,filterDecay:35,ampDecay:55,  ampSustain:78, ampRelease:28, transpose:-12, ...MC(50) },

  // ─ Segment 4: Pulse/Square (48-63) ───────────────────────────────────────
  // Pulse wave, varied PW (osc1Ctrl1), hollow chest character.
  { name:"Square Sub",  osc1Wave:1, osc1Ctrl1:64,  osc1Level:118, filterType:0, filterCutoff:38, filterResonance:5,  ampAttack:0, ampDecay:65, ampSustain:85,  ampRelease:38, transpose:-12, ...MC(38) },
  { name:"Hollow Low",  osc1Wave:1, osc1Ctrl1:80,  osc1Level:115, filterType:1, filterCutoff:48, filterResonance:6,  ampAttack:0, ampDecay:70, ampSustain:88,  ampRelease:42, transpose:-12, ...MC1(40) },
  { name:"PWM Bass",    osc1Wave:1, osc1Ctrl1:64,  osc1Level:118, filterType:1, filterCutoff:55, filterResonance:7,  filterEgInt:12,filterDecay:28,ampDecay:60, ampSustain:82,  ampRelease:32, transpose:-12, ...MC1(45) },
  { name:"Chest Pump",  osc1Wave:1, osc1Ctrl1:48,  osc1Level:118, filterType:1, filterCutoff:42, filterResonance:6,  ampAttack:0, ampDecay:55, ampSustain:80,  ampRelease:30, transpose:-12, ...MC(42) },
  { name:"Boxy",        osc1Wave:1, osc1Ctrl1:72,  osc1Level:115, filterType:0, filterCutoff:45, filterResonance:5,  ampAttack:0, ampDecay:68, ampSustain:86,  ampRelease:40, transpose:-12, ...MC(38) },
  { name:"Wide Pulse",  osc1Wave:1, osc1Ctrl1:96,  osc1Level:115, filterType:1, filterCutoff:52, filterResonance:7,  ampAttack:0, ampDecay:62, ampSustain:82,  ampRelease:36, transpose:-12, ...MC1(42) },
  { name:"Tight Sq",    osc1Wave:1, osc1Ctrl1:64,  osc1Level:115, filterType:1, filterCutoff:62, filterResonance:8,  ampAttack:0, ampDecay:30, ampSustain:0,   ampRelease:12, transpose:-12, ...MC(50) },
  { name:"Nasal Sq",    osc1Wave:1, osc1Ctrl1:64,  osc1Level:115, filterType:2, filterCutoff:58, filterResonance:9,  ampAttack:0, ampDecay:55, ampSustain:78,  ampRelease:30, transpose:-12, ...MC(48) },
  { name:"Classic Sq",  osc1Wave:1, osc1Ctrl1:64,  osc1Level:118, filterType:1, filterCutoff:50, filterResonance:6,  ampAttack:0, ampDecay:65, ampSustain:84,  ampRelease:38, transpose:-12, ...MC(44) },
  { name:"Woodsy",      osc1Wave:1, osc1Ctrl1:88,  osc1Level:115, filterType:0, filterCutoff:42, filterResonance:5,  ampAttack:2, ampDecay:72, ampSustain:88,  ampRelease:44, transpose:-12, ...MC(38) },
  { name:"Dark Pulse",  osc1Wave:1, osc1Ctrl1:56,  osc1Level:118, filterType:0, filterCutoff:30, filterResonance:4,  ampAttack:0, ampDecay:75, ampSustain:90,  ampRelease:48, transpose:-12, ...MC(32) },
  { name:"Punch Box",   osc1Wave:1, osc1Ctrl1:64,  osc1Level:115, filterType:1, filterCutoff:68, filterResonance:9,  ampAttack:0, ampDecay:28, ampSustain:0,   ampRelease:10, transpose:-12, ...MC(52) },
  { name:"Hi-Sq",       osc1Wave:1, osc1Ctrl1:64,  osc1Level:115, filterType:1, filterCutoff:75, filterResonance:10, ampAttack:0, ampDecay:50, ampSustain:72,  ampRelease:28, transpose:-12, ...MC(55) },
  { name:"Retro Sq",    osc1Wave:1, osc1Ctrl1:64,  osc1Level:118, filterType:1, filterCutoff:48, filterResonance:7,  ampAttack:0, ampDecay:60, ampSustain:80,  ampRelease:35, transpose:-12, ...MC(44) },
  { name:"Lo-Sq",       osc1Wave:1, osc1Ctrl1:48,  osc1Level:118, filterType:0, filterCutoff:35, filterResonance:5,  ampAttack:0, ampDecay:70, ampSustain:88,  ampRelease:42, transpose:-12, ...MC(35) },
  { name:"Stab Pulse",  osc1Wave:1, osc1Ctrl1:64,  osc1Level:115, filterType:1, filterCutoff:70, filterResonance:9,  ampAttack:0, ampDecay:22, ampSustain:0,   ampRelease:8,  transpose:-12, ...MFE(50) },

  // ─ Segment 5: VoxWave (64-79) ────────────────────────────────────────────
  // VoxWave (osc1Wave:4), formant/vocal character. BPF for nasal emphasis.
  { name:"Vox Bass",    osc1Wave:4, osc1Level:115, filterType:1, filterCutoff:55, filterResonance:7,  ampAttack:0, ampDecay:60, ampSustain:80,  ampRelease:35, transpose:-12, ...MC(48) },
  { name:"Formant Low", osc1Wave:4, osc1Level:115, filterType:2, filterCutoff:48, filterResonance:8,  ampAttack:2, ampDecay:72, ampSustain:85,  ampRelease:44, transpose:-12, ...MC(42) },
  { name:"Vowel Bass",  osc1Wave:4, osc1Level:118, filterType:2, filterCutoff:62, filterResonance:9,  ampAttack:0, ampDecay:55, ampSustain:78,  ampRelease:32, transpose:-12, ...MC(50) },
  { name:"Talker",      osc1Wave:4, osc1Level:115, filterType:1, filterCutoff:70, filterResonance:8,  ampAttack:0, ampDecay:35, ampSustain:50,  ampRelease:20, transpose:-12, ...MC(55) },
  { name:"Chanter",     osc1Wave:4, osc1Level:118, filterType:0, filterCutoff:52, filterResonance:6,  ampAttack:3, ampDecay:80, ampSustain:88,  ampRelease:50, transpose:-12, ...MA(35) },
  { name:"Human Low",   osc1Wave:4, osc1Level:115, filterType:1, filterCutoff:45, filterResonance:7,  ampAttack:2, ampDecay:70, ampSustain:85,  ampRelease:44, transpose:-12, ...MC(42) },
  { name:"Vox Funk",    osc1Wave:4, osc1Level:115, filterType:2, filterCutoff:68, filterResonance:10, ampAttack:0, ampDecay:40, ampSustain:65,  ampRelease:22, transpose:-12, ...MC(52) },
  { name:"Body Vox",    osc1Wave:4, osc1Level:118, filterType:1, filterCutoff:58, filterResonance:7,  ampAttack:0, ampDecay:65, ampSustain:82,  ampRelease:38, transpose:-12, ...MC(46) },
  { name:"Wah Bass",    osc1Wave:4, osc1Level:115, filterType:2, filterCutoff:60, filterResonance:11, filterEgInt:20,filterDecay:28,ampDecay:50, ampSustain:72,  ampRelease:28, transpose:-12, ...MFE(50) },
  { name:"Mutter",      osc1Wave:4, osc1Level:118, filterType:0, filterCutoff:40, filterResonance:6,  ampAttack:2, ampDecay:78, ampSustain:88,  ampRelease:48, transpose:-12, ...MC(38) },
  { name:"Growl Vox",   osc1Wave:4, osc1Level:115, filterType:1, filterCutoff:72, filterResonance:9,  filterEgInt:18,filterDecay:25,ampDecay:45, ampSustain:68,  ampRelease:25, transpose:-12, ...MC(55) },
  { name:"Speech Bass", osc1Wave:4, osc1Level:115, filterType:2, filterCutoff:56, filterResonance:8,  ampAttack:0, ampDecay:58, ampSustain:78,  ampRelease:34, transpose:-12, ...MC(48) },
  { name:"Nasal Vox",   osc1Wave:4, osc1Level:115, filterType:2, filterCutoff:64, filterResonance:10, ampAttack:0, ampDecay:42, ampSustain:65,  ampRelease:24, transpose:-12, ...MFE(50) },
  { name:"Wide Vox",    osc1Wave:4, osc1Level:118, filterType:0, filterCutoff:50, filterResonance:6,  ampAttack:3, ampDecay:75, ampSustain:86,  ampRelease:46, transpose:-12, ...MC(42) },
  { name:"Vox Sub",     osc1Wave:4, osc1Level:120, filterType:0, filterCutoff:30, filterResonance:4,  ampAttack:0, ampDecay:85, ampSustain:92,  ampRelease:52, transpose:-12, ...MC(32) },
  { name:"Vox Punch",   osc1Wave:4, osc1Level:115, filterType:1, filterCutoff:65, filterResonance:9,  ampAttack:0, ampDecay:22, ampSustain:0,   ampRelease:10, transpose:-12, ...MC(52) },

  // ─ Segment 6: DWGS Digital (80-95) ───────────────────────────────────────
  // DWGS (osc1Wave:5), osc1Ctrl1=wave select 0-15. Digital timbres.
  { name:"D-Bass 1",    osc1Wave:5, osc1Ctrl1:0,  osc1Level:118, filterType:1, filterCutoff:55, filterResonance:7,  ampAttack:0, ampDecay:60, ampSustain:82,  ampRelease:35, transpose:-12, ...MC(45) },
  { name:"D-Bass 2",    osc1Wave:5, osc1Ctrl1:2,  osc1Level:118, filterType:0, filterCutoff:45, filterResonance:5,  ampAttack:2, ampDecay:75, ampSustain:88,  ampRelease:45, transpose:-12, ...MC(38) },
  { name:"Digital Sub", osc1Wave:5, osc1Ctrl1:4,  osc1Level:120, filterType:0, filterCutoff:35, filterResonance:4,  ampAttack:0, ampDecay:85, ampSustain:90,  ampRelease:50, transpose:-12, ...MC(32) },
  { name:"Steel Bass",  osc1Wave:5, osc1Ctrl1:6,  osc1Level:115, filterType:1, filterCutoff:65, filterResonance:9,  ampAttack:0, ampDecay:42, ampSustain:70,  ampRelease:25, transpose:-12, ...MC(50) },
  { name:"Glass Low",   osc1Wave:5, osc1Ctrl1:8,  osc1Level:115, filterType:1, filterCutoff:55, filterResonance:8,  ampAttack:1, ampDecay:68, ampSustain:80,  ampRelease:38, transpose:-12, ...ML(30) },
  { name:"Crystal",     osc1Wave:5, osc1Ctrl1:10, osc1Level:115, filterType:1, filterCutoff:70, filterResonance:9,  ampAttack:0, ampDecay:55, ampSustain:72,  ampRelease:30, transpose:-12, ...MC(52) },
  { name:"Bell Low",    osc1Wave:5, osc1Ctrl1:12, osc1Level:112, filterType:1, filterCutoff:60, filterResonance:8,  ampAttack:0, ampDecay:65, ampSustain:40,  ampRelease:45, transpose:-12, ...MC(42) },
  { name:"Bowed Sub",   osc1Wave:5, osc1Ctrl1:14, osc1Level:118, filterType:0, filterCutoff:45, filterResonance:6,  ampAttack:5, ampDecay:80, ampSustain:88,  ampRelease:50, transpose:-12, ...MA(35) },
  { name:"D-Pluck",     osc1Wave:5, osc1Ctrl1:1,  osc1Level:115, filterType:1, filterCutoff:72, filterResonance:10, ampAttack:0, ampDecay:35, ampSustain:0,   ampRelease:18, transpose:-12, ...MC(50) },
  { name:"D-Thick",     osc1Wave:5, osc1Ctrl1:3,  osc1Level:118, filterType:0, filterCutoff:50, filterResonance:6,  ampAttack:0, ampDecay:70, ampSustain:85,  ampRelease:42, transpose:-12, ...MC(42) },
  { name:"D-Growl",     osc1Wave:5, osc1Ctrl1:5,  osc1Level:115, filterType:1, filterCutoff:48, filterResonance:8,  filterEgInt:15,filterDecay:28,ampDecay:62, ampSustain:80,  ampRelease:35, transpose:-12, ...MFE(48) },
  { name:"D-Metal",     osc1Wave:5, osc1Ctrl1:7,  osc1Level:115, filterType:1, filterCutoff:62, filterResonance:11, ampAttack:0, ampDecay:48, ampSustain:65,  ampRelease:28, transpose:-12, ...MC(52) },
  { name:"D-Smooth",    osc1Wave:5, osc1Ctrl1:9,  osc1Level:118, filterType:0, filterCutoff:40, filterResonance:5,  ampAttack:2, ampDecay:78, ampSustain:90,  ampRelease:48, transpose:-12, ...MC(36) },
  { name:"D-Sharp",     osc1Wave:5, osc1Ctrl1:11, osc1Level:115, filterType:1, filterCutoff:68, filterResonance:9,  ampAttack:0, ampDecay:38, ampSustain:55,  ampRelease:22, transpose:-12, ...MC(52) },
  { name:"D-Warm",      osc1Wave:5, osc1Ctrl1:13, osc1Level:118, filterType:0, filterCutoff:52, filterResonance:7,  ampAttack:1, ampDecay:68, ampSustain:84,  ampRelease:40, transpose:-12, ...ML(25) },
  { name:"D-Stab",      osc1Wave:5, osc1Ctrl1:15, osc1Level:115, filterType:1, filterCutoff:75, filterResonance:10, ampAttack:0, ampDecay:22, ampSustain:0,   ampRelease:10, transpose:-12, ...MC(55) },

  // ─ Segment 7: Noise-Blend Basses (96-111) ────────────────────────────────
  // Add noiseLevel for grit/texture. Varied base oscillators.
  { name:"Grit Sub",    osc1Wave:3, osc1Level:112, noiseLevel:15, filterType:0, filterCutoff:30, filterResonance:3,  ampAttack:0, ampDecay:80, ampSustain:90,  ampRelease:48, transpose:-12, ...MC(30) },
  { name:"Sandy",       osc1Wave:2, osc1Level:110, noiseLevel:20, filterType:1, filterCutoff:50, filterResonance:6,  ampAttack:0, ampDecay:55, ampSustain:78,  ampRelease:32, transpose:-12, ...MC(42) },
  { name:"Raw Saw",     osc1Wave:0, osc1Level:110, noiseLevel:12, filterType:1, filterCutoff:60, filterResonance:8,  ampAttack:0, ampDecay:45, ampSustain:72,  ampRelease:26, transpose:-12, ...MC(50) },
  { name:"Fuzzy",       osc1Wave:1, osc1Ctrl1:64, osc1Level:110, noiseLevel:18, filterType:1, filterCutoff:45, filterResonance:7, ampAttack:0, ampDecay:60, ampSustain:80, ampRelease:36, transpose:-12, ...MC(44) },
  { name:"Wooly",       osc1Wave:2, osc1Level:112, noiseLevel:25, filterType:0, filterCutoff:42, filterResonance:5,  ampAttack:2, ampDecay:70, ampSustain:85,  ampRelease:44, transpose:-12, ...MC(38) },
  { name:"Gravel",      osc1Wave:0, osc1Level:108, noiseLevel:30, filterType:1, filterCutoff:55, filterResonance:9,  ampAttack:0, ampDecay:50, ampSustain:75,  ampRelease:28, transpose:-12, ...MC(48) },
  { name:"Dusty",       osc1Wave:3, osc1Level:112, noiseLevel:10, filterType:0, filterCutoff:28, filterResonance:3,  ampAttack:0, ampDecay:85, ampSustain:92,  ampRelease:50, transpose:-12, ...MC(28) },
  { name:"Raspy",       osc1Wave:0, osc1Level:108, noiseLevel:22, filterType:1, filterCutoff:65, filterResonance:10, ampAttack:0, ampDecay:38, ampSustain:60,  ampRelease:22, transpose:-12, ...MFE(52) },
  { name:"Grainy",      osc1Wave:1, osc1Ctrl1:64, osc1Level:110, noiseLevel:15, filterType:1, filterCutoff:50, filterResonance:7, ampAttack:0, ampDecay:55, ampSustain:78, ampRelease:32, transpose:-12, ...MC(44) },
  { name:"Crunch",      osc1Wave:0, osc1Level:108, noiseLevel:28, filterType:1, filterCutoff:70, filterResonance:10, ampAttack:0, ampDecay:35, ampSustain:55,  ampRelease:20, transpose:-12, ...MC(55) },
  { name:"Rough Sub",   osc1Wave:3, osc1Level:112, noiseLevel:8,  filterType:0, filterCutoff:22, filterResonance:2,  ampAttack:0, ampDecay:90, ampSustain:95,  ampRelease:55, transpose:-12, ...MC(25) },
  { name:"Grit Funk",   osc1Wave:0, osc1Level:108, noiseLevel:18, filterType:1, filterCutoff:60, filterResonance:9,  ampAttack:0, ampDecay:42, ampSustain:70,  ampRelease:24, transpose:-12, ...MC(52) },
  { name:"Static Bass", osc1Wave:6, osc1Level:105,                filterType:1, filterCutoff:40, filterResonance:5,  ampAttack:2, ampDecay:65, ampSustain:75,  ampRelease:38, ...MC(38) },
  { name:"Air Bass",    osc1Wave:3, osc1Level:108, noiseLevel:35, filterType:1, filterCutoff:55, filterResonance:6,  ampAttack:0, ampDecay:60, ampSustain:78,  ampRelease:35, transpose:-12, ...ML(32) },
  { name:"Vinyl",       osc1Wave:1, osc1Ctrl1:64, osc1Level:110, noiseLevel:20, filterType:0, filterCutoff:48, filterResonance:6, ampAttack:2, ampDecay:68, ampSustain:82, ampRelease:42, transpose:-12, ...MC(42) },
  { name:"Lo-Grit",     osc1Wave:2, osc1Level:110, noiseLevel:30, filterType:0, filterCutoff:35, filterResonance:4,  ampAttack:0, ampDecay:72, ampSustain:86,  ampRelease:46, transpose:-12, ...MC(35) },

  // ─ Segment 8: Special/Hybrid (112-127) ───────────────────────────────────
  // Ring mod (osc2Mod:1), BPF textures, HPF, OSC2 layering.
  { name:"Ring Sub",    osc1Wave:3, osc1Level:112, osc2Wave:0, osc2Level:60, osc2Mod:1, filterType:1, filterCutoff:55, filterResonance:7,  ampAttack:0, ampDecay:70, ampSustain:75, ampRelease:40, transpose:-12, ...MC(45) },
  { name:"Metal Low",   osc1Wave:0, osc1Level:112, osc2Wave:1, osc2Level:65, osc2Mod:1, filterType:1, filterCutoff:65, filterResonance:8,  ampAttack:0, ampDecay:55, ampSustain:65, ampRelease:32, transpose:-12, ...MC(50) },
  { name:"Clang",       osc1Wave:1, osc1Ctrl1:64, osc1Level:110, osc2Wave:2, osc2Level:70, osc2Mod:1, filterType:1, filterCutoff:58, filterResonance:9,  ampAttack:0, ampDecay:48, ampSustain:55, ampRelease:28, transpose:-12, ...MFE(48) },
  { name:"Iron Bass",   osc1Wave:0, osc1Level:112, osc2Wave:0, osc2Level:75, osc2Mod:1, filterType:1, filterCutoff:52, filterResonance:8,  ampAttack:0, ampDecay:62, ampSustain:70, ampRelease:36, transpose:-12, ...MC(48) },
  { name:"Bell Bass",   osc1Wave:3, osc1Level:110, osc2Wave:1, osc2Level:80, osc2Mod:1, filterType:1, filterCutoff:70, filterResonance:10, ampAttack:0, ampDecay:65, ampSustain:35, ampRelease:42, transpose:-12, ...MC(52) },
  { name:"Buzz",        osc1Wave:0, osc1Level:112, osc2Wave:1, osc2Level:70, osc2Mod:1, filterType:1, filterCutoff:60, filterResonance:9,  ampAttack:0, ampDecay:52, ampSustain:65, ampRelease:30, transpose:-12, ...MC(50) },
  { name:"Clash",       osc1Wave:1, osc1Ctrl1:64, osc1Level:110, osc2Wave:0, osc2Level:65, osc2Mod:1, filterType:2, filterCutoff:55, filterResonance:10, ampAttack:0, ampDecay:45, ampSustain:55, ampRelease:26, transpose:-12, ...MC(48) },
  { name:"Tin Bass",    osc1Wave:2, osc1Level:112, osc2Wave:1, osc2Level:72, osc2Mod:1, filterType:1, filterCutoff:65, filterResonance:9,  ampAttack:0, ampDecay:58, ampSustain:60, ampRelease:32, transpose:-12, ...MFE(50) },
  { name:"BPF Funk",    osc1Wave:0, osc1Level:115, filterType:2, filterCutoff:65, filterResonance:12, filterEgInt:22,filterDecay:25,ampDecay:40, ampSustain:65,  ampRelease:22, transpose:-12, ...MC(55) },
  { name:"BPF Sub",     osc1Wave:3, osc1Level:118, filterType:2, filterCutoff:48, filterResonance:9,  ampAttack:0, ampDecay:75, ampSustain:85,  ampRelease:45, transpose:-12, ...MC(40) },
  { name:"BPF Growl",   osc1Wave:0, osc1Level:115, filterType:2, filterCutoff:58, filterResonance:12, filterEgInt:20,filterDecay:28,ampDecay:55, ampSustain:75,  ampRelease:32, transpose:-12, ...MFE(52) },
  { name:"HPF Buzz",    osc1Wave:0, osc1Level:112, filterType:3, filterCutoff:40, filterResonance:8,  ampAttack:0, ampDecay:55, ampSustain:72,  ampRelease:30, transpose:-12, ...MC(48) },
  { name:"Full Stack",  osc1Wave:0, osc1Level:110, osc2Wave:2, osc2Level:80, filterType:1, filterCutoff:58, filterResonance:7,  ampAttack:0, ampDecay:65, ampSustain:82,  ampRelease:38, transpose:-12, ...MO2(20) },
  { name:"Thick Lay",   osc1Wave:3, osc1Level:112, osc2Wave:1, osc2Level:75, filterType:0, filterCutoff:38, filterResonance:5,  ampAttack:0, ampDecay:80, ampSustain:88,  ampRelease:48, transpose:-12, ...MC(38) },
  { name:"Combo",       osc1Wave:2, osc1Level:112, osc2Wave:3, osc2Level:80, filterType:2, filterCutoff:52, filterResonance:8,  ampAttack:0, ampDecay:65, ampSustain:80,  ampRelease:38, transpose:-12, ...ML(28) },
  { name:"Power Low",   osc1Wave:0, osc1Level:110, osc2Wave:0, osc2Level:85, filterType:1, filterCutoff:50, filterResonance:8,  ampAttack:0, ampDecay:60, ampSustain:82,  ampRelease:35, transpose:-12, ...MC(46) },

  // ─ Bank B: Keys / Leads / Pads (patches 128-191) ─────────────────────────
  // kbdOctave:0 (default, no auto shift)

  // ─ B1: Plucks & Bells (128-143) ──────────────────────────────────────────
  { name:"Bell Pluck",  osc1Wave:5, osc1Ctrl1:12, osc1Level:112, filterType:1, filterCutoff:90, filterResonance:8,  ampAttack:0, ampDecay:65, ampSustain:20, ampRelease:50, ...MC(38) },
  { name:"Mallet",      osc1Wave:5, osc1Ctrl1:8,  osc1Level:112, filterType:1, filterCutoff:80, filterResonance:7,  ampAttack:0, ampDecay:75, ampSustain:25, ampRelease:55, ...MC(35) },
  { name:"Music Box",   osc1Wave:3, osc1Level:112, filterType:1, filterCutoff:100,filterResonance:6, ampAttack:0, ampDecay:60, ampSustain:10, ampRelease:45, ...MC(30) },
  { name:"Harp",        osc1Wave:2, osc1Level:112, filterType:2, filterCutoff:85, filterResonance:8,  ampAttack:0, ampDecay:55, ampSustain:0,  ampRelease:35, ...MC(35) },
  { name:"Marimba",     osc1Wave:1, osc1Ctrl1:64, osc1Level:112, filterType:1, filterCutoff:88, filterResonance:7,  ampAttack:0, ampDecay:50, ampSustain:0,  ampRelease:30, ...MC(32) },
  { name:"Vibes",       osc1Wave:5, osc1Ctrl1:6,  osc1Level:112, filterType:1, filterCutoff:85, filterResonance:7,  ampAttack:0, ampDecay:70, ampSustain:15, ampRelease:55, ...MC(33) },
  { name:"Pluck Key",   osc1Wave:2, osc1Level:115, filterType:1, filterCutoff:78, filterResonance:8,  ampAttack:0, ampDecay:40, ampSustain:0,  ampRelease:25, ...MC(38) },
  { name:"E-Piano",     osc1Wave:3, osc1Level:115, filterType:1, filterCutoff:75, filterResonance:6,  ampAttack:2, ampDecay:80, ampSustain:45, ampRelease:55, lfo1Wave:2, lfo1Rate:8, vp1Src:4, vp1Dst:2, vp1Int:8, ...ML(25) },
  { name:"DX Bell",     osc1Wave:5, osc1Ctrl1:10, osc1Level:112, filterType:1, filterCutoff:95, filterResonance:8,  ampAttack:0, ampDecay:72, ampSustain:12, ampRelease:58, ...MC(35) },
  { name:"Glass Bell",  osc1Wave:5, osc1Ctrl1:14, osc1Level:110, filterType:1, filterCutoff:100,filterResonance:6,  ampAttack:1, ampDecay:68, ampSustain:8,  ampRelease:52, ...MC(30) },
  { name:"Metal Bell",  osc1Wave:0, osc1Level:110, osc2Wave:0, osc2Level:75, osc2Mod:1, filterType:1, filterCutoff:88, filterResonance:9,  ampAttack:0, ampDecay:60, ampSustain:10, ampRelease:45, ...MC(35) },
  { name:"Thumb Piano", osc1Wave:5, osc1Ctrl1:2,  osc1Level:112, filterType:1, filterCutoff:82, filterResonance:7,  ampAttack:0, ampDecay:45, ampSustain:0,  ampRelease:28, ...MC(30) },
  { name:"Steel Pan",   osc1Wave:5, osc1Ctrl1:4,  osc1Level:112, filterType:1, filterCutoff:90, filterResonance:7,  ampAttack:0, ampDecay:58, ampSustain:8,  ampRelease:40, ...MC(32) },
  { name:"Glock",       osc1Wave:5, osc1Ctrl1:0,  osc1Level:112, filterType:1, filterCutoff:105,filterResonance:6,  ampAttack:0, ampDecay:40, ampSustain:0,  ampRelease:22, ...MC(28) },
  { name:"Celesta",     osc1Wave:3, osc1Level:110, filterType:1, filterCutoff:110,filterResonance:5,  ampAttack:0, ampDecay:48, ampSustain:0,  ampRelease:28, ...MC(25) },
  { name:"Crystal Bell",osc1Wave:5, osc1Ctrl1:16, osc1Level:110, filterType:1, filterCutoff:100,filterResonance:8,  ampAttack:0, ampDecay:80, ampSustain:15, ampRelease:60, ...MC(32) },

  // ─ B2: Warm Pads & Strings (144-159) ─────────────────────────────────────
  { name:"Warm Pad",    osc1Wave:2, osc1Level:115, filterType:1, filterCutoff:72, filterResonance:6,  ampAttack:18, ampDecay:90, ampSustain:80, ampRelease:70, ...ML(28) },
  { name:"String Pad",  osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:78, filterResonance:7,  ampAttack:20, ampDecay:90, ampSustain:78, ampRelease:68, ...MA(25) },
  { name:"Lush Pad",    osc1Wave:3, osc1Level:112, filterType:1, filterCutoff:68, filterResonance:5,  ampAttack:30, ampDecay:95, ampSustain:82, ampRelease:75, ...MC(28) },
  { name:"Vox Pad",     osc1Wave:4, osc1Level:112, filterType:2, filterCutoff:65, filterResonance:7,  ampAttack:15, ampDecay:88, ampSustain:80, ampRelease:70, ...MA(30) },
  { name:"Soft Strings",osc1Wave:0, osc1Level:112, filterType:1, filterCutoff:80, filterResonance:6,  ampAttack:20, ampDecay:88, ampSustain:76, ampRelease:68, ...MC(25) },
  { name:"Analog Pad",  osc1Wave:2, osc1Level:115, filterType:1, filterCutoff:70, filterResonance:7,  ampAttack:10, ampDecay:85, ampSustain:78, ampRelease:65, ...ML(25) },
  { name:"Dreamy",      osc1Wave:3, osc1Level:112, filterType:1, filterCutoff:65, filterResonance:5,  ampAttack:25, ampDecay:95, ampSustain:82, ampRelease:78, ...MA(22) },
  { name:"Mellow Pad",  osc1Wave:2, osc1Level:112, filterType:1, filterCutoff:68, filterResonance:6,  ampAttack:5,  ampDecay:85, ampSustain:80, ampRelease:65, ...MC(28) },
  { name:"Air Pad",     osc1Wave:3, osc1Level:110, filterType:2, filterCutoff:72, filterResonance:7,  ampAttack:40, ampDecay:95, ampSustain:82, ampRelease:78, ...ML(22) },
  { name:"Choir",       osc1Wave:4, osc1Level:112, filterType:1, filterCutoff:70, filterResonance:6,  ampAttack:15, ampDecay:90, ampSustain:80, ampRelease:72, ...MA(28) },
  { name:"Cloud",       osc1Wave:3, osc1Level:110, filterType:1, filterCutoff:62, filterResonance:5,  ampAttack:50, ampDecay:100,ampSustain:85, ampRelease:82, ...ML(18) },
  { name:"Dusk Pad",    osc1Wave:2, osc1Level:112, filterType:0, filterCutoff:58, filterResonance:5,  ampAttack:8,  ampDecay:88, ampSustain:80, ampRelease:68, ...MC(25) },
  { name:"Dawn",        osc1Wave:0, osc1Level:112, filterType:1, filterCutoff:82, filterResonance:7,  ampAttack:35, ampDecay:90, ampSustain:78, ampRelease:72, ...MA(25) },
  { name:"Space Pad",   osc1Wave:4, osc1Level:110, filterType:2, filterCutoff:68, filterResonance:8,  ampAttack:20, ampDecay:92, ampSustain:80, ampRelease:75, ...ML(22) },
  { name:"Shimmer",     osc1Wave:2, osc1Level:110, filterType:3, filterCutoff:60, filterResonance:7,  ampAttack:15, ampDecay:88, ampSustain:78, ampRelease:70, ...MC(28) },
  { name:"Sustainer",   osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:75, filterResonance:7,  ampAttack:0,  ampDecay:90, ampSustain:85, ampRelease:65, ...MC(30) },

  // ─ B3: Mono Leads (160-175) ───────────────────────────────────────────────
  { name:"Saw Lead",    osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:80, filterResonance:9,  ampAttack:0, ampDecay:65, ampSustain:72, ampRelease:30, ...MP(25) },
  { name:"Square Lead", osc1Wave:1, osc1Ctrl1:64, osc1Level:115, filterType:1, filterCutoff:75, filterResonance:8, ampAttack:0, ampDecay:60, ampSustain:70, ampRelease:28, ...MP(22) },
  { name:"Sync Lead",   osc1Wave:0, osc1Level:112, osc2Wave:0, osc2Level:90, osc2Mod:2, filterType:1, filterCutoff:78, filterResonance:10, ampAttack:0, ampDecay:62, ampSustain:68, ampRelease:30, ...MC(35) },
  { name:"Acid Lead",   osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:50, filterResonance:13, filterEgInt:30,filterDecay:20,ampAttack:0, ampDecay:55, ampSustain:65, ampRelease:25, ...MC(50) },
  { name:"Whistle",     osc1Wave:3, osc1Level:112, filterType:1, filterCutoff:95, filterResonance:7,  ampAttack:5, ampDecay:85, ampSustain:72, ampRelease:45, ...MP(20) },
  { name:"Flute",       osc1Wave:2, osc1Level:112, filterType:1, filterCutoff:88, filterResonance:6,  ampAttack:8, ampDecay:80, ampSustain:70, ampRelease:48, ...MP(18) },
  { name:"Oboe",        osc1Wave:1, osc1Ctrl1:80, osc1Level:112, filterType:2, filterCutoff:82, filterResonance:9, ampAttack:5, ampDecay:78, ampSustain:68, ampRelease:42, ...MA(25) },
  { name:"Brass Lead",  osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:70, filterResonance:9,  ampAttack:3, ampDecay:65, ampSustain:72, ampRelease:32, ...MC(35) },
  { name:"Soft Lead",   osc1Wave:2, osc1Level:112, filterType:1, filterCutoff:65, filterResonance:7,  ampAttack:3, ampDecay:70, ampSustain:70, ampRelease:40, ...MP(20) },
  { name:"Bite Lead",   osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:85, filterResonance:10, ampAttack:0, ampDecay:55, ampSustain:65, ampRelease:26, ...MC(38) },
  { name:"Fat Lead",    osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:72, filterResonance:8,  ampAttack:2, ampDecay:75, ampSustain:74, ampRelease:38, ...MC(32) },
  { name:"Thin Lead",   osc1Wave:1, osc1Ctrl1:100,osc1Level:112, filterType:1, filterCutoff:90, filterResonance:9,  ampAttack:0, ampDecay:60, ampSustain:68, ampRelease:28, ...MP(25) },
  { name:"Moog Lead",   osc1Wave:0, osc1Level:115, filterType:0, filterCutoff:75, filterResonance:11, ampAttack:0, ampDecay:65, ampSustain:72, ampRelease:32, ...MC(40) },
  { name:"Liquid Lead", osc1Wave:2, osc1Level:112, filterType:1, filterCutoff:70, filterResonance:8,  ampAttack:2, ampDecay:68, ampSustain:70, ampRelease:38, ...MC(32) },
  { name:"Screamer",    osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:88, filterResonance:12, ampAttack:0, ampDecay:60, ampSustain:70, ampRelease:28, ...MP(30) },
  { name:"Classic Lead",osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:75, filterResonance:9,  ampAttack:1, ampDecay:68, ampSustain:72, ampRelease:34, ...MC(35) },

  // ─ B4: Funky Keys & Comps (176-191) ──────────────────────────────────────
  { name:"Clav",        osc1Wave:1, osc1Ctrl1:64, osc1Level:115, filterType:1, filterCutoff:90, filterResonance:10, ampAttack:0, ampDecay:38, ampSustain:0,  ampRelease:20, ...MC(50) },
  { name:"Wah Clav",    osc1Wave:1, osc1Ctrl1:64, osc1Level:115, filterType:2, filterCutoff:72, filterResonance:12, filterEgInt:25,filterDecay:22,ampDecay:35, ampSustain:0,  ampRelease:18, ...MC(55) },
  { name:"Funk Key",    osc1Wave:0, osc1Level:115, filterType:2, filterCutoff:78, filterResonance:11, ampAttack:0, ampDecay:42, ampSustain:20, ampRelease:22, ...MFE(48) },
  { name:"Organ",       osc1Wave:2, osc1Level:118, filterType:1, filterCutoff:95, filterResonance:4,  ampAttack:3, ampDecay:127,ampSustain:100,ampRelease:15, ...ML(25) },
  { name:"Rock Organ",  osc1Wave:0, osc1Level:118, filterType:1, filterCutoff:100,filterResonance:5,  ampAttack:2, ampDecay:127,ampSustain:100,ampRelease:18, ...ML(30) },
  { name:"Piano",       osc1Wave:5, osc1Ctrl1:0,  osc1Level:115, filterType:1, filterCutoff:85, filterResonance:5,  ampAttack:0, ampDecay:80, ampSustain:35, ampRelease:50, ...MC(30) },
  { name:"Rhodes",      osc1Wave:3, osc1Level:115, filterType:1, filterCutoff:78, filterResonance:6,  ampAttack:2, ampDecay:85, ampSustain:40, ampRelease:60, lfo1Wave:2, lfo1Rate:6, vp1Src:4, vp1Dst:2, vp1Int:6, ...ML(20) },
  { name:"Wurli",       osc1Wave:1, osc1Ctrl1:64, osc1Level:115, filterType:2, filterCutoff:82, filterResonance:9,  ampAttack:0, ampDecay:55, ampSustain:22, ampRelease:32, ...MC(42) },
  { name:"Stab",        osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:88, filterResonance:9,  ampAttack:0, ampDecay:15, ampSustain:0,  ampRelease:5,  ...MC(50) },
  { name:"Brass Stab",  osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:82, filterResonance:8,  ampAttack:5, ampDecay:20, ampSustain:80, ampRelease:10, ...MC(42) },
  { name:"Comp Stab",   osc1Wave:1, osc1Ctrl1:64, osc1Level:115, filterType:1, filterCutoff:85, filterResonance:9,  ampAttack:0, ampDecay:18, ampSustain:0,  ampRelease:8,  ...MFE(52) },
  { name:"Chop",        osc1Wave:2, osc1Level:112, filterType:1, filterCutoff:80, filterResonance:8,  ampAttack:0, ampDecay:32, ampSustain:0,  ampRelease:15, ...MC(45) },
  { name:"Pluck Key 2", osc1Wave:5, osc1Ctrl1:6,  osc1Level:112, filterType:1, filterCutoff:85, filterResonance:7,  ampAttack:0, ampDecay:45, ampSustain:0,  ampRelease:25, ...MC(35) },
  { name:"Synth Key",   osc1Wave:2, osc1Level:115, filterType:1, filterCutoff:78, filterResonance:7,  ampAttack:0, ampDecay:65, ampSustain:55, ampRelease:35, ...MC(35) },
  { name:"Mono Comp",   osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:80, filterResonance:8,  ampAttack:0, ampDecay:30, ampSustain:70, ampRelease:15, ...MFE(48) },
  { name:"Bright Comp", osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:88, filterResonance:9,  ampAttack:0, ampDecay:28, ampSustain:55, ampRelease:14, ...MC(52) },

  // ─ Bank C: FX & Textures (patches 192-255) ───────────────────────────────
  // Psychedelic, atmospheric, experimental. No reverb/delay (live FX only).

  // ─ C1: Noise & Texture (192-207) ─────────────────────────────────────────
  { name:"White Wind",  osc1Wave:6, osc1Level:105, filterType:3, filterCutoff:55, filterResonance:5,  ampAttack:30, ampDecay:100,ampSustain:80, ampRelease:85, ...MA(30) },
  { name:"Pink Noise",  osc1Wave:6, osc1Level:108, filterType:0, filterCutoff:60, filterResonance:4,  ampAttack:10, ampDecay:95, ampSustain:78, ampRelease:75, ...MC(28) },
  { name:"Static Hiss", osc1Wave:6, osc1Level:100, filterType:3, filterCutoff:50, filterResonance:5,  ampAttack:15, ampDecay:90, ampSustain:75, ampRelease:80, ...MA(25) },
  { name:"Crackle",     osc1Wave:6, osc1Level:100, filterType:2, filterCutoff:70, filterResonance:8,  ampAttack:0,  ampDecay:45, ampSustain:30, ampRelease:30, ...MC(35) },
  { name:"Storm",       osc1Wave:6, osc1Level:110, filterType:0, filterCutoff:40, filterResonance:4,  ampAttack:40, ampDecay:110,ampSustain:85, ampRelease:90, ...MA(28) },
  { name:"Breath",      osc1Wave:6, osc1Level:105, filterType:3, filterCutoff:65, filterResonance:5,  ampAttack:20, ampDecay:85, ampSustain:70, ampRelease:75, ...MA(22) },
  { name:"Friction",    osc1Wave:6, osc1Level:105, filterType:2, filterCutoff:72, filterResonance:9,  ampAttack:0,  ampDecay:55, ampSustain:45, ampRelease:35, ...MC(38) },
  { name:"Grain",       osc1Wave:6, osc1Level:100, noiseLevel:30, filterType:0, filterCutoff:55, filterResonance:5, ampAttack:8, ampDecay:80, ampSustain:65, ampRelease:70, ...MA(22) },
  { name:"Bubble",      osc1Wave:6, osc1Level:100, filterType:3, filterCutoff:45, filterResonance:7,  ampAttack:5,  ampDecay:70, ampSustain:60, ampRelease:60, lfo1Wave:2, lfo1Rate:25, vp1Src:4, vp1Dst:3, vp1Int:35, ...ML(40) },
  { name:"Sizzle",      osc1Wave:6, osc1Level:100, filterType:3, filterCutoff:60, filterResonance:6,  ampAttack:0,  ampDecay:60, ampSustain:50, ampRelease:50, ...MC(30) },
  { name:"Rumble FX",   osc1Wave:6, osc1Level:108, filterType:0, filterCutoff:30, filterResonance:4,  ampAttack:25, ampDecay:100,ampSustain:80, ampRelease:85, ...MA(25) },
  { name:"Scratch",     osc1Wave:6, osc1Level:105, filterType:2, filterCutoff:65, filterResonance:8,  ampAttack:0,  ampDecay:28, ampSustain:0,  ampRelease:15, ...MC(38) },
  { name:"Vinyl Hiss",  osc1Wave:6, osc1Level:95,  filterType:0, filterCutoff:50, filterResonance:4,  ampAttack:20, ampDecay:95, ampSustain:78, ampRelease:80, ...MA(20) },
  { name:"Air Burst",   osc1Wave:6, osc1Level:108, filterType:3, filterCutoff:70, filterResonance:6,  ampAttack:0,  ampDecay:35, ampSustain:0,  ampRelease:20, ...MC(35) },
  { name:"Dust",        osc1Wave:6, osc1Level:95,  filterType:0, filterCutoff:45, filterResonance:4,  ampAttack:15, ampDecay:90, ampSustain:72, ampRelease:78, ...MA(20) },
  { name:"Cosmic Ray",  osc1Wave:6, osc1Level:100, filterType:3, filterCutoff:75, filterResonance:8,  ampAttack:5,  ampDecay:65, ampSustain:40, ampRelease:48, ...MC(35) },

  // ─ C2: Psychedelic (208-223) ─────────────────────────────────────────────
  { name:"Theremin",    osc1Wave:3, osc1Level:112, filterType:1, filterCutoff:80, filterResonance:5,  ampAttack:8,  ampDecay:90, ampSustain:78, ampRelease:60, lfo1Wave:2, lfo1Rate:6, vp1Src:4, vp1Dst:0, vp1Int:12, ...MP(35) },
  { name:"Ring Drone",  osc1Wave:3, osc1Level:110, osc2Wave:1, osc2Level:75, osc2Mod:1, filterType:2, filterCutoff:65, filterResonance:8, ampAttack:5, ampDecay:90, ampSustain:82, ampRelease:70, ...ML(28) },
  { name:"Space Bell",  osc1Wave:5, osc1Ctrl1:12, osc1Level:110, osc2Wave:0, osc2Level:65, osc2Mod:1, filterType:3, filterCutoff:60, filterResonance:7, ampAttack:8, ampDecay:80, ampSustain:35, ampRelease:65, ...MC(32) },
  { name:"Alien Pad",   osc1Wave:4, osc1Level:110, filterType:2, filterCutoff:68, filterResonance:10, ampAttack:20, ampDecay:90, ampSustain:78, ampRelease:72, ...ML(30) },
  { name:"Pulse Space", osc1Wave:1, osc1Ctrl1:64, osc1Level:110, filterType:1, filterCutoff:62, filterResonance:7, ampAttack:15, ampDecay:95, ampSustain:80, ampRelease:78, lfo1Wave:2, lfo1Rate:4, vp1Src:4, vp1Dst:2, vp1Int:15, ...ML(32) },
  { name:"Warp",        osc1Wave:0, osc1Level:110, osc2Wave:0, osc2Level:75, osc2Mod:1, filterType:1, filterCutoff:55, filterResonance:9,  filterEgInt:25,filterDecay:40, ampDecay:75, ampSustain:65, ampRelease:58, ...MC(42) },
  { name:"S&H Pad",     osc1Wave:3, osc1Level:110, filterType:1, filterCutoff:70, filterResonance:7,  ampAttack:5,  ampDecay:88, ampSustain:78, ampRelease:68, lfo1Wave:3, lfo1Rate:25, vp1Src:4, vp1Dst:2, vp1Int:20, ...ML(38) },
  { name:"Orbital",     osc1Wave:2, osc1Level:110, filterType:1, filterCutoff:65, filterResonance:8,  ampAttack:10, ampDecay:90, ampSustain:78, ampRelease:70, lfo1Wave:2, lfo1Rate:10, vp1Src:4, vp1Dst:2, vp1Int:18, ...ML(35) },
  { name:"Cosmic",      osc1Wave:5, osc1Ctrl1:20, osc1Level:110, filterType:2, filterCutoff:70, filterResonance:9,  ampAttack:20, ampDecay:95, ampSustain:78, ampRelease:75, ...ML(28) },
  { name:"Resonance",   osc1Wave:3, osc1Level:112, filterType:2, filterCutoff:55, filterResonance:14, ampAttack:5,  ampDecay:88, ampSustain:75, ampRelease:68, ...MC(35) },
  { name:"Laser",       osc1Wave:0, osc1Level:112, filterType:3, filterCutoff:80, filterResonance:10, filterEgInt:-30,filterDecay:40, ampAttack:0, ampDecay:45, ampSustain:25, ampRelease:22, ...MP(-40) },
  { name:"Phasor",      osc1Wave:1, osc1Ctrl1:64, osc1Level:110, filterType:2, filterCutoff:65, filterResonance:9,  ampAttack:5, ampDecay:80, ampSustain:65, ampRelease:58, lfo1Wave:2, lfo1Rate:15, vp1Src:4, vp1Dst:2, vp1Int:18, ...ML(35) },
  { name:"Warble",      osc1Wave:2, osc1Level:110, filterType:1, filterCutoff:68, filterResonance:7,  ampAttack:8, ampDecay:85, ampSustain:72, ampRelease:65, lfo1Wave:2, lfo1Rate:8, vp1Src:4, vp1Dst:0, vp1Int:10, ...ML(30) },
  { name:"Galaxy",      osc1Wave:4, osc1Level:108, filterType:2, filterCutoff:72, filterResonance:10, ampAttack:30, ampDecay:95, ampSustain:80, ampRelease:78, ...MA(28) },
  { name:"Wormhole",    osc1Wave:5, osc1Ctrl1:18, osc1Level:108, filterType:3, filterCutoff:65, filterResonance:8,  ampAttack:25, ampDecay:90, ampSustain:75, ampRelease:72, ...ML(25) },
  { name:"Mindwarp",    osc1Wave:0, osc1Level:110, osc2Wave:1, osc2Level:70, osc2Mod:1, filterType:2, filterCutoff:60, filterResonance:11, ampAttack:10, ampDecay:85, ampSustain:70, ampRelease:65, ...ML(32) },

  // ─ C3: Drones & Atmosphere (224-239) ─────────────────────────────────────
  { name:"Low Drone",   osc1Wave:3, osc1Level:120, filterType:0, filterCutoff:35, filterResonance:4,  ampAttack:20, ampDecay:120,ampSustain:100,ampRelease:90, transpose:-12, ...MA(20) },
  { name:"Buzz Drone",  osc1Wave:0, osc1Level:115, filterType:1, filterCutoff:40, filterResonance:6,  ampAttack:5,  ampDecay:115,ampSustain:98, ampRelease:85, ...MC(25) },
  { name:"Pad Drone",   osc1Wave:2, osc1Level:112, filterType:1, filterCutoff:62, filterResonance:6,  ampAttack:25, ampDecay:110,ampSustain:95, ampRelease:88, ...ML(20) },
  { name:"Vox Drone",   osc1Wave:4, osc1Level:112, filterType:2, filterCutoff:65, filterResonance:8,  ampAttack:15, ampDecay:108,ampSustain:95, ampRelease:85, ...MA(22) },
  { name:"D Drone",     osc1Wave:5, osc1Ctrl1:18, osc1Level:112, filterType:1, filterCutoff:58, filterResonance:6,  ampAttack:20, ampDecay:110,ampSustain:95, ampRelease:88, ...ML(18) },
  { name:"Hum",         osc1Wave:3, osc1Level:115, filterType:2, filterCutoff:52, filterResonance:7,  ampAttack:30, ampDecay:120,ampSustain:100,ampRelease:95, ...MA(20) },
  { name:"Shimmer Dr",  osc1Wave:2, osc1Level:110, filterType:3, filterCutoff:55, filterResonance:7,  ampAttack:20, ampDecay:105,ampSustain:90, ampRelease:85, ...ML(20) },
  { name:"String Drone",osc1Wave:0, osc1Level:112, filterType:0, filterCutoff:68, filterResonance:6,  ampAttack:30, ampDecay:110,ampSustain:95, ampRelease:88, ...MA(22) },
  { name:"Space Drone", osc1Wave:3, osc1Level:108, noiseLevel:20, filterType:3, filterCutoff:60, filterResonance:6, ampAttack:35, ampDecay:110,ampSustain:90, ampRelease:90, ...ML(18) },
  { name:"Machine",     osc1Wave:1, osc1Ctrl1:64, osc1Level:115, filterType:1, filterCutoff:45, filterResonance:8,  ampAttack:5, ampDecay:115,ampSustain:95, ampRelease:85, ...ML(25) },
  { name:"Choir Drone", osc1Wave:4, osc1Level:110, filterType:1, filterCutoff:68, filterResonance:6,  ampAttack:30, ampDecay:112,ampSustain:95, ampRelease:90, ...MA(20) },
  { name:"Organ Drone", osc1Wave:2, osc1Level:118, filterType:1, filterCutoff:88, filterResonance:5,  ampAttack:3, ampDecay:127,ampSustain:100,ampRelease:80, ...ML(22) },
  { name:"Metal Drone", osc1Wave:0, osc1Level:110, osc2Wave:1, osc2Level:70, osc2Mod:1, filterType:1, filterCutoff:55, filterResonance:8, ampAttack:10, ampDecay:110,ampSustain:95, ampRelease:88, ...ML(25) },
  { name:"Fog",         osc1Wave:6, osc1Level:105, filterType:0, filterCutoff:35, filterResonance:4,  ampAttack:40, ampDecay:110,ampSustain:85, ampRelease:90, ...MA(18) },
  { name:"Void",        osc1Wave:3, osc1Level:118, filterType:0, filterCutoff:20, filterResonance:3,  ampAttack:15, ampDecay:120,ampSustain:100,ampRelease:95, ...MA(15) },
  { name:"Deep Space",  osc1Wave:5, osc1Ctrl1:22, osc1Level:110, filterType:2, filterCutoff:55, filterResonance:7,  ampAttack:35, ampDecay:110,ampSustain:90, ampRelease:90, ...ML(18) },

  // ─ C4: Sweeps, Risers, Hits (240-255) ────────────────────────────────────
  { name:"Riser",       osc1Wave:6, osc1Level:108, filterType:3, filterCutoff:30, filterResonance:6,  filterEgInt:40,filterAttack:100,filterSustain:127, ampAttack:80, ampDecay:90, ampSustain:80, ampRelease:70, ...MA(35) },
  { name:"Sweep Down",  osc1Wave:0, osc1Level:112, filterType:3, filterCutoff:90, filterResonance:7,  filterEgInt:-35,filterDecay:80, ampAttack:0, ampDecay:90, ampSustain:50, ampRelease:60, ...MP(-50) },
  { name:"Impact",      osc1Wave:6, osc1Level:110, filterType:0, filterCutoff:80, filterResonance:8,  ampAttack:0, ampDecay:55, ampSustain:30, ampRelease:35, ...MA(40) },
  { name:"Hit",         osc1Wave:0, osc1Level:118, filterType:1, filterCutoff:88, filterResonance:9,  ampAttack:0, ampDecay:30, ampSustain:0,  ampRelease:15, ...MC(45) },
  { name:"Zap",         osc1Wave:0, osc1Level:112, filterType:3, filterCutoff:90, filterResonance:10, filterEgInt:-30,filterDecay:25, ampAttack:0, ampDecay:20, ampSustain:0, ampRelease:10, ...MP(-60) },
  { name:"Explosion",   osc1Wave:6, osc1Level:115, filterType:0, filterCutoff:80, filterResonance:5,  ampAttack:0, ampDecay:75, ampSustain:25, ampRelease:45, ...MA(35) },
  { name:"Whoosh",      osc1Wave:6, osc1Level:108, filterType:3, filterCutoff:60, filterResonance:6,  ampAttack:5, ampDecay:70, ampSustain:20, ampRelease:50, ...MA(30) },
  { name:"Reverse",     osc1Wave:3, osc1Level:112, filterType:1, filterCutoff:70, filterResonance:7,  ampAttack:100,ampDecay:85, ampSustain:75, ampRelease:60, ...MA(28) },
  { name:"Gunshot",     osc1Wave:6, osc1Level:115, filterType:0, filterCutoff:75, filterResonance:5,  ampAttack:0, ampDecay:22, ampSustain:0,  ampRelease:12, ...MA(40) },
  { name:"Build",       osc1Wave:6, osc1Level:108, filterType:0, filterCutoff:35, filterResonance:6,  filterEgInt:35,filterAttack:90,filterSustain:127, ampAttack:60, ampDecay:95, ampSustain:78, ampRelease:72, ...MA(30) },
  { name:"Drop",        osc1Wave:0, osc1Level:112, filterType:1, filterCutoff:88, filterResonance:7,  filterEgInt:-25,filterDecay:70, ampAttack:0, ampDecay:85, ampSustain:60, ampRelease:65, ...MP(-45) },
  { name:"Flash",       osc1Wave:5, osc1Ctrl1:10, osc1Level:112, filterType:3, filterCutoff:80, filterResonance:8,  ampAttack:0, ampDecay:18, ampSustain:0, ampRelease:10, ...MC(40) },
  { name:"Thunder",     osc1Wave:6, osc1Level:112, filterType:0, filterCutoff:25, filterResonance:4,  ampAttack:5, ampDecay:100,ampSustain:45, ampRelease:80, ...MA(28) },
  { name:"Pulse Wave",  osc1Wave:1, osc1Ctrl1:64, osc1Level:112, filterType:2, filterCutoff:68, filterResonance:10, ampAttack:0, ampDecay:35, ampSustain:0,  ampRelease:20, lfo1Wave:1, lfo1Rate:35, vp1Src:4, vp1Dst:3, vp1Int:40, ...ML(45) },
  { name:"Crescendo",   osc1Wave:0, osc1Level:112, filterType:1, filterCutoff:50, filterResonance:7,  filterEgInt:30,filterAttack:80,filterSustain:127, ampAttack:70, ampDecay:90, ampSustain:78, ampRelease:72, ...MC(38) },
  { name:"Silence+",    osc1Wave:3, osc1Level:30,  filterType:1, filterCutoff:20, filterResonance:0,  ampAttack:0, ampDecay:40, ampSustain:5,  ampRelease:10, ...MA(10) },
];

module.exports = patches;
