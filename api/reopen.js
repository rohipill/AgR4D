const { getRecords, updateRecord, setCors } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7).trim() : '';
  if (!key) return res.status(401).json({ error: 'Unauthorized' });

  const { token, q_indices } = req.body;
  if (!token || !Array.isArray(q_indices)) {
    return res.status(400).json({ error: 'token and q_indices are required' });
  }

  try {
    const result = await getRecords('Partners', `{token}="${token}"`, ['reopened_questions']);
    if (!result.records.length) return res.status(404).json({ error: 'Partner not found' });

    const rec = result.records[0];
    let existing = [];
    try { existing = JSON.parse(rec.fields.reopened_questions || '[]'); } catch (e) {}
    const merged = [...new Set([...existing, ...q_indices])];

    await updateRecord('Partners', rec.id, { reopened_questions: JSON.stringify(merged) });
    res.status(200).json({ reopened_questions: merged });
  } catch (err) {
    console.error('POST /api/reopen:', err);
    res.status(500).json({ error: err.message });
  }
};
