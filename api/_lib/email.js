import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true';

let transporter = null;

function hasEmailConfig() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

export function getEmailConfigError() {
  if (!SMTP_HOST) return 'Missing SMTP_HOST';
  if (!SMTP_PORT) return 'Missing SMTP_PORT';
  if (!SMTP_USER) return 'Missing SMTP_USER';
  if (!SMTP_PASS) return 'Missing SMTP_PASS';
  if (!SMTP_FROM) return 'Missing SMTP_FROM';
  return null;
}

export async function sendEmail({ to, subject, html }) {
  const configError = getEmailConfigError();
  if (configError) {
    throw new Error(configError);
  }

  if (!to) {
    throw new Error('Missing recipient email address');
  }

  await getTransporter().sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });
}

function buildReadyEmail({ customerName, orderId, itemType }) {
  return {
    subject: 'Your item is now ready for pickup',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #183153; border-radius: 8px; color: #ffffff;">
        <h1 style="color: #ffd166; text-align: center; margin-bottom: 20px;">Tailor Order Tracking</h1>
        <h2 style="text-align: center; margin-bottom: 16px; color: #8be9fd;">Item Ready for Pickup</h2>
        <div style="background: #0f1f36; border: 1px solid #8be9fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;">Hello ${customerName},</p>
          <p style="margin: 0 0 10px 0;">Your item is now ready for pickup.</p>
          <p style="margin: 0; color: #ffd166; font-weight: 700;">Order Number: ${orderId}</p>
          <p style="margin: 10px 0 0 0; color: #d9e6f2;">Item: ${itemType}</p>
        </div>
      </div>
    `,
  };
}

function buildDeliveredEmail({ customerName, orderId, itemType }) {
  return {
    subject: 'Your item is on delivery today',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #183153; border-radius: 8px; color: #ffffff;">
        <h1 style="color: #ffd166; text-align: center; margin-bottom: 20px;">Tailor Order Tracking</h1>
        <h2 style="text-align: center; margin-bottom: 16px; color: #8be9fd;">Delivery Update</h2>
        <div style="background: #0f1f36; border: 1px solid #8be9fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;">Hello ${customerName},</p>
          <p style="margin: 0 0 10px 0;">Your item is on delivery and will be delivered today.</p>
          <p style="margin: 0; color: #ffd166; font-weight: 700;">Order Number: ${orderId}</p>
          <p style="margin: 10px 0 0 0; color: #d9e6f2;">Item: ${itemType}</p>
        </div>
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
