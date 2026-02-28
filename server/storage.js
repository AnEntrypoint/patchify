import { join } from 'path';

const PATCHES_DIR = join(process.cwd(), 'patches');
const PATCH_EXTENSION = '.json';
const ORDER_FILE = join(PATCHES_DIR, '_order.json');

export class PatchStorage {
  async ensureDir() {
    const dir = Bun.file(PATCHES_DIR);
    if (!(await dir.exists())) {
      // Create patches directory
      await Bun.$`mkdir -p ${PATCHES_DIR}`.catch(() => {});
    }
    // Ensure order file exists
    const orderFile = Bun.file(ORDER_FILE);
    if (!(await orderFile.exists())) {
      await Bun.write(ORDER_FILE, JSON.stringify([]));
    }
  }

  async readOrder() {
    try {
      const file = Bun.file(ORDER_FILE);
      if (await file.exists()) {
        const text = await file.text();
        return JSON.parse(text);
      }
    } catch (err) {
      console.warn('Failed to read order file:', err);
    }
    return [];
  }

  async writeOrder(names) {
    try {
      await Bun.write(ORDER_FILE, JSON.stringify(names, null, 2));
      return true;
    } catch (err) {
      console.error('Failed to write order file:', err);
      return false;
    }
  }

  async listPatches() {
    await this.ensureDir();
    try {
      // Read order file
      const order = await this.readOrder();

      // Get all patch files using shell
      let files = [];
      try {
        const output = await Bun.$`ls -1 ${PATCHES_DIR}`;
        const ls_result = output.text().trim();
        if (ls_result) {
          files = ls_result.split('\n')
            .filter(f => f.endsWith(PATCH_EXTENSION) && !f.startsWith('_'))
            .map(f => f.slice(0, -PATCH_EXTENSION.length));
        }
      } catch (e) {
        // Directory empty or doesn't exist yet
        files = [];
      }

      // Return ordered list: existing patches in order, then new ones
      const result = [];
      const seen = new Set();

      for (const name of order) {
        if (files.includes(name) && !seen.has(name)) {
          result.push(name);
          seen.add(name);
        }
      }

      for (const name of files) {
        if (!seen.has(name)) {
          result.push(name);
          seen.add(name);
        }
      }

      return result;
    } catch (err) {
      console.error('Failed to list patches:', err);
      return [];
    }
  }

  async getPatch(name) {
    const filePath = join(PATCHES_DIR, name + PATCH_EXTENSION);
    try {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const text = await file.text();
        return JSON.parse(text);
      }
    } catch (err) {
      console.warn(`Failed to get patch "${name}":`, err);
    }
    return null;
  }

  async savePatch(patch) {
    await this.ensureDir();
    const filePath = join(PATCHES_DIR, patch.name + PATCH_EXTENSION);
    try {
      await Bun.write(filePath, JSON.stringify(patch, null, 2));

      // Add to order if not already there
      const order = await this.readOrder();
      if (!order.includes(patch.name)) {
        order.push(patch.name);
        await this.writeOrder(order);
      }

      return true;
    } catch (err) {
      console.error('Failed to save patch:', err);
      return false;
    }
  }

  async deletePatch(name) {
    const filePath = join(PATCHES_DIR, name + PATCH_EXTENSION);
    try {
      // Delete file using shell
      const file = Bun.file(filePath);
      if (await file.exists()) {
        await Bun.$`rm ${filePath}`.catch(() => {});
      }

      // Remove from order
      const order = await this.readOrder();
      const idx = order.indexOf(name);
      if (idx >= 0) {
        order.splice(idx, 1);
        await this.writeOrder(order);
      }

      return true;
    } catch (err) {
      console.error('Failed to delete patch:', err);
      return false;
    }
  }

  async renamePatch(oldName, newName) {
    try {
      const patch = await this.getPatch(oldName);
      if (!patch) return false;

      patch.name = newName;
      await this.savePatch(patch);

      // Delete old file
      const oldPath = join(PATCHES_DIR, oldName + PATCH_EXTENSION);
      await Bun.$`rm ${oldPath}`.catch(() => {});

      // Update order
      const order = await this.readOrder();
      const idx = order.indexOf(oldName);
      if (idx >= 0) {
        order[idx] = newName;
        await this.writeOrder(order);
      }

      return true;
    } catch (err) {
      console.error('Failed to rename patch:', err);
      return false;
    }
  }

  async reorderPatches(names) {
    return await this.writeOrder(names);
  }

  async importPreset(patch) {
    return this.savePatch(patch);
  }

  async exportPreset(name) {
    return this.getPatch(name);
  }
}

export const storage = new PatchStorage();
