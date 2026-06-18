const { getRecords, setCors } = require('../_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.FACILITATOR_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  try {
    const [partnersResult, responsesResult] = await Promise.all([
      getRecords('Partners', `{project_id}="${id}"`,
        ['organisation_name', 'email', 'token']),
      getRecords('Responses', `{project_id}="${id}"`,
        ['token', 'stage_index'])
    ]);

    const completedByToken = {};
    responsesResult.records.forEach(r => {
      const t = r.fields.token;
      if (!completedByToken[t]) completedByToken[t] = [];
      completedByToken[t].push(r.fields.stage_index);
    });

    const status = partnersResult.records.map(r => ({
      organisation_name: r.fields.organisation_name || '',
      email: r.fields.email || '',
      completed_stages: completedByToken[r.fields.token] || []
    }));

    res.status(200).json({ status });
  } catch (err) {
    console.error('GET /api/status/:id:', err);
    res.status(500).json({ error: err.message });
  }
};
