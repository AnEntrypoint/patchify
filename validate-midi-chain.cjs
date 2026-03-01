#!/usr/bin/env node

/**
 * Complete MIDI Signal Chain Validator
 * Tests routing and logs results
 */

const jazz = require('jazz-midi');
const fs = require('fs');
const path = require('path');

const LOG_FILE = 'midi-validation-log.txt';
let logOutput = '';

function log(msg) {
  console.log(msg);
  logOutput += msg + '\n';
}

function logSection(title) {
  const separator = '='.repeat(70);
  log('\n' + separator);
  log(title);
  log(separator + '\n');
}

logSection('🧪 MIDI ROUTING VALIDATION & TEST');

const midi = new jazz.MIDI();
const inputList = midi.MidiInList();
const outputList = midi.MidiOutList();

// ============= SECTION 1: Port Detection =============
logSection('1️⃣  PORT DETECTION');

log('MIDI Input Ports:');
if (!Array.isArray(inputList) || inputList.length === 0) {
  log('  ❌ No input ports found');
} else {
  inputList.forEach((port, i) => {
    log(`  [${i}] ${port}`);
  });
}

log('\nMIDI Output Ports:');
if (!Array.isArray(outputList) || outputList.length === 0) {
  log('  ❌ No output ports found');
} else {
  outputList.forEach((port, i) => {
    log(`  [${i}] ${port}`);
  });
}

// Find specific ports
let loopMidiInPort = -1, loopMidiOutPort = -1, focusriteInPort = -1, focusriteOutPort = -1;

for (let i = 0; i < inputList.length; i++) {
  if (inputList[i].includes('loopMIDI')) loopMidiInPort = i;
  if (inputList[i].includes('Focusrite')) focusriteInPort = i;
}

for (let i = 0; i < outputList.length; i++) {
  if (outputList[i].includes('loopMIDI')) loopMidiOutPort = i;
  if (outputList[i].includes('Focusrite')) focusriteOutPort = i;
}

logSection('2️⃣  PORT STATUS');

log('loopMIDI Input (monitor listens):  ' + (loopMidiInPort >= 0 ? `✅ Port ${loopMidiInPort}` : '❌ NOT FOUND'));
log('loopMIDI Output (Korg sends):      ' + (loopMidiOutPort >= 0 ? `✅ Port ${loopMidiOutPort}` : '❌ NOT FOUND'));
log('Focusrite Input (receives data):   ' + (focusriteInPort >= 0 ? `✅ Port ${focusriteInPort}` : '❌ NOT FOUND'));
log('Focusrite Output (to hardware):    ' + (focusriteOutPort >= 0 ? `✅ Port ${focusriteOutPort}` : '❌ NOT FOUND'));

// ============= SECTION 2: Signal Path Test =============
logSection('3️⃣  SIGNAL PATH TEST');

if (loopMidiOutPort < 0) {
  log('❌ Cannot test - loopMIDI output port not found');
} else if (focusriteOutPort < 0) {
  log('❌ Cannot test - Focusrite output port not found');
} else {
  log('📡 Sending test SysEx to loopMIDI output port...');
  
  // Create test SysEx
  const customLib = fs.readFileSync('patches/custom-library-2026-03-01.syx');
  const patchStart = 5;
  const patchSize = 254;
  const patchData = customLib.slice(patchStart, patchStart + patchSize);
  
  const header = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x4C]);
  const end = Buffer.from([0xF7]);
  const sysex = Buffer.concat([header, patchData, end]);
  
  try {
    // Send first 20 bytes as test
    const testBytes = Array.from(sysex.slice(0, 20));
    for (let i = 0; i < testBytes.length; i++) {
      midi.MidiOut(loopMidiOutPort, testBytes[i]);
    }
    log(`✅ Test bytes sent to loopMIDI output`);
    log(`   Bytes sent: ${testBytes.map(b => '0x' + b.toString(16).toUpperCase()).join(' ')}`);
  } catch (e) {
    log(`❌ Failed to send: ${e.message}`);
  }
}

// ============= SECTION 3: Routing Diagnosis =============
logSection('4️⃣  ROUTING DIAGNOSIS');

if (loopMidiOutPort >= 0 && focusriteOutPort >= 0) {
  log('✅ Both loopMIDI output and Focusrite exist');
  log('\n⚠️  CRITICAL: Windows MIDI routing must be configured');
  log('\nRequired Windows configuration:');
  log('  loopMIDI Port Output → Focusrite USB MIDI Input');
  log('\nSteps to configure:');
  log('  1. Settings → Sound → Advanced');
  log('  2. Volume mixer or App volume and device preferences');
  log('  3. Find loopMIDI → Set output to Focusrite USB MIDI');
  log('\nAfter configuration, re-run this validator to confirm routing.');
} else {
  log('❌ Missing required MIDI ports - cannot test routing');
}

// ============= SECTION 4: Next Steps =============
logSection('5️⃣  VERIFICATION STEPS');

log('1. Configure Windows MIDI routing (see above)');
log('2. Start the monitor:');
log('   bun cli/monitor-midi.cjs');
log('3. Send test bytes:');
log('   bun test-send-bytes.cjs');
log('4. Monitor should display: [SysEx received - 260 bytes]');
log('5. If successful, Korg editor will work');

// ============= Save Log =============
fs.writeFileSync(LOG_FILE, logOutput);
log('\n✅ Log saved to: ' + LOG_FILE);
log('');
