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

// Factory patches
const factoryData = fs.readFileSync('factory-patches.syx');
const factoryEncoded = factoryData.slice(7, factoryData.length - 1);
const factoryRaw = decode7bit(factoryEncoded);
const factoryPatch0 = factoryRaw.slice(0, 254);

// Our patches
const ourData = fs.readFileSync('patches/custom-library-2026-03-02.syx');
const ourEncoded = ourData.slice(7, ourData.length - 1);
const ourRaw = decode7bit(ourEncoded);
const ourPatch0 = ourRaw.slice(0, 254);

console.log('=== COMPARING PATCH 0 (A1) ===\n');
console.log('Factory: ' + factoryPatch0.slice(0, 12).toString('ascii').trim());
console.log('Ours:    ' + ourPatch0.slice(0, 12).toString('ascii').trim());

console.log('\n=== GLOBAL PARAMS (Bytes 0-37) ===\n');

const globalBytes = [
  { byte: 16, name: 'VOICE_MODE' },
  { byte: 19, name: 'DELAY_SYNC_BASE' },
  { byte: 20, name: 'DELAY_TIME' },
  { byte: 21, name: 'DELAY_DEPTH' },
  { byte: 22, name: 'DELAY_TYPE' },
  { byte: 23, name: 'MOD_RATE' },
  { byte: 24, name: 'MOD_DEPTH' },
  { byte: 25, name: 'MOD_TYPE' },
  { byte: 26, name: 'EQ_HI_FREQ' },
  { byte: 27, name: 'EQ_HI_GAIN' },
  { byte: 28, name: 'EQ_LOW_FREQ' },
  { byte: 29, name: 'EQ_LOW_GAIN' },
  { byte: 30, name: 'ARP_TEMPO_MSB' },
  { byte: 31, name: 'ARP_TEMPO_LSB' },
  { byte: 32, name: 'ARP_FLAGS' },
  { byte: 37, name: 'KBD_OCTAVE' },
];

globalBytes.forEach(({byte, name}) => {
  const fVal = factoryPatch0[byte];
  const oVal = ourPatch0[byte];
  const match = fVal === oVal ? '✅' : '❌';
  console.log(`${match} Byte ${byte.toString().padStart(2)} (${name.padEnd(15)}): Factory=0x${fVal.toString(16).padStart(2,'0')} Ours=0x${oVal.toString(16).padStart(2,'0')}`);
});

console.log('\n=== TIMBRE 1 FILTER/MOD PARAMS (Bytes 38+) ===\n');

const timbreBytes = [
  { offset: 6, name: 'Vibrato Intensity' },
  { offset: 19, name: 'Filter Type' },
  { offset: 20, name: 'Filter Cutoff' },
  { offset: 21, name: 'Filter Resonance' },
  { offset: 22, name: 'Filter EG Int' },
];

timbreBytes.forEach(({offset, name}) => {
  const byte = 38 + offset;
  const fVal = factoryPatch0[byte];
  const oVal = ourPatch0[byte];
  const match = fVal === oVal ? '✅' : '❌';
  console.log(`${match} Byte ${byte.toString().padStart(3)} (T1+${offset.toString().padStart(2)}, ${name.padEnd(20)}): Factory=0x${fVal.toString(16).padStart(2,'0')} Ours=0x${oVal.toString(16).padStart(2,'0')}`);
});
