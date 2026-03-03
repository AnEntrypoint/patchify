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

const raw = fs.readFileSync('factory-prg.syx');

// Message 1: all 256 programs, starts at byte 299
const allProgsMsg = raw.slice(299); // starts at F0 of second message
console.log(`All-programs message: ${allProgsMsg.length} bytes`);
console.log(`Header: ${allProgsMsg.slice(0, 8).toString('hex')}`);
console.log(`Function byte: 0x${allProgsMsg[7].toString(16).padStart(2,'0')}`);

const encoded = allProgsMsg.slice(8, -1); // skip 8-byte header and F7
const allPrgs = decode7bit(encoded);
console.log(`Decoded: ${allPrgs.length} bytes`);
console.log(`As patches (÷254): ${allPrgs.length / 254}`);
console.log(`As patches (÷253): ${allPrgs.length / 253}`);

// Check if it cleanly divides
for (let psize = 250; psize <= 260; psize++) {
  if (allPrgs.length % psize === 0) {
    console.log(`✓ Divides evenly by ${psize}: ${allPrgs.length / psize} patches`);
  }
}

// Try patch size 254 - show first few patch names
console.log('\n=== PATCH NAMES WITH SIZE 254 ===');
for (let i = 0; i < 10; i++) {
  const patch = allPrgs.slice(i * 254, (i + 1) * 254);
  let name = '';
  for (let j = 0; j < 12; j++) name += String.fromCharCode(patch[j] & 0x7F);
  console.log(`P${i}: "${name.trim()}" (B57=${patch[57]}, B63=${patch[63]})`);
}

// Try comparing our initpatch.syx vs prg[0]
const ip = decode7bit(fs.readFileSync('initpatch.syx').slice(8, -1));
const prg0 = allPrgs.slice(0, 254);
const prg0_253 = allPrgs.slice(0, 253);

console.log(`\n\ninitpatch (253 bytes) vs all-prgs[0] (254 bytes):`);
console.log(`Match for 253 bytes? ${ip.equals(prg0_253)}`);
console.log(`\nall-prgs[0] name: "${Array.from(prg0.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim()}"`);
console.log(`initpatch name:    "${Array.from(ip.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim()}"`);

// Show key bytes for first 8 patches
console.log('\n=== KEY BYTES ACROSS REAL FACTORY PROGRAMS ===');
const keyBytes = [
  { b: 44, name: 'VIBRATO' },
  { b: 54, name: 'OSC1_LVL' },
  { b: 56, name: 'NOISE_LVL' },
  { b: 57, name: 'FILTER_TYPE' },
  { b: 58, name: 'CUTOFF' },
  { b: 59, name: 'RESONANCE' },
  { b: 63, name: 'AMP_LEVEL' },
];

const header = 'Byte'.padEnd(22) + Array.from({length: 8}, (_,i) => `P${i}`.padEnd(8)).join('');
console.log(header);
keyBytes.forEach(({ b, name }) => {
  let line = `B${b} (${name})`.padEnd(22);
  for (let p = 0; p < 8; p++) {
    const patch = allPrgs.slice(p * 254, (p + 1) * 254);
    const val = patch[b];
    line += `0x${val.toString(16).padStart(2,'0')}(${val.toString().padStart(3)}) `;
  }
  console.log(line);
});

// Save the correctly decoded all-programs data for further analysis
fs.writeFileSync('factory-prg-decoded.bin', allPrgs);
console.log(`\n✓ Saved decoded all-prgs to factory-prg-decoded.bin (${allPrgs.length} bytes)`);
