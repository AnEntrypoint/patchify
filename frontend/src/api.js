const API_BASE = '/api';

export const api = {
  // Patch CRUD
  async getPatches() {
    const res = await fetch(`${API_BASE}/patches`);
    if (!res.ok) throw new Error('Failed to list patches');
    return res.json();
  },

  async getPatch(name) {
    const res = await fetch(`${API_BASE}/patches/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Patch not found');
    return res.json();
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
    if (!res.ok) throw new Error('Failed to delete patch');
    return res.json();
  },

  async renamePatch(oldName, newName) {
    const res = await fetch(`${API_BASE}/patches/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    });
    if (!res.ok) throw new Error('Failed to rename patch');
    return res.json();
  },

  // Patch ordering
  async getOrder() {
    const res = await fetch(`${API_BASE}/order`);
    if (!res.ok) throw new Error('Failed to get patch order');
    return res.json();
  },

  async setOrder(order) {
    const res = await fetch(`${API_BASE}/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
    if (!res.ok) throw new Error('Failed to set patch order');
    return res.json();
  },

  // Presets
  async getPresets() {
    const res = await fetch(`${API_BASE}/presets`);
    if (!res.ok) throw new Error('Failed to list presets');
    return res.json();
  },

  async getPreset(name) {
    const res = await fetch(`${API_BASE}/preset/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Preset not found');
    return res.json();
  },

  // SysEx
  async decodeSysex(hex) {
    const res = await fetch(`${API_BASE}/sysex/decode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hex }),
    });
    if (!res.ok) throw new Error('Failed to decode SysEx');
    return res.json();
  },

  async getDumpRequest() {
    const res = await fetch(`${API_BASE}/sysex/request`);
    if (!res.ok) throw new Error('Failed to get dump request');
    return res.json();
  },
};