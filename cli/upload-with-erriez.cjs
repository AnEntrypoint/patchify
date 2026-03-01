#!/usr/bin/env bun

/**
 * Upload Custom Library to microKORG using Erriez MIDI SysEx Tool
 * Direct command-line interface to proven MIDI SysEx handling
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MicroKORGUploader {
  constructor() {
    this.erriez = 'C:\\dev\\patchify\\erriez-midi-sysex-io.exe';
  }

  checkErriez() {
    if (!fs.existsSync(this.erriez)) {
      console.error(`❌ Erriez tool not found at: ${this.erriez}`);
      console.error('Download from: https://github.com/Erriez/midi-sysex-io\n');
      return false;
    }
    return true;
  }

  listDevices() {
    return new Promise((resolve) => {
      console.log('\n🔍 Detecting MIDI devices...\n');

      const proc = spawn(this.erriez, ['--list']);
      let output = '';
      let errors = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errors += data.toString();
      });

      proc.on('close', (code) => {
        if (output.length > 0) {
          console.log(output);
        }
        if (errors.length > 0) {
          console.log('Details:', errors);
        }
        resolve();
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
      console.log(`\n📦 Library file: ${path.basename(filename)}`);
      console.log(`   Size: ${fileSize} bytes\n`);

      console.log('📤 Sending SysEx to microKORG...');
      console.log('   (This may take 10-30 seconds)\n');

      // Use erriez to send the file
      const proc = spawn(this.erriez, ['--in', 'Focusrite USB MIDI', '--out', 'Focusrite USB MIDI', '--file', filename]);

      let output = '';
      let errors = '';
      let lastUpdate = Date.now();

      const progressInterval = setInterval(() => {
        if (Date.now() - lastUpdate > 2000) {
          process.stdout.write('.');
          lastUpdate = Date.now();
        }
      }, 100);

      proc.stdout.on('data', (data) => {
        output += data.toString();
        lastUpdate = Date.now();
        process.stdout.write('.');
      });

      proc.stderr.on('data', (data) => {
        errors += data.toString();
      });

      proc.on('close', (code) => {
        clearInterval(progressInterval);

        if (code === 0 || output.includes('success')) {
          console.log('\n\n✅ Upload completed successfully!\n');
          resolve(true);
        } else {
          console.log('\n\n⚠️  Upload finished (check output below)\n');
          if (output.length > 0) console.log('Output:', output);
          if (errors.length > 0) console.log('Errors:', errors);
          resolve(code === 0);
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        proc.kill();
        console.log('\n\n⏱️  Upload timeout\n');
        resolve(false);
      }, 60000);
    });
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🎹 microKORG Custom Patch Library Uploader');
  console.log('='.repeat(70));

  const uploader = new MicroKORGUploader();

  // Check if erriez exists
  if (!uploader.checkErriez()) {
    process.exit(1);
  }

  // List available devices
  await uploader.listDevices();

  // Check for library file
  const libraryFile = path.join(__dirname, '../patches/custom-library-2026-02-28.syx');
  if (!fs.existsSync(libraryFile)) {
    console.error(`❌ Library file not found: ${libraryFile}`);
    console.error('Run: bun run cli/create-custom-library.cjs\n');
    process.exit(1);
  }

  // Show library info
  console.log('\n📊 LIBRARY CONTENTS:');
  console.log('   ✓ Bank A: 32 Bass patches');
  console.log('   ✓ Bank B: 16 Key patches');
  console.log('   ✓ Bank C: 16 Pad patches');
  console.log('   ✓ Bank D: 64 Psychedelic FX patches');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   • microKORG must be powered on');
  console.log('   • MIDI cable must be connected');
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
    console.log('='.repeat(70));

    const success = await uploader.sendLibrary(libraryFile);

    if (success) {
      console.log('='.repeat(70));
      console.log('✅ PATCH LIBRARY SUCCESSFULLY UPLOADED!');
      console.log('='.repeat(70));
      console.log('\n🎉 Your microKORG now has:');
      console.log('   • 32 creative bass patches');
      console.log('   • 16 keyboard/pad support patches');
      console.log('   • 16 evolving ambient pads');
      console.log('   • 64 psychedelic FX with heavy modulation');
      console.log('\n✓ NO arpeggiators (disabled by default)');
      console.log('✓ NO reverb (delay-based effects only)');
      console.log('✓ HEAVY LFO modulation for creative sound design');
      console.log('✓ HIGH resonance for bubble/metallic effects\n');
      console.log('Power cycle your microKORG to confirm the upload.\n');
      process.exit(0);
    } else {
      console.log('\n❌ Upload failed or was interrupted');
      console.log('   Check MIDI connection and try again\n');
      process.exit(1);
    }
  });
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
