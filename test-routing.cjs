#!/usr/bin/env node

const jazz = require('jazz-midi');

console.log('\n🔍 MIDI Routing Diagnostic\n');

const midi = new jazz.MIDI();
const inputList = midi.MidiInList();
const outputList = midi.MidiOutList();

console.log('📡 Available Ports:');
console.log('\nInputs (what we are listening to):');
inputList.forEach((port, i) => {
  console.log(`  [${i}] ${port}`);
});

console.log('\nOutputs (where Korg editor should send):');
outputList.forEach((port, i) => {
  console.log(`  [${i}] ${port}`);
});

console.log('\n' + '='.repeat(70));
console.log('🔧 MIDI Routing Troubleshooting\n');

// Find loopMIDI ports
let loopMidiIn = -1, loopMidiOut = -1;
for (let i = 0; i < inputList.length; i++) {
  if (inputList[i].includes('loopMIDI')) loopMidiIn = i;
}
for (let i = 0; i < outputList.length; i++) {
  if (outputList[i].includes('loopMIDI')) loopMidiOut = i;
}

console.log('loopMIDI Input port:', loopMidiIn >= 0 ? `✅ ${loopMidiIn}` : '❌ NOT FOUND');
console.log('loopMIDI Output port:', loopMidiOut >= 0 ? `✅ ${loopMidiOut}` : '❌ NOT FOUND');

console.log('\n❓ Common Issues:\n');
console.log('1. ❌ Korg editor MIDI output NOT set to loopMIDI');
console.log('   → Fix: In Korg Sound Editor settings, set MIDI OUT to loopMIDI Port');
console.log('');
console.log('2. ❌ loopMIDI routing not configured in Windows');
console.log('   → Fix: In Windows Settings → Sound → App volume and device preferences');
console.log('   → Route loopMIDI OUT to Focusrite IN');
console.log('');
console.log('3. ❌ Korg editor still connected to direct Focusrite (not loopMIDI)');
console.log('   → Fix: Restart Korg editor after changing MIDI settings');
console.log('');
console.log('4. ❌ Focusrite MIDI input not properly receiving loopMIDI output');
console.log('   → Fix: Check Windows MIDI routing - loopMIDI output must route to Focusrite');
console.log('');
console.log('='.repeat(70) + '\n');
