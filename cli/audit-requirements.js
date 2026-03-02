#!/usr/bin/env node

const patches = require('./patches-data.cjs');

console.log('=== AUDIT: Issues to Fix ===\n');

let glissPatches = [];
let detunePatches = [];
let cheapFEGPatches = [];

patches.forEach((p, i) => {
  const name = p.name;
  const bank = String.fromCharCode(65 + Math.floor(i / 64));
  const num = (i % 64) + 1;
  
  // Check for portamento (gliss)
  if (p.portamento !== undefined && p.portamento > 0) {
    glissPatches.push(`${bank}.${num} ${name.padEnd(15)} portamento:${p.portamento}`);
  }
  
  // Check for OSC2 detuning
  if ((p.osc2Tune !== undefined && p.osc2Tune !== 0) || 
      (p.osc2Semi !== undefined && p.osc2Semi !== 0)) {
    detunePatches.push(`${bank}.${num} ${name.padEnd(15)} osc2Semi:${p.osc2Semi || 0} osc2Tune:${p.osc2Tune || 0}`);
  }
  
  // Check for cheap cutoff FEG (filter EG intensity routed to cutoff via VP)
  if (p.vp1Src === 3 && p.vp1Dst === 4) { // env1 → cutoff
    cheapFEGPatches.push(`${bank}.${num} ${name.padEnd(15)} env1→cutoff vp1Int:${p.vp1Int}`);
  }
});

console.log(`GLISS (portamento) - ${glissPatches.length} patches:`);
glissPatches.slice(0, 10).forEach(p => console.log(`  ${p}`));
if (glissPatches.length > 10) console.log(`  ... and ${glissPatches.length - 10} more`);

console.log(`\nDETUNES (OSC2 offset) - ${detunePatches.length} patches:`);
detunePatches.slice(0, 10).forEach(p => console.log(`  ${p}`));
if (detunePatches.length > 10) console.log(`  ... and ${detunePatches.length - 10} more`);

console.log(`\nCHEAP FEG SWIPES (env→cutoff) - ${cheapFEGPatches.length} patches:`);
cheapFEGPatches.forEach(p => console.log(`  ${p}`));

console.log('\n=== CURRENT FX COVERAGE ===');
const withDelay = patches.filter(p => p.delayTime || p.delayDepth).length;
const withMod = patches.filter(p => p.modRate || p.modDepth).length;
console.log(`Patches with delay: ${withDelay}/256`);
console.log(`Patches with mod: ${withMod}/256`);
