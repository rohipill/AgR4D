const { createRecords, setCors } = require('./_lib');
const { randomBytes } = require('crypto');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7).trim() : '';
  if (!key) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { project_id, partners } = req.body;
    if (!project_id || !Array.isArray(partners) || !partners.length) {
      return res.status(400).json({ error: 'project_id and partners are required' });
    }

    const partnerData = partners.map(p => ({
      project_id,
      organisation_name: p.org,
      token: randomBytes(16).toString('hex')
    }));

    const created = [];
    for (let i = 0; i < partnerData.length; i += 10) {
      const batch = partnerData.slice(i, i + 10);
      const result = await createRecords('Partners', batch);
      result.records.forEach((rec, j) => {
        created.push({
          partner_id: rec.id,
          organisation_name: batch[j].organisation_name,
          token: batch[j].token
        });
      });
    }

    res.status(200).json({ partners: created });
  } catch (err) {
    console.error('POST /api/partners:', err);
    res.status(500).json({ error: err.message });
  }
};
