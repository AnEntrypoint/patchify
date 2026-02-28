// Web Audio Synthesis Engine - Shared Module (JavaScript)
// Compatible with browser and bundlers

export const WAVES1 = ['sawtooth', 'square', 'triangle', 'sine', 'vox', 'dwgs', 'noise'];
export const WAVES2 = ['sawtooth', 'square', 'triangle'];
export const LFO_WAVES = ['sawtooth', 'square', 'triangle', 'sine'];
export const OSC_MODS = ['off', 'ring', 'sync'];
export const FILTER_TYPES = ['lowpass24', 'lowpass12', 'bandpass', 'highpass'];
export const MOD_SRCS = ['eg1', 'eg2', 'lfo1', 'lfo2'];
export const MOD_DESTS = ['pitch', 'osc2_pitch', 'cutoff', 'amp'];
export const ARP_TYPES = ['up', 'down', 'alt', 'random'];
export const VOICE_MODES = ['poly', 'mono', 'unison'];

function makeDistortionCurve(amount) {
  if (amount <= 0) return null;
  const k = amount * 100;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function generateDWGStables(ctx) {
  const tables = [];
  for (let i = 0; i < 64; i++) {
    const real = new Float32Array(64);
    const imag = new Float32Array(64);
    for (let h = 1; h < 64; h++) {
      if (i < 16) real[h] = Math.exp(-h * (0.1 + (i / 16))) * (h % 2 !== 0 ? 1 : 0.5);
      else if (i < 32) real[h] = h <= ((i - 15) * 2) ? 1 / h : 0;
      else if (i < 48) real[h] = 1 / Math.pow(h, 1 + ((i - 32) / 16));
      else real[h] = (h % Math.max(1, i - 45) === 0) ? 1 / h : 0;
    }
    tables.push(ctx.createPeriodicWave(real, imag));
  }
  return tables;
}

function generateVoxTable(ctx) {
  const real = new Float32Array(64);
  const imag = new Float32Array(64);
  for (let h = 1; h < 64; h++) {
    real[h] =
      (Math.exp(-Math.pow(h - 3, 2)) +
        Math.exp(-Math.pow(h - 12, 2) / 4) +
        Math.exp(-Math.pow(h - 24, 2) / 8)) /
      Math.sqrt(h);
  }
  return ctx.createPeriodicWave(real, imag);
}

export class Voice {
  constructor(ctx, patch, noteFreq, noiseBuffer, dcOffsetBuffer, masterDestination, lastNoteFreq, dwgsTables, voxTable, unisonDetune = 0) {
    this.ctx = ctx;
    this.patch = patch;
    this.masterDestination = masterDestination;
    this.unisonDetune = unisonDetune;

    const p = patch.pitch;
    const v = patch.voice;

    const baseFreq1 = noteFreq * Math.pow(2, p.transpose / 12);
    const baseFreq2 =
      noteFreq * Math.pow(2, (p.transpose + (patch.osc2.semitone || 0)) / 12);

    // Oscillators
    this.osc1 = ctx.createOscillator();
    if (patch.osc1.wave === 'dwgs' && dwgsTables.length > 0) {
      this.osc1.setPeriodicWave(
        dwgsTables[Math.floor(Math.min(63, Math.max(0, patch.osc1.control2 || 0)))]
      );
    } else if (patch.osc1.wave === 'vox' && voxTable) {
      this.osc1.setPeriodicWave(voxTable);
    } else if (
      ['sawtooth', 'square', 'triangle', 'sine'].includes(patch.osc1.wave)
    ) {
      this.osc1.type = patch.osc1.wave;
    } else {
      this.osc1.type = 'sawtooth';
    }
    this.osc1.detune.value = p.tune + unisonDetune;

    this.osc2 = ctx.createOscillator();
    this.osc2.type = (patch.osc2.wave || 'square');
    this.osc2.detune.value = (patch.osc2.tune || 0) + p.tune + unisonDetune;

    if (v.portamento > 0 && lastNoteFreq) {
      const lastFreq1 = lastNoteFreq * Math.pow(2, p.transpose / 12);
      const lastFreq2 =
        lastNoteFreq *
        Math.pow(2, (p.transpose + (patch.osc2.semitone || 0)) / 12);
      this.osc1.frequency.setValueAtTime(lastFreq1, ctx.currentTime);
      this.osc1.frequency.exponentialRampToValueAtTime(
        baseFreq1,
        ctx.currentTime + v.portamento
      );
      this.osc2.frequency.setValueAtTime(lastFreq2, ctx.currentTime);
      this.osc2.frequency.exponentialRampToValueAtTime(
        baseFreq2,
        ctx.currentTime + v.portamento
      );
    } else {
      this.osc1.frequency.value = baseFreq1;
      this.osc2.frequency.value = baseFreq2;
    }

    // Noise
    this.noise = ctx.createBufferSource();
    this.noise.buffer = noiseBuffer;
    this.noise.loop = true;

    // Mixer
    this.mix1 = ctx.createGain();
    this.mix1.gain.value = patch.mixer.osc1;
    this.mix2 = ctx.createGain();
    this.mix2.gain.value = patch.mixer.osc2;
    this.mixNoise = ctx.createGain();
    this.mixNoise.gain.value = patch.mixer.noise;

    this.ringNode = ctx.createGain();
    this.ringNode.gain.value = 0;

    // Filter
    this.filter = ctx.createBiquadFilter();
    this.filter2 = ctx.createBiquadFilter();

    const typeMap = {
      lowpass24: 'lowpass',
      lowpass12: 'lowpass',
      bandpass: 'bandpass',
      highpass: 'highpass',
    };
    this.filter.type = typeMap[patch.filter.type] || 'lowpass';
    this.filter2.type = typeMap[patch.filter.type] || 'lowpass';

    this.filter.Q.value = patch.filter.resonance;
    this.filter2.Q.value =
      patch.filter.resonance * (patch.filter.type === 'lowpass24' ? 0.8 : 0);

    // LFOs
    const l1 = patch.lfo1;
    this.lfo1 = ctx.createOscillator();
    this.lfo1.type = l1.wave;
    this.lfo1.frequency.value = l1.rate;

    this.lfo1PitchGain = ctx.createGain();
    this.lfo1PitchGain.gain.value = l1.pitchMod || 0;
    this.lfo1FilterGain = ctx.createGain();
    this.lfo1FilterGain.gain.value = l1.filterMod || 0;

    const l2 = patch.lfo2;
    this.lfo2 = ctx.createOscillator();
    this.lfo2.type = l2.wave;
    this.lfo2.frequency.value = l2.rate;

    this.lfo2PitchGain = ctx.createGain();
    this.lfo2PitchGain.gain.value = l2.pitchMod || 0;
    this.lfo2AmpGain = ctx.createGain();
    this.lfo2AmpGain.gain.value = l2.ampMod || 0;

    // Envelope CV signals
    this.dcOffset = ctx.createBufferSource();
    this.dcOffset.buffer = dcOffsetBuffer;
    this.dcOffset.loop = true;

    this.eg1Signal = ctx.createGain();
    this.eg1Signal.gain.value = 0;
    this.eg2Signal = ctx.createGain();
    this.eg2Signal.gain.value = 0;

    this.dcOffset.connect(this.eg1Signal);
    this.dcOffset.connect(this.eg2Signal);

    // Amp & Distortion
    this.amp = ctx.createGain();
    this.amp.gain.value = 0;

    this.distNode = ctx.createWaveShaper();
    const distCurve = makeDistortionCurve(patch.amp.dist);
    if (distCurve) {
      this.distNode.curve = distCurve;
      this.distNode.oversample = '4x';
    }

    this.ampModNode = ctx.createGain();
    this.ampModNode.gain.value = patch.amp.level;

    // Routing
    this.osc1.connect(this.mix1);

    if (patch.osc2.mod === 'ring') {
      this.osc1.connect(this.ringNode);
      this.osc2.connect(this.ringNode.gain);
      this.ringNode.connect(this.mix2);
    } else {
      this.osc2.connect(this.mix2);
    }

    this.noise.connect(this.mixNoise);

    this.mix1.connect(this.filter);
    this.mix2.connect(this.filter);
    this.mixNoise.connect(this.filter);

    if (patch.filter.type === 'lowpass24') {
      this.filter.connect(this.filter2);
      this.filter2.connect(this.amp);
    } else {
      this.filter.connect(this.amp);
    }

    // LFO connections
    this.lfo1.connect(this.lfo1PitchGain);
    this.lfo1PitchGain.connect(this.osc1.detune);
    this.lfo1PitchGain.connect(this.osc2.detune);

    this.lfo1.connect(this.lfo1FilterGain);
    this.lfo1FilterGain.connect(this.filter.detune);
    this.lfo1FilterGain.connect(this.filter2.detune);

    this.lfo2.connect(this.lfo2PitchGain);
    this.lfo2PitchGain.connect(this.osc2.detune);

    this.lfo2.connect(this.lfo2AmpGain);
    this.lfo2AmpGain.connect(this.ampModNode.gain);

    // Virtual patches
    this.vPatchNodes = [];
    patch.vPatch.forEach((p) => {
      if (p.int !== 0) {
        const vNode = ctx.createGain();
        vNode.gain.value = p.int * (p.dest === 'cutoff' ? 50 : 20);

        if (p.src === 'lfo1') this.lfo1.connect(vNode);
        else if (p.src === 'lfo2') this.lfo2.connect(vNode);
        else if (p.src === 'eg1') this.eg1Signal.connect(vNode);
        else if (p.src === 'eg2') this.eg2Signal.connect(vNode);

        if (p.dest === 'cutoff') {
          vNode.connect(this.filter.detune);
          vNode.connect(this.filter2.detune);
        } else if (p.dest === 'pitch') {
          vNode.connect(this.osc1.detune);
          vNode.connect(this.osc2.detune);
        } else if (p.dest === 'osc2_pitch') vNode.connect(this.osc2.detune);
        else if (p.dest === 'amp') vNode.connect(this.ampModNode.gain);

        this.vPatchNodes.push(vNode);
      }
    });

    // Output chain
    if (distCurve) {
      this.amp.connect(this.distNode);
      this.distNode.connect(this.ampModNode);
    } else {
      this.amp.connect(this.ampModNode);
    }

    this.ampModNode.connect(masterDestination);
  }

  start() {
    const now = this.ctx.currentTime;
    const p = this.patch;

    this.osc1.start(now);
    this.osc2.start(now);
    this.noise.start(now);
    this.lfo1.start(now);
    this.lfo2.start(now);
    this.dcOffset.start(now);

    // Amp EG
    [this.amp.gain, this.eg2Signal.gain].forEach((param) => {
      param.cancelScheduledValues(now);
      param.setValueAtTime(0, now);
      param.linearRampToValueAtTime(1, now + p.eg2_amp.a);
      param.setTargetAtTime(
        p.eg2_amp.s,
        now + p.eg2_amp.a,
        p.eg2_amp.d / 3 + 0.01
      );
    });

    // Filter EG
    const baseFreq = p.filter.cutoff;
    const peakFreq = Math.max(
      20,
      Math.min(20000, baseFreq + p.filter.envAmount)
    );
    const sustainFreq = Math.max(
      20,
      Math.min(20000, baseFreq + (p.filter.envAmount * p.eg1_filter.s))
    );

    [this.filter.frequency, this.filter2.frequency].forEach((param) => {
      param.cancelScheduledValues(now);
      param.setValueAtTime(baseFreq, now);
      param.linearRampToValueAtTime(peakFreq, now + p.eg1_filter.a);
      param.setTargetAtTime(
        sustainFreq,
        now + p.eg1_filter.a,
        p.eg1_filter.d / 3 + 0.01
      );
    });

    this.eg1Signal.gain.cancelScheduledValues(now);
    this.eg1Signal.gain.setValueAtTime(0, now);
    this.eg1Signal.gain.linearRampToValueAtTime(1, now + p.eg1_filter.a);
    this.eg1Signal.gain.setTargetAtTime(
      p.eg1_filter.s,
      now + p.eg1_filter.a,
      p.eg1_filter.d / 3 + 0.01
    );
  }

  stop() {
    const now = this.ctx.currentTime;
    const p = this.patch;
    const releaseTime = now + p.eg2_amp.r;

    [this.amp.gain, this.eg2Signal.gain].forEach((param) => {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(0.0001, releaseTime);
    });

    [this.filter.frequency, this.filter2.frequency].forEach((param) => {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(p.filter.cutoff, releaseTime);
    });

    this.eg1Signal.gain.cancelScheduledValues(now);
    this.eg1Signal.gain.setValueAtTime(this.eg1Signal.gain.value, now);
    this.eg1Signal.gain.linearRampToValueAtTime(0.0001, releaseTime);

    this.osc1.stop(releaseTime);
    this.osc2.stop(releaseTime);
    this.noise.stop(releaseTime);
    this.lfo1.stop(releaseTime);
    this.lfo2.stop(releaseTime);
    this.dcOffset.stop(releaseTime);

    setTimeout(() => {
      this.ampModNode.disconnect();
      this.vPatchNodes.forEach((n) => n.disconnect());
      this.amp.disconnect();
    }, p.eg2_amp.r * 1000 + 100);
  }

  update(patch, dwgsTables, voxTable) {
    this.patch = patch;
    const now = this.ctx.currentTime;
    const p = patch.pitch;

    // Osc1
    if (patch.osc1.wave === 'dwgs' && dwgsTables.length > 0) {
      this.osc1.setPeriodicWave(
        dwgsTables[Math.floor(Math.min(63, Math.max(0, patch.osc1.control2 || 0)))]
      );
    } else if (patch.osc1.wave === 'vox' && voxTable) {
      this.osc1.setPeriodicWave(voxTable);
    } else if (
      ['sawtooth', 'square', 'triangle', 'sine'].includes(patch.osc1.wave)
    ) {
      this.osc1.type = patch.osc1.wave;
    }
    this.osc1.detune.setTargetAtTime(p.tune + this.unisonDetune, now, 0.05);

    // Osc2
    this.osc2.type = (patch.osc2.wave || 'square');
    this.osc2.detune.setTargetAtTime(
      (patch.osc2.tune || 0) + p.tune + this.unisonDetune,
      now,
      0.05
    );

    // Mixer
    this.mix1.gain.setTargetAtTime(patch.mixer.osc1, now, 0.05);
    this.mix2.gain.setTargetAtTime(patch.mixer.osc2, now, 0.05);
    this.mixNoise.gain.setTargetAtTime(patch.mixer.noise, now, 0.05);

    // Filter
    const typeMap = {
      lowpass24: 'lowpass',
      lowpass12: 'lowpass',
      bandpass: 'bandpass',
      highpass: 'highpass',
    };
    this.filter.type = typeMap[patch.filter.type] || 'lowpass';
    this.filter2.type = typeMap[patch.filter.type] || 'lowpass';
    this.filter.Q.setTargetAtTime(patch.filter.resonance, now, 0.05);
    this.filter2.Q.setTargetAtTime(
      patch.filter.resonance * (patch.filter.type === 'lowpass24' ? 0.8 : 0),
      now,
      0.05
    );

    // LFO1
    const l1 = patch.lfo1;
    this.lfo1.type = l1.wave;
    this.lfo1.frequency.setTargetAtTime(l1.rate, now, 0.05);
    this.lfo1PitchGain.gain.setTargetAtTime(l1.pitchMod || 0, now, 0.05);
    this.lfo1FilterGain.gain.setTargetAtTime(l1.filterMod || 0, now, 0.05);

    // LFO2
    const l2 = patch.lfo2;
    this.lfo2.type = l2.wave;
    this.lfo2.frequency.setTargetAtTime(l2.rate, now, 0.05);
    this.lfo2PitchGain.gain.setTargetAtTime(l2.pitchMod || 0, now, 0.05);
    this.lfo2AmpGain.gain.setTargetAtTime(l2.ampMod || 0, now, 0.05);

    // Amp
    this.ampModNode.gain.setTargetAtTime(patch.amp.level, now, 0.05);
  }
}

export class SynthEngine {
  constructor() {
    const AudioContextClass =
      window.AudioContext || (window).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.dwgsTables = generateDWGStables(this.ctx);
    this.voxTable = generateVoxTable(this.ctx);

    // DC offset buffer for envelope CV signals
    this.dcBuffer = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * 2,
      this.ctx.sampleRate
    );
    const dcData = this.dcBuffer.getChannelData(0);
    for (let i = 0; i < dcData.length; i++) dcData[i] = 1;

    this.fxBus = this.ctx.createGain();
    this.fxBus.gain.value = 1.0;

    // Chorus
    this.chorusDelay = this.ctx.createDelay(0.1);
    this.chorusDelay.delayTime.value = 0.02;
    this.chorusLFO = this.ctx.createOscillator();
    this.chorusLFO.frequency.value = 1.0;
    this.chorusLFOGain = this.ctx.createGain();
    this.chorusLFOGain.gain.value = 0.005;
    this.chorusLFO.connect(this.chorusLFOGain);
    this.chorusLFOGain.connect(this.chorusDelay.delayTime);
    this.chorusLFO.start();

    this.chorusMix = this.ctx.createGain();
    this.chorusMix.gain.value = 0;

    this.fxBus.connect(this.chorusDelay);
    this.chorusDelay.connect(this.chorusMix);

    // Delay
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.3;
    this.delayMix = this.ctx.createGain();
    this.delayMix.gain.value = 0;

    this.fxBus.connect(this.delayNode);
    this.chorusMix.connect(this.delayNode);

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayMix);

    // EQ
    this.eqLow = this.ctx.createBiquadFilter();
    this.eqLow.type = 'lowshelf';
    this.eqHigh = this.ctx.createBiquadFilter();
    this.eqHigh.type = 'highshelf';

    // Master
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.ratio.value = 4;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    this.fxBus.connect(this.masterGain);
    this.chorusMix.connect(this.masterGain);
    this.delayMix.connect(this.masterGain);

    this.masterGain.connect(this.eqLow);
    this.eqLow.connect(this.eqHigh);
    this.eqHigh.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.voices = new Map();
    this.patch = null;
    this.noiseBuffer = this.createNoiseBuffer();
    this.lastNoteFreq = null;
    this.arpTimer = null;
  }

  createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    return buffer;
  }

  updatePatch(patch) {
    this.patch = patch;
    const now = this.ctx.currentTime;

    // Mod FX
    const mFx = patch.modFx;
    this.chorusLFO.frequency.setTargetAtTime(mFx.speed, now, 0.05);
    this.chorusLFOGain.gain.setTargetAtTime(mFx.depth * 0.0001, now, 0.05);
    this.chorusMix.gain.setTargetAtTime(mFx.mix, now, 0.05);

    // Delay FX
    const dFx = patch.delayFx;
    this.delayNode.delayTime.setTargetAtTime(dFx.time, now, 0.05);
    this.delayFeedback.gain.setTargetAtTime(dFx.feedback, now, 0.05);
    this.delayMix.gain.setTargetAtTime(dFx.mix, now, 0.05);

    // EQ
    const eq = patch.eq;
    this.eqLow.frequency.setTargetAtTime(eq.lowFreq, now, 0.05);
    this.eqLow.gain.setTargetAtTime(eq.lowGain, now, 0.05);
    this.eqHigh.frequency.setTargetAtTime(eq.highFreq, now, 0.05);
    this.eqHigh.gain.setTargetAtTime(eq.highGain, now, 0.05);

    // Update active voices
    this.voices.forEach((voice) => voice.update(patch, this.dwgsTables, this.voxTable));
  }

  setMasterVolume(val) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  noteOn(note, velocity = 127) {
    if (!this.patch) return;

    const vMode = this.patch.voice.mode;
    const freq = 440 * Math.pow(2, (note - 69) / 12);

    // Handle poly mode - retrigger same note
    if (vMode === 'poly' && this.voices.has(note)) {
      this.noteOff(note);
    }

    // For mono/unison, kill all existing voices
    if (vMode === 'mono' || vMode === 'unison') {
      this.voices.forEach((v) => v.stop());
      this.voices.clear();
    }

    if (vMode === 'unison') {
      const detunes = [-12, -4, 4, 12];
      detunes.forEach((d) => {
        const voice = new Voice(
          this.ctx,
          this.patch,
          freq,
          this.noiseBuffer,
          this.dcBuffer,
          this.fxBus,
          this.lastNoteFreq,
          this.dwgsTables,
          this.voxTable,
          d
        );
        this.voices.set(`${note}_${d}`, voice);
        voice.start();
      });
    } else {
      const voice = new Voice(
        this.ctx,
        this.patch,
        freq,
        this.noiseBuffer,
        this.dcBuffer,
        this.fxBus,
        this.lastNoteFreq,
        this.dwgsTables,
        this.voxTable
      );
      this.voices.set(note, voice);
      voice.start();
    }

    this.lastNoteFreq = freq;
  }

  noteOff(note) {
    if (this.patch?.voice.mode === 'unison') {
      for (const d of [-12, -4, 4, 12]) {
        const v = this.voices.get(`${note}_${d}`);
        if (v) {
          v.stop();
          this.voices.delete(`${note}_${d}`);
        }
      }
    } else {
      const v = this.voices.get(note);
      if (v) {
        v.stop();
        this.voices.delete(note);
      }
    }
  }

  startArp(notes) {
    this.stopArp();
    if (notes.length === 0 || !this.patch) return;

    let step = 0;
    let upDownDir = 1;
    const sortedNotes = [...notes].sort((a, b) => a - b);
    const arpTempo = this.patch.arp.tempo;
    const arpGate = this.patch.arp.gate;
    const type = this.patch.arp.type;
    const intervalMs = (60 / arpTempo) * 250;

    this.arpTimer = setInterval(() => {
      if (!this.patch) return;

      let nIdx = 0;
      const L = sortedNotes.length;
      if (type === 'up') nIdx = step % L;
      else if (type === 'down') nIdx = (L - 1) - (step % L);
      else if (type === 'random') nIdx = Math.floor(Math.random() * L);
      else {
        nIdx = step;
        if (nIdx >= L - 1) upDownDir = -1;
        if (nIdx <= 0) upDownDir = 1;
        step += upDownDir;
        if (step < 0) step = 0;
      }

      const note = sortedNotes[nIdx];
      this.noteOn(note);
      setTimeout(() => this.noteOff(note), intervalMs * arpGate);

      if (type !== 'alt') step++;
    }, intervalMs);
  }

  stopArp() {
    if (this.arpTimer) clearInterval(this.arpTimer);
    this.arpTimer = null;
  }

  destroy() {
    this.stopArp();
    this.voices.forEach((v) => v.stop());
    this.voices.clear();
    this.ctx.close();
  }
}

// Factory presets
export const FACTORY_PRESETS = {
  'Init Program': {
    name: 'Init Program',
    voice: { mode: 'poly', portamento: 0 },
    pitch: { transpose: 0, tune: 0 },
    osc1: { wave: 'sawtooth', control1: 0, control2: 0 },
    osc2: { wave: 'sawtooth', mod: 'off', semitone: 0, tune: 10 },
    mixer: { osc1: 1.0, osc2: 0.0, noise: 0.0 },
    filter: { type: 'lowpass24', cutoff: 10000, resonance: 1, envAmount: 0 },
    eg1_filter: { a: 0.01, d: 0.5, s: 0.5, r: 0.5 },
    amp: { level: 1.0, dist: 0 },
    eg2_amp: { a: 0.01, d: 0.5, s: 1.0, r: 0.1 },
    lfo1: { wave: 'triangle', rate: 5.0, pitchMod: 0, filterMod: 0 },
    lfo2: { wave: 'sine', rate: 2.0, ampMod: 0, pitchMod: 0 },
    vPatch: [
      { src: 'lfo1', dest: 'cutoff', int: 0 },
      { src: 'eg1', dest: 'pitch', int: 0 },
      { src: 'lfo2', dest: 'amp', int: 0 },
      { src: 'eg2', dest: 'osc2_pitch', int: 0 },
    ],
    modFx: { speed: 1.0, depth: 0, mix: 0 },
    delayFx: { time: 0.3, feedback: 0.3, mix: 0 },
    eq: { lowFreq: 250, lowGain: 0, highFreq: 6000, highGain: 0 },
    arp: { on: false, type: 'up', tempo: 120, gate: 0.5 },
  },
  'Fat Bass': {
    name: 'Fat Bass',
    voice: { mode: 'mono', portamento: 0.05 },
    pitch: { transpose: -12, tune: 0 },
    osc1: { wave: 'sawtooth', control1: 0, control2: 0 },
    osc2: { wave: 'square', mod: 'off', semitone: 0, tune: 10 },
    mixer: { osc1: 1.0, osc2: 0.8, noise: 0.05 },
    filter: { type: 'lowpass24', cutoff: 300, resonance: 8, envAmount: 2500 },
    eg1_filter: { a: 0.02, d: 0.4, s: 0.1, r: 0.3 },
    amp: { level: 1.0, dist: 0.2 },
    eg2_amp: { a: 0.01, d: 0.3, s: 0.8, r: 0.2 },
    lfo1: { wave: 'triangle', rate: 0.5, pitchMod: 0, filterMod: 100 },
    lfo2: { wave: 'square', rate: 5.0, ampMod: 0, pitchMod: 0 },
    vPatch: [
      { src: 'lfo2', dest: 'pitch', int: 5 },
      { src: 'eg1', dest: 'osc2_pitch', int: 10 },
      { src: 'lfo1', dest: 'cutoff', int: 0 },
      { src: 'lfo1', dest: 'cutoff', int: 0 },
    ],
    modFx: { speed: 2.5, depth: 40, mix: 0.2 },
    delayFx: { time: 0.1, feedback: 0.1, mix: 0 },
    eq: { lowFreq: 100, lowGain: 5, highFreq: 6000, highGain: 0 },
    arp: { on: false, type: 'up', tempo: 120, gate: 0.5 },
  },
  'Sweeping Pad': {
    name: 'Sweeping Pad',
    voice: { mode: 'poly', portamento: 0 },
    pitch: { transpose: 0, tune: 0 },
    osc1: { wave: 'dwgs', control1: 0, control2: 24 },
    osc2: { wave: 'sawtooth', mod: 'off', semitone: 0, tune: 12 },
    mixer: { osc1: 0.7, osc2: 0.7, noise: 0.1 },
    filter: { type: 'lowpass12', cutoff: 800, resonance: 3, envAmount: 4000 },
    eg1_filter: { a: 2.0, d: 3.0, s: 0.6, r: 2.5 },
    amp: { level: 0.8, dist: 0 },
    eg2_amp: { a: 1.5, d: 2.0, s: 0.8, r: 2.0 },
    lfo1: { wave: 'sine', rate: 0.2, pitchMod: 10, filterMod: 1500 },
    lfo2: { wave: 'triangle', rate: 1.5, ampMod: 0.1, pitchMod: 0 },
    vPatch: [
      { src: 'lfo1', dest: 'cutoff', int: 20 },
      { src: 'eg2', dest: 'cutoff', int: -15 },
      { src: 'lfo2', dest: 'pitch', int: 2 },
      { src: 'lfo1', dest: 'cutoff', int: 0 },
    ],
    modFx: { speed: 0.8, depth: 80, mix: 0.5 },
    delayFx: { time: 0.4, feedback: 0.5, mix: 0.4 },
    eq: { lowFreq: 250, lowGain: -2, highFreq: 8000, highGain: 4 },
    arp: { on: false, type: 'up', tempo: 90, gate: 0.8 },
  },
  'Unison Lead': {
    name: 'Unison Lead',
    voice: { mode: 'unison', portamento: 0.02 },
    pitch: { transpose: 12, tune: 0 },
    osc1: { wave: 'square', control1: 0, control2: 0 },
    osc2: { wave: 'sawtooth', mod: 'ring', semitone: 0, tune: 15 },
    mixer: { osc1: 1.0, osc2: 0.6, noise: 0.0 },
    filter: { type: 'bandpass', cutoff: 1500, resonance: 5, envAmount: 3000 },
    eg1_filter: { a: 0.05, d: 0.3, s: 0.2, r: 0.3 },
    amp: { level: 1.0, dist: 0.1 },
    eg2_amp: { a: 0.01, d: 0.2, s: 0.5, r: 0.1 },
    lfo1: { wave: 'triangle', rate: 6.0, pitchMod: 20, filterMod: 0 },
    lfo2: { wave: 'sine', rate: 4.0, ampMod: 0, pitchMod: 10 },
    vPatch: [
      { src: 'lfo2', dest: 'cutoff', int: 30 },
      { src: 'eg1', dest: 'pitch', int: 0 },
      { src: 'lfo1', dest: 'cutoff', int: 0 },
      { src: 'lfo1', dest: 'cutoff', int: 0 },
    ],
    modFx: { speed: 5.0, depth: 20, mix: 0.1 },
    delayFx: { time: 0.25, feedback: 0.4, mix: 0.3 },
    eq: { lowFreq: 250, lowGain: 0, highFreq: 6000, highGain: 2 },
    arp: { on: true, type: 'alt', tempo: 130, gate: 0.5 },
  },
};

export function parseMicroKorgSysex(hexStr) {
  const cleanStr = hexStr.replace(/\s+/g, '');
  const bytes = cleanStr.match(/.{1,2}/g).map((b) => parseInt(b, 16));

  if (bytes[0] !== 0xf0 || bytes[bytes.length - 1] !== 0xf7) {
    throw new Error(
      'Invalid SysEx formatting. Must start with F0 and end with F7.'
    );
  }

  const safeGet = (index, defaultVal) =>
    bytes.length > index ? bytes[index] : defaultVal;
  const mapRange = (
    val,
    outMin,
    outMax
  ) => outMin + ((val / 127) * (outMax - outMin));

  return {
    name: 'SysEx Import',
    voice: {
      mode: VOICE_MODES[safeGet(18, 0) % 3],
      portamento: mapRange(safeGet(19, 0), 0, 1),
    },
    pitch: {
      transpose: Math.floor(mapRange(safeGet(16, 64), -24, 24)),
      tune: mapRange(safeGet(17, 64), -50, 50),
    },
    osc1: {
      wave: WAVES1[safeGet(20, 0) % 8],
      control1: mapRange(safeGet(21, 0), 0, 127),
      control2: mapRange(safeGet(22, 0), 0, 63),
    },
    osc2: {
      wave: WAVES2[safeGet(23, 1) % 3],
      mod: OSC_MODS[(safeGet(23, 0) >> 4) % 4],
      semitone: Math.floor(mapRange(safeGet(24, 64), -24, 24)),
      tune: mapRange(safeGet(25, 64), -50, 50),
    },
    mixer: {
      osc1: mapRange(safeGet(26, 127), 0, 1),
      osc2: mapRange(safeGet(27, 0), 0, 1),
      noise: mapRange(safeGet(28, 0), 0, 1),
    },
    filter: {
      type: FILTER_TYPES[safeGet(28, 0) % 4],
      cutoff: Math.pow(2, mapRange(safeGet(29, 100), Math.log2(20), Math.log2(15000))),
      resonance: mapRange(safeGet(30, 10), 0, 20),
      envAmount: mapRange(safeGet(31, 64), -5000, 5000),
    },
    eg1_filter: {
      a: mapRange(safeGet(32, 10), 0.01, 5),
      d: mapRange(safeGet(33, 64), 0.01, 5),
      s: mapRange(safeGet(34, 64), 0, 1),
      r: mapRange(safeGet(35, 64), 0.01, 5),
    },
    amp: {
      level: mapRange(safeGet(38, 127), 0, 1),
      dist: mapRange(safeGet(55, 0), 0, 1),
    },
    eg2_amp: {
      a: mapRange(safeGet(36, 10), 0.01, 5),
      d: mapRange(safeGet(37, 64), 0.01, 5),
      s: mapRange(safeGet(38, 127), 0, 1),
      r: mapRange(safeGet(39, 64), 0.01, 5),
    },
    lfo1: {
      wave: LFO_WAVES[safeGet(40, 2) % 4],
      rate: mapRange(safeGet(41, 64), 0.1, 20),
      pitchMod: mapRange(safeGet(42, 64), -1200, 1200),
      filterMod: mapRange(safeGet(43, 64), -5000, 5000),
    },
    lfo2: {
      wave: LFO_WAVES[safeGet(44, 3) % 4],
      rate: mapRange(safeGet(45, 64), 0.1, 20),
      ampMod: mapRange(safeGet(46, 0), 0, 1),
      pitchMod: mapRange(safeGet(47, 64), -1200, 1200),
    },
    vPatch: [
      {
        src: MOD_SRCS[safeGet(58, 2) % 4],
        dest: MOD_DESTS[safeGet(59, 2) % 4],
        int: mapRange(safeGet(60, 64), -64, 63),
      },
      {
        src: MOD_SRCS[safeGet(61, 2) % 4],
        dest: MOD_DESTS[safeGet(62, 2) % 4],
        int: mapRange(safeGet(63, 64), -64, 63),
      },
      {
        src: MOD_SRCS[safeGet(64, 2) % 4],
        dest: MOD_DESTS[safeGet(65, 2) % 4],
        int: mapRange(safeGet(66, 64), -64, 63),
      },
      {
        src: MOD_SRCS[safeGet(67, 2) % 4],
        dest: MOD_DESTS[safeGet(68, 2) % 4],
        int: mapRange(safeGet(69, 64), -64, 63),
      },
    ],
    modFx: {
      speed: mapRange(safeGet(48, 64), 0.1, 10),
      depth: mapRange(safeGet(49, 0), 0, 100),
      mix: mapRange(safeGet(50, 0), 0, 1),
    },
    delayFx: {
      time: mapRange(safeGet(51, 64), 0.01, 1.0),
      feedback: mapRange(safeGet(52, 0), 0, 0.9),
      mix: mapRange(safeGet(53, 0), 0, 1),
    },
    eq: {
      lowFreq: 250,
      lowGain: mapRange(safeGet(56, 64), -12, 12),
      highFreq: 6000,
      highGain: mapRange(safeGet(57, 64), -12, 12),
    },
    arp: {
      on: safeGet(70, 0) > 0,
      type: ARP_TYPES[safeGet(72, 0) % 4],
      tempo: mapRange(safeGet(71, 60), 40, 300),
      gate: mapRange(safeGet(74, 64), 0.1, 1.0),
    },
  };
}