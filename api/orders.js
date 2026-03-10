import { createId, supabaseRequest } from './_lib/supabase.js';
import { sendStatusNotification } from './_lib/email.js';

const allowedStatuses = new Set(['Pending', 'In Progress', 'Ready', 'Delivered']);

function sendJson(res, status, body) {
  res.status(status).json(body);
}

function buildOrderPayload(body) {
  return {
    customer_id: String(body?.customerId || '').trim(),
    item_type: String(body?.itemType || '').trim(),
    due_date: String(body?.dueDate || '').trim(),
    status: String(body?.status || 'Pending').trim(),
    total_price: Number(body?.totalPrice),
    notes: String(body?.notes || '').trim(),
  };
}

function normalizeOrder(order) {
  return {
    id: order.id,
    customerId: order.customer_id,
    itemType: order.item_type,
    dueDate: order.due_date,
    status: order.status,
    totalPrice: Number(order.total_price),
    notes: order.notes || '',
    readyNotifiedAt: order.ready_notified_at || null,
    deliveredNotifiedAt: order.delivered_notified_at || null,
  };
}

async function getCustomerById(customerId) {
  const customers = await supabaseRequest(
    `/rest/v1/customers?id=eq.${encodeURIComponent(customerId)}&select=id,name,email`
  );
  return customers[0] || null;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const orders = await supabaseRequest('/rest/v1/orders?select=*&order=created_at.desc');
      return sendJson(res, 200, orders.map(normalizeOrder));
    }

    if (req.method === 'POST') {
      const payload = {
        id: createId('ORD'),
        ...buildOrderPayload(req.body),
      };

      if (
        !payload.customer_id ||
        !payload.item_type ||
        !payload.due_date ||
        !allowedStatuses.has(payload.status) ||
        Number.isNaN(payload.total_price) ||
        payload.total_price <= 0
      ) {
        return sendJson(res, 400, { error: 'Invalid order payload.' });
      }

      const [created] = await supabaseRequest('/rest/v1/orders', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });

      return sendJson(res, 201, normalizeOrder(created));
    }

    if (req.method === 'PATCH') {
      const id = String(req.query?.id || '');
      if (!id) {
        return sendJson(res, 400, { error: 'Order id is required.' });
      }

      const existingOrders = await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=*`);
      const existingOrder = existingOrders[0];
      if (!existingOrder) {
        return sendJson(res, 404, { error: 'Order not found.' });
      }

      const payload = buildOrderPayload(req.body);
      if (
        !payload.customer_id ||
        !payload.item_type ||
        !payload.due_date ||
        !allowedStatuses.has(payload.status) ||
        Number.isNaN(payload.total_price) ||
        payload.total_price <= 0
      ) {
        return sendJson(res, 400, { error: 'Invalid order payload.' });
      }

      const notificationFields = {};
      const shouldSendReadyNotification =
        payload.status === 'Ready' && existingOrder.status !== 'Ready' && !existingOrder.ready_notified_at;
      const shouldSendDeliveredNotification =
        payload.status === 'Delivered' &&
        existingOrder.status !== 'Delivered' &&
        !existingOrder.delivered_notified_at;

      if (shouldSendReadyNotification) {
        notificationFields.ready_notified_at = new Date().toISOString();
      }

      if (shouldSendDeliveredNotification) {
        notificationFields.delivered_notified_at = new Date().toISOString();
      }

      const [updated] = await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ ...payload, ...notificationFields }),
      });

      if (shouldSendReadyNotification || shouldSendDeliveredNotification) {
        try {
          const customer = await getCustomerById(updated.customer_id);
          await sendStatusNotification({
            customer,
            order: updated,
            previousStatus: existingOrder.status,
          });
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
        }
      }

      return sendJson(res, 200, normalizeOrder(updated));
    }

    if (req.method === 'DELETE') {
      const id = String(req.query?.id || '');
      if (!id) {
        return sendJson(res, 400, { error: 'Order id is required.' });
      }

      await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      return sendJson(res, 204, null);
    }

    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
}
