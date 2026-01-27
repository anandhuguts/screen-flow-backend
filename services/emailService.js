import nodemailer from 'nodemailer';

// Helper to get Transporter safely
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error("⚠️ SMTP Credentials missing in .env. Email to " + to + " failed.");
    return null;
  }

  try {
    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'ScreenFlow'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    
    console.log("✅ Message sent successfully!");
    console.log("📬 Message ID:", info.messageId);
    console.log("📨 Response:", info.response);
    console.log("👤 Sent to:", to);
    
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    throw error;
  }
};

export const sendInvitationEmail = async (to, businessName, inviteLink, role) => {
  const subject = `Invitation to join ${businessName} on ScreenFlow`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You've been invited!</h2>
      <p>Hello,</p>
      <p>You have been invited to join <strong>${businessName}</strong> as a <strong>${role}</strong>.</p>
      <p>To get started, please click the button below to set up your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteLink}</p>
      <p>This link will expire in 7 days.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px;">If you didn't expect this invitation, you can ignore this email.</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};
