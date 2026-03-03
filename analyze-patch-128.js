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

const fpatches = decode7bit(fs.readFileSync('factory-patches.syx').slice(8, -1));
const fprg = decode7bit(fs.readFileSync('factory-prg.syx').slice(8, -1));

const patchSize = 254;

console.log('=== COMPARING FACTORY-PATCHES TO FACTORY-PRG ===\n');

// Check if the first 128 patches of factory-patches match first 128 of factory-prg
console.log('Patches 0-3 of factory-patches vs factory-prg:');
for (let i = 0; i < 4; i++) {
  const fpatch = fpatches.slice(i * patchSize, (i + 1) * patchSize);
  const pprg = fprg.slice(i * patchSize, (i + 1) * patchSize);
  const fpName = fpatch.slice(0, 12).toString('ascii').trim();
  const prgName = pprg.slice(0, 12).toString('ascii').trim();
  const match = fpatch.equals(pprg);
  console.log(`  Patch ${i}: "${fpName}" vs "${prgName}" - ${match ? 'MATCH' : 'DIFFER'}`);
}

console.log('\nPatches 125-130 of factory-patches:');
for (let i = 125; i <= 130; i++) {
  const patch = fpatches.slice(i * patchSize, (i + 1) * patchSize);
  const name = patch.slice(0, 12).toString('ascii').trim();
  const byte25 = patch[25];
  const byte37 = patch[37];
  console.log(`  Patch ${i}: "${name}" B25=0x${byte25.toString(16).padStart(2,'0')} B37=0x${byte37.toString(16).padStart(2,'0')}`);
}

// Check which patches in factory-patches have unusual names (might be init)
console.log('\n\n=== LOOKING FOR PATTERN BREAKS ===');
let previousWasNormal = true;
for (let i = 0; i < fpatches.length / patchSize; i++) {
  const patch = fpatches.slice(i * patchSize, (i + 1) * patchSize);
  const name = patch.slice(0, 12).toString('ascii').trim();
  const isNormal = name.length > 0 && name !== name.match(/^\s*$/); // Not all spaces

  if (previousWasNormal && !isNormal) {
    console.log(`TRANSITION at patch ${i}: last normal -> blanks`);
    // Show context
    for (let j = Math.max(0, i - 2); j <= Math.min(256.8, i + 2); j++) {
      const p = fpatches.slice(j * patchSize, (j + 1) * patchSize);
      const n = p.slice(0, 12).toString('ascii').trim();
      console.log(`  Patch ${j}: "${n}"`);
    }
  }
  previousWasNormal = isNormal;
}

// Let's look at byte patterns around patch 128
console.log('\n\n=== BYTE ANALYSIS AROUND PATCH 128 ===');
for (let i = 127; i <= 129; i++) {
  const patch = fpatches.slice(i * patchSize, (i + 1) * patchSize);
  const name = patch.slice(0, 12).toString('ascii').trim();
  console.log(`\nPatch ${i}: "${name}"`);
  console.log(`  Bytes 0-20:   ${patch.slice(0, 20).toString('hex')}`);
  console.log(`  Bytes 20-40:  ${patch.slice(20, 40).toString('hex')}`);
  console.log(`  Byte 25 (MOD_TYPE):  0x${patch[25].toString(16).padStart(2,'0')}`);
  console.log(`  Byte 37 (KBD_OCTAVE): 0x${patch[37].toString(16).padStart(2,'0')}`);
  console.log(`  Byte 44 (Vibrato):    0x${patch[44].toString(16).padStart(2,'0')}`);
}

// Extract what's at the exact halfway point
console.log('\n\n=== EXACT HALFWAY (65231 / 2 = 32615.5) ===');
const halfway = Math.floor(fpatches.length / 2);
console.log(`Total decoded bytes: ${fpatches.length}`);
console.log(`Halfway byte: ${halfway}`);
const patchIdx = Math.floor(halfway / patchSize);
const offsetInPatch = halfway % patchSize;
console.log(`This is in patch ${patchIdx}, byte ${offsetInPatch} of that patch`);
console.log(`Context: bytes ${halfway - 10} to ${halfway + 10}:`);
console.log(fpatches.slice(halfway - 10, halfway + 10).toString('hex'));
