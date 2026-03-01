const fs = require('fs');

const custom = fs.readFileSync('patches/custom-library-2026-03-01.syx');

console.log('Custom library invalid bytes (> 127):\n');

const invalidBytes = [];
for (let i = 5; i < custom.length - 1; i++) {
  if (custom[i] > 127) {
    invalidBytes.push({ offset: i, value: custom[i], hex: '0x' + custom[i].toString(16).toUpperCase() });
  }
}

invalidBytes.forEach(b => {
  const patchOffset = b.offset - 5;
  const patchNum = Math.floor(patchOffset / 254);
  const paramOffset = patchOffset % 254;
  console.log(`Byte ${b.offset}: ${b.hex} (${b.value}) - Patch ${patchNum}, param offset ${paramOffset}`);
});

console.log(`\nTotal invalid: ${invalidBytes.length} bytes`);

// The issue is likely that we're using raw JS numbers that weren't clamped to 0-127
console.log('\nThese values should be 0-127. Check if patch configs have invalid parameter values.');
