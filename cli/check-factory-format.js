#!/usr/bin/env node

const fs = require('fs');

const data = fs.readFileSync('factory-patches.syx');

console.log('File size: ' + data.length + ' bytes\n');

// Show header
const header = data.slice(0, 10);
console.log('Header (10 bytes): ' + Array.from(header).map(b => '0x' + b.toString(16).padStart(2,'0')).join(' '));

// Expected sizes for different formats:
console.log('\n=== EXPECTED SIZES ===');
console.log('Single patch (254 bytes):');
console.log('  Raw: 254 bytes');
console.log('  7-bit encoded: 291 bytes');
console.log('  With SysEx header/footer: 299 bytes');

console.log('\n256 patches (65024 bytes):');
console.log('  Raw: 65024 bytes');
console.log('  7-bit encoded: 74314 bytes');
console.log('  With SysEx header/footer (0x50): 74322 bytes');
console.log('  With SysEx header/footer (0x51 dump): likely 74322+ bytes');

console.log('\n=== ACTUAL FILE ===');
console.log('File size: ' + data.length);
console.log('If header is 7 bytes and footer is 1 byte:');
console.log('  Data portion: ' + (data.length - 8) + ' bytes');

// Check if it's 7-bit encoded by looking at byte values
let max = 0;
for (let i = 7; i < data.length - 1; i++) {
  if (data[i] > 127) max++;
}
console.log('\nBytes with value > 127: ' + max + ' (7-bit encoded data should have 0)');
