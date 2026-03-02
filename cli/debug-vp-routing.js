#!/usr/bin/env node

const patches = require('./patches-data.cjs');

// Decode VP routing from patch config
function decodeVP2(cfg) {
  if (!cfg.vp2Src || !cfg.vp2Dst) return 'none';
  
  const dstNames = ['pitch', 'osc2pitch', 'ctrl1', 'ctrl2', 'cutoff', 'amp', 'panpot', 'lfo2freq'];
  const srcNames = ['pitch', 'lfo1', 'lfo2', 'env1', 'env2', 'velocity', 'modwheel', 'pitchbend'];
  
  return `${srcNames[cfg.vp2Src]} → ${dstNames[cfg.vp2Dst]} (int: ${cfg.vp2Int})`;
}

console.log('=== VP2 ROUTING DEBUG ===\n');

// Check a few patches from each bank
const sampleIndices = [
  0,   // A1
  4,   // A5
  50,  // A13
  64,  // B1
  128, // C1
  192, // D1
  200  // D9
];

sampleIndices.forEach(i => {
  const patch = patches[i];
  const bank = String.fromCharCode(65 + Math.floor(i / 64));
  const num = (i % 64) + 1;
  console.log(`${bank}.${num}: ${patch.name.padEnd(15)} → ${decodeVP2(patch)}`);
});

// Count routings
const routingCounts = {};
patches.forEach(p => {
  const routing = decodeVP2(p);
  routingCounts[routing] = (routingCounts[routing] || 0) + 1;
});

console.log('\n=== ROUTING SUMMARY ===');
Object.entries(routingCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([routing, count]) => {
    console.log(`${count.toString().padStart(3)} patches: ${routing}`);
  });
