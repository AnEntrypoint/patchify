#!/usr/bin/env node

const patches = require('./patches-data.cjs');

// Show raw config for first few patches
console.log('=== RAW PATCH CONFIGS ===\n');

[0, 1, 8, 64].forEach(i => {
  const patch = patches[i];
  const bank = String.fromCharCode(65 + Math.floor(i / 64));
  const num = (i % 64) + 1;
  
  console.log(`${bank}.${num}: ${patch.name}`);
  console.log(JSON.stringify(patch, null, 2));
  console.log('');
});
