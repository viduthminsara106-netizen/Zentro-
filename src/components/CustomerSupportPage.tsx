import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Send,
  Users,
  Crown,
  Search,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Globe,
  ShieldCheck,
  Trash2,
  Edit3,
  Sparkles,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  UserProfile,
  VIP_TIERS,
  ZENTRO_LOGO_URL,
  LiveChatMessage,
  LiveChatUserPresence,
  SupportLinksConfig,
  SupportChannelItem,
  SupportChannelLogoType,
  DEFAULT_SUPPORT_CHANNELS,
  getSupportLinksConfig,
  saveSupportLinksConfig,
  getLocalLiveChatMessages,
  mergeAndSaveLocalLiveChatMessages,
  deleteLocalLiveChatMessage,
  getAllKnownLiveChatUsers,
  tr,
} from '../types';

/* ============================================================================
 * BESPOKE OFFICIAL CHANNEL & HIRING MANAGER SUPPORT CARE LOGOS (SVG)
 * 1. WhatsApp Official Logo
 * 2. Telegram Official Logo
 * 3. Hiring Manager + WhatsApp Logo Badge
 * 4. Hiring Manager + Telegram Logo Badge
 * ============================================================================ */

export const WhatsAppLogoSvg: React.FC<{ className?: string }> = ({
  className = 'w-12 h-12',
}) => (
  <svg
    viewBox="0 0 64 64"
    className={`${className} shrink-0 drop-shadow-md overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="waBgGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="50%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
    </defs>
    <rect
      x="4"
      y="4"
      width="56"
      height="56"
      rx="18"
      fill="url(#waBgGrad)"
      stroke="#ffffff"
      strokeOpacity="0.45"
      strokeWidth="2"
    />
    {/* Speech Bubble Ring */}
    <path
      d="M32 13C21.5 13 13 21.3 13 31.6C13 35.2 14.1 38.6 15.9 41.4L13.5 50.5L23 48C25.7 49.4 28.7 50.2 32 50.2C42.5 50.2 51 41.9 51 31.6C51 21.3 42.5 13 32 13Z"
      fill="#ffffff"
      fillOpacity="0.18"
      stroke="#ffffff"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Authentic Handset Receiver */}
    <path
      d="M25.6 22.4C25.1 21.3 24.5 21.3 24 21.3C23.5 21.3 22.9 21.3 22.4 21.3C21.8 21.3 20.9 21.5 20.2 22.3C19.4 23.1 17.5 24.9 17.5 28.5C17.5 32.1 20.2 35.6 20.6 36.1C21 36.6 25.8 44.3 33.4 47.3C39.7 49.8 41 49.3 42.4 49.1C43.8 48.9 46.8 47.3 47.4 45.5C48.1 43.8 48.1 42.3 47.9 42C47.7 41.7 47.1 41.5 46.3 41.1C45.5 40.7 41.9 38.9 41.2 38.7C40.5 38.4 40 38.3 39.5 39.1C39 39.9 37.5 41.6 37.1 42.1C36.6 42.6 36.2 42.7 35.4 42.3C34.6 41.9 32.1 41.1 29.1 38.4C26.8 36.3 25.2 33.8 24.7 33C24.3 32.2 24.7 31.8 25.1 31.4C25.4 31 25.9 30.4 26.3 29.9C26.7 29.4 26.8 29.1 27.1 28.6C27.3 28.1 27.2 27.6 27 27.2C26.8 26.8 25.9 23.2 25.6 22.4Z"
      fill="#ffffff"
    />
  </svg>
);

export const TelegramLogoSvg: React.FC<{ className?: string }> = ({
  className = 'w-12 h-12',
}) => (
  <svg
    viewBox="0 0 64 64"
    className={`${className} shrink-0 drop-shadow-md overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="tgBgGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect
      x="4"
      y="4"
      width="56"
      height="56"
      rx="18"
      fill="url(#tgBgGrad)"
      stroke="#ffffff"
      strokeOpacity="0.45"
      strokeWidth="2"
    />
    {/* Telegram Paper Plane */}
    <path
      d="M49.5 17.5L13.5 31.4C11.1 32.4 11.1 33.8 13.1 34.4L22.3 37.3L43.7 23.8C44.7 23.2 45.6 23.5 44.9 24.2L27.5 39.9L26.9 49.4C27.8 49.4 28.3 49 28.9 48.4L33.4 44L42.8 50.9C44.5 51.9 45.8 51.4 46.2 49.4L52.3 20.6C52.9 18.1 51.3 16.8 49.5 17.5Z"
      fill="#ffffff"
    />
  </svg>
);

export const HiringManagerWhatsAppLogoSvg: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => (
  <svg
    viewBox="0 0 68 68"
    className={`${className} shrink-0 drop-shadow-md overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="hmWaCardGrad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="55%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <linearGradient id="hmSuitGrad" x1="14" y1="34" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <rect
      x="3"
      y="3"
      width="56"
      height="56"
      rx="18"
      fill="url(#hmWaCardGrad)"
      stroke="#4ade80"
      strokeOpacity="0.65"
      strokeWidth="2"
    />
    {/* Hiring Manager Executive Portrait + Headset */}
    <circle cx="31" cy="21" r="8.5" fill="#fde68a" />
    {/* Executive Hair & Headset Band */}
    <path
      d="M21 21C21 14.9 25.5 10.5 31 10.5C36.5 10.5 41 14.9 41 21"
      stroke="#38bdf8"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <rect x="19" y="18.5" width="3.5" height="6.5" rx="1.7" fill="#22c55e" />
    <rect x="39.5" y="18.5" width="3.5" height="6.5" rx="1.7" fill="#22c55e" />
    <path d="M41.5 24.5C41.5 27.5 37.5 28.5 33.5 28.5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
    {/* Executive Suit & Tie */}
    <path
      d="M15 49.5C15 41 21.8 35 31 35C40.2 35 47 41 47 49.5C47 51.2 45.7 52.5 44 52.5H18C16.3 52.5 15 51.2 15 49.5Z"
      fill="url(#hmSuitGrad)"
    />
    {/* White Shirt & Red Executive Tie */}
    <path d="M26.5 35.5L31 44L35.5 35.5H26.5Z" fill="#ffffff" />
    <path d="M30 37.5L32 37.5L32.8 46.5L31 49L29.2 46.5L30 37.5Z" fill="#f43f5e" />

    {/* WhatsApp Official Corner Emblem Badge */}
    <circle cx="52" cy="51" r="13" fill="#22c55e" stroke="#ffffff" strokeWidth="2.5" />
    <path
      d="M48.5 45.8C48.1 45.1 47.7 45.1 47.4 45.1C47 45.1 46.3 45.3 45.8 45.8C45.3 46.4 44.1 47.6 44.1 50C44.1 52.4 45.8 54.7 46.1 55.1C46.4 55.5 49.6 60.5 54.6 62.5C58.7 64.1 59.6 63.8 60.5 63.7C61.4 63.5 63.4 62.5 63.8 61.3"
      stroke="#ffffff"
      strokeWidth="2.4"
      strokeLinecap="round"
      transform="translate(-3.5 -3.5) scale(0.92)"
    />
  </svg>
);

export const HiringManagerTelegramLogoSvg: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => (
  <svg
    viewBox="0 0 68 68"
    className={`${className} shrink-0 drop-shadow-md overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="hmTgCardGrad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="55%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="hmTgSuitGrad" x1="14" y1="34" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <rect
      x="3"
      y="3"
      width="56"
      height="56"
      rx="18"
      fill="url(#hmTgCardGrad)"
      stroke="#38bdf8"
      strokeOpacity="0.65"
      strokeWidth="2"
    />
    {/* Hiring Manager Executive Portrait + Headset */}
    <circle cx="31" cy="21" r="8.5" fill="#fde68a" />
    <path
      d="M21 21C21 14.9 25.5 10.5 31 10.5C36.5 10.5 41 14.9 41 21"
      stroke="#f472b6"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <rect x="19" y="18.5" width="3.5" height="6.5" rx="1.7" fill="#38bdf8" />
    <rect x="39.5" y="18.5" width="3.5" height="6.5" rx="1.7" fill="#38bdf8" />
    <path d="M41.5 24.5C41.5 27.5 37.5 28.5 33.5 28.5" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
    {/* Executive Suit & Tie */}
    <path
      d="M15 49.5C15 41 21.8 35 31 35C40.2 35 47 41 47 49.5C47 51.2 45.7 52.5 44 52.5H18C16.3 52.5 15 51.2 15 49.5Z"
      fill="url(#hmTgSuitGrad)"
    />
    <path d="M26.5 35.5L31 44L35.5 35.5H26.5Z" fill="#ffffff" />
    <path d="M30 37.5L32 37.5L32.8 46.5L31 49L29.2 46.5L30 37.5Z" fill="#0ea5e9" />

    {/* Telegram Official Corner Emblem Badge */}
    <circle cx="52" cy="51" r="13" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
    <path
      d="M57.5 45.2L44.2 50.4C43.3 50.8 43.3 51.3 44.1 51.6L47.5 52.6L55.4 47.6C55.8 47.3 56.1 47.5 55.8 47.7L49.4 53.6L49.2 57.1C49.5 57.1 49.7 56.9 49.9 56.7L51.6 55.1L55.1 57.6C55.7 58 56.2 57.8 56.3 57.1L58.6 46.4C58.8 45.5 58.2 45 57.5 45.2Z"
      fill="#ffffff"
    />
  </svg>
);

interface CustomerSupportPageProps {
  profile: UserProfile;
  isDark: boolean;
  isAdminMode?: boolean;
  onBack?: () => void;
}

export const CustomerSupportPage: React.FC<CustomerSupportPageProps> = ({
  profile,
  isDark,
  isAdminMode = false,
  onBack,
}) => {
  const senderIdentity = useMemo(
    () =>
      isAdminMode
        ? {
            uid: 'ADMIN',
            username: 'Zentro Official Admin',
            vipLevel: 4,
            isAdmin: true,
          }
        : {
            uid: profile.uid,
            username: profile.username,
            vipLevel: profile.vipLevel || 0,
            isAdmin: false,
          },
    [isAdminMode, profile.uid, profile.username, profile.vipLevel]
  );

  const [supportConfig, setSupportConfig] = useState<SupportLinksConfig>(() =>
    getSupportLinksConfig()
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Online Live Chat open/close state (opens when clicking the Online Live Chat row)
  const [isLiveChatOpen, setIsLiveChatOpen] = useState<boolean>(false);

  // Admin Add / Edit Channel & Support Care state
  const [isChannelFormOpen, setIsChannelFormOpen] = useState<boolean>(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [chLogoType, setChLogoType] = useState<SupportChannelLogoType>('whatsapp_channel');
  const [chTitle, setChTitle] = useState<string>('');
  const [chTitleSi, setChTitleSi] = useState<string>('');
  const [chSubtitle, setChSubtitle] = useState<string>('');
  const [chSubtitleSi, setChSubtitleSi] = useState<string>('');
  const [chBadge, setChBadge] = useState<string>('OFFICIAL CHANNEL');
  const [chUrl, setChUrl] = useState<string>('');

  // Live Chat State
  const [messages, setMessages] = useState<LiveChatMessage[]>(() =>
    getLocalLiveChatMessages()
  );
  const [serverUsers, setServerUsers] = useState<LiveChatUserPresence[]>([]);
  const [selectedTargetUid, setSelectedTargetUid] = useState<string>('GLOBAL');
  const [userSearch, setUserSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Sync with SSE stream + REST + localStorage + BroadcastChannel
  useEffect(() => {
    let es: EventSource | null = null;
    let bc: BroadcastChannel | null = null;

    // 1. Fetch initial server state
    fetch('/api/live-chat/state')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.messages)) {
          const merged = mergeAndSaveLocalLiveChatMessages(data.messages);
          setMessages(merged);
        }
        if (Array.isArray(data?.users)) {
          setServerUsers(data.users);
        }
        if (data?.supportConfig) {
          const mergedCfg: SupportLinksConfig = {
            ...getSupportLinksConfig(),
            ...data.supportConfig,
            channels:
              Array.isArray(data.supportConfig.channels) &&
              data.supportConfig.channels.length > 0
                ? data.supportConfig.channels
                : getSupportLinksConfig().channels || DEFAULT_SUPPORT_CHANNELS,
          };
          setSupportConfig(mergedCfg);
        }
      })
      .catch(() => {});

    // 2. Register presence
    const sendPresence = () => {
      fetch('/api/live-chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: senderIdentity.uid,
          username: senderIdentity.username,
          vipLevel: senderIdentity.vipLevel,
          isAdmin: senderIdentity.isAdmin,
          country: profile.country || '',
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data?.users)) {
            setServerUsers(data.users);
          }
        })
        .catch(() => {});
    };
    sendPresence();
    const presenceTimer = setInterval(sendPresence, 15000);

    // 3. Connect SSE for real-time server events
    try {
      es = new EventSource('/api/live-chat/stream');
      es.addEventListener('init', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          if (Array.isArray(payload?.messages)) {
            setMessages(mergeAndSaveLocalLiveChatMessages(payload.messages));
          }
          if (Array.isArray(payload?.users)) {
            setServerUsers(payload.users);
          }
          if (payload?.supportConfig) {
            setSupportConfig(payload.supportConfig);
          }
        } catch {
          // ignore
        }
      });
      es.addEventListener('message:created', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.message) {
            setMessages(mergeAndSaveLocalLiveChatMessages([payload.message]));
          }
        } catch {
          // ignore
        }
      });
      es.addEventListener('message:deleted', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.messageId) {
            setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
          }
        } catch {
          // ignore
        }
      });
      es.addEventListener('presence:updated', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          if (Array.isArray(payload?.users)) {
            setServerUsers(payload.users);
          }
        } catch {
          // ignore
        }
      });
      es.addEventListener('config:updated', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.supportConfig) {
            setSupportConfig(payload.supportConfig);
          }
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore SSE fallback
    }

    // 4. Connect BroadcastChannel + window storage events for instant multi-tab sync
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('zentro_live_chat_v1');
        bc.onmessage = (ev) => {
          const data = ev.data;
          if (data?.type === 'message:created' && data.message) {
            setMessages(mergeAndSaveLocalLiveChatMessages([data.message]));
          } else if (data?.type === 'message:deleted' && data.messageId) {
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
          } else if (data?.type === 'config:updated' && data.supportConfig) {
            setSupportConfig(data.supportConfig);
          }
        };
      }
    } catch {
      // ignore
    }

    const handleLocalSync = () => {
      setMessages(getLocalLiveChatMessages());
      setSupportConfig(getSupportLinksConfig());
    };
    window.addEventListener('zentro-live-chat-updated', handleLocalSync);
    window.addEventListener('zentro-support-config-updated', handleLocalSync);
    window.addEventListener('storage', handleLocalSync);

    return () => {
      clearInterval(presenceTimer);
      es?.close();
      bc?.close();
      window.removeEventListener('zentro-live-chat-updated', handleLocalSync);
      window.removeEventListener('zentro-support-config-updated', handleLocalSync);
      window.removeEventListener('storage', handleLocalSync);
    };
  }, [senderIdentity.uid, senderIdentity.username, senderIdentity.vipLevel, senderIdentity.isAdmin, profile.country]);

  // Combine all registered users + online presence + anyone who has sent a message
  const directoryUsers = useMemo(() => {
    const base = getAllKnownLiveChatUsers(serverUsers);
    const map = new Map<string, LiveChatUserPresence>();
    for (const u of base) {
      map.set(u.uid, u);
    }
    for (const m of messages) {
      if (m.senderUid && !map.has(m.senderUid)) {
        map.set(m.senderUid, {
          uid: m.senderUid,
          username: m.senderUsername || 'Member',
          vipLevel: m.senderVipLevel || 0,
          isAdmin: m.senderIsAdmin,
          lastSeenAt: m.createdAt,
        });
      }
    }
    // Ensure current user is also known
    map.set(senderIdentity.uid, {
      uid: senderIdentity.uid,
      username: senderIdentity.username,
      vipLevel: senderIdentity.vipLevel,
      isAdmin: senderIdentity.isAdmin,
      country: profile.country || '',
      lastSeenAt: new Date().toISOString(),
    });

    const all = Array.from(map.values()).filter((u) => u.uid !== senderIdentity.uid);
    // Sort: ADMIN first, then highest VIP / recent activity
    return all.sort((a, b) => {
      if (a.uid === 'ADMIN') return -1;
      if (b.uid === 'ADMIN') return 1;
      return (b.vipLevel || 0) - (a.vipLevel || 0);
    });
  }, [serverUsers, messages, senderIdentity, profile.country]);

  const filteredDirectoryUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return directoryUsers;
    return directoryUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q) ||
        (u.country && u.country.toLowerCase().includes(q))
    );
  }, [directoryUsers, userSearch]);

  const selectedRecipientObj = useMemo(() => {
    if (selectedTargetUid === 'GLOBAL') return null;
    return (
      directoryUsers.find((u) => u.uid === selectedTargetUid) || {
        uid: selectedTargetUid,
        username:
          selectedTargetUid === 'ADMIN' ? 'Zentro Official Admin' : 'Zentro Member',
        vipLevel: selectedTargetUid === 'ADMIN' ? 4 : 1,
        isAdmin: selectedTargetUid === 'ADMIN',
        lastSeenAt: new Date().toISOString(),
      }
    );
  }, [selectedTargetUid, directoryUsers]);

  // Filter messages for active conversation
  const activeConversationMessages = useMemo(() => {
    if (selectedTargetUid === 'GLOBAL') {
      return messages.filter((m) => m.recipientUid === 'GLOBAL');
    }
    return messages.filter(
      (m) =>
        (m.senderUid === senderIdentity.uid && m.recipientUid === selectedTargetUid) ||
        (m.senderUid === selectedTargetUid && m.recipientUid === senderIdentity.uid)
    );
  }, [messages, selectedTargetUid, senderIdentity.uid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationMessages.length, selectedTargetUid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = chatInput.trim();
    if (!cleanText || sending) return;

    setSending(true);
    const newMsg: LiveChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderUid: senderIdentity.uid,
      senderUsername: senderIdentity.username,
      senderVipLevel: senderIdentity.vipLevel,
      senderIsAdmin: senderIdentity.isAdmin,
      recipientUid: selectedTargetUid,
      recipientUsername:
        selectedTargetUid === 'GLOBAL'
          ? 'All Members'
          : selectedRecipientObj?.username || 'Member',
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    setChatInput('');
    // Optimistic local save + broadcast
    const updated = mergeAndSaveLocalLiveChatMessages([newMsg]);
    setMessages(updated);

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('zentro_live_chat_v1');
        bc.postMessage({ type: 'message:created', message: newMsg });
        bc.close();
      }
    } catch {
      // ignore
    }

    try {
      await fetch('/api/live-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
    } catch {
      // Already saved in local storage and BroadcastChannel
    } finally {
      setSending(false);
    }
  };

  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const activeChannels: SupportChannelItem[] = useMemo(() => {
    if (Array.isArray(supportConfig.channels) && supportConfig.channels.length > 0) {
      return supportConfig.channels;
    }
    return DEFAULT_SUPPORT_CHANNELS;
  }, [supportConfig.channels]);

  const handleOpenAddChannel = () => {
    setEditingChannelId(null);
    setChLogoType('whatsapp_channel');
    setChTitle('');
    setChTitleSi('');
    setChSubtitle('');
    setChSubtitleSi('');
    setChBadge('OFFICIAL CHANNEL');
    setChUrl('https://');
    setIsChannelFormOpen(true);
  };

  const handleOpenEditChannel = (ch: SupportChannelItem) => {
    setEditingChannelId(ch.id);
    setChLogoType(ch.logoType);
    setChTitle(ch.title);
    setChTitleSi(ch.titleSi || ch.title);
    setChSubtitle(ch.subtitle);
    setChSubtitleSi(ch.subtitleSi || ch.subtitle);
    setChBadge(ch.badge);
    setChUrl(ch.url);
    setIsChannelFormOpen(true);
  };

  const handleSaveChannelItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chTitle.trim() || !chUrl.trim()) return;

    const item: SupportChannelItem = {
      id: editingChannelId || `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      logoType: chLogoType,
      title: chTitle.trim(),
      titleSi: chTitleSi.trim() || chTitle.trim(),
      subtitle: chSubtitle.trim() || 'Official Zentro Customer Support & Broadcast Channel',
      subtitleSi: chSubtitleSi.trim() || chSubtitle.trim() || 'නිල Zentro පාරිභෝගික සේවා නාලිකාව',
      badge: chBadge.trim() || 'OFFICIAL SUPPORT',
      url: chUrl.trim(),
    };

    const nextChannels = editingChannelId
      ? activeChannels.map((c) => (c.id === editingChannelId ? item : c))
      : [...activeChannels, item];

    const saved = saveSupportLinksConfig({
      ...supportConfig,
      channels: nextChannels,
    });
    setSupportConfig(saved);
    setIsChannelFormOpen(false);
    setEditingChannelId(null);
  };

  const handleDeleteChannelItem = (channelId: string) => {
    const nextChannels = activeChannels.filter((c) => c.id !== channelId);
    const saved = saveSupportLinksConfig({
      ...supportConfig,
      channels: nextChannels,
    });
    setSupportConfig(saved);
  };

  const renderChannelLogo = (logoType: SupportChannelLogoType) => {
    switch (logoType) {
      case 'whatsapp_channel':
        return <WhatsAppLogoSvg className="w-12 h-12 sm:w-14 sm:h-14" />;
      case 'telegram_channel':
        return <TelegramLogoSvg className="w-12 h-12 sm:w-14 sm:h-14" />;
      case 'whatsapp_care':
        return <HiringManagerWhatsAppLogoSvg className="w-12 h-12 sm:w-14 sm:h-14" />;
      case 'telegram_care':
        return <HiringManagerTelegramLogoSvg className="w-12 h-12 sm:w-14 sm:h-14" />;
      default:
        return <WhatsAppLogoSvg className="w-12 h-12 sm:w-14 sm:h-14" />;
    }
  };

  // Count direct messages per user for badge display
  const getDirectMessageCountWithUser = (targetUid: string) => {
    return messages.filter(
      (m) =>
        (m.senderUid === targetUid && m.recipientUid === senderIdentity.uid) ||
        (m.senderUid === senderIdentity.uid && m.recipientUid === targetUid)
    ).length;
  };

  return (
    <div className="space-y-5">
      {/* ================= TOP DEDICATED PAGE HEADER ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-pink-500/35 bg-gradient-to-r from-blue-600 via-pink-500 to-rose-600 p-5 sm:p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={ZENTRO_LOGO_URL}
              alt="Zentro Support"
              className="w-14 h-14 rounded-2xl object-cover bg-white p-1 shadow-lg border border-white/50 shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/90 font-bold">
                  {tr(
                    profile,
                    'ZENTRO 24/7 OFFICIAL SUPPORT & LIVE COMMUNITY HUB',
                    'ZENTRO 24/7 නිල පාරිභෝගික සේවා සහ සජීවී සංවාද මධ්‍යස්ථානය'
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE ONLINE</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display mt-0.5">
                {tr(
                  profile,
                  'Official Channels, Hiring Manager Care & Online Live Chat',
                  'නිල නාලිකා, Hiring Manager සහාය සහ Online Live Chat'
                )}
              </h2>
              <p className="text-xs text-white/90 mt-1 max-w-2xl">
                {tr(
                  profile,
                  'Select any Official Channel, Hiring Manager Support Care, or click the Online Live Chat row below to open real-time messaging with all users & Admin.',
                  'පහත තීරු වලින් නිල WhatsApp / Telegram නාලිකා, Hiring Manager සහාය හෝ Online Live Chat තීරුව ක්ලික් කර සජීවීව සම්බන්ධ වන්න.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
            {isAdminMode && (
              <button
                type="button"
                onClick={handleOpenAddChannel}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Channel / Support Link</span>
              </button>
            )}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-2xl bg-white text-slate-950 hover:bg-white/95 text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-pink-600" />
                <span>{tr(profile, '← Back to Dashboard', '← ආපසු මුල් පිටුවට')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= ADMIN ADD / EDIT CHANNEL MODAL FORM ================= */}
      {isAdminMode && isChannelFormOpen && (
        <form
          onSubmit={handleSaveChannelItem}
          className={`p-5 rounded-3xl border space-y-4 ${
            isDark
              ? 'bg-[#141c2f] border-pink-500/40 text-white'
              : 'bg-white border-pink-300 text-slate-900 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-extrabold font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>
                {editingChannelId
                  ? 'Edit Official Channel / Support Care Row'
                  : 'Add New Official Channel / Support Care Row'}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsChannelFormOpen(false);
                setEditingChannelId(null);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1 text-pink-400">
                Logo & Channel Type *
              </label>
              <select
                value={chLogoType}
                onChange={(e) => {
                  const nextType = e.target.value as SupportChannelLogoType;
                  setChLogoType(nextType);
                  if (!editingChannelId) {
                    if (nextType === 'whatsapp_channel') {
                      setChBadge('OFFICIAL WHATSAPP');
                    } else if (nextType === 'telegram_channel') {
                      setChBadge('OFFICIAL TELEGRAM');
                    } else if (nextType === 'whatsapp_care') {
                      setChBadge('HIRING MANAGER · WHATSAPP');
                    } else {
                      setChBadge('HIRING MANAGER · TELEGRAM');
                    }
                  }
                }}
                className={`w-full px-3 py-2.5 rounded-xl border font-bold ${
                  isDark
                    ? 'bg-[#0e1526] border-white/15 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="whatsapp_channel">WhatsApp Official Channel (WhatsApp Logo)</option>
                <option value="telegram_channel">Telegram Official Channel (Telegram Logo)</option>
                <option value="whatsapp_care">WhatsApp Support Care (Hiring Manager Logo)</option>
                <option value="telegram_care">Telegram Support Care (Hiring Manager Logo)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Badge Label</label>
              <input
                type="text"
                value={chBadge}
                onChange={(e) => setChBadge(e.target.value)}
                placeholder="e.g. OFFICIAL WHATSAPP"
                className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs ${
                  isDark
                    ? 'bg-[#0e1526] border-white/15 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-emerald-400">
                Channel / Support Care Link (URL) *
              </label>
              <input
                type="url"
                required
                value={chUrl}
                onChange={(e) => setChUrl(e.target.value)}
                placeholder="https://wa.me/... or https://t.me/..."
                className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs ${
                  isDark
                    ? 'bg-[#0e1526] border-white/15 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Title (English) *</label>
              <input
                type="text"
                required
                value={chTitle}
                onChange={(e) => setChTitle(e.target.value)}
                placeholder="e.g. WhatsApp Official Channel"
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-[#0e1526] border-white/15 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Title (Sinhala)</label>
              <input
                type="text"
                value={chTitleSi}
                onChange={(e) => setChTitleSi(e.target.value)}
                placeholder="e.g. WhatsApp නිල නාලිකාව"
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-[#0e1526] border-white/15 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Description / Subtitle</label>
              <input
                type="text"
                value={chSubtitle}
                onChange={(e) => setChSubtitle(e.target.value)}
                placeholder="Short description shown on row..."
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-[#0e1526] border-white/15 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsChannelFormOpen(false);
                setEditingChannelId(null);
              }}
              className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-extrabold cursor-pointer shadow-md"
            >
              {editingChannelId ? 'Save Changes' : 'Add Channel / Support Link'}
            </button>
          </div>
        </form>
      )}

      {/* ================= CUSTOMER SUPPORT CHANNELS & ONLINE LIVE CHAT ROWS (තීරු ලැයිස්තුව) ================= */}
      <div className="space-y-3">
        {activeChannels.map((ch) => {
          const isWhatsApp =
            ch.logoType === 'whatsapp_channel' || ch.logoType === 'whatsapp_care';
          const isCare =
            ch.logoType === 'whatsapp_care' || ch.logoType === 'telegram_care';

          return (
            <motion.div
              key={ch.id}
              whileHover={{ y: -2 }}
              className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                isDark
                  ? isWhatsApp
                    ? 'bg-[#121a2d] border-emerald-500/35 hover:border-emerald-400'
                    : 'bg-[#121a2d] border-sky-500/35 hover:border-sky-400'
                  : isWhatsApp
                    ? 'bg-white border-emerald-200 hover:border-emerald-500 shadow-sm'
                    : 'bg-white border-sky-200 hover:border-sky-500 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                {renderChannelLogo(ch.logoType)}
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${
                        isCare
                          ? 'bg-pink-500/15 text-pink-500 border border-pink-500/30'
                          : isWhatsApp
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {ch.badge}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">
                      ● 24/7 VERIFIED
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold font-display truncate">
                    {tr(profile, ch.title, ch.titleSi || ch.title)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {tr(profile, ch.subtitle, ch.subtitleSi || ch.subtitle)}
                  </p>
                  {isAdminMode && (
                    <div className="text-[11px] font-mono text-sky-400 truncate">
                      Link: {ch.url}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2.5 rounded-2xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all ${
                    isWhatsApp
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700'
                  }`}
                >
                  <span>
                    {isCare
                      ? tr(profile, 'Contact Support Care', 'සහාය කළමනාකරු අමතන්න')
                      : tr(profile, 'Join Official Channel', 'නිල නාලිකාවට එක්වන්න')}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyUrl(ch.url, ch.id)}
                  title="Copy Link"
                  className={`p-2.5 rounded-2xl border cursor-pointer ${
                    isWhatsApp
                      ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                      : 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10'
                  }`}
                >
                  {copiedId === ch.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {isAdminMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditChannel(ch)}
                      className="px-3 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChannelItem(ch.id)}
                      className="px-3 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* ================= ROW 5: ONLINE LIVE CHAT BAR (තීරුවක් ලෙස — CLICK TO OPEN LIVE CHAT) ================= */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => setIsLiveChatOpen((prev) => !prev)}
          className={`w-full p-4 sm:p-5 rounded-3xl border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer shadow-lg ${
            isLiveChatOpen
              ? 'bg-gradient-to-r from-blue-600 via-pink-500 to-rose-600 text-white border-white/40 ring-2 ring-pink-400/50'
              : isDark
                ? 'bg-gradient-to-r from-[#141e36] via-[#1f1838] to-[#141e36] border-pink-500/50 hover:border-pink-400 text-white'
                : 'bg-gradient-to-r from-blue-50 via-pink-50 to-rose-50 border-pink-300 hover:border-pink-500 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-600 to-pink-500 text-white flex items-center justify-center shadow-md shrink-0 border border-white/40">
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#121a2d] animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#121a2d]" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${
                    isLiveChatOpen
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-pink-500/20 text-pink-500 dark:text-pink-300 border border-pink-500/30'
                  }`}
                >
                  ONLINE LIVE CHAT · 24/7 LIVELY
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold ${
                    isLiveChatOpen ? 'text-emerald-200' : 'text-emerald-500'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{directoryUsers.length + 1} Active Online</span>
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold font-display">
                {tr(
                  profile,
                  'Online Live Chat (Direct Message All Users & Admin Lively)',
                  'Online Live Chat — සියලුම සාමාජිකයින් සහ Admin සමඟ සජීවී චැට්'
                )}
              </h3>
              <p
                className={`text-xs ${
                  isLiveChatOpen
                    ? 'text-white/90'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tr(
                  profile,
                  'Click this row to open Online Live Chat — message everyone in Global Chat or send 1-on-1 Direct Messages to Admin & users.',
                  'මෙම තීරුව ක්ලික් කර Online Live Chat විවෘත කරන්න — සියලුම සාමාජිකයින්ට හා Admin වෙත සෘජුවම පණිවිඩ යැවිය හැක.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
                isLiveChatOpen
                  ? 'bg-black/25 text-white'
                  : 'bg-pink-500/15 text-pink-500 dark:text-pink-300'
              }`}
            >
              {messages.length} Messages
            </span>
            <div
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md ${
                isLiveChatOpen
                  ? 'bg-white text-slate-950'
                  : 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white'
              }`}
            >
              <span>
                {isLiveChatOpen
                  ? tr(profile, 'Close Live Chat', 'Live Chat වසන්න')
                  : tr(profile, 'Open Live Chat', 'Live Chat විවෘත කරන්න')}
              </span>
              {isLiveChatOpen ? (
                <ChevronDown className="w-4 h-4 text-pink-600" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </div>
        </motion.button>
      </div>

      {/* ================= EXPANDABLE ONLINE LIVE CHAT WORKSPACE (OPENS WHEN ROW IS CLICKED) ================= */}
      {isLiveChatOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border overflow-hidden shadow-2xl ${
            isDark
              ? 'bg-[#101626] border-pink-500/40 text-white'
              : 'bg-white border-pink-300 text-slate-900'
          }`}
        >
          {/* Live Chat Header Bar */}
          <div
            className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-gradient-to-r from-[#151e34] via-[#1c1a36] to-[#151e34] border-white/10'
                : 'bg-gradient-to-r from-blue-50 via-pink-50 to-rose-50 border-pink-200/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 via-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold font-display">
                    {tr(
                      profile,
                      'Zentro Online Live Chat (All Users & Admin)',
                      'සජීවී පණිවිඩ හුවමාරුව (සියලුම සාමාජිකයින් සහ Admin)'
                    )}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{directoryUsers.length + 1} Active</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tr(
                    profile,
                    'Chat lively with everyone in Global Chat or select Admin / any user on the left to send a Direct Message.',
                    'Global Chat හරහා සියලු දෙනා සමඟ හෝ වම් පස ලැයිස්තුවෙන් Admin හෝ ඕනෑම සාමාජිකයෙකු තෝරා සෘජුවම (Direct Message) පණිවිඩ යවන්න.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">
                  {tr(profile, 'Chatting as:', 'ඔබගේ නාමය:')}
                </span>
                <span className="font-extrabold text-pink-500">
                  {senderIdentity.isAdmin ? '👑 Zentro Official Admin' : senderIdentity.username}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveChatOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{tr(profile, 'Close', 'වසන්න')}</span>
              </button>
            </div>
          </div>

        {/* Main 2-Column Live Chat Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
          {/* LEFT SIDEBAR: Global Room + Admin Direct + All Users Directory */}
          <div
            className={`lg:col-span-4 border-b lg:border-b-0 lg:border-r flex flex-col ${
              isDark ? 'border-white/10 bg-[#131b2e]' : 'border-slate-200 bg-slate-50/70'
            }`}
          >
            {/* Search Users Input */}
            <div className="p-3.5 border-b border-slate-200/70 dark:border-white/10 space-y-2.5">
              <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400">
                {tr(profile, 'Select Chat Channel or Member', 'චැට් නාලිකාව හෝ සාමාජිකයා තෝරන්න')}
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  isDark
                    ? 'bg-[#0e1424] border-white/15'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={tr(
                    profile,
                    'Search Admin or any username...',
                    'Admin හෝ සාමාජික නාමය සොයන්න...'
                  )}
                  className="w-full bg-transparent text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Channel & User List */}
            <div className="flex-1 overflow-y-auto max-h-72 lg:max-h-[460px] divide-y divide-slate-200/60 dark:divide-white/5">
              {/* 1. GLOBAL LIVE CHAT ROOM (All Users + Admin) */}
              <button
                type="button"
                onClick={() => setSelectedTargetUid('GLOBAL')}
                className={`w-full p-3.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  selectedTargetUid === 'GLOBAL'
                    ? isDark
                      ? 'bg-pink-500/20 border-l-2 border-pink-500'
                      : 'bg-pink-50 border-l-2 border-pink-500'
                    : 'hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-pink-500 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold truncate">
                      {tr(profile, 'Global Live Chat (All Users)', 'පොදු සජීවී චැට් (සියලුම සාමාජිකයින්)')}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {tr(profile, 'Public lively room · Users & Admin', 'සියලුම සාමාජිකයින් සහ Admin සජීවීව')}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-400 shrink-0">
                  {messages.filter((m) => m.recipientUid === 'GLOBAL').length} msgs
                </span>
              </button>

              {/* 2. ALL USERS & OFFICIAL ADMIN FOR DIRECT MESSAGING */}
              {filteredDirectoryUsers.map((usr) => {
                const isSelected = selectedTargetUid === usr.uid;
                const dmCount = getDirectMessageCountWithUser(usr.uid);
                const vipObj = VIP_TIERS[usr.vipLevel || 0] || VIP_TIERS[0];
                return (
                  <button
                    key={usr.uid}
                    type="button"
                    onClick={() => setSelectedTargetUid(usr.uid)}
                    className={`w-full p-3.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-pink-500/20 border-l-2 border-pink-500'
                          : 'bg-pink-50 border-l-2 border-pink-500'
                        : 'hover:bg-slate-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-2xl font-extrabold text-xs flex items-center justify-center text-white shadow-sm ${
                            usr.isAdmin
                              ? 'bg-gradient-to-br from-amber-400 via-pink-500 to-rose-600'
                              : 'bg-gradient-to-br from-blue-500 to-pink-500'
                          }`}
                        >
                          {usr.isAdmin ? (
                            <Crown className="w-5 h-5" />
                          ) : (
                            usr.username.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#131b2e]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold truncate">
                            {usr.username}
                          </span>
                          {usr.isAdmin && (
                            <span className="text-[10px] font-mono font-bold text-amber-400">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {usr.isAdmin
                            ? tr(profile, 'Direct Message Official Admin', 'පරිපාලක (Admin) වෙත සෘජු පණිවිඩ')
                            : `${vipObj.name} · ${tr(profile, 'Direct Message', 'සෘජු පණිවිඩ')}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {dmCount > 0 ? (
                        <span className="text-[10px] font-mono font-bold text-pink-400">
                          {dmCount} DM
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400">Online</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT AREA: Active Conversation Feed & Message Composer */}
          <div className="lg:col-span-8 flex flex-col justify-between h-[520px] lg:h-[560px]">
            {/* Conversation Subheader */}
            <div
              className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
                isDark ? 'bg-[#141c2f] border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedTargetUid === 'GLOBAL' ? (
                  <>
                    <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-xs sm:text-sm font-extrabold">
                        {tr(
                          profile,
                          'Global Live Chat Room (All Members & Admin)',
                          'පොදු සජීවී චැට් මැදිරිය (සියලුම සාමාජිකයින් සහ Admin)'
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-pink-500 shrink-0" />
                    <div className="truncate">
                      <span className="text-xs sm:text-sm font-extrabold">
                        {tr(profile, 'Direct Message with:', 'සෘජු සංවාදය:')}{' '}
                        <span className="text-pink-500">
                          {selectedRecipientObj?.username}
                        </span>
                      </span>
                    </div>
                  </>
                )}
              </div>

              {selectedTargetUid !== 'GLOBAL' && (
                <button
                  type="button"
                  onClick={() => setSelectedTargetUid('GLOBAL')}
                  className="text-[11px] font-mono font-bold text-sky-400 hover:underline cursor-pointer shrink-0"
                >
                  {tr(profile, 'Switch to Global Chat', 'පොදු චැට් වෙත යන්න')}
                </button>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-3 ${
                isDark ? 'bg-[#0c1220]' : 'bg-slate-50/60'
              }`}
            >
              {activeConversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-pink-400/60" />
                  <div className="text-xs font-bold">
                    {selectedTargetUid === 'GLOBAL'
                      ? tr(
                          profile,
                          'No messages yet in Global Live Chat. Say hello!',
                          'තවම පණිවිඩ නොමැත. පළමු පණිවිඩය යොමු කරන්න!'
                        )
                      : tr(
                          profile,
                          `Start a lively Direct Message conversation with ${selectedRecipientObj?.username}!`,
                          `${selectedRecipientObj?.username} සමඟ සෘජු සංවාදයක් අරඹන්න!`
                        )}
                  </div>
                </div>
              ) : (
                activeConversationMessages.map((msg) => {
                  const isMine = msg.senderUid === senderIdentity.uid;
                  const senderVipObj = VIP_TIERS[msg.senderVipLevel || 0] || VIP_TIERS[0];
                  const timeStr = (() => {
                    try {
                      return new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    } catch {
                      return '';
                    }
                  })();

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.senderUid !== senderIdentity.uid) {
                              setSelectedTargetUid(msg.senderUid);
                            }
                          }}
                          className={`font-bold ${
                            msg.senderIsAdmin
                              ? 'text-amber-400'
                              : isMine
                                ? 'text-pink-400'
                                : 'text-sky-400 hover:underline cursor-pointer'
                          }`}
                          title={
                            !isMine
                              ? 'Click to send Direct Message to this user'
                              : undefined
                          }
                        >
                          {msg.senderIsAdmin
                            ? '👑 Zentro Official Admin'
                            : msg.senderUsername}
                        </button>
                        <span>·</span>
                        <span>
                          {msg.senderIsAdmin ? 'OFFICIAL HQ' : senderVipObj.name}
                        </span>
                        {timeStr && (
                          <>
                            <span>·</span>
                            <span>{timeStr}</span>
                          </>
                        )}
                        {(isAdminMode || isMine) && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = deleteLocalLiveChatMessage(msg.id);
                              setMessages(next);
                            }}
                            title="Delete message"
                            className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isMine
                            ? 'bg-gradient-to-r from-blue-600 via-pink-500 to-rose-500 text-white rounded-br-none'
                            : msg.senderIsAdmin
                              ? isDark
                                ? 'bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-400/40 text-white rounded-bl-none'
                                : 'bg-amber-50 border border-amber-300 text-slate-900 rounded-bl-none'
                              : isDark
                                ? 'bg-[#182238] border border-white/10 text-slate-100 rounded-bl-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Chips + Message Composer */}
            <div
              className={`p-3.5 border-t space-y-2.5 ${
                isDark ? 'bg-[#141c2f] border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  tr(profile, '👋 Hello everyone!', '👋 සුභ දවසක් සියලු දෙනාටම!'),
                  tr(profile, '💎 How to activate VIP?', '💎 VIP සක්‍රිය කරගන්නේ කෙසේද?'),
                  tr(profile, '✅ Please check my KYC / Deposit', '✅ මගේ KYC / Deposit පරීක්ෂා කරන්න'),
                  tr(profile, '🚀 Live Mining is awesome!', '🚀 Live Mining ඉතා සාර්ථකයි!'),
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setChatInput(chip)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    selectedTargetUid === 'GLOBAL'
                      ? tr(
                          profile,
                          'Write a lively message to all users & Admin...',
                          'සියලුම සාමාජිකයින්ට සහ Admin වෙත පණිවිඩයක් ලියන්න...'
                        )
                      : tr(
                          profile,
                          `Send a Direct Message to ${selectedRecipientObj?.username}...`,
                          `${selectedRecipientObj?.username} වෙත සෘජු පණිවිඩයක් යවන්න...`
                        )
                  }
                  className={`flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm border focus:outline-none ${
                    isDark
                      ? 'bg-[#0c1220] border-white/15 text-white focus:border-pink-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-pink-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={sending || !chatInput.trim()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{tr(profile, 'Send', 'යවන්න')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
        </motion.div>
      )}
    </div>
  );
};
