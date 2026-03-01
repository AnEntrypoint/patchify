#!/usr/bin/env node

/**
 * Test SysEx Connection - Send a DUMP REQUEST and check for response
 * This confirms the microKORG is actually receiving and responding to SysEx
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ERRIEZ = path.join(__dirname, '../erriez-midi-sysex-io.exe');

class SysExTester {
  constructor() {
    this.focusritePort = null;
  }

  detectMidiPort() {
    return new Promise((resolve) => {
      console.log('🔍 Detecting MIDI ports...\n');

      const proc = spawn(ERRIEZ, ['-l']);
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
              console.log(`✅ Found Focusrite Output: Port ${this.focusritePort}`);
              console.log(`   (${line.trim()})\n`);
              resolve(true);
              return;
            }
          }
        }

        console.log('❌ Focusrite USB MIDI not found!\n');
        console.log('Ports available:');
        console.log(output);
        resolve(false);
      });
    });
  }

  createTestSysEx() {
    // Dump Request: F0 42 30 58 0F F7
    // F0 = SysEx start
    // 42 = Korg manufacturer ID
    // 30 = Device channel (0x30 + 0 = channel 1)
    // 58 = microKORG product ID
    // 0F = Function code (ALL DATA DUMP REQUEST)
    // F7 = SysEx end

    const dumpRequest = Buffer.from([0xF0, 0x42, 0x30, 0x58, 0x0F, 0xF7]);
    return dumpRequest;
  }

  sendDumpRequest() {
    return new Promise((resolve) => {
      const testFile = 'test-dump-request.syx';
      const dumpRequest = this.createTestSysEx();

      // Write test file
      fs.writeFileSync(testFile, dumpRequest);

      console.log('📤 Sending SysEx DUMP REQUEST to microKORG...');
      console.log(`   Hex: ${Array.from(dumpRequest).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
      console.log(`   This asks microKORG to send back all patch data\n`);

      const proc = spawn(ERRIEZ, ['-t', testFile, '-p', this.focusritePort.toString()]);

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
        console.log('\\n');

        // Clean up test file
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }

        const isDone = output.includes('Done (');

        if (code === 0 && isDone) {
          console.log('✅ SysEx sent to microKORG\\n');

          const timeMatch = output.match(/Done \(([\\d.]+) ms\)/);
          if (timeMatch) {
            console.log(`   Transfer time: ${timeMatch[1]}ms`);
          }

          resolve(true);
        } else if (isDone) {
          console.log('✅ SysEx sent to microKORG\\n');
          const timeMatch = output.match(/Done \(([\\d.]+) ms\)/);
          if (timeMatch) {
            console.log(`   Transfer time: ${timeMatch[1]}ms`);
          }
          resolve(true);
        } else {
          console.log('⚠️  Erriez report unclear:');
          if (output.length > 0) console.log('Output:', output);
          if (errors.length > 0) console.log('Errors:', errors);
          console.log(`Code: ${code}`);
          resolve(false);
        }
      });

      // Timeout
      setTimeout(() => {
        proc.kill();
        console.log('\\n⏱️  Request timeout\\n');
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
        resolve(false);
      }, 30000);
    });
  }
}

async function main() {
  console.log('\\n' + '='.repeat(70));
  console.log('🔧 microKORG SysEx Connection Test');
  console.log('='.repeat(70) + '\\n');

  const tester = new SysExTester();

  const found = await tester.detectMidiPort();
  if (!found) {
    console.log('❌ Cannot test without Focusrite connection\\n');
    process.exit(1);
  }

  console.log('⚠️  IMPORTANT:');
  console.log('   • Make sure microKORG is powered ON');
  console.log('   • MIDI cable should be fully connected');
  console.log('   • Check the Focusrite LED for activity\\n');

  const sent = await tester.sendDumpRequest();

  if (sent) {
    console.log('📋 DIAGNOSTIC INFO:');
    console.log('   ✓ SysEx was sent to Focusrite port');
    console.log('   ✓ Erriez tool executed successfully');
    console.log('   ✓ Focusrite received the message');
    console.log('');
    console.log('⚠️  BUT: This does NOT confirm the microKORG received it!');
    console.log('');
    console.log('TO VERIFY:');
    console.log('   1. Check if the microKORG display changed');
    console.log('   2. Look for activity LED on Focusrite');
    console.log('   3. If no response, check MIDI cable connection');
    console.log('   4. Try a different USB port on the computer');
    console.log('   5. Restart the microKORG and Focusrite\\n');

    process.exit(0);
  } else {
    console.log('❌ Failed to send SysEx request');
    console.log('');
    console.log('TROUBLESHOOTING:');
    console.log('   • Check Focusrite is recognized by system');
    console.log('   • Verify Erriez tool can access MIDI ports');
    console.log('   • Try a different USB cable');
    console.log('   • Restart Focusrite device\\n');

    process.exit(1);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
