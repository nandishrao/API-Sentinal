const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

/**
 * These endpoints always exist. They're only load-bearing when REQUIRE_AUTH=true
 * gates the /api/runs routes (see routes/runs.js) — with it unset, registering
 * and logging in works but nothing actually requires the resulting token.
 */

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    res.status(201).json(await authService.register(username, password));
  } catch (err) {
    if (err instanceof authService.AuthError) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    res.status(200).json(await authService.login(username, password));
  } catch (err) {
    if (err instanceof authService.AuthError) return res.status(401).json({ error: err.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;