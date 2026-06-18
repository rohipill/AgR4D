const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function atFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers: getHeaders() });
  const body = await res.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { error: { message: body } }; }
  if (!res.ok) {
    const msg = data?.error?.message || `Airtable error ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return data;
}

async function getRecord(table, id) {
  return atFetch(`/${encodeURIComponent(table)}/${encodeURIComponent(id)}`);
}

async function getRecords(table, formula, fields) {
  const params = new URLSearchParams();
  if (formula) params.set('filterByFormula', formula);
  if (fields) fields.forEach(f => params.append('fields[]', f));
  const qs = params.toString();
  return atFetch(`/${encodeURIComponent(table)}${qs ? '?' + qs : ''}`);
}

async function createRecord(table, fields) {
  return atFetch(`/${encodeURIComponent(table)}`, {
    method: 'POST',
    body: JSON.stringify({ fields })
  });
}

async function createRecords(table, fieldsArray) {
  return atFetch(`/${encodeURIComponent(table)}`, {
    method: 'POST',
    body: JSON.stringify({ records: fieldsArray.map(fields => ({ fields })) })
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = { getRecord, getRecords, createRecord, createRecords, setCors };
