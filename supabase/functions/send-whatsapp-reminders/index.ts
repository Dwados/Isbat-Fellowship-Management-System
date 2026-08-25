// Supabase Edge Function: Automated WhatsApp Meeting Reminders
// Can be triggered on a schedule via pg_cron or invoked via HTTP POST

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch current reminder settings
    const { data: settings, error: settingsError } = await supabase
      .from('reminder_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsError || !settings) {
      throw new Error(`Failed to load reminder settings: ${settingsError?.message || 'No settings found'}`);
    }

    // 2. Check if auto-send is enabled
    if (!settings.auto_send_enabled) {
      return new Response(
        JSON.stringify({
          status: 'skipped',
          message: 'Automated WhatsApp reminders are currently disabled/paused in Admin settings.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      next_meeting_date,
      next_meeting_time,
      venue,
      topic,
      message_template,
      target_cohort,
      whatsapp_phone_number_id,
      whatsapp_access_token,
    } = settings;

    const phoneNumberId = whatsapp_phone_number_id || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = whatsapp_access_token || Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      throw new Error('Meta WhatsApp Cloud API credentials are not configured.');
    }

    // 3. Fetch recipient members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, phone');

    if (membersError) throw membersError;

    // Filter recipients based on cohort
    let recipients = members || [];
    if (target_cohort === 'inactive') {
      const { data: attendance } = await supabase
        .from('attendance')
        .select('member_id, attendance_date')
        .order('attendance_date', { ascending: false });

      const recentCutoff = new Date();
      recentCutoff.setDate(recentCutoff.getDate() - 14);
      const cutoffISO = recentCutoff.toISOString().split('T')[0];

      const activeMemberIds = new Set(
        (attendance || [])
          .filter((a) => a.attendance_date >= cutoffISO)
          .map((a) => a.member_id)
      );

      recipients = recipients.filter((m) => !activeMemberIds.has(m.id));
    }

    // 4. Send messages in batch
    let sentCount = 0;
    let failedCount = 0;
    const logs = [];

    for (const member of recipients) {
      // Interpolate template
      let text = message_template
        .replace(/\{\{\s*name\s*\}\}/gi, member.name)
        .replace(/\{\{\s*meeting_date\s*\}\}/gi, next_meeting_date)
        .replace(/\{\{\s*meeting_time\s*\}\}/gi, next_meeting_time)
        .replace(/\{\{\s*venue\s*\}\}/gi, venue)
        .replace(/\{\{\s*topic\s*\}\}/gi, topic || 'Fellowship')
        .replace(/\{\{\s*theme\s*\}\}/gi, topic || 'Fellowship');

      // Normalize phone
      let cleanPhone = member.phone.replace(/[\s\-().+]/g, '');
      if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
        cleanPhone = '256' + cleanPhone.slice(1);
      }

      const logEntry = {
        member_id: member.id,
        recipient_name: member.name,
        phone: member.phone,
        meeting_date: next_meeting_date,
        message_content: text,
        channel: 'whatsapp_cloud_api',
        sent_at: new Date().toISOString(),
      };

      try {
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body: text },
          }),
        });

        if (!metaRes.ok) {
          const errData = await metaRes.json();
          throw new Error(errData?.error?.message || 'Meta API error');
        }

        logEntry.status = 'sent';
        sentCount++;
      } catch (err) {
        logEntry.status = 'failed';
        logEntry.error_message = err.message;
        failedCount++;
      }

      logs.push(logEntry);
      // Small delay between calls
      await new Promise((r) => setTimeout(r, 200));
    }

    // 5. Write delivery logs
    if (logs.length > 0) {
      await supabase.from('reminder_logs').insert(logs);
    }

    return new Response(
      JSON.stringify({
        status: 'completed',
        total: recipients.length,
        sent: sentCount,
        failed: failedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: 'error', error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
