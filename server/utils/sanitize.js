/**
 * Small input checks for data the browser sends us.
 *
 * Every save goes through an allow-list: unknown fields are dropped, strings
 * are length-capped, and nested objects lose any "$" or "." keys so nobody can
 * smuggle MongoDB operators into a document.
 */

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const bool = (v) => (typeof v === 'boolean' ? v : undefined);
const strArray = (v, maxItems, maxLen) =>
  Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, maxItems).map(x => x.slice(0, maxLen)) : undefined;

/** Deep-copies plain JSON, dropping keys that start with "$" or contain "." and capping depth. */
function cleanJson(value, depth = 0) {
  if (depth > 10) return undefined;
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, 20000);
  if (Array.isArray(value)) return value.slice(0, 5000).map(v => cleanJson(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      const cleaned = cleanJson(v, depth + 1);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return undefined;
}

function dropUndefined(obj) {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
}

const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const isSafeId = (id) => typeof id === 'string' && SAFE_ID.test(id);

function cleanStringMap(v, maxKeys = 20, maxLen = 200) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out = {};
  Object.entries(v).slice(0, maxKeys).forEach(([k, val]) => {
    if (!k.startsWith('$') && !k.includes('.') && typeof val === 'string') out[k.slice(0, 40)] = val.slice(0, maxLen);
  });
  return out;
}

/** Fields an Agile whiteboard session may contain. */
function pickAgileSession(body = {}) {
  const challenge = body.challenge && typeof body.challenge === 'object'
    ? dropUndefined({
        title: str(body.challenge.title, 120),
        prompt: str(body.challenge.prompt, 2000),
        considerations: strArray(body.challenge.considerations, 5, 300),
        category: str(body.challenge.category, 60),
        difficulty: str(body.challenge.difficulty, 20),
        duration: str(body.challenge.duration, 20),
        source: str(body.challenge.source, 20)
      })
    : undefined;

  const recordingEvents = Array.isArray(body.recordingEvents)
    ? body.recordingEvents.slice(0, 500).map(e => dropUndefined({
        type: str(e && e.type, 10),
        via: str(e && e.via, 10),
        text: str(e && e.text, 4000),
        cardId: str(e && e.cardId, 80),
        t: num(e && e.t)
      }))
    : undefined;

  return dropUndefined({
    title: str(body.title, 120),
    prompt: str(body.prompt, 2000),
    challenge,
    answers: cleanStringMap(body.answers),
    difficulty: str(body.difficulty, 20),
    category: str(body.category, 60),
    duration: str(body.duration, 20),
    recordedTime: str(body.recordedTime, 20),
    timeTakenSec: num(body.timeTakenSec),
    dateLabel: str(body.dateLabel, 40),
    timestamp: num(body.timestamp),
    notes: strArray(body.notes, 300, 2000),
    isFavorite: bool(body.isFavorite),
    hasRecording: bool(body.hasRecording),
    recordingDuration: num(body.recordingDuration),
    recordingEvents,
    chatCards: Array.isArray(body.chatCards) ? cleanJson(body.chatCards.slice(0, 300)) : undefined,
    shapes: Array.isArray(body.shapes) ? cleanJson(body.shapes.slice(0, 5000)) : undefined,
    chatHistory: Array.isArray(body.chatHistory) ? cleanJson(body.chatHistory.slice(0, 300)) : undefined
  });
}

/** Fields a Quiz-mode chat session may contain. */
function pickChatSession(body = {}) {
  return dropUndefined({
    title: str(body.title, 120),
    prompt: str(body.prompt, 4000),
    timestamp: str(body.timestamp, 40),
    model: str(body.model, 80),
    messages: Array.isArray(body.messages) ? cleanJson(body.messages.slice(0, 300)) : undefined
  });
}

const ROLES = ['student', 'junior-designer', 'designer', 'educator', 'other'];

/** Fields a user may change on their own profile. */
function pickProfile(body = {}) {
  return dropUndefined({
    name: str(body.name, 60) !== undefined ? str(body.name, 60).trim() : undefined,
    role: ROLES.includes(body.role) ? body.role : undefined,
    college: str(body.college, 100) !== undefined ? str(body.college, 100).trim() : undefined,
    ageConfirmed: bool(body.ageConfirmed),
    termsAccepted: bool(body.termsAccepted),
    recordingConsent: bool(body.recordingConsent)
  });
}

module.exports = { pickAgileSession, pickChatSession, pickProfile, cleanJson, isSafeId, ROLES };
