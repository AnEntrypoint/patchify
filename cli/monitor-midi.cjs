#!/usr/bin/env node

/**
 * MIDI SysEx Monitor - Capture and display SysEx messages from loopMIDI
 * Usage: bun cli/monitor-midi.cjs
 */

const fs = require('fs');
const path = require('path');
const midi = require('midi');

const input = new midi.Input();

console.log('\n' + '='.repeat(70));
console.log('🎹 MIDI SysEx Monitor - Listening for loopMIDI');
console.log('='.repeat(70) + '\n');

// List available input ports
console.log('Available MIDI Input Ports:');
for (let i = 0; i < input.getPortCount(); i++) {
  console.log(`  ${i}: ${input.getPortName(i)}`);
}

// Find loopMIDI port
let loopMIDIPort = -1;
for (let i = 0; i < input.getPortCount(); i++) {
  const portName = input.getPortName(i);
  if (portName.includes('loopMIDI')) {
    loopMIDIPort = i;
    console.log(`\n✅ Found loopMIDI at port ${i}`);
    break;
  }
}

if (loopMIDIPort === -1) {
  console.log('\n⚠️  loopMIDI not found in available ports');
  console.log('   Please ensure loopMIDI is installed and routing is configured\n');
  process.exit(1);
}

// Open the loopMIDI input
input.openPort(loopMIDIPort);

console.log(`\n📡 Listening on: ${input.getPortName(loopMIDIPort)}`);
console.log('⏳ Waiting for MIDI data... (Press Ctrl+C to stop)\n');

// Capture timestamps and data
const captureStart = new Date();
const captures = [];

// Handle incoming MIDI messages
input.on('message', (deltaTime, message) => {
  const timestamp = new Date();
  
  // Check if it's a SysEx message (starts with 0xF0)
  if (message[0] === 0xF0) {
    const hex = Array.from(message).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    const size = message.length;
    
    console.log(`\n[${timestamp.toISOString()}] SysEx received (${size} bytes)`);
    console.log('Hex:', hex.substring(0, 80) + (hex.length > 80 ? '...' : ''));
    
    captures.push({
      timestamp: timestamp.toISOString(),
      deltaTime,
      bytes: Array.from(message),
      hex
    });
  } else {
    // Other MIDI messages
    const statusByte = message[0];
    const status = statusByte.toString(16).toUpperCase();
    console.log(`[${timestamp.toISOString()}] MIDI received: 0x${status} (${message.length} bytes)`);
  }
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 CAPTURE SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total SysEx messages: ${captures.length}`);
  console.log(`Capture duration: ${(new Date() - captureStart) / 1000} seconds\n`);
  
  if (captures.length > 0) {
    // Save captured data
    const filename = `patches/midi-capture-${new Date().toISOString().replace(/[:.]/g, '-')}.syx`;
    const patchDir = path.dirname(filename);
    if (!fs.existsSync(patchDir)) fs.mkdirSync(patchDir, { recursive: true });
    
    // Combine all SysEx bytes into one file
    const allBytes = [];
    captures.forEach(capture => {
      allBytes.push(...capture.bytes);
    });
    
    fs.writeFileSync(filename, Buffer.from(allBytes));
    console.log(`💾 Captured data saved to: ${filename}`);
    console.log(`   File size: ${allBytes.length} bytes\n`);
    
    // Show first SysEx details
    if (captures.length > 0) {
      const first = captures[0];
      console.log('First SysEx received:');
      console.log(`  Timestamp: ${first.timestamp}`);
      console.log(`  Size: ${first.bytes.length} bytes`);
      console.log(`  Header: ${first.bytes.slice(0, 5).map(b => '0x' + b.toString(16).toUpperCase()).join(' ')}`);
      if (first.bytes.length > 5) {
        console.log(`  Data preview: ${first.hex.substring(0, 100)}...`);
      }
    }
  }
  
  input.closePort();
  process.exit(0);
});

