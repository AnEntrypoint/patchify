#!/usr/bin/env bun

import { join } from 'bun/path';
import { writeFile, readFile, mkdir, readdir, unlink } from 'bun';
import { FACTORY_PRESETS, parseMicroKorgSysex } from './shared/synth-engine.js';

const PATCHES_DIR = join(process.cwd(), 'patches');
const PATCH_EXTENSION = '.json';

async function ensureDir() {
  try {
    await mkdir(PATCHES_DIR, { recursive: true });
  } catch (err) {
    // Directory may already exist
  }
}

async function listPatches() {
  await ensureDir();
  try {
    const files = await readdir(PATCHES_DIR);
    const patchNames = files
      .filter((f) => f.endsWith(PATCH_EXTENSION))
      .map((f) => f.slice(0, -PATCH_EXTENSION.length));
    console.log('Available patches:', patchNames.join(', '));
  } catch (err) {
    console.error('Error listing patches:', err);
  }
}

async function savePatch(patchName, patchData) {
  await ensureDir();
  const filePath = join(PATCHES_DIR, patchName + PATCH_EXTENSION);
  try {
    const patch = typeof patchData === 'string' ? JSON.parse(patchData) : patchData;
    patch.name = patchName;
    await writeFile(filePath, JSON.stringify(patch, null, 2));
    console.log(`Patch "${patchName}" saved successfully`);
  } catch (err) {
    console.error('Error saving patch:', err);
  }
}

async function loadPatch(patchName) {
  const filePath = join(PATCHES_DIR, patchName + PATCH_EXTENSION);
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error loading patch:', err);
    return null;
  }
}

async function deletePatch(patchName) {
  const filePath = join(PATCHES_DIR, patchName + PATCH_EXTENSION);
  try {
    await unlink(filePath);
    console.log(`Patch "${patchName}" deleted successfully`);
  } catch (err) {
    console.error('Error deleting patch:', err);
  }
}

async function importPreset(presetName) {
  if (!FACTORY_PRESETS[presetName]) {
    console.error(`Preset "${presetName}" not found`);
    return;
  }
  await savePatch(presetName, FACTORY_PRESETS[presetName]);
}

async function importSysex(sysexHex, patchName) {
  try {
    const patch = parseMicroKorgSysex(sysexHex);
    patch.name = patchName;
    await savePatch(patchName, patch);
  } catch (err) {
    console.error('Error importing SysEx:', err);
  }
}

async function exportPatch(patchName, format = 'json') {
  const patch = await loadPatch(patchName);
  if (!patch) return;

  if (format === 'json') {
    console.log(JSON.stringify(patch, null, 2));
  } else if (format === 'js') {
    console.log(`export const ${patchName.replace(/\s+/g, '')} = ${JSON.stringify(patch, null, 2)};`);
  }
}

function showHelp() {
  console.log(`
Patchify CLI - microKORG Patch Management

Usage:
  bun run cli [command] [options]

Commands:
  list                      List all user patches
  save <name> <file.json>   Save patch from file
  load <name>               Display patch data
  delete <name>             Delete patch
  import-preset <name>      Import factory preset
  import-sysex <hex> <name> Import from SysEx hex
  export <name> [format]    Export patch (json or js)
  help                      Show this help

Examples:
  bun run cli list
  bun run cli import-preset "Fat Bass"
  bun run cli export "My Patch" js
  bun run cli import-sysex "F0 42 ... F7" "My Patch"
  `);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      await listPatches();
      break;
    case 'save':
      if (args.length < 2) {
        console.error('Usage: bun run cli save <name> <file.json>');
        process.exit(1);
      }
      const patchFile = await readFile(args[2], 'utf-8');
      await savePatch(args[1], patchFile);
      break;
    case 'load':
      if (args.length < 2) {
        console.error('Usage: bun run cli load <name>');
        process.exit(1);
      }
      const patch = await loadPatch(args[1]);
      if (patch) console.log(JSON.stringify(patch, null, 2));
      break;
    case 'delete':
      if (args.length < 2) {
        console.error('Usage: bun run cli delete <name>');
        process.exit(1);
      }
      await deletePatch(args[1]);
      break;
    case 'import-preset':
      if (args.length < 2) {
        console.error('Usage: bun run cli import-preset <name>');
        process.exit(1);
      }
      await importPreset(args[1]);
      break;
    case 'import-sysex':
      if (args.length < 3) {
        console.error('Usage: bun run cli import-sysex <hex> <name>');
        process.exit(1);
      }
      await importSysex(args[1], args[2]);
      break;
    case 'export':
      if (args.length < 2) {
        console.error('Usage: bun run cli export <name> [format]');
        process.exit(1);
      }
      await exportPatch(args[1], args[2]);
      break;
    case 'help':
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('CLI error:', err);
  process.exit(1);
});