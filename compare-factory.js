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
  'factory-patches.syx': fs.readFileSync('factory-patches.syx'),
  'factory-prg.syx': fs.readFileSync('factory-prg.syx'),
  'factory-global.syx': fs.readFileSync('factory-global.syx'),
};

console.log('Decoding all factory files...\n');

const decoded = {};
for (const [name, data] of Object.entries(files)) {
  const encoded = data.slice(8, -1);
  const raw = decode7bit(encoded);
  decoded[name] = raw;
  console.log(`${name}:`);
  console.log(`  Encoded: ${encoded.length} bytes`);
  console.log(`  Decoded: ${raw.length} bytes`);
  console.log(`  Expected for 256 patches: ${256 * 254} = 65024`);
  console.log(`  Extra bytes: ${raw.length - 65024}`);
}

// Now let's look at the names pattern
console.log(`\n\n=== PATCH NAMES (every 64th patch) ===`);
const patchSize = 254;

for (const [name, raw] of Object.entries(decoded)) {
  console.log(`\n${name}:`);
  for (let i = 0; i < Math.min(raw.length, 256 * patchSize); i += 64 * patchSize) {
    const patch = raw.slice(i, i + patchSize);
    const patchName = patch.slice(0, 12).toString('ascii').trim();
    const idx = i / patchSize;
    console.log(`  Patch ${idx.toString().padStart(3)}: "${patchName}"`);
  }
}

// Check if factory-prg is first 256 patches and factory-global is something else
console.log(`\n\n=== COMPARISON ===`);
const fprg = decoded['factory-prg.syx'];
const fpatches = decoded['factory-patches.syx'];
const fglobal = decoded['factory-global.syx'];

console.log(`factory-patches has ${fpatches.length / patchSize} patches`);
console.log(`factory-prg has ${fprg.length / patchSize} patches`);
console.log(`factory-global has ${fglobal.length / patchSize} patches`);

// Try to find where prg appears in patches
console.log(`\nSearching for factory-prg content in factory-patches...`);
const searchLen = Math.min(fprg.length, fpatches.length - patchSize);
for (let i = 0; i < fpatches.length - searchLen; i++) {
  if (fpatches.slice(i, i + searchLen).equals(fprg.slice(0, searchLen))) {
    console.log(`MATCH found at offset ${i}`);
  }
}

// Check if first half of patches == prg
console.log(`\nDoes first half of factory-patches == factory-prg?`);
console.log(`  factory-patches first 65024 bytes vs factory-prg`);
const firstHalf = fpatches.slice(0, 65024);
console.log(`  factory-prg length: ${fprg.length}`);
console.log(`  Match: ${firstHalf.equals(fprg.slice(0, 65024))}`);

// Check first bytes
console.log(`\nFirst 30 bytes comparison:`);
console.log(`  factory-patches: ${fpatches.slice(0, 30).toString('hex')}`);
console.log(`  factory-prg:     ${fprg.slice(0, 30).toString('hex')}`);
