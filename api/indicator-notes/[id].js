const { getRecord, updateRecord, setCors } = require('../_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7).trim() : '';
  if (!key) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const rec = await getRecord('Projects', id);
      let notes = {};
      try { notes = JSON.parse(rec.fields.indicator_notes || '{}'); } catch (e) {}
      res.status(200).json({ indicator_notes: notes });
    } catch (err) {
      console.error('GET /api/indicator-notes/:id:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { indicator_notes } = req.body;
      await updateRecord('Projects', id, { indicator_notes: JSON.stringify(indicator_notes) });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('PATCH /api/indicator-notes/:id:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
