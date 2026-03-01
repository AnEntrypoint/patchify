#!/usr/bin/env node

/**
 * Detailed MIDI Port Status Checker
 */

const jazz = require('jazz-midi');
const { execSync } = require('child_process');
const fs = require('fs');

console.log('\n' + '='.repeat(70));
console.log('🔍 MIDI Port Status - Detailed Diagnostics');
console.log('='.repeat(70) + '\n');

// Try multiple ways to detect MIDI ports
console.log('Method 1: Using jazz-midi MidiInList/MidiOutList\n');

try {
  const inputList = new jazz.MidiInList();
  const outputList = new jazz.MidiOutList();
  
  console.log('Input ports available:', inputList && inputList.length !== undefined ? inputList.length : 'UNKNOWN');
  if (inputList && inputList.length > 0) {
    for (let i = 0; i < inputList.length; i++) {
      console.log(`  [${i}] ${inputList[i]}`);
    }
  }
  
  console.log('\nOutput ports available:', outputList && outputList.length !== undefined ? outputList.length : 'UNKNOWN');
  if (outputList && outputList.length > 0) {
    for (let i = 0; i < outputList.length; i++) {
      console.log(`  [${i}] ${outputList[i]}`);
    }
  }
} catch (e) {
  console.log('Error accessing jazz-midi lists:', e.message);
}

// Try creating MIDI objects
console.log('\n\nMethod 2: Attempting to create MIDI input/output objects\n');

try {
  const input = new jazz.MIDI.Input();
  console.log('✅ MIDI.Input object created successfully');
  console.log('   Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(input)).filter(m => m !== 'constructor'));
} catch (e) {
  console.log('❌ Failed to create MIDI.Input:', e.message);
}

try {
  const output = new jazz.MIDI.Output();
  console.log('✅ MIDI.Output object created successfully');
} catch (e) {
  console.log('❌ Failed to create MIDI.Output:', e.message);
}

// Check Windows MIDI ports via system command
console.log('\n\nMethod 3: Windows System Check\n');

try {
  const result = execSync('powershell -Command "Get-PnpDevice -Class MEDIA | Select-Object Name, Status"', { encoding: 'utf-8' });
  console.log('Audio/MIDI Devices Found:');
  console.log(result);
} catch (e) {
  console.log('Could not query Windows devices');
}

// Instructions
console.log('\n' + '='.repeat(70));
console.log('📋 SETUP CHECKLIST');
console.log('='.repeat(70) + '\n');

console.log('BEFORE RUNNING THE MONITOR:');
console.log('');
console.log('1. ✅ loopMIDI Application:');
console.log('   - Launch loopMIDI from Start Menu');
console.log('   - Click "+" button to create virtual port');
console.log('   - Leave loopMIDI running in background');
console.log('   - Verify port appears in loopMIDI window');
console.log('');
console.log('2. ✅ Focusrite Connection:');
console.log('   - Verify Focusrite USB cable connected');
console.log('   - Check Windows Sound Settings for Focusrite device');
console.log('   - Settings → Sound → Volume & device preferences → Advanced');
console.log('   - Look for Focusrite in the device list');
console.log('');
console.log('3. ✅ microKORG S Configuration:');
console.log('   - Power on microKORG S');
console.log('   - Press Shift + 4 (Global)');
console.log('   - Navigate to E-E: Set to ON');
console.log('   - Press Shift + 8 (System)');
console.log('   - Navigate to Write Protect: Set to OFF');
console.log('');
console.log('4. ✅ Korg Sound Editor:');
console.log('   - Open Korg Sound Editor');
console.log('   - Go to Settings/Preferences');
console.log('   - MIDI Output Port: Select loopMIDI Port');
console.log('   - Keep Sound Editor open');
console.log('');
console.log('='.repeat(70) + '\n');

console.log('Once all above are configured, the monitor should detect ports.');
console.log('Then run: bun cli/monitor-midi.cjs\n');
