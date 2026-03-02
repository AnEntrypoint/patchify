#!/usr/bin/env node

const fs = require('fs');

// Read single factory patch
const data = fs.readFileSync('single.syx');
console.log(`File size: ${data.length} bytes\n`);

// single.syx format: F0 42 30 00 01 40 40 [patch data] [checksum] F7
// Extract patch data (skip header, before checksum/footer)
const header = data.slice(0, 7);
const patchData = data.slice(7, data.length - 2); // Skip header and last 2 bytes
const checksum = data[data.length - 2];
const footer = data[data.length - 1];

console.log(`Header: ${Array.from(header).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`);
console.log(`Patch data length: ${patchData.length} bytes`);
console.log(`Checksum: 0x${checksum.toString(16).toUpperCase().padStart(2, '0')}`);
console.log(`Footer: 0x${footer.toString(16).toUpperCase().padStart(2, '0')}`);

// This is raw data (not 7-bit encoded)
console.log('\n=== ANALYZING PATCH STRUCTURE ===\n');

// Show key bytes
console.log('Name (0-11):     ' + patchData.slice(0, 12).toString('ascii'));
console.log('Byte 5 (legacy transpose offset):  0x' + patchData[5].toString(16).padStart(2, '0') + ' (dec: ' + patchData[5] + ')');
console.log('Byte 37 (KBD_OCTAVE):             0x' + patchData[37].toString(16).padStart(2, '0') + ' (dec: ' + patchData[37] + ')');
console.log('Byte 43 (T1+5 transpose):         0x' + patchData[43].toString(16).padStart(2, '0') + ' (dec: ' + patchData[43] + ')');
console.log('Byte 84 (T1+46 VP2 dst/src):      0x' + patchData[84].toString(16).padStart(2, '0') + ' (dec: ' + patchData[84] + ')');
console.log('Byte 85 (T1+47 VP2 intensity):    0x' + patchData[85].toString(16).padStart(2, '0') + ' (dec: ' + patchData[85] + ')');
console.log('Byte 112 (T1+74):                 0x' + patchData[112].toString(16).padStart(2, '0') + ' (dec: ' + patchData[112] + ')');

// Decode VP2 byte (84)
const vp2Byte = patchData[84];
const vp2Src = vp2Byte & 0x0F;  // Low nibble
const vp2Dst = (vp2Byte >> 4) & 0x0F; // High nibble
console.log('\nVP2 Byte 84 decoded:');
console.log(`  Low nibble (src):  ${vp2Src}`);
console.log(`  High nibble (dst): ${vp2Dst}`);

// Check name and global data
console.log('\n=== TIMBRE 1 (bytes 38-145) ===');
const t1 = patchData.slice(38, 146);
console.log(`T1+0 (MIDI Channel):      0x${t1[0].toString(16).padStart(2, '0')}`);
console.log(`T1+1 (Assign):            0x${t1[1].toString(16).padStart(2, '0')}`);
console.log(`T1+3 (Tune):              0x${t1[3].toString(16).padStart(2, '0')} (${t1[3]})`);
console.log(`T1+5 (Transpose legacy):  0x${t1[5].toString(16).padStart(2, '0')} (${t1[5]})`);
console.log(`T1+6 (Vibrato):           0x${t1[6].toString(16).padStart(2, '0')} (${t1[6]})`);
console.log(`T1+7 (OSC1 Wave):         0x${t1[7].toString(16).padStart(2, '0')} (${t1[7]})`);
