const PATCH_SIZE = 254;

function createBlankPatch() {
  const patch = new Uint8Array(PATCH_SIZE);
  // All bytes default to 0
  return patch;
}

function createTestPatch() {
  const patch = createBlankPatch();
  const name = "Deep Sub";

  console.log(`Input name: "${name}"`);
  console.log(`Name length: ${name.length}`);

  // Try the original method
  const nameBytes = Buffer.from(name.padEnd(16, ' ').substring(0, 16));
  console.log(`\nNameBytes buffer:`);
  console.log(`Length: ${nameBytes.length}`);
  console.log(`Hex: ${Array.from(nameBytes).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
  console.log(`String: "${nameBytes.toString()}"`);

  // Copy to patch
  for (let i = 0; i < 16; i++) {
    patch[i] = nameBytes[i];
  }

  console.log(`\nPatch after copying name (first 32 bytes):`);
  console.log(`Hex: ${Array.from(patch.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
  console.log(`String: "${patch.slice(0, 16).toString()}"`);

  return patch;
}

function createTestPatch2() {
  const patch = new Uint8Array(254);
  const name = "Deep Sub";

  // Alternative method - write directly
  const nameStr = name.padEnd(16, ' ').substring(0, 16);
  for (let i = 0; i < 16; i++) {
    patch[i] = nameStr.charCodeAt(i);
  }

  console.log(`\nAlternative method (charCodeAt):`);
  console.log(`Hex: ${Array.from(patch.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
  console.log(`String: "${patch.slice(0, 16).toString()}"`);

  return patch;
}

console.log('='.repeat(60));
console.log('PATCH CREATION DEBUG');
console.log('='.repeat(60) + '\n');

createTestPatch();
createTestPatch2();
