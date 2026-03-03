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

const fprg = decode7bit(fs.readFileSync('factory-prg.syx').slice(8, -1));
const patch0 = fprg.slice(0, 254);

console.log('=== COMPLETE CORRECT INIT PATCH (factory-prg[0]) ===\n');
console.log(`Total size: ${patch0.length} bytes\n`);

// Show the patch in sections
console.log('NAME SECTION (bytes 0-11):');
console.log(`  "${patch0.slice(0, 12).toString('ascii')}"`);
console.log(`  Raw: ${patch0.slice(0, 12).toString('hex')}`);

console.log('\nGLOBAL PARAMETERS (bytes 12-37):');
for (let i = 12; i < 38; i++) {
  console.log(`  B${i}: 0x${patch0[i].toString(16).padStart(2, '0')} (${patch0[i]})`);
}

console.log('\nTIMBRE 1 (bytes 38-145):');
for (let i = 38; i < 146; i += 7) {
  let line = `  B${i.toString().padStart(3)}-${(i + 6).toString().padStart(3)}: `;
  for (let j = i; j < Math.min(i + 7, 146); j++) {
    line += `0x${patch0[j].toString(16).padStart(2, '0')} `;
  }
  console.log(line);
}

console.log('\nTIMBRE 2 (bytes 146-253):');
for (let i = 146; i < 254; i += 7) {
  let line = `  B${i.toString().padStart(3)}-${(i + 6).toString().padStart(3)}: `;
  for (let j = i; j < Math.min(i + 7, 254); j++) {
    line += `0x${patch0[j].toString(16).padStart(2, '0')} `;
  }
  console.log(line);
}

// Key byte analysis
console.log('\n\n=== KEY BYTE ANALYSIS ===\n');
const keyBytes = [
  { byte: 16, name: 'VOICE_MODE' },
  { byte: 20, name: 'DELAY_TIME' },
  { byte: 21, name: 'DELAY_DEPTH' },
  { byte: 22, name: 'DELAY_TYPE' },
  { byte: 23, name: 'MOD_RATE' },
  { byte: 24, name: 'MOD_DEPTH' },
  { byte: 25, name: 'MOD_TYPE' },
  { byte: 37, name: 'KBD_OCTAVE' },
  { byte: 44, name: 'VIBRATO_INT (T1+6)' },
  { byte: 57, name: 'FILTER_TYPE (T1+19)' },
  { byte: 146 + 6, name: 'VIBRATO_INT (T2+6)' },
];

keyBytes.forEach(({ byte, name }) => {
  console.log(`B${byte} (${name}): 0x${patch0[byte].toString(16).padStart(2, '0')} (${patch0[byte]})`);
});

console.log('\n\nThis is the GROUND TRUTH init patch from factory.');
console.log('Our code should produce patches with AT LEAST these same values for these bytes.');
