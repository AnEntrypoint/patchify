#!/usr/bin/env node

const fs = require('fs');

const data = fs.readFileSync('single.syx');

console.log('=== LOOKING FOR PATCH NAME BOUNDARIES ===\n');
console.log('File size: ' + data.length + '\n');

// single.syx header: F0 42 30 00 01 40 40
// Footer: checksum + F7 (last 2 bytes)
// In between should be patch data (254 bytes raw, not 7-bit encoded)

console.log('Header: ' + Array.from(data.slice(0, 7)).map(b => '0x' + b.toString(16).padStart(2,'0')).join(' '));
console.log('Footer: ' + Array.from(data.slice(-2)).map(b => '0x' + b.toString(16).padStart(2,'0')).join(' '));

// The patch is 254 bytes
// File is 299 bytes total = 7 (header) + 254 (patch) + 2 (checksum+footer) = 263... wait that's not 299

console.log('\nByte count: 7 (header) + ??? + 2 (footer) = ' + data.length);
console.log('Data between header and footer: ' + (data.length - 9) + ' bytes');

// Let's look for ASCII text that might be the patch name
console.log('\nSearching for printable ASCII sequence (patch name should be ASCII):');

for (let start = 7; start < 50; start++) {
  let ascii = '';
  let isValid = true;
  for (let i = start; i < start + 12; i++) {
    const b = data[i];
    if (b >= 32 && b < 127) {
      ascii += String.fromCharCode(b);
    } else {
      isValid = false;
      break;
    }
  }
  if (ascii.length >= 8 && !ascii.includes('\x00')) {
    console.log(`  Offset ${start}: "${ascii}"`);
  }
}

// Check specific offset: maybe it's 254 bytes after header for encoding overhead?
console.log('\n\nChecking different possible data starts:');
const offsets = [7, 8, 9, 10, 11, 12];
offsets.forEach(offset => {
  const patch = data.slice(offset, offset + 254);
  const name = patch.slice(0, 12).toString('ascii');
  const hasControl = Array.from(patch.slice(0, 12)).some(b => b < 32 || b >= 127);
  console.log(`Offset ${offset}: name="${name}" (has control chars: ${hasControl})`);
});
