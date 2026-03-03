const fs = require('fs');

function decode7bit(encoded) {
  const decoded = [];
  let i = 0;
  while (i < encoded.length) {
    const msb = encoded[i];
    i++;
    const chunkSize = Math.min(7, encoded.length - i);
    for (let j = 0; j < chunkSize; j++) {
      let byte = encoded[i + j];
      if (msb & (1 << (6 - j))) byte |= 0x80;
      decoded.push(byte);
    }
    i += chunkSize;
  }
  return Buffer.from(decoded);
}

const ip = decode7bit(fs.readFileSync('initpatch.syx').slice(8, -1));

console.log('=== CORRECT INIT PATCH FROM FACTORY ===\n');
console.log(`Total size: ${ip.length} bytes (should be 254, but is ${ip.length})`);
console.log(`\nName (bytes 0-11): "${ip.slice(0, 12).toString('ascii')}"`);
console.log(`\nComplete byte dump:\n`);

for (let i = 0; i < ip.length; i++) {
  const hex = `0x${ip[i].toString(16).padStart(2, '0')}`;
  const dec = ip[i].toString().padStart(3, ' ');
  process.stdout.write(`B${i.toString().padStart(3)}: ${hex} (${dec})  `);
  if ((i + 1) % 4 === 0) console.log();
}
console.log('\n');

// Key parameter positions (assuming standard 254-byte patch structure)
console.log('\nKey parameters (if this were a complete 254-byte patch):');
if (ip.length >= 16) console.log(`B16 (VOICE_MODE): 0x${ip[16].toString(16).padStart(2, '0')}`);
if (ip.length >= 25) console.log(`B25 (MOD_TYPE): 0x${ip[25].toString(16).padStart(2, '0')}`);
if (ip.length >= 37) console.log(`B37 (KBD_OCTAVE): 0x${ip[37].toString(16).padStart(2, '0')}`);
if (ip.length >= 44) console.log(`B44 (Vibrato?): 0x${ip[44].toString(16).padStart(2, '0')}`);
if (ip.length >= 57) console.log(`B57 (FilterType?): 0x${ip[57].toString(16).padStart(2, '0')}`);

// Compare with factory-prg[0]
console.log('\n\nComparing with factory-prg[0]:');
const fprg = decode7bit(fs.readFileSync('factory-prg.syx').slice(8, -1));
const fprg0 = fprg.slice(0, 254);

console.log(`factory-prg[0] size: 254 bytes`);
console.log(`Match for first ${ip.length} bytes? ${ip.equals(fprg0.slice(0, ip.length))}`);

// Show the missing byte(s)
console.log(`\nMissing from initpatch: byte 253 of factory-prg[0]`);
console.log(`factory-prg[0][253]: 0x${fprg0[253].toString(16).padStart(2, '0')}`);
