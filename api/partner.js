const { getRecords, getRecord, setCors } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token is required' });

  try {
    const partnerResult = await getRecords('Partners', `{token}="${token}"`,
      ['organisation_name', 'project_id']);
    if (!partnerResult.records.length) {
      return res.status(404).json({ error: 'Invalid or unrecognised link' });
    }

    const partnerRec = partnerResult.records[0];
    const project_id = partnerRec.fields.project_id;

    const [project, responsesResult] = await Promise.all([
      getRecord('Projects', project_id),
      getRecords('Responses', `{token}="${token}"`, ['stage_index'])
    ]);

    const completed_stages = responsesResult.records.map(r => r.fields.stage_index);

    res.status(200).json({
      project_id,
      project_title: project.fields.title || '',
      organisation_name: partnerRec.fields.organisation_name || '',
      completed_stages
    });
  } catch (err) {
    console.error('GET /api/partner:', err);
    res.status(500).json({ error: err.message });
  }
};
