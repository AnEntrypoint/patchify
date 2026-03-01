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
    // Convert 8-bit data to 7-bit MIDI format
    const result = [];
    let bitBuffer = 0;
    let bitCount = 0;

    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      for (let bit = 7; bit >= 0; bit--) {
        bitBuffer = (bitBuffer << 1) | ((byte >> bit) & 1);
        bitCount++;

        if (bitCount === 7) {
          result.push(bitBuffer & 0x7F);
          bitBuffer = 0;
          bitCount = 0;
        }
      }
    }

    if (bitCount > 0) {
      result.push((bitBuffer << (7 - bitCount)) & 0x7F);
    }

    return Buffer.from(result);
  }

  sendPatchIndividually(patchNum, patchData) {
    return new Promise((resolve) => {
      // STEP 1: Send patch data with function code 0x40 (Current Program Data Dump)
      // Format: F0 42 3g 58 40 [7-bit encoded patch data] F7
      const encoded = this.encode7bit(patchData);
      const step1Header = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x40]);
      const step1End = Buffer.from([0xF7]);
      const step1Sysex = Buffer.concat([step1Header, encoded, step1End]);

      const filename1 = `temp-patch-${patchNum}-step1.syx`;
      fs.writeFileSync(filename1, step1Sysex);

      const proc1 = spawn(this.erriez, ['-t', filename1, '-p', this.focusritePort.toString()]);

      proc1.on('close', () => {
        if (fs.existsSync(filename1)) fs.unlinkSync(filename1);

        // STEP 2: Send program write request with function code 0x11
        // Format: F0 42 3g 58 11 00 0ppppppp F7 (where ppppppp = program number)
        const step2Header = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x11, 0x00]);
        const programNum = Buffer.from([patchNum & 0x7F]); // Program number 0-127
        const step2End = Buffer.from([0xF7]);
        const step2Sysex = Buffer.concat([step2Header, programNum, step2End]);

        const filename2 = `temp-patch-${patchNum}-step2.syx`;
        fs.writeFileSync(filename2, step2Sysex);

        const proc2 = spawn(this.erriez, ['-t', filename2, '-p', this.focusritePort.toString()]);

        let step2Done = false;
        proc2.on('close', (code) => {
          step2Done = true;
          if (fs.existsSync(filename2)) fs.unlinkSync(filename2);
          process.stdout.write('.');
          resolve(true);
        });

        setTimeout(() => {
          if (!step2Done) {
            proc2.kill();
            if (fs.existsSync(filename2)) fs.unlinkSync(filename2);
            process.stdout.write('T');
            resolve(false);
          }
        }, 5000);
      });

      setTimeout(() => {
        proc1.kill();
        if (fs.existsSync(filename1)) fs.unlinkSync(filename1);
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
