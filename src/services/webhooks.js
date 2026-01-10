import { CONFIG } from "../config/index.js";

const postJson = async (url, payload) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook POST failed (${res.status}): ${text}`);
  }
};

export const notifyTicketEvent = async (eventName, ticket) => {
  if (!CONFIG.WEBHOOK_URL) return; // no-op if not configured
  const payload = { event: eventName, ticket };
  try {
    await postJson(CONFIG.WEBHOOK_URL, payload);
  } catch (err) {
    console.error("Webhook error:", err.message);
  }
};
