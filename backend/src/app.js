const express = require('express');
const cors = require('cors');
const runsRouter = require('./routes/run');
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/run', runsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);

// Central error handler — keeps unexpected errors from leaking stack traces
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;