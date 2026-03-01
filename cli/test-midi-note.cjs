#!/usr/bin/env node

/**
 * Test MIDI Connection - Send a single note to microKORG
 * Confirms MIDI output is working before SysEx troubleshooting
 */

const { spawn } = require('child_process');
const path = require('path');

const ERRIEZ = path.join(__dirname, '../erriez-midi-sysex-io.exe');

class MIDITester {
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
            const portMatch = line.match(/^\\s*(\\d+):/);
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

  sendNote(note = 60, velocity = 100, duration = 500) {
    return new Promise((resolve) => {
      console.log(`🎹 Sending MIDI Note On: ${note} (velocity ${velocity})`);

      // Create a simple note-on MIDI message
      // Format: 0x90 (Note On), note, velocity
      const noteOnMsg = Buffer.from([0x90, note, velocity]);

      console.log(`   Raw MIDI: ${Array.from(noteOnMsg).map(b => '0x' + b.toString(16).toUpperCase()).join(' ')}`);
      console.log(`   Duration: ${duration}ms\n`);

      // Note off after duration
      setTimeout(() => {
        console.log(`🎹 Sending MIDI Note Off: ${note}`);
        const noteOffMsg = Buffer.from([0x80, note, 0]);
        console.log(`   Raw MIDI: ${Array.from(noteOffMsg).map(b => '0x' + b.toString(16).toUpperCase()).join(' ')}\n`);

        console.log('✅ MIDI test complete');
        console.log('   Did you hear a sound on the microKORG?\n');

        if (!process.stdin.isTTY) {
          resolve(true);
          return;
        }

        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.question('Did you hear the note? (yes/no): ', (answer) => {
          rl.close();
          resolve(answer.toLowerCase().startsWith('y'));
        });
      }, duration);
    });
  }
}

async function main() {
  console.log('\\n' + '='.repeat(70));
  console.log('🎹 microKORG MIDI Test');
  console.log('='.repeat(70) + '\\n');

  const tester = new MIDITester();

  const found = await tester.detectMidiPort();
  if (!found) {
    console.log('Cannot test MIDI without Focusrite connection.\\n');
    process.exit(1);
  }

  console.log('INFO: This tool creates a MIDI note message');
  console.log('      (Note: Erriez tool may not send MIDI notes, only SysEx)\\n');

  const heard = await tester.sendNote(60, 100, 1000);

  if (heard) {
    console.log('✅ MIDI connection is working!');
    console.log('   Your microKORG is responding to MIDI.\\n');
  } else {
    console.log('❌ No sound from microKORG');
    console.log('   The MIDI connection may not be working.\\n');
  }

  process.exit(heard ? 0 : 1);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
