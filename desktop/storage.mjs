import {readFile, mkdir, writeFile, rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {validateState, ID} from '../extension/core.js';
const KEYS = new Set(['state', 'metadata', 'longIndex', 'cinemaThemeApplied']);
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const timestamp = x => Number.isFinite(x) && x >= 0;
export function validateValue(key, value) {
  if (!KEYS.has(key)) throw Error('Unsupported storage key');
  if (key === 'state') return validateState(value);
  if (key === 'cinemaThemeApplied') {
    if (typeof value !== 'boolean') throw Error('Invalid preference');
    return value;
  }
  if (key === 'metadata') {
    if (!object(value) || Object.keys(value).length > 6454) throw Error('Invalid metadata');
    const out = {};
    for (const [id, v] of Object.entries(value)) {
      if (!ID.test(id) || !object(v) || !Number.isInteger(v.duration) || v.duration <= 0 || v.duration > 31536000 || !timestamp(v.at)) throw Error('Invalid video metadata');
      out[id] = {duration: v.duration, at: v.at};
    }
    return out;
  }
  if (!object(value) || !Array.isArray(value.ids) || value.ids.length > 6454 || value.ids.some(id => typeof id !== 'string' || !ID.test(id)) || !timestamp(value.at) || typeof value.complete !== 'boolean') throw Error('Invalid Longs cache');
  return {ids: [...new Set(value.ids)], at: value.at, complete: value.complete};
}

// Writes are serialized and replaced atomically so an interrupted write leaves the previous file intact.
export class LibraryStorage {
  #data; #queue = Promise.resolve();
  constructor(file) { this.file = file; }
  async #load() {
    if (this.#data) return;
    let raw;
    try { raw = await readFile(this.file, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') { this.#data = {}; return; } throw error; }
    if (Buffer.byteLength(raw) > 5_000_000) throw Error('Local library exceeds the storage limit');
    const parsed = JSON.parse(raw);
    if (!object(parsed)) throw Error('Invalid local library file; original file has been preserved');
    const clean = {};
    for (const [key, value] of Object.entries(parsed)) clean[key] = validateValue(key, value);
    this.#data = clean;
  }
  async get(key) {
    if (!KEYS.has(key)) throw Error('Unsupported storage key');
    await this.#queue.catch(() => {});
    await this.#load();
    return structuredClone(this.#data[key] ?? null);
  }
  set(key, value) {
    const clean = validateValue(key, value);
    const next = this.#queue.catch(() => {}).then(async () => {
      await this.#load();
      const updated = {...this.#data, [key]: clean};
      const content = JSON.stringify(updated);
      if (Buffer.byteLength(content) > 5_000_000) throw Error('Local library exceeds the storage limit');
      await mkdir(dirname(this.file), {recursive: true});
      const temp = this.file + '.tmp';
      await writeFile(temp, content, {mode: 0o600});
      await rename(temp, this.file);
      this.#data = updated;
    });
    this.#queue = next;
    return next;
  }
  async flush() { await this.#queue; }
}
