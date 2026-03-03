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

const fglobal = decode7bit(fs.readFileSync('factory-global.syx').slice(8, -1));
const fprg = decode7bit(fs.readFileSync('factory-prg.syx').slice(8, -1));
const patchSize = 254;

console.log('=== FACTORY-GLOBAL ANALYSIS ===\n');

// Check if all patches in factory-global have factory defaults
const FACTORY_DEFAULTS = {
  MOD_TYPE: 0x01,
  KBD_OCTAVE: 0x7F,
  VIBRATO: 0x41,
  FILTER_TYPE: 0x01,
};

console.log('Checking patches 0-4 of factory-global:\n');

for (let i = 0; i < 5; i++) {
  const patch = fglobal.slice(i * patchSize, (i + 1) * patchSize);
  const name = patch.slice(0, 12).toString('ascii').trim();
  const b16 = patch[16];
  const b25 = patch[25];
  const b37 = patch[37];
  const b44 = patch[44];
  const b57 = patch[57];

  console.log(`Patch ${i}: "${name}"`);
  console.log(`  B16 (VOICE_MODE):  0x${b16.toString(16).padStart(2,'0')}`);
  console.log(`  B25 (MOD_TYPE):     0x${b25.toString(16).padStart(2,'0')}`);
  console.log(`  B37 (KBD_OCTAVE):   0x${b37.toString(16).padStart(2,'0')}`);
  console.log(`  B44 (Vibrato):      0x${b44.toString(16).padStart(2,'0')}`);
  console.log(`  B57 (FilterType):   0x${b57.toString(16).padStart(2,'0')}`);
  console.log(`  First 30 bytes:     ${patch.slice(0, 30).toString('hex')}`);
  console.log();
}

// Compare factory-global[0] with factory-prg[0]
console.log('\n=== COMPARING factory-global[0] vs factory-prg[0] ===');
const gg0 = fglobal.slice(0, patchSize);
const gp0 = fprg.slice(0, patchSize);

console.log(`Both have same name: "${gg0.slice(0, 12).toString('ascii').trim()}" vs "${gp0.slice(0, 12).toString('ascii').trim()}"`);
console.log(`Both have same size: ${gg0.length} vs ${gp0.length}`);
console.log(`Are they identical? ${gg0.equals(gp0)}`);

// Find where they differ
let firstDiff = -1;
for (let i = 0; i < patchSize; i++) {
  if (gg0[i] !== gp0[i]) {
    firstDiff = i;
    break;
  }
}

if (firstDiff >= 0) {
  console.log(`First difference at byte ${firstDiff}`);
  console.log(`  global[${firstDiff}]: 0x${gg0[firstDiff].toString(16).padStart(2,'0')}`);
  console.log(`  prg[${firstDiff}]:    0x${gp0[firstDiff].toString(16).padStart(2,'0')}`);
}

// Check all patches in factory-global for factory defaults
console.log('\n\n=== FACTORY-GLOBAL PATCH ANALYSIS ===');
let withAllDefaults = 0;
let withSomeDefaults = 0;

for (let i = 0; i < 256; i++) {
  const patch = fglobal.slice(i * patchSize, (i + 1) * patchSize);
  const b25 = patch[25];
  const b37 = patch[37];
  const b44 = patch[44];
  const b57 = patch[57];

  const has25 = b25 === 0x01;
  const has37 = b37 === 0x7F;
  const has44 = b44 === 0x41;
  const has57 = b57 === 0x01;

  if (has25 && has37 && has44 && has57) {
    withAllDefaults++;
  }
  if (has25 || has37 || has44 || has57) {
    withSomeDefaults++;
  }
}

console.log(`Patches with ALL factory defaults: ${withAllDefaults} / 256`);
console.log(`Patches with SOME factory defaults: ${withSomeDefaults} / 256`);

// Show a few that have ALL defaults
console.log(`\nExamples of patches with ALL factory defaults:`);
let shown = 0;
for (let i = 0; i < 256 && shown < 5; i++) {
  const patch = fglobal.slice(i * patchSize, (i + 1) * patchSize);
  const b25 = patch[25];
  const b37 = patch[37];
  const b44 = patch[44];
  const b57 = patch[57];

  if (b25 === 0x01 && b37 === 0x7F && b44 === 0x41 && b57 === 0x01) {
    const name = patch.slice(0, 12).toString('ascii').trim();
    console.log(`  Patch ${i}: "${name}"`);
    shown++;
  }
}

// Check the extra bytes of factory-global
console.log('\n\n=== FACTORY-GLOBAL EXTRA BYTES ===');
const extra = fglobal.slice(256 * patchSize);
console.log(`Extra bytes: ${extra.length}`);
if (extra.length > 0) {
  console.log(`First 50: ${extra.slice(0, 50).toString('hex')}`);
}
