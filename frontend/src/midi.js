/**
 * MIDI I/O with WebMIDI API and WebSocket fallback
 * Handles note on/off, SysEx send/receive, and device enumeration
 */

let midiAccess = null;
let ws = null;
let midiDevices = { inputs: [], outputs: [] };

/**
 * Connect to WebSocket for real-time updates (optional)
 */
export function connectWebSocket(onMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

  ws.onopen = () => {
    console.log('✅ WebSocket connected');
  };

  ws.onclose = () => {
    console.log('⚠️  WebSocket disconnected (optional feature)');
    // Don't reconnect - WebSocket is optional
  };

  ws.onerror = (err) => {
    console.log('⚠️  WebSocket not available (this is OK - MIDI works without it)');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (e) {
      console.error('Failed to parse WS message', e);
    }
  };

  return ws;
}

/**
 * Send MIDI message to server over WebSocket
 */
export function sendMidiToServer(midiMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'midi', midi: Array.from(midiMessage) }));
  }
}

/**
 * Send SysEx bytes to server over WebSocket
 */
export function sendSysexToServer(bytes) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    ws.send(JSON.stringify({ type: 'sysex', hex }));
  }
}

/**
 * Initialize WebMIDI access with SysEx support
 */
export async function initMidi(onNoteMessage, onSysexMessage) {
  if (!('requestMIDIAccess' in navigator)) {
    console.error('❌ WebMIDI API not supported in this browser');
    return false;
  }

  try {
    console.log('🎹 Requesting MIDI access with SysEx...');
    midiAccess = await navigator.requestMIDIAccess({ sysex: true });
    console.log('✅ MIDI access granted');
    console.log('   midiAccess object:', midiAccess);
    console.log('   inputs size:', midiAccess.inputs?.size);
    console.log('   outputs size:', midiAccess.outputs?.size);

    // Enumerate devices
    updateMidiDevices();

    // Attach handlers to all inputs
    for (const input of midiAccess.inputs.values()) {
      attachMidiInput(input, onNoteMessage, onSysexMessage);
    }

    // Listen for device connections/disconnections
    midiAccess.onstatechange = (e) => {
      console.log(`🔌 MIDI device "${e.port.name}" (${e.port.type}): ${e.port.state}`);
      updateMidiDevices();
      if (e.port.type === 'input' && e.port.state === 'connected') {
        attachMidiInput(e.port, onNoteMessage, onSysexMessage);
      }
    };
    console.log('✅ MIDI state change listener attached');

    return true;
  } catch (err) {
    console.error('❌ WebMIDI init failed:', err.message || err);
    console.error('Full error:', err);
    return false;
  }
}

function updateMidiDevices() {
  if (!midiAccess) {
    console.warn('⚠️  updateMidiDevices called but midiAccess is null');
    return;
  }
  midiDevices = { inputs: [], outputs: [] };

  console.log('📋 Iterating inputs...');
  for (const input of midiAccess.inputs.values()) {
    console.log('   Found input:', input.name, input.id);
    midiDevices.inputs.push({ id: input.id, name: input.name });
  }

  console.log('📋 Iterating outputs...');
  for (const output of midiAccess.outputs.values()) {
    console.log('   Found output:', output.name, output.id);
    midiDevices.outputs.push({ id: output.id, name: output.name });
  }

  console.log(
    `🎹 MIDI devices: ${midiDevices.inputs.length} input(s), ${midiDevices.outputs.length} output(s)`,
    midiDevices
  );
}

function attachMidiInput(input, onNoteMessage, onSysexMessage) {
  input.onmidimessage = (message) => {
    const [status, ...data] = message.data;

    // System Exclusive (SysEx)
    if (status === 0xF0) {
      const sysexBytes = new Uint8Array(message.data);
      console.log('Received SysEx:', sysexBytes.length, 'bytes');
      if (onSysexMessage) {
        onSysexMessage(sysexBytes);
      }
      sendSysexToServer(sysexBytes);
    }
    // Note on/off
    else if (onNoteMessage) {
      onNoteMessage(message);
      sendMidiToServer(message.data);
    }
  };

  console.log('Attached MIDI input:', input.name);
}

/**
 * Send SysEx bytes to a MIDI output device
 */
export async function sendSysex(outputId, bytes) {
  if (!midiAccess) {
    throw new Error('MIDI not initialized');
  }

  const output = midiAccess.outputs.get(outputId);
  if (!output) {
    throw new Error(`MIDI output not found: ${outputId}`);
  }

  console.log(`📤 Sending SysEx (${bytes.length} bytes) to ${output.name}`);
  console.log(`   Hex: ${bytesToHexString(bytes)}`);
  try {
    output.send(bytes);
    console.log('✅ SysEx sent successfully');
  } catch (err) {
    console.error('❌ Failed to send SysEx:', err);
    throw err;
  }
}

/**
 * Request dump from microKORG hardware
 */
export async function requestDump(outputId) {
  if (!midiAccess) {
    throw new Error('MIDI not initialized');
  }

  // Get dump request bytes from server
  const res = await fetch('/api/sysex/request');
  const data = await res.json();

  if (!data.hex) {
    throw new Error('Failed to get dump request');
  }

  // Convert hex to bytes and send
  const bytes = hexStringToBytes(data.hex);
  await sendSysex(outputId, bytes);
}

/**
 * Get list of available MIDI devices
 */
export function getMidiDevices() {
  return midiDevices;
}

/**
 * Disconnect MIDI input handlers
 */
export function disconnectMidi() {
  if (midiAccess) {
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = null;
    }
    midiAccess = null;
  }
}

/**
 * Utility: Convert hex string to Uint8Array
 */
function hexStringToBytes(hex) {
  const clean = hex.replace(/\s/g, '');
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
}

/**
 * Utility: Convert Uint8Array to hex string
 */
export function bytesToHexString(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
