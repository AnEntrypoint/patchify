#!/usr/bin/env node

/**
 * Send patches ONE-BY-ONE to microKORG S
 * Since bulk dumps don't work but individual patches do
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class IndividualPatchSender {
  constructor() {
    this.erriez = path.join(__dirname, '../erriez-midi-sysex-io.exe');
    this.focusritePort = null;
  }

  detectMidiPort() {
    return new Promise((resolve) => {
      console.log('🔍 Detecting MIDI ports...\n');

      const proc = spawn(this.erriez, ['-l']);
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', () => {
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
              console.log(`✅ Found Focusrite Output: Port ${this.focusritePort}\n`);
              resolve(true);
              return;
            }
          }
        }

        console.log('❌ Focusrite not found\n');
        resolve(false);
      });
    });
  }

  encode7bit(data) {
    // Correct 7-bit MIDI encoding per Korg spec:
    // 7 bytes of 8-bit data → 8 bytes of 7-bit data
    // Process in groups of 7 bytes
    const result = [];

    let i = 0;
    while (i < data.length) {
      // Get up to 7 bytes
      const groupSize = Math.min(7, data.length - i);
      const bytes = [];

      for (let j = 0; j < groupSize; j++) {
        bytes.push(data[i + j]);
      }

      // Extract MSBs (bit 7) from each byte
      let msbs = 0;
      for (let j = 0; j < groupSize; j++) {
        if (bytes[j] & 0x80) {
          msbs |= (1 << j);
        }
      }

      // Output MSB byte (only lower 7 bits used)
      result.push(msbs & 0x7F);

      // Output remaining 7 bits of each byte
      for (let j = 0; j < groupSize; j++) {
        result.push(bytes[j] & 0x7F);
      }

      // If last group has fewer than 7 bytes, pad with a zero
      if (groupSize < 7) {
        result.push(0);
      }

      i += 7;
    }

    return Buffer.from(result);
  }

  sendPatchIndividually(patchNum, patchData) {
    return new Promise((resolve) => {
      // SINGLE STEP: Send program write request with function code 0x11
      // INCLUDING the patch data in the same message
      // Format: F0 42 30 58 11 00 0ppppppp [7-bit encoded patch data] F7
      // (0x40 is a RESPONSE code, not a SEND code)

      const encoded = this.encode7bit(patchData);
      const header = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x11, 0x00]);
      const programNum = Buffer.from([patchNum & 0x7F]); // Program number 0-127
      const end = Buffer.from([0xF7]);
      const sysex = Buffer.concat([header, programNum, encoded, end]);

      const filename = `temp-patch-${patchNum}.syx`;
      fs.writeFileSync(filename, sysex);

      const proc = spawn(this.erriez, ['-t', filename, '-p', this.focusritePort.toString()]);

      let done = false;
      proc.on('close', (code) => {
        done = true;
        if (fs.existsSync(filename)) fs.unlinkSync(filename);
        process.stdout.write('.');
        resolve(true);
      });

      setTimeout(() => {
        if (!done) {
          proc.kill();
          if (fs.existsSync(filename)) fs.unlinkSync(filename);
          process.stdout.write('T');
          resolve(false);
        }
      }, 5000);
    });
  }

  async sendAllPatches(libraryFile) {
    const data = fs.readFileSync(libraryFile);

    // Skip header (5 bytes), extract patches (256 × 254 bytes)
    const patchStart = 5;
    const patchSize = 254;
    const totalPatches = 256;

    console.log(`📤 Sending ${totalPatches} patches to microKORG S (one at a time)...\n`);
    console.log('Progress: ');

    let successCount = 0;
    for (let i = 0; i < totalPatches; i++) {
      const patchOffset = patchStart + (i * patchSize);
      const patchData = data.slice(patchOffset, patchOffset + patchSize);

      const success = await this.sendPatchIndividually(i, patchData);
      if (success) successCount++;

      if ((i + 1) % 32 === 0) {
        console.log(` [${i + 1}/${totalPatches}]`);
      }
    }

    console.log(`\n\n✅ Sent ${successCount}/${totalPatches} patches successfully`);
    return successCount === totalPatches;
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🎹 Send Patches One-By-One to microKORG S');
  console.log('='.repeat(70) + '\n');

  const sender = new IndividualPatchSender();

  const found = await sender.detectMidiPort();
  if (!found) {
    console.log('Cannot send without Focusrite output connection.\n');
    process.exit(1);
  }

  // Find latest library file
  const patchDir = 'patches';
  const files = fs.readdirSync(patchDir).filter(f => f.startsWith('custom-library-') && f.endsWith('.syx'));

  if (files.length === 0) {
    console.error('❌ No library file found');
    process.exit(1);
  }

  const libraryFile = path.join(patchDir, files.sort().reverse()[0]);

  console.log(`📦 Library file: ${path.basename(libraryFile)}`);
  const stats = fs.statSync(libraryFile);
  console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB\n`);

  console.log('⚠️  This will send all 256 patches (may take 5-10 minutes)');
  console.log('   microKORG S must be powered on and SysEx enabled\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Continue? (yes/no): ', async (answer) => {
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\nCancelled\n');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(70) + '\n');

    const success = await sender.sendAllPatches(libraryFile);

    console.log('\n' + '='.repeat(70));
    if (success) {
      console.log('✅ All patches sent! Power cycle microKORG S to apply.');
    } else {
      console.log('⚠️  Some patches may have failed. Check results above.');
    }
    console.log('='.repeat(70) + '\n');

    process.exit(success ? 0 : 1);
  });
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
