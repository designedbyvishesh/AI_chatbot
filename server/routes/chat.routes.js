/**
 * Chat Routes
 * 
 * POST /api/chat — Conversational AI endpoint
 * GET  /api/chat/topics — List available knowledge topics
 */

const express = require('express');
const router = express.Router();
const { chat } = require('../services/llmOrchestrator');
const { listTopics } = require('../services/knowledgeRetriever');

/**
 * POST /api/chat
 * 
 * Body: {
 *   conversationHistory: [{ role: 'user'|'assistant', content: string }],
 *   topic: string (default: 'design-systems')
 * }
 * 
 * Response: {
 *   success: boolean,
 *   response: { type: 'question'|'evaluation'|'text', ... }
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { conversationHistory = [], topic = 'design-systems' } = req.body;

    // Validate conversation history
    if (!Array.isArray(conversationHistory)) {
      return res.status(400).json({
        success: false,
        error: 'conversationHistory must be an array'
      });
    }

    // Cap conversation history to prevent token overflow
    const cappedHistory = conversationHistory.slice(-30);

    // Call the LLM orchestrator
    const response = await chat(cappedHistory, topic);

    res.json({
      success: true,
      response
    });
  } catch (err) {
    console.error('[ChatRoute] Error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/chat/topics
 * 
 * Returns available knowledge topics
 */
router.get('/topics', (req, res) => {
  try {
    const topics = listTopics();
    res.json({ success: true, topics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
