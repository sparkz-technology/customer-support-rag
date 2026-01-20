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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a webhook notification with retry logic using exponential backoff.
 * Retries up to 3 times with delays of 1s, 2s, 4s.
 * Logs failure after all retries are exhausted.
 * 
 * @param {string} eventName - The event name to send
 * @param {object} data - The data payload to send
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<boolean>} - Returns true if successful, false if all retries failed
 * 
 * Requirements: 6.1, 6.2
 */
export const notifyWithRetry = async (eventName, data, maxRetries = 3) => {
  if (!CONFIG.WEBHOOK_URL) return true; // no-op if not configured
  
  const payload = { event: eventName, ...data };
  const baseDelay = 1000; // 1 second base delay
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await postJson(CONFIG.WEBHOOK_URL, payload);
      return true;
    } catch (err) {
      const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      
      if (attempt < maxRetries) {
        console.warn(
          `Webhook attempt ${attempt}/${maxRetries} failed for event "${eventName}": ${err.message}. Retrying in ${delay}ms...`
        );
        await sleep(delay);
      } else {
        // All retries exhausted - log failure for admin review
        console.error(
          `Webhook failed after ${maxRetries} attempts for event "${eventName}": ${err.message}. ` +
          `Payload: ${JSON.stringify(payload)}`
        );
        return false;
      }
    }
  }
  
  return false;
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
