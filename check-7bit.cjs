const fs = require('fs');

const factory = fs.readFileSync('FactoryBackUpDoResetAfter.syx');

// Check for bytes > 127 (invalid in 7-bit SysEx)
let invalidCount = 0;
for (let i = 5; i < factory.length - 1; i++) {
  if (factory[i] > 127) {
    invalidCount++;
    if (invalidCount <= 5) {
      console.log(`Invalid byte at ${i}: 0x${factory[i].toString(16).toUpperCase()}`);
    }
  }
}

console.log(`Factory backup invalid bytes (>127): ${invalidCount}`);
if (invalidCount === 0) {
  console.log('✅ Factory uses proper 7-bit encoding!\n');
} else {
  console.log('❌ Factory has invalid bytes\n');
}

// Check our custom library
const custom = fs.readFileSync('patches/custom-library-2026-03-01.syx');

invalidCount = 0;
let firstInvalid = -1;
for (let i = 5; i < custom.length - 1; i++) {
  if (custom[i] > 127) {
    if (firstInvalid === -1) firstInvalid = i;
    invalidCount++;
  }
}

console.log('Custom library:');
console.log(`Invalid bytes (>127): ${invalidCount}`);
if (firstInvalid !== -1) {
  console.log(`First invalid at: byte ${firstInvalid} (0x${custom[firstInvalid].toString(16).toUpperCase()})`);
  console.log(`Offset in data: ${firstInvalid - 5}`);
}
