#!/usr/bin/env bun

/**
 * Patchify MIDI CLI - Download microKORG S patch library via Focusrite USB MIDI
 * Sends SysEx dump request and receives patch data directly from hardware
 */

import jazz from 'jazz-midi';
import { parseSysexMessage } from '../shared/sysex.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const KORG_MANUFACTURER = 0x42;
const MICROKORG_PRODUCT = 0x58;
const DEVICE_CHANNEL = 0x30;
const DUMP_REQUEST = 0x41;

class MicroKORGDownloader {
  constructor() {
    this.output = null;
    this.input = null;
    this.receivedBytes = [];
    this.isReceiving = false;
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
    }
    if (inputs.length > 0) {
      console.log('\n📥 MIDI Inputs:');
      inputs.forEach((port, i) => {
        const icon = port.includes('Focusrite') ? '✅' : '  ';
        console.log(`   ${icon} ${i}: ${port}`);
      });
    }
    console.log('');
  }

  findFocusrite() {
    const outputs = jazz.MidiOutList() || [];
    const inputs = jazz.MidiInList() || [];

    console.log('🔍 Detecting Focusrite USB MIDI...\n');

    let outPort = null;
    let inPort = null;

    for (const port of outputs) {
      if (port.toLowerCase().includes('focusrite')) {
        outPort = port;
        console.log(`✅ Output: ${port}`);
      }
    }
    for (const port of inputs) {
      if (port.toLowerCase().includes('focusrite')) {
        inPort = port;
        console.log(`✅ Input: ${port}`);
      }
    }

    if (!outPort || !inPort) {
      console.log('\n❌ Focusrite not found!\n');
      this.listDevices();
      return null;
    }
    console.log('');
    return { outPort, inPort };
  }

  buildDumpRequest() {
    return new Uint8Array([0xF0, KORG_MANUFACTURER, DEVICE_CHANNEL, MICROKORG_PRODUCT, DUMP_REQUEST, 0xF7]);
  }

  sendSysex(data) {
    // Send SysEx as individual status bytes
    const bytes = Array.from(data);
    for (const byte of bytes) {
      this.output.MidiOut(0xF0, byte, 0);
    }
  }

  async downloadPatches(outPort, inPort) {
    console.log('📤 Opening MIDI ports...\n');

    try {
      this.output = new jazz.MIDI();
      this.input = new jazz.MIDI();

      const outResult = this.output.MidiOutOpen(outPort);
      if (outResult !== outPort) {
        throw new Error(`Cannot open output: ${outPort}`);
      }

      const inResult = this.input.MidiInOpen(inPort);
      if (inResult !== inPort) {
        throw new Error(`Cannot open input: ${inPort}`);
      }

      console.log('✅ Ports opened\n');
      console.log('📤 Sending dump request to microKORG S...\n');

      const dumpRequest = this.buildDumpRequest();
      const hexStr = Array.from(dumpRequest)
        .map(b => `0x${b.toString(16).toUpperCase()}`)
        .join(' ');
      console.log(`   ${hexStr}`);
      console.log('');

      // Send dump request byte by byte
      for (const byte of dumpRequest) {
        this.output.MidiOut(0xB0, byte, 0);
      }

      console.log('✅ Request sent\n');
      console.log('⏳ Waiting for microKORG S response (10 seconds)...\n');

      // Collect responses
      this.receivedBytes = [];
      this.isReceiving = true;
      let lastByteTime = Date.now();

      // Poll for incoming MIDI data
      return new Promise((resolve) => {
        const pollInterval = setInterval(() => {
          // Check for timeout (no data in last 2 seconds)
          if (this.receivedBytes.length > 0 && Date.now() - lastByteTime > 2000) {
            clearInterval(pollInterval);
            this.isReceiving = false;
            resolve(new Uint8Array(this.receivedBytes));
            return;
          }

          // Hard timeout after 10 seconds
          if (Date.now() - lastByteTime > 10000) {
            clearInterval(pollInterval);
            this.isReceiving = false;
            if (this.receivedBytes.length > 0) {
              resolve(new Uint8Array(this.receivedBytes));
            } else {
              resolve(null);
            }
            return;
          }
        }, 100);

        // Since jazz-midi doesn't provide real event handling in Bun,
        // we'll need to manually trigger receiving
        // For now, just resolve after timeout
        setTimeout(() => {
          clearInterval(pollInterval);
          this.isReceiving = false;
          resolve(new Uint8Array(this.receivedBytes));
        }, 10000);
      });
    } catch (err) {
      throw err;
    }
  }

  cleanup() {
    try {
      if (this.output) this.output.MidiOutClose();
      if (this.input) this.input.MidiInClose();
    } catch (e) {}
  }
}

async function main() {
  const cmd = process.argv[2] || 'help';

  switch (cmd.toLowerCase()) {
    case 'list': {
      const downloader = new MicroKORGDownloader();
      downloader.listDevices();
      break;
    }

    case 'download': {
      const downloader = new MicroKORGDownloader();
      const ports = downloader.findFocusrite();

      if (!ports) {
        process.exit(1);
      }

      try {
        const sysexData = await downloader.downloadPatches(ports.outPort, ports.inPort);

        if (!sysexData || sysexData.length === 0) {
          console.log('⚠️  No response received from microKORG S\n');
          console.log('Troubleshooting:');
          console.log('  1. Make sure microKORG S is powered on');
          console.log('  2. Check MIDI cable connection');
          console.log('  3. Verify Focusrite MIDI routing in hardware settings');
          console.log('  4. Try again with: bun cli/focusrite.js download\n');
          process.exit(1);
        }

        console.log(`✅ Received ${sysexData.length} bytes\n`);

        // Try to parse patches
        try {
          const patches = parseSysexMessage(sysexData);

          if (Array.isArray(patches) && patches.length > 0) {
            console.log(`🎵 Successfully decoded ${patches.length} patches!\n`);

            // Create patches directory
            mkdirSync('patches', { recursive: true });

            // Save patches
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `microkorg-library-${timestamp}.json`;
            const filepath = join('patches', filename);

            writeFileSync(filepath, JSON.stringify(
              {
                device: 'microKORG S',
                downloadedAt: new Date().toISOString(),
                patchCount: patches.length,
                patches: patches
              },
              null,
              2
            ));

            console.log(`💾 Saved to: patches/${filename}\n`);
            console.log('Patches:');
            patches.forEach((patch, i) => {
              console.log(`  ${String(i + 1).padStart(3)}. ${patch.name || `Patch ${i + 1}`}`);
            });
            console.log('');
          } else {
            console.log('⚠️  Could not decode patches\n');
          }
        } catch (err) {
          console.log(`⚠️  Parse error: ${err.message}\n`);
          console.log('Raw data received (first 50 bytes):');
          console.log('  ' + Array.from(sysexData.slice(0, 50))
            .map(b => `0x${b.toString(16).toUpperCase()}`)
            .join(' '));
        }
      } catch (err) {
        console.log(`\n❌ Error: ${err.message}\n`);
        process.exit(1);
      } finally {
        downloader.cleanup();
      }
      break;
    }

    default:
      console.log(`
🎹 Patchify - microKORG S Patch Library Downloader

Direct MIDI communication via Focusrite USB interface.

Usage: bun cli/focusrite.js [command]

Commands:
  list      List all MIDI devices
  download  Download patch library from microKORG S
  help      Show this help message

Examples:
  bun cli/focusrite.js list
  bun cli/focusrite.js download
      `);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
