#!/usr/bin/env bun

import * as os from 'os';

/**
 * Patchify CLI - Test MIDI communication with microKORG S
 * Usage: bun run cli [command]
 * Commands:
 *   list      - List all MIDI devices
 *   dump      - Request patch dump from microKORG S
 *   help      - Show this help message
 */

// For now, log a message since we can't directly access Web MIDI API from CLI
// We'll use the server's /api/sysex/request endpoint instead

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function listDevices() {
  console.log('🎹 Listing MIDI devices...');
  console.log('(Note: Cannot directly enumerate MIDI devices from CLI)');
  console.log('(Use the web app at http://localhost:3000 to see connected devices)\n');

  // Try to fetch from server endpoint
  try {
    const res = await fetch(`${API_BASE}/api/midi/devices`);
    if (res.ok) {
      const data = await res.json();
      console.log('📱 Connected MIDI Devices:');
      if (data.inputs && data.inputs.length > 0) {
        console.log('\n🎙️  Inputs:');
        data.inputs.forEach((input, i) => {
          console.log(`  ${i + 1}. ${input.name} (ID: ${input.id})`);
        });
      }
      if (data.outputs && data.outputs.length > 0) {
        console.log('\n🎚️  Outputs:');
        data.outputs.forEach((output, i) => {
          console.log(`  ${i + 1}. ${output.name} (ID: ${output.id})`);
        });
      }
    } else {
      console.log('⚠️  Could not fetch MIDI devices from server');
    }
  } catch (err) {
    console.log('⚠️  Server not running. Start server with: bun run start');
  }
}

async function getSysexRequest() {
  console.log('📤 Getting SysEx dump request from server...\n');

  try {
    const res = await fetch(`${API_BASE}/api/sysex/request`);
    const data = await res.json();

    if (data.hex) {
      console.log('✅ SysEx Dump Request:');
      console.log(`   ${data.hex}`);
      console.log('\n📝 Format breakdown:');
      console.log('   F0        = SysEx start');
      console.log('   42        = Korg manufacturer ID');
      console.log('   30        = Device channel (0x30 = channel 0)');
      console.log('   58        = microKORG product ID');
      console.log(`   ${data.hex.split(' ')[4]} = Function code (${data.hex.split(' ')[4] === '41' ? '0x41 = DUMP REQUEST ✅' : '0x0F = UNKNOWN ❌'})`);
      console.log('   F7        = SysEx end');
    } else if (data.error) {
      console.log('❌ Error:', data.error);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    console.log('⚠️  Make sure server is running: bun run start');
  }
}

async function main() {
  const cmd = process.argv[2] || 'help';

  switch (cmd.toLowerCase()) {
    case 'list':
      await listDevices();
      break;
    case 'dump':
      await getSysexRequest();
      break;
    case 'help':
    case '-h':
    case '--help':
    default:
      console.log(`
🎹 Patchify CLI - microKORG S Patch Manager

Usage: bun run cli [command]

Commands:
  list       List connected MIDI devices
  dump       Get SysEx dump request bytes
  help       Show this help message

Examples:
  bun run cli list
  bun run cli dump
      `);
  }
}

main().catch(console.error);
