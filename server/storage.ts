import { writeFile, readFile, mkdir, readdir, unlink } from 'fs/promises';
import { join } from 'path';

const PATCHES_DIR = join(process.cwd(), 'patches');
const PATCH_EXTENSION = '.json';

export class PatchStorage {
  async ensureDir() {
    try {
      await mkdir(PATCHES_DIR, { recursive: true });
    } catch (err) {
      // Directory may already exist
    }
  }

  async listPatches() {
    await this.ensureDir();
    try {
      const files = await readdir(PATCHES_DIR);
      return files
        .filter((f) => f.endsWith(PATCH_EXTENSION))
        .map((f) => f.slice(0, -PATCH_EXTENSION.length));
    } catch (err) {
      return [];
    }
  }

  async getPatch(name) {
    const filePath = join(PATCHES_DIR, name + PATCH_EXTENSION);
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      return null;
    }
  }

  async savePatch(patch) {
    await this.ensureDir();
    const filePath = join(PATCHES_DIR, patch.name + PATCH_EXTENSION);
    try {
      await writeFile(filePath, JSON.stringify(patch, null, 2));
      return true;
    } catch (err) {
      console.error('Failed to save patch:', err);
      return false;
    }
  }

  async deletePatch(name) {
    const filePath = join(PATCHES_DIR, name + PATCH_EXTENSION);
    try {
      await unlink(filePath);
      return true;
    } catch (err) {
      console.error('Failed to delete patch:', err);
      return false;
    }
  }

  async importPreset(patch) {
    return this.savePatch(patch);
  }

  async exportPreset(name) {
    return this.getPatch(name);
  }
}

export const storage = new PatchStorage();