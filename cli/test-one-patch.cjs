#!/usr/bin/env node

/**
 * Send ONE patch to microKORG and prompt user to test
 * Usage: bun cli/test-one-patch.cjs [patchNumber 0-255]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FOCUSRITE_PORT = 2;
const erriez = path.join(__dirname, '../erriez-midi-sysex-io.exe');

async function sendSysex(bytes) {
  const tmp = `tmp-test-${Date.now()}.syx`;
  fs.writeFileSync(tmp, Buffer.from(bytes));
  return new Promise((resolve) => {
    const proc = spawn(erriez, ['-t', tmp, '-p', FOCUSRITE_PORT.toString()]);
    let output = '';
    proc.stdout.on('data', d => output += d.toString());
    const timer = setTimeout(() => { proc.kill(); if (fs.existsSync(tmp)) fs.unlinkSync(tmp); resolve(false); }, 15000);
    proc.on('close', () => {
      clearTimeout(timer);
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      resolve(output.includes('Done'));
    });
  });
}

async function main() {
  const patchNum = parseInt(process.argv[2] ?? '0');

  const files = fs.readdirSync('patches').filter(f => f.startsWith('custom-library-') && f.endsWith('.syx'));
  if (!files.length) { console.error('No library file found'); process.exit(1); }
  const libraryFile = path.join('patches', files.sort().reverse()[0]);
  const data = fs.readFileSync(libraryFile);

  const patchData = data.slice(5 + patchNum * 254, 5 + patchNum * 254 + 254);

  // Show what's in this patch (first few params)
  console.log(`\n🎹 Patch #${patchNum}`);
  console.log(`   First 16 bytes: ${Array.from(patchData.slice(0,16)).map(b=>'0x'+b.toString(16).padStart(2,'0')).join(' ')}`);
  console.log(`   Has non-zero data: ${patchData.some(b => b !== 0) ? 'YES ✅' : 'NO ❌ (all zeros!)'}\n`);

  if (!patchData.some(b => b !== 0)) {
    console.log('⚠️  WARNING: This patch is all zeros - that is why there is no sound!');
    console.log('   The patch data itself is empty.\n');
    process.exit(1);
  }

  console.log('Sending patch to microKORG...');
  const ok = await sendSysex([0xF0, 0x42, 0x30, 0x58, 0x4C, ...patchData, 0xF7]);
  console.log(ok ? '✅ Sent! Press a key on the microKORG now.' : '✗ Send failed');
}

main().catch(e => { console.error(e.message); process.exit(1); });
