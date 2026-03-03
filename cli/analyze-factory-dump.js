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

const data = fs.readFileSync('./factory-patches.syx');
const encoded = data.slice(7, data.length - 1);
const raw = decode7bit(encoded);

console.log('FACTORY DUMP ANALYSIS:');
console.log('Total bytes:', raw.length);
console.log('Expected: 256 × 254 =', 256 * 254);
console.log();

// Check first patch of each bank
const banks = { A: 0, B: 64, C: 128, D: 192 };
Object.entries(banks).forEach(([bank, idx]) => {
  const patchStart = idx * 254;
  const patchEnd = patchStart + 254;
  if (patchEnd > raw.length) {
    console.log(`Bank ${bank}: OUT OF BOUNDS`);
    return;
  }
  const patch = raw.slice(patchStart, patchEnd);
  const name = patch.slice(0, 12).toString('ascii').trim();

  console.log(`Bank ${bank} [0]: '${name}' | B25:0x${patch[25].toString(16).padStart(2,'0')} B37:0x${patch[37].toString(16).padStart(2,'0')} B44:0x${patch[44].toString(16).padStart(2,'0')} B57:0x${patch[57].toString(16).padStart(2,'0')}`);
});

console.log('\nChecking if C and D banks match:');
let match = true;
for (let i = 0; i < 64; i++) {
  const cStart = (128 + i) * 254;
  const dStart = (192 + i) * 254;
  if (dStart + 254 > raw.length) break;

  const patchC = raw.slice(cStart, cStart + 254);
  const patchD = raw.slice(dStart, dStart + 254);

  if (!patchC.equals(patchD)) {
    match = false;
    console.log(`  Patch ${i}: C≠D (MISMATCH)`);
    break;
  }
}
if (match) console.log('✅ All C/D patches match (identical)');
