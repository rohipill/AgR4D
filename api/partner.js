const { getRecords, getRecord, setCors } = require('./_lib');


module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token is required' });

  try {
    const partnerResult = await getRecords('Partners', `{token}="${token}"`,
      ['organisation_name', 'project_id', 'reopened_questions']);
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

    let open_stages = [0,1,2,3,4,5];
    try { open_stages = JSON.parse(project.fields.open_stages || '[0,1,2,3,4,5]'); } catch(e) {}

    let reopened_questions = [];
    try { reopened_questions = JSON.parse(partnerRec.fields.reopened_questions || '[]'); } catch(e) {}

    res.status(200).json({
      project_id,
      project_title: project.fields.title || '',
      organisation_name: partnerRec.fields.organisation_name || '',
      completed_stages,
      open_stages,
      reopened_questions
    });
  } catch (err) {
    console.error('GET /api/partner:', err);
    res.status(500).json({ error: err.message });
  }
};
