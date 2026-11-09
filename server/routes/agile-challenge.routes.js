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

router.post('/challenge', async (req, res) => {
  try {
    const challenge = await generateChallenge(req.body || {});
    res.json({ success: true, challenge });
  } catch (err) {
    console.error('[AgileChallengeRoute] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
