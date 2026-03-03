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

console.log('=== COMPARING FIRST HALF VS SECOND HALF ===\n');

// For a sample of patches, compare patch[i] with patch[i+128]
const comparisons = [0, 1, 2, 3, 10, 64, 100, 127];

comparisons.forEach(i => {
  const p1 = patches.slice(i * patchSize, (i + 1) * patchSize);
  const p2 = patches.slice((128 + i) * patchSize, (129 + i) * patchSize);

  const name1 = p1.slice(0, 12).toString('ascii').trim();
  const name2 = p2.slice(0, 12).toString('ascii').trim();

  const identical = p1.equals(p2);

  console.log(`Patch ${i} vs Patch ${128 + i}:`);
  console.log(`  Name1: "${name1}" vs Name2: "${name2}"`);
  console.log(`  Identical: ${identical}`);

  // Count how many bytes differ
  let diffCount = 0;
  for (let j = 0; j < patchSize; j++) {
    if (p1[j] !== p2[j]) diffCount++;
  }
  console.log(`  Bytes different: ${diffCount} / ${patchSize}`);

  // Show which sections differ
  if (diffCount > 0 && diffCount < patchSize) {
    const sections = [
      {name: 'Name (0-11)', start: 0, end: 12},
      {name: 'Global (12-37)', start: 12, end: 38},
      {name: 'Timbre1 (38-145)', start: 38, end: 146},
      {name: 'Timbre2 (146-253)', start: 146, end: 254}
    ];

    for (const sec of sections) {
      let secDiff = 0;
      for (let j = sec.start; j < sec.end; j++) {
        if (p1[j] !== p2[j]) secDiff++;
      }
      if (secDiff > 0) {
        const percent = ((secDiff / (sec.end - sec.start)) * 100).toFixed(0);
        console.log(`    ${sec.name}: ${secDiff} different (${percent}%)`);
      }
    }
  }

  console.log();
});

// Analyze the 207 extra bytes
console.log('\n=== EXTRA 207 BYTES AT END ===');
const extra = patches.slice(256 * patchSize);
console.log(`Length: ${extra.length}`);
console.log(`First 100 bytes: ${extra.slice(0, 100).toString('hex')}`);

// Is this 207 bytes = some number of complete data structures?
console.log(`\n207 / 254 = ${(207 / 254).toFixed(2)} (not a whole patch)`);
console.log(`207 / 2 = ${(207 / 2).toFixed(1)}`);
console.log(`207 / 3 = ${(207 / 3).toFixed(1)}`);

// Maybe it's extra parameters for global section?
console.log(`\nMight represent: 207 bytes of global configuration or metadata`);

// Let's look at what these bytes COULD mean
// If first 12 are a header/metadata, then 207-12 = 195 might be time to look at structure
console.log(`\nIf first 12 are metadata, remaining: ${extra.length - 12} bytes`);
console.log(`195 / 254 = ${(195 / 254).toFixed(2)}`);
console.log(`195 / 2 = ${195 / 2}`);

// Look for patterns - check if extra starts with recognizable structure
console.log(`\nFirst 50 extra bytes: ${extra.slice(0, 50).toString('hex')}`);
console.log(`Byte pattern analysis:`);
for (let i = 0; i < Math.min(20, extra.length); i++) {
  console.log(`  Byte ${i}: 0x${extra[i].toString(16).padStart(2,'0')}`);
}

// Compare with factory-prg structure
console.log('\n=== FACTORY-PRG COMPARISON ===');
const fprg = decode7bit(fs.readFileSync('factory-prg.syx').slice(8, -1));
console.log(`factory-prg decoded length: ${fprg.length}`);
console.log(`factory-patches + extra length: ${256 * patchSize + extra.length}`);
console.log(`Difference: ${fprg.length - (256 * patchSize + extra.length)}`);

// Are the extra bytes the first patch of factory-prg?
if (extra.length >= 50) {
  const fprgFirst50 = fprg.slice(0, 50).toString('hex');
  const extraFirst50 = extra.slice(0, 50).toString('hex');
  console.log(`\nDo extra bytes match start of factory-prg[0]?`);
  console.log(`factory-prg[0] first 50: ${fprgFirst50}`);
  console.log(`extra first 50:          ${extraFirst50}`);
  console.log(`Match: ${fprgFirst50 === extraFirst50}`);
}
