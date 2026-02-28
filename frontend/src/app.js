import { SynthEngine, FACTORY_PRESETS } from '../shared/synth-engine.js';
import { buildSysexMessage } from '../shared/sysex.js';
import { normalize } from '../shared/patch-schema.js';
import { api } from './api.js';
import { connectWebSocket, initMidi, getMidiDevices, sendSysex, requestDump, bytesToHexString } from './midi.js';
import * as UI from './ui.js';

// ============= Global State =============

let state = {
  patches: [],
  selectedPatch: null,
  currentPatchData: null,
  midiDevices: { inputs: [], outputs: [] },
  selectedMidiIn: null,  // Will be restored after MIDI devices load
  selectedMidiOut: null,  // Will be restored after MIDI devices load
  engine: null,
  masterVol: 0.4,
  statusMsg: '',
  statusType: '',
  isReceiving: false,
  receivedCount: 0,
  totalCount: 0,
};

// ============= Initialization =============

async function init() {
  console.log('Initializing Patchify...');

  // Load patches from server
  try {
    const res = await api.getPatches();
    state.patches = res.patches || [];
    console.log('Loaded patches:', state.patches);
  } catch (err) {
    console.error('Failed to load patches:', err);
    showStatus('Failed to load patches: ' + err.message, 'error');
  }

  // Setup WebSocket for real-time updates
  connectWebSocket(onWebSocketMessage);

  // Initialize MIDI - but don't wait for it, let user click button if needed
  initMidiWithFallback();

  // Render
  render();
}

async function initMidiWithFallback() {
  const midiInitialized = await initMidi(onMidiNote, onMidiSysex);
  console.log('MIDI initialization result:', midiInitialized);
  state.midiDevices = getMidiDevices();
  console.log('MIDI devices after init:', state.midiDevices);

  // Restore saved MIDI device selections if they exist and match available devices
  const savedMidiIn = localStorage.getItem('selectedMidiIn');
  const savedMidiOut = localStorage.getItem('selectedMidiOut');

  if (savedMidiIn && state.midiDevices.inputs.some(d => d.id === savedMidiIn)) {
    state.selectedMidiIn = savedMidiIn;
    console.log('✅ Restored MIDI input:', savedMidiIn);
  }
  if (savedMidiOut && state.midiDevices.outputs.some(d => d.id === savedMidiOut)) {
    state.selectedMidiOut = savedMidiOut;
    console.log('✅ Restored MIDI output:', savedMidiOut);
  }

  render();

  // If MIDI failed, show button to try again
  if (!midiInitialized && 'requestMIDIAccess' in navigator) {
    window._retryMidiPermission = async () => {
      console.log('🔄 Retrying MIDI permission...');
      const result = await initMidi(onMidiNote, onMidiSysex);
      state.midiDevices = getMidiDevices();

      // Restore saved MIDI device selections now that permission is granted
      const savedMidiIn = localStorage.getItem('selectedMidiIn');
      const savedMidiOut = localStorage.getItem('selectedMidiOut');

      if (savedMidiIn && state.midiDevices.inputs.some(d => d.id === savedMidiIn)) {
        state.selectedMidiIn = savedMidiIn;
        console.log('✅ Restored MIDI input:', savedMidiIn);
      }
      if (savedMidiOut && state.midiDevices.outputs.some(d => d.id === savedMidiOut)) {
        state.selectedMidiOut = savedMidiOut;
        console.log('✅ Restored MIDI output:', savedMidiOut);
      }

      render();
      if (result) {
        showStatus('✅ MIDI permission granted!', 'success');
      }
    };
  }
}

function onWebSocketMessage(data) {
  if (data.type === 'patch:saved') {
    showStatus('Patch saved: ' + data.name, 'success');
    loadPatches();
  } else if (data.type === 'patch:deleted') {
    showStatus('Patch deleted: ' + data.name, 'success');
    loadPatches();
  } else if (data.type === 'order:changed') {
    loadPatches();
  }
}

function onMidiNote(message) {
  const [status, note, velocity] = message.data;
  if ((status & 0xf0) === 0x90 && velocity > 0) {
    if (state.engine) state.engine.noteOn(note, velocity / 127);
  } else if ((status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0)) {
    if (state.engine) state.engine.noteOff(note);
  }
}

async function onMidiSysex(bytes) {
  console.log('📦 Received SysEx:', bytes.length, 'bytes');
  console.log('   Hex:', bytesToHexString(bytes));

  // Try to decode the SysEx message
  try {
    const res = await api.decodeSysex(bytesToHexString(bytes));
    if (res.patch) {
      console.log('✅ Decoded patch:', res.patch.name);
      const patchName = res.patch.name || `Received Patch ${Date.now()}`;
      state.currentPatchData = { ...res.patch, name: patchName };
      showStatus(`Received patch: ${patchName}`, 'success');
      render();
    } else if (res.patches && Array.isArray(res.patches)) {
      console.log('✅ Decoded multiple patches:', res.patches.length);
      showStatus(`Received ${res.patches.length} patches`, 'success');
      // TODO: Handle multiple patches
    } else {
      console.warn('Unknown SysEx format');
      showStatus(`Received SysEx (${bytes.length} bytes) - format unknown`, 'warn');
    }
  } catch (err) {
    console.error('❌ Failed to decode SysEx:', err);
    showStatus(`Received SysEx but couldn't decode: ${err.message}`, 'error');
  }
}

// ============= State Management =============

async function loadPatches() {
  try {
    const res = await api.getPatches();
    state.patches = res.patches || [];
    render();
  } catch (err) {
    showStatus('Failed to load patches: ' + err.message, 'error');
  }
}

function selectPatch(name) {
  state.selectedPatch = name;
  loadPatchData(name);
}

async function loadPatchData(name) {
  try {
    const res = await api.getPatch(name);
    state.currentPatchData = res.patch;
    render();
  } catch (err) {
    showStatus('Failed to load patch: ' + err.message, 'error');
  }
}

async function savePatchData(name) {
  if (!state.currentPatchData) {
    showStatus('No patch data to save', 'error');
    return;
  }

  try {
    const patch = normalize({ ...state.currentPatchData, name });
    await api.savePatch(patch);
    state.currentPatchData = patch;
    showStatus('Patch saved: ' + name, 'success');
    await loadPatches();
  } catch (err) {
    showStatus('Failed to save patch: ' + err.message, 'error');
  }
}

async function deletePatch(name) {
  if (!confirm(`Delete patch: ${name}?`)) return;

  try {
    await api.deletePatch(name);
    showStatus('Patch deleted: ' + name, 'success');
    if (state.selectedPatch === name) {
      state.selectedPatch = null;
      state.currentPatchData = null;
    }
    await loadPatches();
  } catch (err) {
    showStatus('Failed to delete patch: ' + err.message, 'error');
  }
}

async function loadPreset(name) {
  try {
    const preset = FACTORY_PRESETS[name];
    if (!preset) throw new Error('Preset not found');
    state.currentPatchData = { ...preset, name: preset.name + ' (copy)' };
    state.selectedPatch = null;
    showStatus('Loaded preset: ' + name, 'success');
    render();
  } catch (err) {
    showStatus('Failed to load preset: ' + err.message, 'error');
  }
}

function showStatus(msg, type = 'success') {
  state.statusMsg = msg;
  state.statusType = type;
  render();
  setTimeout(() => {
    state.statusMsg = '';
    render();
  }, type === 'error' ? 5000 : 3000);
}

// ============= MIDI Operations =============

async function initAudio() {
  if (!state.engine) {
    state.engine = new SynthEngine();
    if (state.currentPatchData) {
      state.engine.updatePatch(state.currentPatchData);
    }
    state.engine.setMasterVolume(state.masterVol);
  } else if (state.engine.ctx?.state === 'suspended') {
    state.engine.ctx.resume();
  }
  showStatus('Audio engine started', 'success');
}

async function previewPatch(name) {
  try {
    if (!state.engine) await initAudio();

    const res = await api.getPatch(name);
    const patch = res.patch;
    if (state.engine) {
      state.engine.updatePatch(patch);
      // Play a test note
      state.engine.noteOn(60, 0.7);
      setTimeout(() => state.engine.noteOff(60), 2000);
    }
    showStatus('Playing preview: ' + name, 'success');
  } catch (err) {
    showStatus('Failed to preview patch: ' + err.message, 'error');
  }
}

async function sendPatchToHardware(name) {
  if (!state.selectedMidiOut) {
    showStatus('No MIDI output device selected', 'error');
    return;
  }

  try {
    const res = await api.getPatch(name);
    const patch = res.patch;
    const sysex = buildSysexMessage(patch);
    await sendSysex(state.selectedMidiOut, sysex);
    showStatus('Sent to hardware: ' + name, 'success');
  } catch (err) {
    showStatus('Failed to send patch: ' + err.message, 'error');
  }
}

async function requestHardwareDump() {
  if (!state.selectedMidiOut) {
    showStatus('No MIDI output device selected', 'error');
    return;
  }

  const devices = getMidiDevices();
  const selectedDevice = devices.outputs.find(d => d.id === state.selectedMidiOut);
  console.log('📥 Requesting hardware dump from:', selectedDevice?.name || state.selectedMidiOut);

  try {
    await requestDump(state.selectedMidiOut);
    state.isReceiving = true;
    state.receivedCount = 0;
    state.totalCount = 128;
    showStatus('Requesting patch dump from hardware...', 'success');
    render();
  } catch (err) {
    console.error('❌ Dump request failed:', err);
    showStatus('Failed to request dump: ' + err.message, 'error');
  }
}

// ============= Event Handlers (Global) =============

window._selectPatch = selectPatch;
window._previewPatch = previewPatch;
window._sendPatch = sendPatchToHardware;
window._deletePatch = deletePatch;
window._onMidiDeviceChange = (type, deviceId) => {
  if (type === 'in') {
    state.selectedMidiIn = deviceId;
    localStorage.setItem('selectedMidiIn', deviceId);
  } else {
    state.selectedMidiOut = deviceId;
    localStorage.setItem('selectedMidiOut', deviceId);
  }
  render();
};
window._updateControl = (controlId, value) => {
  if (!state.currentPatchData) return;
  const path = controlId.split('_');
  let obj = state.currentPatchData;
  for (let i = 0; i < path.length - 1; i++) {
    obj = obj[path[i]] = obj[path[i]] || {};
  }
  obj[path[path.length - 1]] = isNaN(value) ? value : Number(value);
  render();
};
window._updateVolume = (val) => {
  state.masterVol = Number(val);
  if (state.engine) state.engine.setMasterVolume(state.masterVol);
  render();
};
window._initAudio = initAudio;
window._loadPreset = loadPreset;
window._requestDump = requestHardwareDump;
window._sendAll = async () => {
  if (!state.patches.length) {
    showStatus('No patches to send', 'warn');
    return;
  }
  if (!state.selectedMidiOut) {
    showStatus('No MIDI output device selected', 'error');
    return;
  }

  showStatus('Starting bulk send to hardware...', 'success');
  for (let i = 0; i < state.patches.length; i++) {
    try {
      await sendPatchToHardware(state.patches[i]);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between sends
    } catch (err) {
      console.error('Failed to send patch:', state.patches[i], err);
    }
  }
  showStatus('Bulk send complete', 'success');
};
window._newPatch = () => {
  state.currentPatchData = {
    name: 'New Patch ' + Date.now(),
    voice: { mode: 'Poly', portamento: 0 },
    pitch: { transpose: 0, tune: 0 },
    osc1: { wave: 'sawtooth', control1: 0, control2: 0 },
    osc2: { wave: 'square', mod: 'off', semitone: 0, tune: 10 },
    mixer: { osc1: 1, osc2: 0, noise: 0 },
    filter: { type: 'lowpass24', cutoff: 10000, resonance: 0.5, envAmount: 0 },
    eg1_filter: { a: 0.01, d: 0.5, s: 0.5, r: 0.5 },
    amp: { level: 1, dist: 0 },
    eg2_amp: { a: 0.01, d: 0.5, s: 1, r: 0.1 },
    lfo1: { wave: 'triangle', rate: 5, pitchMod: 0, filterMod: 0 },
    lfo2: { wave: 'sine', rate: 2, ampMod: 0, pitchMod: 0 },
    vPatch: [{ src: 'lfo1', dest: 'cutoff', int: 0 }, { src: 'eg1', dest: 'pitch', int: 0 }, { src: 'lfo2', dest: 'amp', int: 0 }, { src: 'eg2', dest: 'osc2_pitch', int: 0 }],
    modFx: { speed: 1, depth: 0, mix: 0 },
    delayFx: { time: 0.3, feedback: 0.3, mix: 0 },
    eq: { lowFreq: 250, lowGain: 0, highFreq: 6000, highGain: 0 },
    arp: { on: false, type: 'up', tempo: 120, gate: 0.5 }
  };
  state.selectedPatch = null;
  render();
};
window._savePatch = () => {
  if (!state.currentPatchData) return;
  savePatchData(state.currentPatchData.name);
};

// ============= Rendering =============

function render() {
  const app = document.getElementById('app');

  const presets = Object.keys(FACTORY_PRESETS);
  const presetOpts = presets.map(name => `<option value="${name}">${name}</option>`).join('');

  const midiInOptions = state.midiDevices.inputs.map(dev => `<option value="${dev.id}" ${dev.id === state.selectedMidiIn ? 'selected' : ''}>${dev.name}</option>`).join('');
  const midiOutOptions = state.midiDevices.outputs.map(dev => `<option value="${dev.id}" ${dev.id === state.selectedMidiOut ? 'selected' : ''}>${dev.name}</option>`).join('');

  const midiPermissionWarning = UI.renderMidiPermissionWarning(state.midiDevices);
  const statusHtml = UI.renderStatus(state.statusMsg, state.statusType);

  const toolbar = UI.renderToolbar([
    { id: 'btn-audio', label: '▶ Start Audio', className: 'primary' },
    { id: 'btn-new', label: '+ New Patch' },
    { id: 'btn-save', label: '💾 Save' },
    { id: 'btn-send-all', label: '→ Send All' },
    { id: 'btn-request', label: '← Receive All' },
  ]);

  const midiSection = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div>
        <label style="display: block; color: #999; font-size: 12px; margin-bottom: 8px;">MIDI Input</label>
        <select onchange="window._onMidiDeviceChange('in', this.value)" style="width: 100%; padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
          <option value="">-- No device --</option>
          ${midiInOptions}
        </select>
      </div>
      <div>
        <label style="display: block; color: #999; font-size: 12px; margin-bottom: 8px;">MIDI Output</label>
        <select onchange="window._onMidiDeviceChange('out', this.value)" style="width: 100%; padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
          <option value="">-- No device --</option>
          ${midiOutOptions}
        </select>
      </div>
    </div>
  `;

  const patchListHtml = UI.renderPatchList(state.patches, state.selectedPatch, selectPatch, deletePatch, sendPatchToHardware, previewPatch);

  const editorHtml = state.currentPatchData ? `
    <div style="background: #0a0a0a; border: 1px solid #333; border-radius: 4px; padding: 15px;">
      <div style="margin-bottom: 15px;">
        <label style="color: #999; font-size: 12px;">Patch Name</label>
        <input
          type="text"
          value="${state.currentPatchData.name || ''}"
          onchange="window._updateControl('name', this.value)"
          style="width: 100%; padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; margin-top: 5px;"
        />
      </div>
      ${UI.renderPatchEditor(state.currentPatchData)}
    </div>
  ` : '<div style="color: #666; padding: 20px; text-align: center;">Select or create a patch to edit</div>';

  const html = `
    <div style="background: #0a0a0a; color: #ddd; min-height: 100vh;">
      ${UI.renderHeader('🎹 Patchify', 'microKORG Patch Manager with Web Audio Preview')}

      <div style="padding: 20px; max-width: 1400px; margin: 0 auto;">
        ${midiPermissionWarning}
        ${statusHtml}
        ${midiSection}
        ${toolbar}

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
          <div>
            <h2 style="margin: 0 0 15px 0; color: #fff; font-size: 14px;">Patches</h2>
            ${patchListHtml}
          </div>
          <div>
            <h2 style="margin: 0 0 15px 0; color: #fff; font-size: 14px;">Editor</h2>
            ${editorHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = html;

  // Attach event handlers
  document.getElementById('btn-audio')?.addEventListener('click', initAudio);
  document.getElementById('btn-new')?.addEventListener('click', window._newPatch);
  document.getElementById('btn-save')?.addEventListener('click', window._savePatch);
  document.getElementById('btn-send-all')?.addEventListener('click', window._sendAll);
  document.getElementById('btn-request')?.addEventListener('click', requestHardwareDump);

  // Setup drag & drop for patch list
  setTimeout(setupDragDrop, 100);
}

function setupDragDrop() {
  const items = document.querySelectorAll('.patch-item');
  let draggedFrom = null;

  items.forEach((item, idx) => {
    item.addEventListener('dragstart', (e) => {
      draggedFrom = idx;
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.opacity = '0.5';
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.target.style.borderTop = '2px solid #0066cc';
    });

    item.addEventListener('dragleave', (e) => {
      e.target.style.borderTop = 'none';
    });

    item.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.target.style.borderTop = 'none';

      const draggedTo = Array.from(items).indexOf(e.target.closest('.patch-item'));
      if (draggedFrom !== null && draggedFrom !== draggedTo) {
        const newOrder = [...state.patches];
        const [moved] = newOrder.splice(draggedFrom, 1);
        newOrder.splice(draggedTo, 0, moved);

        try {
          await api.setOrder(newOrder);
          state.patches = newOrder;
          render();
        } catch (err) {
          showStatus('Failed to reorder patches: ' + err.message, 'error');
        }
      }
    });

    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
    });
  });
}

// ============= Styles =============

const style = document.createElement('style');
style.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #000;
    color: #ddd;
  }

  input, select, textarea, button {
    font-family: inherit;
  }

  button:hover {
    opacity: 0.8;
  }

  button:active {
    opacity: 0.6;
  }

  .patch-item {
    transition: background 0.2s;
  }

  .patch-item:hover {
    background: #1a2a3a !important;
  }
`;
document.head.appendChild(style);

// Start
init();
