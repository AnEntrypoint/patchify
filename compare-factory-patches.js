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

// Load factory-prg which has all 256 named patches
const fprg = decode7bit(fs.readFileSync('factory-prg.syx').slice(8, -1));
const PATCH_SIZE = 254;

// Get all patch names to find interesting ones
console.log('=== ALL FACTORY PATCH NAMES ===\n');
const names = [];
for (let i = 0; i < 256; i++) {
  const start = i * PATCH_SIZE;
  if (start + 12 > fprg.length) break;
  const raw = fprg.slice(start, start + 12);
  // name bytes can have high bit set - mask to ASCII
  let name = '';
  for (let j = 0; j < 12; j++) name += String.fromCharCode(raw[j] & 0x7F);
  name = name.trim();
  names.push({ i, name });
  if (i < 20 || i === 64 || i === 128 || i === 192) {
    console.log(`Patch ${i.toString().padStart(3)}: "${name}"`);
  }
}

// Compare initpatch bytes vs first few factory patches
const init = decode7bit(fs.readFileSync('initpatch.syx').slice(8, -1));
console.log('\n\n=== BYTE DIFFERENCES: init vs factory[1] vs factory[2] ===\n');

// For each byte, show value across first 5 patches
const patches = [init];
for (let p = 0; p < 4; p++) {
  patches.push(fprg.slice(p * PATCH_SIZE, (p + 1) * PATCH_SIZE));
}

// Show bytes that DIFFER across patches (these are actual parameters)
console.log('Bytes that change across patches (first 5):');
console.log(`${'Byte'.padEnd(5)} ${'Init'.padEnd(6)} ${'P0'.padEnd(6)} ${'P1'.padEnd(6)} ${'P2'.padEnd(6)} ${'P3'.padEnd(6)}`);

const initLen = init.length; // 253
for (let b = 0; b < initLen; b++) {
  const vals = patches.map(p => p[b]);
  const allSame = vals.every(v => v === vals[0]);
  if (!allSame) {
    const line = `B${b.toString().padStart(3, '0')}: ${vals.map(v => `0x${v.toString(16).padStart(2,'0')}`).join('  ')}`;
    console.log(line);
  }
}

// Focus on key bytes we care about
console.log('\n\n=== KEY BYTES ACROSS FACTORY PATCHES ===\n');

const keyBytes = [
  { b: 16, name: 'VOICE_MODE' },
  { b: 20, name: 'B20' },
  { b: 22, name: 'B22' },
  { b: 25, name: 'B25' },
  { b: 30, name: 'ARP_TEMPO?' },
  { b: 31, name: 'ARP_TEMPO2?' },
  { b: 37, name: 'KBD_OCTAVE' },
  { b: 44, name: 'VIBRATO?' },
  { b: 47, name: 'OSC1_CTRL2?' },
  { b: 53, name: 'PORTAMENTO?' },
  { b: 54, name: 'OSC1_LEVEL?' },
  { b: 55, name: 'OSC2_LEVEL?' },
  { b: 56, name: 'NOISE_LEVEL?' },
  { b: 57, name: 'FILTER_TYPE?' },
  { b: 58, name: 'CUTOFF?' },
  { b: 59, name: 'RESONANCE?' },
  { b: 63, name: 'AMP_LEVEL?' },
  { b: 72, name: 'AEG_ATK?' },
  { b: 73, name: 'AEG_DEC?' },
  { b: 74, name: 'AEG_SUS?' },
  { b: 75, name: 'AEG_REL?' },
];

const patchCount = 8;
const header = 'Byte'.padEnd(20) + Array.from({length: patchCount}, (_,i) => `P${i}`.padEnd(7)).join('');
console.log(header);

keyBytes.forEach(({ b, name }) => {
  let line = `B${b} (${name})`.padEnd(20);
  for (let p = 0; p < patchCount; p++) {
    const patch = fprg.slice(p * PATCH_SIZE, (p + 1) * PATCH_SIZE);
    const val = patch[b];
    line += `0x${val.toString(16).padStart(2,'0')}(${val.toString().padStart(3)}) `;
  }
  console.log(line);
});

// Show name of patches 0-7
console.log('\nPatch names 0-7:');
for (let p = 0; p < 8; p++) {
  const patch = fprg.slice(p * PATCH_SIZE, (p + 1) * PATCH_SIZE);
  let name = '';
  for (let j = 0; j < 12; j++) name += String.fromCharCode(patch[j] & 0x7F);
  console.log(`  P${p}: "${name.trim()}"`);
}
