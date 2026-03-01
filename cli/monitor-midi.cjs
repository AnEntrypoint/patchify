#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const jazz = require('jazz-midi');

console.log('\n' + '='.repeat(70));
console.log('🎹 MIDI SysEx Monitor - Listening for loopMIDI');
console.log('='.repeat(70) + '\n');

// List ports using jazz-midi API
const inputList = new jazz.MidiInList();
console.log('Available MIDI Input Ports:');
for (let i = 0; i < inputList.length; i++) {
  console.log(`  ${i}: ${inputList[i]}`);
}

// Find loopMIDI port
let loopMIDIPort = -1;
for (let i = 0; i < inputList.length; i++) {
  if (inputList[i].includes('loopMIDI')) {
    loopMIDIPort = i;
    console.log(`\n✅ Found loopMIDI at port ${i}`);
    break;
  }
}

if (loopMIDIPort === -1) {
  console.log('\n⚠️  loopMIDI not found');
  console.log('   Available ports: ' + Array.from({length: inputList.length}, (_, i) => inputList[i]).join(', '));
  process.exit(1);
}

// Create input
const input = new jazz.MIDI.Input();
input.openPort(loopMIDIPort);

console.log(`📡 Listening on: ${inputList[loopMIDIPort]}`);
console.log('⏳ Waiting for MIDI data... (Press Ctrl+C to stop)\n');

const captures = [];

input.onmidimessage = (event) => {
  const data = event.data;
  
  if (data[0] === 0xF0) {
    const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    console.log(`[SysEx received - ${data.length} bytes]`);
    console.log(`Hex: ${hex.substring(0, 80)}${hex.length > 80 ? '...' : ''}\n`);
    captures.push({timestamp: new Date().toISOString(), bytes: Array.from(data)});
  }
};

process.on('SIGINT', () => {
  console.log('\n' + '='.repeat(70));
  console.log(`📊 Captured ${captures.length} SysEx messages`);
  
  if (captures.length > 0) {
    const allBytes = [];
    captures.forEach(c => allBytes.push(...c.bytes));
    const filename = `patches/midi-capture-${new Date().toISOString().replace(/[:.]/g, '-')}.syx`;
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filename, Buffer.from(allBytes));
    console.log(`💾 Saved to: ${filename} (${allBytes.length} bytes)`);
  }
  
  input.closePort();
  process.exit(0);
});

