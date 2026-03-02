#!/usr/bin/env node

const fs = require('fs');

const data = fs.readFileSync('single.syx');

// Format: F0 42 30 00 01 40 40 [7-bit encoded patch] [checksum] F7
const header = data.slice(0, 7);
const encoded = data.slice(7, data.length - 2); // Skip header and last 2 bytes (checksum+F7)
const checksum = data[data.length - 2];
const footer = data[data.length - 1];

console.log('Header: ' + Array.from(header).map(b => '0x' + b.toString(16).padStart(2,'0')).join(' '));
console.log('Encoded data: ' + encoded.length + ' bytes');
console.log('Checksum: 0x' + checksum.toString(16).padStart(2,'0'));
console.log('Footer: 0x' + footer.toString(16).padStart(2,'0'));

// 7-bit decode
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

const raw = decode7bit(encoded);
console.log('Decoded raw: ' + raw.length + ' bytes\n');

// Now analyze the proper patch
console.log('=== PROPERLY DECODED FACTORY PATCH ===\n');
console.log('Name (0-11): "' + raw.slice(0, 12).toString('ascii') + '"');

console.log('\nGLOBAL PARAMS:');
[ {byte: 16, name: 'VOICE_MODE'},
  {byte: 22, name: 'DELAY_TYPE'},
  {byte: 25, name: 'MOD_TYPE'},
  {byte: 37, name: 'KBD_OCTAVE'}
].forEach(({byte, name}) => {
  const val = raw[byte];
  console.log(`  Byte ${byte}: 0x${val.toString(16).padStart(2,'0')} (${val}) ← ${name}`);
});

console.log('\nTIMBRE 1:');
const tb = 38;
[ {offset: 6, name: 'Vibrato Intensity'},
  {offset: 19, name: 'Filter Type'},
  {offset: 20, name: 'Filter Cutoff'},
  {offset: 21, name: 'Filter Resonance'},
  {offset: 22, name: 'Filter EG Int'}
].forEach(({offset, name}) => {
  const byte = tb + offset;
  const val = raw[byte];
  console.log(`  Byte ${byte} (T1+${offset}): 0x${val.toString(16).padStart(2,'0')} (${val}) ← ${name}`);
});
