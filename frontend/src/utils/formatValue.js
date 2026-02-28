// Pure formatting utility
export function formatValue(val, key) {
  if (val === undefined || val === null) return '';
  if (key === 'cutoff' || key === 'lowFreq' || key === 'highFreq') return `${Math.round(val)} Hz`;
  if (key.includes('time') || key === 'a' || key === 'd' || key === 'r' || key === 'portamento') return `${val.toFixed(2)}s`;
  if (key === 'rate' || key === 'speed' || key === 'tempo') return `${val.toFixed(1)}`;
  if (key === 'octave' || key === 'transpose' || key === 'semitone') return val > 0 ? `+${val}` : val;
  if (key === 'detune' || key === 'tune') return `${Math.round(val)} c`;
  if (key === 'pitchMod' || key === 'filterMod' || key === 'envAmount' || key === 'depth' || key === 'int' || key === 'control1' || key === 'control2') return Math.round(val);
  if (key === 's' || key.includes('osc') || key === 'noise' || key === 'master' || key === 'mix' || key === 'feedback' || key === 'ampMod' || key === 'dist' || key === 'level') return `${Math.round(val * 100)}%`;
  if (key === 'lowGain' || key === 'highGain') return `${Math.round(val)} dB`;
  if (typeof val === 'number') return Math.round(val * 10) / 10;
  return val;
}