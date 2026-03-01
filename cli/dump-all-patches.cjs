#!/usr/bin/env node

/**
 * Dump all 256 patches from microKORG S to understand the actual format
 * The factory backup might be for original (128 patches), but S has 256
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PatchDumper {
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
          if (line.includes('MIDI input ports:')) {
            inOutputSection = true;
            continue;
          }
          if (inOutputSection && line.includes('Focusrite')) {
            const portMatch = line.match(/^\s*(\d+):/);
            if (portMatch) {
              this.focusritePort = parseInt(portMatch[1]);
              console.log(`✅ Found Focusrite Input: Port ${this.focusritePort}`);
              console.log(`   (${line.trim()})\n`);
              resolve(true);
              return;
            }
          }
        }

        console.log('❌ Focusrite USB MIDI input not found!\n');
        resolve(false);
      });
    });
  }

  sendDumpRequest() {
    return new Promise((resolve) => {
      console.log('📤 Sending DUMP REQUEST to microKORG S...');
      console.log('   (Asking hardware to send all 256 patches)\n');

      // Request ALL DATA: F0 42 30 58 0F F7
      const dumpRequest = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x0F, 0xF7]);
      const testFile = 'dump-request.syx';

      fs.writeFileSync(testFile, dumpRequest);

      const proc = spawn(this.erriez, ['-r', testFile, '-p', this.focusritePort.toString(), '-t', '30']);

      let output = '';
      let errors = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write('.');
      });

      proc.stderr.on('data', (data) => {
        errors += data.toString();
      });

      proc.on('close', (code) => {
        console.log('\n');
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

        if (code === 0 && fs.existsSync('dump-request-input.syx')) {
          console.log('✅ Received data from microKORG S!\n');

          const received = fs.readFileSync('dump-request-input.syx');
          console.log(`📦 Dump file size: ${received.length} bytes`);
          console.log(`   Expected for 256 patches: ${5 + (256 * 254) + 3902 + 1} bytes`);
          console.log(`   Expected for 128 patches: ${5 + (128 * 254) + 3902 + 1} bytes\n`);

          // Save for analysis
          fs.renameSync('dump-request-input.syx', 'patches/microkorg-s-full-dump.syx');
          console.log('💾 Saved to: patches/microkorg-s-full-dump.syx\n');

          // Analyze
          const header = Array.from(received.slice(0, 5)).map(b => b.toString(16).padStart(2, '0')).join(' ');
          console.log(`Header: ${header}`);
          console.log(`Function code: 0x${received[4].toString(16).toUpperCase()}`);

          resolve(true);
        } else {
          console.log('❌ Failed to receive dump');
          if (errors) console.log('Error:', errors);
          resolve(false);
        }
      });

      setTimeout(() => {
        proc.kill();
        console.log('\n⏱️  Timeout waiting for response\n');
        resolve(false);
      }, 35000);
    });
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🎹 microKORG S - Dump All 256 Patches');
  console.log('='.repeat(70) + '\n');

  const dumper = new PatchDumper();

  const found = await dumper.detectMidiPort();
  if (!found) {
    console.log('Cannot dump without Focusrite input connection.\n');
    process.exit(1);
  }

  console.log('⚠️  IMPORTANT:');
  console.log('   • microKORG S must be powered on');
  console.log('   • MIDI cable must be connected');
  console.log('   • Hardware will send back ALL 256 patches');
  console.log('   • This may take 30+ seconds\n');

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

    const success = await dumper.sendDumpRequest();

    if (success) {
      console.log('NEXT STEPS:');
      console.log('  1. Analyze patches/microkorg-s-full-dump.syx');
      console.log('  2. Compare with factory backup');
      console.log('  3. Regenerate our custom library to match actual S format\n');
      process.exit(0);
    } else {
      console.log('Failed to dump patches\n');
      process.exit(1);
    }
  });
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
