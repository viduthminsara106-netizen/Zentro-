import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CheckCircle2,
  Coins,
  Crown,
  Eye,
  Mail,
  MailCheck,
  Megaphone,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  AppNotification,
  SentEmailNotificationRecord,
  UserProfile,
  buildZentroClientEmailHtml,
  getActiveCurrency,
  getSentEmailNotifications,
  isEmailNotificationsEnabled,
  pushUserNotification,
  replaceCurrencyInText,
  setEmailNotificationsEnabled,
  tr,
} from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  profile: UserProfile;
  notifications: AppNotification[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onClearReadNotifications: () => void;
  onNavigateAction: (
    tab?: 'home' | 'team' | 'task' | 'vip' | 'my',
    modal?: 'deposit' | 'withdrawal' | 'active_vip' | 'support' | 'compare_tiers',
    notificationId?: string
  ) => void;
}

type FilterTab =
  | 'all'
  | 'unread'
  | 'sent_emails'
  | 'transaction'
  | 'vip_mining'
  | 'task_referral'
  | 'system';

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  isDark,
  profile,
  notifications,
  soundEnabled,
  onToggleSound,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearReadNotifications,
  onNavigateAction,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [emailEnabled, setEmailEnabled] = useState<boolean>(() =>
    isEmailNotificationsEnabled(profile.uid)
  );
  const [sentEmails, setSentEmails] = useState<SentEmailNotificationRecord[]>([]);
  const [previewEmail, setPreviewEmail] = useState<SentEmailNotificationRecord | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEmailEnabled(isEmailNotificationsEnabled(profile.uid));
    setSentEmails(getSentEmailNotifications(profile.uid, profile.email, profile.username));

    const handleRefresh = () => {
      setEmailEnabled(isEmailNotificationsEnabled(profile.uid));
      setSentEmails(getSentEmailNotifications(profile.uid, profile.email, profile.username));
    };
    window.addEventListener('zentro-notifications-updated', handleRefresh);
    return () => window.removeEventListener('zentro-notifications-updated', handleRefresh);
  }, [isOpen, profile.uid, profile.email, profile.username, notifications.length]);

  if (!isOpen) return null;

  const activeCurrency = getActiveCurrency(profile);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const handleToggleEmailAlerts = () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    setEmailNotificationsEnabled(profile.uid, next);
  };

  const handleSendTestEmail = async () => {
    if (sendingTestEmail) return;
    setSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      if (!emailEnabled) {
        setEmailEnabled(true);
        setEmailNotificationsEnabled(profile.uid, true);
      }
      const created = pushUserNotification(profile.uid, {
        title: `Email & Site Alert Confirmed (${profile.email})`,
        titleSi: `ඊමේල් සහ වෙබ් අඩවි දැනුම්දීම තහවුරු විය (${profile.email})`,
        message: `All Zentro notifications (Task Claims, VIP Upgrades, Deposits, Withdrawals, and Mining Yields) are now automatically sent to your email address (${profile.email}) in addition to this site.`,
        messageSi: `සියලුම Zentro දැනුම්දීම් (කාර්ය ප්‍රතිලාභ, VIP උත්ශ්‍රේණි කිරීම්, තැන්පතු සහ මුදල් ආපසු ගැනීම්) දැන් වෙබ් අඩවියට අමතරව ඔබගේ ඊමේල් ලිපිනයටද (${profile.email}) ස්වයංක්‍රීයව එවනු ලැබේ.`,
        category: 'system',
        priority: 'high',
        emailTo: profile.email,
        username: profile.username,
      });
      setSentEmails(getSentEmailNotifications(profile.uid, profile.email, profile.username));
      setTestEmailStatus(
        tr(
          profile,
          `✓ Test notification & email sent to ${created.emailTo || profile.email}`,
          `✓ පරීක්ෂණ දැනුම්දීම සහ ඊමේල් පණිවිඩය ${created.emailTo || profile.email} වෙත යවන ලදී`
        )
      );
      setTimeout(() => setTestEmailStatus(null), 5000);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const openEmailPreviewForNotif = (notif: AppNotification) => {
    const found = sentEmails.find((e) => e.notificationId === notif.id);
    if (found) {
      setPreviewEmail(found);
      return;
    }
    const toAddr = notif.emailTo || profile.email || 'member@zentro.io';
    const sentTime = notif.emailSentAt || notif.createdAt;
    const localizedTitle = replaceCurrencyInText(notif.title, activeCurrency);
    const localizedMessage = replaceCurrencyInText(notif.message, activeCurrency);
    const fallbackRecord: SentEmailNotificationRecord = {
      id: `email_preview_${notif.id}`,
      notificationId: notif.id,
      userId: profile.uid,
      to: toAddr,
      username: profile.username,
      from: 'Zentro Official <notifications@zentro.io>',
      subject:
        notif.emailSubject ||
        `[Zentro ${(notif.category || 'Alert').toUpperCase()}] ${localizedTitle}`,
      title: localizedTitle,
      titleSi: notif.titleSi,
      message: localizedMessage,
      messageSi: notif.messageSi,
      category: notif.category,
      priority: notif.priority,
      actionLabel: notif.actionLabel,
      htmlBody: buildZentroClientEmailHtml({
        username: profile.username,
        to: toAddr,
        title: localizedTitle,
        titleSi: notif.titleSi,
        message: localizedMessage,
        messageSi: notif.messageSi,
        category: notif.category,
        sentAt: sentTime,
      }),
      status: 'delivered',
      sentAt: sentTime,
    };
    setPreviewEmail(fallbackRecord);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'transaction') return n.category === 'transaction';
    if (activeFilter === 'vip_mining')
      return n.category === 'vip' || n.category === 'mining';
    if (activeFilter === 'task_referral')
      return n.category === 'task' || n.category === 'referral';
    if (activeFilter === 'system')
      return n.category === 'system' || n.category === 'security';
    return true;
  });

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
      if (diffSec < 60) return tr(profile, 'Just now', 'දැන්');
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getCategoryIcon = (n: AppNotification) => {
    if (n.isBroadcast) {
      return <Megaphone className="w-4 h-4 text-pink-400" />;
    }
    switch (n.category) {
      case 'transaction':
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      case 'vip':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'mining':
        return <Coins className="w-4 h-4 text-sky-400" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case 'referral':
        return <Users className="w-4 h-4 text-pink-400" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-sky-400" />;
    }
  };

  const getCategoryBadgeLabel = (n: AppNotification) => {
    if (n.isBroadcast) {
      return tr(profile, 'ADMIN BROADCAST', 'ප්‍රධාන නිවේදනය');
    }
    switch (n.category) {
      case 'transaction':
        return tr(profile, 'WALLET & SETTLEMENT', 'මුදල් හුවමාරු');
      case 'vip':
        return tr(profile, 'VIP MEMBERSHIP', 'VIP සාමාජිකත්වය');
      case 'mining':
        return tr(profile, 'LIVE MINING', 'සජීවී පතල් කැණීම');
      case 'task':
        return tr(profile, 'DAILY TASKS', 'දෛනික කාර්යයන්');
      case 'referral':
        return tr(profile, 'TEAM COMMISSION', 'කණ්ඩායම් කොමිස්');
      case 'security':
        return tr(profile, 'SECURITY ALERT', 'ආරක්ෂක නිවේදනය');
      default:
        return tr(profile, 'SYSTEM NOTICE', 'පද්ධති නිවේදනය');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div
        className={`max-w-2xl w-full my-auto rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-[#0e1629] border-pink-500/40 text-white'
            : 'bg-white border-pink-200 text-slate-900'
        }`}
      >
        {/* Top Modal Header */}
        <div
          className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark
              ? 'bg-gradient-to-r from-[#131e38] via-[#1a1535] to-[#131e38] border-white/10'
              : 'bg-gradient-to-r from-sky-50 via-pink-50 to-rose-50 border-pink-200/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 via-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold font-display">
                  {tr(
                    profile,
                    'Site & Email Notification Center',
                    'වෙබ් අඩවි සහ ඊමේල් දැනුම්දීම් මධ්‍යස්ථානය'
                  )}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-extrabold">
                    {unreadCount} {tr(profile, 'NEW', 'අලුත්')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {tr(
                  profile,
                  `In-Site + Direct Email Delivery (${profile.email})`,
                  `වෙබ් අඩවියට අමතරව ඊමේල් මගින්ද දැනුම්දීම් ලැබේ (${profile.email})`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              title={tr(profile, 'Toggle Popup Toast Alerts', 'ක්ෂණික දැනුම්දීම් සක්‍රිය/අක්‍රිය කරන්න')}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : isDark
                    ? 'bg-white/5 border-white/15 text-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{soundEnabled ? 'Site ON' : 'Site OFF'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleEmailAlerts}
              title={tr(
                profile,
                'Toggle Automatic Email Notifications',
                'ඊමේල් දැනුම්දීම් සක්‍රිය/අක්‍රිය කරන්න'
              )}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                emailEnabled
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                  : isDark
                    ? 'bg-white/5 border-white/15 text-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{emailEnabled ? 'Email ON' : 'Email OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/15 text-slate-300'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Delivery Status & Test Email Bar */}
        <div
          className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${
            isDark
              ? 'bg-gradient-to-r from-sky-500/10 via-pink-500/10 to-emerald-500/10 border-white/10'
              : 'bg-gradient-to-r from-sky-50 via-pink-50/60 to-emerald-50 border-pink-200/60'
          }`}
        >
          <div className="flex items-center gap-2 text-xs min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                emailEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <MailCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">
              {tr(profile, 'Email Delivery:', 'ඊමේල් ලිපිනය:')}{' '}
              <strong className="font-mono text-pink-400">{profile.email}</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                emailEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              {emailEnabled
                ? tr(profile, 'AUTO EMAIL ACTIVE', 'ස්වයංක්‍රීය ඊමේල් සක්‍රියයි')
                : tr(profile, 'PAUSED', 'නවතා ඇත')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={sendingTestEmail}
              onClick={handleSendTestEmail}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-pink-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95"
            >
              <Send className="w-3 h-3" />
              <span>
                {sendingTestEmail
                  ? tr(profile, 'Sending...', 'යවමින්...')
                  : tr(profile, 'Send Test Email', 'පරීක්ෂණ ඊමේල් යවන්න')}
              </span>
            </button>
          </div>
        </div>

        {testEmailStatus && (
          <div className="px-5 py-2 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
            <span>{testEmailStatus}</span>
            <button
              type="button"
              onClick={() => setActiveFilter('sent_emails')}
              className="underline text-[11px] font-mono cursor-pointer"
            >
              {tr(profile, 'View Sent Emails →', 'යැවූ ඊමේල් බලන්න →')}
            </button>
          </div>
        )}

        {/* Filter Tabs & Bulk Action Bar */}
        <div
          className={`px-5 py-3 border-b space-y-2.5 ${
            isDark ? 'bg-[#121c33]/80 border-white/10' : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    id: 'all',
                    label: tr(profile, 'All', 'සියල්ල'),
                    count: notifications.length,
                  },
                  {
                    id: 'unread',
                    label: tr(profile, 'Unread', 'නොකියවූ'),
                    count: unreadCount,
                  },
                  {
                    id: 'sent_emails',
                    label: tr(profile, '✉️ Sent Emails', '✉️ යැවූ ඊමේල්'),
                    count: sentEmails.length,
                  },
                  {
                    id: 'transaction',
                    label: tr(profile, 'Wallet', 'මුදල්'),
                    count: notifications.filter((n) => n.category === 'transaction')
                      .length,
                  },
                  {
                    id: 'vip_mining',
                    label: tr(profile, 'VIP & Mining', 'VIP සහ කැණීම්'),
                    count: notifications.filter(
                      (n) => n.category === 'vip' || n.category === 'mining'
                    ).length,
                  },
                  {
                    id: 'task_referral',
                    label: tr(profile, 'Tasks & Team', 'කාර්ය සහ කණ්ඩායම'),
                    count: notifications.filter(
                      (n) => n.category === 'task' || n.category === 'referral'
                    ).length,
                  },
                  {
                    id: 'system',
                    label: tr(profile, 'System', 'පද්ධති'),
                    count: notifications.filter(
                      (n) => n.category === 'system' || n.category === 'security'
                    ).length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white shadow-sm'
                      : isDark
                        ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeFilter === tab.id
                        ? 'bg-black/25 text-white'
                        : isDark
                          ? 'bg-white/10 text-slate-300'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-sky-500/25"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{tr(profile, 'Mark all read', 'සියල්ල කියවූ ලෙස ලකුණු කරන්න')}</span>
                </button>
              )}
              {readCount > 0 && (
                <button
                  type="button"
                  onClick={onClearReadNotifications}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-rose-500/25"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{tr(profile, 'Clear read', 'කියවූ දෑ මකන්න')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications or Sent Emails List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {activeFilter === 'sent_emails' ? (
            sentEmails.length === 0 ? (
              <div
                className={`p-10 rounded-2xl border text-center space-y-2 ${
                  isDark
                    ? 'bg-[#131d35]/60 border-white/10 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <Mail className="w-8 h-8 mx-auto text-sky-400 opacity-75" />
                <div className="text-sm font-bold">
                  {tr(profile, 'No emails sent yet', 'තවමත් ඊමේල් පණිවිඩ යවා නොමැත')}
                </div>
              </div>
            ) : (
              sentEmails.map((emailItem) => (
                <div
                  key={emailItem.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark
                      ? 'bg-[#131e38]/90 border-sky-500/35'
                      : 'bg-sky-50/60 border-sky-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-extrabold flex items-center gap-1">
                        <MailCheck className="w-3 h-3" />
                        <span>DELIVERED TO EMAIL</span>
                      </span>
                      <span className="text-[11px] font-mono text-pink-400 font-bold">
                        {emailItem.to}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatRelativeTime(emailItem.sentAt)}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm font-extrabold mb-1">
                    {replaceCurrencyInText(emailItem.subject, activeCurrency)}
                  </div>
                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {replaceCurrencyInText(
                      tr(
                        profile,
                        emailItem.message,
                        emailItem.messageSi || emailItem.message
                      ),
                      activeCurrency
                    )}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      From: {emailItem.from}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewEmail(emailItem)}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-sky-500 to-pink-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{tr(profile, 'Open Full Email', 'සම්පූර්ණ ඊමේල් පණිවිඩය බලන්න')}</span>
                    </button>
                  </div>
                </div>
              ))
            )
          ) : filteredNotifications.length === 0 ? (
            <div
              className={`p-10 rounded-2xl border text-center space-y-2 ${
                isDark
                  ? 'bg-[#131d35]/60 border-white/10 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <Bell className="w-8 h-8 mx-auto text-pink-400 opacity-75" />
              <div className="text-sm font-bold">
                {tr(
                  profile,
                  'No notifications in this category',
                  'මෙම කාණ්ඩයේ දැනුම්දීම් කිසිවක් නොමැත'
                )}
              </div>
              <p className="text-xs max-w-sm mx-auto">
                {tr(
                  profile,
                  'New alerts for your deposits, withdrawals, daily tasks, live mining yields, and VIP upgrades will appear here and arrive via email automatically.',
                  'ඔබගේ තැන්පතු, මුදල් ආපසු ගැනීම්, දෛනික කාර්යයන් සහ VIP ප්‍රතිලාභ පිළිබඳ නව දැනුම්දීම් මෙහි සහ ඔබගේ ඊමේල් ලිපිනයට ස්වයංක්‍රීයව ලැබෙනු ඇත.'
                )}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const rawTitle = tr(
                profile,
                notif.title,
                notif.titleSi || notif.title
              );
              const rawMessage = tr(
                profile,
                notif.message,
                notif.messageSi || notif.message
              );
              const localizedTitle = replaceCurrencyInText(rawTitle, activeCurrency);
              const localizedMessage = replaceCurrencyInText(
                rawMessage,
                activeCurrency
              );

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all relative ${
                    !notif.read
                      ? isDark
                        ? 'bg-gradient-to-r from-[#162342] via-[#1c1a3c] to-[#162342] border-pink-500/50 shadow-md'
                        : 'bg-gradient-to-r from-sky-50/90 via-pink-50/80 to-white border-pink-400 shadow-sm'
                      : isDark
                        ? 'bg-[#121a2e]/75 border-white/10 opacity-85'
                        : 'bg-slate-50/80 border-slate-200 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                          isDark
                            ? 'bg-[#0d1426] border-white/10'
                            : 'bg-white border-pink-200 shadow-xs'
                        }`}
                      >
                        {getCategoryIcon(notif)}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-pink-400">
                            {getCategoryBadgeLabel(notif)}
                          </span>
                          {(notif.emailSent || emailEnabled) && (
                            <span className="px-1.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/35 text-sky-400 text-[9px] font-mono font-bold flex items-center gap-1">
                              <MailCheck className="w-2.5 h-2.5" />
                              <span>
                                {tr(
                                  profile,
                                  `Email Sent (${notif.emailTo || profile.email})`,
                                  `ඊමේල් යවන ලදී (${notif.emailTo || profile.email})`
                                )}
                              </span>
                            </span>
                          )}
                          {notif.priority === 'urgent' && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-mono font-extrabold uppercase">
                              URGENT
                            </span>
                          )}
                          {notif.priority === 'high' && !notif.isBroadcast && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-mono font-bold uppercase">
                              IMPORTANT
                            </span>
                          )}
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                          )}
                          <span className="text-[10px] font-mono text-slate-400 ml-auto">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-extrabold leading-snug">
                          {localizedTitle}
                        </h4>

                        <p
                          className={`text-xs leading-relaxed ${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {localizedMessage}
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {(notif.actionTab || notif.actionModal) && (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateAction(
                                    notif.actionTab,
                                    notif.actionModal,
                                    notif.id
                                  )
                                }
                                className="px-3 py-1 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <span>
                                  {tr(
                                    profile,
                                    notif.actionLabel || 'Open Section',
                                    notif.actionLabelSi ||
                                      notif.actionLabel ||
                                      'විවෘත කරන්න'
                                  )}
                                </span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openEmailPreviewForNotif(notif)}
                              className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                                isDark
                                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
                                  : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                              }`}
                            >
                              <Mail className="w-3 h-3 text-sky-400" />
                              <span>{tr(profile, 'View Email', 'ඊමේල් බලන්න')}</span>
                            </button>

                            {!notif.read && (
                              <button
                                type="button"
                                onClick={() => onMarkAsRead(notif.id)}
                                className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                                  isDark
                                    ? 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{tr(profile, 'Mark Read', 'කියවූ ලෙස ලකුණු කරන්න')}</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeleteNotification(notif.id)}
                            title={tr(profile, 'Dismiss Notification', 'ඉවත් කරන්න')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Full HTML Email Inspector Modal */}
        {previewEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
              className={`max-w-xl w-full rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
                isDark
                  ? 'bg-[#0b1120] border-sky-500/40 text-white'
                  : 'bg-white border-sky-300 text-slate-900'
              }`}
            >
              <div className="px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-sky-600 via-blue-600 to-pink-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MailCheck className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-extrabold">
                    {tr(
                      profile,
                      'Delivered Email Notification Preview',
                      'ඔබගේ ඊමේල් ලිපිනයට යවන ලද පණිවිඩය'
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewEmail(null)}
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-white/10 text-xs space-y-1 font-mono bg-black/20">
                <div>
                  <span className="text-slate-400">From:</span>{' '}
                  <span className="text-sky-400 font-bold">{previewEmail.from}</span>
                </div>
                <div>
                  <span className="text-slate-400">To:</span>{' '}
                  <span className="text-pink-400 font-bold">{previewEmail.to}</span>
                </div>
                <div>
                  <span className="text-slate-400">Subject:</span>{' '}
                  <span className="font-bold">
                    {replaceCurrencyInText(previewEmail.subject, activeCurrency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Delivered At:</span>{' '}
                  <span>{new Date(previewEmail.sentAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <div
                  className="rounded-2xl overflow-hidden border border-white/10"
                  dangerouslySetInnerHTML={{
                    __html: replaceCurrencyInText(previewEmail.htmlBody, activeCurrency),
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
