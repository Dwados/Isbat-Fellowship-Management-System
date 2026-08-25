import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Key,
  Loader2,
  MapPin,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Sparkles,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import LoadingBlock from '../components/LoadingBlock';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import {
  getAudienceRecipients,
  getReminderLogs,
  getReminderSettings,
  logReminderBroadcast,
  updateReminderSettings,
} from '../services/reminderService';
import {
  batchSendMetaWhatsApp,
  buildWhatsAppWebUrl,
  formatWhatsAppPhone,
  interpolateTemplate,
  sendMetaWhatsAppMessage,
  testWhatsAppConnection,
} from '../services/whatsappService';
import { formatDate, formatDateShort } from '../utils/dates';
import { friendlyError } from '../utils/errors';

const DYNAMIC_TAGS = [
  { tag: '{{name}}', label: 'Member Name' },
  { tag: '{{first_name}}', label: 'First Name' },
  { tag: '{{meeting_date}}', label: 'Meeting Date' },
  { tag: '{{meeting_time}}', label: 'Meeting Time' },
  { tag: '{{venue}}', label: 'Venue' },
  { tag: '{{topic}}', label: 'Theme / Topic' },
];

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'history' | 'settings'

  // Settings & Form state
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Audience state
  const [cohort, setCohort] = useState('inactive'); // 'inactive' | 'all' | 'active'
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberError, setMemberError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());

  // Message composer state
  const [template, setTemplate] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('17:00');
  const [venue, setVenue] = useState('');
  const [topic, setTopic] = useState('');
  const [autoSendEnabled, setAutoSendEnabled] = useState(true);

  // WhatsApp API Settings Modal
  const [apiPhoneId, setApiPhoneId] = useState('');
  const [apiAccessToken, setApiAccessToken] = useState('');
  const [testingApi, setTestingApi] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Broadcast Modal State
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(null);
  const [broadcastLogs, setBroadcastLogs] = useState([]);
  const [showWebQueueModal, setShowWebQueueModal] = useState(false);
  const [webQueueIndex, setWebQueueIndex] = useState(0);
  const [webQueueDispatched, setWebQueueDispatched] = useState(new Set());

  // History Tab State
  const [pastLogs, setPastLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load initial settings & recipients
  useEffect(() => {
    loadSettings();
    loadAudience();
  }, []);

  async function loadSettings() {
    setLoadingSettings(true);
    try {
      const data = await getReminderSettings();
      setSettings(data);
      setTemplate(data.message_template || '');
      setMeetingDate(data.next_meeting_date || '');
      setMeetingTime(data.next_meeting_time || '17:00');
      setVenue(data.venue || 'Main Fellowship Hall, ISBAT University');
      setTopic(data.topic || 'Weekly Fellowship');
      setAutoSendEnabled(data.auto_send_enabled ?? true);
      setCohort(data.target_cohort || 'inactive');
      setApiPhoneId(data.whatsapp_phone_number_id || '');
      setApiAccessToken(data.whatsapp_access_token || '');
    } catch (err) {
      console.error('Failed to load reminder settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  }

  async function loadAudience() {
    setLoadingMembers(true);
    setMemberError(null);
    try {
      const data = await getAudienceRecipients('all');
      setAllMembers(data);
      // Default selection to current cohort
      const targetIds = new Set(
        data
          .filter((m) => (cohort === 'all' ? true : cohort === 'inactive' ? m.isInactive : !m.isInactive))
          .map((m) => m.id)
      );
      setSelectedMemberIds(targetIds);
    } catch (err) {
      setMemberError(friendlyError(err));
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const data = await getReminderLogs(100);
      setPastLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Update selection when cohort changes
  function handleCohortChange(newCohort) {
    setCohort(newCohort);
    const targetIds = new Set(
      allMembers
        .filter((m) => (newCohort === 'all' ? true : newCohort === 'inactive' ? m.isInactive : !m.isInactive))
        .map((m) => m.id)
    );
    setSelectedMemberIds(targetIds);
  }

  // Save Settings
  async function handleSaveSettings(e) {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setSaveFeedback(null);
    try {
      const updated = {
        ...settings,
        message_template: template,
        next_meeting_date: meetingDate,
        next_meeting_time: meetingTime,
        venue,
        topic,
        auto_send_enabled: autoSendEnabled,
        target_cohort: cohort,
        whatsapp_phone_number_id: apiPhoneId,
        whatsapp_access_token: apiAccessToken,
      };
      await updateReminderSettings(updated);
      setSettings(updated);
      setSaveFeedback({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setSaveFeedback(null), 4000);
    } catch (err) {
      setSaveFeedback({ type: 'error', message: friendlyError(err) });
    } finally {
      setSavingSettings(false);
    }
  }

  // Quick Preset Handlers
  function handleQuickDate(preset) {
    const d = new Date();
    if (preset === 'wednesday') {
      const day = d.getDay();
      const diff = (3 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    } else if (preset === 'friday') {
      const day = d.getDay();
      const diff = (5 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    } else if (preset === 'sunday') {
      const day = d.getDay();
      const diff = (7 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    setMeetingDate(d.toISOString().split('T')[0]);
  }

  // Insert tag into template
  function insertTag(tag) {
    setTemplate((prev) => prev + ' ' + tag);
  }

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      const matchesCohort =
        cohort === 'all' ? true : cohort === 'inactive' ? m.isInactive : !m.isInactive;
      if (!matchesCohort) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.course && m.course.toLowerCase().includes(q))
      );
    });
  }, [allMembers, cohort, searchQuery]);

  // Selected recipients objects
  const selectedRecipients = useMemo(() => {
    return allMembers.filter((m) => selectedMemberIds.has(m.id));
  }, [allMembers, selectedMemberIds]);

  // Cohort Counts
  const cohortCounts = useMemo(() => {
    const total = allMembers.length;
    const inactive = allMembers.filter((m) => m.isInactive).length;
    const active = total - inactive;
    return { total, inactive, active };
  }, [allMembers]);

  // Toggle Member Selection
  function toggleMember(id) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    const visibleIds = filteredMembers.map((m) => m.id);
    const allSelected = visibleIds.every((id) => selectedMemberIds.has(id));

    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }

  // Sample preview text
  const previewSampleMember = selectedRecipients[0] || allMembers[0] || { name: 'Fellowship Member', phone: '0770000000' };
  const previewMessage = interpolateTemplate(template, {
    name: previewSampleMember.name,
    meeting_date: meetingDate ? formatDate(meetingDate) : 'Upcoming Meeting',
    meeting_time: meetingTime || '5:00 PM',
    venue: venue || 'Main Fellowship Hall',
    topic: topic || 'Weekly Fellowship',
  });

  // Test WhatsApp API Connection
  async function handleTestApi() {
    if (!apiPhoneId.trim() || !apiAccessToken.trim()) {
      setTestResult({
        type: 'error',
        message: 'Please enter both Phone Number ID and Access Token.',
      });
      return;
    }
    const phone = testPhone.trim() || previewSampleMember.phone;
    if (!phone) {
      setTestResult({
        type: 'error',
        message: 'Please specify a test phone number with country code.',
      });
      return;
    }

    setTestingApi(true);
    setTestResult(null);
    try {
      await testWhatsAppConnection({
        phoneNumberId: apiPhoneId.trim(),
        accessToken: apiAccessToken.trim(),
        testPhone: phone,
      });
      setTestResult({
        type: 'success',
        message: '✅ Test message successfully delivered to ' + phone + '!',
      });
    } catch (err) {
      setTestResult({
        type: 'error',
        message: '❌ Failed to send: ' + err.message,
      });
    } finally {
      setTestingApi(false);
    }
  }

  // Dispatch via Meta WhatsApp Cloud API
  async function handleStartBroadcast() {
    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient.');
      return;
    }

    if (!apiPhoneId.trim() || !apiAccessToken.trim()) {
      setActiveTab('settings');
      alert('Meta WhatsApp Cloud API credentials are not yet configured. Please configure them in Settings or use the 1-Click WhatsApp Web Launcher.');
      return;
    }

    const confirmSend = window.confirm(
      'Send WhatsApp reminders to ' + selectedRecipients.length + ' member(s) via Meta Cloud API?'
    );
    if (!confirmSend) return;

    setIsBroadcasting(true);
    setBroadcastProgress({
      total: selectedRecipients.length,
      current: 0,
      successful: 0,
      failed: 0,
      percent: 0,
    });
    setBroadcastLogs([]);

    const meetingDetails = {
      meeting_date: meetingDate ? formatDate(meetingDate) : 'Upcoming Meeting',
      meeting_time: meetingTime,
      venue,
      topic,
    };

    try {
      const results = await batchSendMetaWhatsApp({
        recipients: selectedRecipients,
        template,
        meetingDetails,
        phoneNumberId: apiPhoneId.trim(),
        accessToken: apiAccessToken.trim(),
        onProgress: (prog) => {
          setBroadcastProgress({
            total: prog.total,
            current: prog.current,
            successful: prog.successful,
            failed: prog.failed,
            percent: Math.round((prog.current / prog.total) * 100),
          });
          if (prog.lastLog) {
            setBroadcastLogs((prev) => [prog.lastLog, ...prev]);
          }
        },
      });

      await logReminderBroadcast(results.logs);
    } catch (err) {
      alert('Broadcast interrupted: ' + err.message);
    }
  }

  // 1-Click WhatsApp Web Dispatcher
  function handleOpenWebQueue() {
    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient.');
      return;
    }
    setWebQueueIndex(0);
    setWebQueueDispatched(new Set());
    setShowWebQueueModal(true);
  }

  function handleDispatchNextWebMember() {
    const current = selectedRecipients[webQueueIndex];
    if (!current) return;

    const personalized = interpolateTemplate(template, {
      name: current.name,
      meeting_date: meetingDate ? formatDate(meetingDate) : 'Upcoming Meeting',
      meeting_time: meetingTime,
      venue,
      topic,
    });

    const url = buildWhatsAppWebUrl(current.phone, personalized);
    window.open(url, '_blank');

    setWebQueueDispatched((prev) => new Set(prev).add(current.id));

    logReminderBroadcast([
      {
        member_id: current.id,
        recipient_name: current.name,
        phone: current.phone,
        meeting_date: meetingDate,
        message_content: personalized,
        channel: 'whatsapp_web',
        status: 'opened_wa',
        sent_at: new Date().toISOString(),
      },
    ]);

    if (webQueueIndex < selectedRecipients.length - 1) {
      setWebQueueIndex((prev) => prev + 1);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Meeting Reminders & WhatsApp Broadcasts"
          subtitle="Send automated and customized WhatsApp reminders to past and registered members for upcoming fellowship meetings."
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadSettings();
              loadAudience();
            }}
            className="btn-secondary flex items-center gap-1.5 text-xs"
            title="Refresh"
          >
            <RefreshCw className={'h-3.5 w-3.5 ' + (loadingMembers ? 'animate-spin' : '')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="btn-primary flex items-center gap-1.5 text-xs"
          >
            {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save Settings
          </button>
        </div>
      </div>

      {saveFeedback && (
        <Alert variant={saveFeedback.type === 'success' ? 'success' : 'error'}>
          {saveFeedback.message}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ' + (
            activeTab === 'broadcast'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          )}
        >
          <Send className="h-4 w-4" />
          Broadcast Center
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            loadHistory();
          }}
          className={'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ' + (
            activeTab === 'history'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          )}
        >
          <History className="h-4 w-4" />
          Broadcast Logs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ' + (
            activeTab === 'settings'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          )}
        >
          <Settings className="h-4 w-4" />
          WhatsApp API Settings
        </button>
      </div>

      {/* TAB 1: BROADCAST CENTER */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          {/* Automation Status Banner & Master Toggle */}
          <div
            className={'flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ' + (
              autoSendEnabled
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-amber-200 bg-amber-50/70'
            )}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={'rounded-xl p-2.5 ' + (
                  autoSendEnabled ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                )}
              >
                {autoSendEnabled ? <PlayCircle className="h-6 w-6" /> : <PauseCircle className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">
                    Weekly Automatic WhatsApp Reminders
                  </h3>
                  <span
                    className={'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (
                      autoSendEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {autoSendEnabled ? 'Active' : 'Paused for this week'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-600 sm:text-sm">
                  {autoSendEnabled
                    ? 'Automated background reminder scheduler is ACTIVE. Messages will be dispatched before the scheduled meeting.'
                    : 'Automation is PAUSED. If you are not meeting this week or want to skip, automatic messages will remain paused.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setAutoSendEnabled(!autoSendEnabled);
                  handleSaveSettings();
                }}
                className={'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ' + (
                  autoSendEnabled
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                )}
              >
                {autoSendEnabled ? (
                  <>
                    <PauseCircle className="h-4 w-4" /> Pause Weekly Reminders
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" /> Resume Weekly Reminders
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={UserX}
              label="Inactive / Past Attendees"
              value={cohortCounts.inactive}
              tone="red"
            />
            <StatCard
              icon={UserCheck}
              label="Active Attendees"
              value={cohortCounts.active}
              tone="white"
            />
            <StatCard
              icon={Users}
              label="Total Registered Members"
              value={cohortCounts.total}
              tone="brand"
            />
          </div>

          {/* Meeting Details Setup */}
          <div className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-600" />
                <h3 className="font-bold text-stone-900">Upcoming Meeting Configuration</h3>
              </div>
              <span className="text-xs text-stone-500">Auto-populates inside message template</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Meeting Date */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-stone-700">Next Meeting Date</label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="input-field"
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickDate('wednesday')}
                      className="rounded-lg bg-stone-100 px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200"
                    >
                      Wed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate('friday')}
                      className="rounded-lg bg-stone-100 px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200"
                    >
                      Fri
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate('sunday')}
                      className="rounded-lg bg-stone-100 px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200"
                    >
                      Sun
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate('tomorrow')}
                      className="rounded-lg bg-stone-100 px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
              </div>

              {/* Meeting Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Meeting Time</label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="e.g. 5:00 PM or 17:00"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Venue / Location</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Main Fellowship Hall"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              {/* Theme / Topic */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <label className="text-xs font-semibold text-stone-700">Fellowship Topic / Theme</label>
                <div className="relative">
                  <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Overcoming Giants in Campus Life & Walking in Purpose"
                    className="input-field pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Template Composer & Live Simulator Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Template Composer (7 cols) */}
            <div className="card space-y-4 p-5 sm:p-6 lg:col-span-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-brand-600" />
                  <h3 className="font-bold text-stone-900">Custom Reminder Message</h3>
                </div>
                <span className="text-xs text-stone-400">{template.length} characters</span>
              </div>

              {/* Dynamic Tag Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-600">Click to insert personal tags:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DYNAMIC_TAGS.map(({ tag, label }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTag(tag)}
                      className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50/80 px-2.5 py-1 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100 active:scale-95"
                    >
                      <Plus className="h-3 w-3" />
                      {label} ({tag})
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <textarea
                  rows={6}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Type your WhatsApp reminder message here..."
                  className="input-field font-sans text-sm leading-relaxed"
                />
                <p className="text-[11px] text-stone-500">
                  Tip: WhatsApp supports formatting with <code className="font-bold">*bold*</code>,{' '}
                  <code className="italic">_italic_</code>, and emojis.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartBroadcast}
                  disabled={selectedRecipients.length === 0}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Broadcast via WhatsApp API ({selectedRecipients.length})
                </button>

                <button
                  type="button"
                  onClick={handleOpenWebQueue}
                  disabled={selectedRecipients.length === 0}
                  className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm font-semibold"
                  title="Open 1-Click WhatsApp Web Dispatcher"
                >
                  <ExternalLink className="h-4 w-4 text-emerald-600" />
                  1-Click Web Dispatcher
                </button>
              </div>
            </div>

            {/* Right: Live WhatsApp Phone Simulator Preview (5 cols) */}
            <div className="card flex flex-col overflow-hidden bg-stone-900 p-0 shadow-xl lg:col-span-5">
              {/* Fake Phone Top Bar */}
              <div className="flex items-center justify-between border-b border-stone-800 bg-stone-950 px-4 py-3 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-center font-bold leading-8 text-white">
                    IF
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none">ISBAT Fellowship</h4>
                    <span className="text-[10px] text-emerald-400">WhatsApp Broadcast Preview</span>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400">Sample: {previewSampleMember.name}</span>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 space-y-3 bg-[#0b141a] p-4 text-sm">
                <div className="flex justify-center">
                  <span className="rounded-md bg-[#182229] px-2.5 py-1 text-[10px] font-medium text-stone-400 shadow-sm">
                    {meetingDate ? formatDate(meetingDate) : 'Today'}
                  </span>
                </div>

                {/* Simulated WhatsApp Bubble */}
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#005c4b] p-3 text-white shadow-md">
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-100">
                    {previewMessage}
                  </p>
                  <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-emerald-200">
                    <span>{meetingTime || '5:00 PM'}</span>
                    <CheckCircle2 className="h-3 w-3 text-sky-300" />
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-800 bg-[#202c33] px-4 py-2.5 text-center text-xs text-stone-400">
                Simulated message to: <strong className="text-stone-200">{previewSampleMember.name}</strong> ({previewSampleMember.phone})
              </div>
            </div>
          </div>

          {/* Recipient Audience & Member Selection Table */}
          <div className="card overflow-hidden">
            <div className="border-b border-stone-200 bg-stone-50 p-4 sm:flex sm:items-center sm:justify-between sm:p-5">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-stone-900">
                  <Users className="h-5 w-5 text-brand-600" /> Target Audience ({selectedRecipients.length} Selected)
                </h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Filter by cohort or select individual members to receive this meeting reminder.
                </p>
              </div>

              {/* Cohort Tabs */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-0">
                <button
                  type="button"
                  onClick={() => handleCohortChange('inactive')}
                  className={'rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ' + (
                    cohort === 'inactive'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-stone-600 hover:bg-stone-100'
                  )}
                >
                  Inactive / Past ({cohortCounts.inactive})
                </button>
                <button
                  type="button"
                  onClick={() => handleCohortChange('all')}
                  className={'rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ' + (
                    cohort === 'all'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-stone-600 hover:bg-stone-100'
                  )}
                >
                  All Members ({cohortCounts.total})
                </button>
                <button
                  type="button"
                  onClick={() => handleCohortChange('active')}
                  className={'rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ' + (
                    cohort === 'active'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-stone-600 hover:bg-stone-100'
                  )}
                >
                  Active ({cohortCounts.active})
                </button>
              </div>
            </div>

            {/* Search & Bulk Select Bar */}
            <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members by name, phone or course..."
                  className="input-field pl-9 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAllVisible}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Select / Deselect Visible ({filteredMembers.length})
                </button>
              </div>
            </div>

            {/* Members Table */}
            {loadingMembers && <LoadingBlock label="Loading recipient members..." />}
            {memberError && <div className="p-4"><Alert variant="error">{memberError}</Alert></div>}

            {!loadingMembers && filteredMembers.length === 0 && (
              <div className="p-8 text-center text-sm text-stone-500">
                No members found matching the selected cohort/search criteria.
              </div>
            )}

            {!loadingMembers && filteredMembers.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={
                            filteredMembers.length > 0 &&
                            filteredMembers.every((m) => selectedMemberIds.has(m.id))
                          }
                          onChange={toggleAllVisible}
                          className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                        />
                      </th>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Attendance History</th>
                      <th className="px-4 py-3 text-right">Direct Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredMembers.map((member) => {
                      const isChecked = selectedMemberIds.has(member.id);
                      const directUrl = buildWhatsAppWebUrl(
                        member.phone,
                        interpolateTemplate(template, {
                          name: member.name,
                          meeting_date: meetingDate ? formatDate(meetingDate) : 'Upcoming Meeting',
                          meeting_time: meetingTime,
                          venue,
                          topic,
                        })
                      );

                      return (
                        <tr
                          key={member.id}
                          className={'transition-colors hover:bg-stone-50/80 ' + (
                            isChecked ? 'bg-brand-50/30' : ''
                          )}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMember(member.id)}
                              className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={member.name} size="sm" />
                              <div>
                                <span className="font-bold text-stone-900">{member.name}</span>
                                {member.course && (
                                  <span className="block text-[11px] text-stone-500">{member.course}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-stone-700">
                            {member.phone}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ' + (
                                member.isInactive
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-800'
                              )}
                            >
                              {member.statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <a
                              href={directUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              title="Open single chat on WhatsApp"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Chat
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST HISTORY */}
      {activeTab === 'history' && (
        <div className="card space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-stone-900">Broadcast Delivery Logs</h3>
              <p className="text-xs text-stone-500">History of dispatched WhatsApp meeting reminders</p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="btn-secondary text-xs"
            >
              Refresh Logs
            </button>
          </div>

          {loadingHistory && <LoadingBlock label="Loading delivery logs..." />}

          {!loadingHistory && pastLogs.length === 0 && (
            <div className="p-8 text-center text-sm text-stone-500">
              No broadcast reminders sent yet.
            </div>
          )}

          {!loadingHistory && pastLogs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Message Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pastLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-stone-50/80">
                      <td className="px-4 py-3 text-stone-600">
                        {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Recent'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-900">{log.recipient_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">{log.phone}</td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {log.channel === 'whatsapp_web' ? 'WhatsApp Web' : 'Meta Cloud API'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (
                            log.status === 'sent' || log.status === 'opened_wa'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          )}
                        >
                          {log.status === 'sent'
                            ? 'Delivered'
                            : log.status === 'opened_wa'
                            ? 'Opened Web'
                            : 'Failed'}
                        </span>
                        {log.error_message && (
                          <span className="block text-[10px] text-red-600">{log.error_message}</span>
                        )}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-stone-500" title={log.message_content}>
                        {log.message_content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WHATSAPP API SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="card space-y-5 p-5 sm:p-6 lg:col-span-7">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="flex items-center gap-2 font-bold text-stone-900">
                <Key className="h-5 w-5 text-brand-600" /> Meta WhatsApp Cloud API Setup
              </h3>
              <p className="text-xs text-stone-500">
                Official Cloud API credentials for automated background reminders (Free tier includes 1,000 conversations/month).
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Phone Number ID</label>
                <input
                  type="text"
                  value={apiPhoneId}
                  onChange={(e) => setApiPhoneId(e.target.value)}
                  placeholder="e.g. 104592837492019"
                  className="input-field font-mono text-sm"
                />
                <span className="text-[11px] text-stone-500">
                  From your Meta for Developers App Dashboard &gt; WhatsApp &gt; API Setup.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Permanent Access Token</label>
                <input
                  type="password"
                  value={apiAccessToken}
                  onChange={(e) => setApiAccessToken(e.target.value)}
                  placeholder="EAAG..."
                  className="input-field font-mono text-sm"
                />
                <span className="text-[11px] text-stone-500">
                  System User Token or Developer Temporary Token from Meta Graph API.
                </span>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h4 className="text-xs font-bold text-stone-800">Test API Connection</h4>
                <p className="mt-0.5 text-[11px] text-stone-600">
                  Send a sample test ping to your WhatsApp phone number to verify credentials.
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="e.g. 256771234567"
                    className="input-field flex-1 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleTestApi}
                    disabled={testingApi}
                    className="btn-primary flex items-center gap-1.5 text-xs"
                  >
                    {testingApi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send Test Ping
                  </button>
                </div>

                {testResult && (
                  <div className="mt-3">
                    <Alert variant={testResult.type === 'success' ? 'success' : 'error'}>
                      {testResult.message}
                    </Alert>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="btn-primary flex items-center gap-2 text-xs font-bold"
                >
                  <Check className="h-4 w-4" /> Save API Credentials
                </button>
              </div>
            </div>
          </div>

          <div className="card space-y-4 p-5 sm:p-6 lg:col-span-5">
            <h3 className="font-bold text-stone-900">How to get Meta API Keys</h3>
            <ol className="list-decimal space-y-2.5 pl-4 text-xs text-stone-600">
              <li>
                Go to{' '}
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-600 underline"
                >
                  developers.facebook.com
                </a>{' '}
                and log into your Meta account.
              </li>
              <li>Create a new App with type <strong>Other &gt; Business</strong>.</li>
              <li>Add <strong>WhatsApp</strong> to your App products.</li>
              <li>Under <strong>WhatsApp &gt; API Setup</strong>, copy the <strong>Phone Number ID</strong> and <strong>Temporary / Permanent Access Token</strong>.</li>
              <li>Paste the credentials on the left and click <strong>Send Test Ping</strong>.</li>
            </ol>

            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3 text-xs text-brand-900">
              💡 <strong>Zero Cost Notice:</strong> Meta provides the first 1,000 service conversations every month completely free. You can also use the <strong>1-Click WhatsApp Web Dispatcher</strong> anytime with zero API setup!
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST PROGRESS MODAL */}
      {isBroadcasting && broadcastProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900">
                <Send className="h-5 w-5 text-brand-600" /> WhatsApp Broadcast in Progress
              </h3>
              <span className="text-xs font-bold text-brand-600">{broadcastProgress.percent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full bg-brand-600 transition-all duration-300"
                style={{ width: broadcastProgress.percent + '%' }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-stone-600">
              <span>
                Processed: <strong>{broadcastProgress.current}</strong> / {broadcastProgress.total}
              </span>
              <span>
                Successful: <strong className="text-emerald-600">{broadcastProgress.successful}</strong> |{' '}
                Failed: <strong className="text-red-600">{broadcastProgress.failed}</strong>
              </span>
            </div>

            {/* Live stream */}
            <div className="mt-4 max-h-40 overflow-y-auto rounded-xl bg-stone-50 p-3 font-mono text-[11px]">
              {broadcastLogs.map((log, i) => (
                <div
                  key={i}
                  className={'flex items-center justify-between py-1 ' + (
                    log.status === 'sent' ? 'text-emerald-700' : 'text-red-600'
                  )}
                >
                  <span>{log.recipient_name} ({log.phone})</span>
                  <span>{log.status === 'sent' ? '✓ Sent' : '✗ Failed'}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              {broadcastProgress.current >= broadcastProgress.total ? (
                <button
                  type="button"
                  onClick={() => setIsBroadcasting(false)}
                  className="btn-primary text-xs font-bold"
                >
                  Done
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBroadcasting(false)}
                  className="btn-secondary text-xs"
                >
                  Close & Background
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK WHATSAPP WEB QUEUE MODAL */}
      {showWebQueueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-stone-900">
                  <ExternalLink className="h-5 w-5 text-emerald-600" /> 1-Click WhatsApp Web Dispatcher
                </h3>
                <p className="text-xs text-stone-500">
                  Opens WhatsApp Web / Desktop directly for each recipient with pre-filled message. Zero API keys needed!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWebQueueModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Recipient Card */}
            {selectedRecipients[webQueueIndex] && (
              <div className="my-5 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                  Recipient {webQueueIndex + 1} of {selectedRecipients.length}
                </span>
                <h4 className="mt-1 text-lg font-extrabold text-stone-900">
                  {selectedRecipients[webQueueIndex].name}
                </h4>
                <p className="font-mono text-xs text-stone-600">
                  {selectedRecipients[webQueueIndex].phone}
                </p>

                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDispatchNextWebMember}
                    className="btn-primary flex items-center gap-2 bg-emerald-600 px-6 py-3 font-bold hover:bg-emerald-700"
                  >
                    <ExternalLink className="h-4 w-4" /> Open WhatsApp Chat & Send
                  </button>
                </div>
              </div>
            )}

            {/* Queue List */}
            <div className="max-h-52 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs">
              {selectedRecipients.map((recip, idx) => {
                const isSent = webQueueDispatched.has(recip.id);
                const isCurrent = idx === webQueueIndex;
                return (
                  <div
                    key={recip.id}
                    className={'flex items-center justify-between rounded-lg px-3 py-2 ' + (
                      isCurrent
                        ? 'bg-brand-100 font-bold text-brand-900'
                        : isSent
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-stone-600 hover:bg-stone-100'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{idx + 1}.</span>
                      <span>{recip.name}</span>
                      <span className="text-[11px] text-stone-500">({recip.phone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSent && <span className="text-xs font-semibold text-emerald-600">✓ Dispatched</span>}
                      {isCurrent && <span className="text-xs font-semibold text-brand-700">Next ▶</span>}
                      <button
                        type="button"
                        onClick={() => {
                          setWebQueueIndex(idx);
                        }}
                        className="rounded px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-200"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-stone-500">
              <span>
                Dispatched: {webQueueDispatched.size} / {selectedRecipients.length}
              </span>
              <button
                type="button"
                onClick={() => setShowWebQueueModal(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
