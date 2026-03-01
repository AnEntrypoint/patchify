#!/usr/bin/env node

/**
 * Upload Factory Backup to microKORG
 * Tests if the factory backup file format is accepted by the hardware
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FactoryBackupUploader {
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

  async sendBackup(filename) {
    return new Promise((resolve) => {
      if (!fs.existsSync(filename)) {
        console.error(`❌ File not found: ${filename}\n`);
        resolve(false);
        return;
      }

      const fileSize = fs.statSync(filename).size;
      console.log(`📦 Backup file: ${path.basename(filename)}`);
      console.log(`   Size: ${(fileSize / 1024).toFixed(1)} KB\n`);

      console.log('📤 Sending SysEx to microKORG...');
      console.log('   (This takes about 20-30 seconds)\n');

      const proc = spawn(this.erriez, ['-t', filename, '-p', this.focusritePort.toString()]);

      let output = '';
      let errors = '';

      proc.stdout.on('data', (data) => {
        const str = data.toString();
        output += str;
        if (str.includes('100%')) {
          process.stdout.write('.');
        }
      });

      proc.stderr.on('data', (data) => {
        errors += data.toString();
      });

      proc.on('close', (code) => {
        console.log('\n');

        const isDone = output.includes('Done (');

        if (code === 0 && isDone) {
          console.log('✅ SysEx transmission successful!\n');

          const timeMatch = output.match(/Done \(([\\d.]+) ms\)/);
          if (timeMatch) {
            console.log(`   Transfer time: ${timeMatch[1]}ms`);
          }

          resolve(true);
        } else if (isDone) {
          console.log('✅ SysEx transmission successful!\n');
          const timeMatch = output.match(/Done \(([\\d.]+) ms\)/);
          if (timeMatch) {
            console.log(`   Transfer time: ${timeMatch[1]}ms`);
          }
          resolve(true);
        } else {
          console.log('⚠️  Transmission unclear');
          if (output.length > 0) console.log('Output:', output);
          if (errors.length > 0) console.log('Details:', errors);
          resolve(false);
        }
      });

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
  console.log('🎹 microKORG Factory Backup Restore Test');
  console.log('='.repeat(70) + '\n');

  const uploader = new FactoryBackupUploader();

  const found = await uploader.detectMidiPorts();
  if (!found) {
    console.log('Please connect your microKORG via USB MIDI and try again.\n');
    process.exit(1);
  }

  console.log('⚠️  IMPORTANT:');
  console.log('   • microKORG must be powered on');
  console.log('   • MIDI cable must be connected to Focusrite');
  console.log('   • This will RESTORE FACTORY PATCHES\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('💾 Continue with factory restore? (yes/no): ', async (answer) => {
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Cancelled\n');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🚀 UPLOADING FACTORY BACKUP...');
    console.log('='.repeat(70) + '\n');

    const success = await uploader.sendBackup('FactoryBackUpDoResetAfter.syx');

    if (success) {
      console.log('='.repeat(70));
      console.log('✅ FACTORY BACKUP SENT!');
      console.log('='.repeat(70) + '\n');

      console.log('⏳ microKORG is reprogramming its memory...');
      console.log('   (Wait 30 seconds before power cycling)\n');

      console.log('Then:');
      console.log('   1. Power cycle your microKORG');
      console.log('   2. Check if original factory patches returned');
      console.log('   3. This confirms the file format works!\n');

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
