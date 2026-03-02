#!/usr/bin/env node

/**
 * Create test patches to determine which transpose byte is correct
 */

const fs = require('fs');

const PATCH_SIZE = 254;

// Test 1: Set only T1+5 (byte 43)
function createPatchTestT1plus5() {
  const patch = new Uint8Array(PATCH_SIZE);
  patch.fill(0x40);
  
  const name = 'TEST-T1+5     ';
  const nameBytes = Buffer.from(name.slice(0, 12), 'ascii');
  for (let i = 0; i < 12; i++) patch[i] = nameBytes[i];
  
  const tb = 38;
  patch[16] = 0;              // Single voice
  patch[37] = 0;              // KBD octave = 0
  patch[tb + 0]  = 0x7F;      // MIDI channel
  patch[tb + 1]  = 0b01000000; // Poly
  patch[tb + 5]  = 52;        // T1+5 = 52 (-12) ← TESTING THIS
  patch[tb + 6]  = 0x40;      // Vibrato off
  patch[tb + 7]  = 3;         // OSC1 = Sine
  patch[tb + 16] = 120;       // OSC1 Level
  patch[tb + 20] = 80;        // Filter Cutoff
  patch[tb + 25] = 120;       // AMP Level
  patch[tb + 74] = 64;        // T1+74 = 64 (0) ← NOT setting this
  
  return patch;
}

// Test 2: Set only T1+74 (byte 112)
function createPatchTestT1plus74() {
  const patch = new Uint8Array(PATCH_SIZE);
  patch.fill(0x40);
  
  const name = 'TEST-T1+74    ';
  const nameBytes = Buffer.from(name.slice(0, 12), 'ascii');
  for (let i = 0; i < 12; i++) patch[i] = nameBytes[i];
  
  const tb = 38;
  patch[16] = 0;              // Single voice
  patch[37] = 0;              // KBD octave = 0
  patch[tb + 0]  = 0x7F;      // MIDI channel
  patch[tb + 1]  = 0b01000000; // Poly
  patch[tb + 5]  = 64;        // T1+5 = 64 (0) ← NOT setting this
  patch[tb + 6]  = 0x40;      // Vibrato off
  patch[tb + 7]  = 3;         // OSC1 = Sine
  patch[tb + 16] = 120;       // OSC1 Level
  patch[tb + 20] = 80;        // Filter Cutoff
  patch[tb + 25] = 120;       // AMP Level
  patch[tb + 74] = 52;        // T1+74 = 52 (-12) ← TESTING THIS
  
  return patch;
}

function encode7bit(raw) {
  const out = [];
  for (let i = 0; i < raw.length; i += 7) {
    let msb = 0;
    const chunk = raw.slice(i, Math.min(i + 7, raw.length));
    for (let j = 0; j < chunk.length; j++) {
      msb |= ((chunk[j] >> 7) & 1) << (6 - j);
    }
    out.push(msb);
    for (let j = 0; j < chunk.length; j++) {
      out.push(chunk[j] & 0x7F);
    }
  }
  return Buffer.from(out);
}

// Create files with test patches in first 2 slots
const allRaw1 = Buffer.alloc(256 * PATCH_SIZE);
const patch1 = createPatchTestT1plus5();
const patch2 = createPatchTestT1plus74();
allRaw1.set(patch1, 0);
allRaw1.set(patch2, 254);
for (let i = 2; i < 256; i++) {
  allRaw1.set(patch1, i * 254); // Fill rest with T1+5 test
}

const encoded1 = encode7bit(allRaw1);
const header = Buffer.from([0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x50]);
const footer = Buffer.from([0xF7]);
const sysex1 = Buffer.concat([header, encoded1, footer]);

fs.writeFileSync('patches/transpose-test.syx', sysex1);

console.log('✅ Created patches/transpose-test.syx\n');
console.log('A1 (TEST-T1+5):  Sets transpose at byte 43 (T1+5) to -12');
console.log('A2 (TEST-T1+74): Sets transpose at byte 112 (T1+74) to -12\n');
console.log('Instructions:');
console.log('1. Upload this file');
console.log('2. Play A1 - which byte location makes it play 1 octave lower?');
console.log('3. Play A2 - compare');
console.log('4. Report which one(s) work');
