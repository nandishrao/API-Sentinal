// Silent under test: several tests deliberately exercise failure paths, and
// their expected error logs would otherwise drown the real test output.
const SILENT = process.env.NODE_ENV === 'test';

function log(level, event, fields = {}) {
  if (SILENT) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else console.log(line);
}

module.exports = {
  info: (event, fields) => log('info', event, fields),
  warn: (event, fields) => log('warn', event, fields),
  error: (event, fields) => log('error', event, fields),
};