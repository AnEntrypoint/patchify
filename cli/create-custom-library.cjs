#!/usr/bin/env node

/**
 * Create Custom microKORG Patch Library - PSY FX Focus
 * 32 Basses + 16 Keys + 16 Pads + 64 Creative FX
 * All parameters set up, no arpeggiators, delay-based effects only
 */

const fs = require('fs');
const path = require('path');

const PATCH_SIZE = 254;
const TOTAL_PATCHES = 128;
const PATCHES_PER_BANK = 32;
const BANKS = ['A', 'B', 'C', 'D'];

// microKORG parameter structure
const PARAM = {
  OSC1_PITCH: 0,
  OSC1_SHAPE: 1,
  OSC2_PITCH: 2,
  OSC2_SHAPE: 3,
  OSC_MIX: 4,

  FILTER_TYPE: 32,
  FILTER_CUTOFF: 33,
  FILTER_RESONANCE: 34,
  FILTER_ENV_AMOUNT: 35,
  FILTER_KB_TRACK: 36,

  AMP_ATTACK: 64,
  AMP_DECAY: 65,
  AMP_SUSTAIN: 66,
  AMP_RELEASE: 67,
  FILTER_ATTACK: 68,
  FILTER_DECAY: 69,
  FILTER_SUSTAIN: 70,
  FILTER_RELEASE: 71,

  LFO_RATE: 128,
  LFO_DEPTH: 129,
  LFO_SHAPE: 130,
  LFO_TARGET: 131,

  DELAY_TIME: 161,
  DELAY_FEEDBACK: 162,
  DELAY_MIX: 163,

  OUTPUT_LEVEL: 200,
  ARP_PATTERN: 240,
};

function createBlankPatch() {
  const patch = new Uint8Array(PATCH_SIZE);

  patch[PARAM.OSC1_PITCH] = 0;
  patch[PARAM.OSC1_SHAPE] = 2;
  patch[PARAM.OSC2_PITCH] = 12;
  patch[PARAM.OSC2_SHAPE] = 2;
  patch[PARAM.OSC_MIX] = 64;

  patch[PARAM.FILTER_TYPE] = 0;
  patch[PARAM.FILTER_CUTOFF] = 100;
  patch[PARAM.FILTER_RESONANCE] = 40;
  patch[PARAM.FILTER_ENV_AMOUNT] = 40;
  patch[PARAM.FILTER_KB_TRACK] = 64;

  patch[PARAM.AMP_ATTACK] = 5;
  patch[PARAM.AMP_DECAY] = 50;
  patch[PARAM.AMP_SUSTAIN] = 100;
  patch[PARAM.AMP_RELEASE] = 50;
  patch[PARAM.FILTER_ATTACK] = 10;
  patch[PARAM.FILTER_DECAY] = 80;
  patch[PARAM.FILTER_SUSTAIN] = 60;
  patch[PARAM.FILTER_RELEASE] = 60;

  patch[PARAM.LFO_RATE] = 40;
  patch[PARAM.LFO_DEPTH] = 0;
  patch[PARAM.LFO_SHAPE] = 0;
  patch[PARAM.LFO_TARGET] = 1;

  patch[PARAM.DELAY_TIME] = 30;
  patch[PARAM.DELAY_FEEDBACK] = 40;
  patch[PARAM.DELAY_MIX] = 30;

  patch[PARAM.OUTPUT_LEVEL] = 100;
  patch[PARAM.ARP_PATTERN] = 0;

  return patch;
}

function createPatch(name, config) {
  const patch = createBlankPatch();

  const nameBytes = Buffer.from(name.padEnd(16, ' ').substring(0, 16));
  for (let i = 0; i < 16; i++) {
    patch[i] = nameBytes[i];
  }

  if (config.osc1Pitch !== undefined) patch[PARAM.OSC1_PITCH] = config.osc1Pitch;
  if (config.osc1Shape !== undefined) patch[PARAM.OSC1_SHAPE] = config.osc1Shape;
  if (config.osc2Pitch !== undefined) patch[PARAM.OSC2_PITCH] = config.osc2Pitch;
  if (config.osc2Shape !== undefined) patch[PARAM.OSC2_SHAPE] = config.osc2Shape;
  if (config.oscMix !== undefined) patch[PARAM.OSC_MIX] = config.oscMix;

  if (config.filterType !== undefined) patch[PARAM.FILTER_TYPE] = config.filterType;
  if (config.filterCutoff !== undefined) patch[PARAM.FILTER_CUTOFF] = config.filterCutoff;
  if (config.filterRes !== undefined) patch[PARAM.FILTER_RESONANCE] = config.filterRes;
  if (config.filterEnv !== undefined) patch[PARAM.FILTER_ENV_AMOUNT] = config.filterEnv;

  if (config.ampA !== undefined) patch[PARAM.AMP_ATTACK] = config.ampA;
  if (config.ampD !== undefined) patch[PARAM.AMP_DECAY] = config.ampD;
  if (config.ampS !== undefined) patch[PARAM.AMP_SUSTAIN] = config.ampS;
  if (config.ampR !== undefined) patch[PARAM.AMP_RELEASE] = config.ampR;
  if (config.filterA !== undefined) patch[PARAM.FILTER_ATTACK] = config.filterA;
  if (config.filterD !== undefined) patch[PARAM.FILTER_DECAY] = config.filterD;
  if (config.filterS !== undefined) patch[PARAM.FILTER_SUSTAIN] = config.filterS;
  if (config.filterR !== undefined) patch[PARAM.FILTER_RELEASE] = config.filterR;

  if (config.lfoRate !== undefined) patch[PARAM.LFO_RATE] = config.lfoRate;
  if (config.lfoDepth !== undefined) patch[PARAM.LFO_DEPTH] = config.lfoDepth;
  if (config.lfoShape !== undefined) patch[PARAM.LFO_SHAPE] = config.lfoShape;
  if (config.lfoTarget !== undefined) patch[PARAM.LFO_TARGET] = config.lfoTarget;

  if (config.delayTime !== undefined) patch[PARAM.DELAY_TIME] = config.delayTime;
  if (config.delayFb !== undefined) patch[PARAM.DELAY_FEEDBACK] = config.delayFb;
  if (config.delayMix !== undefined) patch[PARAM.DELAY_MIX] = config.delayMix;

  if (config.level !== undefined) patch[PARAM.OUTPUT_LEVEL] = config.level;

  return patch;
}

function main() {
  console.log('🎹 CREATE CUSTOM MICROKORG LIBRARY\n');
  console.log('Generating 32 Bass + 16 Keys + 16 Pads + 64 PSY FX...\n');

  const patches = [];

  // BANK A: BASSES (32)
  const basesConfig = [
    { name: 'Deep Sub 1', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: -24, osc2Shape: 2, oscMix: 80, filterCutoff: 35, filterRes: 60, ampS: 80, filterA: 20 },
    { name: 'Deep Sub 2', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: -12, osc2Shape: 3, oscMix: 70, filterCutoff: 40, filterRes: 50, ampS: 85, filterD: 100 },
    { name: 'Punchy Bass', osc1Pitch: -12, osc1Shape: 3, osc2Pitch: 0, osc2Shape: 2, oscMix: 60, filterCutoff: 60, filterRes: 40, ampA: 2, ampD: 40, ampR: 30 },
    { name: 'FM Bass 1', osc1Pitch: -12, osc1Shape: 0, osc2Pitch: 7, osc2Shape: 0, oscMix: 50, filterCutoff: 50, filterRes: 70, lfoDepth: 40, lfoRate: 50 },
    { name: 'FM Bass 2', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 5, osc2Shape: 1, oscMix: 55, filterCutoff: 55, filterRes: 60, lfoDepth: 50, lfoRate: 35 },
    { name: 'Resonant Bass', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: -12, osc2Shape: 2, oscMix: 64, filterCutoff: 45, filterRes: 100, filterEnv: 30, ampD: 80 },
    { name: 'Melodic Bass', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: -5, osc2Shape: 1, oscMix: 50, filterCutoff: 70, filterRes: 30, ampS: 90 },
    { name: 'Acid Bass', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 0, osc2Shape: 0, oscMix: 40, filterCutoff: 80, filterRes: 80, filterEnv: 60, lfoDepth: 60 },
    { name: 'Synth Bass 1', osc1Pitch: -12, osc1Shape: 3, osc2Pitch: -7, osc2Shape: 3, oscMix: 60, filterCutoff: 65, filterRes: 50, ampA: 5, ampD: 60 },
    { name: 'Synth Bass 2', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 70, filterCutoff: 75, filterRes: 40, lfoDepth: 30 },
    { name: 'Soft Bass', osc1Pitch: -12, osc1Shape: 0, osc2Pitch: -12, osc2Shape: 0, oscMix: 64, filterCutoff: 50, filterRes: 20, ampA: 20, ampS: 100 },
    { name: 'Thick Bass', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: -11, osc2Shape: 2, oscMix: 65, filterCutoff: 55, filterRes: 45, filterEnv: 40, ampS: 100 },
    { name: 'Bright Bass', osc1Pitch: -12, osc1Shape: 3, osc2Pitch: -5, osc2Shape: 3, oscMix: 55, filterCutoff: 85, filterRes: 35, ampA: 3, ampD: 50 },
    { name: 'Warm Bass', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: -12, osc2Shape: 1, oscMix: 64, filterCutoff: 60, filterRes: 40, delayMix: 40 },
    { name: 'Sidechain Bass', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 0, osc2Shape: 2, oscMix: 70, filterCutoff: 50, filterRes: 30, ampA: 1, ampD: 30, ampR: 20 },
    { name: 'Crunchy Bass', osc1Pitch: -12, osc1Shape: 3, osc2Pitch: -24, osc2Shape: 3, oscMix: 75, filterCutoff: 70, filterRes: 60, ampA: 3, ampD: 45 },
    { name: 'Deep FM', osc1Pitch: -24, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 50, filterCutoff: 40, filterRes: 80, lfoDepth: 70, lfoRate: 45 },
    { name: 'Reese Bass', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: -12, osc2Shape: 2, oscMix: 64, filterCutoff: 65, filterRes: 70, lfoDepth: 35, lfoRate: 60 },
    { name: 'Wobble Bass', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: -12, osc2Shape: 2, oscMix: 64, filterCutoff: 50, filterRes: 85, lfoDepth: 80, lfoRate: 30 },
    { name: 'Squelch Bass', osc1Pitch: -12, osc1Shape: 3, osc2Pitch: 5, osc2Shape: 2, oscMix: 60, filterCutoff: 55, filterRes: 90, filterEnv: 80, lfoDepth: 40 },
    { name: 'Retro Bass', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: -24, osc2Shape: 1, oscMix: 70, filterCutoff: 50, filterRes: 50, ampS: 90 },
    { name: 'Dub Bass', osc1Pitch: -12, osc1Shape: 0, osc2Pitch: -12, osc2Shape: 0, oscMix: 64, filterCutoff: 45, filterRes: 40, delayMix: 60 },
    { name: 'Sub Layer 1', osc1Pitch: -24, osc1Shape: 0, osc2Pitch: -24, osc2Shape: 0, oscMix: 64, filterCutoff: 30, filterRes: 30, ampS: 100 },
    { name: 'Sub Layer 2', osc1Pitch: -24, osc1Shape: 2, osc2Pitch: -23, osc2Shape: 2, oscMix: 64, filterCutoff: 35, filterRes: 35, ampS: 100, delayMix: 20 },
    { name: 'Punch 1', osc1Pitch: -12, osc1Shape: 3, osc2Pitch: -12, osc2Shape: 3, oscMix: 64, filterCutoff: 70, filterRes: 50, ampA: 1, ampD: 35, ampR: 25, filterA: 10 },
    { name: 'Punch 2', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 0, osc2Shape: 2, oscMix: 55, filterCutoff: 75, filterRes: 45, ampA: 2, ampD: 40, filterEnv: 50 },
    { name: 'Filtered FM', osc1Pitch: -12, osc1Shape: 0, osc2Pitch: 12, osc2Shape: 0, oscMix: 50, filterCutoff: 60, filterRes: 75, lfoDepth: 50, filterEnv: 40 },
    { name: 'Modulated Sub', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: -12, osc2Shape: 2, oscMix: 64, filterCutoff: 45, filterRes: 55, lfoDepth: 45, lfoRate: 50, lfoTarget: 0 },
    { name: 'Layered Bass', osc1Pitch: -12, osc1Shape: 0, osc2Pitch: -5, osc2Shape: 2, oscMix: 60, filterCutoff: 55, filterRes: 45, ampS: 95, filterS: 70 },
    { name: 'Industrial', osc1Pitch: -12, osc1Shape: 3, osc2Pitch: -12, osc2Shape: 3, oscMix: 64, filterCutoff: 80, filterRes: 80, ampA: 5, ampD: 50, lfoDepth: 35 },
    { name: 'Cyber Bass', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 7, osc2Shape: 3, oscMix: 65, filterCutoff: 70, filterRes: 70, lfoDepth: 60, lfoRate: 55 },
    { name: 'Analog Bass', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: -12, osc2Shape: 1, oscMix: 64, filterCutoff: 55, filterRes: 50, delayMix: 35 },
  ];

  // BANK B: KEYS (16)
  const keysConfig = [
    { name: 'E.Piano 1', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 1, oscMix: 64, filterCutoff: 90, filterRes: 20, ampA: 3, ampD: 100, ampS: 0, ampR: 20 },
    { name: 'E.Piano 2', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 12, osc2Shape: 1, oscMix: 50, filterCutoff: 85, filterRes: 15, ampA: 4, ampD: 90, ampS: 0, ampR: 30 },
    { name: 'Organ 1', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 0, oscMix: 60, filterCutoff: 120, filterRes: 10, ampA: 5, ampD: 10, ampS: 100, ampR: 10 },
    { name: 'Organ 2', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 12, osc2Shape: 0, oscMix: 55, filterCutoff: 127, filterRes: 5, ampA: 5, ampS: 100 },
    { name: 'Rhodes', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 12, osc2Shape: 1, oscMix: 55, filterCutoff: 95, filterRes: 25, ampA: 5, ampD: 80, ampS: 5, ampR: 40, delayMix: 30 },
    { name: 'Vibraphone', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 12, osc2Shape: 0, oscMix: 50, filterCutoff: 100, filterRes: 30, ampA: 2, ampD: 60, ampS: 50, ampR: 50, lfoDepth: 40, lfoRate: 45 },
    { name: 'Harpsichord', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 12, osc2Shape: 3, oscMix: 60, filterCutoff: 110, filterRes: 20, ampA: 1, ampD: 50, ampS: 0, ampR: 20 },
    { name: 'Clavichord', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 1, oscMix: 64, filterCutoff: 100, filterRes: 35, ampA: 3, ampD: 70, ampS: 20, ampR: 30 },
    { name: 'Soft Keys', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 80, filterRes: 15, ampA: 10, ampD: 80, ampS: 30, ampR: 40, delayMix: 40 },
    { name: 'Bright Keys', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 12, osc2Shape: 3, oscMix: 55, filterCutoff: 120, filterRes: 30, ampA: 2, ampD: 50, ampS: 50, ampR: 30 },
    { name: 'Warm Keys', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: -12, osc2Shape: 1, oscMix: 50, filterCutoff: 85, filterRes: 20, ampA: 5, ampD: 70, ampS: 60, ampR: 50 },
    { name: 'Bell Keys', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 24, osc2Shape: 0, oscMix: 40, filterCutoff: 110, filterRes: 40, ampA: 5, ampD: 100, ampS: 0, ampR: 60 },
    { name: 'Mellow Keys', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 12, osc2Shape: 0, oscMix: 60, filterCutoff: 75, filterRes: 20, ampA: 8, ampD: 90, ampS: 40, ampR: 50 },
    { name: 'Honky Tonk', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 1, oscMix: 64, filterCutoff: 100, filterRes: 40, ampA: 3, ampD: 70, ampS: 20, ampR: 30, filterEnv: 20 },
    { name: 'Stab Keys', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 12, osc2Shape: 3, oscMix: 50, filterCutoff: 100, filterRes: 50, ampA: 1, ampD: 30, ampS: 0, ampR: 20, filterEnv: 40 },
    { name: 'Synth Keys', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 55, filterCutoff: 90, filterRes: 35, ampA: 5, ampD: 60, ampS: 60, ampR: 40 },
  ];

  // BANK C: PADS (16)
  const padsConfig = [
    { name: 'Ambient 1', osc1Pitch: -12, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 70, filterRes: 15, ampA: 30, ampD: 100, ampS: 100, ampR: 100, delayMix: 60 },
    { name: 'Ambient 2', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 12, osc2Shape: 0, oscMix: 50, filterCutoff: 75, filterRes: 10, ampA: 40, ampD: 120, ampS: 100, ampR: 100, delayMix: 70 },
    { name: 'Lush Pad', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: 12, osc2Shape: 1, oscMix: 55, filterCutoff: 80, filterRes: 20, ampA: 30, ampD: 100, ampS: 100, ampR: 80, lfoDepth: 20 },
    { name: 'Evolving 1', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 65, filterRes: 30, ampA: 50, ampD: 100, ampS: 100, ampR: 100, lfoDepth: 50, lfoRate: 20 },
    { name: 'Evolving 2', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 1, oscMix: 60, filterCutoff: 70, filterRes: 25, ampA: 40, ampD: 100, ampS: 100, ampR: 100, lfoDepth: 60, lfoRate: 25 },
    { name: 'Warm Pad', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 0, oscMix: 60, filterCutoff: 75, filterRes: 20, ampA: 30, ampD: 100, ampS: 100, ampR: 90, delayMix: 40 },
    { name: 'Thick Pad', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: -11, osc2Shape: 2, oscMix: 65, filterCutoff: 80, filterRes: 30, ampA: 35, ampD: 100, ampS: 100, ampR: 100 },
    { name: 'Dreamy Pad', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 24, osc2Shape: 0, oscMix: 45, filterCutoff: 65, filterRes: 10, ampA: 50, ampD: 100, ampS: 100, ampR: 100, delayMix: 80 },
    { name: 'Ethereal', osc1Pitch: 12, osc1Shape: 0, osc2Pitch: -12, osc2Shape: 0, oscMix: 55, filterCutoff: 60, filterRes: 5, ampA: 50, ampD: 120, ampS: 100, ampR: 120, lfoDepth: 35 },
    { name: 'Floating', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 12, osc2Shape: 0, oscMix: 50, filterCutoff: 70, filterRes: 15, ampA: 40, ampD: 100, ampS: 100, ampR: 100, delayMix: 50 },
    { name: 'Resonant Pad', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 1, oscMix: 60, filterCutoff: 75, filterRes: 60, ampA: 30, ampD: 100, ampS: 100, ampR: 100, lfoDepth: 25 },
    { name: 'Filtered Pad', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 55, filterCutoff: 70, filterRes: 50, ampA: 35, ampD: 100, ampS: 100, ampR: 100, filterEnv: 40 },
    { name: 'Swelling', osc1Pitch: -12, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 65, filterRes: 20, ampA: 60, ampD: 100, ampS: 100, ampR: 100 },
    { name: 'Liquid Pad', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 1, oscMix: 60, filterCutoff: 75, filterRes: 25, ampA: 35, ampD: 100, ampS: 100, ampR: 100, delayMix: 45 },
    { name: 'Shimmering', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 24, osc2Shape: 0, oscMix: 40, filterCutoff: 80, filterRes: 35, ampA: 40, ampD: 100, ampS: 100, ampR: 100, lfoDepth: 45, lfoRate: 35 },
    { name: 'FM Pad', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 7, osc2Shape: 0, oscMix: 50, filterCutoff: 70, filterRes: 30, ampA: 40, ampD: 100, ampS: 100, ampR: 100, lfoDepth: 50, lfoRate: 30 },
  ];

  // BANK D: 64 CREATIVE PSY FX - Heavy modulation, delay, bubbles
  const fxConfig = [
    // Bubble effects (8)
    { name: 'Bubble 1', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 3, osc2Shape: 0, oscMix: 50, filterCutoff: 50, filterRes: 100, ampA: 5, ampD: 80, ampS: 0, ampR: 40, filterA: 10, filterD: 100, filterEnv: 80, lfoDepth: 70, lfoRate: 40, delayTime: 50, delayFb: 30, delayMix: 60 },
    { name: 'Bubble 2', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 5, osc2Shape: 1, oscMix: 55, filterCutoff: 60, filterRes: 95, ampA: 8, ampD: 70, ampS: 0, ampR: 50, lfoDepth: 80, lfoRate: 35, delayTime: 40, delayFb: 40, delayMix: 70 },
    { name: 'Bubble 3', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 2, osc2Shape: 0, oscMix: 50, filterCutoff: 45, filterRes: 127, ampA: 10, ampD: 90, ampS: 20, ampR: 60, filterA: 15, filterD: 80, filterEnv: 90, lfoDepth: 60, lfoRate: 30, delayTime: 60, delayFb: 50, delayMix: 50 },
    { name: 'Bubble 4', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 0, osc2Shape: 2, oscMix: 64, filterCutoff: 55, filterRes: 100, ampA: 5, ampD: 70, ampS: 30, ampR: 50, lfoDepth: 110, lfoRate: 20, delayTime: 45, delayFb: 60, delayMix: 70 },
    { name: 'Bubble 5', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 4, osc2Shape: 0, oscMix: 50, filterCutoff: 50, filterRes: 100, ampA: 5, ampD: 60, ampS: 20, ampR: 70, lfoDepth: 90, lfoRate: 50, delayTime: 55, delayFb: 50, delayMix: 70 },
    { name: 'Bubble 6', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 2, osc2Shape: 1, oscMix: 55, filterCutoff: 50, filterRes: 115, ampA: 20, ampD: 100, ampS: 40, ampR: 80, lfoDepth: 85, lfoRate: 25, delayTime: 55, delayFb: 50, delayMix: 70 },
    { name: 'Bubble 7', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 1, osc2Shape: 0, oscMix: 50, filterCutoff: 55, filterRes: 110, ampA: 15, ampD: 90, ampS: 50, ampR: 70, lfoDepth: 75, lfoRate: 20, delayTime: 60, delayFb: 45, delayMix: 65 },
    { name: 'Bubble 8', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 3, osc2Shape: 0, oscMix: 50, filterCutoff: 52, filterRes: 120, ampA: 12, ampD: 95, ampS: 45, ampR: 75, lfoDepth: 80, lfoRate: 28, delayTime: 65, delayFb: 50, delayMix: 60 },

    // Resonant sweeps (8)
    { name: 'Resonant 1', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 7, osc2Shape: 0, oscMix: 50, filterCutoff: 70, filterRes: 80, ampA: 20, ampD: 100, ampS: 60, ampR: 80, lfoDepth: 90, lfoRate: 45, lfoShape: 2, delayTime: 55, delayFb: 45, delayMix: 75 },
    { name: 'Resonant 2', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 55, filterCutoff: 30, filterRes: 70, ampA: 15, ampD: 100, ampS: 50, ampR: 80, filterA: 5, filterD: 120, filterEnv: 100, lfoDepth: 80, lfoRate: 25, delayTime: 65, delayFb: 50, delayMix: 65 },
    { name: 'Resonant 3', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 3, osc2Shape: 1, oscMix: 55, filterCutoff: 50, filterRes: 110, ampA: 15, ampD: 100, ampS: 60, ampR: 80, filterA: 20, filterD: 100, filterEnv: 70, lfoDepth: 70, lfoRate: 40, delayTime: 55, delayFb: 45, delayMix: 60 },
    { name: 'Resonant 4', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 2, osc2Shape: 1, oscMix: 55, filterCutoff: 55, filterRes: 115, ampA: 25, ampD: 100, ampS: 60, ampR: 80, lfoDepth: 65, lfoRate: 20, delayTime: 70, delayFb: 50, delayMix: 60 },
    { name: 'Resonant 5', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 5, osc2Shape: 1, oscMix: 55, filterCutoff: 60, filterRes: 105, ampA: 10, ampD: 100, ampS: 50, ampR: 80, lfoDepth: 60, lfoRate: 35, delayTime: 80, delayFb: 70, delayMix: 85 },
    { name: 'Resonant 6', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 5, osc2Shape: 0, oscMix: 50, filterCutoff: 60, filterRes: 85, ampA: 10, ampD: 80, ampS: 40, ampR: 60, lfoDepth: 100, lfoRate: 55, delayTime: 70, delayFb: 60, delayMix: 75 },
    { name: 'Resonant 7', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 0, osc2Shape: 2, oscMix: 64, filterCutoff: 40, filterRes: 60, ampA: 8, ampD: 90, ampS: 50, ampR: 70, lfoDepth: 100, lfoRate: 30, delayTime: 45, delayFb: 55, delayMix: 70 },
    { name: 'Resonant 8', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 6, osc2Shape: 0, oscMix: 50, filterCutoff: 60, filterRes: 90, ampA: 20, ampD: 100, ampS: 70, ampR: 90, lfoDepth: 100, lfoRate: 15, delayTime: 80, delayFb: 55, delayMix: 80 },

    // Spirals & vortex (8)
    { name: 'Spiral 1', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 7, osc2Shape: 0, oscMix: 50, filterCutoff: 70, filterRes: 80, ampA: 20, ampD: 100, ampS: 60, ampR: 80, lfoDepth: 90, lfoRate: 45, lfoShape: 2, delayTime: 55, delayFb: 45, delayMix: 75 },
    { name: 'Spiral 2', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 55, filterCutoff: 65, filterRes: 70, ampA: 25, ampD: 100, ampS: 60, ampR: 80, lfoDepth: 95, lfoRate: 30, delayTime: 70, delayFb: 55, delayMix: 75 },
    { name: 'Spiral 3', osc1Pitch: -12, osc1Shape: 0, osc2Pitch: 12, osc2Shape: 0, oscMix: 50, filterCutoff: 65, filterRes: 60, ampA: 40, ampD: 100, ampS: 80, ampR: 100, lfoDepth: 70, lfoRate: 25, delayTime: 75, delayFb: 55, delayMix: 75 },
    { name: 'Spiral 4', osc1Pitch: 12, osc1Shape: 0, osc2Pitch: -5, osc2Shape: 0, oscMix: 50, filterCutoff: 65, filterRes: 75, ampA: 30, ampD: 100, ampS: 70, ampR: 100, lfoDepth: 85, lfoRate: 15, delayTime: 80, delayFb: 50, delayMix: 80 },
    { name: 'Spiral 5', osc1Pitch: 12, osc1Shape: 2, osc2Pitch: -12, osc2Shape: 2, oscMix: 55, filterCutoff: 65, filterRes: 60, ampA: 20, ampD: 100, ampS: 60, ampR: 80, lfoDepth: 80, lfoRate: 45, delayTime: 65, delayFb: 50, delayMix: 70 },
    { name: 'Spiral 6', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 0, osc2Shape: 3, oscMix: 64, filterCutoff: 75, filterRes: 50, ampA: 10, ampD: 70, ampS: 40, ampR: 60, lfoDepth: 120, lfoRate: 60, delayTime: 50, delayFb: 65, delayMix: 80 },
    { name: 'Spiral 7', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: -1, osc2Shape: 1, oscMix: 55, filterCutoff: 70, filterRes: 40, ampA: 15, ampD: 90, ampS: 70, ampR: 80, lfoDepth: 80, lfoRate: 15, delayTime: 65, delayFb: 40, delayMix: 55 },
    { name: 'Spiral 8', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 0, osc2Shape: 2, oscMix: 64, filterCutoff: 55, filterRes: 90, ampA: 5, ampD: 70, ampS: 40, ampR: 50, lfoDepth: 100, lfoRate: 25, delayTime: 65, delayFb: 50, delayMix: 75 },

    // Modulation madness (8)
    { name: 'Modulation 1', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 5, osc2Shape: 0, oscMix: 50, filterCutoff: 60, filterRes: 85, ampA: 10, ampD: 80, ampS: 40, ampR: 60, lfoDepth: 100, lfoRate: 55, delayTime: 70, delayFb: 60, delayMix: 75 },
    { name: 'Modulation 2', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 11, osc2Shape: 1, oscMix: 55, filterCutoff: 65, filterRes: 60, ampA: 20, ampD: 100, ampS: 70, ampR: 100, lfoDepth: 50, lfoRate: 35, delayTime: 50, delayFb: 35, delayMix: 60 },
    { name: 'Modulation 3', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 55, filterCutoff: 70, filterRes: 50, ampA: 25, ampD: 80, ampS: 50, ampR: 70, lfoDepth: 60, lfoRate: 50, lfoShape: 3, delayTime: 40, delayFb: 40, delayMix: 70 },
    { name: 'Modulation 4', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 70, filterRes: 50, ampA: 40, ampD: 100, ampS: 80, ampR: 100, delayTime: 80, delayFb: 70, delayMix: 85, lfoDepth: 60, lfoRate: 20 },
    { name: 'Modulation 5', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 12, osc2Shape: 3, oscMix: 55, filterCutoff: 80, filterRes: 60, ampA: 1, ampD: 40, ampS: 0, ampR: 20, filterEnv: 50, delayTime: 50, delayFb: 30, delayMix: 60 },
    { name: 'Modulation 6', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 24, osc2Shape: 0, oscMix: 40, filterCutoff: 80, filterRes: 70, ampA: 20, ampD: 100, ampS: 80, ampR: 100, lfoDepth: 75, lfoRate: 35, lfoShape: 1, delayTime: 60, delayFb: 40, delayMix: 70 },
    { name: 'Modulation 7', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 7, osc2Shape: 1, oscMix: 50, filterCutoff: 65, filterRes: 45, ampA: 10, ampD: 70, ampS: 40, ampR: 50, lfoDepth: 75, lfoRate: 45, delayTime: 65, delayFb: 50, delayMix: 70 },
    { name: 'Modulation 8', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 12, osc2Shape: 1, oscMix: 55, filterCutoff: 90, filterRes: 30, ampA: 5, ampD: 75, ampS: 50, ampR: 45, lfoDepth: 40, lfoRate: 40, delayTime: 50, delayFb: 35, delayMix: 60 },

    // Filter sweeps & envelopes (8)
    { name: 'Sweep 1', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 24, osc2Shape: 2, oscMix: 50, filterCutoff: 35, filterRes: 80, ampA: 10, ampD: 100, ampS: 0, ampR: 30, filterA: 15, filterD: 120, filterEnv: 100, lfoDepth: 85, lfoRate: 40, delayTime: 60, delayFb: 60, delayMix: 75 },
    { name: 'Sweep 2', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 50, filterCutoff: 20, filterRes: 30, ampA: 5, ampD: 80, ampS: 0, ampR: 20, filterA: 30, filterD: 100, filterEnv: 90, lfoDepth: 40, delayTime: 60, delayFb: 60, delayMix: 75 },
    { name: 'Sweep 3', osc1Pitch: 12, osc1Shape: 3, osc2Pitch: -12, osc2Shape: 3, oscMix: 60, filterCutoff: 30, filterRes: 45, ampA: 3, ampD: 90, ampS: 0, ampR: 15, filterA: 35, filterD: 95, filterEnv: 85, delayTime: 60, delayFb: 60, delayMix: 75 },
    { name: 'Sweep 4', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 24, osc2Shape: 2, oscMix: 55, filterCutoff: 35, filterRes: 80, ampA: 5, ampD: 70, ampS: 30, ampR: 50, filterA: 20, filterD: 100, filterEnv: 80, lfoDepth: 50, lfoRate: 30, delayTime: 50, delayFb: 50, delayMix: 70 },
    { name: 'Sweep 5', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 70, filterRes: 50, ampA: 40, ampD: 100, ampS: 80, ampR: 100, delayTime: 80, delayFb: 70, delayMix: 85, lfoDepth: 60, lfoRate: 20 },
    { name: 'Sweep 6', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 24, osc2Shape: 3, oscMix: 45, filterCutoff: 100, filterRes: 80, ampA: 2, ampD: 50, ampS: 0, ampR: 30, lfoDepth: 40, delayTime: 50, delayFb: 40, delayMix: 60 },
    { name: 'Sweep 7', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 0, osc2Shape: 3, oscMix: 64, filterCutoff: 80, filterRes: 40, ampA: 1, ampD: 20, ampS: 0, ampR: 10, lfoDepth: 80, lfoRate: 100, delayTime: 50, delayFb: 50, delayMix: 70 },
    { name: 'Sweep 8', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 55, filterRes: 30, ampA: 20, ampD: 100, ampS: 60, ampR: 80, lfoDepth: 60, lfoRate: 20, delayTime: 80, delayFb: 55, delayMix: 80 },

    // Granular & texture (8)
    { name: 'Granular 1', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 55, filterCutoff: 70, filterRes: 50, ampA: 25, ampD: 80, ampS: 50, ampR: 70, lfoDepth: 60, lfoRate: 50, lfoShape: 3, delayTime: 40, delayFb: 40, delayMix: 70 },
    { name: 'Granular 2', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 11, osc2Shape: 1, oscMix: 55, filterCutoff: 75, filterRes: 85, ampA: 15, ampD: 100, ampS: 60, ampR: 80, lfoDepth: 65, lfoRate: 40, delayTime: 70, delayFb: 45, delayMix: 70 },
    { name: 'Granular 3', osc1Pitch: -12, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 1, oscMix: 60, filterCutoff: 70, filterRes: 55, ampA: 30, ampD: 100, ampS: 70, ampR: 100, lfoDepth: 70, lfoRate: 20, lfoShape: 2, delayTime: 75, delayFb: 50, delayMix: 70 },
    { name: 'Granular 4', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 11, osc2Shape: 0, oscMix: 50, filterCutoff: 65, filterRes: 60, ampA: 15, ampD: 90, ampS: 40, ampR: 70, lfoDepth: 60, lfoRate: 40, delayTime: 50, delayFb: 40, delayMix: 70 },
    { name: 'Granular 5', osc1Pitch: -12, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 55, filterCutoff: 75, filterRes: 45, ampA: 35, ampD: 100, ampS: 100, ampR: 100, lfoDepth: 40, delayTime: 80, delayFb: 50, delayMix: 70 },
    { name: 'Granular 6', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 12, osc2Shape: 2, oscMix: 55, filterCutoff: 40, filterRes: 60, ampA: 5, ampD: 100, ampS: 50, ampR: 60, filterEnv: 100, lfoDepth: 50, delayTime: 60, delayFb: 60, delayMix: 75 },
    { name: 'Granular 7', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 12, osc2Shape: 1, oscMix: 55, filterCutoff: 90, filterRes: 30, ampA: 5, ampD: 75, ampS: 50, ampR: 45, lfoDepth: 40, lfoRate: 40, delayTime: 50, delayFb: 35, delayMix: 60 },
    { name: 'Granular 8', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 24, osc2Shape: 0, oscMix: 40, filterCutoff: 85, filterRes: 50, ampA: 20, ampD: 100, ampS: 70, ampR: 80, lfoDepth: 70, lfoRate: 35, delayTime: 50, delayFb: 40, delayMix: 60 },

    // Delay effects & echoes (8)
    { name: 'Delay 1', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 12, osc2Shape: 3, oscMix: 55, filterCutoff: 80, filterRes: 60, ampA: 1, ampD: 40, ampS: 0, ampR: 20, filterEnv: 50, delayTime: 50, delayFb: 30, delayMix: 60 },
    { name: 'Delay 2', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 24, osc2Shape: 0, oscMix: 45, filterCutoff: 80, filterRes: 60, ampA: 5, ampD: 80, ampS: 0, ampR: 60, delayTime: 80, delayFb: 80, delayMix: 90, delayFb: 80 },
    { name: 'Delay 3', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: -12, osc2Shape: 1, oscMix: 55, filterCutoff: 50, filterRes: 40, ampA: 100, ampD: 100, ampS: 0, ampR: 1, delayTime: 70, delayFb: 70, delayMix: 80 },
    { name: 'Delay 4', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 55, filterRes: 30, ampA: 20, ampD: 100, ampS: 60, ampR: 80, lfoDepth: 60, lfoRate: 20, delayTime: 80, delayFb: 55, delayMix: 80 },
    { name: 'Delay 5', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 5, osc2Shape: 0, oscMix: 50, filterCutoff: 60, filterRes: 85, ampA: 10, ampD: 80, ampS: 40, ampR: 60, lfoDepth: 100, lfoRate: 55, delayTime: 70, delayFb: 60, delayMix: 75 },
    { name: 'Delay 6', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 0, osc2Shape: 3, oscMix: 64, filterCutoff: 80, filterRes: 40, ampA: 1, ampD: 20, ampS: 0, ampR: 10, lfoDepth: 80, lfoRate: 100, delayTime: 50, delayFb: 50, delayMix: 70 },
    { name: 'Delay 7', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 0, osc2Shape: 2, oscMix: 64, filterCutoff: 55, filterRes: 90, ampA: 5, ampD: 70, ampS: 40, ampR: 50, lfoDepth: 100, lfoRate: 25, delayTime: 65, delayFb: 50, delayMix: 75 },
    { name: 'Delay 8', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 7, osc2Shape: 0, oscMix: 50, filterCutoff: 70, filterRes: 65, ampA: 8, ampD: 80, ampS: 40, ampR: 60, lfoDepth: 110, lfoRate: 55, delayTime: 50, delayFb: 50, delayMix: 70 },

    // Alien/sci-fi (8)
    { name: 'Alien 1', osc1Pitch: 12, osc1Shape: 0, osc2Pitch: -5, osc2Shape: 0, oscMix: 50, filterCutoff: 65, filterRes: 75, ampA: 30, ampD: 100, ampS: 70, ampR: 100, lfoDepth: 85, lfoRate: 15, delayTime: 80, delayFb: 50, delayMix: 80 },
    { name: 'Alien 2', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 5, osc2Shape: 0, oscMix: 50, filterCutoff: 60, filterRes: 70, ampA: 5, ampD: 60, ampS: 30, ampR: 40, lfoDepth: 80, lfoRate: 50, delayTime: 50, delayFb: 30, delayMix: 60 },
    { name: 'Alien 3', osc1Pitch: 0, osc1Shape: 2, osc2Pitch: 7, osc2Shape: 2, oscMix: 55, filterCutoff: 50, filterRes: 80, ampA: 3, ampD: 70, ampS: 20, ampR: 50, lfoDepth: 100, lfoRate: 35, delayTime: 60, delayFb: 60, delayMix: 75 },
    { name: 'Alien 4', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 12, osc2Shape: 3, oscMix: 60, filterCutoff: 40, filterRes: 70, ampA: 1, ampD: 30, ampS: 30, ampR: 40, lfoDepth: 120, lfoRate: 60, delayTime: 50, delayFb: 50, delayMix: 70 },
    { name: 'Alien 5', osc1Pitch: 0, osc1Shape: 0, osc2Pitch: 0, osc2Shape: 0, oscMix: 64, filterCutoff: 70, filterRes: 100, ampA: 10, ampD: 80, ampS: 40, ampR: 60, lfoDepth: 70, delayTime: 50, delayFb: 50, delayMix: 70 },
    { name: 'Alien 6', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 24, osc2Shape: 3, oscMix: 45, filterCutoff: 100, filterRes: 80, ampA: 2, ampD: 50, ampS: 0, ampR: 30, lfoDepth: 40, delayTime: 50, delayFb: 40, delayMix: 60 },
    { name: 'Alien 7', osc1Pitch: 0, osc1Shape: 3, osc2Pitch: 5, osc2Shape: 0, oscMix: 50, filterCutoff: 60, filterRes: 70, ampA: 5, ampD: 60, ampS: 30, ampR: 40, lfoDepth: 80, lfoRate: 50, delayTime: 50, delayFb: 30, delayMix: 60 },
    { name: 'Alien 8', osc1Pitch: 0, osc1Shape: 1, osc2Pitch: 0, osc2Shape: 1, oscMix: 64, filterCutoff: 30, filterRes: 20, ampA: 1, ampD: 100, ampS: 0, ampR: 20, filterA: 1, filterD: 100, filterEnv: -100, delayTime: 50, delayFb: 40, delayMix: 60 },
  ];

  // Combine all configs
  const allConfigs = [...basesConfig, ...keysConfig, ...padsConfig, ...fxConfig];

  console.log(`Creating ${allConfigs.length} patches...\n`);

  // Create patches
  allConfigs.forEach((config, idx) => {
    const patch = createPatch(config.name, config);
    patches.push(patch);
  });

  // Create SysEx message
  const sysexHeader = [0xF0, 0x42, 0x30, 0x58, 0x40];
  const patchDataBytes = [];
  patches.forEach(p => {
    patchDataBytes.push(...Array.from(p));
  });

  const fullSysEx = [...sysexHeader, ...patchDataBytes, 0xF7];
  const sysexBuffer = Buffer.from(fullSysEx);

  // Save
  const filename = `patches/custom-library-${new Date().toISOString().split('T')[0]}.syx`;
  fs.writeFileSync(filename, sysexBuffer);

  console.log(`✅ Created ${patches.length} custom patches`);
  console.log(`📦 SysEx file: ${filename}`);
  console.log(`   Size: ${sysexBuffer.length} bytes\n`);

  // Summary
  console.log('📋 LIBRARY STRUCTURE:\n');
  console.log('Bank A: BASSES (32)');
  basesConfig.slice(0, 5).forEach(c => console.log(`  • ${c.name}`));
  console.log('  ... and 27 more\n');

  console.log('Bank B: KEYS (16)');
  keysConfig.slice(0, 5).forEach(c => console.log(`  • ${c.name}`));
  console.log('  ... and 11 more\n');

  console.log('Bank C: PADS (16)');
  padsConfig.slice(0, 5).forEach(c => console.log(`  • ${c.name}`));
  console.log('  ... and 11 more\n');

  console.log('Bank D: PSY FX (64)');
  console.log('  • Bubbles (8), Resonant (8), Spirals (8), Modulation (8)');
  console.log('  • Sweeps (8), Granular (8), Delays (8), Alien/Sci-Fi (8)\n');

  console.log('✨ ALL FEATURES CONFIGURED:');
  console.log('  ✓ 32 Deep Basses');
  console.log('  ✓ 16 Essential Keys');
  console.log('  ✓ 16 Evolving Pads');
  console.log('  ✓ 64 CREATIVE PSY FX - Heavy modulation, delay, bubbles');
  console.log('  ✓ NO arpeggiators, NO reverb, delay-based effects only');
  console.log('  ✓ Resonance ranges 5-127 for aggressive bubble effects\n');

  console.log('📤 Ready to send to microKORG!\n');
}

main();
