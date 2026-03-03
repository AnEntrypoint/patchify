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

const data = fs.readFileSync('./patches/init-patches-test.syx');
const encoded = data.slice(7, data.length - 1);
const raw = decode7bit(encoded);

console.log('INIT PATCH VERIFICATION:');
console.log(`File size: ${data.length} bytes`);
console.log(`Raw decoded: ${raw.length} bytes\n`);

// Check patches 0, 64, 128, 192 (first of each bank)
const checks = [
  { idx: 0, bank: 'A', name: 'Init A1' },
  { idx: 64, bank: 'B', name: 'Init B1' },
  { idx: 128, bank: 'C', name: 'Init C1' },
  { idx: 192, bank: 'D', name: 'Init D1' }
];

let allCorrect = true;
checks.forEach(({idx, bank, name}) => {
  const patchStart = idx * 254;
  const patchEnd = patchStart + 254;
  if (patchEnd > raw.length) {
    console.log(`❌ Bank ${bank}: OUT OF BOUNDS`);
    allCorrect = false;
    return;
  }

  const patch = raw.slice(patchStart, patchEnd);
  const patchName = patch.slice(0, 12).toString('ascii').trim();

  const b25 = patch[25];
  const b37 = patch[37];
  const b44 = patch[44];
  const b57 = patch[57];

  const b25OK = b25 === 0x01;
  const b37OK = b37 === 0x7F;
  const b44OK = b44 === 0x41;
  const b57OK = b57 === 0x01;

  const status = (b25OK && b37OK && b44OK && b57OK) ? '✅' : '❌';

  console.log(`${status} Bank ${bank} [${idx}]: '${patchName}'`);
  console.log(`   B25 (MOD_TYPE):   0x${b25.toString(16).padStart(2,'0')} ${b25OK ? '✓' : '✗ expect 0x01'}`);
  console.log(`   B37 (KBD_OCTAVE): 0x${b37.toString(16).padStart(2,'0')} ${b37OK ? '✓' : '✗ expect 0x7F'}`);
  console.log(`   B44 (Vibrato):    0x${b44.toString(16).padStart(2,'0')} ${b44OK ? '✓' : '✗ expect 0x41'}`);
  console.log(`   B57 (FilterType): 0x${b57.toString(16).padStart(2,'0')} ${b57OK ? '✓' : '✗ expect 0x01'}`);
  console.log();

  if (!b25OK || !b37OK || !b44OK || !b57OK) allCorrect = false;
});

if (allCorrect) {
  console.log('✅ ALL CHECKS PASSED - Init patches are correct!');
} else {
  console.log('❌ SOME CHECKS FAILED - Fix issues above');
}
