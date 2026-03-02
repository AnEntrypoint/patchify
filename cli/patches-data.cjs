// microKORG S patch library — 256 patches
// Bank A: Basses  Bank B: Keys  Bank C: Pads  Bank D: FX
// VP Src 7=Mod wheel routed on every patch

const MC  = (n) => ({ vp2Src:7, vp2Dst:4, vp2Int:n });  // Mod→Cutoff
const MP  = (n) => ({ vp2Src:7, vp2Dst:0, vp2Int:n });  // Mod→Pitch
const MO2 = (n) => ({ vp2Src:7, vp2Dst:1, vp2Int:n });  // Mod→OSC2Pitch
const MC1 = (n) => ({ vp2Src:7, vp2Dst:2, vp2Int:n });  // Mod→Ctrl1
const ML  = (n) => ({ vp2Src:7, vp2Dst:7, vp2Int:n });  // Mod→LFO2Freq

const patches = [

  // ══════════════════════════════════════════════════════════════════════════
  // BANK A: BASSES (1–64)
  // A1=Sub  A2=Acid  A3=Funk/Groove  A4=Detuned
  // A5=Pluck/Stab  A6=Modulating  A7=Psy  A8=Specialty
  // ══════════════════════════════════════════════════════════════════════════

  // ── A1: Sub Basses (1–8) — sine/tri foundation, warm and round ────────────
  { name:'Deep Sine',    osc1Wave:3, osc1Level:115, filterCutoff:55, filterResonance:8,  ampAttack:3,  ampSustain:100, ampRelease:50, ...MC(35) },
  { name:'Warm Sub',     osc1Wave:0, osc1Level:110, filterCutoff:55, filterResonance:20, ampAttack:3,  ampSustain:100, ampRelease:50, ...MC(35) },
  { name:'Round Sub',    osc1Wave:2, osc1Level:110, filterCutoff:50, filterResonance:12, ampAttack:3,  ampSustain:100, ampRelease:55, ...MC(35) },
  { name:'Fat Sub',      osc1Wave:3, osc2Wave:0, osc2Semi:-12, osc1Level:105, osc2Level:45, filterCutoff:52, filterResonance:15, ampAttack:4, ampSustain:100, ampRelease:55, ...MC(35) },
  { name:'G-Funk Sub',   osc1Wave:3, osc1Level:112, filterCutoff:60, filterResonance:12, portamento:10, ampAttack:5, ampSustain:100, ampRelease:60, delayTime:28, delayDepth:15, ...MC(30) },
  { name:'808 Boom',     osc1Wave:3, osc1Level:115, filterCutoff:52, filterResonance:8,  vp1Src:1, vp1Dst:0, vp1Int:-28, ampAttack:0, ampDecay:90, ampSustain:50, ampRelease:65, ...MC(25) },
  { name:'Cloudy Sub',   osc1Wave:2, osc2Wave:2, osc2Tune:9,  osc1Level:100, osc2Level:80, filterCutoff:58, filterResonance:15, ampAttack:5,  ampSustain:100, ampRelease:60, ...MC(35) },
  { name:'Sub+Air',      osc1Wave:3, osc1Level:108, noiseLevel:18, filterCutoff:55, filterResonance:10, ampAttack:3,  ampSustain:100, ampRelease:55, ...MC(30) },

  // ── A2: Acid Basses (9–16) — clean 303-style, musical not harsh ───────────
  { name:'Clean 303',    osc1Wave:0, osc1Level:110, filterCutoff:48, filterResonance:92,  filterEgInt:52, filterAttack:0, filterDecay:28, filterSustain:0, portamento:18, ampAttack:0, ampSustain:90, ampRelease:22, ...MC(40) },
  { name:'Creamy Acid',  osc1Wave:2, osc1Level:108, filterCutoff:50, filterResonance:95,  filterEgInt:48, filterAttack:0, filterDecay:32, filterSustain:0, portamento:15, ampAttack:0, ampSustain:90, ampRelease:25, ...MC(40) },
  { name:'Morning Acid', osc1Wave:0, osc1Level:108, filterCutoff:52, filterResonance:80,  filterEgInt:45, filterAttack:0, filterDecay:35, filterSustain:10, portamento:20, ampAttack:0, ampSustain:90, ampRelease:25, ...MC(40) },
  { name:'Squelch',      osc1Wave:0, osc1Level:112, filterCutoff:42, filterResonance:112, filterEgInt:58, filterAttack:0, filterDecay:22, filterSustain:0, portamento:12, ampAttack:0, ampSustain:85, ampRelease:20, ...MC(35) },
  { name:'Slow Acid',    osc1Wave:0, osc1Level:108, filterCutoff:45, filterResonance:88,  filterEgInt:50, filterAttack:0, filterDecay:55, filterSustain:0, portamento:22, ampAttack:0, ampSustain:90, ampRelease:30, ...MC(40) },
  { name:'Bubble Acid',  osc1Wave:0, osc1Level:108, filterCutoff:48, filterResonance:95,  vp1Src:2, vp1Dst:4, vp1Int:38, lfo1Wave:2, lfo1Rate:32, portamento:18, ampAttack:0, ampSustain:90, ampRelease:25, ...ML(40) },
  { name:'Sine Acid',    osc1Wave:3, osc1Level:110, filterCutoff:45, filterResonance:100, filterEgInt:50, filterAttack:0, filterDecay:30, filterSustain:0, portamento:20, ampAttack:0, ampSustain:90, ampRelease:22, ...MC(40) },
  { name:'Square Acid',  osc1Wave:1, osc1Level:108, filterCutoff:42, filterResonance:98,  filterEgInt:52, filterAttack:0, filterDecay:28, filterSustain:0, portamento:15, ampAttack:0, ampSustain:88, ampRelease:22, ...MC(40) },

  // ── A3: Funk/Groove Basses (17–24) — envelope filter, wah feel ────────────
  { name:'Funk Wah',     osc1Wave:0, osc1Level:110, filterCutoff:38, filterResonance:82, filterEgInt:58, filterAttack:0, filterDecay:48, filterSustain:0,  ampAttack:2, ampSustain:88, ampRelease:40, ...MC(40) },
  { name:'Parliament',   osc1Wave:0, osc1Level:110, filterCutoff:35, filterResonance:78, filterEgInt:60, filterAttack:0, filterDecay:45, filterSustain:0,  ampAttack:2, ampSustain:88, ampRelease:42, ...MC(40) },
  { name:'Bounce',       osc1Wave:0, osc1Level:110, filterCutoff:42, filterResonance:72, filterEgInt:55, filterAttack:0, filterDecay:35, filterSustain:18, ampAttack:1, ampDecay:40, ampSustain:70, ampRelease:30, ...MC(40) },
  { name:'Clavey',       osc1Wave:1, osc1Level:110, filterCutoff:85, filterResonance:60, filterEgInt:45, filterAttack:0, filterDecay:22, filterSustain:0,  ampAttack:0, ampDecay:35, ampSustain:40, ampRelease:22, ...MC(35) },
  { name:'Sticky',       osc1Wave:0, osc1Level:108, filterCutoff:40, filterResonance:70, filterEgInt:52, filterAttack:2, filterDecay:60, filterSustain:20, ampAttack:3, ampSustain:90, ampRelease:45, ...MC(40) },
  { name:'Moog Wah',     osc1Wave:0, osc1Level:110, filterCutoff:45, filterResonance:65, filterEgInt:55, filterAttack:0, filterDecay:42, filterSustain:10, portamento:10, ampAttack:3, ampSustain:90, ampRelease:45, ...MC(40) },
  { name:'Pluck Funk',   osc1Wave:0, osc1Level:112, filterCutoff:95, filterResonance:55, filterEgInt:42, filterAttack:0, filterDecay:20, filterSustain:0,  ampAttack:0, ampDecay:28, ampSustain:0,  ampRelease:18, ...MC(30) },
  { name:'Snap Bass',    osc1Wave:0, osc1Level:115, filterCutoff:110, filterResonance:42, filterEgInt:35, filterAttack:0, filterDecay:15, filterSustain:0, ampAttack:0, ampDecay:18, ampSustain:0,  ampRelease:12, ...MC(25) },

  // ── A4: Detuned/Layered Basses (25–32) — wide, two-osc character ──────────
  { name:'Reese',        osc1Wave:0, osc2Wave:0, osc2Tune:-7,  osc1Level:95,  osc2Level:95,  filterCutoff:75, filterResonance:50, ampAttack:3,  ampSustain:100, ampRelease:45, ...MO2(20) },
  { name:'Wide Saw',     osc1Wave:0, osc2Wave:0, osc2Tune:7,   osc1Level:100, osc2Level:90,  filterCutoff:80, filterResonance:25, ampAttack:4,  ampSustain:100, ampRelease:50, ...MO2(22) },
  { name:'Cloudy Reese', osc1Wave:2, osc2Wave:0, osc2Tune:-8,  osc1Level:95,  osc2Level:90,  filterCutoff:70, filterResonance:35, ampAttack:5,  ampSustain:100, ampRelease:55, ...MO2(20) },
  { name:'Hoover',       osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:20, osc1Level:100, osc2Level:65, filterCutoff:78, filterResonance:60, portamento:35, ampAttack:2, ampSustain:100, ampRelease:50, ...MC(35) },
  { name:'Twin Sine',    osc1Wave:3, osc2Wave:2, osc2Tune:9,   osc1Level:100, osc2Level:80,  filterCutoff:58, filterResonance:15, ampAttack:4,  ampSustain:100, ampRelease:55, ...MC(30) },
  { name:'Harmonic',     osc1Wave:0, osc2Wave:2, osc2Semi:7,   osc1Level:100, osc2Level:50,  filterCutoff:72, filterResonance:25, ampAttack:4,  ampSustain:100, ampRelease:50, ...MC(30) },
  { name:'Octave Stack', osc1Wave:0, osc2Wave:0, osc2Semi:12,  osc1Level:100, osc2Level:50,  filterCutoff:78, filterResonance:28, ampAttack:3,  ampSustain:100, ampRelease:45, ...MC(30) },
  { name:'Twin Pulse',   osc1Wave:1, osc2Wave:1, osc2Tune:8,   osc1Level:95,  osc2Level:90,  filterCutoff:75, filterResonance:30, ampAttack:4,  ampSustain:100, ampRelease:50, ...MO2(25) },

  // ── A5: Pluck/Stab Basses (33–40) — attack character, rhythmic ────────────
  { name:'Bass Pluck',   osc1Wave:0, osc1Level:112, filterCutoff:95,  filterResonance:55, filterEgInt:45, filterAttack:0, filterDecay:22, filterSustain:0, ampAttack:0, ampDecay:30, ampSustain:0, ampRelease:20, ...MC(30) },
  { name:'Techno Pluck', osc1Wave:0, osc1Level:115, filterCutoff:105, filterResonance:50, filterEgInt:40, filterAttack:0, filterDecay:18, filterSustain:0, ampAttack:0, ampDecay:22, ampSustain:0, ampRelease:15, ...MC(30) },
  { name:'Deep Pluck',   osc1Wave:0, osc1Level:110, filterCutoff:60,  filterResonance:70, filterEgInt:50, filterAttack:0, filterDecay:30, filterSustain:0, ampAttack:0, ampDecay:35, ampSustain:0, ampRelease:22, ...MC(30) },
  { name:'Blip Bass',    osc1Wave:3, osc1Level:112, filterCutoff:80,  filterResonance:40, filterEgInt:38, filterAttack:0, filterDecay:15, filterSustain:0, ampAttack:0, ampDecay:15, ampSustain:0, ampRelease:12, ...MC(25) },
  { name:'Stab Low',     osc1Wave:0, osc2Wave:1, osc2Semi:12, osc1Level:105, osc2Level:50, filterCutoff:90, filterResonance:45, filterEgInt:35, filterDecay:18, ampAttack:0, ampDecay:22, ampSustain:0, ampRelease:15, ...MC(30) },
  { name:'Attack Saw',   osc1Wave:0, osc1Level:112, filterCutoff:85,  filterResonance:50, filterEgInt:42, filterAttack:0, filterDecay:25, filterSustain:20, ampAttack:1, ampDecay:35, ampSustain:60, ampRelease:25, ...MC(30) },
  { name:'Piano Bass',   osc1Wave:5, osc1Level:108, filterCutoff:92,  filterResonance:22, ampAttack:0,  ampDecay:50, ampSustain:30, ampRelease:30, ...MC(25) },
  { name:'Marimba Low',  osc1Wave:2, osc1Level:105, filterCutoff:95,  filterResonance:35, filterEgInt:30, filterDecay:20, ampAttack:0, ampDecay:30, ampSustain:0, ampRelease:25, ...MC(25) },

  // ── A6: Modulating Basses (41–48) — LFO movement, self-animating ──────────
  { name:'Wobble',       osc1Wave:0, osc1Level:110, filterCutoff:62, filterResonance:75, vp1Src:2, vp1Dst:4, vp1Int:40, lfo1Wave:2, lfo1Rate:28, ampAttack:2, ampSustain:100, ampRelease:40, ...ML(40) },
  { name:'Bubble Bass',  osc1Wave:0, osc1Level:110, filterCutoff:55, filterResonance:88, vp1Src:2, vp1Dst:4, vp1Int:45, lfo1Wave:2, lfo1Rate:52, ampAttack:1, ampSustain:100, ampRelease:35, ...ML(42) },
  { name:'Morphing',     osc1Wave:0, osc2Wave:2, osc2Tune:6, osc1Level:100, osc2Level:70, filterCutoff:55, filterResonance:50, vp1Src:2, vp1Dst:4, vp1Int:30, lfo1Wave:2, lfo1Rate:15, ampAttack:3, ampSustain:100, ampRelease:50, ...MC(35) },
  { name:'Tremolo Sub',  osc1Wave:3, osc1Level:112, filterCutoff:58, filterResonance:12, vp1Src:2, vp1Dst:5, vp1Int:40, lfo1Wave:1, lfo1Rate:55, ampAttack:3, ampSustain:100, ampRelease:50, ...ML(38) },
  { name:'Ripple',       osc1Wave:0, osc1Level:108, filterCutoff:65, filterResonance:45, vp1Src:2, vp1Dst:0, vp1Int:10, lfo1Wave:2, lfo1Rate:20, ampAttack:3, ampSustain:100, ampRelease:50, ...MC(35) },
  { name:'Pumping',      osc1Wave:0, osc1Level:112, filterCutoff:70, filterResonance:55, vp1Src:2, vp1Dst:5, vp1Int:50, lfo1Wave:1, lfo1Rate:62, ampAttack:2, ampSustain:100, ampRelease:30, ...ML(40) },
  { name:'Pulsing',      osc1Wave:0, osc1Level:110, filterCutoff:52, filterResonance:80, filterEgInt:45, filterDecay:35, vp1Src:2, vp1Dst:4, vp1Int:35, lfo1Wave:2, lfo1Rate:25, ampAttack:1, ampSustain:100, ampRelease:40, ...MC(40) },
  { name:'Flow',         osc1Wave:2, osc2Wave:0, osc2Tune:-8, osc1Level:95, osc2Level:80, filterCutoff:60, filterResonance:35, vp1Src:2, vp1Dst:4, vp1Int:28, lfo1Wave:2, lfo1Rate:18, ampAttack:4, ampSustain:100, ampRelease:55, ...MC(40) },

  // ── A7: Psy Basses (49–56) — driving, hypnotic, sweet-spot psy ────────────
  { name:'Goa Acid',     osc1Wave:0, osc1Level:112, filterCutoff:50, filterResonance:100, filterEgInt:52, filterAttack:0, filterDecay:25, filterSustain:0, vp1Src:2, vp1Dst:4, vp1Int:42, lfo1Wave:2, lfo1Rate:68, ampAttack:0, ampSustain:100, ampRelease:30, ...ML(42) },
  { name:'Forest Bass',  osc1Wave:0, osc2Wave:0, osc2Tune:-9, osc1Level:105, osc2Level:65, filterCutoff:48, filterResonance:82, filterEgInt:48, filterDecay:30, vp1Src:2, vp1Dst:4, vp1Int:38, lfo1Wave:2, lfo1Rate:55, ampAttack:0, ampSustain:100, ampRelease:32, ...ML(40) },
  { name:'Full On',      osc1Wave:0, osc1Level:112, filterCutoff:52, filterResonance:92,  filterEgInt:55, filterAttack:0, filterDecay:26, filterSustain:0, ampAttack:0, ampSustain:100, ampRelease:28, ...MC(45) },
  { name:'Morning Psy',  osc1Wave:0, osc1Level:108, filterCutoff:62, filterResonance:85,  filterEgInt:48, filterDecay:28, vp1Src:2, vp1Dst:4, vp1Int:35, lfo1Wave:2, lfo1Rate:45, portamento:10, ampAttack:0, ampSustain:100, ampRelease:30, ...ML(40) },
  { name:'Alien Groove', osc1Wave:0, osc2Wave:0, osc2Mod:1, osc2Semi:4, osc1Level:100, osc2Level:72, filterCutoff:52, filterResonance:85, filterEgInt:48, filterDecay:30, vp1Src:2, vp1Dst:4, vp1Int:40, lfo1Wave:2, lfo1Rate:60, ampAttack:0, ampSustain:100, ampRelease:32, ...ML(40) },
  { name:'Spiral Bass',  osc1Wave:0, osc2Wave:0, osc2Tune:-6, osc1Level:105, osc2Level:80, filterCutoff:50, filterResonance:95, vp1Src:2, vp1Dst:4, vp1Int:48, lfo1Wave:2, lfo1Rate:65, ampAttack:0, ampSustain:100, ampRelease:35, ...ML(45) },
  { name:'Psyche Sub',   osc1Wave:3, osc2Wave:0, osc2Tune:-10, osc1Level:112, osc2Level:45, filterCutoff:50, filterResonance:18, ampAttack:2, ampSustain:100, ampRelease:55, ...MC(40) },
  { name:'Twisting',     osc1Wave:1, osc2Wave:2, osc2Tune:14, osc1Level:100, osc2Level:78, filterCutoff:50, filterResonance:92, vp1Src:2, vp1Dst:4, vp1Int:45, lfo1Wave:2, lfo1Rate:60, ampAttack:0, ampSustain:100, ampRelease:35, ...ML(45) },

  // ── A8: Specialty Basses (57–64) — character-specific ────────────────────
  { name:'Compton',      osc1Wave:3, osc2Wave:0, osc2Tune:-10, osc1Level:112, osc2Level:35, filterCutoff:52, filterResonance:15, vp1Src:1, vp1Dst:0, vp1Int:-22, ampAttack:0, ampDecay:85, ampSustain:50, ampRelease:65, ...MC(30) },
  { name:'Slap Synth',   osc1Wave:0, osc1Level:115, filterCutoff:108, filterResonance:42, filterEgInt:38, filterDecay:18, ampAttack:0, ampDecay:22, ampSustain:40, ampRelease:18, ...MC(30) },
  { name:'Rubber Band',  osc1Wave:0, osc1Level:108, filterCutoff:78, filterResonance:52, filterEgInt:45, filterDecay:40, portamento:42, ampAttack:2, ampSustain:100, ampRelease:50, ...MC(35) },
  { name:'Detroit Deep', osc1Wave:0, osc2Wave:2, osc2Tune:-5, osc1Level:100, osc2Level:50, filterCutoff:55, filterResonance:42, vp1Src:2, vp1Dst:4, vp1Int:28, lfo1Wave:2, lfo1Rate:12, ampAttack:3, ampSustain:100, ampRelease:60, ...MC(30) },
  { name:'Dub Bass',     osc1Wave:0, osc1Level:105, filterCutoff:65, filterResonance:28, ampAttack:5, ampDecay:80, ampSustain:60, ampRelease:60, delayTime:52, delayDepth:40, ...MC(30) },
  { name:'UK Garage',    osc1Wave:0, osc1Level:112, filterCutoff:78, filterResonance:58, filterEgInt:44, filterDecay:26, ampAttack:0, ampDecay:30, ampSustain:60, ampRelease:22, ...MC(35) },
  { name:'Deep House',   osc1Wave:0, osc2Wave:2, osc2Tune:6, osc1Level:105, osc2Level:48, filterCutoff:65, filterResonance:32, filterEgInt:38, filterDecay:42, portamento:14, ampAttack:3, ampSustain:100, ampRelease:55, delayTime:30, delayDepth:18, ...MC(30) },
  { name:'House Sub',    osc1Wave:3, osc2Wave:0, osc2Tune:8, osc1Level:110, osc2Level:35, filterCutoff:60, filterResonance:18, ampAttack:4, ampSustain:100, ampRelease:58, ...MC(30) },

  // ══════════════════════════════════════════════════════════════════════════
  // BANK B: KEYS (65–128)
  // B1=Bright/Pluck  B2=Warm/Vintage  B3=Bell/Mallet  B4=Mono Leads
  // B5=Whistle/Sine  B6=Sync/Hard     B7=Wah/Funky    B8=Wide/Detuned
  // ══════════════════════════════════════════════════════════════════════════

  // ── B1: Bright Keys / Plucks (65–72) ──────────────────────────────────────
  { name:'Crystal Plk',osc1Wave:3, osc1Level:108, filterCutoff:95,  filterResonance:35, filterEgInt:40, filterDecay:25, ampAttack:0, ampDecay:40, ampSustain:0, ampRelease:28, delayTime:38, delayDepth:22, ...MC(25) },
  { name:'Bright Pluck', osc1Wave:0, osc1Level:110, filterCutoff:100, filterResonance:45, filterEgInt:42, filterDecay:22, ampAttack:0, ampDecay:32, ampSustain:0, ampRelease:22, ...MC(25) },
  { name:'Synth Pluck',  osc1Wave:0, osc2Wave:2, osc2Tune:6, osc1Level:100, osc2Level:50, filterCutoff:95, filterResonance:40, filterEgInt:38, filterDecay:24, ampAttack:0, ampDecay:35, ampSustain:0, ampRelease:25, delayTime:35, delayDepth:20, ...MC(25) },
  { name:'Bell Key',     osc1Wave:3, osc2Wave:0, osc2Mod:1, osc2Semi:7, osc1Level:100, osc2Level:58, filterCutoff:98, filterResonance:28, ampAttack:0, ampDecay:55, ampSustain:0, ampRelease:40, delayTime:42, delayDepth:28, ...MC(20) },
  { name:'Funky Clav',   osc1Wave:1, osc1Level:110, filterCutoff:105, filterResonance:52, filterEgInt:42, filterDecay:18, ampAttack:0, ampDecay:28, ampSustain:40, ampRelease:20, ...MC(30) },
  { name:'Harpsichord',  osc1Wave:1, osc1Level:110, filterCutoff:110, filterResonance:22, filterEgInt:32, filterDecay:15, ampAttack:0, ampDecay:28, ampSustain:0, ampRelease:18, ...MC(20) },
  { name:'Metal Pluck',  osc1Wave:0, osc2Wave:0, osc2Mod:1, osc2Semi:5, osc1Level:100, osc2Level:80, filterCutoff:92, filterResonance:42, filterEgInt:35, filterDecay:22, ampAttack:0, ampDecay:35, ampSustain:0, ampRelease:25, ...MC(25) },
  { name:'Glass Key',    osc1Wave:2, osc1Level:105, filterCutoff:108, filterResonance:48, filterEgInt:35, filterDecay:28, ampAttack:0, ampDecay:45, ampSustain:0, ampRelease:30, delayTime:35, delayDepth:20, ...MC(20) },

  // ── B2: Warm Keys / Vintage (73–80) ───────────────────────────────────────
  { name:'Rhodes Warm',  osc1Wave:5, osc1Level:105, filterCutoff:88,  filterResonance:18, ampAttack:4, ampDecay:50, ampSustain:70, ampRelease:48, delayTime:40, delayDepth:22, ...MC(25) },
  { name:'E.Piano',      osc1Wave:5, osc1Level:105, filterCutoff:92,  filterResonance:20, ampAttack:3, ampDecay:48, ampSustain:72, ampRelease:45, delayTime:38, delayDepth:20, ...MC(25) },
  { name:'Vintage Keys', osc1Wave:0, osc2Wave:0, osc2Tune:7, osc1Level:95, osc2Level:82, filterCutoff:85, filterResonance:25, vp1Src:2, vp1Dst:4, vp1Int:15, lfo1Wave:2, lfo1Rate:28, ampAttack:6, ampDecay:45, ampSustain:78, ampRelease:52, delayTime:38, delayDepth:22, ...MC(25) },
  { name:'Mellow Keys',  osc1Wave:2, osc1Level:105, filterCutoff:80,  filterResonance:18, ampAttack:8,  ampDecay:48, ampSustain:80, ampRelease:58, delayTime:40, delayDepth:25, ...MC(22) },
  { name:'Jazzy Keys',   osc1Wave:5, osc1Level:102, filterCutoff:85,  filterResonance:22, filterEgInt:20, filterDecay:35, ampAttack:5, ampDecay:45, ampSustain:75, ampRelease:50, ...MC(30) },
  { name:'Rhodes Dark',  osc1Wave:5, osc1Level:100, filterCutoff:78,  filterResonance:20, ampAttack:5,  ampDecay:55, ampSustain:68, ampRelease:52, delayTime:42, delayDepth:28, ...MC(25) },
  { name:'Warm Bell',    osc1Wave:3, osc1Level:105, filterCutoff:92,  filterResonance:22, ampAttack:2,  ampDecay:60, ampSustain:0,  ampRelease:55, delayTime:42, delayDepth:28, ...MC(20) },
  { name:'Soft Keys',    osc1Wave:2, osc2Wave:2, osc2Tune:8, osc1Level:95, osc2Level:75, filterCutoff:78, filterResonance:18, ampAttack:12, ampDecay:48, ampSustain:80, ampRelease:58, ...MC(25) },

  // ── B3: Bell / Mallet (81–88) ──────────────────────────────────────────────
  { name:'Bell Pure',    osc1Wave:3, osc2Wave:0, osc2Mod:1, osc2Semi:10, osc1Level:100, osc2Level:55, filterCutoff:100, filterResonance:25, ampAttack:0, ampDecay:65, ampSustain:0, ampRelease:55, delayTime:45, delayDepth:30, ...MC(20) },
  { name:'Marimba',      osc1Wave:2, osc1Level:108, filterCutoff:98,  filterResonance:28, ampAttack:0, ampDecay:28, ampSustain:0, ampRelease:22, ...MC(15) },
  { name:'Vibraphone',   osc1Wave:3, osc1Level:108, filterCutoff:100, filterResonance:18, vp1Src:2, vp1Dst:0, vp1Int:12, lfo1Wave:2, lfo1Rate:48, ampAttack:2, ampDecay:42, ampSustain:0, ampRelease:38, delayTime:38, delayDepth:22, ...MP(18) },
  { name:'Xylophone',    osc1Wave:0, osc1Level:110, filterCutoff:105, filterResonance:32, filterEgInt:30, filterDecay:18, ampAttack:0, ampDecay:22, ampSustain:0, ampRelease:18, ...MC(20) },
  { name:'Soft Bell',    osc1Wave:3, osc1Level:100, filterCutoff:95,  filterResonance:18, ampAttack:2, ampDecay:70, ampSustain:0, ampRelease:65, delayTime:48, delayDepth:32, ...MC(20) },
  { name:'Steel Pan',    osc1Wave:3, osc2Wave:0, osc2Mod:1, osc2Semi:7, osc1Level:100, osc2Level:65, filterCutoff:98, filterResonance:32, ampAttack:0, ampDecay:38, ampSustain:0, ampRelease:30, ...MC(20) },
  { name:'Ting',         osc1Wave:3, osc1Level:108, filterCutoff:110, filterResonance:30, filterEgInt:25, filterDecay:15, ampAttack:0, ampDecay:18, ampSustain:0, ampRelease:18, ...MC(15) },
  { name:'Chime',        osc1Wave:3, osc2Wave:2, osc2Semi:12, osc1Level:100, osc2Level:45, filterCutoff:100, filterResonance:22, ampAttack:0, ampDecay:80, ampSustain:0, ampRelease:70, delayTime:50, delayDepth:35, ...MC(15) },

  // ── B4: Mono Leads (89–96) — expressive, pitch-wheel responsive ────────────
  { name:'Mono Saw',     osc1Wave:0, osc1Level:110, filterCutoff:92, filterResonance:38, filterEgInt:28, filterDecay:35, portamento:10, ampAttack:3, ampSustain:100, ampRelease:35, ...MP(20) },
  { name:'Mono Pulse',   osc1Wave:1, osc1Level:108, filterCutoff:88, filterResonance:42, filterEgInt:30, filterDecay:35, portamento:12, ampAttack:3, ampSustain:100, ampRelease:35, ...MP(20) },
  { name:'Soft Lead',    osc1Wave:2, osc1Level:108, filterCutoff:85, filterResonance:28, portamento:15, ampAttack:5, ampSustain:100, ampRelease:40, delayTime:35, delayDepth:22, ...MP(18) },
  { name:'Bite Lead',    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:15, osc1Level:102, osc2Level:50, filterCutoff:88, filterResonance:52, filterEgInt:35, filterDecay:30, portamento:10, ampAttack:2, ampSustain:100, ampRelease:35, ...MC(30) },
  { name:'Acid Lead',    osc1Wave:0, osc1Level:110, filterCutoff:55, filterResonance:92, filterEgInt:48, filterDecay:30, portamento:18, ampAttack:1, ampSustain:100, ampRelease:30, ...MC(35) },
  { name:'Moog Lead',    osc1Wave:0, osc2Wave:0, osc2Semi:12, osc1Level:100, osc2Level:38, filterCutoff:85, filterResonance:58, filterEgInt:32, filterDecay:40, portamento:18, ampAttack:5, ampSustain:100, ampRelease:45, ...MP(20) },
  { name:'Bright Lead',  osc1Wave:0, osc1Level:110, filterCutoff:95, filterResonance:32, portamento:8, ampAttack:2, ampSustain:100, ampRelease:35, ...MP(20) },
  { name:'Classic Lead', osc1Wave:0, osc2Wave:2, osc2Tune:6, osc1Level:100, osc2Level:60, filterCutoff:90, filterResonance:35, filterEgInt:25, filterDecay:38, portamento:12, ampAttack:3, ampSustain:100, ampRelease:40, delayTime:35, delayDepth:20, ...MP(18) },

  // ── B5: Whistle / Sine Leads (97–104) — G-funk signature ──────────────────
  { name:'Whistle',      osc1Wave:3, osc1Level:110, filterCutoff:100, filterResonance:10, vp1Src:3, vp1Dst:0, vp1Int:22, lfo2Wave:2, lfo2Rate:45, portamento:12, ampAttack:8, ampSustain:100, ampRelease:45, delayTime:40, delayDepth:25, ...MP(28) },
  { name:'Dog Whistle',  osc1Wave:3, osc1Level:108, filterCutoff:110, filterResonance:8,  vp1Src:3, vp1Dst:0, vp1Int:28, lfo2Wave:2, lfo2Rate:62, portamento:8,  ampAttack:4, ampSustain:100, ampRelease:35, ...MP(30) },
  { name:'Slow Whistle', osc1Wave:3, osc1Level:108, filterCutoff:100, filterResonance:10, vp1Src:3, vp1Dst:0, vp1Int:18, lfo2Wave:2, lfo2Rate:30, portamento:15, ampAttack:10, ampSustain:100, ampRelease:50, delayTime:42, delayDepth:28, ...MP(22) },
  { name:'Wide Whistle', osc1Wave:3, osc2Wave:2, osc2Tune:8, osc1Level:100, osc2Level:55, filterCutoff:98, filterResonance:12, vp1Src:3, vp1Dst:0, vp1Int:20, lfo2Wave:2, lfo2Rate:40, portamento:12, ampAttack:8, ampSustain:100, ampRelease:45, delayTime:40, delayDepth:30, ...MP(22) },
  { name:'Velvet Lead',  osc1Wave:3, osc2Wave:0, osc2Semi:12, osc1Level:100, osc2Level:28, filterCutoff:92, filterResonance:20, filterEgInt:18, filterDecay:40, vp1Src:3, vp1Dst:0, vp1Int:15, lfo2Wave:2, lfo2Rate:38, portamento:14, ampAttack:6, ampSustain:100, ampRelease:48, ...MP(20) },
  { name:'Smooth Lead',  osc1Wave:2, osc2Wave:2, osc2Tune:7, osc1Level:100, osc2Level:65, filterCutoff:88, filterResonance:18, vp1Src:3, vp1Dst:0, vp1Int:18, lfo2Wave:2, lfo2Rate:42, portamento:15, ampAttack:6, ampSustain:100, ampRelease:45, delayTime:38, delayDepth:22, ...MP(20) },
  { name:'Warm Sine',    osc1Wave:3, osc1Level:108, filterCutoff:88, filterResonance:14, portamento:10, ampAttack:5, ampSustain:100, ampRelease:45, ...MP(18) },
  { name:'Sweet Sine',   osc1Wave:3, osc2Wave:2, osc2Tune:10, osc1Level:100, osc2Level:50, filterCutoff:90, filterResonance:12, portamento:12, ampAttack:6, ampSustain:100, ampRelease:48, delayTime:45, delayDepth:32, ...MP(20) },

  // ── B6: Sync / Hard Leads (105–112) — psy/techno, in the sweet spot ────────
  { name:'Sync Lead',    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:25, osc1Level:102, osc2Level:52, filterCutoff:88, filterResonance:65, filterEgInt:40, filterDecay:30, ampAttack:2, ampDecay:50, ampSustain:82, ampRelease:32, delayTime:42, delayDepth:32, ...MC(35) },
  { name:'Warm Sync',    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:18, osc1Level:100, osc2Level:48, filterCutoff:82, filterResonance:58, filterEgInt:35, filterDecay:32, portamento:8, ampAttack:3, ampSustain:90, ampRelease:35, delayTime:40, delayDepth:28, ...MC(32) },
  { name:'PWM Lead',     osc1Wave:1, osc1Level:105, filterCutoff:88, filterResonance:32, vp1Src:2, vp1Dst:2, vp1Int:38, lfo1Wave:2, lfo1Rate:30, ampAttack:5, ampSustain:100, ampRelease:38, delayTime:38, delayDepth:28, ...MC1(35) },
  { name:'Saw Stack',    osc1Wave:0, osc2Wave:0, osc2Tune:10, osc1Level:98, osc2Level:92, filterCutoff:88, filterResonance:28, ampAttack:4, ampSustain:100, ampRelease:40, delayTime:40, delayDepth:30, ...MC(30) },
  { name:'Buzz Lead',    osc1Wave:0, osc1Level:105, filterCutoff:72, filterResonance:108, filterEgInt:42, filterDecay:35, portamento:10, ampAttack:2, ampDecay:50, ampSustain:80, ampRelease:32, ...MC(35) },
  { name:'Laser',        osc1Wave:0, osc1Level:108, filterCutoff:98, filterResonance:52, vp1Src:1, vp1Dst:0, vp1Int:-45, ampAttack:0, ampDecay:30, ampSustain:0,  ampRelease:22, ...MC(30) },
  { name:'Screamer',     osc1Wave:0, osc1Level:100, filterCutoff:70, filterResonance:115, filterEgInt:38, filterDecay:35, portamento:12, ampAttack:2, ampDecay:45, ampSustain:75, ampRelease:30, ...MC(30) },
  { name:'Warp Lead',    osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:18, osc1Level:105, osc2Level:62, filterCutoff:88, filterResonance:60, vp1Src:0, vp1Dst:0, vp1Int:38, ampAttack:1, ampDecay:40, ampSustain:82, ampRelease:32, ...MC(30) },

  // ── B7: Wah / Funky Leads (113–120) — movement, talk box, filter char ──────
  { name:'Talk Box',     osc1Wave:0, osc2Wave:1, osc2Semi:12, osc1Level:100, osc2Level:52, filterType:2, filterCutoff:65, filterResonance:88, filterEgInt:52, filterDecay:42, vp1Src:2, vp1Dst:4, vp1Int:35, lfo1Wave:2, lfo1Rate:20, portamento:14, ampAttack:5, ampSustain:95, ampRelease:42, ...MC(42) },
  { name:'Wah Lead',     osc1Wave:0, osc1Level:108, filterCutoff:55, filterResonance:78, vp1Src:2, vp1Dst:4, vp1Int:40, lfo1Wave:2, lfo1Rate:22, ampAttack:3, ampSustain:100, ampRelease:38, ...MC(40) },
  { name:'Funky Lead',   osc1Wave:0, osc1Level:108, filterCutoff:42, filterResonance:72, filterEgInt:52, filterAttack:0, filterDecay:38, filterSustain:10, ampAttack:2, ampSustain:90, ampRelease:38, ...MC(40) },
  { name:'Talk Wah',     osc1Wave:0, osc1Level:105, filterType:2, filterCutoff:68, filterResonance:82, vp1Src:2, vp1Dst:4, vp1Int:38, lfo1Wave:2, lfo1Rate:18, portamento:12, ampAttack:4, ampSustain:95, ampRelease:42, ...MC(42) },
  { name:'Phaser Lead',  osc1Wave:0, osc2Wave:0, osc2Tune:-5, osc1Level:95, osc2Level:88, filterCutoff:80, filterResonance:40, vp1Src:2, vp1Dst:6, vp1Int:38, lfo1Wave:2, lfo1Rate:18, ampAttack:4, ampSustain:100, ampRelease:42, ...MC(35) },
  { name:'Groove Lead',  osc1Wave:0, osc1Level:108, filterCutoff:68, filterResonance:52, filterEgInt:40, filterDecay:35, portamento:12, ampAttack:3, ampSustain:100, ampRelease:40, ...MC(35) },
  { name:'Squeal',       osc1Wave:0, osc1Level:100, filterCutoff:68, filterResonance:112, filterEgInt:35, filterDecay:35, portamento:18, ampAttack:3, ampDecay:50, ampSustain:80, ampRelease:38, ...MC(30) },
  { name:'Vowel Lead',   osc1Wave:0, osc1Level:105, filterType:2, filterCutoff:70, filterResonance:88, filterEgInt:48, filterDecay:45, portamento:18, lfo1Wave:2, lfo1Rate:20, vp1Src:2, vp1Dst:4, vp1Int:32, ampAttack:4, ampSustain:95, ampRelease:42, ...MC(42) },

  // ── B8: Wide / Detuned Leads (121–128) — chorus-width, modern ─────────────
  { name:'Wide Saw',     osc1Wave:0, osc2Wave:0, osc2Tune:12, osc1Level:98, osc2Level:90, filterCutoff:88, filterResonance:28, ampAttack:4, ampSustain:100, ampRelease:42, delayTime:40, delayDepth:32, ...MC(30) },
  { name:'Supersaw',     osc1Wave:0, osc2Wave:0, osc2Tune:14, osc1Level:95, osc2Level:95, filterCutoff:90, filterResonance:22, ampAttack:5, ampSustain:100, ampRelease:45, delayTime:45, delayDepth:38, ...MC(28) },
  { name:'Rave Lead',    osc1Wave:0, osc2Wave:0, osc2Tune:10, osc1Level:98, osc2Level:92, filterCutoff:92, filterResonance:48, filterEgInt:32, filterDecay:28, ampAttack:2, ampSustain:100, ampRelease:38, delayTime:40, delayDepth:35, ...MC(30) },
  { name:'Trance Chord', osc1Wave:0, osc2Wave:1, osc2Semi:7, osc2Tune:5, osc1Level:95, osc2Level:80, filterCutoff:86, filterResonance:25, ampAttack:5, ampDecay:48, ampSustain:72, ampRelease:48, delayTime:42, delayDepth:32, ...MC(25) },
  { name:'Vaporwave',    osc1Wave:5, osc2Wave:0, osc2Tune:9, osc1Level:90, osc2Level:68, filterCutoff:78, filterResonance:20, vp1Src:2, vp1Dst:0, vp1Int:10, lfo1Wave:2, lfo1Rate:10, ampAttack:18, ampSustain:100, ampRelease:75, delayTime:55, delayDepth:45, ...MP(15) },
  { name:'Morning Lead', osc1Wave:0, osc2Wave:2, osc2Tune:8, osc1Level:95, osc2Level:72, filterCutoff:88, filterResonance:25, portamento:10, ampAttack:5, ampSustain:100, ampRelease:42, delayTime:38, delayDepth:25, ...MC(25) },
  { name:'Euphoric',     osc1Wave:0, osc2Wave:0, osc2Tune:11, osc1Level:98, osc2Level:88, filterCutoff:94, filterResonance:42, filterEgInt:30, filterDecay:28, vp1Src:3, vp1Dst:0, vp1Int:14, lfo2Wave:2, lfo2Rate:40, ampAttack:3, ampSustain:100, ampRelease:42, delayTime:42, delayDepth:35, ...MC(30) },
  { name:'Chorus Lead',  osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:95, osc2Level:80, filterCutoff:88, filterResonance:28, modRate:45, modDepth:48, modType:0, ampAttack:5, ampSustain:100, ampRelease:45, ...MC(25) },

  // ══════════════════════════════════════════════════════════════════════════
  // BANK C: PADS (129–192)
  // C1=Warm/Lush  C2=Evolving  C3=Strings  C4=Ambient/Space
  // C5=Twilight   C6=Resonant  C7=Wide/Chorus  C8=Dub
  // ══════════════════════════════════════════════════════════════════════════

  // ── C1: Warm / Lush Pads (129–136) ───────────────────────────────────────
  { name:'Warm Pad',     osc1Wave:2, osc2Wave:2, osc2Tune:9,  osc1Level:92, osc2Level:85, filterCutoff:72, filterResonance:15, ampAttack:22, ampSustain:100, ampRelease:80, delayTime:50, delayDepth:38, ...MC(35) },
  { name:'Lush',         osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:90, osc2Level:88, filterCutoff:75, filterResonance:18, ampAttack:20, ampSustain:100, ampRelease:82, delayTime:55, delayDepth:42, ...MC(35) },
  { name:'Velvet Pad',   osc1Wave:2, osc1Level:90, filterCutoff:70, filterResonance:12, ampAttack:25, ampSustain:100, ampRelease:85, delayTime:55, delayDepth:45, ...MC(35) },
  { name:'Butter',       osc1Wave:5, osc2Wave:2, osc2Tune:8, osc1Level:88, osc2Level:80, filterCutoff:76, filterResonance:14, ampAttack:20, ampSustain:100, ampRelease:82, delayTime:52, delayDepth:40, ...MC(35) },
  { name:'Cloud',        osc1Wave:2, osc2Wave:0, osc2Tune:11, osc1Level:88, osc2Level:80, filterCutoff:68, filterResonance:12, ampAttack:30, ampSustain:100, ampRelease:90, delayTime:60, delayDepth:48, ...MC(35) },
  { name:'Silk',         osc1Wave:3, osc2Wave:2, osc2Tune:8,  osc1Level:90, osc2Level:75, filterCutoff:72, filterResonance:14, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:52, delayDepth:40, ...MC(35) },
  { name:'Juno Pad',     osc1Wave:0, osc2Wave:0, osc2Tune:7,  osc1Level:90, osc2Level:82, filterCutoff:78, filterResonance:22, vp1Src:2, vp1Dst:4, vp1Int:14, lfo1Wave:2, lfo1Rate:22, ampAttack:20, ampSustain:100, ampRelease:80, delayTime:48, delayDepth:38, ...MC(35) },
  { name:'Comfort',      osc1Wave:2, osc2Wave:2, osc2Tune:11, osc1Level:88, osc2Level:85, filterCutoff:70, filterResonance:12, ampAttack:28, ampSustain:100, ampRelease:88, delayTime:58, delayDepth:45, ...MC(35) },

  // ── C2: Evolving Pads (137–144) ─────────────────────────────────────────
  { name:'Breathing',    osc1Wave:0, osc2Wave:2, osc2Tune:8, osc1Level:90, osc2Level:80, filterCutoff:72, filterResonance:18, vp1Src:2, vp1Dst:5, vp1Int:32, lfo1Wave:2, lfo1Rate:14, ampAttack:20, ampSustain:100, ampRelease:78, delayTime:52, delayDepth:40, ...MC(35) },
  { name:'Swell',        osc1Wave:2, osc2Wave:2, osc2Tune:9, osc1Level:88, osc2Level:82, filterCutoff:55, filterResonance:20, filterEgInt:45, filterAttack:20, filterDecay:70, ampAttack:18, ampSustain:100, ampRelease:80, delayTime:55, delayDepth:42, ...MC(40) },
  { name:'Morphing Pad', osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:88, osc2Level:80, filterCutoff:58, filterResonance:25, vp1Src:2, vp1Dst:4, vp1Int:28, lfo1Wave:2, lfo1Rate:12, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:58, delayDepth:45, ...MC(38) },
  { name:'Rolling',      osc1Wave:0, osc2Wave:0, osc2Tune:9, osc1Level:90, osc2Level:78, filterCutoff:65, filterResonance:30, vp1Src:2, vp1Dst:4, vp1Int:30, lfo1Wave:2, lfo1Rate:18, ampAttack:18, ampSustain:100, ampRelease:75, delayTime:50, delayDepth:40, ...MC(35) },
  { name:'Tidal',        osc1Wave:2, osc2Wave:2, osc2Tune:12, osc1Level:88, osc2Level:82, filterCutoff:62, filterResonance:20, vp1Src:2, vp1Dst:4, vp1Int:25, lfo1Wave:2, lfo1Rate:9, ampAttack:28, ampSustain:100, ampRelease:90, delayTime:65, delayDepth:52, ...MC(35) },
  { name:'Living Pad',   osc1Wave:0, osc2Wave:2, osc2Tune:8, osc1Level:88, osc2Level:78, filterCutoff:65, filterResonance:28, vp1Src:2, vp1Dst:4, vp1Int:25, lfo1Wave:2, lfo1Rate:10, ampAttack:22, ampSustain:100, ampRelease:80, delayTime:55, delayDepth:42, ...ML(35) },
  { name:'Waves',        osc1Wave:2, osc1Level:90, filterCutoff:68, filterResonance:22, vp1Src:2, vp1Dst:4, vp1Int:28, lfo1Wave:2, lfo1Rate:16, ampAttack:25, ampSustain:100, ampRelease:85, delayTime:58, delayDepth:45, ...MC(35) },
  { name:'Current',      osc1Wave:0, osc2Wave:0, osc2Tune:9, osc1Level:88, osc2Level:80, filterCutoff:62, filterResonance:25, vp1Src:2, vp1Dst:4, vp1Int:28, lfo1Wave:2, lfo1Rate:14, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:60, delayDepth:48, ...MC(35) },

  // ── C3: String Pads (145–152) ────────────────────────────────────────────
  { name:'Strings',      osc1Wave:0, osc2Wave:0, osc2Tune:7, osc1Level:90, osc2Level:85, filterCutoff:80, filterResonance:18, ampAttack:18, ampSustain:100, ampRelease:75, delayTime:45, delayDepth:35, ...MC(30) },
  { name:'Ensemble',     osc1Wave:0, osc2Wave:0, osc2Tune:10, osc1Level:88, osc2Level:88, filterCutoff:78, filterResonance:18, ampAttack:20, ampSustain:100, ampRelease:78, delayTime:48, delayDepth:38, ...MC(30) },
  { name:'Cello',        osc1Wave:0, osc2Wave:2, osc2Tune:7, osc1Level:90, osc2Level:70, filterCutoff:70, filterResonance:20, ampAttack:22, ampSustain:100, ampRelease:78, delayTime:42, delayDepth:32, ...MC(30) },
  { name:'Viola',        osc1Wave:0, osc2Wave:0, osc2Tune:8, osc1Level:88, osc2Level:82, filterCutoff:78, filterResonance:18, ampAttack:18, ampSustain:100, ampRelease:75, delayTime:44, delayDepth:34, ...MC(30) },
  { name:'Violin Hi',    osc1Wave:0, osc2Wave:0, osc2Tune:9, osc1Level:88, osc2Level:85, filterCutoff:85, filterResonance:18, ampAttack:15, ampSustain:100, ampRelease:70, delayTime:42, delayDepth:32, ...MC(30) },
  { name:'Pizzicato',    osc1Wave:0, osc1Level:108, filterCutoff:90, filterResonance:28, filterEgInt:32, filterDecay:20, ampAttack:0, ampDecay:38, ampSustain:0, ampRelease:28, ...MC(25) },
  { name:'Slow Bow',     osc1Wave:0, osc2Wave:0, osc2Tune:8, osc1Level:88, osc2Level:82, filterCutoff:72, filterResonance:18, ampAttack:35, ampSustain:100, ampRelease:88, delayTime:50, delayDepth:38, ...MC(30) },
  { name:'Full Bow',     osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:88, osc2Level:85, filterCutoff:76, filterResonance:18, ampAttack:22, ampSustain:100, ampRelease:80, delayTime:50, delayDepth:40, ...MC(30) },

  // ── C4: Ambient / Space Pads (153–160) ───────────────────────────────────
  { name:'Deep Space',   osc1Wave:2, osc2Wave:2, osc2Tune:11, osc1Level:85, osc2Level:82, filterCutoff:60, filterResonance:18, ampAttack:35, ampSustain:100, ampRelease:100, delayTime:72, delayDepth:62, ...MC(35) },
  { name:'Cosmos',       osc1Wave:3, osc2Wave:2, osc2Tune:9,  osc1Level:85, osc2Level:75, filterCutoff:62, filterResonance:15, ampAttack:32, ampSustain:100, ampRelease:100, delayTime:70, delayDepth:60, ...MC(35) },
  { name:'Nebula',       osc1Wave:2, osc1Level:82, noiseLevel:25, filterCutoff:58, filterResonance:20, ampAttack:38, ampSustain:100, ampRelease:100, delayTime:72, delayDepth:62, ...MC(35) },
  { name:'Star Field',   osc1Wave:3, osc2Wave:0, osc2Tune:12, osc1Level:85, osc2Level:70, filterCutoff:68, filterResonance:18, ampAttack:28, ampSustain:100, ampRelease:95, delayTime:68, delayDepth:58, ...MC(35) },
  { name:'Void',         osc1Wave:2, osc2Wave:2, osc2Tune:9,  osc1Level:80, osc2Level:80, filterCutoff:52, filterResonance:15, ampAttack:42, ampSustain:100, ampRelease:100, delayTime:75, delayDepth:65, ...MC(35) },
  { name:'Aurora',       osc1Wave:2, osc1Level:85, filterCutoff:55, filterResonance:22, filterEgInt:40, filterAttack:25, filterDecay:80, vp1Src:2, vp1Dst:4, vp1Int:22, lfo1Wave:2, lfo1Rate:8, ampAttack:30, ampSustain:100, ampRelease:100, delayTime:70, delayDepth:60, ...MC(38) },
  { name:'Horizon',      osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:85, osc2Level:80, filterCutoff:65, filterResonance:15, ampAttack:25, ampSustain:100, ampRelease:92, delayTime:65, delayDepth:55, ...MC(35) },
  { name:'Dusk',         osc1Wave:2, osc2Wave:0, osc2Tune:9,  osc1Level:85, osc2Level:75, filterCutoff:60, filterResonance:18, ampAttack:28, ampSustain:100, ampRelease:95, delayTime:68, delayDepth:58, ...MC(35) },

  // ── C5: Twilight Pads (161–168) — clean, golden, not harsh ───────────────
  { name:'Twilight',     osc1Wave:2, osc2Wave:2, osc2Tune:10, osc1Level:88, osc2Level:85, filterCutoff:68, filterResonance:14, ampAttack:24, ampSustain:100, ampRelease:88, delayTime:58, delayDepth:46, ...MC(35) },
  { name:'Sunset',       osc1Wave:0, osc2Wave:2, osc2Tune:9,  osc1Level:88, osc2Level:82, filterCutoff:70, filterResonance:16, ampAttack:22, ampSustain:100, ampRelease:85, delayTime:55, delayDepth:44, ...MC(35) },
  { name:'Dawn',         osc1Wave:2, osc2Wave:0, osc2Tune:8,  osc1Level:88, osc2Level:78, filterCutoff:74, filterResonance:16, ampAttack:20, ampSustain:100, ampRelease:82, delayTime:52, delayDepth:42, ...MC(35) },
  { name:'Blue Hour',    osc1Wave:3, osc2Wave:2, osc2Tune:10, osc1Level:85, osc2Level:80, filterCutoff:65, filterResonance:14, ampAttack:28, ampSustain:100, ampRelease:90, delayTime:60, delayDepth:48, ...MC(35) },
  { name:'Evening',      osc1Wave:2, osc2Wave:2, osc2Tune:11, osc1Level:88, osc2Level:82, filterCutoff:68, filterResonance:14, ampAttack:25, ampSustain:100, ampRelease:88, delayTime:58, delayDepth:46, ...MC(35) },
  { name:'Midnight',     osc1Wave:2, osc2Wave:0, osc2Tune:9,  osc1Level:85, osc2Level:80, filterCutoff:60, filterResonance:16, ampAttack:30, ampSustain:100, ampRelease:92, delayTime:62, delayDepth:50, ...MC(35) },
  { name:'First Light',  osc1Wave:3, osc2Wave:2, osc2Tune:8,  osc1Level:88, osc2Level:78, filterCutoff:72, filterResonance:14, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:52, delayDepth:42, ...MC(35) },
  { name:'Golden Hour',  osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:88, osc2Level:82, filterCutoff:72, filterResonance:18, vp1Src:2, vp1Dst:4, vp1Int:16, lfo1Wave:2, lfo1Rate:10, ampAttack:22, ampSustain:100, ampRelease:85, delayTime:55, delayDepth:44, ...MC(35) },

  // ── C6: Resonant Pads (169–176) ──────────────────────────────────────────
  { name:'Resonant Pad', osc1Wave:0, osc2Wave:2, osc2Tune:9, osc1Level:88, osc2Level:78, filterCutoff:58, filterResonance:70, vp1Src:2, vp1Dst:4, vp1Int:28, lfo1Wave:2, lfo1Rate:14, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:52, delayDepth:42, ...MC(40) },
  { name:'Rezo',         osc1Wave:0, osc1Level:90, filterCutoff:60, filterResonance:85, filterEgInt:38, filterAttack:12, filterDecay:65, ampAttack:20, ampSustain:100, ampRelease:80, delayTime:55, delayDepth:42, ...MC(40) },
  { name:'Filtered Pad', osc1Wave:2, osc2Wave:2, osc2Tune:8, osc1Level:88, osc2Level:78, filterCutoff:52, filterResonance:75, filterEgInt:42, filterAttack:15, filterDecay:70, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:55, delayDepth:44, ...MC(40) },
  { name:'Sweep Pad',    osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:88, osc2Level:78, filterCutoff:45, filterResonance:68, filterEgInt:52, filterAttack:18, filterDecay:80, ampAttack:20, ampSustain:100, ampRelease:85, delayTime:60, delayDepth:48, ...MC(42) },
  { name:'Bloom',        osc1Wave:2, osc1Level:88, filterCutoff:48, filterResonance:72, filterEgInt:55, filterAttack:20, filterDecay:90, ampAttack:25, ampSustain:100, ampRelease:90, delayTime:62, delayDepth:50, ...MC(42) },
  { name:'Peak Pad',     osc1Wave:0, osc2Wave:0, osc2Tune:9, osc1Level:88, osc2Level:78, filterCutoff:62, filterResonance:100, filterEgInt:35, filterAttack:10, filterDecay:60, ampAttack:20, ampSustain:100, ampRelease:80, delayTime:55, delayDepth:44, ...MC(35) },
  { name:'Crystal Pad',  osc1Wave:2, osc2Wave:2, osc2Tune:12, osc1Level:88, osc2Level:80, filterCutoff:82, filterResonance:60, filterEgInt:28, filterDecay:50, ampAttack:18, ampSustain:100, ampRelease:78, delayTime:52, delayDepth:42, ...MC(35) },
  { name:'Liquid',       osc1Wave:2, osc2Wave:2, osc2Tune:8, osc1Level:88, osc2Level:80, filterCutoff:60, filterResonance:65, vp1Src:2, vp1Dst:4, vp1Int:30, lfo1Wave:2, lfo1Rate:16, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:58, delayDepth:46, ...MC(40) },

  // ── C7: Wide / Chorus Pads (177–184) ────────────────────────────────────
  { name:'Wide Pad',     osc1Wave:0, osc2Wave:0, osc2Tune:11, osc1Level:90, osc2Level:88, filterCutoff:75, filterResonance:18, modRate:42, modDepth:55, modType:0, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:52, delayDepth:42, ...MC(35) },
  { name:'Shimmer',      osc1Wave:2, osc2Wave:2, osc2Tune:9,  osc1Level:88, osc2Level:82, filterCutoff:78, filterResonance:20, modRate:38, modDepth:48, modType:0, ampAttack:20, ampSustain:100, ampRelease:80, delayTime:50, delayDepth:40, ...MC(35) },
  { name:'Chorus Pad',   osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:88, osc2Level:82, filterCutoff:76, filterResonance:18, modRate:45, modDepth:58, modType:0, ampAttack:22, ampSustain:100, ampRelease:82, delayTime:52, delayDepth:42, ...MC(35) },
  { name:'Lush Wide',    osc1Wave:2, osc2Wave:0, osc2Tune:12, osc1Level:88, osc2Level:85, filterCutoff:72, filterResonance:16, modRate:40, modDepth:52, modType:0, ampAttack:25, ampSustain:100, ampRelease:85, delayTime:58, delayDepth:48, ...MC(35) },
  { name:'Floating',     osc1Wave:3, osc2Wave:2, osc2Tune:10, osc1Level:85, osc2Level:82, filterCutoff:70, filterResonance:14, modRate:35, modDepth:50, modType:0, ampAttack:28, ampSustain:100, ampRelease:88, delayTime:62, delayDepth:52, ...MC(35) },
  { name:'Veil',         osc1Wave:2, osc2Wave:2, osc2Tune:8,  osc1Level:82, osc2Level:80, filterCutoff:65, filterResonance:12, modRate:32, modDepth:45, modType:0, ampAttack:32, ampSustain:100, ampRelease:92, delayTime:65, delayDepth:55, ...MC(35) },
  { name:'Haze',         osc1Wave:0, osc2Wave:2, osc2Tune:11, osc1Level:85, osc2Level:80, filterCutoff:68, filterResonance:16, modRate:38, modDepth:50, modType:0, ampAttack:28, ampSustain:100, ampRelease:88, delayTime:60, delayDepth:50, ...MC(35) },
  { name:'Diffuse',      osc1Wave:2, osc2Wave:0, osc2Tune:9,  osc1Level:85, osc2Level:82, filterCutoff:70, filterResonance:15, modRate:36, modDepth:48, modType:0, ampAttack:30, ampSustain:100, ampRelease:90, delayTime:62, delayDepth:52, ...MC(35) },

  // ── C8: Dub Pads (185–192) ──────────────────────────────────────────────
  { name:'Dub Pad',      osc1Wave:0, osc2Wave:2, osc2Tune:8,  osc1Level:90, osc2Level:75, filterCutoff:70, filterResonance:20, ampAttack:15, ampSustain:100, ampRelease:75, delayTime:62, delayDepth:55, ...MC(35) },
  { name:'Echo Pad',     osc1Wave:2, osc2Wave:2, osc2Tune:9,  osc1Level:88, osc2Level:78, filterCutoff:68, filterResonance:18, ampAttack:18, ampSustain:100, ampRelease:78, delayTime:68, delayDepth:58, ...MC(35) },
  { name:'Dub Chord',    osc1Wave:0, osc2Wave:1, osc2Semi:7, osc2Tune:5, osc1Level:88, osc2Level:72, filterCutoff:72, filterResonance:22, ampAttack:12, ampDecay:50, ampSustain:72, ampRelease:65, delayTime:62, delayDepth:55, ...MC(35) },
  { name:'Space Echo',   osc1Wave:2, osc2Wave:2, osc2Tune:11, osc1Level:85, osc2Level:80, filterCutoff:65, filterResonance:18, ampAttack:20, ampSustain:100, ampRelease:85, delayTime:72, delayDepth:62, ...MC(35) },
  { name:'Reverb Pad',   osc1Wave:3, osc2Wave:2, osc2Tune:9,  osc1Level:85, osc2Level:78, filterCutoff:68, filterResonance:16, ampAttack:22, ampSustain:100, ampRelease:90, delayTime:70, delayDepth:60, ...MC(35) },
  { name:'Dub Wide',     osc1Wave:0, osc2Wave:0, osc2Tune:10, osc1Level:88, osc2Level:85, filterCutoff:70, filterResonance:20, modRate:38, modDepth:45, modType:0, ampAttack:18, ampSustain:100, ampRelease:82, delayTime:65, delayDepth:58, ...MC(35) },
  { name:'Echo Drift',   osc1Wave:2, osc2Wave:2, osc2Tune:9,  osc1Level:85, osc2Level:80, filterCutoff:65, filterResonance:18, vp1Src:2, vp1Dst:4, vp1Int:18, lfo1Wave:2, lfo1Rate:8, ampAttack:25, ampSustain:100, ampRelease:88, delayTime:70, delayDepth:60, ...MC(35) },
  { name:'Wet Pad',      osc1Wave:2, osc2Wave:0, osc2Tune:10, osc1Level:85, osc2Level:80, filterCutoff:68, filterResonance:16, ampAttack:22, ampSustain:100, ampRelease:88, delayTime:72, delayDepth:64, ...MC(35) },

  // ══════════════════════════════════════════════════════════════════════════
  // BANK D: FX (193–256)
  // D1=Dub FX  D2=Bubble/Filter  D3=Psy Movement  D4=Arp Tones(arps OFF)
  // D5=Stabs   D6=Sweeps/Risers  D7=Alien/Psy FX  D8=Drones/Texture
  // ══════════════════════════════════════════════════════════════════════════

  // ── D1: Dub FX (193–200) — delay-centric, musical echoes ─────────────────
  { name:'Dub Echo',     osc1Wave:0, osc1Level:105, filterCutoff:72, filterResonance:28, ampAttack:3,  ampDecay:55, ampSustain:60, ampRelease:55, delayTime:65, delayDepth:60, ...MC(35) },
  { name:'Skank Echo',   osc1Wave:0, osc2Wave:1, osc2Semi:7, osc1Level:100, osc2Level:55, filterCutoff:85, filterResonance:35, filterEgInt:30, filterDecay:25, ampAttack:1, ampDecay:30, ampSustain:0, ampRelease:25, delayTime:62, delayDepth:58, ...MC(30) },
  { name:'Dub Note',     osc1Wave:2, osc1Level:102, filterCutoff:75, filterResonance:30, ampAttack:3,  ampDecay:45, ampSustain:50, ampRelease:50, delayTime:68, delayDepth:62, ...MC(30) },
  { name:'Deep Dub',     osc1Wave:0, osc2Wave:2, osc2Tune:7, osc1Level:100, osc2Level:58, filterCutoff:62, filterResonance:28, ampAttack:5, ampSustain:80, ampRelease:65, delayTime:70, delayDepth:62, ...MC(30) },
  { name:'Delay Fade',   osc1Wave:2, osc2Wave:2, osc2Tune:8, osc1Level:95, osc2Level:75, filterCutoff:70, filterResonance:22, ampAttack:5, ampDecay:60, ampSustain:40, ampRelease:65, delayTime:72, delayDepth:65, ...MC(30) },
  { name:'Dub Stab',     osc1Wave:0, osc2Wave:1, osc2Semi:7, osc1Level:102, osc2Level:60, filterCutoff:88, filterResonance:42, filterEgInt:35, filterDecay:20, ampAttack:0, ampDecay:28, ampSustain:0, ampRelease:22, delayTime:65, delayDepth:60, ...MC(25) },
  { name:'Echo Lead',    osc1Wave:0, osc1Level:105, filterCutoff:88, filterResonance:32, portamento:10, ampAttack:3, ampSustain:90, ampRelease:42, delayTime:68, delayDepth:62, ...MC(30) },
  { name:'Dub Organ',    osc1Wave:2, osc2Wave:2, osc2Semi:12, osc1Level:95, osc2Level:65, filterCutoff:80, filterResonance:22, ampAttack:5, ampSustain:100, ampRelease:50, delayTime:65, delayDepth:58, ...MC(30) },

  // ── D2: Bubble / Filter FX (201–208) — self-animating filter beauty ───────
  { name:'Bubbling',     osc1Wave:0, osc1Level:108, filterCutoff:52, filterResonance:98, vp1Src:2, vp1Dst:4, vp1Int:48, lfo1Wave:2, lfo1Rate:55, ampAttack:2, ampSustain:100, ampRelease:40, delayTime:38, delayDepth:28, ...ML(45) },
  { name:'Gurgle',       osc1Wave:0, osc1Level:108, filterCutoff:48, filterResonance:105, vp1Src:2, vp1Dst:4, vp1Int:52, lfo1Wave:2, lfo1Rate:45, ampAttack:2, ampSustain:100, ampRelease:38, delayTime:35, delayDepth:25, ...ML(45) },
  { name:'Percolate',    osc1Wave:0, osc1Level:105, filterCutoff:55, filterResonance:95, vp1Src:2, vp1Dst:4, vp1Int:44, lfo1Wave:2, lfo1Rate:70, ampAttack:1, ampSustain:100, ampRelease:35, ...ML(45) },
  { name:'Fizz',         osc1Wave:1, osc1Level:100, filterCutoff:62, filterResonance:90, vp1Src:2, vp1Dst:4, vp1Int:40, lfo1Wave:2, lfo1Rate:78, ampAttack:1, ampSustain:100, ampRelease:32, delayTime:32, delayDepth:22, ...ML(42) },
  { name:'Drip',         osc1Wave:3, osc1Level:100, filterCutoff:50, filterResonance:100, vp1Src:2, vp1Dst:4, vp1Int:48, lfo1Wave:2, lfo1Rate:28, ampAttack:2, ampSustain:100, ampRelease:45, delayTime:40, delayDepth:30, ...ML(42) },
  { name:'Boil',         osc1Wave:0, osc2Wave:0, osc2Tune:-6, osc1Level:105, osc2Level:75, filterCutoff:50, filterResonance:102, vp1Src:2, vp1Dst:4, vp1Int:50, lfo1Wave:3, lfo1Rate:65, ampAttack:1, ampSustain:100, ampRelease:35, ...ML(45) },
  { name:'Brook',        osc1Wave:2, osc2Wave:2, osc2Tune:8, osc1Level:95, osc2Level:75, filterCutoff:58, filterResonance:78, vp1Src:2, vp1Dst:4, vp1Int:38, lfo1Wave:2, lfo1Rate:40, ampAttack:3, ampSustain:100, ampRelease:45, delayTime:42, delayDepth:32, ...ML(40) },
  { name:'Ocean',        osc1Wave:2, osc2Wave:2, osc2Tune:10, osc1Level:90, osc2Level:80, filterCutoff:55, filterResonance:65, vp1Src:2, vp1Dst:4, vp1Int:32, lfo1Wave:2, lfo1Rate:14, ampAttack:8, ampSustain:100, ampRelease:60, delayTime:55, delayDepth:45, ...MC(40) },

  // ── D3: Psy Movement (209–216) — chorusing, spiraling, wide ──────────────
  { name:'Psy Chorus',   osc1Wave:0, osc2Wave:0, osc2Tune:11, osc1Level:92, osc2Level:88, filterCutoff:78, filterResonance:30, modRate:42, modDepth:55, modType:0, ampAttack:5, ampSustain:100, ampRelease:50, delayTime:52, delayDepth:42, ...MC(35) },
  { name:'Spiral FX',    osc1Wave:0, osc2Wave:0, osc2Tune:9, osc1Level:90, osc2Level:82, filterCutoff:62, filterResonance:75, vp1Src:2, vp1Dst:4, vp1Int:40, lfo1Wave:2, lfo1Rate:52, ampAttack:4, ampSustain:100, ampRelease:48, delayTime:50, delayDepth:42, ...ML(42) },
  { name:'Trippy',       osc1Wave:0, osc2Wave:2, osc2Tune:10, osc1Level:90, osc2Level:80, filterCutoff:60, filterResonance:80, vp1Src:2, vp1Dst:0, vp1Int:15, lfo1Wave:2, lfo1Rate:30, ampAttack:5, ampSustain:100, ampRelease:50, delayTime:55, delayDepth:45, ...MC(40) },
  { name:'Shpongle',     osc1Wave:2, osc2Wave:2, osc2Tune:13, osc1Level:88, osc2Level:85, filterCutoff:65, filterResonance:58, vp1Src:2, vp1Dst:4, vp1Int:28, lfo1Wave:2, lfo1Rate:20, ampAttack:8, ampSustain:100, ampRelease:58, delayTime:60, delayDepth:52, ...MC(38) },
  { name:'Wavering',     osc1Wave:0, osc2Wave:0, osc2Tune:8, osc1Level:90, osc2Level:80, filterCutoff:70, filterResonance:30, vp1Src:2, vp1Dst:0, vp1Int:20, lfo1Wave:2, lfo1Rate:18, ampAttack:6, ampSustain:100, ampRelease:52, delayTime:50, delayDepth:40, ...MP(30) },
  { name:'Drift',        osc1Wave:2, osc2Wave:2, osc2Tune:11, osc1Level:88, osc2Level:82, filterCutoff:65, filterResonance:22, vp1Src:2, vp1Dst:0, vp1Int:10, lfo1Wave:2, lfo1Rate:8,  ampAttack:12, ampSustain:100, ampRelease:65, delayTime:62, delayDepth:52, ...MC(35) },
  { name:'Floating FX',  osc1Wave:3, osc2Wave:2, osc2Tune:9, osc1Level:85, osc2Level:78, filterCutoff:68, filterResonance:18, ampAttack:18, ampSustain:100, ampRelease:80, delayTime:68, delayDepth:58, ...MC(35) },
  { name:'Vortex',       osc1Wave:0, osc1Level:105, filterCutoff:55, filterResonance:92, vp1Src:2, vp1Dst:4, vp1Int:50, lfo1Wave:2, lfo1Rate:78, ampAttack:2, ampSustain:100, ampRelease:38, delayTime:42, delayDepth:35, ...ML(45) },

  // ── D4: Arp Tones (217–224) — arps OFF, designed for sequencing ───────────
  { name:'Arp Note',     osc1Wave:0, osc2Wave:2, osc2Tune:7, osc1Level:102, osc2Level:55, filterCutoff:92, filterResonance:32, filterEgInt:28, filterDecay:22, ampAttack:1, ampDecay:28, ampSustain:50, ampRelease:22, ...MC(25) },
  { name:'Stab Arp',     osc1Wave:0, osc1Level:108, filterCutoff:98, filterResonance:42, filterEgInt:35, filterDecay:18, ampAttack:0, ampDecay:22, ampSustain:0, ampRelease:18, ...MC(25) },
  { name:'Bright Arp',   osc1Wave:0, osc2Wave:1, osc2Semi:12, osc1Level:102, osc2Level:45, filterCutoff:102, filterResonance:38, filterEgInt:30, filterDecay:18, ampAttack:0, ampDecay:25, ampSustain:20, ampRelease:20, ...MC(25) },
  { name:'Dark Arp',     osc1Wave:0, osc1Level:105, filterCutoff:70, filterResonance:48, filterEgInt:38, filterDecay:25, ampAttack:1, ampDecay:30, ampSustain:30, ampRelease:25, ...MC(25) },
  { name:'Acid Arp',     osc1Wave:0, osc1Level:108, filterCutoff:52, filterResonance:90, filterEgInt:50, filterDecay:22, portamento:10, ampAttack:0, ampDecay:25, ampSustain:40, ampRelease:20, ...MC(30) },
  { name:'Bell Arp',     osc1Wave:3, osc2Wave:0, osc2Mod:1, osc2Semi:7, osc1Level:100, osc2Level:58, filterCutoff:98, filterResonance:28, ampAttack:0, ampDecay:45, ampSustain:0, ampRelease:35, delayTime:38, delayDepth:25, ...MC(20) },
  { name:'Gate Arp',     osc1Wave:0, osc2Wave:2, osc2Tune:6, osc1Level:100, osc2Level:58, filterCutoff:88, filterResonance:35, vp1Src:2, vp1Dst:5, vp1Int:42, lfo1Wave:1, lfo1Rate:60, ampAttack:1, ampSustain:100, ampRelease:20, ...MC(25) },
  { name:'Bass Arp',     osc1Wave:0, osc1Level:110, filterCutoff:78, filterResonance:42, filterEgInt:38, filterDecay:22, portamento:8, ampAttack:0, ampDecay:32, ampSustain:30, ampRelease:22, ...MC(25) },

  // ── D5: Stabs / Hits (225–232) — short, punchy, one-shots ─────────────────
  { name:'Classic Stab', osc1Wave:0, osc2Wave:0, osc2Tune:12, osc1Level:98, osc2Level:88, filterCutoff:95, filterResonance:42, filterEgInt:32, filterDecay:18, ampAttack:0, ampDecay:25, ampSustain:0, ampRelease:18, ...MC(30) },
  { name:'House Stab',   osc1Wave:0, osc2Wave:1, osc2Semi:7, osc2Tune:4, osc1Level:95, osc2Level:78, filterCutoff:90, filterResonance:35, filterEgInt:28, filterDecay:20, ampAttack:0, ampDecay:28, ampSustain:0, ampRelease:20, delayTime:35, delayDepth:25, ...MC(25) },
  { name:'Psy Stab',     osc1Wave:0, osc2Wave:0, osc2Mod:2, osc2Tune:22, osc1Level:100, osc2Level:55, filterCutoff:92, filterResonance:62, filterEgInt:38, filterDecay:18, ampAttack:0, ampDecay:22, ampSustain:0, ampRelease:16, ...MC(30) },
  { name:'Techno Hit',   osc1Wave:0, osc2Wave:0, osc2Tune:10, osc1Level:102, osc2Level:85, filterCutoff:98, filterResonance:50, filterEgInt:32, filterDecay:16, ampAttack:0, ampDecay:22, ampSustain:0, ampRelease:15, ...MC(30) },
  { name:'Bell Hit',     osc1Wave:3, osc2Wave:0, osc2Mod:1, osc2Semi:9, osc1Level:100, osc2Level:72, filterCutoff:98, filterResonance:32, ampAttack:0, ampDecay:38, ampSustain:0, ampRelease:30, ...MC(20) },
  { name:'Chord Hit',    osc1Wave:0, osc2Wave:1, osc2Semi:7, osc2Tune:5, osc1Level:95, osc2Level:80, filterCutoff:88, filterResonance:28, filterEgInt:25, filterDecay:20, ampAttack:2, ampDecay:32, ampSustain:0, ampRelease:22, delayTime:32, delayDepth:22, ...MC(25) },
  { name:'Brass Hit',    osc1Wave:0, osc1Level:110, filterCutoff:100, filterResonance:38, filterEgInt:35, filterDecay:18, ampAttack:2, ampDecay:35, ampSustain:20, ampRelease:22, ...MC(30) },
  { name:'Pluck Hit',    osc1Wave:0, osc2Wave:2, osc2Tune:6, osc1Level:105, osc2Level:52, filterCutoff:100, filterResonance:45, filterEgInt:38, filterDecay:18, ampAttack:0, ampDecay:25, ampSustain:0, ampRelease:18, ...MC(25) },

  // ── D6: Sweeps / Risers (233–240) — build-up tools ───────────────────────
  { name:'Filter Rise',  osc1Wave:0, osc2Wave:0, osc2Tune:9, osc1Level:105, osc2Level:80, filterCutoff:25, filterResonance:65, filterEgInt:60, filterAttack:80, filterDecay:100, ampAttack:0, ampSustain:100, ampRelease:35, ...MC(45) },
  { name:'Pitch Rise',   osc1Wave:0, osc1Level:108, filterCutoff:88, filterResonance:32, vp1Src:1, vp1Dst:0, vp1Int:55, ampAttack:0, ampDecay:70, ampSustain:70, ampRelease:40, ...MP(40) },
  { name:'Noise Rise',   osc1Wave:6, osc1Level:100, noiseLevel:88, filterCutoff:22, filterResonance:58, filterEgInt:60, filterAttack:90, filterDecay:100, ampAttack:10, ampSustain:100, ampRelease:40, ...MC(45) },
  { name:'Sub Drop',     osc1Wave:3, osc1Level:115, filterCutoff:60, filterResonance:15, vp1Src:1, vp1Dst:0, vp1Int:-38, ampAttack:0, ampDecay:90, ampSustain:50, ampRelease:60, ...MC(30) },
  { name:'Slow Rise',    osc1Wave:0, osc2Wave:2, osc2Tune:8, osc1Level:98, osc2Level:80, filterCutoff:20, filterResonance:55, filterEgInt:58, filterAttack:100, filterDecay:100, ampAttack:15, ampSustain:100, ampRelease:50, ...MC(45) },
  { name:'Rev Env',      osc1Wave:0, osc2Wave:0, osc2Tune:9, osc1Level:100, osc2Level:78, filterCutoff:65, filterResonance:35, ampAttack:100, ampDecay:40, ampSustain:80, ampRelease:55, delayTime:45, delayDepth:35, ...MC(40) },
  { name:'Drop FX',      osc1Wave:0, osc1Level:108, filterCutoff:90, filterResonance:45, vp1Src:1, vp1Dst:0, vp1Int:-55, ampAttack:0, ampDecay:45, ampSustain:0, ampRelease:28, ...MP(40) },
  { name:'Wave Rise',    osc1Wave:2, osc2Wave:2, osc2Tune:10, osc1Level:95, osc2Level:82, filterCutoff:30, filterResonance:70, vp1Src:2, vp1Dst:4, vp1Int:45, lfo1Wave:2, lfo1Rate:55, filterEgInt:50, filterAttack:70, filterDecay:100, ampAttack:5, ampSustain:100, ampRelease:45, ...MC(45) },

  // ── D7: Alien / Psy FX (241–248) ─────────────────────────────────────────
  { name:'Alien Vox',    osc1Wave:4, osc1Level:108, filterCutoff:70, filterResonance:85, filterEgInt:42, filterDecay:48, vp1Src:2, vp1Dst:4, vp1Int:32, lfo1Wave:2, lfo1Rate:32, portamento:18, ampAttack:5, ampSustain:90, ampRelease:52, delayTime:45, delayDepth:38, ...MC1(45) },
  { name:'Ring Planet',  osc1Wave:0, osc2Wave:0, osc2Mod:1, osc2Semi:6, osc1Level:100, osc2Level:80, filterCutoff:68, filterResonance:70, filterEgInt:40, filterDecay:42, vp1Src:2, vp1Dst:4, vp1Int:35, lfo1Wave:2, lfo1Rate:28, ampAttack:3, ampSustain:90, ampRelease:50, delayTime:42, delayDepth:35, ...MC(40) },
  { name:'S&H Alien',    osc1Wave:1, osc1Level:102, filterCutoff:78, filterResonance:65, vp1Src:2, vp1Dst:0, vp1Int:35, lfo1Wave:3, lfo1Rate:72, ampAttack:1, ampDecay:35, ampSustain:65, ampRelease:28, delayTime:38, delayDepth:30, ...MC(40) },
  { name:'Glitch',       osc1Wave:1, osc2Wave:1, osc2Tune:8, osc1Level:100, osc2Level:80, filterCutoff:82, filterResonance:58, vp1Src:2, vp1Dst:0, vp1Int:40, lfo1Wave:3, lfo1Rate:88, ampAttack:0, ampDecay:30, ampSustain:55, ampRelease:22, ...MC(40) },
  { name:'Metal Hit',    osc1Wave:0, osc2Wave:0, osc2Mod:1, osc2Semi:4, osc1Level:102, osc2Level:88, filterCutoff:92, filterResonance:62, filterEgInt:38, filterDecay:22, ampAttack:0, ampDecay:30, ampSustain:0, ampRelease:22, ...MC(35) },
  { name:'Alien Talk',   osc1Wave:4, osc2Wave:1, osc2Semi:12, osc1Level:100, osc2Level:55, filterType:2, filterCutoff:65, filterResonance:90, vp1Src:2, vp1Dst:4, vp1Int:40, lfo1Wave:2, lfo1Rate:25, ampAttack:4, ampSustain:92, ampRelease:48, delayTime:40, delayDepth:32, ...MC(45) },
  { name:'Laser FX',     osc1Wave:0, osc1Level:108, filterCutoff:98, filterResonance:50, vp1Src:1, vp1Dst:0, vp1Int:50, ampAttack:0, ampDecay:28, ampSustain:0, ampRelease:18, ...MC(35) },
  { name:'Siren',        osc1Wave:0, osc1Level:108, filterCutoff:94, filterResonance:32, vp1Src:2, vp1Dst:0, vp1Int:52, lfo1Wave:2, lfo1Rate:22, ampAttack:5, ampSustain:100, ampRelease:35, ...MC(35) },

  // ── D8: Drones / Texture (249–256) — sustained, meditative ───────────────
  { name:'Drone Low',    osc1Wave:0, osc2Wave:2, osc2Tune:-9,  osc1Level:92, osc2Level:85, filterCutoff:45, filterResonance:28, vp1Src:2, vp1Dst:4, vp1Int:20, lfo1Wave:2, lfo1Rate:6,  ampAttack:55, ampSustain:100, ampRelease:100, ...MC(30) },
  { name:'Drone Mid',    osc1Wave:2, osc2Wave:0, osc2Tune:9,   osc1Level:88, osc2Level:85, filterCutoff:65, filterResonance:25, vp1Src:2, vp1Dst:4, vp1Int:18, lfo1Wave:2, lfo1Rate:8,  ampAttack:48, ampSustain:100, ampRelease:100, delayTime:52, delayDepth:42, ...MC(30) },
  { name:'Drone High',   osc1Wave:2, osc2Wave:0, osc2Tune:11,  osc1Level:85, osc2Level:85, filterCutoff:75, filterResonance:22, vp1Src:2, vp1Dst:4, vp1Int:18, lfo1Wave:2, lfo1Rate:9,  ampAttack:45, ampSustain:100, ampRelease:100, delayTime:55, delayDepth:45, ...MC(30) },
  { name:'Wind',         osc1Wave:6, osc1Level:95, noiseLevel:80, filterCutoff:55, filterResonance:30, vp1Src:2, vp1Dst:4, vp1Int:25, lfo1Wave:2, lfo1Rate:12, ampAttack:40, ampSustain:100, ampRelease:100, ...MC(35) },
  { name:'Rain',         osc1Wave:6, osc1Level:88, noiseLevel:85, filterCutoff:70, filterResonance:28, vp1Src:2, vp1Dst:4, vp1Int:30, lfo1Wave:2, lfo1Rate:30, ampAttack:20, ampSustain:100, ampRelease:80, ...MC(35) },
  { name:'Static Hiss',  osc1Wave:6, osc1Level:80, noiseLevel:92, filterCutoff:80, filterResonance:15, ampAttack:15, ampSustain:100, ampRelease:75, ...MC(30) },
  { name:'Breath',       osc1Wave:3, osc1Level:72, noiseLevel:72, filterCutoff:62, filterResonance:22, vp1Src:2, vp1Dst:4, vp1Int:22, lfo1Wave:2, lfo1Rate:10, ampAttack:35, ampSustain:100, ampRelease:90, delayTime:42, delayDepth:32, ...MC(35) },
  { name:'Hum',          osc1Wave:2, osc2Wave:2, osc2Tune:8, osc1Level:85, osc2Level:80, filterCutoff:48, filterResonance:20, vp1Src:2, vp1Dst:4, vp1Int:15, lfo1Wave:2, lfo1Rate:7, ampAttack:50, ampSustain:100, ampRelease:100, ...MC(28) },
];


module.exports = patches;
