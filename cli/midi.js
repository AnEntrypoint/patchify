#!/usr/bin/env bun

/**
 * Patchify MIDI CLI - Direct access to microKORG S via Focusrite USB MIDI
 * Handles SysEx dump requests and patch downloading
 */

import midi from 'midi';
import { parseSysexMessage } from '../shared/sysex.js';

// microKORG S SysEx configuration
const KORG_MANUFACTURER = 0x42;
const MICROKORG_PRODUCT = 0x58;
const DEVICE_CHANNEL = 0x30; // Channel 0

// Function codes
const DUMP_REQUEST = 0x41;  // Request patch dump from hardware
const DUMP_SEND = 0x40;     // Send patch to hardware

class MidiManager {
  constructor() {
    this.input = new midi.input();
    this.output = new midi.output();
    this.devices = { inputs: [], outputs: [] };
    this.receivedData = [];
    this.isReceiving = false;
  }

  listDevices() {
    console.log('\n🎹 MIDI Devices\n');

    const inputCount = this.input.getPortCount();
    const outputCount = this.output.getPortCount();

    if (inputCount > 0) {
      console.log('📥 MIDI Inputs:');
      for (let i = 0; i < inputCount; i++) {
        const name = this.input.getPortName(i);
        console.log(`   ${i}: ${name}`);
        this.devices.inputs.push({ id: i, name });
      }
    } else {
      console.log('📥 MIDI Inputs: (none)');
    }

    if (outputCount > 0) {
      console.log('\n📤 MIDI Outputs:');
      for (let i = 0; i < outputCount; i++) {
        const name = this.output.getPortName(i);
        console.log(`   ${i}: ${name}`);
        this.devices.outputs.push({ id: i, name });
      }
    } else {
      console.log('📤 MIDI Outputs: (none)');
    }

    console.log('');
  }

  findFocusrite() {
    console.log('🔍 Looking for Focusrite USB MIDI...\n');

    let inputIdx = -1;
    let outputIdx = -1;

    // Find Focusrite input
    for (let i = 0; i < this.input.getPortCount(); i++) {
      const name = this.input.getPortName(i);
      if (name.includes('Focusrite')) {
        inputIdx = i;
        console.log(`✅ Found Focusrite input: ${name}`);
        break;
      }
    }

    // Find Focusrite output
    for (let i = 0; i < this.output.getPortCount(); i++) {
      const name = this.output.getPortName(i);
      if (name.includes('Focusrite')) {
        outputIdx = i;
        console.log(`✅ Found Focusrite output: ${name}`);
        break;
      }
    }

    if (inputIdx === -1 || outputIdx === -1) {
      console.log('❌ Focusrite not found!\n');
      console.log('Available devices:');
      this.listDevices();
      return null;
    }

    console.log('');
    return { inputIdx, outputIdx };
  }

  buildDumpRequest() {
    // F0 42 30 58 41 F7
    // F0 = SysEx start
    // 42 = Korg manufacturer
    // 30 = Device channel
    // 58 = microKORG product
    // 41 = Dump request function code
    // F7 = SysEx end
    return [0xF0, KORG_MANUFACTURER, DEVICE_CHANNEL, MICROKORG_PRODUCT, DUMP_REQUEST, 0xF7];
  }

  async requestDump(outputIdx, inputIdx, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      console.log('📤 Sending SysEx dump request to microKORG S...\n');

      const dumpRequest = this.buildDumpRequest();
      const hex = dumpRequest.map(b => `0x${b.toString(16).toUpperCase()}`).join(', ');
      console.log(`   ${hex}`);
      console.log('');

      // Set up input handler BEFORE sending request
      this.receivedData = [];
      this.isReceiving = true;

      this.input.on('message', (deltaTime, message) => {
        if (message[0] === 0xF0) { // SysEx start
          console.log(`📥 Received SysEx (${message.length} bytes)`);
          this.receivedData.push(...message);
        }
      });

      // Open ports
      try {
        this.input.openPort(inputIdx);
        this.output.openPort(outputIdx);
      } catch (err) {
        return reject(new Error(`Failed to open MIDI ports: ${err.message}`));
      }

      // Send dump request
      try {
        this.output.sendMessage(dumpRequest);
        console.log('✅ Dump request sent\n');
      } catch (err) {
        return reject(new Error(`Failed to send SysEx: ${err.message}`));
      }

      // Wait for response with timeout
      const timer = setTimeout(() => {
        this.isReceiving = false;
        if (this.receivedData.length > 0) {
          resolve(this.receivedData);
        } else {
          reject(new Error('Timeout waiting for SysEx response from microKORG S'));
        }
      }, timeoutMs);

      // Also resolve immediately if we get a complete message
      this.input.on('message', () => {
        // Simple heuristic: if we got data, assume response received after 500ms
        clearTimeout(timer);
        setTimeout(() => {
          this.isReceiving = false;
          if (this.receivedData.length > 0) {
            resolve(this.receivedData);
          }
        }, 500);
      });
    });
  }

  close() {
    try {
      this.input.closePort();
      this.output.closePort();
    } catch (err) {
      // Ignore errors on close
    }
  }
}

export async function listMidiDevices() {
  const manager = new MidiManager();
  manager.listDevices();
}

export async function downloadPatches() {
  const manager = new MidiManager();

  try {
    // Find Focusrite
    const ports = manager.findFocusrite();
    if (!ports) {
      process.exit(1);
    }

    // Request dump
    const sysexData = await manager.requestDump(ports.outputIdx, ports.inputIdx, 10000);

    if (sysexData.length === 0) {
      console.log('❌ No data received from microKORG S');
      return;
    }

    console.log(`📊 Received ${sysexData.length} bytes of patch data\n`);

    // Try to parse patches
    try {
      const patches = parseSysexMessage(new Uint8Array(sysexData));
      if (Array.isArray(patches)) {
        console.log(`✅ Successfully decoded ${patches.length} patches!\n`);
        patches.forEach((patch, i) => {
          console.log(`   ${i + 1}. ${patch.name || 'Unnamed'}`);
        });
      } else if (patches) {
        console.log(`✅ Successfully decoded patch: ${patches.name}\n`);
      }
    } catch (err) {
      console.log(`⚠️  Could not parse patch data: ${err.message}`);
      console.log(`   Raw bytes: ${sysexData.slice(0, 20).join(' ')}`);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}\n`);
  } finally {
    manager.close();
  }
}

// CLI
const cmd = process.argv[2] || 'help';

switch (cmd.toLowerCase()) {
  case 'list':
    await listMidiDevices();
    break;
  case 'download':
  case 'dump':
    await downloadPatches();
    break;
  case 'help':
  case '-h':
  case '--help':
  default:
    console.log(`
🎹 Patchify MIDI CLI - Direct hardware access

Usage: bun cli/midi.js [command]

Commands:
  list      List all MIDI devices
  download  Download patches from microKORG S via Focusrite USB MIDI
  help      Show this help message

Examples:
  bun cli/midi.js list
  bun cli/midi.js download
    `);
}
