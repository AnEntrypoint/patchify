#!/usr/bin/env bun

/**
 * SysEx sender - Test direct SysEx sending to microKORG S
 */

import jazz from 'jazz-midi';

const DUMP_REQUEST = [0xF0, 0x42, 0x30, 0x58, 0x41, 0xF7];

console.log('🎹 SysEx Sender Test\n');

const outputs = jazz.MidiOutList();
const inputs = jazz.MidiInList();

console.log('Outputs:', outputs);
console.log('Inputs:', inputs);

// Find Focusrite
const focOut = outputs.find(p => p.includes('Focusrite'));
const focIn = inputs.find(p => p.includes('Focusrite'));

if (!focOut || !focIn) {
  console.log('\n❌ Focusrite not found');
  process.exit(1);
}

console.log(`\n✅ Found: ${focOut} / ${focIn}\n`);

const out = new jazz.MIDI();
const inn = new jazz.MIDI();

out.MidiOutOpen(focOut);
inn.MidiInOpen(focIn);

console.log('📤 Sending SysEx dump request...');
console.log('   Bytes:', DUMP_REQUEST.map(b => `0x${b.toString(16).toUpperCase()}`).join(' '));

// Try sending as individual status messages
for (let i = 0; i < DUMP_REQUEST.length; i++) {
  const byte = DUMP_REQUEST[i];
  console.log(`   Sending byte ${i}: 0x${byte.toString(16).toUpperCase()}`);

  // Try different methods
  out.MidiOut(0xF0, byte, 0);  // Status + data1
}

console.log('\n⏳ Waiting 5 seconds for response...\n');

setTimeout(() => {
  console.log(`Received bytes: ${JSON.stringify(Array.from([...DUMP_REQUEST]))}`);
  out.MidiOutClose();
  inn.MidiInClose();
  console.log('\n✅ Done');
  process.exit(0);
}, 5000);
