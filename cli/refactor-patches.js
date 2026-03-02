#!/usr/bin/env node

const fs = require('fs');

let content = fs.readFileSync('cli/patches-data.cjs', 'utf8');

// Strategy:
// 1. Remove all portamento properties
// 2. Remove all osc2Tune and osc2Semi properties (detuning)
// 3. Add delay/mod FX to pads and FX that need them

// These patterns will be replaced
const removals = [
  /,\s*portamento:\d+/g,           // Remove portamento
  /,\s*osc2Tune:[^,}]+/g,          // Remove osc2Tune
  /,\s*osc2Semi:[^,}]+/g,          // Remove osc2Semi
];

removals.forEach(pattern => {
  content = content.replace(pattern, '');
});

// Count changes
const origLines = content.split('\n').length;

// Add more FX to pads section - find pads and add delay/mod
// Pads are roughly lines with "Pad" in the name
let patches = content.match(/\{\s*name:'[^']+'/g) || [];
console.log(`Found ${patches.length} patches`);

// For now, just write the cleaned file and show results
fs.writeFileSync('cli/patches-data-refactored.cjs', content);

console.log('✅ Created patches-data-refactored.cjs with:');
console.log('  ✓ All portamento removed');
console.log('  ✓ All osc2Tune removed (fine detuning)');
console.log('  ✓ All osc2Semi removed (octave/interval detuning)');
console.log('  ✓ Ready for FX additions');

// Now verify by parsing
console.log('\nVerifying...');
const patches_orig = require('./patches-data.cjs');
const patches_new = require('./patches-data-refactored.cjs');

let glissRemoved = 0;
let detunesRemoved = 0;

patches_orig.forEach((p, i) => {
  if (p.portamento) glissRemoved++;
  if (p.osc2Tune || p.osc2Semi) detunesRemoved++;
});

console.log(`Gliss removed: ${glissRemoved} patches`);
console.log(`Detunes removed: ${detunesRemoved} patches`);

// Check new file has no these properties
let glissNew = patches_new.filter(p => p.portamento).length;
let detunesNew = patches_new.filter(p => p.osc2Tune || p.osc2Semi).length;

if (glissNew === 0 && detunesNew === 0) {
  console.log('\n✅ Verification passed - no gliss or detunes in new file!');
} else {
  console.log(`\n⚠️  Still found: gliss=${glissNew}, detunes=${detunesNew}`);
}
