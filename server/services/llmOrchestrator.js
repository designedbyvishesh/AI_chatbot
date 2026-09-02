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
  // Try to extract JSON from the response
  // The LLM might wrap it in backticks or add extra text
  let jsonStr = rawContent.trim();

  // Remove markdown code fences if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate expected structure
    if (parsed.type && ['question', 'evaluation', 'text'].includes(parsed.type)) {
      return parsed;
    }

    // If it parsed but doesn't have the expected type, wrap it
    return {
      type: 'text',
      content: rawContent,
      references: []
    };
  } catch (e) {
    // JSON parsing failed — return as plain text
    console.warn('[LLMOrchestrator] Failed to parse JSON response, returning as text');
    return {
      type: 'text',
      content: rawContent,
      references: []
    };
  }
}

module.exports = { chat };
