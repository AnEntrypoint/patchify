let ws = null;
let midiAccess = null;

export function connectWebSocket(onMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

  ws.onopen = () => console.log('WebSocket connected');
  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting in 2s');
    setTimeout(() => connectWebSocket(onMessage), 2000);
  };
  ws.onerror = (err) => console.error('WebSocket error', err);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('Failed to parse WS message', e);
    }
  };
}

export function sendMidiToServer(midiMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'midi', midi: midiMessage }));
  }
}

export async function initMidi(onNoteOn, onNoteOff) {
  if (!('midi' in navigator)) {
    console.log('WebMidi not supported in this browser');
    return false;
  }

  try {
    midiAccess = await navigator.midi.requestMIDIAccess({ sysex: false });
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = (message) => {
        const [status, note, velocity] = message.data;
        const command = status & 0xf0;
        if (command === 0x90 && velocity > 0) {
          onNoteOn(note, velocity);
          sendMidiToServer([status, note, velocity]);
        } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
          onNoteOff(note);
          sendMidiToServer([status, note, velocity]);
        }
      };
      console.log('MIDI input connected:', input.name);
    }
    return true;
  } catch (err) {
    console.error('WebMidi init failed:', err);
    return false;
  }
}

export function disconnectMidi() {
  if (midiAccess) {
    midiAccess.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
    midiAccess = null;
  }
}