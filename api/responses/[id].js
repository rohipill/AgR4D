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
    const [responsesResult, partnersResult] = await Promise.all([
      getRecords('Responses', `{project_id}="${id}"`,
        ['token', 'respondent_name', 'respondent_designation', 'stage_index', 'answers']),
      getRecords('Partners', `{project_id}="${id}"`,
        ['token', 'organisation_name'])
    ]);

    const tokenToOrg = {};
    partnersResult.records.forEach(r => {
      tokenToOrg[r.fields.token] = r.fields.organisation_name || '';
    });

    const responses = responsesResult.records.map(r => ({
      respondent_name: r.fields.respondent_name || '',
      respondent_designation: r.fields.respondent_designation || '',
      organisation_name: tokenToOrg[r.fields.token] || '',
      stage_index: r.fields.stage_index,
      answers: JSON.parse(r.fields.answers || '[]')
    }));

    res.status(200).json({ responses });
  } catch (err) {
    console.error('GET /api/responses/:id:', err);
    res.status(500).json({ error: err.message });
  }
};
