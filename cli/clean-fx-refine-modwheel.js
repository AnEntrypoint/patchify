#!/usr/bin/env node

const fs = require('fs');

const patches = require('./patches-data.cjs');

// Remove all global FX and refine mod wheel routing
const refined = patches.map((p, i) => {
  const bankNum = Math.floor(i / 64);
  const patchInBank = i % 64;
  
  // Start with patch, remove all global FX
  const clean = { ...p };
  delete clean.delayTime;
  delete clean.delayDepth;
  delete clean.delayType;
  delete clean.modRate;
  delete clean.modDepth;
  delete clean.modType;
  
  // Refine mod wheel routing for basses (Bank A, i < 64)
  if (bankNum === 0) {
    // Basses: diversify mod wheel instead of all cutoff
    const bassDiversity = [
      { vp2Src:6, vp2Dst:4, vp2Int:35 }, // Mod→Cutoff (A1-8: subs)
      { vp2Src:6, vp2Dst:1, vp2Int:30 }, // Mod→OSC2Pitch (A9-16: acid, adds character)
      { vp2Src:6, vp2Dst:4, vp2Int:42 }, // Mod→Cutoff more (A17-24: funk)
      { vp2Src:6, vp2Dst:7, vp2Int:45 }, // Mod→LFO2Freq (A25-32: modulating)
      { vp2Src:6, vp2Dst:5, vp2Int:28 }, // Mod→AMP (A33-40: pluck/stab, volume swell)
      { vp2Src:6, vp2Dst:7, vp2Int:40 }, // Mod→LFO2Freq (A41-48: psy movement)
      { vp2Src:6, vp2Dst:4, vp2Int:38 }, // Mod→Cutoff (A49-56: psy acid)
      { vp2Src:6, vp2Dst:1, vp2Int:32 }, // Mod→OSC2Pitch (A57-64: specialty)
    ];
    
    const categoryIdx = Math.floor(patchInBank / 8);
    clean.vp2Src = bassDiversity[categoryIdx].vp2Src;
    clean.vp2Dst = bassDiversity[categoryIdx].vp2Dst;
    clean.vp2Int = bassDiversity[categoryIdx].vp2Int;
  }
  
  return clean;
});

// Verify
console.log('=== REFACTORING: Remove FX + Diversify Mod Wheel ===\n');

const anyFX = refined.filter(p => p.delayTime || p.delayDepth || p.modRate || p.modDepth).length;
console.log(`Patches with FX after cleaning: ${anyFX}/256 (should be 0)`);

// Check mod wheel diversity in basses
const bassVP2 = refined.slice(0, 64);
const vp2Types = {};
bassVP2.forEach(p => {
  const key = `${p.vp2Src}->${p.vp2Dst}`;
  vp2Types[key] = (vp2Types[key] || 0) + 1;
});

console.log(`\nBass mod wheel routing diversity:`);
Object.entries(vp2Types).forEach(([route, count]) => {
  const [src, dst] = route.split('->');
  const srcNames = ['?', 'lfo1', 'lfo2', 'env1', 'env2', 'velocity', 'modwheel', 'pitchbend'];
  const dstNames = ['pitch', 'osc2pitch', 'ctrl1', 'ctrl2', 'cutoff', 'amp', 'panpot', 'lfo2freq'];
  console.log(`  ${srcNames[src]} → ${dstNames[dst]}: ${count} patches`);
});

// Write out new version
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

console.log('\n✅ Updated patches-data.cjs:');
console.log('  ✓ All global FX removed (clean patches)');
console.log('  ✓ Bass mod wheel routing diversified by category');
console.log('  ✓ Ready for rebuild');
