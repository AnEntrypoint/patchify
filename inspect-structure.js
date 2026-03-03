const fs = require('fs');

// Read first 20 bytes and last 20 bytes of key files
const files = ['factory-patches.syx', 'factory-prg.syx', 'factory-global.syx', 'initpatch.syx', 'single.syx'];

files.forEach(fname => {
  try {
    const data = fs.readFileSync(fname);
    console.log(`\n${fname} (${data.length} bytes):`);
    console.log(`  First 20 bytes: ${data.slice(0, 20).toString('hex')}`);
    console.log(`  Last 20 bytes:  ${data.slice(-20).toString('hex')}`);

    // Check for SysEx markers
    if (data[0] === 0xF0) console.log(`  ✓ Starts with 0xF0 (SysEx start)`);
    if (data[data.length - 1] === 0xF7) console.log(`  ✓ Ends with 0xF7 (SysEx end)`);

    // Extract header
    const header = data.slice(0, 7).toString('hex');
    console.log(`  Header (bytes 1-7): ${header}`);
  } catch (e) {
    console.log(`\n${fname}: ERROR - ${e.message}`);
  }
});

// Now let's understand: factory-patches.syx structure
console.log('\n\n=== ANALYSIS ===');
const fp = fs.readFileSync('factory-patches.syx');
const ip = fs.readFileSync('initpatch.syx');

console.log(`factory-patches.syx: ${fp.length} bytes`);
console.log(`  Content length (excluding F0 and F7): ${fp.length - 2} bytes`);
console.log(`  Header: ${fp.slice(1, 8).toString('hex')}`);

console.log(`\ninitpatch.syx: ${ip.length} bytes`);
console.log(`  Content length (excluding F0 and F7): ${ip.length - 2} bytes`);
console.log(`  Header: ${ip.slice(1, 8).toString('hex')}`);

// Check if the halfway point makes sense
const halfway = fp.length / 2;
console.log(`\nFactore-patches.syx halfway point: byte ${Math.floor(halfway)}`);
console.log(`Data at halfway: ${fp.slice(Math.floor(halfway) - 5, Math.floor(halfway) + 5).toString('hex')}`);
