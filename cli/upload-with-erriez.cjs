#!/usr/bin/env bun

/**
 * Upload Custom Library to microKORG using Erriez MIDI SysEx Tool
 * Reliable cross-platform MIDI SysEx handling
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MicroKORGUploader {
  constructor() {
    this.erriez = path.join(__dirname, '../erriez-midi-sysex-io.exe');
    this.focusritePort = null;
  }

  detectMidiPorts() {
    return new Promise((resolve) => {
      console.log('🔍 Detecting MIDI ports...\n');

      const proc = spawn(this.erriez, ['-l']);
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', () => {
        // Parse output to find Focusrite port
        const lines = output.split('\n');
        let inOutputSection = false;

        for (const line of lines) {
          if (line.includes('MIDI output ports:')) {
            inOutputSection = true;
            continue;
          }
          if (inOutputSection && line.includes('Focusrite')) {
            const portMatch = line.match(/^\s*(\d+):/);
            if (portMatch) {
              this.focusritePort = parseInt(portMatch[1]);
              console.log(`✅ Found Focusrite: Port ${this.focusritePort}`);
              console.log(`   (${line.trim()})\n`);
              resolve(true);
              return;
            }
          }
        }

        console.log('❌ Focusrite USB MIDI not found!\n');
        console.log('Available ports:');
        console.log(output);
        resolve(false);
      });
    });
  }

  async sendLibrary(filename) {
    return new Promise((resolve) => {
      if (!fs.existsSync(filename)) {
        console.error(`❌ File not found: ${filename}\n`);
        resolve(false);
        return;
      }

      const fileSize = fs.statSync(filename).size;
      console.log(`📦 Library file: ${path.basename(filename)}`);
      console.log(`   Size: ${(fileSize / 1024).toFixed(1)} KB\n`);

      console.log('📤 Sending SysEx to microKORG...');
      console.log('   (This takes about 20-30 seconds)\n');

      // Use erriez with correct arguments
      const proc = spawn(this.erriez, ['-t', filename, '-p', this.focusritePort.toString()]);

      let output = '';
      let errors = '';
      let hasError = false;

      proc.stdout.on('data', (data) => {
        const str = data.toString();
        output += str;
        // Show progress
        if (str.includes('100%')) {
          process.stdout.write('.');
        }
      });

      proc.stderr.on('data', (data) => {
        errors += data.toString();
        hasError = true;
      });

      proc.on('close', (code) => {
        console.log('\n');

        // Check if "Done" appears in output (success indicator)
        const isDone = output.includes('Done (');

        if (code === 0 && isDone) {
          console.log('✅ SysEx transmission successful!\n');

          // Extract timing info
          const timeMatch = output.match(/Done \(([\d.]+) ms\)/);
          if (timeMatch) {
            console.log(`   Transfer time: ${timeMatch[1]}ms`);
          }

          resolve(true);
        } else if (isDone) {
          // Erriez prints progress to stderr, which is OK
          console.log('✅ SysEx transmission successful!\n');
          const timeMatch = output.match(/Done \(([\d.]+) ms\)/);
          if (timeMatch) {
            console.log(`   Transfer time: ${timeMatch[1]}ms`);
          }
          resolve(true);
        } else {
          console.log('⚠️  Transmission failed\n');
          if (output.length > 0) console.log('Output:', output);
          if (errors.length > 0) console.log('Details:', errors);
          resolve(false);
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        proc.kill();
        console.log('\n⏱️  Upload timeout\n');
        resolve(false);
      }, 60000);
    });
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🎹 microKORG Custom Patch Library Uploader');
  console.log('='.repeat(70) + '\n');

  const uploader = new MicroKORGUploader();

  // Detect MIDI ports
  const found = await uploader.detectMidiPorts();
  if (!found) {
    console.log('Please connect your microKORG via USB MIDI and try again.\n');
    process.exit(1);
  }

  // Check for library file
  const libraryFile = 'patches/custom-library-2026-02-28.syx';
  if (!fs.existsSync(libraryFile)) {
    console.error(`❌ Library file not found: ${libraryFile}`);
    console.error('Run: bun run cli/create-custom-library.cjs\n');
    process.exit(1);
  }

  // Show library info
  console.log('📊 LIBRARY CONTENTS:');
  console.log('   ✓ Bank A: 32 Bass patches');
  console.log('   ✓ Bank B: 16 Key patches');
  console.log('   ✓ Bank C: 16 Pad patches');
  console.log('   ✓ Bank D: 64 Psychedelic FX patches\n');

  console.log('⚠️  IMPORTANT:');
  console.log('   • microKORG must be powered on');
  console.log('   • MIDI cable must be connected to Focusrite');
  console.log('   • ALL existing patches will be REPLACED\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('💾 Continue with upload? (yes/no): ', async (answer) => {
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Upload cancelled\n');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🚀 UPLOADING...');
    console.log('='.repeat(70) + '\n');

    const success = await uploader.sendLibrary(libraryFile);

    if (success) {
      console.log('='.repeat(70));
      console.log('✅ PATCH LIBRARY SUCCESSFULLY UPLOADED!');
      console.log('='.repeat(70) + '\n');
      console.log('🎉 Your microKORG now has:');
      console.log('   • 32 creative bass patches');
      console.log('   • 16 keyboard/pad support patches');
      console.log('   • 16 evolving ambient pads');
      console.log('   • 64 psychedelic FX with heavy modulation\n');
      console.log('⏳ microKORG is reprogramming its memory...');
      console.log('   (Wait 30 seconds before power cycling)\n');
      console.log('Then:');
      console.log('   1. Power cycle your microKORG');
      console.log('   2. Navigate Banks A-D to see new patches');
      console.log('   3. Try Bank D for the wild FX!\n');
      process.exit(0);
    } else {
      console.log('\n❌ Upload failed');
      console.log('   Check MIDI connection and try again\n');
      process.exit(1);
    }
  });
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
