#!/usr/bin/env node

const fs = require('fs');

// Read current patches
const patches = require('./patches-data.cjs');

// Refine bass section (indices 0-63, Bank A)
const basses = patches.slice(0, 64);

// Category 1 (A1-8): Sub basses - make deeper, punchier, more trance-ready
for (let i = 0; i < 8; i++) {
  basses[i].filterCutoff = Math.max(40, basses[i].filterCutoff - 5); // Lower cutoff for deep subs
  basses[i].filterResonance = Math.min(20, basses[i].filterResonance); // Smooth, not peaky
  basses[i].ampAttack = 0; // Punch: instant attack
  basses[i].ampRelease = 40; // Quick release for tight feel
  basses[i].osc1Level = Math.max(110, basses[i].osc1Level); // Punchy
}

// Category 2 (A9-16): Acid basses - snappier, more defined
for (let i = 8; i < 16; i++) {
  basses[i].filterAttack = 0; // Snappy filter
  basses[i].filterDecay = Math.min(25, basses[i].filterDecay || 28); // Tight filter decay
  basses[i].ampAttack = 0; // Punchy
  basses[i].ampRelease = Math.min(25, basses[i].ampRelease); // Quick release
}

// Category 3 (A17-24): Funk/groove basses - keep mostly, just tighten
for (let i = 16; i < 24; i++) {
  basses[i].ampAttack = Math.min(2, basses[i].ampAttack); // Snappier
  basses[i].ampRelease = Math.min(45, basses[i].ampRelease); // Tighter
}

// Category 4 (A25-32): NOW CLEAN SUB-BASS VARIANTS (was detuned)
// Make these simple, focused sub basses for layering
const cleanSubs = [
  { name:'Pure Sub',      osc1Wave:3, osc1Level:120, filterCutoff:35, filterResonance:0,  ampAttack:0, ampSustain:100, ampRelease:35, transpose:-12, vp2Src:6, vp2Dst:7, vp2Int:35 },
  { name:'Deep Sub',      osc1Wave:3, osc1Level:115, filterCutoff:32, filterResonance:5,  ampAttack:0, ampSustain:100, ampRelease:40, transpose:-12, vp2Src:6, vp2Dst:7, vp2Int:38 },
  { name:'Clean Saw',     osc1Wave:0, osc1Level:112, filterCutoff:45, filterResonance:0,  ampAttack:0, ampSustain:100, ampRelease:35, transpose:-12, vp2Src:6, vp2Dst:4, vp2Int:32 },
  { name:'Tight Sine',    osc1Wave:3, osc1Level:118, filterCutoff:50, filterResonance:8,  ampAttack:0, ampSustain:100, ampRelease:30, transpose:-12, vp2Src:6, vp2Dst:4, vp2Int:35 },
  { name:'Bright Sub',    osc1Wave:2, osc1Level:115, filterCutoff:55, filterResonance:12, ampAttack:1, ampSustain:100, ampRelease:35, transpose:-12, vp2Src:6, vp2Dst:4, vp2Int:38 },
  { name:'Mid Sub',       osc1Wave:0, osc1Level:110, filterCutoff:60, filterResonance:10, ampAttack:2, ampSustain:95,  ampRelease:40, transpose:-12, vp2Src:6, vp2Dst:7, vp2Int:40 },
  { name:'Tight Tri',     osc1Wave:2, osc1Level:112, filterCutoff:48, filterResonance:6,  ampAttack:0, ampSustain:100, ampRelease:35, transpose:-12, vp2Src:6, vp2Dst:4, vp2Int:30 },
  { name:'Rolling Sub',   osc1Wave:3, osc1Level:108, filterCutoff:58, filterResonance:18, ampAttack:3, ampSustain:100, ampRelease:50, transpose:-12, vp2Src:6, vp2Dst:7, vp2Int:45 },
];
for (let i = 24; i < 32; i++) {
  basses[i] = cleanSubs[i - 24];
}

// Category 5 (A33-40): Pluck/stab - good, just ensure snappy
for (let i = 32; i < 40; i++) {
  basses[i].ampAttack = Math.min(1, basses[i].ampAttack); // Snappy
  basses[i].ampRelease = Math.min(25, basses[i].ampRelease || 20); // Quick decay
}

// Category 6 (A41-48): Modulating - keep movement but tighten envelope
for (let i = 40; i < 48; i++) {
  basses[i].ampAttack = Math.min(2, basses[i].ampAttack); // Snappier onset
  if (basses[i].lfo1Rate) basses[i].lfo1Rate = Math.max(60, basses[i].lfo1Rate); // Fast LFO
}

// Category 7 (A49-56): Psy basses - keep, ensure tight
for (let i = 48; i < 56; i++) {
  basses[i].ampAttack = Math.min(1, basses[i].ampAttack); // Snappy
}

// Category 8 (A57-64): Specialty - refine specific sounds
for (let i = 56; i < 64; i++) {
  basses[i].ampAttack = Math.min(2, basses[i].ampAttack);
  if (basses[i].ampRelease > 60) basses[i].ampRelease = 60; // Cap release
}

// Replace in main array
const refined = [...basses, ...patches.slice(64)];

// Write back
const output = `// microKORG S patch library — 256 patches
// Bank A: Basses  Bank B: Keys  Bank C: Pads  Bank D: FX
// VP Src 6=Mod wheel routed on every patch (Src 7=PitchBend)
// NO global FX by default - clean patches, enable FX manually on hardware

const MC  = (n) => ({ vp2Src:6, vp2Dst:4, vp2Int:n });  // Mod→Cutoff
const MP  = (n) => ({ vp2Src:6, vp2Dst:0, vp2Int:n });  // Mod→Pitch (only whistles)
const MO2 = (n) => ({ vp2Src:6, vp2Dst:1, vp2Int:n });  // Mod→OSC2Pitch
const MC1 = (n) => ({ vp2Src:6, vp2Dst:2, vp2Int:n });  // Mod→Ctrl1
const ML  = (n) => ({ vp2Src:6, vp2Dst:7, vp2Int:n });  // Mod→LFO2Freq
const MA  = (n) => ({ vp2Src:6, vp2Dst:5, vp2Int:n });  // Mod→AMP

const patches = ${JSON.stringify(refined, null, 2)};

module.exports = patches;
`;

fs.writeFileSync('cli/patches-data.cjs', output);

console.log('✅ Refined bass section for trance/dance:');
console.log('  A1-8:   Subs → deeper, punchier');
console.log('  A9-16:  Acids → snappier filter decay');
console.log('  A17-24: Funk → tighter envelope');
console.log('  A25-32: Clean subs → new focused variants');
console.log('  A33-40: Pluck/stab → snappy');
console.log('  A41-48: Modulating → faster LFOs');
console.log('  A49-56: Psy → tight');
console.log('  A57-64: Specialty → refined');
