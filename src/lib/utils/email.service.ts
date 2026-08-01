import nodemailer from "nodemailer";
import { env } from "../config/env";
import { ETHEREAL } from "../config/constants";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal test transport for development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: ETHEREAL.HOST,
        port: ETHEREAL.PORT,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("✉️ Ethereal Email test account created:", testAccount.user);
    } catch {
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

export async function sendEmailViaMailerSend({
  to,
  toName,
  subject,
  html,
}: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}) {
  const apiKey = env.MAILERSEND_API_KEY;
  if (!apiKey) {
    throw new Error("MAILERSEND_API_KEY is not set");
  }

  let senderEmail = env.MAILERSEND_SENDER_EMAIL || env.SMTP_FROM.replace(/.*<([^>]+)>.*/, "$1");
  if (senderEmail && !senderEmail.includes("@")) {
    senderEmail = `MS_EMAIL@${senderEmail}`;
  }

  const senderName = env.MAILERSEND_SENDER_NAME || "Tambola";

  const res = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: {
        email: senderEmail,
        name: senderName,
      },
      to: [
        {
          email: to,
          name: toName || to,
        },
      ],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("MailerSend API error response:", res.status, errorText);
    throw new Error(`MailerSend API error ${res.status}: ${errorText}`);
  }

  console.log(`✉️ Email sent via MailerSend to ${to}`);
  return res;
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  displayName: string
) {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  const subject = "Verify your email address - Tambola";
  const html = `
    <h2>Hello ${displayName},</h2>
    <p>Thank you for registering on Tambola!</p>
    <p>Please click the button below to verify your email address:</p>
    <p><a href="${verifyUrl}" style="padding:10px 20px; background:#4F46E5; color:#fff; text-decoration:none; border-radius:5px;">Verify Email</a></p>
    <p>Or copy this link into your browser: <br>${verifyUrl}</p>
    <p>This link expires in 24 hours.</p>
  `;

  if (env.MAILERSEND_API_KEY) {
    try {
      return await sendEmailViaMailerSend({ to, toName: displayName, subject, html });
    } catch (err: any) {
      console.warn("⚠️ MailerSend API failed, falling back to Nodemailer/Ethereal:", err.message);
    }
  }

  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });

  if (nodemailer.getTestMessageUrl(info)) {
    console.log("✉️ Verification email preview:", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  displayName: string
) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const subject = "Reset your password - Tambola";
  const html = `
    <h2>Hello ${displayName},</h2>
    <p>You requested to reset your Tambola account password.</p>
    <p>Please click the button below to set a new password:</p>
    <p><a href="${resetUrl}" style="padding:10px 20px; background:#4F46E5; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a></p>
    <p>Or copy this link into your browser: <br>${resetUrl}</p>
    <p>This link expires in 1 hour.</p>
  `;

  if (env.MAILERSEND_API_KEY) {
    try {
      return await sendEmailViaMailerSend({ to, toName: displayName, subject, html });
    } catch (err: any) {
      console.warn("⚠️ MailerSend API failed, falling back to Nodemailer/Ethereal:", err.message);
    }
  }

  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });

  if (nodemailer.getTestMessageUrl(info)) {
    console.log("✉️ Password reset email preview:", nodemailer.getTestMessageUrl(info));
  }
}
