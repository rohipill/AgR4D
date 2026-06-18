const { getRecords, createRecord, setCors } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, respondent_name, respondent_designation, stage_index, answers } = req.body;
    if (!token || !respondent_name || stage_index == null || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const partnerResult = await getRecords('Partners', `{token}="${token}"`,
      ['organisation_name', 'project_id']);
    if (!partnerResult.records.length) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const project_id = partnerResult.records[0].fields.project_id;

    const existingResult = await getRecords('Responses',
      `AND({token}="${token}",{stage_index}=${parseInt(stage_index)})`, ['stage_index']);
    if (existingResult.records.length) {
      return res.status(409).json({ error: 'This stage has already been submitted' });
    }

    await createRecord('Responses', {
      token,
      project_id,
      respondent_name,
      respondent_designation: respondent_designation || '',
      stage_index: parseInt(stage_index),
      answers: JSON.stringify(answers)
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('POST /api/responses:', err);
    res.status(500).json({ error: err.message });
  }
};
