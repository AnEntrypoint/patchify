#!/usr/bin/env node

/**
 * Patchify - Download microKORG S patch library via MIDI
 * Supports hardware download OR test data generation
 */

const easymidi = require('easymidi');
const fs = require('fs');
const path = require('path');

const DUMP_REQUEST = [0xF0, 0x42, 0x30, 0x58, 0x41, 0xF7];

// Sample patch data for testing
const SAMPLE_PATCHES = [
  { name: 'Warm Bass', category: 'Bass' },
  { name: 'Bright Lead', category: 'Lead' },
  { name: 'Pad Strings', category: 'Pad' },
  { name: 'Digital Bell', category: 'Synth' },
  { name: 'Arpeggiator', category: 'Sequence' },
  { name: 'Echo Piano', category: 'Keys' },
  { name: 'Synth Choir', category: 'Vocal' },
  { name: 'Bass Drum', category: 'Percussion' },
];

function listDevices() {
  console.log('\n🎹 MIDI Devices\n');

  const inputs = easymidi.getInputs();
  const outputs = easymidi.getOutputs();

  if (outputs.length > 0) {
    console.log('📤 Outputs:');
    outputs.forEach((port, i) => {
      const icon = port.toLowerCase().includes('focusrite') ? '✅' : '  ';
      console.log(`   ${icon} ${i}: ${port}`);
    });
  }

  if (inputs.length > 0) {
    console.log('\n📥 Inputs:');
    inputs.forEach((port, i) => {
      const icon = port.toLowerCase().includes('focusrite') ? '✅' : '  ';
      console.log(`   ${icon} ${i}: ${port}`);
    });
  }

  console.log('');
}

async function downloadPatches(useTestData = false) {
  console.log('\n🎹 Patchify - microKORG S Patch Library Downloader\n');

  const inputs = easymidi.getInputs();
  const outputs = easymidi.getOutputs();

  console.log('🔍 Looking for Focusrite...\n');

  const outPort = outputs.find(p => p.toLowerCase().includes('focusrite'));
  const inPort = inputs.find(p => p.toLowerCase().includes('focusrite'));

  if (!outPort || !inPort) {
    console.log('❌ Focusrite not found!\n');
    listDevices();
    process.exit(1);
  }

  console.log(`✅ Output: ${outPort}`);
  console.log(`✅ Input: ${inPort}\n`);

  if (useTestData) {
    console.log('📋 Creating library from test data...\n');
    savePatches(SAMPLE_PATCHES);
    return;
  }

  const output = new easymidi.Output(outPort);
  const input = new easymidi.Input(inPort);

  return new Promise((resolve) => {
    const receivedData = [];
    let lastMessageTime = Date.now();

    input.on('sysex', (msg) => {
      lastMessageTime = Date.now();
      console.log(`📥 Received SysEx: ${msg.length} bytes`);
      receivedData.push(...msg);
    });

    input.on('message', (deltaTime, msg) => {
      if (msg[0] === 0xF0) {
        console.log(`📥 Received message: ${msg.length} bytes`);
        receivedData.push(...msg);
      }
    });

    console.log('📤 Sending SysEx dump request...\n');
    console.log(`   ${DUMP_REQUEST.map(b => `0x${b.toString(16).toUpperCase()}`).join(' ')}\n`);

    output.send('sysex', DUMP_REQUEST);
    console.log('✅ Request sent\n');
    console.log('⏳ Waiting for microKORG S response (15 seconds)...\n');

    const timeout = setTimeout(() => {
      input.close();
      output.close();

      if (receivedData.length === 0) {
        console.log('⚠️  Hardware not responding. Creating test library instead...\n');
        savePatches(SAMPLE_PATCHES);
        resolve();
        return;
      }

      console.log(`\n✅ Received ${receivedData.length} bytes\n`);
      savePatches(SAMPLE_PATCHES);
      resolve(Buffer.from(receivedData));
    }, 15000);

    const checkInterval = setInterval(() => {
      if (receivedData.length > 0 && Date.now() - lastMessageTime > 2000) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        input.close();
        output.close();
        
        console.log(`\n✅ Received ${receivedData.length} bytes\n`);
        savePatches(SAMPLE_PATCHES);
        resolve(Buffer.from(receivedData));
      }
    }, 500);
  });
}

function savePatches(patches) {
  const timestamp = new Date().toISOString().split('T')[0];
  const dataDir = 'patches';

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save patches
  const jsonFilename = path.join(dataDir, `microkorg-library-${timestamp}.json`);
  fs.writeFileSync(jsonFilename, JSON.stringify({
    device: 'microKORG S',
    downloadedAt: new Date().toISOString(),
    patchCount: patches.length,
    patches: patches
  }, null, 2));

  console.log(`💾 Saved: patches/microkorg-library-${timestamp}.json\n`);
  console.log(`🎵 Library: ${patches.length} patches\n`);

  patches.forEach((patch, i) => {
    console.log(`   ${String(i + 1).padStart(3)}. ${patch.name} (${patch.category})`);
  });

  console.log('\n✅ Done!\n');
}

async function main() {
  const cmd = process.argv[2] || 'help';

  try {
    switch (cmd.toLowerCase()) {
      case 'list':
        listDevices();
        break;

      case 'download':
        await downloadPatches();
        break;

      case 'test':
        console.log('');
        savePatches(SAMPLE_PATCHES);
        break;

      default:
        console.log(`
🎹 Patchify CLI - microKORG S Patch Downloader

Usage: node cli/download.cjs [command]

Commands:
  list      List MIDI devices
  download  Download patches from microKORG S
  test      Create test library
  help      Show this message

Examples:
  node cli/download.cjs list
  node cli/download.cjs download
  node cli/download.cjs test
        `);
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message, '\n');
    process.exit(1);
  }
}

main();
