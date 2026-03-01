const fs = require('fs');

// Compare first patch in factory vs our generated file
const factory = fs.readFileSync('FactoryBackUpDoResetAfter.syx');
const custom = fs.readFileSync('patches/custom-library-2026-03-01.syx');

// After header (5 bytes), first patch starts
const firstPatchStart = 5;
const firstPatchEnd = firstPatchStart + 254;

const factoryFirstPatch = factory.slice(firstPatchStart, firstPatchEnd);
const customFirstPatch = custom.slice(firstPatchStart, firstPatchEnd);

// Extract name (first 16 bytes)
const factoryName = factoryFirstPatch.slice(0, 16).toString().trim();
const customName = customFirstPatch.slice(0, 16).toString().trim();

console.log('🔍 FIRST PATCH COMPARISON:\n');
console.log(`Factory patch name: "${factoryName}"`);
console.log(`Custom patch name:  "${customName}"\n`);

// Show first 32 bytes of each
const factoryHex = Array.from(factoryFirstPatch.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ');
const customHex = Array.from(customFirstPatch.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ');

console.log('First 32 bytes:');
console.log(`Factory: ${factoryHex}`);
console.log(`Custom:  ${customHex}\n`);

// Check if they're actually different
const isDifferent = !factoryFirstPatch.equals(customFirstPatch);
console.log(isDifferent ? '✅ Patches are different (good!)' : '❌ Patches are THE SAME (bad!)');
