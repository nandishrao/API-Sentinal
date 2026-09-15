require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('[db] connected');
    } catch (err) {
      // Deliberate: DB connectivity does not block server startup. Run
      // persistence is best-effort (see runs.js) — the core diff/explain
      // flow works even with Mongo unreachable.
      console.error('[db] connection failed, continuing without persistence:', err.message);
    }
  } else {
    console.warn('[db] MONGO_URI not set — run history will not persist');
  }

  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
}

start();
