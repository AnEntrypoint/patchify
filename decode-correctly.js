const fs = require('fs');

function decode7bit(encoded) {
  const decoded = [];
  let i = 0;
  while (i < encoded.length) {
    const msb = encoded[i++];
    const chunkSize = Math.min(7, encoded.length - i);
    for (let j = 0; j < chunkSize; j++) {
      let b = encoded[i + j];
      if (msb & (1 << (6 - j))) b |= 0x80;
      decoded.push(b);
    }
    i += chunkSize;
  }
  return Buffer.from(decoded);
}

// Test both slice offsets on initpatch.syx
const ip = fs.readFileSync('initpatch.syx');
console.log('=== HEADER OFFSET TEST ===');
console.log(`initpatch.syx: ${ip.length} bytes`);
console.log(`Raw first 10: ${ip.slice(0, 10).toString('hex')}`);

for (let offset = 6; offset <= 9; offset++) {
  const enc = ip.slice(offset, -1);
  const dec = decode7bit(enc);
  const name = Array.from(dec.slice(0, 12)).map(b => String.fromCharCode(b & 0x7F)).join('');
  console.log(`slice(${offset},-1): encoded=${enc.length}, decoded=${dec.length} - name="${name.trim()}"`);
}

// The all-programs message from factory-prg.syx
const raw = fs.readFileSync('factory-prg.syx');
const allProgsMsg = raw.slice(299);
console.log(`\nAll-programs msg: ${allProgsMsg.length} bytes`);
console.log(`Raw first 10: ${allProgsMsg.slice(0, 10).toString('hex')}`);

for (let offset = 6; offset <= 9; offset++) {
  const enc = allProgsMsg.slice(offset, -1);
  const dec = decode7bit(enc);
  const patchCount = dec.length / 254;
  const name0 = Array.from(dec.slice(0, 12)).map(b => String.fromCharCode(b & 0x7F)).join('');
  console.log(`slice(${offset},-1): encoded=${enc.length}, decoded=${dec.length} (${patchCount.toFixed(3)} patches) name0="${name0.trim()}"`);
}

// Find the right offset
console.log('\n=== CORRECT DECODE ===');
// Use offset 7 for the all-programs message
const enc7 = allProgsMsg.slice(7, -1);
const allPrgs = decode7bit(enc7);
console.log(`Decoded: ${allPrgs.length} bytes = ${allPrgs.length / 254} patches`);

// Show first 10 patch names
console.log('\nFirst 10 patch names:');
for (let i = 0; i < 10; i++) {
  const patch = allPrgs.slice(i * 254, (i + 1) * 254);
  const name = Array.from(patch.slice(0, 12)).map(b => String.fromCharCode(b & 0x7F)).join('').trim();
  console.log(`P${i.toString().padStart(3)}: "${name}"`);
}

// Save for further use
fs.writeFileSync('factory-prg-decoded.bin', allPrgs);
console.log(`\n✓ Saved: factory-prg-decoded.bin (${allPrgs.length} bytes)`);

// Also decode initpatch with offset 7
const ipDec = decode7bit(ip.slice(7, -1));
console.log(`\ninitpatch decoded with offset 7: ${ipDec.length} bytes`);
console.log(`Name: "${Array.from(ipDec.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim()}"`);
console.log(`B44 (vibrato): 0x${ipDec[44].toString(16).padStart(2,'0')}`);
console.log(`B54 (OSC1 level): 0x${ipDec[54].toString(16).padStart(2,'0')}`);
console.log(`B56 (noise level): 0x${ipDec[56].toString(16).padStart(2,'0')}`);
console.log(`B57 (filter type): 0x${ipDec[57].toString(16).padStart(2,'0')}`);
console.log(`B63 (AMP level): 0x${ipDec[63].toString(16).padStart(2,'0')}`);
