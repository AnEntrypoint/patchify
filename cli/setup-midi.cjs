#!/usr/bin/env node

/**
 * MIDI Setup Diagnostic Tool
 * Checks system MIDI configuration and guides setup
 */

const jazz = require('jazz-midi');
const { execSync } = require('child_process');

console.log('\n' + '='.repeat(70));
console.log('🎛️  Patchify MIDI Setup Diagnostic');
console.log('='.repeat(70) + '\n');

// 1. Check current MIDI ports
console.log('📊 Step 1: Check Current MIDI Ports\n');

const inputList = new jazz.MidiInList();
const outputList = new jazz.MidiOutList();

console.log('MIDI Input Ports:');
if (!inputList || inputList.length === undefined || inputList.length === 0) {
  console.log('  ⚠️  No MIDI input ports found');
} else {
  for (let i = 0; i < inputList.length; i++) {
    console.log(`  ${i}: ${inputList[i]}`);
  }
}

console.log('\nMIDI Output Ports:');
if (!outputList || outputList.length === undefined || outputList.length === 0) {
  console.log('  ⚠️  No MIDI output ports found');
} else {
  for (let i = 0; i < outputList.length; i++) {
    console.log(`  ${i}: ${outputList[i]}`);
  }
}

// 2. Check for loopMIDI
console.log('\n📡 Step 2: Check for loopMIDI\n');

let hasLoopMIDI = false;
if (inputList && inputList.length > 0) {
  for (let i = 0; i < inputList.length; i++) {
    if (inputList[i] && inputList[i].includes('loopMIDI')) {
      hasLoopMIDI = true;
      console.log(`✅ Found loopMIDI at input port ${i}: ${inputList[i]}`);
    }
  }
}

if (!hasLoopMIDI) {
  console.log('❌ loopMIDI not found');
  console.log('\nTo fix this, you need to:');
  console.log('1. Download loopMIDI from: https://www.tobias-erichsen.de/software/virtualmidi/');
  console.log('2. Run the installer');
  console.log('3. Launch loopMIDI application');
  console.log('4. Click "+" button to add a virtual MIDI port');
  console.log('5. Run this diagnostic again to verify');
}

// 3. Check for Focusrite
console.log('\n🎚️  Step 3: Check for Focusrite USB MIDI\n');

let hasFocusrite = false;
let focusritePort = -1;

if (outputList && outputList.length > 0) {
  for (let i = 0; i < outputList.length; i++) {
    if (outputList[i] && outputList[i].includes('Focusrite')) {
      hasFocusrite = true;
      focusritePort = i;
      console.log(`✅ Found Focusrite at output port ${i}: ${outputList[i]}`);
      break;
    }
  }
}

if (!hasFocusrite) {
  console.log('❌ Focusrite not found');
  console.log('\nTo fix this, you need to:');
  console.log('1. Connect microKORG S via MIDI to Focusrite USB interface');
  console.log('2. Connect Focusrite to computer via USB');
  console.log('3. Enable SysEx receive on microKORG (Shift+4, select E-E)');
  console.log('4. Disable write protect (Shift+8, select OFF)');
  console.log('5. Run this diagnostic again to verify');
}

// 4. Summary and next steps
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
  console.log('2. Configure loopMIDI routing in Windows');
  console.log('3. Send patches from Korg Sound Editor');
  console.log('4. Monitor will capture the SysEx format');
} else {
  console.log('\n⚠️  Some prerequisites missing. Follow the setup steps above.\n');
}

console.log('='.repeat(70) + '\n');
