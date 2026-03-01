#!/usr/bin/env node

/**
 * MIDI Proxy: loopMIDI → Focusrite
 * Listens on loopMIDI, forwards to Focusrite, logs everything
 */

const jazz = require('jazz-midi');
const fs = require('fs');
const path = require('path');

const LOG_DIR = 'midi-logs';
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const LOG_FILE = path.join(LOG_DIR, `proxy-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
let logBuffer = '';
let sysexCount = 0;
let midiCount = 0;

function log(msg) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${msg}`;
  console.log(logLine);
  logBuffer += logLine + '\n';
  
  // Write to file every 10 messages
  if ((sysexCount + midiCount) % 10 === 0) {
    fs.appendFileSync(LOG_FILE, logBuffer);
    logBuffer = '';
  }
}

function formatHex(data) {
  return Array.from(data).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

console.log('\n' + '='.repeat(70));
console.log('🔄 MIDI PROXY - loopMIDI ↔ Focusrite');
console.log('='.repeat(70) + '\n');

const midi = new jazz.MIDI();
const inputList = midi.MidiInList();
const outputList = midi.MidiOutList();

// Find ports
let loopMidiIn = -1, focusriteOut = -1;

for (let i = 0; i < inputList.length; i++) {
  if (inputList[i].includes('loopMIDI')) loopMidiIn = i;
}

for (let i = 0; i < outputList.length; i++) {
  if (outputList[i].includes('Focusrite')) focusriteOut = i;
}

if (loopMidiIn < 0) {
  console.log('❌ loopMIDI input not found');
  process.exit(1);
}

if (focusriteOut < 0) {
  console.log('❌ Focusrite output not found');
  process.exit(1);
}

console.log(`📥 Listening on loopMIDI: ${inputList[loopMidiIn]}`);
console.log(`📤 Forwarding to Focusrite: ${outputList[focusriteOut]}`);
console.log(`📝 Logging to: ${LOG_FILE}\n`);

log('MIDI PROXY STARTED');
log(`Input: ${inputList[loopMidiIn]} (port ${loopMidiIn})`);
log(`Output: ${outputList[focusriteOut]} (port ${focusriteOut})`);
log('');

// Open input
const input = midi.MidiInOpen(loopMidiIn, (deltatime, message) => {
  if (!message || message.length === 0) return;

  // Handle SysEx (starts with 0xF0)
  if (message[0] === 0xF0) {
    sysexCount++;
    const hex = formatHex(message);
    log(`SysEx #${sysexCount}: ${message.length} bytes - ${hex.substring(0, 80)}${hex.length > 80 ? '...' : ''}`);
    
    // Forward to Focusrite
    try {
      for (let i = 0; i < message.length; i++) {
        midi.MidiOut(focusriteOut, message[i]);
      }
      log(`  → Forwarded to Focusrite ✅`);
    } catch (e) {
      log(`  → Forward FAILED: ${e.message} ❌`);
    }
  } else {
    // Regular MIDI (note on/off, CC, etc.)
    midiCount++;
    const hex = Array.from(message).map(b => '0x' + b.toString(16).toUpperCase()).join(' ');
    const msgType = ['Note OFF', 'Note ON', 'CC', 'Program', 'Unknown'][Math.floor(message[0] / 16) % 5];
    log(`MIDI #${midiCount}: ${msgType} - ${hex}`);
    
    // Forward to Focusrite
    try {
      for (let i = 0; i < message.length; i++) {
        midi.MidiOut(focusriteOut, message[i]);
      }
    } catch (e) {
      log(`  → Forward FAILED: ${e.message} ❌`);
    }
  }
});

log('Proxy running - forwarding MIDI messages...');
log('Press Ctrl+C to stop\n');

process.on('SIGINT', () => {
  // Write final log
  fs.appendFileSync(LOG_FILE, logBuffer);
  
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Proxy stopped`);
  console.log(`📊 Messages forwarded:`);
  console.log(`   SysEx: ${sysexCount}`);
  console.log(`   MIDI: ${midiCount}`);
  console.log(`📝 Log: ${LOG_FILE}`);
  console.log('='.repeat(70) + '\n');
  
  process.exit(0);
});
