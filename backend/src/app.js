const express = require('express');
const cors = require('cors');
const runsRouter = require('./routes/runs');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/runs', runsRouter);

// Central error handler — keeps unexpected errors from leaking stack traces
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
