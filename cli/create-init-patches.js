const fs = require('fs');

const PATCH_SIZE = 254;

/**
 * Create a clean init patch with factory defaults
 * Based on properly decoded single.syx factory patch analysis
 */
function createInitPatch(name) {
  const patch = new Uint8Array(PATCH_SIZE);

  // Initialize with factory defaults from proper analysis
  patch.fill(0x40);

  // Name
  const nameBytes = Buffer.from(name.padEnd(12, ' ').slice(0, 12), 'ascii');
  for (let i = 0; i < 12; i++) patch[i] = nameBytes[i];

  // Global params - FACTORY DEFAULTS
  patch[16] = 0x40;  // VOICE_MODE
  patch[22] = 0x00;  // DELAY_TYPE
  patch[25] = 0x01;  // MOD_TYPE (not 0!)
  patch[37] = 0x7F;  // KBD_OCTAVE (not 0!)

  // Timbre 1 (offset 38)
  const tb = 38;
  patch[tb + 0]  = 0x7F;  // MIDI Channel
  patch[tb + 1]  = 0x40;  // Assign
  patch[tb + 3]  = 0x40;  // Tune
  patch[tb + 4]  = 0x40;  // Bend
  patch[tb + 5]  = 0x40;  // Transpose legacy
  patch[tb + 6]  = 0x41;  // Vibrato Intensity (factory: 0x41)
  patch[tb + 7]  = 0x00;  // OSC1 Wave
  patch[tb + 16] = 0x00;  // OSC1 Level (0 = mute)
  patch[tb + 19] = 0x01;  // Filter Type (0x01 = 12LPF, not 0x00!)
  patch[tb + 44] = 0x40;  // VP1 dst/src
  patch[tb + 45] = 0x40;  // VP1 intensity
  patch[tb + 46] = 0x40;  // VP2 dst/src
  patch[tb + 47] = 0x40;  // VP2 intensity

  return patch;
}

// Create 256 identical init patches
const allRaw = Buffer.alloc(256 * PATCH_SIZE);
for (let i = 0; i < 256; i++) {
  const bank = String.fromCharCode(65 + Math.floor(i / 64));
  const num = (i % 64) + 1;
  const name = `INIT ${bank}${num}`;
  const patch = createInitPatch(name);
  allRaw.set(patch, i * PATCH_SIZE);
}

console.log(`Raw data: ${allRaw.length} bytes (${allRaw.length / PATCH_SIZE} patches)`);

// 7-bit encode
function encode7bit(raw) {
  const out = [];
  for (let i = 0; i < raw.length; i += 7) {
    let msb = 0;
    const chunk = raw.slice(i, Math.min(i + 7, raw.length));
    for (let j = 0; j < chunk.length; j++) {
      msb |= ((chunk[j] >> 7) & 1) << (6 - j);
    }
    out.push(msb);
    for (let j = 0; j < chunk.length; j++) {
      out.push(chunk[j] & 0x7F);
    }
  }
  return Buffer.from(out);
}

const encoded = encode7bit(allRaw);
console.log(`7-bit encoded: ${encoded.length} bytes`);

const header = Buffer.from([0xF0, 0x42, 0x30, 0x00, 0x01, 0x40, 0x50]);
const footer = Buffer.from([0xF7]);
const sysex = Buffer.concat([header, encoded, footer]);

fs.writeFileSync('patches/init-patches-test.syx', sysex);

console.log(`✅ Created patches/init-patches-test.syx (${sysex.length} bytes)`);
console.log(`   All 256 patches: clean init with factory defaults`);
console.log(`   Byte 25 (MOD_TYPE): 0x01 (not phaser)`);
console.log(`   Byte 37 (KBD_OCTAVE): 0x7F (octave 0)`);
console.log(`   Byte 44 (Vibrato): 0x41 (factory default)`);
console.log(`   Byte 57 (FilterType): 0x01 (12LPF, not HPF)`);
