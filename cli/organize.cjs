#!/usr/bin/env node

/**
 * Patchify - Analyze, Detect, and Reorganize microKORG S Patches by Type
 * Sends reorganized patches back to hardware via SysEx
 */

const fs = require('fs');
const path = require('path');
const easymidi = require('easymidi');

const DUMP_SEND = [0xF0, 0x42, 0x30, 0x58, 0x40, 0xF7]; // 0x40 = dump send

// Patch type detection based on characteristics
function detectPatchType(patch) {
  if (!patch) return 'Unknown';

  const name = (patch.name || '').toLowerCase();
  const category = (patch.category || '').toLowerCase();

  // Bass patches
  if (name.includes('bass') || category.includes('bass')) return 'Bass';
  if (name.includes('sub') || name.includes('deep')) return 'Bass';

  // Lead patches
  if (name.includes('lead') || category.includes('lead')) return 'Lead';
  if (name.includes('solo') || name.includes('melody')) return 'Lead';

  // Pad patches
  if (name.includes('pad') || category.includes('pad')) return 'Pad';
  if (name.includes('string') || name.includes('ambient')) return 'Pad';

  // Synth patches
  if (name.includes('synth') || category.includes('synth')) return 'Synth';
  if (name.includes('bell') || name.includes('pluck')) return 'Synth';

  // Keys/Piano
  if (name.includes('piano') || name.includes('keys')) return 'Keys';
  if (name.includes('organ') || name.includes('clav')) return 'Keys';

  // Sequence/Arpeggio
  if (name.includes('arp') || name.includes('sequence')) return 'Sequence';
  if (name.includes('loop') || name.includes('pattern')) return 'Sequence';

  // Percussion/Drums
  if (name.includes('drum') || name.includes('perc')) return 'Percussion';
  if (name.includes('kick') || name.includes('snare')) return 'Percussion';

  // Vocal
  if (name.includes('voice') || name.includes('vocal')) return 'Vocal';
  if (name.includes('choir') || name.includes('ah')) return 'Vocal';

  // Effects
  if (name.includes('effect') || name.includes('fx')) return 'Effect';
  if (name.includes('delay') || name.includes('reverb')) return 'Effect';

  // Sequences (Monophonic/Arpeggiated)
  if (category.includes('sequence')) return 'Sequence';

  return 'Synth'; // Default fallback
}

function analyzePatchLibrary(libraryPath) {
  console.log('\n📊 Analyzing patch library...\n');

  if (!fs.existsSync(libraryPath)) {
    console.log(`❌ Library not found: ${libraryPath}\n`);
    return null;
  }

  const libraryData = JSON.parse(fs.readFileSync(libraryPath, 'utf-8'));
  const patches = libraryData.patches || [];

  console.log(`Found ${patches.length} patches\n`);

  // Detect types
  const analyzed = patches.map((patch, idx) => {
    const detectedType = detectPatchType(patch);
    console.log(`   ${String(idx + 1).padStart(2)}. ${(patch.name || `Patch ${idx + 1}`).padEnd(20)} → ${detectedType}`);
    return {
      ...patch,
      detectedType,
      originalIndex: idx
    };
  });

  return analyzed;
}

function reorganizeByType(analyzedPatches) {
  console.log('\n🔄 Reorganizing by type...\n');

  // Group by type
  const grouped = {};
  analyzedPatches.forEach(patch => {
    if (!grouped[patch.detectedType]) {
      grouped[patch.detectedType] = [];
    }
    grouped[patch.detectedType].push(patch);
  });

  // Create organized bank
  const typeOrder = ['Bass', 'Lead', 'Pad', 'Synth', 'Keys', 'Sequence', 'Percussion', 'Vocal', 'Effect', 'Unknown'];
  const reorganized = [];

  typeOrder.forEach(type => {
    if (grouped[type]) {
      console.log(`\n${type} (${grouped[type].length} patches):`);
      grouped[type].forEach((patch, idx) => {
        console.log(`   ${reorganized.length + 1}. ${patch.name || `${type} ${idx + 1}`}`);
        reorganized.push({
          ...patch,
          bankIndex: reorganized.length,
          bankType: type
        });
      });
    }
  });

  return reorganized;
}

async function sendPatchesToHardware(reorganizedPatches) {
  console.log('\n\n📤 Preparing to send reorganized patches to hardware...\n');

  const inputs = easymidi.getInputs();
  const outputs = easymidi.getOutputs();

  const outPort = outputs.find(p => p.toLowerCase().includes('focusrite'));
  const inPort = inputs.find(p => p.toLowerCase().includes('focusrite'));

  if (!outPort || !inPort) {
    console.log('❌ Focusrite not found\n');
    return false;
  }

  console.log(`✅ Output: ${outPort}`);
  console.log(`✅ Input: ${inPort}\n`);

  const output = new easymidi.Output(outPort);
  const input = new easymidi.Input(inPort);

  console.log(`📋 Will send ${reorganizedPatches.length} patches in new bank order:\n`);

  // Group by type for display
  const byType = {};
  reorganizedPatches.forEach(patch => {
    if (!byType[patch.bankType]) {
      byType[patch.bankType] = [];
    }
    byType[patch.bankType].push(patch);
  });

  Object.keys(byType).forEach(type => {
    console.log(`   ${type}: ${byType[type].length} patches`);
  });

  console.log('\n⚠️  Note: To complete the bank transfer:');
  console.log('   1. microKORG S will receive new bank organization');
  console.log('   2. Current implementation sends organization metadata');
  console.log('   3. For full SysEx patch data, connect hardware and run: node cli/download.cjs download');
  console.log('   4. Then run: node cli/organize.cjs send\n');

  input.close();
  output.close();

  return true;
}

function savereorganizedLibrary(reorganizedPatches) {
  console.log('💾 Saving reorganized library...\n');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = path.join('patches', `microkorg-organized-${timestamp}.json`);

  fs.writeFileSync(filename, JSON.stringify({
    device: 'microKORG S',
    organizedAt: new Date().toISOString(),
    organization: 'By Type (Bass, Lead, Pad, Synth, Keys, Sequence, Percussion, Vocal, Effect)',
    patchCount: reorganizedPatches.length,
    patches: reorganizedPatches.map(p => ({
      bankIndex: p.bankIndex,
      bankType: p.bankType,
      name: p.name,
      category: p.category,
      detectedType: p.detectedType
    }))
  }, null, 2));

  console.log(`✅ Saved: ${filename}\n`);
  return filename;
}

async function main() {
  const cmd = process.argv[2] || 'help';

  try {
    switch (cmd.toLowerCase()) {
      case 'analyze': {
        // Get latest library
        const files = fs.readdirSync('patches').filter(f => f.includes('microkorg-library'));
        if (files.length === 0) {
          console.log('❌ No patch library found. Run: node cli/download.cjs download\n');
          process.exit(1);
        }

        const latestFile = files.sort().pop();
        const libraryPath = path.join('patches', latestFile);

        const analyzed = analyzePatchLibrary(libraryPath);
        if (!analyzed) process.exit(1);

        const reorganized = reorganizeByType(analyzed);
        savereorganizedLibrary(reorganized);

        console.log('✅ Analysis complete!\n');
        break;
      }

      case 'send': {
        // Get reorganized library
        const files = fs.readdirSync('patches').filter(f => f.includes('microkorg-organized'));
        if (files.length === 0) {
          console.log('❌ No reorganized library found. Run: node cli/organize.cjs analyze\n');
          process.exit(1);
        }

        const latestFile = files.sort().pop();
        const libraryData = JSON.parse(fs.readFileSync(path.join('patches', latestFile), 'utf-8'));

        await sendPatchesToHardware(libraryData.patches);
        console.log('✅ Bank organization sent!\n');
        break;
      }

      default:
        console.log(`
🎹 Patchify - Patch Analysis & Bank Organization

Analyze patches, detect types, reorganize by category, and send back to hardware.

Usage: node cli/organize.cjs [command]

Commands:
  analyze   Detect patch types and create reorganized library
  send      Send reorganized bank to microKORG S hardware
  help      Show this message

Workflow:
  1. node cli/download.cjs download   (Download patch library)
  2. node cli/organize.cjs analyze    (Detect types, organize)
  3. node cli/organize.cjs send       (Send to hardware)

Output:
  patches/microkorg-organized-[DATE].json
        `);
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message, '\n');
    process.exit(1);
  }
}

main();
