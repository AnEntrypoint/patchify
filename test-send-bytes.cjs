#!/usr/bin/env node

const jazz = require('jazz-midi');
const fs = require('fs');

console.log('\n🧪 Testing MIDI Output - Byte by Byte\n');

const midi = new jazz.MIDI();

// Load first patch
const customLib = fs.readFileSync('patches/custom-library-2026-03-01.syx');
const patchStart = 5;
const patchSize = 254;
const patchData = customLib.slice(patchStart, patchStart + patchSize);

// Build SysEx
const header = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x4C]);
const end = Buffer.from([0xF7]);
const sysex = Buffer.concat([header, patchData, end]);

console.log('📤 Testing loopMIDI output (port 3)...');

try {
  // Send first few bytes to test the connection
  const testBytes = Array.from(sysex.slice(0, 10));
  console.log('Sending first 10 bytes:', testBytes.map(b => '0x' + b.toString(16).toUpperCase()).join(' '));
  
  for (let i = 0; i < testBytes.length; i++) {
    midi.MidiOut(3, testBytes[i]);
  }
  
  console.log('✅ Test bytes sent successfully');
  console.log('\n📢 Check monitor window for SysEx capture');
  
} catch (e) {
  console.log('❌ Error:', e.message);
}

console.log('\n');
