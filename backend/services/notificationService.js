/**
 * CampX Assist – Notification Service
 * Reuses existing nodemailer/Gmail transporter from server.js context.
 * Called for urgent/sensitive tickets to alert grievance cell.
 */

const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Send grievance alert email when a sensitive/urgent ticket is created.
 */
async function sendGrievanceAlert({ trackingId, category, urgency, description, studentName, isConfidential, slaDeadline }) {
  const grievanceEmail = process.env.GRIEVANCE_EMAIL;
  if (!grievanceEmail) {
    console.warn('[Notify] GRIEVANCE_EMAIL not set – skipping email notification');
    return false;
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[Notify] Gmail credentials not set – skipping email notification');
    return false;
  }

  const displayName = isConfidential ? '[CONFIDENTIAL – identity restricted]' : (studentName || 'Student');
  const slaDue = slaDeadline ? new Date(slaDeadline).toLocaleString('en-IN') : 'N/A';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',sans-serif;">
      <table width="100%" style="background:#0a0a0a;padding:30px 20px;">
        <tr><td align="center">
          <table width="100%" style="max-width:520px;background:#151515;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#ff4444,#cc0000);padding:24px 32px;">
                <div style="font-size:22px;font-weight:800;color:#fff;">🚨 CampX Assist – Urgent Alert</div>
                <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px;">Immediate attention required</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <table width="100%" style="border-collapse:collapse;">
                  <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;font-size:13px;width:140px;">Ticket ID</td><td style="padding:8px 0;border-bottom:1px solid #222;color:#fff;font-weight:600;">${trackingId}</td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;font-size:13px;">Urgency</td><td style="padding:8px 0;border-bottom:1px solid #222;color:#ff6b6b;font-weight:700;">${urgency}</td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;font-size:13px;">Category</td><td style="padding:8px 0;border-bottom:1px solid #222;color:#fff;">${category}</td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;font-size:13px;">Student</td><td style="padding:8px 0;border-bottom:1px solid #222;color:#fff;">${displayName}</td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;font-size:13px;">Confidential</td><td style="padding:8px 0;border-bottom:1px solid #222;color:${isConfidential ? '#ffd43b' : '#51cf66'};">${isConfidential ? '🔒 YES' : 'No'}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;font-size:13px;">SLA Deadline</td><td style="padding:8px 0;color:#ff922b;font-weight:600;">${slaDue}</td></tr>
                </table>
                <div style="margin-top:20px;background:rgba(255,68,68,0.08);border:1px solid rgba(255,68,68,0.2);border-radius:10px;padding:16px;">
                  <div style="color:#888;font-size:12px;margin-bottom:8px;">COMPLAINT DESCRIPTION</div>
                  <div style="color:#e0e0e0;font-size:14px;line-height:1.6;">${description}</div>
                </div>
                <p style="color:#666;font-size:12px;margin-top:20px;">Please log in to the CampX Admin Panel to review and respond to this complaint within the SLA window.</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #222;padding:16px 32px;text-align:center;">
                <p style="color:#444;font-size:12px;margin:0;">© ${new Date().getFullYear()} CampX • Automated Grievance Alert</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"CampX Assist" <${process.env.GMAIL_USER}>`,
      to: grievanceEmail,
      subject: `🚨 [${urgency}] CampX Complaint #${trackingId} – ${category}`,
      html,
    });
    console.log(`✅ Grievance alert sent to ${grievanceEmail} for ticket ${trackingId}`);
    return true;
  } catch (err) {
    console.error('[Notify] Failed to send grievance alert:', err.message);
    return false;
  }
}

/**
 * Send status update email to student when ticket status changes.
 */
async function sendTicketStatusUpdate({ studentEmail, studentName, trackingId, newStatus, category }) {
  if (!studentEmail || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return false;

  const statusColors = { Open: '#4dabf7', 'In Progress': '#ffd43b', Resolved: '#51cf66', Closed: '#888' };
  const color = statusColors[newStatus] || '#fff';

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"CampX Assist" <${process.env.GMAIL_USER}>`,
      to: studentEmail,
      subject: `📋 Your CampX Complaint #${trackingId} – Status: ${newStatus}`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;background:#0a0a0a;padding:30px;color:#e0e0e0;">
          <div style="font-size:24px;font-weight:800;margin-bottom:8px;"><span style="color:#fff">Camp</span><span style="color:#ccff00">X</span> Assist</div>
          <p>Hi ${studentName || 'Student'},</p>
          <p>Your complaint ticket status has been updated:</p>
          <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin:16px 0;border:1px solid #2a2a2a;">
            <p><strong style="color:#888;">Ticket ID:</strong> <span style="color:#ccff00;font-weight:700;">${trackingId}</span></p>
            <p><strong style="color:#888;">Category:</strong> ${category}</p>
            <p><strong style="color:#888;">New Status:</strong> <span style="color:${color};font-weight:700;">${newStatus}</span></p>
          </div>
          <p style="color:#666;font-size:13px;">Log in to CampX to track your complaint or chat with CampX Assist.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Notify] Status update email failed:', err.message);
    return false;
  }
}

module.exports = { sendGrievanceAlert, sendTicketStatusUpdate };
