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

const fp = fs.readFileSync('factory-patches.syx');
const ip = fs.readFileSync('initpatch.syx');

// Extract encoded data (skip F0 header F7)
const fpEncoded = fp.slice(8, -1);
const ipEncoded = ip.slice(8, -1);

console.log('Decoding factory-patches.syx...');
const fpRaw = decode7bit(fpEncoded);
console.log(`  Encoded: ${fpEncoded.length} bytes`);
console.log(`  Decoded: ${fpRaw.length} bytes`);

console.log(`\nDecoding initpatch.syx...`);
const ipRaw = decode7bit(ipEncoded);
console.log(`  Encoded: ${ipEncoded.length} bytes`);
console.log(`  Decoded: ${ipRaw.length} bytes`);

// Calculate patch positions
console.log(`\n\n=== PATCH ANALYSIS ===`);
console.log(`Factory raw: ${fpRaw.length} bytes = ${fpRaw.length / 254} patches`);
console.log(`Init raw: ${ipRaw.length} bytes = ${ipRaw.length / 254} patches`);

// Check if factory raw contains init data
console.log(`\n\nSearching for init patch in factory patches...`);
const patchSize = 254;
const halfway = Math.floor(fpRaw.length / 2 / patchSize) * patchSize; // Round down to patch boundary
console.log(`Halfway (rounded to patch): byte ${halfway}`);

const halfwayPatch = fpRaw.slice(halfway, halfway + patchSize);
const initPatch = ipRaw.slice(0, patchSize);

console.log(`\nPatch at halfway of factory (patches[${halfway/patchSize}]):`);
console.log(`  Name: "${halfwayPatch.slice(0, 12).toString('ascii').trim()}"`);
console.log(`  First 20 bytes: ${halfwayPatch.slice(0, 20).toString('hex')}`);

console.log(`\nInit patch (first patch of initpatch.syx):`);
console.log(`  Name: "${initPatch.slice(0, 12).toString('ascii').trim()}"`);
console.log(`  First 20 bytes: ${initPatch.slice(0, 20).toString('hex')}`);

console.log(`\nDo they match? ${halfwayPatch.equals(initPatch)}`);

// Check first and last patches of each
console.log(`\n\n=== FIRST AND LAST PATCHES ===`);
const first = fpRaw.slice(0, patchSize);
const last = fpRaw.slice(fpRaw.length - patchSize);

console.log(`First patch of factory-patches:`);
console.log(`  Name: "${first.slice(0, 12).toString('ascii').trim()}"`);

console.log(`Last patch of factory-patches:`);
console.log(`  Name: "${last.slice(0, 12).toString('ascii').trim()}"`);

// Scan all patch names in factory
console.log(`\n\n=== ALL PATCH NAMES IN FACTORY-PATCHES ===`);
for (let i = 0; i < fpRaw.length; i += patchSize) {
  const patch = fpRaw.slice(i, i + patchSize);
  const name = patch.slice(0, 12).toString('ascii').trim();
  const idx = i / patchSize;
  if (idx % 64 === 0) {
    console.log(`Patch ${idx}: "${name}"`);
  }
}
