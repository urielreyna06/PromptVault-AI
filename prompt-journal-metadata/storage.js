// storage.js
// Handles localStorage persistence, export/import (with backup & rollback), and validation

const LS_KEY = 'promptJournal.prompts';
const BACKUP_PREFIX = 'promptJournal.backup.';
const EXPORT_VERSION = '1.0.0';

function ensureString(value, name) {
  if (typeof value !== 'string') throw new Error(`${name} must be a string`);
}

function isValidISO8601WithMsZ(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString() === dateStr;
}

function validateTokenEstimate(te) {
  if (typeof te !== 'object' || te === null) throw new Error('tokenEstimate is required');
  if (typeof te.min !== 'number' || typeof te.max !== 'number') throw new Error('tokenEstimate.min and .max must be numbers');
  if (!['high','medium','low'].includes(te.confidence)) throw new Error('tokenEstimate.confidence must be one of high|medium|low');
}

function validatePromptShape(p) {
  if (typeof p !== 'object' || p === null) throw new Error('prompt must be an object');
  if (!p.id) throw new Error('prompt.id is required');
  ensureString(p.id, 'prompt.id');
  ensureString(p.model, 'prompt.model');
  if (!isValidISO8601WithMsZ(p.createdAt)) throw new Error('prompt.createdAt must be valid ISO 8601 with ms and Z');
  if (!isValidISO8601WithMsZ(p.updatedAt)) throw new Error('prompt.updatedAt must be valid ISO 8601 with ms and Z');
  validateTokenEstimate(p.tokenEstimate);
}

function readAllFromLS() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error('stored data is not an array');
    return arr;
  } catch (err) {
    throw new Error('Failed to parse stored prompts: ' + err.message);
  }
}

function writeAllToLS(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function generateId() {
  // simple unique id
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,9);
}

export function getAllPrompts() {
  return readAllFromLS();
}

export function savePrompt(prompt) {
  // prompt may not have id yet
  try {
    const all = readAllFromLS();
    const toSave = Object.assign({}, prompt);
    if (!toSave.id) toSave.id = generateId();
    // Basic validation: ensure required fields present
    if (!toSave.model) throw new Error('prompt.model is required');
    if (!toSave.createdAt) toSave.createdAt = new Date().toISOString();
    if (!toSave.updatedAt) toSave.updatedAt = toSave.createdAt;
    if (!toSave.tokenEstimate) toSave.tokenEstimate = { min:0, max:0, confidence: 'high' };

    // validate shape
    validatePromptShape(toSave);

    // replace if id exists
    const idx = all.findIndex(p => p.id === toSave.id);
    if (idx === -1) all.push(toSave);
    else all[idx] = toSave;

    writeAllToLS(all);
    return toSave;
  } catch (err) {
    throw new Error('savePrompt error: ' + err.message);
  }
}

function computeStats(prompts) {
  const totalPrompts = prompts.length;
  // average rating (nullable) - ratings may be null/undefined
  const ratings = prompts.map(p => (typeof p.rating === 'number' ? p.rating : null)).filter(r => r !== null);
  const averageRating = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length) : null;
  // most used model
  const modelCounts = {};
  for (const p of prompts) modelCounts[p.model] = (modelCounts[p.model]||0)+1;
  let mostUsedModel = null;
  let maxCount = 0;
  for (const k of Object.keys(modelCounts)) if (modelCounts[k] > maxCount) { maxCount = modelCounts[k]; mostUsedModel = k; }
  return { totalPrompts, averageRating, mostUsedModel };
}

export function exportPrompts() {
  try {
    const prompts = readAllFromLS();
    // validate prompt shapes
    for (const p of prompts) validatePromptShape(p);

    const stats = computeStats(prompts);
    const payload = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      stats,
      prompts,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const filename = `prompt-journal-export-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return payload;
  } catch (err) {
    throw new Error('exportPrompts error: ' + err.message);
  }
}

function backupExisting() {
  const now = new Date().toISOString();
  const key = BACKUP_PREFIX + now;
  const raw = localStorage.getItem(LS_KEY) || '[]';
  localStorage.setItem(key, raw);
  return key;
}

function restoreBackup(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) throw new Error('backup not found: ' + key);
  localStorage.setItem(LS_KEY, raw);
}

function listBackups() {
  const items = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(BACKUP_PREFIX)) {
      const time = k.slice(BACKUP_PREFIX.length);
      items.push({ key: k, time });
    }
  }
  // sort newest first
  items.sort((a,b) => (a.time < b.time ? 1 : -1));
  return items;
}

function deleteBackup(key) {
  localStorage.removeItem(key);
}

function deletePromptById(id) {
  const all = readAllFromLS();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('prompt not found: ' + id);
  const backupKey = backupExisting();
  all.splice(idx, 1);
  writeAllToLS(all);
  return backupKey;
}

export async function importPromptsFile(file, options = { replaceAll: false }) {
  try {
    if (!(file instanceof File)) throw new Error('file must be a File object');
    const txt = await file.text();
    let parsed;
    try { parsed = JSON.parse(txt); } catch (e) { throw new Error('Failed to parse JSON: ' + e.message); }

    if (!parsed.version) throw new Error('export file missing version');
    if (parsed.version !== EXPORT_VERSION) {
      // For now, require exact match
      throw new Error(`Unsupported export version: ${parsed.version}. Expected ${EXPORT_VERSION}`);
    }
    if (!Array.isArray(parsed.prompts)) throw new Error('exported prompts array missing');

    // validate all incoming prompts
    for (const p of parsed.prompts) validatePromptShape(p);

    // backup existing
    const backupKey = backupExisting();

    try {
      const existing = readAllFromLS();
      if (options.replaceAll) {
        writeAllToLS(parsed.prompts);
      } else {
        // merge mode: detect duplicates by id
        const existingMap = new Map(existing.map(p => [p.id, p]));
        const incomingMap = new Map(parsed.prompts.map(p => [p.id, p]));
        const duplicates = parsed.prompts.filter(p => existingMap.has(p.id));

        if (duplicates.length > 0) {
          const replace = options.replaceDuplicates;
          let doReplace;
          if (typeof replace === 'undefined') {
            if (typeof options.onDuplicateChoices === 'function') {
              // ask UI via callback
              try { doReplace = await options.onDuplicateChoices(duplicates.length); } catch (e) { doReplace = false; }
            } else {
              // default: skip duplicates
              doReplace = false;
            }
          } else {
            doReplace = !!replace;
          }

          if (doReplace) {
            for (const p of parsed.prompts) existingMap.set(p.id, p);
          } else {
            for (const p of parsed.prompts) if (!existingMap.has(p.id)) existingMap.set(p.id, p);
          }
          const merged = Array.from(existingMap.values());
          writeAllToLS(merged);
        } else {
          // no duplicates: simply append
          const merged = existing.concat(parsed.prompts);
          writeAllToLS(merged);
        }
      }
      return { success: true, backupKey };
    } catch (applyErr) {
      // rollback
      try { restoreBackup(backupKey); } catch (rbErr) { console.error('Rollback failed:', rbErr); }
      throw applyErr;
    }
  } catch (err) {
    throw new Error('importPromptsFile error: ' + err.message);
  }
}

// Expose helper to clear all prompts (for testing) - careful
export function clearAllPrompts() {
  localStorage.removeItem(LS_KEY);
}

// expose backup utilities
export { backupExisting as createBackup, restoreBackup, listBackups, deleteBackup, deletePromptById as deletePrompt };
