#!/usr/bin/env node

const fs = require('fs');

// Read our generated 256-patch file
const data = fs.readFileSync('patches/custom-library-2026-03-02.syx');
console.log(`File size: ${data.length} bytes\n`);

// Format: F0 42 30 00 01 40 50 [7-bit encoded data] F7
// Need to decode 7-bit encoding first
const header = data.slice(0, 7);
const encoded = data.slice(7, data.length - 1);
const footer = data[data.length - 1];

console.log(`Header: ${Array.from(header).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`);
console.log(`Encoded data: ${encoded.length} bytes`);

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
      // Add back the high bit from MSB
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
console.log(`Decoded raw data: ${raw.length} bytes\n`);

// Extract first patch (254 bytes)
const patch1 = raw.slice(0, 254);
console.log('=== FIRST PATCH (A1: Deep Sine) ===\n');
console.log('Name (0-11):      ' + patch1.slice(0, 12).toString('ascii'));
console.log('Byte 43 (T1+5):   0x' + patch1[43].toString(16).padStart(2, '0') + ' (dec: ' + patch1[43] + ')');
console.log('Byte 84 (T1+46):  0x' + patch1[84].toString(16).padStart(2, '0') + ' (dec: ' + patch1[84] + ')');
console.log('Byte 85 (T1+47):  0x' + patch1[85].toString(16).padStart(2, '0') + ' (dec: ' + patch1[85] + ')');
console.log('Byte 112 (T1+74): 0x' + patch1[112].toString(16).padStart(2, '0') + ' (dec: ' + patch1[112] + ')');

// Decode VP2
const vp2Byte = patch1[84];
const vp2Src = vp2Byte & 0x0F;
const vp2Dst = (vp2Byte >> 4) & 0x0F;
const vp2Int = patch1[85];
const srcNames = ['OFF', 'lfo1', 'lfo2', 'env1', 'env2', 'velocity', 'modwheel', 'pitchbend'];
const dstNames = ['pitch', 'osc2pitch', 'ctrl1', 'ctrl2', 'cutoff', 'amp', 'panpot', 'lfo2freq'];

console.log(`\nVP2 Decoding (byte 84 = 0x${vp2Byte.toString(16).padStart(2, '0')})`);
console.log(`  Src: ${vp2Src} (${srcNames[vp2Src] || '?'}) `);
console.log(`  Dst: ${vp2Dst} (${dstNames[vp2Dst] || '?'})`);
console.log(`  Int: 0x${vp2Int.toString(16).padStart(2, '0')} (${vp2Int - 64} from center)`);

// Check second patch to compare
const patch2 = raw.slice(254, 508);
console.log('\n\n=== SECOND PATCH (A2: Warm Sub) ===\n');
console.log('Name (0-11):      ' + patch2.slice(0, 12).toString('ascii'));
const vp2Byte2 = patch2[84];
const vp2Src2 = vp2Byte2 & 0x0F;
const vp2Dst2 = (vp2Byte2 >> 4) & 0x0F;
console.log(`VP2: src=${vp2Src2} (${srcNames[vp2Src2] || '?'}), dst=${vp2Dst2} (${dstNames[vp2Dst2] || '?'})`);
