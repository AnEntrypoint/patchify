#!/usr/bin/env node

/**
 * Audit all signed parameters to ensure they default to 0x40 (center)
 */

const fs = require('fs');

// Signed parameters from spec (value 64 = center/0, range 64±N)
const signedParams = [
  { offset: 3,  name: 'Tune',           range: 50,  expected: 64 },
  { offset: 4,  name: 'Bend Range',     range: 12,  expected: 64 },
  { offset: 5,  name: 'Transpose (legacy)', range: 24, expected: 64 },
  { offset: 6,  name: 'Vibrato Intensity', range: 63, expected: 64 },
  { offset: 13, name: 'OSC2 Semitone', range: 24,  expected: 64 },
  { offset: 14, name: 'OSC2 Tune',     range: 63,  expected: 64 },
  { offset: 22, name: 'Filter EG Int', range: 63,  expected: 64 },
  { offset: 23, name: 'Filter Velocity', range: 63, expected: 64 },
  { offset: 24, name: 'Filter KBD Track', range: 63, expected: 64 },
  { offset: 26, name: 'AMP Pan',       range: 63,  expected: 64 },
  { offset: 28, name: 'AMP Velocity',  range: 63,  expected: 64 },
  { offset: 29, name: 'AMP KBD Track', range: 63,  expected: 64 },
  { offset: 74, name: 'Transpose (real)', range: 24, expected: 52 }, // Special: -12 default
];

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

console.log('=== SIGNED PARAMETER AUDIT (First Patch) ===\n');

const patch = raw.slice(0, 254);
const t1 = 38;

let issues = [];
signedParams.forEach(p => {
  const byteIndex = t1 + p.offset;
  const value = patch[byteIndex];
  const status = value === p.expected ? '✅' : '❌';
  
  console.log(`${status} Byte ${byteIndex} (T1+${p.offset}): ${p.name.padEnd(20)} = 0x${value.toString(16).padStart(2, '0')} (expected 0x${p.expected.toString(16).padStart(2, '0')})`);
  
  if (value !== p.expected) {
    issues.push(`${p.name} (byte ${byteIndex}): got 0x${value.toString(16).padStart(2, '0')}, expected 0x${p.expected.toString(16).padStart(2, '0')}`);
  }
});

if (issues.length > 0) {
  console.log('\n⚠️  ISSUES FOUND:');
  issues.forEach(i => console.log('  - ' + i));
} else {
  console.log('\n✅ All signed parameters have correct defaults!');
}
