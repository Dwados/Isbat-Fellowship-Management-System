import { normalizePhone } from '../utils/phone.js';

/**
 * Format a phone number into an international WhatsApp-compatible number without '+' or special symbols.
 * Defaults to Uganda (+256) if a local number starting with 0 is provided.
 */
export function formatWhatsAppPhone(phone = '', defaultCountryCode = '256') {
  let clean = normalizePhone(phone);
  if (!clean) return '';

  // Remove leading plus if present
  if (clean.startsWith('+')) {
    clean = clean.slice(1);
  }

  // If Uganda local number like 07..., replace leading 0 with 256
  if (clean.startsWith('0') && clean.length === 10) {
    clean = defaultCountryCode + clean.slice(1);
  }

  return clean;
}

/**
 * Replace placeholders like {{name}}, {{meeting_date}}, {{meeting_time}}, {{venue}}, {{topic}} in a message template.
 */
export function interpolateTemplate(template = '', variables = {}) {
  if (!template) return '';

  let result = template;
  const map = {
    name: variables.name || 'Friend',
    first_name: (variables.name || 'Friend').split(' ')[0],
    meeting_date: variables.meeting_date || 'Upcoming Meeting',
    meeting_time: variables.meeting_time || '5:00 PM',
    venue: variables.venue || 'Main Fellowship Hall',
    topic: variables.topic || variables.theme || 'Youth Fellowship',
    theme: variables.theme || variables.topic || 'Youth Fellowship',
  };

  for (const [key, value] of Object.entries(map)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Build a standard wa.me direct link that opens WhatsApp Web / Mobile app with a pre-filled personalized message.
 */
export function buildWhatsAppWebUrl(phone, message) {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Send a WhatsApp text message using Meta WhatsApp Cloud API (Graph API).
 */
export async function sendMetaWhatsAppMessage({
  to,
  message,
  phoneNumberId,
  accessToken,
}) {
  const cleanPhone = formatWhatsAppPhone(to);
  if (!cleanPhone) {
    throw new Error('Invalid or empty phone number.');
  }

  if (!phoneNumberId || !accessToken) {
    throw new Error('Meta WhatsApp Cloud API credentials (Phone Number ID or Access Token) are missing.');
  }

  const endpoint = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: message,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();

  if (!response.ok) {
    const errorMsg = responseData?.error?.message || `Meta API Error (${response.status})`;
    const errorDetail = responseData?.error?.error_user_msg || responseData?.error?.error_data?.details || '';
    throw new Error(`${errorMsg} ${errorDetail ? `(${errorDetail})` : ''}`);
  }

  return responseData;
}

/**
 * Test the Meta WhatsApp Cloud API connection by sending a sample ping message.
 */
export async function testWhatsAppConnection({ phoneNumberId, accessToken, testPhone }) {
  const message = '🔔 *ISBAT Fellowship Management*: Meta WhatsApp Cloud API is successfully configured and connected!';
  return await sendMetaWhatsAppMessage({
    to: testPhone,
    message,
    phoneNumberId,
    accessToken,
  });
}

/**
 * Dispatches WhatsApp broadcast messages to a list of recipients.
 * Supports batching, delays, progress callbacks, and error tracking.
 */
export async function batchSendMetaWhatsApp({
  recipients = [],
  template,
  meetingDetails = {},
  phoneNumberId,
  accessToken,
  onProgress,
  delayMs = 300,
}) {
  const results = {
    total: recipients.length,
    successful: 0,
    failed: 0,
    logs: [],
  };

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const personalizedMessage = interpolateTemplate(template, {
      name: recipient.name,
      ...meetingDetails,
    });

    const logEntry = {
      member_id: recipient.id || null,
      recipient_name: recipient.name,
      phone: recipient.phone,
      meeting_date: meetingDetails.meeting_date,
      message_content: personalizedMessage,
      channel: 'whatsapp_cloud_api',
      sent_at: new Date().toISOString(),
    };

    try {
      await sendMetaWhatsAppMessage({
        to: recipient.phone,
        message: personalizedMessage,
        phoneNumberId,
        accessToken,
      });

      logEntry.status = 'sent';
      results.successful += 1;
    } catch (err) {
      logEntry.status = 'failed';
      logEntry.error_message = err.message || 'Unknown sending error';
      results.failed += 1;
    }

    results.logs.push(logEntry);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: recipients.length,
        successful: results.successful,
        failed: results.failed,
        currentRecipient: recipient,
        lastLog: logEntry,
      });
    }

    // Small delay between requests to respect rate limits
    if (i < recipients.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
