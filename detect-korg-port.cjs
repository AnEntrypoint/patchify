#!/usr/bin/env node

/**
 * Detect which MIDI port Korg editor is sending to
 * Listens on ALL input ports and logs any activity
 */

const jazz = require('jazz-midi');

console.log('\n' + '='.repeat(70));
console.log('🔎 DETECTING KORG MIDI OUTPUT PORT');
console.log('='.repeat(70) + '\n');

const midi = new jazz.MIDI();
const inputList = midi.MidiInList();

console.log('Listening on ALL MIDI input ports for activity...\n');

if (!Array.isArray(inputList) || inputList.length === 0) {
  console.log('❌ No input ports found');
  process.exit(1);
}

const listeners = [];
const messageLog = {};

// Open ALL input ports
inputList.forEach((port, portIndex) => {
  messageLog[portIndex] = { name: port, count: 0, samples: [] };
  
  console.log(`[${portIndex}] Listening on: ${port}`);
  
  try {
    const input = midi.MidiInOpen(portIndex, (deltatime, message) => {
      if (!message || message.length === 0) return;
      
      messageLog[portIndex].count++;
      
      // Capture first few samples
      if (messageLog[portIndex].samples.length < 3) {
        const hex = Array.from(message.slice(0, 10))
          .map(b => '0x' + b.toString(16).toUpperCase())
          .join(' ');
        messageLog[portIndex].samples.push(hex);
      }
      
      console.log(`\n✅ ACTIVITY DETECTED on port [${portIndex}] ${port}`);
      console.log(`   Message ${messageLog[portIndex].count}: ${message.length} bytes`);
      console.log(`   Data: ${Array.from(message.slice(0, 15))
        .map(b => '0x' + b.toString(16).toUpperCase())
        .join(' ')}${message.length > 15 ? '...' : ''}`);
    });
    
    listeners.push(input);
  } catch (e) {
    console.log(`   ❌ Failed to open: ${e.message}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('🎹 NOW: Send a patch from Korg Sound Editor');
console.log('='.repeat(70));
console.log('Waiting for MIDI activity (30 seconds)...\n');

setTimeout(() => {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESULTS');
  console.log('='.repeat(70) + '\n');
  
  let foundActivity = false;
  
  for (let i = 0; i < inputList.length; i++) {
    if (messageLog[i].count > 0) {
      console.log(`✅ Port [${i}] ${messageLog[i].name}: ${messageLog[i].count} messages`);
      console.log(`   Samples: ${messageLog[i].samples[0]}`);
      foundActivity = true;
    }
  }
  
  if (!foundActivity) {
    console.log('❌ NO MIDI ACTIVITY DETECTED on any port');
    console.log('\nPossible causes:');
    console.log('  • Korg editor not sending (check it has loopMIDI selected)');
    console.log('  • Korg editor needs to be restarted after changing MIDI settings');
    console.log('  • MIDI device not properly connected');
    console.log('  • Try sending a Note On/Off first (simpler than SysEx)');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  process.exit(foundActivity ? 0 : 1);
}, 30000);
