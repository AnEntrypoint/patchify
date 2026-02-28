/**
 * Reusable UI component helpers
 * All functions return HTML strings
 */

export function renderHeader(title, subtitle) {
  return `
    <header style="background: #1a1a1a; padding: 20px; border-bottom: 1px solid #333; margin-bottom: 20px;">
      <h1 style="margin: 0 0 5px 0; color: #fff;">${title}</h1>
      <p style="margin: 0; color: #888; font-size: 14px;">${subtitle || ''}</p>
    </header>
  `;
}

export function renderToolbar(buttons) {
  const btnHtml = buttons.map(btn => `
    <button
      id="${btn.id}"
      class="btn ${btn.className || ''}"
      style="padding: 10px 20px; margin-right: 10px; ${btn.style || ''}"
    >
      ${btn.label}
    </button>
  `).join('');

  return `<div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">${btnHtml}</div>`;
}

export function renderMidiPermissionWarning(midiDevices) {
  if (!midiDevices || midiDevices.inputs.length === 0) {
    return `
      <div style="background: #3a1a1a; border: 1px solid #8a3a3a; padding: 12px; border-radius: 4px; color: #ff9999; font-size: 13px; margin-bottom: 15px;">
        ⚠️ <strong>MIDI Permission Not Granted</strong><br>
        <small style="color: #cc7777;">Click "Enable MIDI" to grant access to your devices, or check if a permission dialog appeared.</small>
        <div style="margin-top: 8px;">
          <button onclick="window._retryMidiPermission && window._retryMidiPermission()" style="background: #0066cc; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px;">
            🎹 Enable MIDI
          </button>
        </div>
      </div>
    `;
  }
  return '';
}

export function renderStatus(msg, type) {
  if (!msg) return '';

  const bgColor = type === 'error' ? '#3a1a1a' : type === 'warn' ? '#3a3a1a' : '#1a3a1a';
  const color = type === 'error' ? '#ff7f7f' : type === 'warn' ? '#ffff7f' : '#7fff7f';

  return `
    <div style="background: ${bgColor}; color: ${color}; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 13px;">
      ${msg}
    </div>
  `;
}

export function renderMidiDeviceSelect(devices, selectedId, onchange) {
  const options = devices.map(dev => `<option value="${dev.id}" ${dev.id === selectedId ? 'selected' : ''}>${dev.name}</option>`).join('');
  return `
    <select onchange="window._onMidiDeviceChange && window._onMidiDeviceChange('${onchange}', this.value)" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
      <option value="">-- No device --</option>
      ${options}
    </select>
  `;
}

export function renderPatchList(patches, selectedName, onSelectPatch, onDeletePatch, onSendPatch, onPreviewPatch) {
  const items = patches.map((name, idx) => {
    const isSelected = name === selectedName;
    return `
      <div
        class="patch-item"
        data-patch="${name}"
        draggable="true"
        style="
          display: flex;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #333;
          background: ${isSelected ? '#1a3a4a' : '#1a1a1a'};
          cursor: pointer;
          gap: 10px;
        "
      >
        <span style="color: #666; flex-shrink: 0; font-size: 12px;">⠿</span>
        <span
          style="flex: 1; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
          onclick="window._selectPatch && window._selectPatch('${name}')"
        >
          ${isSelected ? '▶ ' : '  '}${name}
        </span>
        <button
          style="padding: 4px 8px; font-size: 11px; flex-shrink: 0;"
          onclick="window._previewPatch && window._previewPatch('${name}')"
        >▶ Preview</button>
        <button
          style="padding: 4px 8px; font-size: 11px; flex-shrink: 0;"
          onclick="window._sendPatch && window._sendPatch('${name}')"
        >→ Send</button>
        <button
          style="padding: 4px 8px; font-size: 11px; background: #8b3a3a; flex-shrink: 0;"
          onclick="window._deletePatch && window._deletePatch('${name}')"
        >✕</button>
      </div>
    `;
  }).join('');

  return `
    <div style="border: 1px solid #333; border-radius: 4px; max-height: 400px; overflow-y: auto; background: #0a0a0a;">
      ${items || '<div style="padding: 20px; text-align: center; color: #666;">No patches</div>'}
    </div>
  `;
}

export function renderControlKnob(label, value, min, max, id, onchange) {
  const pct = ((value - min) / (max - min)) * 100;
  return `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <label style="font-size: 12px; color: #999; text-align: center; width: 80px; word-break: break-word;">${label}</label>
      <input
        id="${id}"
        type="range"
        min="${min}"
        max="${max}"
        step="0.01"
        value="${value}"
        onchange="window._updateControl && window._updateControl('${id}', this.value)"
        style="width: 60px; cursor: pointer;"
      />
      <span style="font-size: 11px; color: #666; width: 60px; text-align: center;">${parseFloat(value).toFixed(2)}</span>
    </div>
  `;
}

export function renderSelect(label, options, value, id, onchange) {
  const opts = options.map(opt => `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`).join('');
  return `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <label style="font-size: 12px; color: #999; text-align: center; width: 80px;">${label}</label>
      <select
        id="${id}"
        onchange="window._updateControl && window._updateControl('${id}', this.value)"
        style="width: 70px; padding: 4px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; font-size: 11px;"
      >
        ${opts}
      </select>
    </div>
  `;
}

export function renderButton(label, id, className, onclick) {
  const cls = `btn ${className || ''}`;
  return `
    <button
      id="${id}"
      class="${cls}"
      onclick="${onclick || ''}"
      style="
        padding: 10px 20px;
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: background 0.2s;
      "
    >
      ${label}
    </button>
  `;
}

export function renderControlGroup(title, controls) {
  return `
    <div style="background: #0a0a0a; border: 1px solid #333; border-radius: 4px; padding: 15px; margin-bottom: 15px;">
      <h3 style="margin: 0 0 15px 0; color: #ccc; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        ${title}
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 15px;">
        ${controls}
      </div>
    </div>
  `;
}

export function renderProgress(current, total, label) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return `
    <div style="margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; color: #999;">
        <span>${label || 'Progress'}</span>
        <span>${current} / ${total}</span>
      </div>
      <div style="width: 100%; height: 20px; background: #333; border-radius: 4px; overflow: hidden;">
        <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #0066cc, #00ccff); transition: width 0.3s;"></div>
      </div>
    </div>
  `;
}

export function renderSection(title, content, collapsible = false) {
  return `
    <div style="background: #0a0a0a; border: 1px solid #333; border-radius: 4px; padding: 15px; margin-bottom: 15px;">
      <h2 style="margin: 0 0 15px 0; color: #fff; font-size: 16px;">
        ${collapsible ? '▼ ' : ''}${title}
      </h2>
      <div>${content}</div>
    </div>
  `;
}

export function renderPatchEditor(patch) {
  if (!patch) {
    return '<div style="color: #666; padding: 20px;">Select a patch to edit</div>';
  }

  const sections = [];

  // Voice
  sections.push(renderControlGroup('Voice', [
    renderSelect('Mode', ['Single', 'Mono', 'Poly', 'Unison', 'Layer'], patch.voice?.mode || 'Mono', 'voice_mode', 'voiceMode'),
    renderControlKnob('Portamento', patch.voice?.portamento || 0, 0, 1, 'voice_portamento', 'voicePortamento')
  ]));

  // Pitch
  sections.push(renderControlGroup('Pitch', [
    renderControlKnob('Transpose', patch.pitch?.transpose || 0, -24, 24, 'pitch_transpose', 'pitchTranspose'),
    renderControlKnob('Tune', patch.pitch?.tune || 0, -50, 50, 'pitch_tune', 'pitchTune')
  ]));

  // Oscillators
  const waves1 = ['sawtooth', 'square', 'triangle', 'sine'];
  const waves2 = ['sawtooth', 'square', 'triangle'];
  const mods = ['off', 'ring', 'sync'];

  sections.push(renderControlGroup('Oscillator 1', [
    renderSelect('Wave', waves1, patch.osc1?.wave || 'sawtooth', 'osc1_wave', 'osc1Wave'),
    renderControlKnob('Ctrl1', patch.osc1?.control1 || 0, 0, 127, 'osc1_ctrl1', 'osc1Ctrl1'),
    renderControlKnob('Ctrl2', patch.osc1?.control2 || 0, 0, 127, 'osc1_ctrl2', 'osc1Ctrl2')
  ]));

  sections.push(renderControlGroup('Oscillator 2', [
    renderSelect('Wave', waves2, patch.osc2?.wave || 'square', 'osc2_wave', 'osc2Wave'),
    renderSelect('Mod', mods, patch.osc2?.mod || 'off', 'osc2_mod', 'osc2Mod'),
    renderControlKnob('Semi', patch.osc2?.semitone || 0, -24, 24, 'osc2_semi', 'osc2Semi'),
    renderControlKnob('Tune', patch.osc2?.tune || 0, -50, 50, 'osc2_tune', 'osc2Tune')
  ]));

  // Mixer
  sections.push(renderControlGroup('Mixer', [
    renderControlKnob('Osc1', patch.mixer?.osc1 || 0, 0, 1, 'mixer_osc1', 'mixerOsc1'),
    renderControlKnob('Osc2', patch.mixer?.osc2 || 0, 0, 1, 'mixer_osc2', 'mixerOsc2'),
    renderControlKnob('Noise', patch.mixer?.noise || 0, 0, 1, 'mixer_noise', 'mixerNoise')
  ]));

  // Filter
  const filterTypes = ['lowpass24', 'lowpass12', 'bandpass', 'highpass'];
  sections.push(renderControlGroup('Filter', [
    renderSelect('Type', filterTypes, patch.filter?.type || 'lowpass24', 'filter_type', 'filterType'),
    renderControlKnob('Cutoff', patch.filter?.cutoff || 5000, 20, 20000, 'filter_cutoff', 'filterCutoff'),
    renderControlKnob('Reso', patch.filter?.resonance || 0, 0, 1, 'filter_res', 'filterRes'),
    renderControlKnob('EG Int', (patch.filter?.envAmount || 0) / 100, -50, 50, 'filter_env', 'filterEnv')
  ]));

  return sections.join('');
}
