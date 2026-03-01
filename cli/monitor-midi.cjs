#!/usr/bin/env node

/**
 * Monitor MIDI SysEx from loopMIDI input
 * Captures patches sent from Korg Sound Editor
 */

const fs = require('fs');
const path = require('path');
const jazz = require('jazz-midi');

console.log('\n' + '='.repeat(70));
console.log('🎹 MIDI SysEx Monitor - Listening for loopMIDI');
console.log('='.repeat(70) + '\n');

// Get MIDI ports
const midi = new jazz.MIDI();
const inputList = midi.MidiInList();
const outputList = midi.MidiOutList();

console.log('Available MIDI Input Ports:');
if (Array.isArray(inputList)) {
  inputList.forEach((port, i) => {
    console.log(`  ${i}: ${port}`);
  });
} else {
  console.log('  (none found)');
}

// Find loopMIDI input port
let loopMIDIPort = -1;
if (Array.isArray(inputList)) {
  for (let i = 0; i < inputList.length; i++) {
    if (inputList[i].includes('loopMIDI')) {
      loopMIDIPort = i;
      console.log(`\n✅ Found loopMIDI at input port ${i}`);
      break;
    }
  }
}

if (loopMIDIPort === -1) {
  console.log('\n❌ loopMIDI not found in input ports');
  console.log('   Make sure loopMIDI is running and has a virtual port created');
  process.exit(1);
}

// Open MIDI input
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
  
  console.log('='.repeat(70) + '\n');
  
  input.closePort();
  process.exit(0);
});
