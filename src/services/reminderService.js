import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/dates';

const STORAGE_SETTINGS_KEY = 'if_reminder_settings';
const STORAGE_LOGS_KEY = 'if_reminder_logs';

export const DEFAULT_REMINDER_SETTINGS = {
  next_meeting_date: getNextMeetingDefaultDate(),
  next_meeting_time: '17:00',
  venue: 'Main Fellowship Hall, ISBAT University',
  topic: 'Weekly Fellowship & Praise',
  message_template:
    'Hello {{name}}! 👋 You are warmly invited to our upcoming ISBAT Fellowship meeting on *{{meeting_date}}* at *{{meeting_time}}* in *{{venue}}*.\n\nTheme: *{{topic}}*.\n\nWe look forward to seeing you there! God bless you! 🙏✨',
  auto_send_enabled: true,
  auto_send_day_of_week: 5, // Friday
  auto_send_time: '10:00',
  target_cohort: 'inactive', // 'all', 'inactive', 'active'
  whatsapp_phone_number_id: '',
  whatsapp_access_token: '',
};

function getNextMeetingDefaultDate() {
  const d = new Date();
  // Find next Friday or Sunday
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Load reminder settings from Supabase, falling back to LocalStorage or default values.
 */
export async function getReminderSettings() {
  try {
    const { data, error } = await supabase
      .from('reminder_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[reminderService] Could not fetch settings from Supabase:', error.message);
      return getStoredLocalSettings();
    }

    if (data) {
      const merged = { ...DEFAULT_REMINDER_SETTINGS, ...data };
      saveStoredLocalSettings(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[reminderService] Falling back to local settings:', err);
  }

  return getStoredLocalSettings();
}

/**
 * Save updated reminder settings to Supabase and LocalStorage.
 */
export async function updateReminderSettings(settings) {
  const payload = {
    ...settings,
    updated_at: new Date().toISOString(),
  };

  saveStoredLocalSettings(payload);

  try {
    // Check if a row already exists
    const { data: existing } = await supabase
      .from('reminder_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('reminder_settings')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('reminder_settings')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.warn('[reminderService] Failed to persist settings to Supabase, saved locally:', err.message);
    return payload;
  }
}

/**
 * Retrieve members with attendance stats and cohort tags.
 * Cohort options: 'all', 'inactive', 'active'
 */
export async function getAudienceRecipients(cohort = 'inactive', inactiveDays = 14) {
  // 1. Fetch all members
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (membersError) throw membersError;
  if (!members || members.length === 0) return [];

  // 2. Fetch all attendance records to calculate recency and streak
  const { data: attendanceList, error: attError } = await supabase
    .from('attendance')
    .select('member_id, attendance_date')
    .order('attendance_date', { ascending: false });

  if (attError) {
    console.warn('[reminderService] Failed to load attendance recency:', attError.message);
  }

  const attendanceMap = new Map();
  (attendanceList || []).forEach((record) => {
    const list = attendanceMap.get(record.member_id) || [];
    list.push(record.attendance_date);
    attendanceMap.set(record.member_id, list);
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
  const cutoffISO = cutoffDate.toISOString().split('T')[0];

  // Enrich members
  const enrichedMembers = members.map((m) => {
    const dates = attendanceMap.get(m.id) || [];
    const lastAttended = dates.length > 0 ? dates[0] : null;
    const totalAttendances = dates.length;

    const isInactive = !lastAttended || lastAttended < cutoffISO;

    return {
      ...m,
      lastAttended,
      totalAttendances,
      isInactive,
      cohort: isInactive ? 'inactive' : 'active',
      statusLabel: !lastAttended
        ? 'Never attended'
        : isInactive
        ? `Last attended: ${formatDate(lastAttended)}`
        : `Active (${formatDate(lastAttended)})`,
    };
  });

  // Filter based on cohort
  if (cohort === 'inactive') {
    return enrichedMembers.filter((m) => m.isInactive);
  }
  if (cohort === 'active') {
    return enrichedMembers.filter((m) => !m.isInactive);
  }

  return enrichedMembers;
}

/**
 * Log broadcast delivery attempts to Supabase and LocalStorage.
 */
export async function logReminderBroadcast(records = []) {
  if (!records || records.length === 0) return;

  // Save to LocalStorage cache
  const localLogs = getStoredLocalLogs();
  const updatedLogs = [...records, ...localLogs].slice(0, 200);
  saveStoredLocalLogs(updatedLogs);

  try {
    const { error } = await supabase.from('reminder_logs').insert(
      records.map((r) => ({
        member_id: r.member_id || null,
        recipient_name: r.recipient_name,
        phone: r.phone,
        meeting_date: r.meeting_date || new Date().toISOString().split('T')[0],
        message_content: r.message_content,
        channel: r.channel || 'whatsapp_cloud_api',
        status: r.status || 'sent',
        error_message: r.error_message || null,
        sent_at: r.sent_at || new Date().toISOString(),
      }))
    );

    if (error) {
      console.warn('[reminderService] Could not write logs to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('[reminderService] Failed to log reminders to Supabase:', err);
  }
}

/**
 * Fetch past broadcast logs
 */
export async function getReminderLogs(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('reminder_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[reminderService] Error fetching logs from Supabase:', error.message);
      return getStoredLocalLogs().slice(0, limit);
    }

    if (data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[reminderService] Using local logs:', err);
  }

  return getStoredLocalLogs().slice(0, limit);
}

// LocalStorage helpers
function getStoredLocalSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_REMINDER_SETTINGS;
}

function saveStoredLocalSettings(settings) {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

function getStoredLocalLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

function saveStoredLocalLogs(logs) {
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error(e);
  }
}
