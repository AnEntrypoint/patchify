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

const raw = fs.readFileSync('initpatch.syx');
console.log('=== RAW initpatch.syx ===');
console.log(`Total bytes: ${raw.length}`);
console.log(`Header (first 8): ${raw.slice(0, 8).toString('hex')}`);
console.log(`Footer (last 1):  ${raw.slice(-1).toString('hex')}`);
console.log(`Function ID (byte 7): 0x${raw[7].toString(16).padStart(2,'0')}`);
console.log(`Encoded data: bytes 8 to ${raw.length - 2} (${raw.length - 9} bytes)`);

const encoded = raw.slice(8, -1);
const patch = decode7bit(encoded);
console.log(`\nDecoded patch: ${patch.length} bytes`);
console.log('\n=== FULL DECODED PATCH - EVERY BYTE ===\n');

// Labels per byte position based on microKORG S documentation layout
// Patch = 12 name + 26 global + 108 timbre1 + 108 timbre2 = 254
// OR could be different size

const labels = {
  // Name
  0:'name0', 1:'name1', 2:'name2', 3:'name3', 4:'name4', 5:'name5',
  6:'name6', 7:'name7', 8:'name8', 9:'name9', 10:'nameA', 11:'nameB',
  // Global
  12:'G00', 13:'G01', 14:'G02', 15:'G03',
  16:'G04/VOICE_MODE', 17:'G05', 18:'G06', 19:'G07',
  20:'G08/DELAY_TIME?', 21:'G09/DELAY_DEPTH?', 22:'G10/DELAY_TYPE?',
  23:'G11/MOD_RATE?', 24:'G12/MOD_DEPTH?', 25:'G13/MOD_TYPE?',
  26:'G14/EQ_HI_GAIN?', 27:'G15/EQ_HI_FREQ?',
  28:'G16/EQ_LO_GAIN?', 29:'G17/EQ_LO_FREQ?',
  30:'G18/ARP_TEMPO_MSB?', 31:'G19/ARP_TEMPO_LSB?',
  32:'G20/ARP_FLAGS?', 33:'G21/ARP_TYPE?',
  34:'G22/ARP_GATE?', 35:'G23/ARP_RES?', 36:'G24/ARP_SWING?',
  37:'G25/KBD_OCTAVE',
  // Timbre 1 (T1 = 38)
  38:'T1+00/MIDI_CH', 39:'T1+01/ASSIGN', 40:'T1+02/UNI_DETUNE',
  41:'T1+03/TUNE', 42:'T1+04/BEND', 43:'T1+05/TRANSPOSE',
  44:'T1+06/VIBRATO', 45:'T1+07/OSC1_WAVE', 46:'T1+08/OSC1_CTRL1',
  47:'T1+09/OSC1_CTRL2', 48:'T1+10/DWGS_WAVE', 49:'T1+11/dummy',
  50:'T1+12/OSC2', 51:'T1+13/OSC2_SEMI', 52:'T1+14/OSC2_TUNE',
  53:'T1+15/PORTAMENTO', 54:'T1+16/OSC1_LEVEL', 55:'T1+17/OSC2_LEVEL',
  56:'T1+18/NOISE_LEVEL', 57:'T1+19/FILTER_TYPE',
  58:'T1+20/CUTOFF', 59:'T1+21/RESONANCE', 60:'T1+22/FEG_INT',
  61:'T1+23/FILT_VEL', 62:'T1+24/FILT_KBD', 63:'T1+25/AMP_LEVEL',
  64:'T1+26/AMP_PAN', 65:'T1+27/AMP_FLAGS', 66:'T1+28/AMP_VEL',
  67:'T1+29/AMP_KBD', 68:'T1+30/FEG_ATK', 69:'T1+31/FEG_DEC',
  70:'T1+32/FEG_SUS', 71:'T1+33/FEG_REL', 72:'T1+34/AEG_ATK',
  73:'T1+35/AEG_DEC', 74:'T1+36/AEG_SUS', 75:'T1+37/AEG_REL',
  76:'T1+38/LFO1', 77:'T1+39/LFO1_FREQ', 78:'T1+40/LFO1_SYNC',
  79:'T1+41/LFO2', 80:'T1+42/LFO2_FREQ', 81:'T1+43/LFO2_SYNC',
  82:'T1+44/VP1_DST_SRC', 83:'T1+45/VP1_INT',
  84:'T1+46/VP2_DST_SRC', 85:'T1+47/VP2_INT',
  86:'T1+48/VP3_DST_SRC', 87:'T1+49/VP3_INT',
  88:'T1+50/VP4_DST_SRC', 89:'T1+51/VP4_INT',
};

for (let i = 0; i < patch.length; i++) {
  const label = labels[i] || `B${i}`;
  const hex = `0x${patch[i].toString(16).padStart(2,'0')}`;
  const dec = patch[i].toString().padStart(3,' ');
  const bin = patch[i].toString(2).padStart(8,'0');
  console.log(`B${i.toString().padStart(3,'0')}: ${hex} (${dec}) [${bin}]  ${label}`);
}
