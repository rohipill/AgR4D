const { getRecords, createRecord, createRecords, setCors } = require('./_lib');
const { randomBytes } = require('crypto');

function extractKey(auth) {
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const k = auth.slice(7).trim();
  return k || null;
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = extractKey(req.headers.authorization);
  if (!key) return res.status(401).json({ error: 'Unauthorized — enter your facilitator key' });

  /* ── GET: list all projects for this key ── */
  if (req.method === 'GET') {
    try {
      const result = await getRecords('Projects',
        `{facilitator_key}="${key}"`,
        ['title', 'start_date', 'end_date', 'funder']);
      const projects = result.records.map(r => ({
        project_id: r.id,
        title: r.fields.title || '',
        start_date: r.fields.start_date || '',
        end_date: r.fields.end_date || '',
        funder: r.fields.funder || ''
      }));
      return res.status(200).json({ projects });
    } catch (err) {
      console.error('GET /api/projects:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /* ── POST: create a new project ── */
  if (req.method === 'POST') {
    try {
      const { title, start_date, end_date, funder, budget_usd, open_stages, partners } = req.body;
      if (!title || !Array.isArray(partners) || !partners.length) {
        return res.status(400).json({ error: 'title and at least one partner are required' });
      }

      const projectFields = { title, facilitator_key: key };
      if (start_date) projectFields.start_date = start_date;
      if (end_date) projectFields.end_date = end_date;
      if (funder) projectFields.funder = funder;
      if (budget_usd) {
        const num = parseFloat(String(budget_usd).replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) projectFields.budget_usd = num;
      }
      if (Array.isArray(open_stages)) {
        projectFields.open_stages = JSON.stringify(open_stages);
      }

      const project = await createRecord('Projects', projectFields);
      const project_id = project.id;

      const partnerData = partners.map(p => ({
        project_id,
        organisation_name: p.org,
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
            token: batch[j].token
          });
        });
      }

      return res.status(200).json({ project_id, partners: createdPartners });
    } catch (err) {
      console.error('POST /api/projects:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
