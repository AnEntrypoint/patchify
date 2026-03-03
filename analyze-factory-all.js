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

const files = {
  'factory-all.syx': fs.readFileSync('factory-all.syx'),
  'factory-prg.syx': fs.readFileSync('factory-prg.syx'),
  'factory-global.syx': fs.readFileSync('factory-global.syx'),
  'factory-patches.syx': fs.readFileSync('factory-patches.syx'),
};

console.log('=== FILE SIZES (ENCODED) ===');
for (const [name, data] of Object.entries(files)) {
  const encoded = data.slice(8, -1);
  console.log(`${name.padEnd(25)} ${data.length.toString().padStart(6)} bytes (${encoded.length} encoded)`);
}

console.log('\n=== DECODED SIZES ===');
const decoded = {};
for (const [name, data] of Object.entries(files)) {
  const encoded = data.slice(8, -1);
  const raw = decode7bit(encoded);
  decoded[name] = raw;
  console.log(`${name.padEnd(25)} ${raw.length.toString().padStart(6)} bytes`);
}

// Check relationship between files
console.log('\n=== COMBINING FILES ===');
const prg = decoded['factory-prg.syx'];
const glob = decoded['factory-global.syx'];
const all = decoded['factory-all.syx'];

console.log(`PRG + GLOBAL = ${prg.length + glob.length}`);
console.log(`factory-all = ${all.length}`);
console.log(`Difference: ${all.length - (prg.length + glob.length)}`);

// Check if factory-all is prg + global concatenated
const combined = Buffer.concat([prg, glob]);
if (all.equals(combined)) {
  console.log(`✓ factory-all IS factory-prg + factory-global concatenated`);
} else {
  console.log(`✗ factory-all is NOT simple concatenation`);
  // Check if they're just in different order
  const combined2 = Buffer.concat([glob, prg]);
  if (all.equals(combined2)) {
    console.log(`  (but factory-all IS global + prg)`);
  } else {
    console.log(`  Content doesn't match in any order`);
  }
}

// Now let's understand factory-patches.syx
console.log('\n\n=== FACTORY-PATCHES RELATIONSHIP ===');
const patches = decoded['factory-patches.syx'];
console.log(`factory-patches: ${patches.length} bytes`);

// Check first 128 patches of factory-patches
const half1 = patches.slice(0, 128 * 254);
const half2 = patches.slice(128 * 254, 256 * 254);

console.log(`First 128 patches (0-127): ${half1.length} bytes`);
console.log(`Next 128 patches (128-255): ${half2.length} bytes`);
console.log(`Remaining data: ${patches.length - 256 * 254} bytes`);

// Does half1 match factory-prg first half?
if (half1.equals(prg.slice(0, 128 * 254))) {
  console.log(`✓ factory-patches[0-127] matches factory-prg[0-127]`);
} else {
  console.log(`✗ factory-patches[0-127] does NOT match factory-prg[0-127]`);
}

// Does half2 match something?
console.log(`\nAnalyzing second half of factory-patches...`);
console.log(`Patches 128-131 names:`);
for (let i = 128; i <= 131; i++) {
  const patch = patches.slice(i * 254, (i + 1) * 254);
  const name = patch.slice(0, 12).toString('ascii').trim();
  console.log(`  Patch ${i}: "${name}"`);
}

console.log(`\nDoes factory-patches[128-255] match factory-prg[128-255]?`);
if (half2.equals(prg.slice(128 * 254))) {
  console.log(`✓ MATCH`);
} else {
  console.log(`✗ NO MATCH`);
  // Compare first bytes
  const h2first = half2.slice(0, 50).toString('hex');
  const prgSecond = prg.slice(128 * 254, 128 * 254 + 50).toString('hex');
  console.log(`  Second half first 50 bytes: ${h2first}`);
  console.log(`  PRG[128] first 50 bytes:    ${prgSecond}`);
}

// Check the extra bytes
console.log(`\n\n=== EXTRA BYTES ===`);
const extra = patches.slice(256 * 254);
console.log(`Extra bytes at end: ${extra.length}`);
if (extra.length > 0) {
  console.log(`First 50 extra bytes: ${extra.slice(0, 50).toString('hex')}`);
}

// Hypothesis: factory-patches is factory-prg with extra init/global data appended
console.log(`\n\n=== HYPOTHESIS TEST ===`);
console.log(`Does factory-patches start with factory-prg?`);
if (patches.slice(0, prg.length).equals(prg)) {
  console.log(`✓ factory-patches contains factory-prg as first ${prg.length} bytes`);
  console.log(`Remaining: ${patches.length - prg.length} bytes`);
} else {
  console.log(`✗ No match`);
}
