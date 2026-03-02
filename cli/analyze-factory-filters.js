#!/usr/bin/env node

const fs = require('fs');

const data = fs.readFileSync('single.syx');
const patchData = data.slice(7, data.length - 2);

console.log('=== FACTORY PATCH FILTER/MOD BYTES ===\n');

// Global params
console.log('Global params:');
console.log('Byte 19 (DELAY_SYNC):     0x' + patchData[19].toString(16).padStart(2, '0'));
console.log('Byte 22 (DELAY_TYPE):     0x' + patchData[22].toString(16).padStart(2, '0'));
console.log('Byte 25 (MOD_TYPE):       0x' + patchData[25].toString(16).padStart(2, '0'));

// Timbre 1 (starts at byte 38)
console.log('\nTimbre 1 (bytes 38+):');
console.log('Byte 57 (T1+19 FilterType): 0x' + patchData[57].toString(16).padStart(2, '0'));
console.log('Byte 58 (T1+20 FilterCutoff): 0x' + patchData[58].toString(16).padStart(2, '0'));
console.log('Byte 59 (T1+21 FilterRes): 0x' + patchData[59].toString(16).padStart(2, '0'));
console.log('Byte 60 (T1+22 FilterEGInt): 0x' + patchData[60].toString(16).padStart(2, '0'));

// Maybe there's a filter enable flag somewhere?
console.log('\nOther Timbre bytes that might enable filters:');
for (let i = 38; i < 60; i++) {
  const val = patchData[i];
  if (val !== 0x40 && val !== 0 && val !== 0x7F) {
    console.log('Byte ' + i + ' (T1+' + (i-38) + '): 0x' + val.toString(16).padStart(2, '0') + ' = ' + val);
  }
}
