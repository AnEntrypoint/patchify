#!/usr/bin/env node

/**
 * Dump one patch from factory backup to see individual patch format
 */

const fs = require('fs');

const factory = fs.readFileSync('FactoryBackUpDoResetAfter.syx');

// Extract first patch (skip header F0 42 30 58 50, take 254 bytes)
const firstPatchStart = 5;
const firstPatchEnd = firstPatchStart + 254;
const firstPatch = factory.slice(firstPatchStart, firstPatchEnd);

console.log('First patch from factory backup (254 bytes):\n');
console.log('Hex (first 64 bytes):');
console.log(Array.from(firstPatch.slice(0, 64)).map((b, i) => {
  const hex = b.toString(16).padStart(2, '0');
  return (i % 16 === 0 ? '\n' : '') + hex + ' ';
}).join(''));

console.log('\n\nAll 254 bytes in decimal (for visual inspection):');
for (let i = 0; i < 254; i++) {
  if (i % 16 === 0) console.log('\n' + i.toString().padStart(3) + ': ');
  process.stdout.write(firstPatch[i].toString().padStart(3) + ' ');
}

console.log('\n\nThis is the format for ONE patch (254 bytes).');
console.log('To send individual patches, we wrap this in SysEx with appropriate function code.');
console.log('\nFor 256 patches on microKORG S:');
console.log('  - Patch 0: bytes 0-253');
console.log('  - Patch 1: bytes 254-507');
console.log('  - etc.');
