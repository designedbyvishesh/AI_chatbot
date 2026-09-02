/**
 * LLM Orchestrator
 * 
 * Assembles the full prompt (system + knowledge + conversation history)
 * and calls the Groq API server-side using raw fetch.
 */

const { buildSystemPrompt } = require('../prompts/designMentorPrompt');
const { getContext } = require('./knowledgeRetriever');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'qwen/qwen3.8-27b';
const MAX_TOKENS = 1024;

/**
 * Send a multi-turn conversation to Groq and get a structured response.
 * 
 * @param {Array} conversationHistory - Array of { role: 'user'|'assistant', content: string }
 * @param {string} topic - Knowledge topic key (e.g., 'design-systems')
 * @returns {Object} Parsed structured response from the LLM
 */
async function chat(conversationHistory, topic = 'design-systems') {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables. Add it to your .env file.');
  }

  // 1. Get the latest user message for smart knowledge selection
  const lastUserMsg = [...conversationHistory].reverse().find(m => m.role === 'user');
  const userMessage = lastUserMsg ? lastUserMsg.content : '';

  // 2. Retrieve relevant knowledge context (picks most relevant file)
  const knowledgeContext = getContext(topic, userMessage);

  // 3. Build the system prompt with knowledge
  const systemPrompt = buildSystemPrompt(knowledgeContext);

  // 3. Assemble messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory
  ];

  // 4. Call Groq API
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('Groq API returned empty response');
  }

  // 5. Parse the structured JSON response
  return parseStructuredResponse(rawContent);
}

/**
 * Parse the LLM's response, attempting to extract structured JSON.
 * Falls back to a text response if JSON parsing fails.
 */
function parseStructuredResponse(rawContent) {
  let text = rawContent.trim();

  // 1. Remove Qwen thinking tags (<think>...</think>)
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // 2. Remove markdown code fences
  if (text.startsWith('```json')) {
    text = text.slice(7);
  } else if (text.startsWith('```')) {
    text = text.slice(3);
  }
  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }
  text = text.trim();

  // 3. Try direct parse first
  try {
    const parsed = JSON.parse(text);
    if (parsed.type && ['question', 'evaluation', 'text'].includes(parsed.type)) {
      return parsed;
    }
  } catch (e) {
    // Continue to fallback methods
  }

  // 4. Try to find JSON object anywhere in the text
  const jsonMatch = text.match(/\{[\s\S]*"type"\s*:\s*"(question|evaluation|text)"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.type) return parsed;
    } catch (e) {
      // Continue
    }
  }

  // 5. Last resort — find the first { and last } and try parsing
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));
      if (parsed.type) return parsed;
    } catch (e) {
      // Fall through
    }
  }

  // 6. Return as plain text
  console.warn('[LLMOrchestrator] Could not extract JSON, returning as text');
  // Clean up the text for display — remove any leftover thinking content
  let cleanText = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return {
    type: 'text',
    content: cleanText,
    references: []
  };
}

module.exports = { chat };
