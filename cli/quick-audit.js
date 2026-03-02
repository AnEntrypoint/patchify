#!/usr/bin/env node

const fs = require('fs');

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

const data = fs.readFileSync('patches/custom-library-2026-03-02.syx');
const encoded = data.slice(7, data.length - 1);
const raw = decode7bit(encoded);

const patch = raw.slice(0, 254);

console.log('=== PATCH 0 CRITICAL BYTES ===\n');
console.log('Byte 22 (DELAY_TYPE):     0x' + patch[22].toString(16).padStart(2, '0') + ' ← should be 0');
console.log('Byte 25 (MOD_TYPE):       0x' + patch[25].toString(16).padStart(2, '0') + ' ← should be 0');
console.log('Byte 37 (KBD_OCTAVE):     0x' + patch[37].toString(16).padStart(2, '0') + ' ← should be 0');
console.log('Byte 57 (T1+19 FilterType): 0x' + patch[57].toString(16).padStart(2, '0') + ' ← should be 0 (LPF)');

const filterType = patch[57];
const modType = patch[25];

console.log('\n=== STATUS ===');
if (filterType === 3) console.log('❌ FilterType = 3 (HPF) - WRONG!');
else if (filterType === 0) console.log('✅ FilterType = 0 (LPF) - correct');
else console.log('⚠️  FilterType = ' + filterType);

if (modType === 0) console.log('✅ ModType = 0 (off) - correct');
else console.log('❌ ModType = ' + modType + ' - WRONG!');
