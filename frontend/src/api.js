const API_BASE = '/api';

export const api = {
  async listPatches() {
    const res = await fetch(`${API_BASE}/patches`);
    if (!res.ok) throw new Error('Failed to list patches');
    const data = await res.json();
    return data.patches;
  },

  async getPatch(name) {
    const res = await fetch(`${API_BASE}/patches/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Patch not found');
    const data = await res.json();
    return data.patch;
  },

  async savePatch(patch) {
    const res = await fetch(`${API_BASE}/patches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Failed to save patch');
    return res.json();
  },

  async deletePatch(name) {
    const res = await fetch(`${API_BASE}/patches/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async listPresets() {
    const res = await fetch(`${API_BASE}/presets`);
    if (!res.ok) throw new Error('Failed to list presets');
    const data = await res.json();
    return data.presets;
  },

  async getPreset(name) {
    const res = await fetch(`${API_BASE}/preset/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Preset not found');
    const data = await res.json();
    return data.patch;
  },
};