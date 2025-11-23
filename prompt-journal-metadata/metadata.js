// metadata.js
// Pure JavaScript metadata tracking module for prompt journal

function ensureString(value, name) {
  if (typeof value !== 'string') throw new Error(`${name} must be a string`);
}

function validateModelName(name) {
  ensureString(name, 'modelName');
  if (!name.trim()) throw new Error('modelName must be a non-empty string');
  if (name.length > 100) throw new Error('modelName must be at most 100 characters');
}

function isValidISO8601WithMsZ(dateStr) {
  try {
    if (typeof dateStr !== 'string') return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    // Require the canonical ISO string with milliseconds and Z
    return d.toISOString() === dateStr;
  } catch (e) {
    return false;
  }
}

function detectCodeish(content) {
  if (typeof content !== 'string') return false;
  // crude heuristics: fenced code block or typical code chars/keywords
  return /```|\bfunction\b|=>|\{|;|\(|\)\s*\{|console\.|import\s+|export\s+/.test(content);
}

export function estimateTokens(text, isCode = false) {
  try {
    ensureString(text, 'text');
    const trimmed = text.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const charCount = text.length;

    let min = 0.75 * wordCount;
    let max = 0.25 * charCount;

    if (isCode) {
      min *= 1.3;
      max *= 1.3;
    }

    // Round and ensure non-negative
    min = Math.max(0, Math.round(min));
    max = Math.max(0, Math.round(max));

    // Determine confidence by average estimate
    const avg = (min + max) / 2;
    let confidence = 'high';
    if (avg < 1000) confidence = 'high';
    else if (avg <= 5000) confidence = 'medium';
    else confidence = 'low';

    return { min, max, confidence };
  } catch (err) {
    throw new Error('estimateTokens error: ' + err.message);
  }
}

export function trackModel(modelName, content) {
  try {
    validateModelName(modelName);
    if (typeof content !== 'string') throw new Error('content must be a string');

    const createdAt = new Date().toISOString();
    const isCode = detectCodeish(content);
    const tokenEstimate = estimateTokens(content, isCode);

    const metadata = {
      model: modelName,
      createdAt,
      updatedAt: createdAt,
      tokenEstimate,
    };

    // Validate output schema dates
    if (!isValidISO8601WithMsZ(metadata.createdAt) || !isValidISO8601WithMsZ(metadata.updatedAt)) {
      throw new Error('Generated timestamps are not valid ISO 8601 strings');
    }

    return metadata;
  } catch (err) {
    throw new Error('trackModel error: ' + err.message);
  }
}

export function updateTimestamps(metadata) {
  try {
    if (typeof metadata !== 'object' || metadata === null) throw new Error('metadata must be an object');
    const { createdAt } = metadata;
    if (!isValidISO8601WithMsZ(createdAt)) throw new Error('metadata.createdAt must be a valid ISO 8601 string with milliseconds and Z');

    const updatedAt = new Date().toISOString();
    if (new Date(updatedAt).getTime() < new Date(createdAt).getTime()) {
      throw new Error('updatedAt must be greater than or equal to createdAt');
    }

    // return a shallow copy with updated timestamp
    return Object.assign({}, metadata, { updatedAt });
  } catch (err) {
    throw new Error('updateTimestamps error: ' + err.message);
  }
}

// For non-module environments, attach to window (optional)
if (typeof window !== 'undefined') {
  window.promptJournalMetadata = window.promptJournalMetadata || {};
  window.promptJournalMetadata.estimateTokens = estimateTokens;
  window.promptJournalMetadata.trackModel = trackModel;
  window.promptJournalMetadata.updateTimestamps = updateTimestamps;
}
