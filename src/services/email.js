import nodemailer from "nodemailer";
import { CONFIG } from "../config/index.js";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    if (!CONFIG.SMTP_HOST || !CONFIG.SMTP_USER || !CONFIG.SMTP_PASS) {
      throw new Error(
        "SMTP configuration missing. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
      );
    }
    transporter = nodemailer.createTransport({
      host: CONFIG.SMTP_HOST,
      port: CONFIG.SMTP_PORT,
      secure: CONFIG.SMTP_PORT === 465,
      auth: { user: CONFIG.SMTP_USER, pass: CONFIG.SMTP_PASS },
    });
  }
  return transporter;
};

export const sendOTPEmail = async (email, otp) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: `"Auto-Triager" <${CONFIG.SMTP_USER}>`,
      to: email,
      subject: "Verification Code",
      text: `Your verification code is: ${otp}. Valid for 10 minutes.`,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
    throw new Error("Failed to send verification email");
  }
};
