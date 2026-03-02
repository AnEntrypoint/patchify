#!/usr/bin/env node

const fs = require('fs');

// single.syx is: F0 42 30 00 01 40 40 [patch data] [checksum] F7
const data = fs.readFileSync('single.syx');
const patchData = data.slice(7, data.length - 2);

console.log('=== FACTORY SINGLE PATCH DEFAULTS ===\n');
console.log('File: single.syx (Pump Stab factory patch)\n');

// Global params
console.log('GLOBAL PARAMS (bytes 14-37):');
for (let i = 14; i <= 37; i++) {
  const val = patchData[i];
  let meaning = '';
  if (i === 22) meaning = ' ← DELAY_TYPE';
  if (i === 25) meaning = ' ← MOD_TYPE';
  if (i === 37) meaning = ' ← KBD_OCTAVE';
  
  console.log(`  Byte ${i.toString().padStart(2)}: 0x${val.toString(16).padStart(2,'0')} (${val.toString().padStart(3)})${meaning}`);
}

// Timbre 1 critical bytes
console.log('\nTIMBRE 1 KEY BYTES:');
const tb = 38;
const criticalOffsets = [
  { offset: 6, name: 'Vibrato Intensity' },
  { offset: 19, name: 'Filter Type' },
  { offset: 20, name: 'Filter Cutoff' },
  { offset: 21, name: 'Filter Resonance' },
  { offset: 22, name: 'Filter EG Int' },
];

criticalOffsets.forEach(({offset, name}) => {
  const byte = tb + offset;
  const val = patchData[byte];
  console.log(`  Byte ${byte.toString().padStart(3)} (T1+${offset.toString().padStart(2)}): 0x${val.toString(16).padStart(2,'0')} (${val.toString().padStart(3)}) ← ${name}`);
});
