const { getRecord, getRecords, setCors } = require('../_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  try {
    const [project, partnersResult] = await Promise.all([
      getRecord('Projects', id),
      getRecords('Partners', `{project_id}="${id}"`,
        ['organisation_name', 'email', 'token'])
    ]);

    const partners = partnersResult.records.map(r => ({
      partner_id: r.id,
      organisation_name: r.fields.organisation_name || '',
      email: r.fields.email || '',
      token: r.fields.token || ''
    }));

    res.status(200).json({
      project_id: id,
      title: project.fields.title || '',
      start_date: project.fields.start_date || '',
      end_date: project.fields.end_date || '',
      funder: project.fields.funder || '',
      budget_usd: project.fields.budget_usd != null ? String(project.fields.budget_usd) : '',
      partners
    });
  } catch (err) {
    console.error('GET /api/projects/:id:', err);
    res.status(err.status === 404 ? 404 : 500).json({ error: err.message });
  }
};
