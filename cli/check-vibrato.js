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

// Check first 5 patches
console.log('=== VIBRATO INTENSITY CHECK ===\n');
for (let i = 0; i < 5; i++) {
  const patch = raw.slice(i * 254, (i + 1) * 254);
  const name = patch.slice(0, 12).toString('ascii').trim();
  const vibratoIntensityByte = patch[44]; // T1+6 = 38+6 = 44
  const vibratoValue = vibratoIntensityByte - 64; // Convert from signed encoding
  
  console.log(`Patch ${i+1}: ${name.padEnd(15)} → Byte 44 = 0x${vibratoIntensityByte.toString(16).padStart(2, '0')} (${vibratoValue > 0 ? '+' : ''}${vibratoValue})`);
}

console.log('\n✅ CRITICAL: All should be 0x40 (64) = vibrato OFF');
