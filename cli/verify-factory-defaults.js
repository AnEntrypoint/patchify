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

console.log('=== FACTORY DEFAULTS VERIFICATION ===\n');

const checks = [
  { byte: 16, expected: 0x40, name: 'VOICE_MODE' },
  { byte: 22, expected: 0x00, name: 'DELAY_TYPE' },
  { byte: 25, expected: 0x01, name: 'MOD_TYPE' },
  { byte: 37, expected: 0x7F, name: 'KBD_OCTAVE' },
  { byte: 44, expected: 0x41, name: 'Vibrato Intensity (T1+6)' },
  { byte: 57, expected: 0x01, name: 'Filter Type (T1+19)' },
];

let allCorrect = true;
checks.forEach(({byte, expected, name}) => {
  const actual = patch[byte];
  const match = actual === expected ? '✅' : '❌';
  console.log(`${match} Byte ${byte.toString().padStart(3)}: ${name.padEnd(25)} = 0x${actual.toString(16).padStart(2,'0')} (expected 0x${expected.toString(16).padStart(2,'0')})`);
  if (actual !== expected) allCorrect = false;
});

console.log(allCorrect ? '\n✅ ALL DEFAULTS CORRECT!' : '\n❌ SOME DEFAULTS WRONG!');
