const fs = require('fs');

const data = fs.readFileSync('FactoryBackUpDoResetAfter.syx');
console.log(`File size: ${data.length} bytes`);
console.log(`Header: ${Array.from(data.slice(0, 5)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

const body = data.slice(5, -1); // Exclude F0 and F7
console.log(`Body size: ${body.length} bytes`);
console.log(`If 254 bytes per patch: ${body.length / 254} patches`);
console.log(`Remainder: ${body.length % 254} bytes`);

const patchSize = 128 * 254;
const extraSize = body.length - patchSize;
console.log(`\nPatches (128 × 254): ${patchSize} bytes`);
console.log(`Extra data: ${extraSize} bytes`);

// Show first and last bytes of extra data
const extraData = body.slice(patchSize);
if (extraSize > 0) {
  const first50 = Array.from(extraData.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' ');
  const last50 = Array.from(extraData.slice(-50)).map(b => b.toString(16).padStart(2, '0')).join(' ');
  console.log(`\nExtra data first 50 bytes:\n${first50}`);
  console.log(`\nExtra data last 50 bytes:\n${last50}`);
}
