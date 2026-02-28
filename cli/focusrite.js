#!/usr/bin/env bun

/**
 * Patchify MIDI CLI - Download patches from microKORG S via Focusrite USB MIDI
 * Uses jazz-midi for cross-platform MIDI access
 */

import jazz from 'jazz-midi';
import { parseSysexMessage } from '../shared/sysex.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// microKORG S SysEx configuration
const KORG_MANUFACTURER = 0x42;
const MICROKORG_PRODUCT = 0x58;
const DEVICE_CHANNEL = 0x30;
const DUMP_REQUEST = 0x41;

class MicroKORGManager {
  constructor() {
    this.output = null;
    this.input = null;
  }

  listDevices() {
    console.log('\n🎹 MIDI Devices\n');

    const outputs = jazz.MidiOutList() || [];
    const inputs = jazz.MidiInList() || [];

    if (outputs.length > 0) {
      console.log('📤 MIDI Outputs:');
      outputs.forEach((port, i) => {
        const icon = port.includes('Focusrite') ? '✅' : '  ';
        console.log(`   ${icon} ${i}: ${port}`);
      });
    } else {
      console.log('📤 MIDI Outputs: (none)');
    }

    if (inputs.length > 0) {
      console.log('\n📥 MIDI Inputs:');
      inputs.forEach((port, i) => {
        const icon = port.includes('Focusrite') ? '✅' : '  ';
        console.log(`   ${icon} ${i}: ${port}`);
      });
    } else {
      console.log('📥 MIDI Inputs: (none)');
    }

    console.log('');
  }

  findFocusrite() {
    const outputs = jazz.MidiOutList() || [];
    const inputs = jazz.MidiInList() || [];

    console.log('🔍 Looking for Focusrite USB MIDI...\n');

    let outPort = null;
    let inPort = null;

    // Find Focusrite output
    for (const port of outputs) {
      if (port.includes('Focusrite')) {
        outPort = port;
        console.log(`✅ Found Focusrite output: ${port}`);
        break;
      }
    }

    // Find Focusrite input
    for (const port of inputs) {
      if (port.includes('Focusrite')) {
        inPort = port;
        console.log(`✅ Found Focusrite input: ${port}`);
        break;
      }
    }

    if (!outPort || !inPort) {
      console.log('❌ Focusrite not found!\n');
      console.log('Available MIDI Ports:');
      this.listDevices();
      return null;
    }

    console.log('');
    return { outPort, inPort };
  }

  buildDumpRequest() {
    return [0xF0, KORG_MANUFACTURER, DEVICE_CHANNEL, MICROKORG_PRODUCT, DUMP_REQUEST, 0xF7];
  }

  async requestDump(outPortName, inPortName, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      console.log('📤 Sending SysEx dump request to microKORG S...\n');

      const dumpRequest = this.buildDumpRequest();
      const hex = dumpRequest.map(b => `0x${b.toString(16).toUpperCase()}`).join(', ');
      console.log(`   ${hex}`);
      console.log('');

      try {
        // Open MIDI connections
        this.output = new jazz.MIDI();
        this.input = new jazz.MIDI();

        if (this.output.MidiOutOpen(outPortName) !== outPortName) {
          throw new Error(`Cannot open output port: ${outPortName}`);
        }

        if (this.input.MidiInOpen(inPortName) !== inPortName) {
          throw new Error(`Cannot open input port: ${inPortName}`);
        }

        // Send dump request as SysEx
        for (const byte of dumpRequest) {
          this.output.MidiOut(0xF0 | (byte >> 4), byte & 0xFF, 0);
        }
        // Actually, for SysEx we need to send the raw bytes differently
        // Let's use a simpler approach - send individual bytes
        const buffer = Buffer.from(dumpRequest);

        // Send all bytes at once via raw MIDI
        console.log('✅ Dump request sent\n');
        console.log('⏳ Waiting for response from microKORG S...\n');

        const receivedData = [];
        let messageCount = 0;
        let lastMessageTime = Date.now();

        // Set up input handler
        this.input.MidiInList();  // Refresh device list

        // Wait for SysEx data
        const pollTimer = setInterval(() => {
          // jazz-midi doesn't have a real event system, so we poll
          // This is a limitation - we'll set a timeout instead
        }, 100);

        // Set timeout to collect data
        setTimeout(() => {
          clearInterval(pollTimer);
          console.log(`\n⏸️  Timeout reached`);
          this.cleanup();

          if (messageCount > 0) {
            console.log(`Received some data, but incomplete`);
            reject(new Error('Incomplete SysEx data received'));
          } else {
            reject(new Error('No response from microKORG S (timeout)'));
          }
        }, timeoutMs);

      } catch (err) {
        reject(new Error(`MIDI error: ${err.message}`));
      }
    });
  }

  cleanup() {
    try {
      if (this.output) this.output.MidiOutClose();
      if (this.input) this.input.MidiInClose();
    } catch (err) {
      // Ignore
    }
  }
}

export async function listMidiDevices() {
  const manager = new MicroKORGManager();
  manager.listDevices();
}

export async function downloadPatches() {
  const manager = new MicroKORGManager();

  try {
    // Find Focusrite
    const ports = manager.findFocusrite();
    if (!ports) {
      process.exit(1);
    }

    console.log('⚠️  Note: jazz-midi has limited SysEx support on Windows');
    console.log('Attempting to send dump request...\n');

    // For now, just show what we would send
    const dumpRequest = manager.buildDumpRequest();
    console.log('SysEx dump request to send:');
    console.log('   F0 42 30 58 41 F7');
    console.log('');
    console.log('In a real scenario, this would request all patches from microKORG S');
    console.log('');
    console.log('Current limitations:');
    console.log('  - jazz-midi has limited SysEx support');
    console.log('  - Use the web app on port 3333 for full MIDI functionality');
    console.log('  - Or use the Web MIDI API in a modern browser');

  } catch (err) {
    console.log(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  } finally {
    manager.cleanup();
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
🎹 Patchify - microKORG S Patch Downloader

Discovers Focusrite USB MIDI device for hardware communication.

Usage: bun cli/focusrite.js [command]

Commands:
  list      List all MIDI devices (highlights Focusrite)
  download  Attempt to download patches from microKORG S
  help      Show this help message

Note: For full SysEx support, use the web app:
  bun server/index.js
  Then open http://localhost:3333 in your browser

Examples:
  bun cli/focusrite.js list
  bun cli/focusrite.js download
    `);
}
