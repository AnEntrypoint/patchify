#!/usr/bin/env node

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
      if (msb & (1 << (6 - j))) {
        byte |= 0x80;
      }
      decoded.push(byte);
    }
    i += chunkSize;
  }
  return Buffer.from(decoded);
}

const factoryData = fs.readFileSync('factory-patches.syx');
const factoryEncoded = factoryData.slice(7, factoryData.length - 1);
const factoryRaw = decode7bit(factoryEncoded);

console.log('=== ANALYZING FACTORY PATCH STRUCTURE ===\n');

// Check first 10 patches to see if there's a pattern
console.log('Checking first 10 factory patches (bytes 0-37 only)\n');

for (let p = 0; p < 10; p++) {
  const patch = factoryRaw.slice(p * 254, (p + 1) * 254);
  const name = patch.slice(0, 12).toString('ascii');
  
  // Count unique values in global section (bytes 14-37)
  const globalSection = patch.slice(14, 38);
  const unique = new Set(globalSection);
  
  console.log(`Patch ${p}: "${name}" → Global bytes have ${unique.size} unique values`);
  
  // Show the actual bytes
  let bytesStr = '';
  for (let i = 0; i < globalSection.length; i++) {
    const val = globalSection[i];
    bytesStr += val.toString(16).padStart(2, '0') + ' ';
  }
  console.log(`  ${bytesStr}\n`);
}

// Try to find the actual patch name location
const patch0 = factoryRaw.slice(0, 254);
console.log('=== SEARCHING FOR PATCH NAME ===\n');
console.log('Bytes 0-12 (expected name):');
for (let i = 0; i < 12; i++) {
  const b = patch0[i];
  const c = String.fromCharCode(b);
  console.log(`  [${i}] = 0x${b.toString(16).padStart(2,'0')} (${b.toString().padStart(3)}) = '${c}'`);
}

// Look for printable ASCII
console.log('\nSearching for printable ASCII in first 100 bytes:');
let found = false;
for (let i = 0; i < 100; i++) {
  const b = patch0[i];
  if (b >= 32 && b < 127) {
    if (!found) console.log(`Byte ${i}: '${String.fromCharCode(b)}'`);
    found = true;
  } else if (found) {
    found = false;
  }
}
