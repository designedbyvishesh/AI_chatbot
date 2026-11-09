/**
 * Agile Challenge Generator
 *
 * Turns the answers from the Agile pre-session questions (difficulty,
 * category, time) into a whiteboard design challenge using the LLM.
 * If the LLM is unavailable, falls back to a small built-in bank so the
 * session can always start.
 */

const { callGroq } = require('./llmOrchestrator');

const CATEGORIES = [
  'Beauty & Personal Care', 'E-commerce', 'Consumer Services', 'EdTech', 'SaaS',
  'Food & Beverage', 'Travel', 'FinTech', 'Home Services', 'Logistics', 'Payment',
  'B2B Services', 'Healthtech', 'Real Estate'
];

// Used only when the LLM call fails, so a session never starts empty.
const FALLBACK_BANK = {
  'Beauty & Personal Care': 'Design a skincare routine tracker that helps first-time buyers pick products that suit their skin type.',
  'E-commerce': 'Design a returns and exchange flow for a fashion marketplace where most buyers shop on mobile.',
  'Consumer Services': 'Design a booking experience for local repair services where customers cannot describe the problem well.',
  'EdTech': 'Design a study companion that helps college students plan revision in the two weeks before exams.',
  'SaaS': 'Design an onboarding flow for a project-management tool used by small agencies switching from spreadsheets.',
  'Food & Beverage': 'Design a group food ordering flow for office teams splitting one order and one bill.',
  'Travel': 'Design a mobile and kiosk experience for travelers dealing with severe flight disruptions at a busy airport.',
  'FinTech': 'Design a monthly budgeting experience for young professionals receiving their first salary.',
  'Home Services': 'Design a way for tenants to report and track home maintenance issues with their landlord.',
  'Logistics': 'Design a delivery tracking experience for small businesses shipping fragile items across cities.',
  'Payment': 'Design a bill-splitting flow for friends on a trip who pay in different currencies.',
  'B2B Services': 'Design a vendor approval dashboard for procurement teams in mid-sized companies.',
  'Healthtech': 'Design a medication reminder experience for elderly patients managed by a family caregiver.',
  'Real Estate': 'Design a rental search experience for students moving to a new city for the first time.'
};

function resolveCategory(category) {
  if (category && category !== 'Random' && CATEGORIES.includes(category)) return category;
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

function scopeForDuration(duration) {
  if (duration === '30 min') return 'Keep the scope to a single core flow that can be sketched in 30 minutes.';
  if (duration === '60 min') return 'The scope can cover an end-to-end experience across 2 to 3 key flows, sized for 60 minutes.';
  if (duration === '45 min') return 'Size the scope for 45 minutes: one main flow plus one supporting flow.';
  return 'There is no fixed time limit, so size it like a typical 45-minute whiteboard round.';
}

function buildMessages({ difficulty, category, duration, avoid }) {
  const isHard = difficulty === 'Difficult';
  const system = `You write whiteboard design challenges for product designers practising for design interviews.
Respond in valid JSON only, no text outside the JSON, no backticks:
{
  "title": "2 to 4 word name for the challenge",
  "prompt": "One sentence brief starting with 'Design', naming the product, the user and their situation (max 35 words)",
  "considerations": ["2 to 3 short lines (max 14 words each) the designer should think about"]
}
Rules:
- Make it realistic and specific to the industry, like a real product team would face.
- ${isHard
    ? 'Difficulty is Difficult: include a real tension, e.g. conflicting user groups, tight business or technical constraints, accessibility needs, or an edge case that shapes the solution.'
    : 'Difficulty is Normal: one clear user group and a clear problem, suitable for early-career designers.'}
- ${scopeForDuration(duration)}
- Do not give the solution away. Plain words, no jargon, no emojis.`;

  const avoidLine = avoid && avoid.length
    ? `\nDo not repeat or closely resemble these earlier challenges:\n- ${avoid.join('\n- ')}`
    : '';

  return [
    { role: 'system', content: system },
    { role: 'user', content: `Industry: ${category}. Difficulty: ${difficulty}. Time: ${duration}.${avoidLine}\nWrite one challenge.` }
  ];
}

function parseChallenge(raw) {
  let text = String(raw).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  text = text.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last <= first) throw new Error('No JSON object in LLM output');
  const parsed = JSON.parse(text.slice(first, last + 1));
  if (!parsed.prompt || typeof parsed.prompt !== 'string') throw new Error('LLM output missing prompt');
  return {
    title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
    prompt: parsed.prompt.trim(),
    considerations: Array.isArray(parsed.considerations)
      ? parsed.considerations.filter(c => typeof c === 'string' && c.trim()).slice(0, 3).map(c => c.trim())
      : []
  };
}

/**
 * @param {Object} answers - { difficulty, category, duration, avoid: string[] }
 * @returns {Promise<{ title, prompt, considerations, category, difficulty, duration, source }>}
 */
async function generateChallenge(answers = {}) {
  const difficulty = answers.difficulty === 'Difficult' ? 'Difficult' : 'Normal';
  const duration = ['30 min', '45 min', '60 min', 'No'].includes(answers.duration) ? answers.duration : '45 min';
  const category = resolveCategory(answers.category);
  const avoid = Array.isArray(answers.avoid)
    ? answers.avoid.filter(a => typeof a === 'string').slice(0, 10).map(a => a.slice(0, 200))
    : [];

  try {
    const raw = await callGroq(buildMessages({ difficulty, category, duration, avoid }), {
      maxTokens: 600,
      temperature: 0.9
    });
    return { ...parseChallenge(raw), category, difficulty, duration, source: 'ai' };
  } catch (err) {
    console.warn('[ChallengeGenerator] Falling back to built-in challenge:', err.message);
    return {
      title: category,
      prompt: FALLBACK_BANK[category],
      considerations: [],
      category,
      difficulty,
      duration,
      source: 'fallback'
    };
  }
}

module.exports = { generateChallenge, parseChallenge, CATEGORIES };
