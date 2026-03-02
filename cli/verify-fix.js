#!/usr/bin/env node

const fs = require('fs');

const data = fs.readFileSync('patches/custom-library-2026-03-02.syx');

function decode7bit(encoded) {
  const decoded = [];
  let i = 0;
  while (i < encoded.length) {
    const msb = encoded[i];
    i++;
    const chunkSize = Math.min(7, encoded.length - i);
    for (let j = 0; j < chunkSize; j++) {
      let byte = encoded[i + j];
      if (msb & (1 << (6 - j))) {
        byte |= 0x80;
      }
      decoded.push(byte);
    }
    i += chunkSize;
  }
  return Buffer.from(decoded);
}

const encoded = data.slice(7, data.length - 1);
const raw = decode7bit(encoded);

const patch1 = raw.slice(0, 254);

// Global params
console.log('=== GLOBAL PARAMETERS (First Patch) ===\n');
console.log('Byte 20 (DELAY_TIME):     0x' + patch1[20].toString(16).padStart(2, '0') + ' = ' + patch1[20]);
console.log('Byte 21 (DELAY_DEPTH):    0x' + patch1[21].toString(16).padStart(2, '0') + ' = ' + patch1[21]);
console.log('Byte 22 (DELAY_TYPE):     0x' + patch1[22].toString(16).padStart(2, '0') + ' = ' + patch1[22]);
console.log('Byte 23 (MOD_RATE):       0x' + patch1[23].toString(16).padStart(2, '0') + ' = ' + patch1[23]);
console.log('Byte 24 (MOD_DEPTH):      0x' + patch1[24].toString(16).padStart(2, '0') + ' = ' + patch1[24]);
console.log('Byte 25 (MOD_TYPE):       0x' + patch1[25].toString(16).padStart(2, '0') + ' = ' + patch1[25] + ' ✓ SHOULD BE 0');
console.log('Byte 37 (KBD_OCTAVE):     0x' + patch1[37].toString(16).padStart(2, '0') + ' = ' + patch1[37] + ' ✓ SHOULD BE 0');

console.log('\n=== CRITICAL CHECKS ===');
if (patch1[25] === 0) console.log('✅ MOD_TYPE = 0 (phaser OFF)');
else console.log('❌ MOD_TYPE = ' + patch1[25] + ' (WRONG - should be 0)');

if (patch1[37] === 0) console.log('✅ KBD_OCTAVE = 0 (octave normal)');
else console.log('❌ KBD_OCTAVE = ' + patch1[37] + ' (WRONG - should be 0)');
