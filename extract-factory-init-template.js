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

// Extract factory init patch (factory-prg[0])
const fprg = decode7bit(fs.readFileSync('factory-prg.syx').slice(8, -1));
const initPatch = fprg.slice(0, 254);

// Extract factory-patches second half (supposed init patches)
const fpatches = decode7bit(fs.readFileSync('factory-patches.syx').slice(8, -1));

console.log('=== FACTORY INIT PATCH BYTE DUMP ===\n');
console.log('// Generated from factory-prg[0] - the correct init patch template\n');
console.log('const FACTORY_INIT = Buffer.from([\n');

for (let i = 0; i < 254; i += 16) {
  let line = '  ';
  for (let j = i; j < Math.min(i + 16, 254); j++) {
    line += `0x${initPatch[j].toString(16).padStart(2, '0')}, `;
  }
  console.log(line);
}
console.log(']);\n');

console.log('\n// Byte-by-byte analysis of factory init patch:\n');
console.log('// Global params (bytes 12-37):');
for (let i = 12; i <= 37; i++) {
  const names = {
    12: 'Unknown',
    13: 'Unknown',
    14: 'Unknown',
    15: 'Unknown',
    16: 'VOICE_MODE',
    17: 'Unknown',
    18: 'Unknown',
    19: 'Unknown',
    20: 'DELAY_TIME',
    21: 'DELAY_DEPTH',
    22: 'DELAY_TYPE',
    23: 'MOD_RATE',
    24: 'MOD_DEPTH',
    25: 'MOD_TYPE',
    26: 'EQ_HI_GAIN',
    27: 'EQ_HI_FREQ',
    28: 'EQ_LOW_GAIN',
    29: 'EQ_LOW_FREQ',
    30: 'ARP_TEMPO_MSB',
    31: 'ARP_TEMPO_LSB',
    32: 'ARP_FLAGS',
    33: 'ARP_TYPE_RANGE',
    34: 'ARP_GATE',
    35: 'ARP_RESOLUTION',
    36: 'ARP_SWING',
    37: 'KBD_OCTAVE',
  };
  console.log(`// B${i}: 0x${initPatch[i].toString(16).padStart(2, '0')} = ${initPatch[i].toString().padStart(3)} (${names[i]})`);
}

console.log('\n// Timbre 1 key bytes (T1 = 38):');
const t1KeyBytes = [
  { offset: 0, name: 'MIDI_CH' },
  { offset: 1, name: 'ASSIGN' },
  { offset: 3, name: 'TUNE' },
  { offset: 4, name: 'BEND' },
  { offset: 5, name: 'TRANSPOSE' },
  { offset: 6, name: 'VIBRATO_INT' },
  { offset: 7, name: 'OSC1_WAVE' },
  { offset: 16, name: 'OSC1_LEVEL' },
  { offset: 19, name: 'FILTER_TYPE' },
  { offset: 20, name: 'FILTER_CUT' },
  { offset: 21, name: 'FILTER_RES' },
];

t1KeyBytes.forEach(({ offset, name }) => {
  const byte = 38 + offset;
  console.log(`// B${byte} (T1+${offset}): 0x${initPatch[byte].toString(16).padStart(2, '0')} = ${initPatch[byte].toString().padStart(3)} (${name})`);
});

console.log('\n// Timbre 2 key bytes (T2 = 146):');
const t2KeyBytes = [
  { offset: 0, name: 'MIDI_CH' },
  { offset: 1, name: 'ASSIGN' },
  { offset: 6, name: 'VIBRATO_INT' },
  { offset: 19, name: 'FILTER_TYPE' },
];

t2KeyBytes.forEach(({ offset, name }) => {
  const byte = 146 + offset;
  console.log(`// B${byte} (T2+${offset}): 0x${initPatch[byte].toString(16).padStart(2, '0')} = ${initPatch[byte].toString().padStart(3)} (${name})`);
});

// Compare with factory-patches second half
console.log('\n\n=== COMPARING TO FACTORY-PATCHES[128] (supposed init) ===\n');
const patch128 = fpatches.slice(128 * 254, 129 * 254);
console.log('Critical bytes comparison (factory-prg[0] vs factory-patches[128]):');
const criticalBytes = [16, 20, 22, 25, 37, 38 + 6, 38 + 19, 146 + 6, 146 + 19];
criticalBytes.forEach(b => {
  const factory = initPatch[b];
  const fp128 = patch128[b];
  const match = factory === fp128 ? '✓' : '✗';
  console.log(`${match} B${b}: factory=0x${factory.toString(16).padStart(2, '0')}, patches[128]=0x${fp128.toString(16).padStart(2, '0')}`);
});

// Save as JS constant
fs.writeFileSync('factory-init-template.js', `
// Factory init patch template - extracted from factory-prg[0]
// This is the GROUND TRUTH for all patch defaults
const FACTORY_INIT = Buffer.from([
${Array.from(initPatch).map((b, i) => {
  if (i % 16 === 0) return '  ';
  return '0x' + b.toString(16).padStart(2, '0') + (i === 253 ? '' : ', ');
}).join('').trim()}
]);

module.exports = FACTORY_INIT;
`);

console.log('\n✓ Saved to factory-init-template.js');
