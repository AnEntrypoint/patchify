#!/usr/bin/env node

/**
 * Upload patches AND test each one with a MIDI note
 * If the patch works, you'll hear sound after each upload
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const jazz = require('jazz-midi');

class PatchUploaderWithTest {
  constructor() {
    this.erriez = path.join(__dirname, '../erriez-midi-sysex-io.exe');
    this.focusritePort = null;
    this.focusriteOut = null;
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

  openMidiOut() {
    try {
      const midi = new jazz.MIDI();
      const outputList = midi.MidiOutList();
      
      for (let i = 0; i < outputList.length; i++) {
        if (outputList[i].includes('Focusrite')) {
          this.focusriteOut = midi.MidiOutOpen(i);
          console.log(`✅ Opened Focusrite for MIDI output (port ${i})\n`);
          return true;
        }
      }
    } catch (e) {
      console.log('⚠️  Could not open MIDI for testing (will still upload patches)');
    }
    return false;
  }

  playTestNote() {
    if (!this.focusriteOut) return;
    
    try {
      // Send a test note: C4 (60) with velocity 80
      const noteOn = [0x90, 60, 80];  // Channel 1, Note C4, Velocity 80
      const noteOff = [0x80, 60, 0];  // Channel 1, Note Off
      
      // Play note
      for (const byte of noteOn) {
        require('os').platform() === 'win32' ? 
          require('child_process').execSync(`bun -e "const j = require('jazz-midi'); const m = new j.MIDI(); m.MidiOut(${this.focusritePort}, ${byte});"`, { stdio: 'ignore' }) :
          null;
      }
      
      // Wait a bit
      require('child_process').execSync('sleep 0.5', { stdio: 'ignore' });
      
      // Stop note
      for (const byte of noteOff) {
        require('child_process').execSync(`bun -e "const j = require('jazz-midi'); const m = new j.MIDI(); m.MidiOut(${this.focusritePort}, ${byte});"`, { stdio: 'ignore' });
      }
    } catch (e) {
      // Silently fail - don't interrupt the upload
    }
  }

  encode7bit(data) {
    const result = [];
    let i = 0;
    
    while (i < data.length) {
      const groupSize = Math.min(7, data.length - i);
      const bytes = [];
      
      for (let j = 0; j < groupSize; j++) {
        bytes.push(data[i + j]);
      }
      
      let msbs = 0;
      for (let j = 0; j < groupSize; j++) {
        if (bytes[j] & 0x80) {
          msbs |= (1 << j);
        }
      }
      
      result.push(msbs & 0x7F);
      
      for (let j = 0; j < groupSize; j++) {
        result.push(bytes[j] & 0x7F);
      }
      
      if (groupSize < 7) {
        result.push(0);
      }
      
      i += 7;
    }
    
    return Buffer.from(result);
  }

  sendPatchIndividually(patchNum, patchData) {
    return new Promise((resolve) => {
      // SINGLE MESSAGE PROTOCOL (verified working from alapatch):
      // F0 42 30 58 40 [7-bit encoded patch data] F7
      // The 0x40 code sends patch data to the microKORG

      const encoded = this.encode7bit(patchData);
      const header = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x40]);
      const end = Buffer.from([0xF7]);
      const sysex = Buffer.concat([header, encoded, end]);

      const filename = `temp-patch-${patchNum}.syx`;
      fs.writeFileSync(filename, sysex);

      const proc = spawn(this.erriez, ['-t', filename, '-p', this.focusritePort.toString()]);

      let done = false;
      proc.on('close', (code) => {
        done = true;
        if (fs.existsSync(filename)) fs.unlinkSync(filename);

        // Play test note after upload
        setTimeout(() => {
          this.playTestNote();
          process.stdout.write('♫');
          resolve(true);
        }, 100);
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

    const patchStart = 5;
    const patchSize = 254;
    const totalPatches = 256;

    console.log(`📤 Uploading ${totalPatches} patches (with test notes)...\n`);
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

    console.log(`\n\n✅ Uploaded ${successCount}/${totalPatches} patches`);
    console.log('🎵 If you heard test notes, the patches work!\n');
    return successCount === totalPatches;
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🎹 Upload Patches + Test Each One');
  console.log('='.repeat(70) + '\n');

  const uploader = new PatchUploaderWithTest();

  const found = await uploader.detectMidiPort();
  if (!found) {
    console.log('Cannot send without Focusrite output connection.\n');
    process.exit(1);
  }

  uploader.openMidiOut();

  const libPath = 'patches/custom-library-2026-03-01.syx';
  if (!fs.existsSync(libPath)) {
    console.log(`❌ Library not found: ${libPath}\n`);
    process.exit(1);
  }

  console.log(`📦 Library file: ${libPath}`);
  console.log(`   Size: ${(fs.statSync(libPath).size / 1024).toFixed(1)} KB\n`);

  console.log('⚠️  This will upload all 256 patches (may take 10-15 minutes)');
  console.log('   microKORG S must be powered on with SysEx enabled\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Continue? (yes/no): ', async (answer) => {
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('Cancelled.\n');
      process.exit(0);
    }

    console.log('');
    await uploader.sendAllPatches(libPath);
  });
}

main();
