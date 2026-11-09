/**
 * Whiteboard Coach
 *
 * Answers questions the designer asks in the middle of a timed Agile
 * whiteboard challenge. The designer is on the clock, so answers are short,
 * plain text and only cover what was asked.
 */

const { callGroq, callGroqStream } = require('./llmOrchestrator');

const MAX_HISTORY_TURNS = 6; // last 6 question/answer pairs

function buildSystemPrompt(challenge) {
  return `You are Rabbit, a design coach sitting beside a product designer during a timed whiteboard design challenge.
${challenge ? `The challenge they are solving: "${challenge}"` : ''}

They are under time pressure and will read your answer in a few seconds. Rules:
- Answer only what was asked. No intro, no recap of the question, no closing summary.
- Keep it under 60 words. Use at most 3 short bullet points ("- ") when listing; otherwise 1 to 3 short sentences.
- Plain text only: no headings, no bold, no markdown tables, no emojis.
- Be specific to their challenge. Guide their thinking; do not hand them a finished design.
- If the question is vague, give the single most useful next step.`;
}

function cleanAnswer(raw) {
  return String(raw || '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .trim();
}

/**
 * @param {Object} params
 * @param {string} params.question - What the designer just asked
 * @param {string} [params.challenge] - The current challenge brief
 * @param {Array<{role: 'user'|'assistant', content: string}>} [params.history] - Earlier canvas Q&A
 * @returns {Promise<string>} short plain-text answer
 */
function buildMessages({ question, challenge = '', history = [] }) {
  const safeHistory = (Array.isArray(history) ? history : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_TURNS * 2)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));

  const messages = [
    { role: 'system', content: buildSystemPrompt(String(challenge).slice(0, 600)) },
    ...safeHistory,
    { role: 'user', content: String(question).slice(0, 1000) }
  ];

  return messages;
}

async function askCoach(params) {
  const raw = await callGroq(buildMessages(params), { maxTokens: 400, temperature: 0.5 });
  return cleanAnswer(raw);
}

/**
 * Same as askCoach, but streams the answer. onText(chunk) receives cleaned
 * text as it arrives (thinking blocks and markdown markers are dropped).
 */
async function askCoachStream(params, onText, { signal } = {}) {
  let inThink = false;
  let pending = '';

  const emit = (text) => {
    const cleaned = text.replace(/\*\*/g, '').replace(/^#{1,6}\s+/gm, '');
    if (cleaned) onText(cleaned);
  };

  await callGroqStream(buildMessages(params), (delta) => {
    pending += delta;
    // Drop any <think>...</think> block some models emit before the answer
    for (;;) {
      if (inThink) {
        const end = pending.indexOf('</think>');
        if (end === -1) { pending = pending.slice(-8); return; }
        pending = pending.slice(end + 8);
        inThink = false;
      }
      const start = pending.indexOf('<think>');
      if (start !== -1) {
        emit(pending.slice(0, start));
        pending = pending.slice(start + 7);
        inThink = true;
        continue;
      }
      // Hold back a possible partial "<think" or "**" at the end
      const hold = pending.match(/<t?h?i?n?k?$|\*$/);
      const cut = hold ? pending.length - hold[0].length : pending.length;
      emit(pending.slice(0, cut));
      pending = pending.slice(cut);
      return;
    }
  }, { maxTokens: 400, temperature: 0.5, signal });

  if (!inThink && pending) emit(pending);
}

module.exports = { askCoach, askCoachStream };
