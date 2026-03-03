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
      if (msb & (1 << (6 - j))) byte |= 0x80;
      decoded.push(byte);
    }
    i += chunkSize;
  }
  return Buffer.from(decoded);
}

const patches = decode7bit(fs.readFileSync('factory-patches.syx').slice(8, -1));
const patchSize = 254;

// Known factory defaults from memory
const FACTORY_DEFAULTS = {
  MOD_TYPE: 0x01,        // Byte 25
  KBD_OCTAVE: 0x7F,      // Byte 37
  VIBRATO: 0x41,         // Byte 44 (T1+6)
  FILTER_TYPE: 0x01,     // Byte 57 (T1+19)
};

console.log('=== CHECKING FOR FACTORY DEFAULT PATTERNS ===\n');

// Check how many patches in second half (128-255) have the factory defaults
console.log('Patches 128-255 (second half) - checking for factory defaults:');

let countWithDefaults = 0;
let countWithAllDefaults = 0;

for (let i = 128; i < 256; i++) {
  const patch = patches.slice(i * patchSize, (i + 1) * patchSize);
  const b25 = patch[25];
  const b37 = patch[37];
  const b44 = patch[44];
  const b57 = patch[57];

  const has25 = b25 === FACTORY_DEFAULTS.MOD_TYPE;
  const has37 = b37 === FACTORY_DEFAULTS.KBD_OCTAVE;
  const has44 = b44 === FACTORY_DEFAULTS.VIBRATO;
  const has57 = b57 === FACTORY_DEFAULTS.FILTER_TYPE;

  if (has25 || has37 || has44 || has57) {
    countWithDefaults++;
  }
  if (has25 && has37 && has44 && has57) {
    countWithAllDefaults++;
    if (i <= 132) {
      const name = patch.slice(0, 12).toString('ascii').trim();
      console.log(`  Patch ${i}: "${name}" - HAS ALL DEFAULTS`);
    }
  }
}

console.log(`\nPatches with at least one factory default: ${countWithDefaults} / 128`);
console.log(`Patches with ALL factory defaults: ${countWithAllDefaults} / 128`);

// Compare to first half
console.log('\n\nPatches 0-127 (first half) - checking for factory defaults:');

let countWithDefaults1 = 0;
let countWithAllDefaults1 = 0;

for (let i = 0; i < 128; i++) {
  const patch = patches.slice(i * patchSize, (i + 1) * patchSize);
  const b25 = patch[25];
  const b37 = patch[37];
  const b44 = patch[44];
  const b57 = patch[57];

  const has25 = b25 === FACTORY_DEFAULTS.MOD_TYPE;
  const has37 = b37 === FACTORY_DEFAULTS.KBD_OCTAVE;
  const has44 = b44 === FACTORY_DEFAULTS.VIBRATO;
  const has57 = b57 === FACTORY_DEFAULTS.FILTER_TYPE;

  if (has25 || has37 || has44 || has57) {
    countWithDefaults1++;
  }
  if (has25 && has37 && has44 && has57) {
    countWithAllDefaults1++;
  }
}

console.log(`Patches with at least one factory default: ${countWithDefaults1} / 128`);
console.log(`Patches with ALL factory defaults: ${countWithAllDefaults1} / 128`);

// Show specific examples
console.log('\n\n=== SPECIFIC EXAMPLES ===');
console.log('\nPatches from second half that have ALL factory defaults:');
let shown = 0;
for (let i = 128; i < 256 && shown < 5; i++) {
  const patch = patches.slice(i * patchSize, (i + 1) * patchSize);
  const b25 = patch[25];
  const b37 = patch[37];
  const b44 = patch[44];
  const b57 = patch[57];

  if (b25 === 0x01 && b37 === 0x7F && b44 === 0x41 && b57 === 0x01) {
    const name = patch.slice(0, 12).toString('ascii').trim();
    console.log(`  Patch ${i}: "${name}"`);
    console.log(`    B25=0x${b25.toString(16).padStart(2,'0')} B37=0x${b37.toString(16).padStart(2,'0')} B44=0x${b44.toString(16).padStart(2,'0')} B57=0x${b57.toString(16).padStart(2,'0')}`);
    shown++;
  }
}

// Check the 207 extra bytes
console.log('\n\n=== EXTRA 207 BYTES ANALYSIS ===');
const extra = patches.slice(256 * patchSize);
console.log(`Total extra bytes: ${extra.length}`);

// Treat extra as potential patch data
if (extra.length >= 254) {
  console.log(`Might be a partial patch...`);
  const b25 = extra[25];
  const b37 = extra[37];
  const b44 = extra[44];
  const b57 = extra[57];
  console.log(`Extra bytes at key positions:`);
  console.log(`  B25: 0x${b25.toString(16).padStart(2,'0')}`);
  console.log(`  B37: 0x${b37.toString(16).padStart(2,'0')}`);
  console.log(`  B44: 0x${b44.toString(16).padStart(2,'0')}`);
  console.log(`  B57: 0x${b57.toString(16).padStart(2,'0')}`);
}

// Check if extra bytes look like factory defaults
console.log(`\nExtra bytes interpretation:`);
console.log(`  Byte 4: 0x${extra[4].toString(16).padStart(2,'0')} (might be parameter)`);
console.log(`  Byte 5: 0x${extra[5].toString(16).padStart(2,'0')} (might be MOD_TYPE? Should be 0x01)`);
console.log(`  Byte 6: 0x${extra[6].toString(16).padStart(2,'0')} (might be KBD_OCTAVE? Should be 0x7F)`);
