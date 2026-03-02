#!/usr/bin/env node

const patches = require('./patches-data.cjs');

// Decode VP routing from patch config
function decodeVP1(cfg) {
  if (!cfg.vp1Src || !cfg.vp1Dst) return 'none';
  
  const dstNames = ['pitch', 'osc2pitch', 'ctrl1', 'ctrl2', 'cutoff', 'amp', 'panpot', 'lfo2freq'];
  const srcNames = ['pitch', 'lfo1', 'lfo2', 'env1', 'env2', 'velocity', 'modwheel', 'pitchbend'];
  
  return `${srcNames[cfg.vp1Src]} → ${dstNames[cfg.vp1Dst]} (int: ${cfg.vp1Int})`;
}

console.log('=== VP1 ROUTING DEBUG ===\n');

// Count routings
const routingCounts = {};
const pitchRoutings = [];

patches.forEach((p, i) => {
  const routing = decodeVP1(p);
  routingCounts[routing] = (routingCounts[routing] || 0) + 1;
  
  if (routing.includes('pitch') && routing !== 'none') {
    const bank = String.fromCharCode(65 + Math.floor(i / 64));
    const num = (i % 64) + 1;
    pitchRoutings.push(`${bank}.${num}: ${p.name.padEnd(15)} → ${routing}`);
  }
});

console.log('=== ROUTING SUMMARY ===');
Object.entries(routingCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([routing, count]) => {
    console.log(`${count.toString().padStart(3)} patches: ${routing}`);
  });

if (pitchRoutings.length > 0) {
  console.log('\n=== PITCH ROUTINGS (VP1) ===');
  pitchRoutings.forEach(r => console.log(r));
}
