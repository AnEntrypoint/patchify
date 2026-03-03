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
const ip = decode7bit(fs.readFileSync('initpatch.syx').slice(8, -1));

const patchSize = 254;

console.log('=== INIT PATCH ANALYSIS ===\n');

// What does initpatch.syx contain?
console.log('initpatch.syx:');
console.log(`  Total decoded: ${ip.length} bytes`);
console.log(`  This is ${ip.length / patchSize} patches (incomplete, only ${ip.length} bytes)`);
console.log(`  First 50 bytes: ${ip.slice(0, 50).toString('hex')}`);

// Compare initpatch to factory-prg patch 0
console.log(`\nfactory-prg patch 0 (first 50 bytes):`);
console.log(`  ${fprg.slice(0, 50).toString('hex')}`);

// Check if initpatch matches the start of a full patch from factory-prg
console.log(`\n\nSearching for initpatch content in factory-prg...`);
for (let i = 0; i < fprg.length - ip.length; i++) {
  if (fprg.slice(i, i + ip.length).equals(ip)) {
    console.log(`MATCH found at offset ${i} (patch ${i / patchSize}, byte ${i % patchSize})`);
  }
}

// Check if the bytes match at the START of patch 128 in factory-patches
console.log(`\n\nComparing initpatch to factory-patches patch 128:`);
const patch128 = fpatches.slice(128 * patchSize, 129 * patchSize);
console.log(`factory-patches[128] first 50 bytes: ${patch128.slice(0, 50).toString('hex')}`);
console.log(`initpatch first 50 bytes:           ${ip.slice(0, 50).toString('hex')}`);
console.log(`Match: ${patch128.slice(0, ip.length).equals(ip)}`);

// Maybe initpatch is JUST the data section without name?
// Try skipping first 12 bytes (name)
console.log(`\n\nTrying without first 12 bytes (name field):`);
const patch128Data = patch128.slice(12);
const ipData = ip.slice(12);
console.log(`factory-patches[128] bytes 12+: ${patch128Data.slice(0, 40).toString('hex')}`);
console.log(`initpatch bytes 12+:            ${ipData.slice(0, 40).toString('hex')}`);
console.log(`Match: ${patch128Data.slice(0, Math.min(ipData.length, patch128Data.length)).equals(ipData.slice(0, Math.min(ipData.length, patch128Data.length)))}`);

// What's the byte structure of initpatch?
console.log(`\n\n=== INITPATCH BYTE STRUCTURE ===`);
console.log(`Total length: ${ip.length} bytes`);
console.log(`Interpretation 1: Complete but short patch (${ip.length / 254} patches)`);
console.log(`Interpretation 2: Just global parameters (first ${ip.length} bytes)`);
console.log(`Interpretation 3: Missing 1 byte (253 bytes = 254 - 1)`);

// Let's check the PDF specifications if they mention init patch structure
console.log(`\n\n=== WHAT DOES INITPATCH CONTAIN? ===`);
// Show byte-by-byte meaning
if (ip.length >= 40) {
  console.log(`Bytes 0-11 (name):   "${ip.slice(0, 12).toString('ascii')}"`);
  console.log(`Byte 16 (VOICE_MODE): 0x${ip[16].toString(16).padStart(2,'0')}`);
  console.log(`Byte 25 (MOD_TYPE):   0x${ip[25].toString(16).padStart(2,'0')}`);
  console.log(`Byte 37 (KBD_OCTAVE): 0x${ip[37].toString(16).padStart(2,'0')}`);
}

// Let's look at what SHOULD be a factory init patch
// Maybe check factory-prg for all-spaces names?
console.log(`\n\n=== FACTORY-PRG PATCHES WITH BLANK NAMES ===`);
let blankCount = 0;
for (let i = 0; i < fprg.length / patchSize; i++) {
  const patch = fprg.slice(i * patchSize, (i + 1) * patchSize);
  const name = patch.slice(0, 12);
  // Check if all bytes are spaces or 0x00
  const isBlank = [...name].every(b => b === 0x20 || b === 0x00);
  if (isBlank) {
    blankCount++;
    if (blankCount <= 5) {
      console.log(`Patch ${i}: blank name, first 50 bytes: ${patch.slice(0, 50).toString('hex')}`);
    }
  }
}
console.log(`Total blank-name patches in factory-prg: ${blankCount}`);
