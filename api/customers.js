import { createId, supabaseRequest } from './_lib/supabase.js';

function sendJson(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const customers = await supabaseRequest('/rest/v1/customers?select=*&order=created_at.desc');
      return sendJson(res, 200, customers);
    }

    if (req.method === 'POST') {
      const payload = {
        id: createId('CUS'),
        name: String(req.body?.name || '').trim(),
        phone: String(req.body?.phone || '').trim(),
        email: String(req.body?.email || '').trim(),
        address: String(req.body?.address || '').trim(),
      };

      if (!payload.name || !payload.phone || !payload.email || !payload.address) {
        return sendJson(res, 400, { error: 'All customer fields are required.' });
      }

      const [created] = await supabaseRequest('/rest/v1/customers', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });

      return sendJson(res, 201, created);
    }

    if (req.method === 'PATCH') {
      const id = String(req.query?.id || '');
      const payload = {
        name: String(req.body?.name || '').trim(),
        phone: String(req.body?.phone || '').trim(),
        email: String(req.body?.email || '').trim(),
        address: String(req.body?.address || '').trim(),
      };

      if (!id) {
        return sendJson(res, 400, { error: 'Customer id is required.' });
      }

      const [updated] = await supabaseRequest(`/rest/v1/customers?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });

      return sendJson(res, 200, updated);
    }

    if (req.method === 'DELETE') {
      const id = String(req.query?.id || '');
      if (!id) {
        return sendJson(res, 400, { error: 'Customer id is required.' });
      }

      await supabaseRequest(`/rest/v1/customers?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      return sendJson(res, 204, null);
    }

    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
}

