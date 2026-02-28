import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Upload, Download, Settings, Volume2, Save, FileJson, Cpu } from 'lucide-react';
import { CanvasAnalyzer } from './components/CanvasAnalyzer';
import { ControlKnob } from './components/ControlKnob';
import { DiscreteControl } from './components/DiscreteControl';
import { MatrixSection } from './components/MatrixSection';
import { api } from './api';
import { connectWebSocket, sendMidiToServer, initMidi, disconnectMidi } from './midi';
import { FACTORY_PRESETS, SynthEngine, parseMicroKorgSysex } from '@shared/synth-engine';

const WAVES1 = ['sawtooth', 'square', 'triangle', 'sine', 'vox', 'dwgs', 'noise'];
const WAVES2 = ['sawtooth', 'square', 'triangle'];
const LFO_WAVES = ['sawtooth', 'square', 'triangle', 'sine'];
const OSC_MODS = ['off', 'ring', 'sync'];
const FILTER_TYPES = ['lowpass24', 'lowpass12', 'bandpass', 'highpass'];
const MOD_SRCS = ['eg1', 'eg2', 'lfo1', 'lfo2'];
const MOD_DESTS = ['pitch', 'osc2_pitch', 'cutoff', 'amp'];
const ARP_TYPES = ['up', 'down', 'alt', 'random'];
const VOICE_MODES = ['poly', 'mono', 'unison'];

function App() {
  const [engine, setEngine] = useState(null);
  const [patch, setPatch] = useState(FACTORY_PRESETS['Init Program']);
  const [masterVol, setMasterVol] = useState(0.4);
  const [lcdText, setLcdText] = useState('Init Program');
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [showImporter, setShowImporter] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [patches, setPatches] = useState([]);
  const [activeVPatchIdx, setActiveVPatchIdx] = useState(0);

  const lcdTimeout = useRef(null);

  const initAudio = () => {
    if (!engine) {
      const newEngine = new SynthEngine();
      newEngine.updatePatch(patch);
      newEngine.setMasterVolume(masterVol);
      setEngine(newEngine);
    } else if (engine.ctx.state === 'suspended') {
      engine.ctx.resume();
    }
  };

  useEffect(() => {
    if (engine) engine.updatePatch(patch);
  }, [patch, engine]);

  useEffect(() => {
    if (!patch.arp?.on || !engine || activeNotes.size === 0) {
      engine?.stopArp();
      return;
    }
    engine.startArp(Array.from(activeNotes));
  }, [activeNotes, patch.arp?.on, patch.arp?.tempo, patch.arp?.gate, patch.arp?.type, engine]);

  useEffect(() => {
    api.listPatches().then(setPatches);
  }, []);

  useEffect(() => {
    connectWebSocket((msg) => {
      if (msg.type === 'midi') {
        console.log('MIDI from server:', msg.midi);
      } else if (msg.type === 'patch:saved') {
        api.listPatches().then(setPatches);
        setLcdText('Patch Saved!');
      }
    });
  }, []);

  useEffect(() => {
    initMidi(
      (note, velocity) => {
        setActiveNotes((prev) => new Set(prev).add(note));
        if (!patch.arp?.on) engine?.noteOn(note);
      },
      (note) => {
        setActiveNotes((prev) => {
          const next = new Set(prev);
          next.delete(note);
          return next;
        });
        if (!patch.arp?.on) engine?.noteOff(note);
      }
    );
    return () => disconnectMidi();
  }, [engine, activeNotes, patch.arp?.on]);

  const showOnLcd = useCallback((text) => {
    setLcdText(text);
    if (lcdTimeout.current) clearTimeout(lcdTimeout.current);
    lcdTimeout.current = setTimeout(() => setLcdText(patch.name), 1500);
  }, [patch.name]);

  const updateParam = (section, param, value) => {
    setPatch((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [param]: value },
    }));
  };

  const updateVPatch = (param, value) => {
    setPatch((prev) => {
      const newV = [...prev.vPatch];
      newV[activeVPatchIdx] = { ...newV[activeVPatchIdx], [param]: value };
      return { ...prev, vPatch: newV };
    });
  };

  const KEY_MAP = {
    a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ';': 76,
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      initAudio();
      const note = KEY_MAP[e.key.toLowerCase()];
      if (note && !activeNotes.has(note)) {
        setActiveNotes((prev) => new Set(prev).add(note));
        if (!patch.arp?.on) engine?.noteOn(note);
      }
    };
    const handleKeyUp = (e) => {
      const note = KEY_MAP[e.key.toLowerCase()];
      if (note) {
        setActiveNotes((prev) => {
          const next = new Set(prev);
          next.delete(note);
          return next;
        });
        if (!patch.arp?.on) engine?.noteOff(note);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, activeNotes, patch.arp?.on]);

  const handleNoteOn = (note) => {
    initAudio();
    setActiveNotes((prev) => new Set(prev).add(note));
    if (!patch.arp?.on) engine?.noteOn(note);
  };

  const handleNoteOff = (note) => {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    if (!patch.arp?.on) engine?.noteOff(note);
  };

  const handleImport = () => {
    try {
      setImportError('');
      let newPatch = importText.trim().startsWith('{')
        ? JSON.parse(importText)
        : parseMicroKorgSysex(importText);
      setPatch({ ...FACTORY_PRESETS['Init Program'], ...newPatch });
      showOnLcd('Import Success!');
      setShowImporter(false);
      setImportText('');
    } catch (err) {
      setImportError(err.message || 'Invalid Patch Data');
    }
  };

  const handleSavePatch = async () => {
    try {
      await api.savePatch(patch);
      setPatches(await api.listPatches());
      showOnLcd('Patch Saved!');
    } catch (err) {
      showOnLcd('Save Failed!');
    }
  };

  const handleLoadPatch = async (patchName) => {
    try {
      const loadedPatch = await api.getPatch(patchName);
      setPatch(loadedPatch);
      showOnLcd(`Loaded: ${patchName}`);
    } catch (err) {
      showOnLcd('Load Failed!');
    }
  };

  const renderKeys = () => {
    const keys = [];
    const layout = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0];
    const labels = Object.keys(KEY_MAP);

    layout.forEach((isBlack, i) => {
      const note = 60 + i;
      const isActive = activeNotes.has(note);
      const label = labels[i]?.toUpperCase() || '';

      if (isBlack) {
        keys.push(
          <div
            key={note}
            onMouseDown={() => handleNoteOn(note)}
            onMouseUp={() => handleNoteOff(note)}
            onMouseLeave={() => handleNoteOff(note)}
            className={`relative w-8 h-24 -mx-4 z-10 rounded-b-md border border-neutral-900 cursor-pointer shadow-lg flex items-end justify-center pb-2 select-none transition-colors duration-75 ${isActive ? 'bg-neutral-700' : 'bg-neutral-900'}`}
          >
            <span className="text-[10px] text-neutral-500 pointer-events-none">{label}</span>
          </div>
        );
      } else {
        keys.push(
          <div
            key={note}
            onMouseDown={() => handleNoteOn(note)}
            onMouseUp={() => handleNoteOff(note)}
            onMouseLeave={() => handleNoteOff(note)}
            className={`relative w-12 h-40 border border-neutral-300 rounded-b-md cursor-pointer flex items-end justify-center pb-2 select-none transition-colors duration-75 shadow-sm ${isActive ? 'bg-amber-100' : 'bg-white z-0'}`}
          >
            <span className="text-[10px] text-neutral-400 font-bold pointer-events-none">{label}</span>
          </div>
        );
      }
    });
    return keys;
  };

  return (
    <div
      className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 font-sans select-none"
      onMouseDown={initAudio}
    >
      <div className="max-w-6xl w-full text-neutral-500 text-sm mb-4 px-4 flex justify-between">
        <p>Click anywhere or play <strong>A-K</strong> keys. Scroll/Drag knobs to adjust.</p>
      </div>

      <div className="relative max-w-6xl w-full bg-[#2a2a2a] rounded-lg shadow-2xl flex flex-col border-t border-neutral-600 box-border">
        <div className="absolute top-0 bottom-0 left-0 w-6 bg-amber-900 border-r-2 border-[#1a110a] shadow-[inset_-4px_0_10px_rgba(0,0,0,0.6)] rounded-l-lg z-20 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-6 bg-amber-900 border-l-2 border-[#1a110a] shadow-[inset_4px_0_10px_rgba(0,0,0,0.6)] rounded-r-lg z-20 pointer-events-none" />

        <div className="px-10 py-6 flex flex-col gap-6 z-10">
          <div className="flex justify-between items-end border-b-2 border-neutral-700 pb-4">
            <div className="flex items-center gap-3">
              <Cpu className="text-amber-500 w-8 h-8" />
              <h1 className="text-3xl font-black text-neutral-300 tracking-tighter italic">WebKORG</h1>
              <span className="bg-amber-600 text-stone-900 text-xs font-bold px-2 py-0.5 rounded-sm ml-2">EMULATOR</span>
            </div>

            <div className="flex gap-4 items-center bg-neutral-900 p-2 rounded border-2 border-neutral-800 shadow-inner">
              <div className="w-48 h-16 bg-[#171717] rounded relative overflow-hidden flex items-center justify-center">
                {engine ? <CanvasAnalyzer analyser={engine.analyser} /> : <div className="text-amber-500/50 text-xs font-mono">AWAITING AUDIO</div>}
              </div>
              <div className="w-40 h-16 bg-[#1a1a1a] rounded border border-neutral-700 p-2 flex flex-col justify-center">
                <p className="text-amber-500 font-mono text-sm leading-tight truncate">{lcdText}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <select
                  className="bg-neutral-800 text-amber-500 border border-neutral-600 text-xs font-mono p-1 rounded outline-none w-32"
                  value={patch.name}
                  onChange={(e) => {
                    const presetName = e.target.value;
                    if (FACTORY_PRESETS[presetName]) {
                      setPatch(FACTORY_PRESETS[presetName]);
                      showOnLcd('Preset Loaded');
                    } else {
                      handleLoadPatch(presetName);
                    }
                  }}
                >
                  <optgroup label="Factory Presets">
                    {Object.keys(FACTORY_PRESETS).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                  {patches.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowImporter(true)}
                    className="bg-neutral-700 hover:bg-neutral-600 text-xs text-white py-1 px-2 rounded border border-neutral-500 flex items-center gap-1 justify-center"
                  >
                    <Download size={12} /> Import
                  </button>
                  <button
                    onClick={handleSavePatch}
                    className="bg-neutral-700 hover:bg-neutral-600 text-xs text-white py-1 px-2 rounded border border-neutral-500 flex items-center gap-1 justify-center"
                  >
                    <Save size={12} /> Save
                  </button>
                </div>
              </div>
              <ControlKnob
                label="Master"
                paramKey="master"
                value={masterVol}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => {
                  setMasterVol(v);
                  engine?.setMasterVolume(v);
                }}
                showLcd={showOnLcd}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 bg-neutral-900 p-4 rounded-md border border-neutral-700 shadow-inner overflow-hidden">
            <MatrixSection title="Voice">
              <DiscreteControl
                label="Mode"
                options={VOICE_MODES}
                value={patch.voice?.mode}
                onChange={(v) => updateParam('voice', 'mode', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Porta"
                paramKey="portamento"
                value={patch.voice?.portamento}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('voice', 'portamento', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Pitch">
              <ControlKnob
                label="Trans"
                paramKey="transpose"
                value={patch.pitch?.transpose}
                min={-24}
                max={24}
                step={1}
                onChange={(v) => updateParam('pitch', 'transpose', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Tune"
                paramKey="tune"
                value={patch.pitch?.tune}
                min={-50}
                max={50}
                step={1}
                onChange={(v) => updateParam('pitch', 'tune', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Oscillator 1">
              <DiscreteControl
                label="Wave"
                options={WAVES1}
                value={patch.osc1?.wave}
                onChange={(v) => updateParam('osc1', 'wave', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Ctrl 1"
                paramKey="control1"
                value={patch.osc1?.control1 || 0}
                min={0}
                max={127}
                step={1}
                onChange={(v) => updateParam('osc1', 'control1', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Ctrl 2"
                paramKey="control2"
                value={patch.osc1?.control2 || 0}
                min={0}
                max={63}
                step={1}
                onChange={(v) => updateParam('osc1', 'control2', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Oscillator 2">
              <DiscreteControl
                label="Wave"
                options={WAVES2}
                value={patch.osc2?.wave}
                onChange={(v) => updateParam('osc2', 'wave', v)}
                showLcd={showOnLcd}
              />
              <DiscreteControl
                label="Mod"
                options={OSC_MODS}
                value={patch.osc2?.mod}
                onChange={(v) => updateParam('osc2', 'mod', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Semi"
                paramKey="semitone"
                value={patch.osc2?.semitone || 0}
                min={-24}
                max={24}
                step={1}
                onChange={(v) => updateParam('osc2', 'semitone', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Tune"
                paramKey="tune"
                value={patch.osc2?.tune || 0}
                min={-50}
                max={50}
                step={1}
                onChange={(v) => updateParam('osc2', 'tune', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Mixer">
              <ControlKnob
                label="Osc 1"
                paramKey="osc1"
                value={patch.mixer?.osc1}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('mixer', 'osc1', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Osc 2"
                paramKey="osc2"
                value={patch.mixer?.osc2}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('mixer', 'osc2', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Noise"
                paramKey="noise"
                value={patch.mixer?.noise}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('mixer', 'noise', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Filter">
              <DiscreteControl
                label="Type"
                options={FILTER_TYPES}
                value={patch.filter?.type}
                onChange={(v) => updateParam('filter', 'type', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Cutoff"
                paramKey="cutoff"
                value={patch.filter?.cutoff}
                min={20}
                max={20000}
                step={10}
                onChange={(v) => updateParam('filter', 'cutoff', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Reson"
                paramKey="resonance"
                value={patch.filter?.resonance}
                min={0}
                max={20}
                step={0.1}
                onChange={(v) => updateParam('filter', 'resonance', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="EG Int"
                paramKey="envAmount"
                value={patch.filter?.envAmount}
                min={-5000}
                max={5000}
                step={10}
                onChange={(v) => updateParam('filter', 'envAmount', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Filter EG">
              <ControlKnob
                label="A"
                paramKey="a"
                value={patch.eg1_filter?.a}
                min={0.01}
                max={5}
                step={0.01}
                onChange={(v) => updateParam('eg1_filter', 'a', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="D"
                paramKey="d"
                value={patch.eg1_filter?.d}
                min={0.01}
                max={5}
                step={0.01}
                onChange={(v) => updateParam('eg1_filter', 'd', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="S"
                paramKey="s"
                value={patch.eg1_filter?.s}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('eg1_filter', 's', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="R"
                paramKey="r"
                value={patch.eg1_filter?.r}
                min={0.01}
                max={5}
                step={0.01}
                onChange={(v) => updateParam('eg1_filter', 'r', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Amp">
              <ControlKnob
                label="Level"
                paramKey="level"
                value={patch.amp?.level}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('amp', 'level', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Dist"
                paramKey="dist"
                value={patch.amp?.dist}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('amp', 'dist', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Amp EG">
              <ControlKnob
                label="A"
                paramKey="a"
                value={patch.eg2_amp?.a}
                min={0.01}
                max={5}
                step={0.01}
                onChange={(v) => updateParam('eg2_amp', 'a', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="D"
                paramKey="d"
                value={patch.eg2_amp?.d}
                min={0.01}
                max={5}
                step={0.01}
                onChange={(v) => updateParam('eg2_amp', 'd', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="S"
                paramKey="s"
                value={patch.eg2_amp?.s}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('eg2_amp', 's', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="R"
                paramKey="r"
                value={patch.eg2_amp?.r}
                min={0.01}
                max={5}
                step={0.01}
                onChange={(v) => updateParam('eg2_amp', 'r', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="LFO 1">
              <DiscreteControl
                label="Wave"
                options={LFO_WAVES}
                value={patch.lfo1?.wave}
                onChange={(v) => updateParam('lfo1', 'wave', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Rate"
                paramKey="rate"
                value={patch.lfo1?.rate}
                min={0.1}
                max={20}
                step={0.1}
                onChange={(v) => updateParam('lfo1', 'rate', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="P.Mod"
                paramKey="pitchMod"
                value={patch.lfo1?.pitchMod}
                min={-1200}
                max={1200}
                step={10}
                onChange={(v) => updateParam('lfo1', 'pitchMod', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="F.Mod"
                paramKey="filterMod"
                value={patch.lfo1?.filterMod}
                min={-5000}
                max={5000}
                step={10}
                onChange={(v) => updateParam('lfo1', 'filterMod', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="LFO 2">
              <DiscreteControl
                label="Wave"
                options={LFO_WAVES}
                value={patch.lfo2?.wave}
                onChange={(v) => updateParam('lfo2', 'wave', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Rate"
                paramKey="rate"
                value={patch.lfo2?.rate}
                min={0.1}
                max={20}
                step={0.1}
                onChange={(v) => updateParam('lfo2', 'rate', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="A.Mod"
                paramKey="ampMod"
                value={patch.lfo2?.ampMod}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('lfo2', 'ampMod', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="P.Mod"
                paramKey="pitchMod"
                value={patch.lfo2?.pitchMod}
                min={-1200}
                max={1200}
                step={10}
                onChange={(v) => updateParam('lfo2', 'pitchMod', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection
              title="Virtual Patches"
              rightHeader={
                <div className="flex bg-neutral-900 border border-neutral-600 rounded-sm">
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      onClick={() => setActiveVPatchIdx(i)}
                      className={`px-1 text-[8px] font-bold ${activeVPatchIdx === i ? 'bg-amber-600 text-stone-900' : 'text-neutral-500'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              }
            >
              <DiscreteControl
                label="Src"
                options={MOD_SRCS}
                value={patch.vPatch[activeVPatchIdx]?.src}
                onChange={(v) => updateVPatch('src', v)}
                showLcd={showOnLcd}
              />
              <DiscreteControl
                label="Dest"
                options={MOD_DESTS}
                value={patch.vPatch[activeVPatchIdx]?.dest}
                onChange={(v) => updateVPatch('dest', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Int"
                paramKey="int"
                value={patch.vPatch[activeVPatchIdx]?.int}
                min={-64}
                max={63}
                step={1}
                onChange={(v) => updateVPatch('int', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Mod FX (Chorus)">
              <ControlKnob
                label="Speed"
                paramKey="speed"
                value={patch.modFx?.speed}
                min={0.1}
                max={10}
                step={0.1}
                onChange={(v) => updateParam('modFx', 'speed', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Depth"
                paramKey="depth"
                value={patch.modFx?.depth}
                min={0}
                max={100}
                step={1}
                onChange={(v) => updateParam('modFx', 'depth', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Mix"
                paramKey="mix"
                value={patch.modFx?.mix}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('modFx', 'mix', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Delay FX">
              <ControlKnob
                label="Time"
                paramKey="time"
                value={patch.delayFx?.time}
                min={0.01}
                max={1.0}
                step={0.01}
                onChange={(v) => updateParam('delayFx', 'time', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="F.back"
                paramKey="feedback"
                value={patch.delayFx?.feedback}
                min={0}
                max={0.9}
                step={0.01}
                onChange={(v) => updateParam('delayFx', 'feedback', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Mix"
                paramKey="mix"
                value={patch.delayFx?.mix}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam('delayFx', 'mix', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Master EQ">
              <ControlKnob
                label="Low.F"
                paramKey="lowFreq"
                value={patch.eq?.lowFreq}
                min={40}
                max={1000}
                step={10}
                onChange={(v) => updateParam('eq', 'lowFreq', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Low.G"
                paramKey="lowGain"
                value={patch.eq?.lowGain}
                min={-12}
                max={12}
                step={1}
                onChange={(v) => updateParam('eq', 'lowGain', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Hi.F"
                paramKey="highFreq"
                value={patch.eq?.highFreq}
                min={1000}
                max={12000}
                step={100}
                onChange={(v) => updateParam('eq', 'highFreq', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Hi.G"
                paramKey="highGain"
                value={patch.eq?.highGain}
                min={-12}
                max={12}
                step={1}
                onChange={(v) => updateParam('eq', 'highGain', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>

            <MatrixSection title="Arpeggiator">
              <div className="flex flex-col items-center justify-center gap-1 w-12">
                <span className="text-[9px] text-neutral-400 font-bold uppercase text-center h-6 flex items-end tracking-wider">Arp On</span>
                <button
                  onClick={() => updateParam('arp', 'on', !patch.arp?.on)}
                  className={`w-8 h-8 rounded-full shadow-inner border-2 flex items-center justify-center ${patch.arp?.on ? 'bg-amber-500 border-amber-300' : 'bg-neutral-800 border-neutral-600'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${patch.arp?.on ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-neutral-700'}`} />
                </button>
              </div>
              <DiscreteControl
                label="Type"
                options={ARP_TYPES}
                value={patch.arp?.type || 'up'}
                onChange={(v) => updateParam('arp', 'type', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Tempo"
                paramKey="tempo"
                value={patch.arp?.tempo}
                min={40}
                max={300}
                step={1}
                onChange={(v) => updateParam('arp', 'tempo', v)}
                showLcd={showOnLcd}
              />
              <ControlKnob
                label="Gate"
                paramKey="gate"
                value={patch.arp?.gate}
                min={0.1}
                max={1.0}
                step={0.1}
                onChange={(v) => updateParam('arp', 'gate', v)}
                showLcd={showOnLcd}
              />
            </MatrixSection>
          </div>

          <div className="mt-2 bg-[#1a110a] p-4 rounded-b-md shadow-inner border border-amber-950 flex justify-center">
            <div className="flex relative">{renderKeys()}</div>
          </div>
        </div>
      </div>

      {showImporter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 border-2 border-amber-600 p-6 rounded-lg max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-amber-500">
              <FileJson />
              <h2 className="text-xl font-bold">Import Patch (SysEx / JSON)</h2>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              Paste a raw microKORG SysEx Hex Dump (starts with F0) to translate it using our heuristic mapping engine, or paste a structured JSON patch.
            </p>
            <textarea
              className="w-full h-40 bg-neutral-900 border border-neutral-700 rounded p-2 text-xs font-mono text-amber-500 outline-none focus:border-amber-500"
              placeholder="F0 42 3n 58 ... F7&#10;&#10;-- OR --&#10;&#10;{&#10;  &quot;name&quot;: &quot;My Patch&quot;,&#10;  &quot;osc1&quot;: { ... }&#10;}"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            {importError && <p className="text-red-500 text-sm mt-2">{importError}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowImporter(false)}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button onClick={handleImport} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded">
                Load Patch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;