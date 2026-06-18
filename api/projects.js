const { createRecord, createRecords, setCors } = require('./_lib');
const { randomBytes } = require('crypto');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.FACILITATOR_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized — check your facilitator access key' });
  }

  try {
    const { title, start_date, end_date, funder, budget_usd, partners } = req.body;
    if (!title || !Array.isArray(partners) || !partners.length) {
      return res.status(400).json({ error: 'title and at least one partner are required' });
    }

    const projectFields = { title };
    if (start_date) projectFields.start_date = start_date;
    if (end_date) projectFields.end_date = end_date;
    if (funder) projectFields.funder = funder;
    if (budget_usd) {
      const num = parseFloat(String(budget_usd).replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) projectFields.budget_usd = num;
    }

    const project = await createRecord('Projects', projectFields);
    const project_id = project.id;

    const partnerData = partners.map(p => ({
      project_id,
      organisation_name: p.org,
      email: p.email || '',
      token: randomBytes(16).toString('hex')
    }));

    const createdPartners = [];
    for (let i = 0; i < partnerData.length; i += 10) {
      const batch = partnerData.slice(i, i + 10);
      const result = await createRecords('Partners', batch);
      result.records.forEach((rec, j) => {
        createdPartners.push({
          partner_id: rec.id,
          organisation_name: batch[j].organisation_name,
          email: batch[j].email,
          token: batch[j].token
        });
      });
    }

    res.status(200).json({ project_id, partners: createdPartners });
  } catch (err) {
    console.error('POST /api/projects:', err);
    res.status(500).json({ error: err.message });
  }
};
