#!/usr/bin/env node

/**
 * Debug tool: Compare factory patch with our custom patch
 * to identify where the SysEx protocol is wrong
 */

const fs = require('fs');

console.log('\n' + '='.repeat(70));
console.log('🔍 SysEx Format Debugging');
console.log('='.repeat(70) + '\n');

// Load factory backup
const factory = fs.readFileSync('FactoryBackUpDoResetAfter.syx');

console.log('Factory backup analysis:');
console.log('Total size:', factory.length, 'bytes');
console.log('Header (F0 42...):', Array.from(factory.slice(0, 5)).map(b => '0x' + b.toString(16).toUpperCase()).join(' '));
console.log('End marker:', '0x' + factory[factory.length - 1].toString(16).toUpperCase());

// Extract first factory patch
const factoryPatchStart = 5;
const factoryPatchSize = 254;
const factoryFirstPatch = factory.slice(factoryPatchStart, factoryPatchStart + factoryPatchSize);

console.log('\nFactory first patch (254 bytes):');
console.log('Bytes 0-10:', Array.from(factoryFirstPatch.slice(0, 11)).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
console.log('Non-zero bytes:', Array.from(factoryFirstPatch).filter(b => b !== 0).length);

// Load custom library
const custom = fs.readFileSync('patches/custom-library-2026-03-01.syx');
const customFirstPatch = custom.slice(factoryPatchStart, factoryPatchStart + factoryPatchSize);

console.log('\nCustom first patch (254 bytes):');
console.log('Bytes 0-10:', Array.from(customFirstPatch.slice(0, 11)).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
console.log('Non-zero bytes:', Array.from(customFirstPatch).filter(b => b !== 0).length);

// Test 7-bit encoding
console.log('\n' + '='.repeat(70));
console.log('7-bit Encoding Test');
console.log('='.repeat(70) + '\n');

function encode7bitOld(data) {
  // Old continuous bit-stream (WRONG)
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

function encode7bitNew(data) {
  // New 7-byte grouping (MIGHT BE RIGHT)
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

// Test with first 7 bytes
const test7bytes = customFirstPatch.slice(0, 7);
const oldEncoded = encode7bitOld(test7bytes);
const newEncoded = encode7bitNew(test7bytes);

console.log('Input (first 7 bytes of patch):', Array.from(test7bytes).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
console.log('Old encoding (8 bytes):', Array.from(oldEncoded).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
console.log('New encoding (8 bytes):', Array.from(newEncoded).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));

// Expected size
console.log('\n254-byte patch encoding size check:');
console.log('Old method would produce:', Math.ceil(254 * 8 / 7), 'bytes');
console.log('New method would produce:', Math.ceil(254 * 8 / 7), 'bytes');
console.log('Expected per spec:', 291, 'bytes');

console.log('\n' + '='.repeat(70) + '\n');
