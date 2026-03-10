const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO;

function hasEmailConfig() {
  return Boolean(RESEND_API_KEY && EMAIL_FROM);
}

async function sendEmail({ to, subject, html }) {
  if (!hasEmailConfig() || !to) {
    return;
  }

  const payload = {
    from: EMAIL_FROM,
    to: [to],
    subject,
    html,
  };

  if (EMAIL_REPLY_TO) {
    payload.reply_to = EMAIL_REPLY_TO;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Email send failed with ${response.status}`);
  }
}

function buildReadyEmail({ customerName, orderId, itemType, dueDate }) {
  return {
    subject: `Your ${itemType} is ready for pickup`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
        <h2 style="margin-bottom: 12px;">Your item is ready</h2>
        <p>Hello ${customerName},</p>
        <p>Your order <strong>${orderId}</strong> for <strong>${itemType}</strong> is now ready for pickup.</p>
        <p>Due date: ${dueDate}</p>
        <p>Please contact the shop if you need delivery or a pickup schedule.</p>
      </div>
    `,
  };
}

function buildDeliveredEmail({ customerName, orderId, itemType }) {
  return {
    subject: `Your ${itemType} has been marked as delivered`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
        <h2 style="margin-bottom: 12px;">Order delivered</h2>
        <p>Hello ${customerName},</p>
        <p>Your order <strong>${orderId}</strong> for <strong>${itemType}</strong> has been marked as delivered.</p>
        <p>If this status is incorrect, please contact the shop immediately.</p>
      </div>
    `,
  };
}

export async function sendStatusNotification({ customer, order, previousStatus }) {
  if (!customer?.email || order.status === previousStatus) {
    return;
  }

  if (order.status === 'Ready') {
    const email = buildReadyEmail({
      customerName: customer.name,
      orderId: order.id,
      itemType: order.item_type,
      dueDate: order.due_date,
    });
    await sendEmail({ to: customer.email, ...email });
    return;
  }

  if (order.status === 'Delivered') {
    const email = buildDeliveredEmail({
      customerName: customer.name,
      orderId: order.id,
      itemType: order.item_type,
    });
    await sendEmail({ to: customer.email, ...email });
  }
}

