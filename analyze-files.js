const fs = require('fs');

const files = [
  'factory-all.syx',
  'factory-global.syx',
  'factory-patches.syx',
  'factory-prg.syx',
  'initpatch.syx',
  'single.syx'
];

console.log('File sizes:');
files.forEach(f => {
  try {
    const stat = fs.statSync(f);
    console.log(`${f.padEnd(30)} ${stat.size.toString().padStart(10)} bytes`);
  } catch (e) {
    console.log(`${f.padEnd(30)} NOT FOUND`);
  }
});

console.log('\nCalculations:');
const fp = fs.statSync('factory-patches.syx').size;
const halfway = fp / 2;
console.log(`factory-patches.syx: ${fp} bytes`);
console.log(`Halfway point: ${halfway} bytes`);
console.log(`256 patches × 254 bytes = ${256 * 254} bytes (raw)`);
console.log(`7-bit encoded (256×254 raw): ~${Math.ceil(256 * 254 * 8 / 7)} bytes`);
