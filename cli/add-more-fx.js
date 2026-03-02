#!/usr/bin/env node

const fs = require('fs');

// Read refactored patches
let content = fs.readFileSync('cli/patches-data-refactored.cjs', 'utf8');

// Add delay and/or mod to pads that don't have them
// Strategy: Find patches in pads section (around line 250+) and add effects

const lines = content.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this is a patch definition line (starts with {name:)
  const isPatch = line.trim().startsWith('{ name:');
  
  if (isPatch) {
    // Extract line number (roughly where we are)
    const patchNum = newLines.filter(l => l.trim().startsWith('{ name:')).length;
    const bankNum = Math.floor(patchNum / 64);
    const bankLetter = String.fromCharCode(65 + bankNum);
    const patchInBank = patchNum % 64;
    
    // Bank C is pads (patches 128-191), Bank D is FX (192-255)
    const inPads = bankNum === 2;
    const inFX = bankNum === 3;
    
    if (inPads || inFX) {
      // Check if this patch already has delay or mod
      const hasDelay = line.includes('delayTime') || line.includes('delayDepth');
      const hasMod = line.includes('modRate') || line.includes('modDepth');
      
      // Add FX to ~50% of pads and ~60% of FX
      const shouldAddFX = inPads ? (patchInBank % 2 === 0) : (patchInBank % 3 !== 2);
      
      if (shouldAddFX && !hasDelay && !hasMod) {
        // Remove trailing comma and }, then add FX
        let modified = line.trim();
        if (modified.endsWith(',')) modified = modified.slice(0, -1);
        if (modified.endsWith('}')) modified = modified.slice(0, -1).trim();
        if (modified.endsWith(',')) modified = modified.slice(0, -1);
        
        // Add appropriate FX based on patch type
        if (inPads) {
          // Pads: add subtle delay
          modified += `, delayTime:${20 + patchInBank % 20}, delayDepth:${8 + patchInBank % 12} }`;
        } else {
          // FX: add more dramatic FX
          const fxType = patchInBank % 3;
          if (fxType === 0) {
            modified += `, delayTime:${30 + patchInBank % 30}, delayDepth:${15 + patchInBank % 20} }`;
          } else if (fxType === 1) {
            modified += `, modRate:${40 + patchInBank % 30}, modDepth:${12 + patchInBank % 15} }`;
          } else {
            modified += `, delayTime:${25 + patchInBank % 20}, delayDepth:${10 + patchInBank % 15}, modRate:${30 + patchInBank % 20}, modDepth:${8 + patchInBank % 10} }`;
          }
        }
        
        newLines.push(modified);
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  } else {
    newLines.push(line);
  }
}

content = newLines.join('\n');

// Replace the original file
fs.writeFileSync('cli/patches-data.cjs', content);

console.log('✅ Updated patches-data.cjs with more FX');
console.log('  ✓ Pads now have delay effects');
console.log('  ✓ FX section has more delay/mod combinations');

// Verify
const patches = require('./patches-data.cjs');
const withDelay = patches.filter(p => p.delayTime || p.delayDepth).length;
const withMod = patches.filter(p => p.modRate || p.modDepth).length;

console.log(`\nFX Coverage:`);
console.log(`  Patches with delay: ${withDelay}/256`);
console.log(`  Patches with mod: ${withMod}/256`);
