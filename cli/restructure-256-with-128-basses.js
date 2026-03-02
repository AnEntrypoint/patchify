#!/usr/bin/env node

const thickBasses = require('./build-128-thick-basses.js');
const currentPatches = require('./patches-data.cjs');

// Keep best 32 keys (1 from each 2-patch group = every other one from B1-64)
const keys = [];
for (let i = 0; i < 64; i += 2) {
  keys.push(currentPatches[64 + i]);  // Bank B (indices 64-127)
}

// Keep best 32 pads (1 from each 2-patch group = every other one from C1-64)
const pads = [];
for (let i = 0; i < 64; i += 2) {
  pads.push(currentPatches[128 + i]);  // Bank C (indices 128-191)
}

// Keep all 64 FX
const fx = currentPatches.slice(192, 256);  // Bank D (indices 192-255)

// Combine: 128 basses + 32 keys + 32 pads + 64 FX = 256
const newPatches = [...thickBasses, ...keys, ...pads, ...fx];

console.log(`✅ Restructured to: ${thickBasses.length} basses + ${keys.length} keys + ${pads.length} pads + ${fx.length} FX = ${newPatches.length} total`);

// Write new patches-data.cjs
const fs = require('fs');

const output = `// microKORG S patch library — 256 patches
// RESTRUCTURED: 128 Thick Basses + 32 Keys + 32 Pads + 64 FX
// NO global FX by default - clean patches, enable FX manually on hardware

const MC  = (n) => ({ vp2Src:6, vp2Dst:4, vp2Int:n });  // Mod→Cutoff
const MP  = (n) => ({ vp2Src:6, vp2Dst:0, vp2Int:n });  // Mod→Pitch
const MO2 = (n) => ({ vp2Src:6, vp2Dst:1, vp2Int:n });  // Mod→OSC2Pitch
const MC1 = (n) => ({ vp2Src:6, vp2Dst:2, vp2Int:n });  // Mod→Ctrl1
const ML  = (n) => ({ vp2Src:6, vp2Dst:7, vp2Int:n });  // Mod→LFO2Freq
const MA  = (n) => ({ vp2Src:6, vp2Dst:5, vp2Int:n });  // Mod→AMP

const patches = ${JSON.stringify(newPatches, null, 2)};

module.exports = patches;
`;

fs.writeFileSync('cli/patches-data.cjs', output);

console.log('\n✅ Updated patches-data.cjs');
console.log('\nNew Structure:');
console.log('  Bank A (1-128):   Thick Wumpy Basses (8 categories × 16 varieties)');
console.log('  Bank B (129-160): Keys (best 32)');
console.log('  Bank C (161-192): Pads (best 32)');
console.log('  Bank D (193-256): FX (all 64)');
