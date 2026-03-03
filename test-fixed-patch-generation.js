const fs = require('fs');

// Load the fixed patch generation code
const createPatchCode = fs.readFileSync('cli/create-custom-library-from-factory.cjs', 'utf-8');

// Extract and eval the code (avoiding file I/O parts)
const codeToRun = createPatchCode
  .split('async function main()')[0]  // Only get the patch creation functions
  .replace(/require\('\.\/patches-data\.cjs'\);/, '[]');  // Skip patch loading

eval(codeToRun);

// Load factory init patch for comparison
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
const factoryInit = fprg.slice(0, 254);

// Generate a test patch with no config (should match factory init for defaults)
const testPatch = createPatch('TEST PATCH', {});

console.log('=== TESTING FIXED PATCH GENERATION ===\n');
console.log('Comparing generated patch to factory init patch:\n');

// Check critical bytes
const criticalBytes = [
  { byte: 16, name: 'VOICE_MODE' },
  { byte: 20, name: 'DELAY_TIME' },
  { byte: 22, name: 'DELAY_TYPE' },
  { byte: 25, name: 'MOD_TYPE' },
  { byte: 26, name: 'EQ_HI_GAIN' },
  { byte: 27, name: 'EQ_HI_FREQ' },
  { byte: 30, name: 'ARP_TEMPO_MSB' },
  { byte: 31, name: 'ARP_TEMPO_LSB' },
  { byte: 37, name: 'KBD_OCTAVE' },
  { byte: 38, name: 'T1+0 (MIDI_CH)' },
  { byte: 39, name: 'T1+1 (ASSIGN)' },
  { byte: 44, name: 'T1+6 (VIBRATO)' },
  { byte: 57, name: 'T1+19 (FILTER_TYPE)' },
  { byte: 146, name: 'T2+0 (MIDI_CH)' },
  { byte: 152, name: 'T2+6 (VIBRATO)' },
  { byte: 165, name: 'T2+19 (FILTER_TYPE)' },
];

let allMatch = true;
criticalBytes.forEach(({ byte, name }) => {
  const factory = factoryInit[byte];
  const generated = testPatch[byte];
  const match = factory === generated ? '✓' : '✗';
  if (factory !== generated) allMatch = false;
  console.log(`${match} B${byte.toString().padStart(3)} (${name.padEnd(20)}): factory=0x${factory.toString(16).padStart(2, '0')} generated=0x${generated.toString(16).padStart(2, '0')}`);
});

console.log(`\n${allMatch ? '✅ ALL CRITICAL BYTES MATCH!' : '❌ SOME BYTES DO NOT MATCH'}`);

// Show any other mismatches
console.log('\n\nDetailed comparison - any remaining differences:');
let otherDiffs = 0;
for (let i = 0; i < 254; i++) {
  if (factoryInit[i] !== testPatch[i]) {
    // Skip if it's one we expect to be different
    if (!criticalBytes.map(c => c.byte).includes(i)) {
      console.log(`Byte ${i}: factory=0x${factoryInit[i].toString(16).padStart(2, '0')} generated=0x${testPatch[i].toString(16).padStart(2, '0')}`);
      otherDiffs++;
      if (otherDiffs >= 10) {
        console.log('... (showing first 10 differences)');
        break;
      }
    }
  }
}

if (otherDiffs === 0) {
  console.log('✓ No other differences (apart from critical bytes already checked)');
}
