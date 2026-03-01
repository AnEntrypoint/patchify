const fs = require('fs');

const factory = fs.readFileSync('FactoryBackUpDoResetAfter.syx');

// Look at first few bytes of patch data
console.log('Factory backup first patch analysis:\n');

// Skip header (5 bytes)
const patchStart = 5;
const patchEnd = patchStart + 254;

const patchData = factory.slice(patchStart, patchEnd);

console.log('First 50 bytes of patch data:');
console.log('Hex:', Array.from(patchData.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Dec:', Array.from(patchData.slice(0, 50)).map(b => b.toString().padStart(3, ' ')).join(' '));

// Look for pattern - find any byte > 127
console.log('\n\nSearching for bytes > 127 in entire factory file:');
let found = false;
for (let i = 0; i < factory.length; i++) {
  if (factory[i] > 127) {
    found = true;
    console.log(`Byte at ${i}: 0x${factory[i].toString(16).toUpperCase()} = ${factory[i]}`);
  }
}

if (!found) {
  console.log('✅ No bytes > 127 found - using pure 7-bit encoding');
}

console.log('\n\nFactory file stats:');
console.log(`Total size: ${factory.length}`);
console.log(`Header: 5 bytes (F0 42 30 58 4C)`);
console.log(`Body: ${factory.length - 6} bytes`);
console.log(`End marker: F7`);

// If using 7-bit encoding:
// Original data: 254 bytes per patch × 128 patches = 32,512 bytes
// With 7-bit: Each 8 bytes → ~7 bytes, so 32,512 × (7/8) = 28,448 bytes
// But we see 36,414 bytes in body, which is more than original + system data
// This suggests maybe different encoding or format

console.log('\n\nSize analysis:');
console.log('128 patches × 254 bytes = 32,512 bytes');
console.log(`Actual body in factory: ${factory.length - 6} bytes`);
console.log(`Difference: ${factory.length - 6 - 32512} bytes`);

// Maybe the system data is also there unencoded?
console.log('\nMaybe some data is unencoded. Let\'s check.');
