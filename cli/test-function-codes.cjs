#!/usr/bin/env node

/**
 * Test different SysEx function codes to find the right one for sending patches
 *
 * microKORG SysEx function codes (from various sources):
 * 0x0F = ALL DATA DUMP REQUEST (ask hardware to send all patches)
 * 0x10 = CURRENT PROGRAM DATA DUMP REQUEST
 * 0x1C = PROGRAM DATA DUMP REQUEST
 * 0x40 = CURRENT PROGRAM DATA (edit buffer only - temporary)
 * 0x4C = PROGRAM DATA (sends to storage)
 * 0x4F = ? (unclear)
 * 0x50 = ALL DATA DUMP (response format from hardware)
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('microKORG SysEx Function Code Analysis');
console.log('='.repeat(70) + '\n');

console.log('Known function codes:\n');
console.log('REQUEST codes (we send these to ask hardware for data):');
console.log('  0x0F = ALL DATA DUMP REQUEST');
console.log('  0x10 = CURRENT PROGRAM DATA DUMP REQUEST');
console.log('  0x1C = PROGRAM DATA DUMP REQUEST\n');

console.log('RESPONSE codes (hardware sends these back):');
console.log('  0x40 = CURRENT PROGRAM (edit buffer - TEMPORARY)');
console.log('  0x4C = PROGRAM DATA (to storage)');
console.log('  0x4F = ? (unknown)');
console.log('  0x50 = ALL DATA DUMP (what we used)\n');

console.log('PROBLEM ANALYSIS:');
console.log('  • We used 0x50 (ALL DATA DUMP RESPONSE format)');
console.log('  • But 0x50 is a RESPONSE code, not a SEND code');
console.log('  • When RECEIVING from hardware, it uses 0x50');
console.log('  • When SENDING to hardware, we might need 0x4C or something else\n');

console.log('FACTORY BACKUP inspection:');
const factory = fs.readFileSync('FactoryBackUpDoResetAfter.syx');
const header = Array.from(factory.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ');
console.log(`  Header: ${header}`);
console.log(`  Byte 4 (function code): 0x${factory[4].toString(16).toUpperCase()}`);
console.log(`  This suggests the factory file uses 0x50 format\n`);

console.log('HYPOTHESIS:');
console.log('  Maybe the factory backup file is a RESPONSE (what hardware outputs)');
console.log('  Not a COMMAND (what we should send to hardware)\n');

console.log('NEXT STEPS:');
console.log('  1. Try using 0x4C instead of 0x50');
console.log('  2. Check if microKORG documentation specifies send code');
console.log('  3. Maybe need to send patches individually (0x4C per patch)');
console.log('  4. Or try 0x4F (unknown code - might be the right one)\n');

console.log('='.repeat(70));
