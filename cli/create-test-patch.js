#!/usr/bin/env node

/**
 * Create a minimal test patch to diagnose hardware behavior
 * Just one simple sine bass with NO modulation routing
 */

const fs = require('fs');

const PATCH_SIZE = 254;

function createTestPatch() {
  const patch = new Uint8Array(PATCH_SIZE);
  patch.fill(0x40);
  
  // Name
  const name = 'TEST-NO-MOD   ';
  const nameBytes = Buffer.from(name.slice(0, 12), 'ascii');
  for (let i = 0; i < 12; i++) patch[i] = nameBytes[i];
  
  // Global
  patch[16] = 0;    // Single voice
  patch[37] = 0;    // KBD octave = 0
  
  // Timbre 1 (offset 38)
  const tb = 38;
  patch[tb + 0]  = 0x7F;      // MIDI channel
  patch[tb + 1]  = 0b01000000; // Poly
  patch[tb + 3]  = 64;         // Tune = 0
  patch[tb + 4]  = 64;         // Bend = 0
  patch[tb + 5]  = 64;         // Transpose legacy = 0
  patch[tb + 6]  = 0;          // Vibrato = 0
  patch[tb + 7]  = 3;          // OSC1 = Sine
  patch[tb + 16] = 120;        // OSC1 Level = 120
  patch[tb + 20] = 80;         // Filter Cutoff = 80 (open)
  patch[tb + 21] = 0;          // Resonance = 0
  patch[tb + 25] = 120;        // AMP Level = 120
  patch[tb + 74] = 52;         // Transpose byte (52 = -12 semitones)
  
  // NO VP routing - both should stay at defaults from 0x40 fill
  // This lets us test if the defaults are the problem
  
  return patch;
}

function clamp(v, lo = 0, hi = 127) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
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

// Create 256 copies of the same test patch
const allRaw = Buffer.alloc(256 * PATCH_SIZE);
const testPatch = createTestPatch();
for (let i = 0; i < 256; i++) {
  allRaw.set(testPatch, i * PATCH_SIZE);
}

const encoded = encode7bit(allRaw);
const header = Buffer.from([0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x50]);
const footer = Buffer.from([0xF7]);
const sysex = Buffer.concat([header, encoded, footer]);

const outFile = 'patches/test-patch.syx';
fs.writeFileSync(outFile, sysex);

console.log(`✅ Created ${outFile} (${sysex.length} bytes)`);
console.log(`All 256 slots: Simple sine bass, -12 octave, NO modulation\n`);
console.log(`Test this to check if:1. Pitch is correct (-12 octaves)\n2. Mod wheel has NO effect on sound\n3. Every slot plays the same\n`);
