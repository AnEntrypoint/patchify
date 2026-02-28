/**
 * Patch Format Schema, Validation, and Normalization
 */

export const PATCH_SCHEMA = {
  name: { type: 'string', min: 1, max: 12 },
  voice: {
    mode: { type: 'enum', values: ['Single', 'Mono', 'Poly', 'Unison', 'Layer'] },
    portamento: { type: 'number', min: 0, max: 1 }
  },
  pitch: {
    transpose: { type: 'number', min: -24, max: 24 },
    tune: { type: 'number', min: -50, max: 50 },
    bendRange: { type: 'number', min: -12, max: 12 },
    vibrato: { type: 'number', min: -63, max: 63 }
  },
  osc1: {
    wave: { type: 'enum', values: ['Saw', 'Sawtooth', 'sawtooth', 'Squ', 'Square', 'square', 'Tri', 'Triangle', 'triangle', 'Sin', 'Sine', 'sine', 'Vox', 'vox', 'DWGS', 'dwgs', 'Noise', 'noise'] },
    control1: { type: 'number', min: 0, max: 127 },
    control2: { type: 'number', min: 0, max: 127 },
    pitch: { type: 'number', min: -24, max: 24 }
  },
  osc2: {
    wave: { type: 'enum', values: ['Saw', 'Sawtooth', 'sawtooth', 'Squ', 'Square', 'square', 'Tri', 'Triangle', 'triangle'] },
    mod: { type: 'enum', values: ['Off', 'off', 'Ring', 'ring', 'Sync', 'sync'] },
    semitone: { type: 'number', min: -24, max: 24 },
    tune: { type: 'number', min: -50, max: 50 }
  },
  mixer: {
    osc1: { type: 'number', min: 0, max: 1 },
    osc2: { type: 'number', min: 0, max: 1 },
    noise: { type: 'number', min: 0, max: 1 }
  },
  filter: {
    type: { type: 'enum', values: ['lowpass24', '24LPF', 'lowpass12', '12LPF', 'bandpass', '12BPF', 'highpass', '12HPF'] },
    cutoff: { type: 'number', min: 20, max: 20000 },
    resonance: { type: 'number', min: 0, max: 1 },
    envAmount: { type: 'number', min: -5000, max: 5000 }
  },
  eg1_filter: {
    a: { type: 'number', min: 0, max: 5 },
    d: { type: 'number', min: 0, max: 5 },
    s: { type: 'number', min: 0, max: 1 },
    r: { type: 'number', min: 0, max: 5 }
  },
  amp: {
    level: { type: 'number', min: 0, max: 1 },
    dist: { type: 'number', min: 0, max: 1 }
  },
  eg2_amp: {
    a: { type: 'number', min: 0, max: 5 },
    d: { type: 'number', min: 0, max: 5 },
    s: { type: 'number', min: 0, max: 1 },
    r: { type: 'number', min: 0, max: 5 }
  },
  lfo1: {
    wave: { type: 'enum', values: ['Saw', 'sawtooth', 'Squ', 'square', 'Tri', 'triangle', 'Sin', 'sine'] },
    rate: { type: 'number', min: 0.1, max: 20 },
    pitchMod: { type: 'number', min: -1200, max: 1200 },
    filterMod: { type: 'number', min: -5000, max: 5000 }
  },
  lfo2: {
    wave: { type: 'enum', values: ['Saw', 'sawtooth', 'Squ', 'square', 'Tri', 'triangle', 'Sin', 'sine'] },
    rate: { type: 'number', min: 0.1, max: 20 },
    ampMod: { type: 'number', min: 0, max: 1 },
    pitchMod: { type: 'number', min: -1200, max: 1200 }
  },
  vPatch: {
    type: 'array',
    items: {
      src: { type: 'enum', values: ['eg1', 'EG1', 'eg2', 'EG2', 'lfo1', 'LFO1', 'lfo2', 'LFO2'] },
      dest: { type: 'enum', values: ['pitch', 'PITCH', 'osc2_pitch', 'OSC2_PITCH', 'cutoff', 'CUTOFF', 'amp', 'AMP'] },
      int: { type: 'number', min: -64, max: 63 }
    }
  },
  modFx: {
    speed: { type: 'number', min: 0, max: 10 },
    depth: { type: 'number', min: 0, max: 1 },
    mix: { type: 'number', min: 0, max: 1 }
  },
  delayFx: {
    time: { type: 'number', min: 0, max: 1 },
    feedback: { type: 'number', min: 0, max: 1 },
    mix: { type: 'number', min: 0, max: 1 }
  },
  eq: {
    lowFreq: { type: 'number', min: 40, max: 1000 },
    lowGain: { type: 'number', min: -12, max: 12 },
    highFreq: { type: 'number', min: 1000, max: 20000 },
    highGain: { type: 'number', min: -12, max: 12 }
  },
  arp: {
    on: { type: 'boolean' },
    type: { type: 'enum', values: ['up', 'Up', 'down', 'Down', 'alt', 'Alt', 'random', 'Random'] },
    tempo: { type: 'number', min: 40, max: 300 },
    gate: { type: 'number', min: 0.1, max: 1 }
  }
};

export const DEFAULT_PATCH = {
  name: 'Init Program',
  voice: { mode: 'Poly', portamento: 0 },
  pitch: { transpose: 0, tune: 0 },
  osc1: { wave: 'sawtooth', control1: 0, control2: 0 },
  osc2: { wave: 'square', mod: 'off', semitone: 0, tune: 10 },
  mixer: { osc1: 1.0, osc2: 0.0, noise: 0.0 },
  filter: { type: 'lowpass24', cutoff: 10000, resonance: 0.5, envAmount: 0 },
  eg1_filter: { a: 0.01, d: 0.5, s: 0.5, r: 0.5 },
  amp: { level: 1.0, dist: 0 },
  eg2_amp: { a: 0.01, d: 0.5, s: 1.0, r: 0.1 },
  lfo1: { wave: 'triangle', rate: 5.0, pitchMod: 0, filterMod: 0 },
  lfo2: { wave: 'sine', rate: 2.0, ampMod: 0, pitchMod: 0 },
  vPatch: [
    { src: 'lfo1', dest: 'cutoff', int: 0 },
    { src: 'eg1', dest: 'pitch', int: 0 },
    { src: 'lfo2', dest: 'amp', int: 0 },
    { src: 'eg2', dest: 'osc2_pitch', int: 0 }
  ],
  modFx: { speed: 1.0, depth: 0, mix: 0 },
  delayFx: { time: 0.3, feedback: 0.3, mix: 0 },
  eq: { lowFreq: 250, lowGain: 0, highFreq: 6000, highGain: 0 },
  arp: { on: false, type: 'up', tempo: 120, gate: 0.5 }
};

// Wave/enum normalization map
const WAVE_MAP = {
  'sawtooth': 'sawtooth', 'saw': 'sawtooth', 'Saw': 'sawtooth', 'SAWTOOTH': 'sawtooth',
  'square': 'square', 'squ': 'square', 'Squ': 'square', 'SQUARE': 'square',
  'triangle': 'triangle', 'tri': 'triangle', 'Tri': 'triangle', 'TRIANGLE': 'triangle',
  'sine': 'sine', 'sin': 'sine', 'Sin': 'sine', 'SINE': 'sine',
  'vox': 'vox', 'Vox': 'vox', 'VOX': 'vox',
  'dwgs': 'dwgs', 'DWGS': 'dwgs', 'Dwgs': 'dwgs',
  'noise': 'noise', 'Noise': 'noise', 'NOISE': 'noise'
};

const MOD_MAP = {
  'off': 'off', 'Off': 'off', 'OFF': 'off',
  'ring': 'ring', 'Ring': 'ring', 'RING': 'ring',
  'sync': 'sync', 'Sync': 'sync', 'SYNC': 'sync'
};

const FILTER_TYPE_MAP = {
  'lowpass24': 'lowpass24', '24lpf': 'lowpass24', '24LPF': 'lowpass24',
  'lowpass12': 'lowpass12', '12lpf': 'lowpass12', '12LPF': 'lowpass12',
  'bandpass': 'bandpass', '12bpf': 'bandpass', '12BPF': 'bandpass',
  'highpass': 'highpass', '12hpf': 'highpass', '12HPF': 'highpass'
};

const VOICE_MODE_MAP = {
  'single': 'Single', 'Single': 'Single', 'SINGLE': 'Single',
  'mono': 'Mono', 'Mono': 'Mono', 'MONO': 'Mono',
  'poly': 'Poly', 'Poly': 'Poly', 'POLY': 'Poly',
  'unison': 'Unison', 'Unison': 'Unison', 'UNISON': 'Unison',
  'layer': 'Layer', 'Layer': 'Layer', 'LAYER': 'Layer'
};

const ARP_TYPE_MAP = {
  'up': 'up', 'Up': 'up', 'UP': 'up',
  'down': 'down', 'Down': 'down', 'DOWN': 'down',
  'alt': 'alt', 'Alt': 'alt', 'ALT': 'alt',
  'alt1': 'alt', 'Alt1': 'alt', 'ALT1': 'alt',
  'random': 'random', 'Random': 'random', 'RANDOM': 'random'
};

/**
 * Normalize a patch object to canonical form
 */
export function normalize(patch) {
  if (!patch) return JSON.parse(JSON.stringify(DEFAULT_PATCH));

  const normalized = JSON.parse(JSON.stringify(DEFAULT_PATCH));

  if (patch.name) normalized.name = String(patch.name).trim();

  if (patch.voice) {
    if (patch.voice.mode) normalized.voice.mode = VOICE_MODE_MAP[patch.voice.mode] || normalized.voice.mode;
    if (patch.voice.portamento !== undefined) normalized.voice.portamento = Math.min(1, Math.max(0, Number(patch.voice.portamento)));
  }

  if (patch.pitch) {
    if (patch.pitch.transpose !== undefined) normalized.pitch.transpose = Math.round(Number(patch.pitch.transpose));
    if (patch.pitch.tune !== undefined) normalized.pitch.tune = Math.round(Number(patch.pitch.tune));
  }

  if (patch.osc1) {
    if (patch.osc1.wave) normalized.osc1.wave = WAVE_MAP[patch.osc1.wave] || normalized.osc1.wave;
    if (patch.osc1.control1 !== undefined) normalized.osc1.control1 = Math.max(0, Math.min(127, Number(patch.osc1.control1)));
    if (patch.osc1.control2 !== undefined) normalized.osc1.control2 = Math.max(0, Math.min(127, Number(patch.osc1.control2)));
    if (patch.osc1.pitch !== undefined) normalized.osc1.pitch = Math.round(Number(patch.osc1.pitch));
  }

  if (patch.osc2) {
    if (patch.osc2.wave) normalized.osc2.wave = WAVE_MAP[patch.osc2.wave] || normalized.osc2.wave;
    if (patch.osc2.mod) normalized.osc2.mod = MOD_MAP[patch.osc2.mod] || normalized.osc2.mod;
    if (patch.osc2.semitone !== undefined) normalized.osc2.semitone = Math.round(Number(patch.osc2.semitone));
    if (patch.osc2.tune !== undefined) normalized.osc2.tune = Math.round(Number(patch.osc2.tune));
  }

  if (patch.mixer) {
    if (patch.mixer.osc1 !== undefined) normalized.mixer.osc1 = Math.min(1, Math.max(0, Number(patch.mixer.osc1)));
    if (patch.mixer.osc2 !== undefined) normalized.mixer.osc2 = Math.min(1, Math.max(0, Number(patch.mixer.osc2)));
    if (patch.mixer.noise !== undefined) normalized.mixer.noise = Math.min(1, Math.max(0, Number(patch.mixer.noise)));
  }

  if (patch.filter) {
    if (patch.filter.type) normalized.filter.type = FILTER_TYPE_MAP[patch.filter.type] || normalized.filter.type;
    if (patch.filter.cutoff !== undefined) normalized.filter.cutoff = Math.max(20, Math.min(20000, Number(patch.filter.cutoff)));
    if (patch.filter.resonance !== undefined) normalized.filter.resonance = Math.min(1, Math.max(0, Number(patch.filter.resonance)));
    if (patch.filter.envAmount !== undefined) normalized.filter.envAmount = Math.round(Number(patch.filter.envAmount));
  }

  if (patch.eg1_filter) {
    if (patch.eg1_filter.a !== undefined) normalized.eg1_filter.a = Math.min(5, Math.max(0, Number(patch.eg1_filter.a)));
    if (patch.eg1_filter.d !== undefined) normalized.eg1_filter.d = Math.min(5, Math.max(0, Number(patch.eg1_filter.d)));
    if (patch.eg1_filter.s !== undefined) normalized.eg1_filter.s = Math.min(1, Math.max(0, Number(patch.eg1_filter.s)));
    if (patch.eg1_filter.r !== undefined) normalized.eg1_filter.r = Math.min(5, Math.max(0, Number(patch.eg1_filter.r)));
  }

  if (patch.amp) {
    if (patch.amp.level !== undefined) normalized.amp.level = Math.min(1, Math.max(0, Number(patch.amp.level)));
    if (patch.amp.dist !== undefined) normalized.amp.dist = Math.min(1, Math.max(0, Number(patch.amp.dist)));
  }

  if (patch.eg2_amp) {
    if (patch.eg2_amp.a !== undefined) normalized.eg2_amp.a = Math.min(5, Math.max(0, Number(patch.eg2_amp.a)));
    if (patch.eg2_amp.d !== undefined) normalized.eg2_amp.d = Math.min(5, Math.max(0, Number(patch.eg2_amp.d)));
    if (patch.eg2_amp.s !== undefined) normalized.eg2_amp.s = Math.min(1, Math.max(0, Number(patch.eg2_amp.s)));
    if (patch.eg2_amp.r !== undefined) normalized.eg2_amp.r = Math.min(5, Math.max(0, Number(patch.eg2_amp.r)));
  }

  if (patch.lfo1) {
    if (patch.lfo1.wave) normalized.lfo1.wave = WAVE_MAP[patch.lfo1.wave] || normalized.lfo1.wave;
    if (patch.lfo1.rate !== undefined) normalized.lfo1.rate = Math.min(20, Math.max(0.1, Number(patch.lfo1.rate)));
    if (patch.lfo1.pitchMod !== undefined) normalized.lfo1.pitchMod = Math.round(Number(patch.lfo1.pitchMod));
    if (patch.lfo1.filterMod !== undefined) normalized.lfo1.filterMod = Math.round(Number(patch.lfo1.filterMod));
  }

  if (patch.lfo2) {
    if (patch.lfo2.wave) normalized.lfo2.wave = WAVE_MAP[patch.lfo2.wave] || normalized.lfo2.wave;
    if (patch.lfo2.rate !== undefined) normalized.lfo2.rate = Math.min(20, Math.max(0.1, Number(patch.lfo2.rate)));
    if (patch.lfo2.ampMod !== undefined) normalized.lfo2.ampMod = Math.min(1, Math.max(0, Number(patch.lfo2.ampMod)));
    if (patch.lfo2.pitchMod !== undefined) normalized.lfo2.pitchMod = Math.round(Number(patch.lfo2.pitchMod));
  }

  if (patch.modFx) {
    if (patch.modFx.speed !== undefined) normalized.modFx.speed = Math.min(10, Math.max(0, Number(patch.modFx.speed)));
    if (patch.modFx.depth !== undefined) normalized.modFx.depth = Math.min(1, Math.max(0, Number(patch.modFx.depth)));
    if (patch.modFx.mix !== undefined) normalized.modFx.mix = Math.min(1, Math.max(0, Number(patch.modFx.mix)));
  }

  if (patch.delayFx) {
    if (patch.delayFx.time !== undefined) normalized.delayFx.time = Math.min(1, Math.max(0, Number(patch.delayFx.time)));
    if (patch.delayFx.feedback !== undefined) normalized.delayFx.feedback = Math.min(1, Math.max(0, Number(patch.delayFx.feedback)));
    if (patch.delayFx.mix !== undefined) normalized.delayFx.mix = Math.min(1, Math.max(0, Number(patch.delayFx.mix)));
  }

  if (patch.eq) {
    if (patch.eq.lowFreq !== undefined) normalized.eq.lowFreq = Math.max(40, Math.min(1000, Number(patch.eq.lowFreq)));
    if (patch.eq.lowGain !== undefined) normalized.eq.lowGain = Math.max(-12, Math.min(12, Number(patch.eq.lowGain)));
    if (patch.eq.highFreq !== undefined) normalized.eq.highFreq = Math.max(1000, Math.min(20000, Number(patch.eq.highFreq)));
    if (patch.eq.highGain !== undefined) normalized.eq.highGain = Math.max(-12, Math.min(12, Number(patch.eq.highGain)));
  }

  if (patch.arp) {
    if (patch.arp.on !== undefined) normalized.arp.on = Boolean(patch.arp.on);
    if (patch.arp.type) normalized.arp.type = ARP_TYPE_MAP[patch.arp.type] || normalized.arp.type;
    if (patch.arp.tempo !== undefined) normalized.arp.tempo = Math.max(40, Math.min(300, Number(patch.arp.tempo)));
    if (patch.arp.gate !== undefined) normalized.arp.gate = Math.min(1, Math.max(0.1, Number(patch.arp.gate)));
  }

  return normalized;
}

/**
 * Validate a patch object
 * Returns { valid: boolean, errors: string[] }
 */
export function validate(patch) {
  const errors = [];

  if (!patch.name || typeof patch.name !== 'string') {
    errors.push('Patch must have a name');
  }

  // Basic structure checks
  if (!patch.voice || !patch.pitch || !patch.osc1) {
    errors.push('Patch missing required sections');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
