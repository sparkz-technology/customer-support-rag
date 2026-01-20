import nodemailer from "nodemailer";
import { CONFIG } from "../../config/index.js";

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
      from: `"Support System" <${CONFIG.SMTP_USER}>`,
      to: email,
      subject: "Verification Code",
      text: `Your verification code is: ${otp}. Valid for 10 minutes.`,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
    throw new Error("Failed to send verification email");
  }
};

// Send ticket created notification
export const sendTicketCreatedEmail = async (email, ticket) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: `"Support System" <${CONFIG.SMTP_USER}>`,
      to: email,
      subject: `Ticket #${ticket._id.toString().slice(-6)} Created - ${ticket.subject}`,
      html: `
        <h2>Your support ticket has been created</h2>
        <p><strong>Ticket ID:</strong> ${ticket._id}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Category:</strong> ${ticket.category}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Description:</strong></p>
        <p>${ticket.description}</p>
        <hr>
        <p>We'll get back to you as soon as possible. Expected response time based on priority: 
        ${getPriorityResponseTime(ticket.priority)}</p>
      `,
    });
    console.log(`📧 Ticket created email sent to ${email}`);
  } catch (err) {
    console.error("Ticket created email failed:", err.message);
  }
};

// Send ticket updated notification
export const sendTicketUpdatedEmail = async (email, ticket, updateType) => {
  try {
    const mailer = getTransporter();
    const subjects = {
      assigned: `Ticket #${ticket._id.toString().slice(-6)} - Agent Assigned`,
      status: `Ticket #${ticket._id.toString().slice(-6)} - Status Updated to ${ticket.status}`,
      reply: `Ticket #${ticket._id.toString().slice(-6)} - New Reply`,
      resolved: `Ticket #${ticket._id.toString().slice(-6)} - Resolved`,
    };

    await mailer.sendMail({
      from: `"Support System" <${CONFIG.SMTP_USER}>`,
      to: email,
      subject: subjects[updateType] || `Ticket #${ticket._id.toString().slice(-6)} Updated`,
      html: `
        <h2>Ticket Update</h2>
        <p><strong>Ticket ID:</strong> ${ticket._id}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        ${ticket.assignedTo ? `<p><strong>Assigned Agent:</strong> ${ticket.assignedTo.name || 'Support Team'}</p>` : ''}
        ${getLatestMessage(ticket)}
        <hr>
        <p>Reply to this ticket by logging into your account.</p>
      `,
    });
    console.log(`📧 Ticket ${updateType} email sent to ${email}`);
  } catch (err) {
    console.error(`Ticket ${updateType} email failed:`, err.message);
  }
};

// Send SLA breach alert
export const sendSLABreachAlert = async (ticket, agentEmail) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: `"Support System" <${CONFIG.SMTP_USER}>`,
      to: agentEmail,
      subject: `⚠️ SLA BREACH - Ticket #${ticket._id.toString().slice(-6)}`,
      html: `
        <h2 style="color: red;">⚠️ SLA Breach Alert</h2>
        <p><strong>Ticket ID:</strong> ${ticket._id}</p>
        <p><strong>Customer:</strong> ${ticket.customerEmail}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>SLA Due:</strong> ${ticket.slaDueAt}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <hr>
        <p style="color: red;"><strong>This ticket has breached its SLA. Please respond immediately.</strong></p>
      `,
    });
    console.log(`🚨 SLA breach alert sent for ticket ${ticket._id}`);
  } catch (err) {
    console.error("SLA breach email failed:", err.message);
  }
};

// Send SLA breach notification to customer
export const sendSlaBreachEmail = async (email, ticket) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: `"Support System" <${CONFIG.SMTP_USER}>`,
      to: email,
      subject: `Ticket #${ticket._id.toString().slice(-6)} - We apologize for the delay`,
      html: `
        <h2>We apologize for the delay</h2>
        <p>Your support ticket has exceeded our expected response time.</p>
        <p><strong>Ticket ID:</strong> ${ticket._id}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <hr>
        <p>We are prioritizing your request and will respond as soon as possible. 
        We sincerely apologize for any inconvenience caused.</p>
      `,
    });
    console.log(`📧 SLA breach apology sent to ${email}`);
  } catch (err) {
    console.error("SLA breach customer email failed:", err.message);
  }
};

// Helper functions
function getPriorityResponseTime(priority) {
  const times = {
    urgent: "8 hours",
    high: "24 hours",
    medium: "48 hours",
    low: "72 hours",
  };
  return times[priority] || "48 hours";
}

function getLatestMessage(ticket) {
  if (!ticket.conversation || ticket.conversation.length === 0) return "";
  const latest = ticket.conversation[ticket.conversation.length - 1];
  return `
    <p><strong>Latest Message (${latest.role}):</strong></p>
    <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">
      ${latest.content}
    </blockquote>
  `;
}
