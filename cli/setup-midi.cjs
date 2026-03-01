#!/usr/bin/env node

/**
 * MIDI Setup Diagnostic Tool
 * Checks system MIDI configuration and guides setup
 */

const jazz = require('jazz-midi');

console.log('\n' + '='.repeat(70));
console.log('🎛️  Patchify MIDI Setup Diagnostic');
console.log('='.repeat(70) + '\n');

// Check current MIDI ports
console.log('📊 Step 1: Check Current MIDI Ports\n');

const midi = new jazz.MIDI();
const inputList = midi.MidiInList();
const outputList = midi.MidiOutList();

console.log('MIDI Input Ports:');
if (Array.isArray(inputList) && inputList.length > 0) {
  inputList.forEach((port, i) => {
    console.log(`  ${i}: ${port}`);
  });
} else {
  console.log('  ⚠️  No MIDI input ports found');
}

console.log('\nMIDI Output Ports:');
if (Array.isArray(outputList) && outputList.length > 0) {
  outputList.forEach((port, i) => {
    console.log(`  ${i}: ${port}`);
  });
} else {
  console.log('  ⚠️  No MIDI output ports found');
}

// Check for loopMIDI
console.log('\n📡 Step 2: Check for loopMIDI\n');

let hasLoopMIDI = false;
if (Array.isArray(inputList)) {
  for (let i = 0; i < inputList.length; i++) {
    if (inputList[i].includes('loopMIDI')) {
      hasLoopMIDI = true;
      console.log(`✅ Found loopMIDI at input port ${i}: ${inputList[i]}`);
    }
  }
}

if (!hasLoopMIDI) {
  console.log('❌ loopMIDI not found');
  console.log('\nTo fix this:');
  console.log('1. Download loopMIDI from: https://www.tobias-erichsen.de/software/virtualmidi/');
  console.log('2. Run the installer');
  console.log('3. Launch loopMIDI application');
  console.log('4. Click "+" button to add a virtual MIDI port');
  console.log('5. Run this diagnostic again to verify');
}

// Check for Focusrite
console.log('\n🎚️  Step 3: Check for Focusrite USB MIDI\n');

let hasFocusrite = false;

if (Array.isArray(outputList)) {
  for (let i = 0; i < outputList.length; i++) {
    if (outputList[i].includes('Focusrite')) {
      hasFocusrite = true;
      console.log(`✅ Found Focusrite at output port ${i}: ${outputList[i]}`);
      break;
    }
  }
}

if (!hasFocusrite) {
  console.log('❌ Focusrite not found');
  console.log('\nTo fix this:');
  console.log('1. Connect microKORG S via MIDI to Focusrite USB interface');
  console.log('2. Connect Focusrite to computer via USB');
  console.log('3. Enable SysEx receive on microKORG (Shift+4, select E-E)');
  console.log('4. Disable write protect (Shift+8, select OFF)');
  console.log('5. Run this diagnostic again to verify');
}

// Summary and next steps
console.log('\n' + '='.repeat(70));
console.log('📋 Setup Status Summary\n');

const status = {
  'loopMIDI installed': hasLoopMIDI ? '✅' : '❌',
  'Focusrite connected': hasFocusrite ? '✅' : '❌',
};

Object.entries(status).forEach(([name, state]) => {
  console.log(`${state} ${name}`);
});

if (hasLoopMIDI && hasFocusrite) {
  console.log('\n✅ All prerequisites satisfied!\n');
  console.log('You can now:');
  console.log('1. Run: bun cli/monitor-midi.cjs');
  console.log('2. Send patches from Korg Sound Editor');
  console.log('3. Monitor will capture the SysEx format');
  console.log('4. Then: bun cli/send-patches-individually.cjs');
} else {
  console.log('\n⚠️  Some prerequisites missing. Follow the setup steps above.\n');
}

console.log('='.repeat(70) + '\n');
