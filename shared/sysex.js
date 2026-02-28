/**
 * Real microKORG SysEx Encoder/Decoder (Korg 8-to-7 bit packing)
 * Based on Open-microKORG Python implementation
 * Handles the complete SysEx format: F0 42 30 58 <func> <7bit-packed-data...> F7
 */

// ============= Bit Packing (Korg 8-to-7 Scheme) =============

export function decode8to7(encoded) {
  const out = [];
  for (let ptr = 0; ptr < encoded.length; ptr += 8) {
    let bit7s = encoded[ptr];
    for (let i = 1; i <= 7 && ptr + i < encoded.length; i++) {
      const byte = encoded[ptr + i] | ((bit7s & 0x01) ? 0x80 : 0x00);
      out.push(byte);
      bit7s >>= 1;
    }
  }
  return new Uint8Array(out);
}

export function encode7to8(native) {
  const out = [];
  for (let ptr = 0; ptr < native.length; ptr += 7) {
    const chunk = native.slice(ptr, ptr + 7);
    let bit7s = 0;
    for (let i = 0; i < chunk.length; i++) {
      bit7s |= ((chunk[i] >> 7) & 1) << i;
    }
    out.push(bit7s);
    for (const b of chunk) {
      out.push(b & 0x7F);
    }
  }
  return new Uint8Array(out);
}

// ============= BitStream Reader (for parsing binary data) =============

class BitStream {
  constructor(bytes) {
    this.bytes = new Uint8Array(bytes);
    this.bitPos = 0;
  }

  read(numBits) {
    if (numBits === 0) return 0;
    let value = 0;
    for (let i = 0; i < numBits; i++) {
      const byteIdx = Math.floor(this.bitPos / 8);
      const bitIdx = 7 - (this.bitPos % 8);
      const bit = (this.bytes[byteIdx] >> bitIdx) & 1;
      value = (value << 1) | bit;
      this.bitPos++;
    }
    return value;
  }

  skip(numBits) {
    this.bitPos += numBits;
  }

  align() {
    if (this.bitPos % 8 !== 0) {
      this.bitPos += 8 - (this.bitPos % 8);
    }
  }
}

// ============= BitStream Writer (for encoding binary data) =============

class BitStreamWriter {
  constructor() {
    this.bytes = [];
    this.bitPos = 0;
  }

  write(value, numBits) {
    for (let i = numBits - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      const byteIdx = Math.floor(this.bitPos / 8);
      const bitIdx = 7 - (this.bitPos % 8);

      if (byteIdx >= this.bytes.length) {
        this.bytes.push(0);
      }
      this.bytes[byteIdx] |= bit << bitIdx;
      this.bitPos++;
    }
  }

  skip(numBits) {
    for (let i = 0; i < numBits; i++) {
      const byteIdx = Math.floor(this.bitPos / 8);
      if (byteIdx >= this.bytes.length) {
        this.bytes.push(0);
      }
      this.bitPos++;
    }
  }

  align() {
    if (this.bitPos % 8 !== 0) {
      this.bitPos += 8 - (this.bitPos % 8);
    }
  }

  toUint8Array() {
    const result = new Uint8Array(this.bytes);
    // Pad to next byte boundary
    if (this.bitPos % 8 !== 0) {
      result.set([0], Math.floor(this.bitPos / 8));
    }
    return result.slice(0, Math.ceil(this.bitPos / 8));
  }
}

// ============= Patch Schema Constants =============

export const VOICE_MODES = ['Single', 'Layer', 'Vocoder'];
export const WAVES1 = ['Saw', 'Squ', 'Tri', 'Sin', 'Vox', 'DWGS', 'Noise', 'AudioIn'];
export const WAVES2 = ['Saw', 'Squ', 'Tri'];
export const OSC2_MODS = ['Off', 'Ring', 'Sync', 'RingSync'];
export const FILTER_TYPES = ['24LPF', '12LPF', '12BPF', '12HPF'];
export const LFO_WAVES = ['Saw', 'Squ', 'Tri', 'S/H'];
export const ASSIGN_MODES = ['Mono', 'Poly', 'Unison'];
export const ARP_TYPES = ['Up', 'Down', 'Alt1', 'Alt2', 'Random', 'Trigger'];
export const PATCH_DESTS = ['PITCH', 'OSC2 PITCH', 'OSC1 CNTL1', 'NOISE LEVEL', 'CUTOFF', 'AMP', 'PAN', 'LFO2 FREQ'];
export const PATCH_SRCS = ['EG1', 'EG2', 'LFO1', 'LFO2', 'VELOCITY', 'KBD TRACK', 'P.Bend', 'Mod'];

// ============= Program Binary Decoding =============

export function decodeProgramBinary(bytes) {
  if (bytes.length < 256) {
    throw new Error(`Program binary must be 256 bytes, got ${bytes.length}`);
  }

  const stream = new BitStream(bytes);

  // Read name (12 ASCII bytes)
  const nameBytes = stream.bytes.slice(0, 12);
  const name = new TextDecoder().decode(nameBytes).trim();

  // Read program header
  const reserved1 = stream.read(8);
  const reserved2 = stream.read(8);
  const reserved3 = stream.read(5);
  const arpTrigLen = stream.read(3) + 1; // 1-8
  const arpTrigPattern = stream.read(8);
  const reserved4 = stream.read(2);
  const voiceMode = stream.read(2); // 0=Single, 2=Layer, 3=Vocoder
  stream.skip(12); // reserved
  stream.skip(8); // reserved = 60
  const delaySync = stream.read(1);
  stream.skip(3); // reserved
  const delayTimeBase = stream.read(4);
  const delayTime = stream.read(8);
  const delayDepth = stream.read(8);
  const delayType = stream.read(8);
  const modfxSpeed = stream.read(8);
  const modfxDepth = stream.read(8);
  const modfxType = stream.read(8);
  const eqHiFreq = stream.read(8);
  const eqHiGain = stream.read(8) - 64; // -12 to +12
  const eqLoFreq = stream.read(8);
  const eqLoGain = stream.read(8) - 64; // -12 to +12
  const arpTempo = stream.read(16);
  const arpOn = stream.read(1);
  const arpLatch = stream.read(1);
  const arpTarget = stream.read(2);
  stream.skip(3); // reserved
  const arpKeySync = stream.read(1);
  const arpType = stream.read(4);
  const arpRange = stream.read(4) + 1; // 1-4
  const arpGate = stream.read(8);
  const arpRes = stream.read(8);
  const arpSwing = stream.read(8); // signed
  const kbdOctave = stream.read(8); // signed

  // Read timbre (first one, or Vocoder if voice_mode == 3)
  const timbre = decodeTimbreBlock(stream, voiceMode === 3);

  const patch = {
    name: name || 'Untitled',
    voice: {
      mode: ASSIGN_MODES[timbre.assignMode] || 'Mono',
      portamento: timbre.portamentoTime / 127
    },
    pitch: {
      transpose: timbre.transpose - 64,
      tune: timbre.tune - 64,
      bendRange: timbre.bendRange - 64,
      vibrato: timbre.vibrato - 64
    },
    osc1: {
      wave: WAVES1[timbre.osc1Wave] || 'Saw',
      control1: timbre.osc1Ctrl1,
      control2: timbre.osc1Ctrl2
    },
    osc2: {
      wave: WAVES2[timbre.osc2Wave] || 'Saw',
      mod: OSC2_MODS[timbre.osc2Mod] || 'Off',
      semitone: timbre.osc2Semi - 64,
      tune: timbre.osc2Tune - 64
    },
    mixer: {
      osc1: timbre.mixOsc1 / 127,
      osc2: timbre.mixOsc2 / 127,
      noise: timbre.mixNoise / 127
    },
    filter: {
      type: FILTER_TYPES[timbre.filterType] || '24LPF',
      cutoff: timbre.filterCutoff,
      resonance: timbre.filterRes / 127,
      envAmount: (timbre.filterEg1 - 64) * 100
    },
    eg1_filter: {
      a: timbre.eg1A / 127,
      d: timbre.eg1D / 127,
      s: timbre.eg1S / 127,
      r: timbre.eg1R / 127
    },
    amp: {
      level: timbre.ampLevel / 127,
      dist: timbre.ampDist ? 1 : 0
    },
    eg2_amp: {
      a: timbre.eg2A / 127,
      d: timbre.eg2D / 127,
      s: timbre.eg2S / 127,
      r: timbre.eg2R / 127
    },
    lfo1: {
      wave: LFO_WAVES[timbre.lfo1Wave] || 'Tri',
      rate: timbre.lfo1Freq / 127 * 20,
      pitchMod: (timbre.lfo1Pitch - 64) * 10,
      filterMod: (timbre.lfo1Filter - 64) * 100
    },
    lfo2: {
      wave: LFO_WAVES[timbre.lfo2Wave] || 'Sin',
      rate: timbre.lfo2Freq / 127 * 20,
      ampMod: timbre.lfo2Amp / 127,
      pitchMod: (timbre.lfo2Pitch - 64) * 10
    },
    modFx: {
      speed: modfxSpeed / 127,
      depth: modfxDepth / 127,
      mix: modfxType / 3 // 0-2
    },
    delayFx: {
      time: delayTime / 127,
      feedback: delayDepth / 127,
      mix: delayType / 2 // 0-2
    },
    eq: {
      lowFreq: eqLoFreq,
      lowGain: eqLoGain,
      highFreq: eqHiFreq,
      highGain: eqHiGain
    },
    arp: {
      on: arpOn === 1,
      type: ARP_TYPES[arpType] || 'Up',
      tempo: arpTempo || 120,
      gate: arpGate / 127
    }
  };

  return patch;
}

function decodeTimbreBlock(stream, isVocoder) {
  const reserved = stream.read(8); // -1 (0xFF)
  const assignMode = stream.read(2);
  const eg2Reset = stream.read(1);
  const eg1Reset = isVocoder ? 0 : stream.read(1);
  const triggerMode = stream.read(1);
  stream.skip(3); // reserved

  const unisonDetune = stream.read(8);
  const tune = stream.read(8);
  const bendRange = stream.read(8);
  const transpose = stream.read(8);
  const vibrato = stream.read(8);

  const osc1Wave = stream.read(8);
  const osc1Ctrl1 = stream.read(8);
  const osc1Ctrl2 = stream.read(8);
  const osc1Dwgs = stream.read(8);
  stream.skip(8); // reserved

  const reserved2 = stream.read(2);
  const osc2Mod = stream.read(2);
  stream.skip(2); // reserved
  const osc2Wave = stream.read(2);
  const osc2Semi = stream.read(8);
  const osc2Tune = stream.read(8);
  stream.skip(1); // reserved
  const portamentoTime = stream.read(7);

  const mixOsc1 = stream.read(8);
  const mixOsc2 = stream.read(8);
  const mixNoise = stream.read(8);

  const filterType = stream.read(8);
  const filterCutoff = stream.read(8);
  const filterRes = stream.read(8);
  const filterEg1 = stream.read(8);
  stream.skip(8); // reserved = 64
  stream.skip(8); // filter keyboard track

  const ampLevel = stream.read(8);
  const ampPan = stream.read(8);
  stream.skip(5); // reserved
  const ampDist = stream.read(1);
  stream.skip(8); // reserved = 64
  stream.skip(8); // amp keyboard track

  const eg1A = stream.read(8);
  const eg1D = stream.read(8);
  const eg1S = stream.read(8);
  const eg1R = stream.read(8);

  const eg2A = stream.read(8);
  const eg2D = stream.read(8);
  const eg2S = stream.read(8);
  const eg2R = stream.read(8);

  stream.skip(2); // reserved
  const lfo1KeySync = stream.read(2);
  stream.skip(2); // reserved
  const lfo1Wave = stream.read(2);
  const lfo1Freq = stream.read(8);
  const lfo1TempoSync = stream.read(1);
  stream.skip(2); // reserved
  const lfo1SyncNote = stream.read(5);

  stream.skip(2); // reserved
  const lfo2KeySync = stream.read(2);
  stream.skip(2); // reserved
  const lfo2Wave = stream.read(2);
  const lfo2Freq = stream.read(8);
  const lfo2TempoSync = stream.read(1);
  stream.skip(2); // reserved
  const lfo2SyncNote = stream.read(5);

  // Patches (4 patches per timbre)
  const patches = [];
  for (let i = 0; i < 4; i++) {
    const dest = stream.read(4);
    const src = stream.read(4);
    const intensity = stream.read(8) - 64; // -63 to +63
    patches.push({ dest, src, intensity });
  }

  // Skip timbre padding (56 bytes)
  stream.skip(56 * 8);

  return {
    assignMode,
    unisonDetune,
    tune,
    bendRange,
    transpose,
    vibrato,
    osc1Wave,
    osc1Ctrl1,
    osc1Ctrl2,
    osc2Wave,
    osc2Mod,
    osc2Semi,
    osc2Tune,
    portamentoTime,
    mixOsc1,
    mixOsc2,
    mixNoise,
    filterType,
    filterCutoff,
    filterRes,
    filterEg1,
    ampLevel,
    ampPan,
    ampDist,
    eg1A, eg1D, eg1S, eg1R,
    eg2A, eg2D, eg2S, eg2R,
    lfo1Wave, lfo1Freq, lfo1Pitch: lfo1Freq, lfo1Filter: lfo1Freq,
    lfo2Wave, lfo2Freq, lfo2Amp: lfo2Freq, lfo2Pitch: lfo2Freq
  };
}

// ============= Program Binary Encoding =============

export function encodeProgramBinary(patch) {
  const writer = new BitStreamWriter();

  // Write name (12 bytes)
  const name = (patch.name || 'Untitled').padEnd(12, ' ').slice(0, 12);
  for (let i = 0; i < 12; i++) {
    writer.write(name.charCodeAt(i), 8);
  }

  // Write program header
  writer.write(0, 8); // reserved
  writer.write(0, 8); // reserved
  writer.write(0, 5); // reserved
  writer.write((patch.arp?.gate || 0.5) * 7, 3); // arp trigger length - 1
  writer.write(0, 8); // arp trigger pattern
  writer.write(1, 2); // reserved = 1

  const voiceMode = patch.voice?.mode === 'Layer' ? 2 : patch.voice?.mode === 'Vocoder' ? 3 : 0;
  writer.write(voiceMode, 2);

  writer.skip(12); // reserved
  writer.write(60, 8);
  writer.write(patch.delayFx?.time ? 1 : 0, 1);
  writer.skip(3);
  writer.write(0, 4); // delay time base
  writer.write(Math.round((patch.delayFx?.time || 0) * 127), 8);
  writer.write(Math.round((patch.delayFx?.feedback || 0) * 127), 8);
  writer.write(0, 8); // delay type
  writer.write(Math.round((patch.modFx?.speed || 0) * 127), 8);
  writer.write(Math.round((patch.modFx?.depth || 0) * 127), 8);
  writer.write(0, 8); // modfx type
  writer.write(6000, 8); // eq hi freq
  writer.write(Math.max(0, Math.min(127, (patch.eq?.highGain || 0) + 64)), 8);
  writer.write(250, 8); // eq lo freq
  writer.write(Math.max(0, Math.min(127, (patch.eq?.lowGain || 0) + 64)), 8);
  writer.write(patch.arp?.tempo || 120, 16);
  writer.write(patch.arp?.on ? 1 : 0, 1);
  writer.write(0, 1); // arp latch
  writer.write(0, 2); // arp target
  writer.skip(3);
  writer.write(0, 1); // arp key sync
  const arpTypeIdx = ARP_TYPES.indexOf(patch.arp?.type || 'Up');
  writer.write(arpTypeIdx >= 0 ? arpTypeIdx : 0, 4);
  writer.write(0, 4); // arp range
  writer.write(Math.round((patch.arp?.gate || 0.5) * 127), 8);
  writer.write(0, 8); // arp resolution
  writer.write(0, 8); // arp swing
  writer.write(0, 8); // kbd octave

  // Write timbre block
  writeTimbreBlock(writer, patch);

  return writer.toUint8Array();
}

function writeTimbreBlock(writer, patch) {
  writer.write(0xFF, 8); // reserved -1

  const assignModeIdx = ASSIGN_MODES.indexOf(patch.voice?.mode || 'Mono');
  writer.write(assignModeIdx >= 0 ? assignModeIdx : 0, 2);
  writer.write(0, 1); // eg2 reset
  writer.write(0, 1); // eg1 reset
  writer.write(0, 1); // trigger mode
  writer.skip(3);

  writer.write(0, 8); // unison detune
  writer.write(Math.max(0, Math.min(127, (patch.pitch?.tune || 0) + 64)), 8);
  writer.write(Math.max(0, Math.min(127, (patch.pitch?.bendRange || 0) + 64)), 8);
  writer.write(Math.max(0, Math.min(127, (patch.pitch?.transpose || 0) + 64)), 8);
  writer.write(0, 8); // pitch vibrato int

  const osc1WaveIdx = WAVES1.indexOf(patch.osc1?.wave || 'Saw');
  writer.write(osc1WaveIdx >= 0 ? osc1WaveIdx : 0, 8);
  writer.write(patch.osc1?.control1 || 0, 8);
  writer.write(patch.osc1?.control2 || 0, 8);
  writer.write(0, 8); // osc1 dwgs
  writer.write(0, 8); // reserved

  writer.skip(2); // reserved
  const osc2ModIdx = OSC2_MODS.indexOf(patch.osc2?.mod || 'Off');
  writer.write(osc2ModIdx >= 0 ? osc2ModIdx : 0, 2);
  writer.skip(2);
  const osc2WaveIdx = WAVES2.indexOf(patch.osc2?.wave || 'Saw');
  writer.write(osc2WaveIdx >= 0 ? osc2WaveIdx : 0, 2);

  writer.write(Math.max(0, Math.min(127, (patch.osc2?.semitone || 0) + 64)), 8);
  writer.write(Math.max(0, Math.min(127, (patch.osc2?.tune || 0) + 64)), 8);
  writer.skip(1);
  writer.write(Math.round((patch.voice?.portamento || 0) * 127), 7);

  writer.write(Math.round((patch.mixer?.osc1 || 0) * 127), 8);
  writer.write(Math.round((patch.mixer?.osc2 || 0) * 127), 8);
  writer.write(Math.round((patch.mixer?.noise || 0) * 127), 8);

  const filterTypeIdx = FILTER_TYPES.indexOf(patch.filter?.type || '24LPF');
  writer.write(filterTypeIdx >= 0 ? filterTypeIdx : 0, 8);
  writer.write(patch.filter?.cutoff || 64, 8);
  writer.write(Math.round((patch.filter?.resonance || 0) * 127), 8);
  writer.write(Math.max(0, Math.min(127, ((patch.filter?.envAmount || 0) / 100) + 64)), 8);
  writer.write(64, 8); // reserved
  writer.write(64, 8); // filter keyboard track

  writer.write(Math.round((patch.amp?.level || 1) * 127), 8);
  writer.write(64, 8); // amp pan
  writer.skip(5); // reserved
  writer.write(patch.amp?.dist ? 1 : 0, 1);
  writer.write(64, 8); // reserved
  writer.write(64, 8); // amp keyboard track

  writer.write(Math.round((patch.eg1_filter?.a || 0.01) * 127), 8);
  writer.write(Math.round((patch.eg1_filter?.d || 0.5) * 127), 8);
  writer.write(Math.round((patch.eg1_filter?.s || 0.5) * 127), 8);
  writer.write(Math.round((patch.eg1_filter?.r || 0.5) * 127), 8);

  writer.write(Math.round((patch.eg2_amp?.a || 0.01) * 127), 8);
  writer.write(Math.round((patch.eg2_amp?.d || 0.5) * 127), 8);
  writer.write(Math.round((patch.eg2_amp?.s || 0.8) * 127), 8);
  writer.write(Math.round((patch.eg2_amp?.r || 0.1) * 127), 8);

  writer.skip(2); // reserved
  writer.write(0, 2); // lfo1 key sync
  writer.skip(2); // reserved
  const lfo1WaveIdx = LFO_WAVES.indexOf(patch.lfo1?.wave || 'Tri');
  writer.write(lfo1WaveIdx >= 0 ? lfo1WaveIdx : 2, 2);
  writer.write(Math.round((patch.lfo1?.rate || 5) / 20 * 127), 8);
  writer.write(0, 1); // lfo1 tempo sync
  writer.skip(2); // reserved
  writer.write(0, 5); // lfo1 sync note

  writer.skip(2); // reserved
  writer.write(0, 2); // lfo2 key sync
  writer.skip(2); // reserved
  const lfo2WaveIdx = LFO_WAVES.indexOf(patch.lfo2?.wave || 'Sin');
  writer.write(lfo2WaveIdx >= 0 ? lfo2WaveIdx : 2, 2);
  writer.write(Math.round((patch.lfo2?.rate || 2) / 20 * 127), 8);
  writer.write(0, 1); // lfo2 tempo sync
  writer.skip(2); // reserved
  writer.write(0, 5); // lfo2 sync note

  // Write 4 patches
  for (let i = 0; i < 4; i++) {
    const vp = (patch.vPatch && patch.vPatch[i]) || { src: 0, dest: 0, int: 0 };
    writer.write(vp.dest || 0, 4);
    writer.write(vp.src || 0, 4);
    writer.write(Math.max(0, Math.min(127, (vp.int || 0) + 64)), 8);
  }

  // Skip timbre padding (56 bytes = 448 bits)
  writer.skip(448);
}

// ============= SysEx Message Encoding/Decoding =============

export function parseSysexMessage(bytes) {
  if (bytes.length < 7) throw new Error('SysEx message too short');
  if (bytes[0] !== 0xF0) throw new Error('Invalid SysEx start');
  if (bytes[bytes.length - 1] !== 0xF7) throw new Error('Invalid SysEx end');

  // Expected header: F0 42 30 58
  if (bytes[1] !== 0x42) throw new Error('Invalid manufacturer ID');
  if (bytes[2] !== 0x30) throw new Error('Invalid device ID');
  if (bytes[3] !== 0x58) throw new Error('Invalid product ID');

  const func = bytes[4];
  const payload = bytes.slice(5, -1);

  // Decode 8-to-7
  const decoded = decode8to7(payload);

  // Parse based on function code
  if (func === 0x40) {
    // Single program
    return decodeProgramBinary(decoded);
  } else if (func === 0x4C) {
    // 128 programs - return array
    const programs = [];
    for (let i = 0; i < 128 && i * 256 < decoded.length; i++) {
      const patchBytes = decoded.slice(i * 256, (i + 1) * 256);
      if (patchBytes.length === 256) {
        programs.push(decodeProgramBinary(patchBytes));
      }
    }
    return programs;
  } else {
    throw new Error(`Unsupported SysEx function: 0x${func.toString(16)}`);
  }
}

export function buildSysexMessage(patch) {
  // Encode program binary
  const binary = encodeProgramBinary(patch);

  // Encode with 8-to-7
  const packed = encode7to8(binary);

  // Wrap in SysEx
  const msg = new Uint8Array([
    0xF0,         // SysEx start
    0x42,         // Korg manufacturer ID
    0x30,         // device ID
    0x58,         // microKORG product ID
    0x40,         // func: current program data dump
    ...packed,    // 7-bit-packed data
    0xF7          // SysEx end
  ]);

  return msg;
}

export function buildDumpRequest() {
  // Request all 128 programs from microKORG S
  // Using function code 0x41 for "data dump request" (standard Korg protocol)
  return new Uint8Array([
    0xF0,         // SysEx start
    0x42,         // Korg manufacturer ID
    0x30,         // device ID (channel 0)
    0x58,         // microKORG product ID
    0x41,         // func: data dump request (0x41 for request, 0x40 for send)
    0xF7          // SysEx end
  ]);
}

// ============= Utility Functions =============

export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export function hexToBytes(hex) {
  const clean = hex.replace(/\s/g, '');
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
}
