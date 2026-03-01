#!/usr/bin/env node

/**
 * Complete End-to-End MIDI Chain Test
 * Sends test data through loopMIDI and checks if it reaches Focusrite
 */

const jazz = require('jazz-midi');
const fs = require('fs');

console.log('\n' + '='.repeat(70));
console.log('🔗 END-TO-END MIDI CHAIN TEST');
console.log('='.repeat(70) + '\n');

const midi = new jazz.MIDI();
const inputList = midi.MidiInList();
const outputList = midi.MidiOutList();

// Find ports
let loopMidiOut = -1, focusriteIn = -1;
for (let i = 0; i < outputList.length; i++) {
  if (outputList[i].includes('loopMIDI')) loopMidiOut = i;
}
for (let i = 0; i < inputList.length; i++) {
  if (inputList[i].includes('Focusrite')) focusriteIn = i;
}

console.log('Step 1: Setting up listeners...\n');

if (focusriteIn < 0) {
  console.log('❌ Focusrite input not found');
  process.exit(1);
}

console.log(`📥 Listening on Focusrite input (port ${focusriteIn}): ${inputList[focusriteIn]}`);

// Open Focusrite input for listening
let messageReceived = false;
const focusriteInput = midi.MidiInOpen(focusriteIn, (deltatime, message) => {
  if (message && message.length > 0 && message[0] === 0xF0) {
    console.log('\n✅ SUCCESS! Focusrite received SysEx from loopMIDI!');
    console.log(`   Message: ${message.length} bytes`);
    console.log(`   Header: ${Array.from(message.slice(0, 5)).map(b => '0x' + b.toString(16).toUpperCase()).join(' ')}`);
    messageReceived = true;
  }
});

console.log('📡 Sending test SysEx to loopMIDI output...\n');

if (loopMidiOut < 0) {
  console.log('❌ loopMIDI output not found');
  process.exit(1);
}

// Create test SysEx
const customLib = fs.readFileSync('patches/custom-library-2026-03-01.syx');
const patchStart = 5;
const patchSize = 254;
const patchData = customLib.slice(patchStart, patchStart + patchSize);

const header = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x4C]);
const end = Buffer.from([0xF7]);
const sysex = Buffer.concat([header, patchData, end]);

// Send full SysEx byte by byte
console.log(`Sending ${sysex.length} bytes...`);
const startTime = Date.now();

for (let i = 0; i < sysex.length; i++) {
  try {
    midi.MidiOut(loopMidiOut, sysex[i]);
  } catch (e) {
    console.log(`❌ Error sending byte ${i}:`, e.message);
    process.exit(1);
  }
}

console.log('Bytes sent to loopMIDI output');

// Wait to see if message is received
console.log('\nWaiting for Focusrite to receive data (5 seconds)...\n');

setTimeout(() => {
  if (messageReceived) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ ROUTING TEST PASSED');
    console.log('='.repeat(70));
    console.log('\nYour MIDI routing is configured correctly!');
    console.log('\nNext steps:');
    console.log('  1. bun cli/monitor-midi.cjs');
    console.log('  2. Send patch from Korg editor');
    console.log('  3. bun cli/send-patches-individually.cjs');
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('❌ ROUTING TEST FAILED');
    console.log('='.repeat(70));
    console.log('\nFocusrite did not receive data from loopMIDI output.');
    console.log('\nPossible causes:');
    console.log('  1. Windows MIDI routing not configured');
    console.log('  2. loopMIDI → Focusrite mapping missing');
    console.log('  3. MIDI routing needs to be applied in Windows Sound settings');
    console.log('\nFix: Go to Settings → Sound → Advanced');
    console.log('     Set loopMIDI output to route to Focusrite input');
  }
  console.log('\n' + '='.repeat(70) + '\n');
  process.exit(messageReceived ? 0 : 1);
}, 5000);
