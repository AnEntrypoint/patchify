#!/usr/bin/env node

/**
 * Build 128 thick wumpy Daft Punk-style basses
 * Rich, usable, variety of characters
 */

const basses = [];

// Helper: create thick bass
const bass = (name, wave, cut, res, egInt, vib, vp2Dst, vp2Int, modDepth = 1) => ({
  name, osc1Wave: wave, osc1Level: 115, filterCutoff: cut, filterResonance: res,
  filterEgInt: egInt, filterAttack: 0, filterDecay: Math.max(20, egInt - 10),
  filterSustain: 0, ampAttack: 0, ampDecay: 70, ampSustain: 90, ampRelease: 45,
  transpose: -12, vibratoIntensity: vib, vp2Src: 6, vp2Dst, vp2Int
});

// 8 Categories × 16 basses each = 128 total

// CATEGORY 1: Deep Sine Warmth (A1-16)
const category1Names = ['Deep Sine', 'Fat Sine', 'Warm Sub', 'Mellow', 'Dub Sine', 'Rolling', 'Pure Wump', 'Bloom'];
for (let i = 0; i < 16; i++) {
  const catIdx = i % 8;
  basses.push(bass(
    category1Names[catIdx] + (i >= 8 ? ' II' : ''),
    3, 38 + (i % 4) * 3, 5 + (i % 3) * 4, 20 + (i % 4) * 5, 15 + (i % 3) * 5, 4, 32 + (i % 4) * 2
  ));
}

// CATEGORY 2: Bright Saw Punch (A17-32)
const category2Names = ['Saw Dub', 'Bright Saw', 'Thick Saw', 'Rich Wump', 'Cutting', 'Punchy Saw', 'Full Saw', 'Thunder'];
for (let i = 0; i < 16; i++) {
  const catIdx = i % 8;
  basses.push(bass(
    category2Names[catIdx] + (i >= 8 ? ' II' : ''),
    0, 50 + (i % 4) * 3, 12 + (i % 3) * 4, 30 + (i % 4) * 5, 10 + (i % 3) * 4, 4, 36 + (i % 4) * 2
  ));
}

// CATEGORY 3: Square/Pulse Classic (A33-48)
const category3Names = ['Square Wump', 'Pulse', 'Sync', 'Blocky', 'Pulse Dub', 'House', 'Synth', 'Roll'];
for (let i = 0; i < 16; i++) {
  const catIdx = i % 8;
  basses.push(bass(
    category3Names[catIdx] + (i >= 8 ? ' II' : ''),
    1, 44 + (i % 4) * 3, 8 + (i % 3) * 4, 25 + (i % 4) * 5, 12 + (i % 3) * 5, 4, 33 + (i % 4) * 2
  ));
}

// CATEGORY 4: Triangle Smooth (A49-64)
const category4Names = ['Smooth Tri', 'Creamy', 'Tri Dub', 'Silk', 'Cream', 'Smooth', 'Tri Wump', 'Velvet'];
for (let i = 0; i < 16; i++) {
  const catIdx = i % 8;
  basses.push(bass(
    category4Names[catIdx] + (i >= 8 ? ' II' : ''),
    2, 42 + (i % 4) * 3, 6 + (i % 3) * 3, 18 + (i % 4) * 4, 18 + (i % 3) * 6, 4, 30 + (i % 4) * 2
  ));
}

// CATEGORY 5: Layered/Rich (A65-80) - dual osc texture
const category5Names = ['Layered', 'Dual', 'Thick', 'Harmonic', 'Double', 'Stacked', 'Full', 'Texture'];
for (let i = 0; i < 16; i++) {
  const catIdx = i % 8;
  basses.push(bass(
    category5Names[catIdx] + (i >= 8 ? ' II' : ''),
    [3, 0, 2, 3, 0, 3, 2, 1][catIdx], 46 + (i % 4) * 3, 10 + (i % 3) * 4, 32 + (i % 4) * 5,
    16 + (i % 3) * 5, 7, 38 + (i % 4) * 2
  ));
}

// CATEGORY 6: Funk/Groove (A81-96) - envelope-driven
const category6Names = ['Funk Wump', 'Groove', 'House Funk', 'Filter', 'Wah', 'Envelope', 'Groove Wump', 'Funky'];
for (let i = 0; i < 16; i++) {
  const catIdx = i % 8;
  basses.push(bass(
    category6Names[catIdx] + (i >= 8 ? ' II' : ''),
    0, 32 + (i % 4) * 4, 16 + (i % 3) * 3, 40 + (i % 4) * 5, 8 + (i % 3) * 4, 4, 38 + (i % 4) * 2
  ));
}

// CATEGORY 7: Acid/Resonant (A97-112) - for sweeps
const category7Names = ['Acid Wump', 'Resonant', 'Sweep', 'TB', 'Sweep Bass', 'Peak', 'Acid House', 'Resonance'];
for (let i = 0; i < 16; i++) {
  const catIdx = i % 8;
  basses.push(bass(
    category7Names[catIdx] + (i >= 8 ? ' II' : ''),
    0, 40 + (i % 4) * 4, 18 + (i % 3) * 5, 45 + (i % 4) * 6, 6 + (i % 3) * 3, 4, 40 + (i % 4) * 2
  ));
}

// CATEGORY 8: Special/Hybrid (A113-128) - unique characters
const category8Names = ['Hybrid', 'Warm Blend', 'Soft', 'Deep Ambient', 'Clean', 'Ultra', 'Vintage', 'Classic'];
for (let i = 0; i < 16; i++) {
  const catIdx = i % 8;
  const wave = [3, 0, 2, 1, 3, 0, 2, 1][catIdx];
  basses.push(bass(
    category8Names[catIdx] + (i >= 8 ? ' II' : ''),
    wave, 44 + (i % 4) * 3, 8 + (i % 3) * 4, 26 + (i % 4) * 5, 20 + (i % 3) * 5,
    [4, 7, 4, 1, 4, 7, 1, 4][catIdx], 34 + (i % 4) * 2
  ));
}

console.log(`✅ Created ${basses.length} thick wumpy Daft Punk-style basses`);
console.log('\n8 Categories × 16 varieties:');
console.log('  A1-16:   Deep Sine Warmth');
console.log('  A17-32:  Bright Saw Punch');
console.log('  A33-48:  Square/Pulse Classic');
console.log('  A49-64:  Triangle Smooth');
console.log('  A65-80:  Layered/Rich Texture');
console.log('  A81-96:  Funk/Groove Envelope');
console.log('  A97-112: Acid/Resonant Sweep');
console.log('  A113-128: Special/Hybrid Character\n');

module.exports = basses;
