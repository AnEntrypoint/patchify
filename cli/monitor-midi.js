#!/usr/bin/env bun

/**
 * MIDI Monitor - Listen for any incoming MIDI data
 */

import jazz from 'jazz-midi';

console.log('🎵 MIDI Monitor\n');

const inputs = jazz.MidiInList();
console.log('Available inputs:', inputs);

const focIn = inputs.find(p => p.includes('Focusrite'));
if (!focIn) {
  console.log('\n❌ Focusrite input not found');
  process.exit(1);
}

console.log(`\n📥 Listening on: ${focIn}\n`);

const monitor = new jazz.MIDI();
monitor.MidiInOpen(focIn);

console.log('Waiting for MIDI data (Ctrl+C to stop)...\n');

let byteCount = 0;
const startTime = Date.now();

// In jazz-midi, we need to poll for data manually
// There's no real event system in this binding
const pollTimer = setInterval(() => {
  // Unfortunately jazz-midi doesn't provide a way to read incoming data in Bun
  // We can only send, not receive in this binding
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  process.stdout.write(`\rListening... (${elapsed}s, ${byteCount} bytes) `);
}, 100);

// Stop after 30 seconds
setTimeout(() => {
  clearInterval(pollTimer);
  console.log(`\n\n⏸️  Monitor stopped\n`);
  console.log('ℹ️  Note: jazz-midi in Bun doesn\'t support reading incoming MIDI data');
  console.log('    It can only send MIDI messages, not receive them.\n');
  monitor.MidiInClose();
  process.exit(0);
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  clearInterval(pollTimer);
  console.log('\n\n⏸️  Interrupted\n');
  monitor.MidiInClose();
  process.exit(0);
});
