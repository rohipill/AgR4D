const { getRecords, updateRecord, setCors } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, answers } = req.body;
  // answers: [{q_idx, v, note}]
  if (!token || !Array.isArray(answers) || !answers.length) {
    return res.status(400).json({ error: 'token and answers are required' });
  }

  try {
    const result = await getRecords('Partners', `{token}="${token}"`, ['recheck_answers']);
    if (!result.records.length) return res.status(404).json({ error: 'Partner not found' });

    const rec = result.records[0];
    let existing = {};
    try { existing = JSON.parse(rec.fields.recheck_answers || '{}'); } catch (e) {}

    answers.forEach(a => {
      existing[String(a.q_idx)] = { v: a.v, note: a.note || '' };
    });

    await updateRecord('Partners', rec.id, { recheck_answers: JSON.stringify(existing) });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('POST /api/recheck:', err);
    res.status(500).json({ error: err.message });
  }
};
