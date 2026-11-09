/**
 * Agile Challenge Route
 *
 * POST /api/agile/challenge
 * Body: { difficulty, category, duration, avoid?: string[] }
 * Response: { success, challenge: { title, prompt, considerations[], category, difficulty, duration, source } }
 *
 * source is 'ai' when the LLM wrote it, 'fallback' when the built-in bank was used.
 */

const express = require('express');
const router = express.Router();
const { generateChallenge } = require('../services/challengeGenerator');
const { askCoach } = require('../services/whiteboardCoach');

router.post('/challenge', async (req, res) => {
  try {
    const challenge = await generateChallenge(req.body || {});
    res.json({ success: true, challenge });
  } catch (err) {
    console.error('[AgileChallengeRoute] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/agile/ask
 * Body: { question: string, challenge?: string, history?: [{ role, content }] }
 * Response: { success, answer } — a short plain-text answer for mid-challenge questions.
 */
router.post('/ask', async (req, res) => {
  const { question, challenge, history } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ success: false, error: 'question is required' });
  }
  try {
    const answer = await askCoach({ question, challenge, history });
    res.json({ success: true, answer });
  } catch (err) {
    console.error('[AgileAskRoute] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
