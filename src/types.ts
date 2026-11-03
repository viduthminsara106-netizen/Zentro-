import { normalizeLangCode, translateByLanguage } from './i18n';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  countryCode: string;
  mobile: string;
  country?: string;
  currency?: string;
  language?: string;
  deviceId?: string;
  macAddress?: string;
  ipAddress?: string;
  locationTracked?: string;
  securityPasswordHash: string;
  referralCode: string;
  referredBy: string;
  vipLevel: number;
  highestVipLevel?: number;
  balance: number;
  totalEarnings: number;
  tasksCompletedToday: number;
  completedTaskIdsToday?: string[];
  lastTaskCompletionDate?: string;
  claimedTeamTaskTiers?: number[];
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  mustUpgradeNextVip?: boolean;
  forceLogoutAt?: string;
  createdAt: any;
  updatedAt: any;
}

export interface DeviceSecurityTelemetry {
  deviceId: string;
  macAddress: string;
  ipAddress: string;
  location: string;
  hardwareSummary: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'vip_upgrade' | 'task_reward' | 'referral_bonus';
  amount: number;
  status: 'completed' | 'pending' | 'rejected';
  description: string;
  createdAt: any;
}

export interface BankAccountRecord {
  id: string;
  userId: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingOrSwift: string;
  createdAt: any;
}

export interface KycRecordData {
  id?: string;
  userId: string;
  username?: string;
  mobile?: string;
  country?: string;
  fullName: string;
  documentType: 'passport' | 'national_id' | 'driver_license';
  documentNumber: string;
  aiVerificationNotes: string;
  documentImageDataUrl?: string;
  documentBackImageDataUrl?: string;
  documentFileName?: string;
  documentBackFileName?: string;
  processingStage?: 'submitted' | 'processing' | 'verified' | 'rejected';
  adminNotes?: string;
  reviewedAt?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: any;
  updatedAt: any;
}

export interface ReferralRecordData {
  id: string;
  referrerUid: string;
  referredUsername: string;
  referralCodeUsed: string;
  tierLevel: number;
  vipLevel: number;
  commissionEarned: number;
  createdAt: any;
}

export interface CountryOption {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
  defaultCurrency: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'LK', dialCode: '+94', flag: '🇱🇰', name: 'Sri Lanka', defaultCurrency: 'LKR' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', name: 'United Kingdom', defaultCurrency: 'GBP' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'United States', defaultCurrency: 'USD' },
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', name: 'India', defaultCurrency: 'INR' },
  { code: 'SG', dialCode: '+65', flag: '🇸🇬', name: 'Singapore', defaultCurrency: 'SGD' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', name: 'United Arab Emirates', defaultCurrency: 'AED' },
  { code: 'AU', dialCode: '+61', flag: '🇦🇺', name: 'Australia', defaultCurrency: 'AUD' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Germany', defaultCurrency: 'EUR' },
  { code: 'JP', dialCode: '+81', flag: '🇯🇵', name: 'Japan', defaultCurrency: 'JPY' },
  { code: 'MY', dialCode: '+60', flag: '🇲🇾', name: 'Malaysia', defaultCurrency: 'MYR' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'France', defaultCurrency: 'EUR' },
  { code: 'CA', dialCode: '+1-CA', flag: '🇨🇦', name: 'Canada', defaultCurrency: 'CAD' },
  { code: 'BR', dialCode: '+55', flag: '🇧🇷', name: 'Brazil', defaultCurrency: 'BRL' },
  { code: 'ZA', dialCode: '+27', flag: '🇿🇦', name: 'South Africa', defaultCurrency: 'ZAR' },
];

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  /** How many LKR equal 1 unit of this currency (base LKR = 1) */
  lkrPerUnit: number;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', flag: '🇱🇰', lkrPerUnit: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', lkrPerUnit: 300 },
  { code: 'USDT', symbol: 'USDT', name: 'Tether (USDT)', flag: '🌐', lkrPerUnit: 300 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', lkrPerUnit: 380 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', lkrPerUnit: 325 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', lkrPerUnit: 3.6 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', lkrPerUnit: 81.7 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', lkrPerUnit: 222 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', lkrPerUnit: 195 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', lkrPerUnit: 68 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', lkrPerUnit: 215 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', lkrPerUnit: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', lkrPerUnit: 52 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', lkrPerUnit: 16.5 },
];

export interface LanguageOption {
  code: string;
  label: string;
}

// English is first by default; Sinhala or any other language can be selected and used whenever the user chooses
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'English', label: 'English' },
  { code: 'Sinhala', label: 'Sinhala (සිංහල)' },
  { code: 'Tamil', label: 'Tamil (தமிழ்)' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Malay', label: 'Malay (Bahasa Melayu)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
];

export function getActiveLanguage(
  profileOrLang?: UserProfile | string | null
): string {
  if (typeof profileOrLang === 'string' && profileOrLang.trim().length > 0) {
    return normalizeLangCode(profileOrLang);
  }
  if (
    profileOrLang &&
    typeof profileOrLang === 'object' &&
    profileOrLang.language &&
    profileOrLang.language.trim().length > 0
  ) {
    return normalizeLangCode(profileOrLang.language);
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('zentro_active_language_v1');
    if (stored && stored.trim().length > 0) {
      return normalizeLangCode(stored);
    }
  }
  return 'English';
}

export function isSinhalaLanguage(
  profileOrLang: UserProfile | string | null | undefined
): boolean {
  return getActiveLanguage(profileOrLang) === 'Sinhala';
}

export function tr(
  profileOrLang: UserProfile | string | null | undefined,
  enText: string,
  siText: string
): string {
  const activeLang = getActiveLanguage(profileOrLang);
  return translateByLanguage(activeLang, enText, siText);
}

export function isProfileSetupComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.country &&
      profile.country.trim().length > 0 &&
      profile.currency &&
      profile.currency.trim().length > 0 &&
      profile.language &&
      profile.language.trim().length > 0
  );
}

export function getActiveCurrency(profile: UserProfile | null | undefined): string {
  return profile?.currency?.trim() || 'LKR';
}

const HIGHEST_VIP_STORAGE_PREFIX = 'zentro_highest_vip_v1_';

export function getHighestVipLevel(profile: UserProfile | null | undefined): number {
  if (!profile) return 0;
  let storedHighest = 0;
  if (typeof window !== 'undefined' && profile.uid) {
    try {
      const raw = localStorage.getItem(`${HIGHEST_VIP_STORAGE_PREFIX}${profile.uid}`);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          storedHighest = parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  const highest = Math.max(
    profile.vipLevel || 0,
    profile.highestVipLevel || 0,
    storedHighest
  );
  if (typeof window !== 'undefined' && profile.uid && highest > storedHighest) {
    try {
      localStorage.setItem(`${HIGHEST_VIP_STORAGE_PREFIX}${profile.uid}`, String(highest));
    } catch {
      // ignore
    }
  }
  return highest;
}

export function recordHighestVipLevel(uid: string, level: number): number {
  if (typeof window === 'undefined' || !uid) return level;
  try {
    const raw = localStorage.getItem(`${HIGHEST_VIP_STORAGE_PREFIX}${uid}`);
    const prev = raw !== null ? parseInt(raw, 10) || 0 : 0;
    const next = Math.max(prev, level);
    localStorage.setItem(`${HIGHEST_VIP_STORAGE_PREFIX}${uid}`, String(next));
    return next;
  } catch {
    return level;
  }
}

export function getLkrPerUnitForCurrency(currency?: string): number {
  const code = (currency?.trim() || 'LKR').toUpperCase();
  const found = CURRENCY_OPTIONS.find((c) => c.code === code);
  return found ? found.lkrPerUnit : 1;
}

export function convertFromLkr(amountInLkr: number, currency?: string): number {
  const code = (currency?.trim() || 'LKR').toUpperCase();
  const lkrPerUnit = getLkrPerUnitForCurrency(code);
  if (lkrPerUnit === 1) {
    return Number(amountInLkr.toFixed(2));
  }
  const raw = amountInLkr / lkrPerUnit;
  return Number(raw.toFixed(2));
}

export function convertToLkr(amountInCurrency: number, currency?: string): number {
  const code = (currency?.trim() || 'LKR').toUpperCase();
  const lkrPerUnit = getLkrPerUnitForCurrency(code);
  if (lkrPerUnit === 1) {
    return Number(amountInCurrency.toFixed(2));
  }
  return Number((amountInCurrency * lkrPerUnit).toFixed(2));
}

export function formatCurrencyValue(amountInLkr: number, currency?: string): string {
  const converted = convertFromLkr(amountInLkr, currency);
  const isWhole = Math.abs(converted - Math.round(converted)) < 0.001;
  return converted.toLocaleString(undefined, {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatSiteAmount(amountInLkr: number, currency?: string): string {
  const code = (currency?.trim() || 'LKR').toUpperCase();
  return `${formatCurrencyValue(amountInLkr, code)} ${code}`;
}

export function replaceCurrencyInText(text: string, currency?: string): string {
  const code = (currency?.trim() || 'LKR').toUpperCase();
  const withConvertedNumbers = text.replace(
    /(\d[\d,]*(?:\.\d+)?)\s*LKR\b/g,
    (_match, rawNum: string) => {
      const parsed = Number(rawNum.replace(/,/g, ''));
      if (Number.isNaN(parsed)) return `${rawNum} ${code}`;
      return `${formatCurrencyValue(parsed, code)} ${code}`;
    }
  );
  return withConvertedNumbers.replace(/\bLKR\b/g, code);
}

// Deterministic hash helper for hardware/device/MAC fingerprinting
function hashStringDeterministic(input: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function computeCanvasHardwareSignature(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    ctx.textBaseline = 'top';
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(10, 4, 90, 24);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillText('ZENTRO-HW-MAC-LOCK', 6, 12);
    return canvas.toDataURL().slice(-64);
  } catch {
    return 'canvas-fallback';
  }
}

export function getDeterministicDeviceAndMac(): {
  deviceId: string;
  macAddress: string;
  hardwareSummary: string;
  timezoneLocation: string;
} {
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
  const scr = typeof window !== 'undefined' && window.screen ? window.screen : ({} as any);
  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC';
  const canvasSig = typeof document !== 'undefined' ? computeCanvasHardwareSignature() : 'srv';

  const rawHardwareEntropy = [
    nav.userAgent || 'ua',
    nav.platform || 'plat',
    `${scr.width || 1920}x${scr.height || 1080}x${scr.colorDepth || 24}`,
    String(nav.hardwareConcurrency || 4),
    String((nav as any).deviceMemory || 8),
    tz,
    canvasSig,
  ].join('|');

  const h1 = hashStringDeterministic(rawHardwareEntropy, 0x811c9dc5);
  const h2 = hashStringDeterministic(rawHardwareEntropy, 0x9e3779b9);

  // Persist hardware device ID & MAC so they stay locked across sessions on this device
  let savedDeviceId = '';
  let savedMac = '';
  try {
    savedDeviceId = localStorage.getItem('zentro_hw_device_id_v1') || '';
    savedMac = localStorage.getItem('zentro_hw_mac_id_v1') || '';
  } catch {
    // ignore
  }

  const computedDeviceId = `ZNT-DEV-${h1.toString(16).toUpperCase().padStart(8, '0')}`;
  const macBytes = [
    (h1 >>> 24) & 0xfe, // unicast locally administered hardware MAC format
    (h1 >>> 16) & 0xff,
    (h1 >>> 8) & 0xff,
    h1 & 0xff,
    (h2 >>> 8) & 0xff,
    h2 & 0xff,
  ].map((b) => b.toString(16).toUpperCase().padStart(2, '0'));
  const computedMac = macBytes.join(':');

  const deviceId = savedDeviceId || computedDeviceId;
  const macAddress = savedMac || computedMac;

  try {
    localStorage.setItem('zentro_hw_device_id_v1', deviceId);
    localStorage.setItem('zentro_hw_mac_id_v1', macAddress);
  } catch {
    // ignore
  }

  const platformName = nav.platform || 'Device';
  const cores = nav.hardwareConcurrency ? `${nav.hardwareConcurrency}C` : '';
  const resLabel = `${scr.width || 0}x${scr.height || 0}`;

  return {
    deviceId,
    macAddress,
    hardwareSummary: `${platformName} ${cores} (${resLabel})`.trim(),
    timezoneLocation: tz,
  };
}

export async function collectDeviceSecurityTelemetry(): Promise<DeviceSecurityTelemetry> {
  const base = getDeterministicDeviceAndMac();
  let ipAddress = localStorage.getItem('zentro_tracked_ip_v1') || '';
  let location = localStorage.getItem('zentro_tracked_loc_v1') || base.timezoneLocation;
  let macAddress = base.macAddress;

  try {
    const srvRes = await fetch('/api/security/device-telemetry');
    if (srvRes.ok) {
      const srvData = await srvRes.json();
      if (srvData.ipAddress && srvData.ipAddress !== '127.0.0.1' && srvData.ipAddress !== '::1') {
        ipAddress = srvData.ipAddress;
      }
      if (srvData.serverMac && !localStorage.getItem('zentro_hw_mac_id_v1')) {
        macAddress = srvData.serverMac;
      }
    }
  } catch {
    // continue to fallback
  }

  try {
    const geoRes = await fetch('https://ipapi.co/json/');
    if (geoRes.ok) {
      const geo = await geoRes.json();
      if (geo.ip) {
        ipAddress = geo.ip;
      }
      const locParts = [geo.city, geo.region, geo.country_name].filter(Boolean);
      if (locParts.length > 0) {
        location = `${locParts.join(', ')} (${base.timezoneLocation})`;
      }
    }
  } catch {
    // fallback if ipapi is rate-limited
    if (!ipAddress) {
      try {
        const ipifyRes = await fetch('https://api.ipify.org?format=json');
        if (ipifyRes.ok) {
          const ipify = await ipifyRes.json();
          if (ipify.ip) ipAddress = ipify.ip;
        }
      } catch {
        // ignore
      }
    }
  }

  if (!ipAddress) {
    // Deterministic session IP representation if offline/proxied
    const hIp = hashStringDeterministic(base.deviceId + base.macAddress, 0x12345678);
    ipAddress = `112.134.${(hIp >>> 8) & 0xff}.${(hIp & 0xfd) + 1}`;
  }

  try {
    localStorage.setItem('zentro_tracked_ip_v1', ipAddress);
    localStorage.setItem('zentro_tracked_loc_v1', location);
  } catch {
    // ignore
  }

  return {
    deviceId: base.deviceId,
    macAddress,
    ipAddress,
    location,
    hardwareSummary: base.hardwareSummary,
  };
}

export interface DeviceAccountLockRecord {
  uid: string;
  username: string;
  email: string;
  deviceId: string;
  macAddress: string;
  ipAddress: string;
  location: string;
  lockedAt: string;
}

export function getExistingDeviceAccountLock(
  telemetry?: Partial<DeviceSecurityTelemetry>
): DeviceAccountLockRecord | null {
  try {
    const hw = getDeterministicDeviceAndMac();
    const targetDeviceId = telemetry?.deviceId || hw.deviceId;
    const targetMac = telemetry?.macAddress || hw.macAddress;
    const targetIp = telemetry?.ipAddress || localStorage.getItem('zentro_tracked_ip_v1') || '';

    // 1. Check dedicated hardware lock entry
    const rawLock = localStorage.getItem('zentro_device_account_lock_v1');
    if (rawLock) {
      const parsed: DeviceAccountLockRecord = JSON.parse(rawLock);
      if (parsed && parsed.username) {
        return parsed;
      }
    }

    // 2. Check local accounts database for any account already created on this device/MAC/IP
    const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
    if (rawAccounts) {
      const accounts: Record<string, { profile: UserProfile; password: string }> =
        JSON.parse(rawAccounts);
      const allProfiles = Object.values(accounts).map((a) => a.profile);
      if (allProfiles.length > 0) {
        const matched =
          allProfiles.find(
            (p) =>
              (p.deviceId && p.deviceId === targetDeviceId) ||
              (p.macAddress && p.macAddress === targetMac) ||
              (targetIp && p.ipAddress && p.ipAddress === targetIp)
          ) || allProfiles[0];

        if (matched) {
          return {
            uid: matched.uid,
            username: matched.username,
            email: matched.email,
            deviceId: matched.deviceId || targetDeviceId,
            macAddress: matched.macAddress || targetMac,
            ipAddress: matched.ipAddress || targetIp || 'Tracked IP',
            location: matched.locationTracked || hw.timezoneLocation,
            lockedAt: String(matched.createdAt || new Date().toISOString()),
          };
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function bindDeviceAccountLock(record: DeviceAccountLockRecord): void {
  try {
    localStorage.setItem('zentro_device_account_lock_v1', JSON.stringify(record));
  } catch {
    // ignore
  }
}

export interface DepositCommissionLevel {
  level: number;
  label: string;
  ratePercent: number;
  rate: number;
}

export interface VipTierConfig {
  level: number;
  name: string;
  audience: string;
  imageUrl: string;
  unlockAmount: number;
  dailyMiningRatePercent: number;
  dailyMiningRate: number;
  dailyTasks: number;
  rewardPerTask: number;
  dailyYield: number;
  annualReturn: number;
  registrationBonusPerFriend: number;
  teamTaskLabel: string;
  teamTaskReward: number;
  commissionRates: string;
  commissionLevels: DepositCommissionLevel[];
  benefits: string[];
}

export const VIP_TIER_IMAGES: Record<number, string> = {
  0:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <defs>
    <linearGradient id="stBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="stShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#94a3b8"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <radialGradient id="stGlow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="200" rx="24" fill="url(#stBg)"/>
  <circle cx="160" cy="95" r="85" fill="url(#stGlow)"/>
  <circle cx="160" cy="90" r="56" fill="none" stroke="#38bdf8" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="4 4"/>
  <polygon points="160,32 204,54 196,112 160,142 124,112 116,54" fill="url(#stShield)" stroke="#f8fafc" stroke-width="2"/>
  <polygon points="160,44 192,60 186,106 160,129 134,106 128,60" fill="#0f172a" opacity="0.82"/>
  <polygon points="160,58 167,75 185,77 171,89 175,107 160,97 145,107 149,89 135,77 153,75" fill="#38bdf8"/>
  <rect x="92" y="156" width="136" height="26" rx="13" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
  <text x="160" y="173" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-weight="800" font-size="11" letter-spacing="1.5">STARTER · VIP 0</text>
</svg>`),
  1:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <defs>
    <linearGradient id="brBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#271206"/>
      <stop offset="50%" stop-color="#451a03"/>
      <stop offset="100%" stop-color="#140803"/>
    </linearGradient>
    <linearGradient id="brMetal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="35%" stop-color="#d97706"/>
      <stop offset="70%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
    <radialGradient id="brGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#271206" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="200" rx="24" fill="url(#brBg)"/>
  <circle cx="160" cy="92" r="90" fill="url(#brGlow)"/>
  <path d="M72,96 C92,70 110,66 124,76 L112,108 C94,104 82,102 72,96 Z" fill="url(#brMetal)" opacity="0.85"/>
  <path d="M248,96 C228,70 210,66 196,76 L208,108 C226,104 238,102 248,96 Z" fill="url(#brMetal)" opacity="0.85"/>
  <polygon points="160,24 210,50 200,114 160,146 120,114 110,50" fill="url(#brMetal)" stroke="#fef3c7" stroke-width="2.5"/>
  <polygon points="160,36 198,56 190,106 160,132 130,106 122,56" fill="#291002"/>
  <path d="M136,88 L144,64 L160,78 L176,64 L184,88 Z" fill="url(#brMetal)"/>
  <circle cx="160" cy="56" r="4" fill="#fef3c7"/>
  <text x="160" y="112" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-weight="900" font-size="14" letter-spacing="1">6% DAILY</text>
  <rect x="78" y="156" width="164" height="28" rx="14" fill="#451a03" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="160" y="174" text-anchor="middle" fill="#fef3c7" font-family="sans-serif" font-weight="900" font-size="11.5" letter-spacing="1.5">ZENTRO BRONZE · VIP 1</text>
</svg>`),
  2:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <defs>
    <linearGradient id="slBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081b33"/>
      <stop offset="50%" stop-color="#0f294a"/>
      <stop offset="100%" stop-color="#050e1c"/>
    </linearGradient>
    <linearGradient id="slMetal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#7dd3fc"/>
      <stop offset="70%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <radialGradient id="slGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#081b33" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="200" rx="24" fill="url(#slBg)"/>
  <circle cx="160" cy="92" r="92" fill="url(#slGlow)"/>
  <path d="M62,88 C86,58 108,56 122,70 L108,110 C86,104 72,98 62,88 Z" fill="url(#slMetal)" opacity="0.9"/>
  <path d="M258,88 C234,58 212,56 198,70 L212,110 C234,104 248,98 258,88 Z" fill="url(#slMetal)" opacity="0.9"/>
  <polygon points="160,20 214,48 204,114 160,148 116,114 106,48" fill="url(#slMetal)" stroke="#ffffff" stroke-width="2.5"/>
  <polygon points="160,33 201,55 193,106 160,134 127,106 119,55" fill="#07182e"/>
  <path d="M132,86 L142,58 L160,75 L178,58 L188,86 Z" fill="url(#slMetal)"/>
  <circle cx="142" cy="53" r="3.5" fill="#ffffff"/>
  <circle cx="160" cy="50" r="4.5" fill="#38bdf8"/>
  <circle cx="178" cy="53" r="3.5" fill="#ffffff"/>
  <text x="160" y="112" text-anchor="middle" fill="#7dd3fc" font-family="sans-serif" font-weight="900" font-size="14" letter-spacing="1">8% DAILY</text>
  <rect x="76" y="156" width="168" height="28" rx="14" fill="#0c2544" stroke="#38bdf8" stroke-width="1.5"/>
  <text x="160" y="174" text-anchor="middle" fill="#f0f9ff" font-family="sans-serif" font-weight="900" font-size="11.5" letter-spacing="1.5">ZENTRO SILVER · VIP 2</text>
</svg>`),
  3:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <defs>
    <linearGradient id="gdBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#310a1e"/>
      <stop offset="50%" stop-color="#4c0519"/>
      <stop offset="100%" stop-color="#19040e"/>
    </linearGradient>
    <linearGradient id="gdMetal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="35%" stop-color="#f59e0b"/>
      <stop offset="70%" stop-color="#fda4af"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <radialGradient id="gdGlow" cx="50%" cy="45%" r="58%">
      <stop offset="0%" stop-color="#fb7185" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#310a1e" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="200" rx="24" fill="url(#gdBg)"/>
  <circle cx="160" cy="90" r="95" fill="url(#gdGlow)"/>
  <path d="M52,82 C78,48 106,48 122,66 L106,112 C80,104 64,96 52,82 Z" fill="url(#gdMetal)"/>
  <path d="M268,82 C242,48 214,48 198,66 L214,112 C240,104 256,96 268,82 Z" fill="url(#gdMetal)"/>
  <polygon points="160,16 218,46 208,116 160,150 112,116 102,46" fill="url(#gdMetal)" stroke="#fef08a" stroke-width="2.5"/>
  <polygon points="160,30 204,53 196,108 160,136 124,108 116,53" fill="#260513"/>
  <path d="M128,86 L138,54 L152,72 L160,50 L168,72 L182,54 L192,86 Z" fill="url(#gdMetal)"/>
  <circle cx="160" cy="44" r="5" fill="#fef08a"/>
  <circle cx="138" cy="49" r="3.5" fill="#fda4af"/>
  <circle cx="182" cy="49" r="3.5" fill="#fda4af"/>
  <text x="160" y="113" text-anchor="middle" fill="#fde047" font-family="sans-serif" font-weight="900" font-size="14" letter-spacing="1">10% DAILY</text>
  <rect x="78" y="156" width="164" height="28" rx="14" fill="#4c0519" stroke="#fbbf24" stroke-width="1.5"/>
  <text x="160" y="174" text-anchor="middle" fill="#fef9c3" font-family="sans-serif" font-weight="900" font-size="11.5" letter-spacing="1.5">ZENTRO GOLD · VIP 3</text>
</svg>`),
  4:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <defs>
    <linearGradient id="plBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d2a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#2e0727"/>
    </linearGradient>
    <linearGradient id="plMetal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="35%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <radialGradient id="plGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.65"/>
      <stop offset="50%" stop-color="#ec4899" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#090d2a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="200" rx="24" fill="url(#plBg)"/>
  <circle cx="160" cy="90" r="98" fill="url(#plGlow)"/>
  <path d="M44,76 C72,38 104,42 122,64 L104,114 C74,104 56,92 44,76 Z" fill="url(#plMetal)"/>
  <path d="M276,76 C248,38 216,42 198,64 L216,114 C246,104 264,92 276,76 Z" fill="url(#plMetal)"/>
  <polygon points="160,14 222,45 210,118 160,152 110,118 98,45" fill="url(#plMetal)" stroke="#ffffff" stroke-width="2.5"/>
  <polygon points="160,28 208,52 198,109 160,138 122,109 112,52" fill="#0d102b"/>
  <polygon points="160,42 178,62 160,88 142,62" fill="url(#plMetal)"/>
  <path d="M126,86 L136,52 L150,70 L160,44 L170,70 L184,52 L194,86 Z" fill="url(#plMetal)" opacity="0.9"/>
  <circle cx="160" cy="38" r="5" fill="#ffffff"/>
  <text x="160" y="114" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-weight="900" font-size="14.5" letter-spacing="1">12% DAILY</text>
  <rect x="66" y="156" width="188" height="28" rx="14" fill="#1e1b4b" stroke="#f472b6" stroke-width="1.8"/>
  <text x="160" y="174" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="11.5" letter-spacing="1.5">ZENTRO PLATINUM · VIP 4</text>
</svg>`),
};

export const BRONZE_COMMISSION_LEVELS: DepositCommissionLevel[] = [
  { level: 1, label: 'Level 1', ratePercent: 10, rate: 0.1 },
  { level: 2, label: 'Level 2', ratePercent: 6, rate: 0.06 },
  { level: 3, label: 'Level 3', ratePercent: 2, rate: 0.02 },
  { level: 4, label: 'Level 4', ratePercent: 1, rate: 0.01 },
  { level: 5, label: 'Level 5', ratePercent: 1, rate: 0.01 },
];

export const SILVER_COMMISSION_LEVELS: DepositCommissionLevel[] = [
  { level: 1, label: 'Level 1', ratePercent: 15, rate: 0.15 },
  { level: 2, label: 'Level 2', ratePercent: 10, rate: 0.1 },
  { level: 3, label: 'Level 3', ratePercent: 6, rate: 0.06 },
  { level: 4, label: 'Level 4', ratePercent: 2, rate: 0.02 },
  { level: 5, label: 'Level 5', ratePercent: 1, rate: 0.01 },
];

export const GOLD_COMMISSION_LEVELS: DepositCommissionLevel[] = [
  { level: 1, label: 'Level 1', ratePercent: 20, rate: 0.2 },
  { level: 2, label: 'Level 2', ratePercent: 12, rate: 0.12 },
  { level: 3, label: 'Level 3', ratePercent: 8, rate: 0.08 },
  { level: 4, label: 'Level 4', ratePercent: 3, rate: 0.03 },
  { level: 5, label: 'Level 5', ratePercent: 1, rate: 0.01 },
];

export const PLATINUM_COMMISSION_LEVELS: DepositCommissionLevel[] = [
  { level: 1, label: 'Level 1', ratePercent: 25, rate: 0.25 },
  { level: 2, label: 'Level 2', ratePercent: 16, rate: 0.16 },
  { level: 3, label: 'Level 3', ratePercent: 12, rate: 0.12 },
  { level: 4, label: 'Level 4', ratePercent: 5, rate: 0.05 },
  { level: 5, label: 'Level 5', ratePercent: 3, rate: 0.03 },
];

export const DEPOSIT_REFERRAL_COMMISSION_LEVELS = BRONZE_COMMISSION_LEVELS;

export function getCommissionLevelsForVip(vipLevel: number): DepositCommissionLevel[] {
  const matched = VIP_TIERS.find((v) => v.level === vipLevel);
  if (matched && Array.isArray(matched.commissionLevels) && matched.commissionLevels.length > 0) {
    return matched.commissionLevels;
  }
  if (vipLevel >= 4) {
    return PLATINUM_COMMISSION_LEVELS;
  }
  if (vipLevel === 3) {
    return GOLD_COMMISSION_LEVELS;
  }
  if (vipLevel === 2) {
    return SILVER_COMMISSION_LEVELS;
  }
  return BRONZE_COMMISSION_LEVELS;
}

export function getFriendRegistrationBonusForVip(vipLevel: number): number {
  const matched = VIP_TIERS.find((v) => v.level === vipLevel);
  if (matched && typeof matched.registrationBonusPerFriend === 'number') {
    return matched.registrationBonusPerFriend;
  }
  if (vipLevel >= 4) {
    return 100;
  }
  if (vipLevel === 3) {
    return 50;
  }
  if (vipLevel === 2) {
    return 30;
  }
  if (vipLevel === 1) {
    return 10;
  }
  return 0;
}

export function getDailyMiningRatePercentForVip(vipLevel: number): number {
  const matched = VIP_TIERS.find((v) => v.level === vipLevel);
  if (matched && typeof matched.dailyMiningRatePercent === 'number') {
    return matched.dailyMiningRatePercent;
  }
  if (vipLevel >= 4) return 12;
  if (vipLevel === 3) return 10;
  if (vipLevel === 2) return 8;
  if (vipLevel === 1) return 6;
  return 0;
}

export const DEFAULT_VIP_TIERS: VipTierConfig[] = [
  {
    level: 0,
    name: 'Starter Member (Non-VIP)',
    audience: 'For newly registered members',
    imageUrl: VIP_TIER_IMAGES[0],
    unlockAmount: 0,
    dailyMiningRatePercent: 0,
    dailyMiningRate: 0,
    dailyTasks: 2,
    rewardPerTask: 15,
    dailyYield: 30,
    annualReturn: 10950,
    registrationBonusPerFriend: 0,
    teamTaskLabel: 'Upgrade to Zentro Bronze, Silver, Gold, or Platinum to unlock team tasks',
    teamTaskReward: 0,
    commissionRates: 'Referral Locked (VIP Required)',
    commissionLevels: BRONZE_COMMISSION_LEVELS,
    benefits: [
      'Selected Currency Live Mining Locked (Activate Bronze 6% – Platinum 12%)',
      'Referral Link Locked (Activate Zentro Bronze or higher)',
      'Basic platform access',
    ],
  },
  {
    level: 1,
    name: 'Zentro Bronze',
    audience: 'Share your Link and Promote our platform',
    imageUrl: VIP_TIER_IMAGES[1],
    unlockAmount: 1000,
    dailyMiningRatePercent: 6,
    dailyMiningRate: 0.06,
    dailyTasks: 5,
    rewardPerTask: 25,
    dailyYield: 125,
    annualReturn: 45625,
    registrationBonusPerFriend: 10,
    teamTaskLabel: 'Build 5 deposit members team - 500 LKR',
    teamTaskReward: 500,
    commissionRates: 'L1: 10% · L2: 6% · L3: 2% · L4: 1% · L5: 1%',
    commissionLevels: BRONZE_COMMISSION_LEVELS,
    benefits: [
      'Selected Currency Live Mining: Daily 6%',
      'Share your Link and Promote our platform',
      'Registration only members: 1 Friend registration = 10 LKR',
      'Task: Build 5 deposit members team = 500 LKR',
      'Deposit Referral Commission: L1 10% · L2 6% · L3 2% · L4 1% · L5 1%',
    ],
  },
  {
    level: 2,
    name: 'Zentro Silver',
    audience: 'Silver VIP Benefits · Higher Registration & Deposit Commissions',
    imageUrl: VIP_TIER_IMAGES[2],
    unlockAmount: 3500,
    dailyMiningRatePercent: 8,
    dailyMiningRate: 0.08,
    dailyTasks: 8,
    rewardPerTask: 55,
    dailyYield: 440,
    annualReturn: 160600,
    registrationBonusPerFriend: 30,
    teamTaskLabel: 'Build 5 deposit members - 1,500 LKR',
    teamTaskReward: 1500,
    commissionRates: 'L1: 15% · L2: 10% · L3: 6% · L4: 2% · L5: 1%',
    commissionLevels: SILVER_COMMISSION_LEVELS,
    benefits: [
      'Selected Currency Live Mining: Daily 8%',
      'Registration only members: 1 Friend registration = 30 LKR',
      'Task: Build 5 deposit members = 1,500 LKR',
      'Deposit Referral Commission: L1 15% · L2 10% · L3 6% · L4 2% · L5 1%',
    ],
  },
  {
    level: 3,
    name: 'Zentro Gold',
    audience: 'Share your Link and Promote our platform',
    imageUrl: VIP_TIER_IMAGES[3],
    unlockAmount: 5000,
    dailyMiningRatePercent: 10,
    dailyMiningRate: 0.1,
    dailyTasks: 10,
    rewardPerTask: 70,
    dailyYield: 700,
    annualReturn: 255500,
    registrationBonusPerFriend: 50,
    teamTaskLabel: 'Build 5 deposit members team - 3,000 LKR',
    teamTaskReward: 3000,
    commissionRates: 'L1: 20% · L2: 12% · L3: 8% · L4: 3% · L5: 1%',
    commissionLevels: GOLD_COMMISSION_LEVELS,
    benefits: [
      'Selected Currency Live Mining: Daily 10%',
      'Share your Link and Promote our platform',
      'Registration only members: 1 Friend registration = 50 LKR',
      'Task: Build 5 deposit members team = 3,000 LKR',
      'Deposit Referral Commission: L1 20% · L2 12% · L3 8% · L4 3% · L5 1%',
    ],
  },
  {
    level: 4,
    name: 'Zentro Platinum',
    audience: 'Share your Link and Promote our platform',
    imageUrl: VIP_TIER_IMAGES[4],
    unlockAmount: 10000,
    dailyMiningRatePercent: 12,
    dailyMiningRate: 0.12,
    dailyTasks: 15,
    rewardPerTask: 100,
    dailyYield: 1500,
    annualReturn: 547500,
    registrationBonusPerFriend: 100,
    teamTaskLabel: 'Build 5 deposit members team - 5,000 LKR',
    teamTaskReward: 5000,
    commissionRates: 'L1: 25% · L2: 16% · L3: 12% · L4: 5% · L5: 3%',
    commissionLevels: PLATINUM_COMMISSION_LEVELS,
    benefits: [
      'Selected Currency Live Mining: Daily 12%',
      'Share your Link and Promote our platform',
      'Registration only members: 1 Friend registration = 100 LKR',
      'Task: Build 5 deposit members team = 5,000 LKR',
      'Deposit Referral Commission: L1 25% · L2 16% · L3 12% · L4 5% · L5 3%',
    ],
  },
];

export const VIP_TIERS: VipTierConfig[] = DEFAULT_VIP_TIERS.map((t) => ({
  ...t,
  commissionLevels: t.commissionLevels.map((c) => ({ ...c })),
  benefits: [...t.benefits],
}));

export const OFFICIAL_REFERRAL_CODES = [
  'ZENTRO-VIP888',
  'ZENTRO-ALPHA1',
  'ZENTRO-PRIME9',
  'ZENTRO-BIO2026',
];

export function isValidReferralCodeFormat(code: string): boolean {
  const clean = code.trim().toUpperCase();
  return OFFICIAL_REFERRAL_CODES.includes(clean) || /^ZENTRO-[A-Z0-9]{4,12}$/.test(clean);
}

export interface ZentroPlatformTask {
  id: string;
  title: string;
  category: string;
  minVipLevel: number;
  reward: number;
  durationSec: number;
  description: string;
  targetDepositMembers?: number;
  taskType?: 'daily' | 'team_milestone';
}

export const DEFAULT_PLATFORM_DAILY_TASKS: ZentroPlatformTask[] = [
  // ================= VIP TEAM MILESTONE TASKS (5 DEPOSIT MEMBERS) =================
  {
    id: 'task_build_5_deposit_team',
    title: 'Build 5 Deposit Members Team (Bronze Task)',
    category: 'Zentro Bronze Team Task',
    minVipLevel: 1,
    reward: 500,
    durationSec: 2,
    targetDepositMembers: 5,
    taskType: 'team_milestone',
    description:
      'Zentro Bronze Task: Share your link, promote our platform, and build a 5 deposit members team to earn 500 LKR.',
  },
  {
    id: 'task_silver_build_5_deposit_team',
    title: 'Build 5 Deposit Members (Silver Task)',
    category: 'Zentro Silver Team Task',
    minVipLevel: 2,
    reward: 1500,
    durationSec: 2,
    targetDepositMembers: 5,
    taskType: 'team_milestone',
    description:
      'Zentro Silver Task: Build 5 deposit members in your team to claim 1,500 LKR instant reward.',
  },
  {
    id: 'task_gold_build_5_deposit_team',
    title: 'Build 5 Deposit Members Team (Gold Task)',
    category: 'Zentro Gold Team Task',
    minVipLevel: 3,
    reward: 3000,
    durationSec: 2,
    targetDepositMembers: 5,
    taskType: 'team_milestone',
    description:
      'Zentro Gold Task: Share your Link and Promote our platform — Build a 5 deposit members team to claim 3,000 LKR.',
  },
  {
    id: 'task_platinum_build_5_deposit_team',
    title: 'Build 5 Deposit Members Team (Platinum Task)',
    category: 'Zentro Platinum Team Task',
    minVipLevel: 4,
    reward: 5000,
    durationSec: 2,
    targetDepositMembers: 5,
    taskType: 'team_milestone',
    description:
      'Zentro Platinum Task: Share your Link and Promote our platform — Build a 5 deposit members team to claim 5,000 LKR.',
  },

  // ================= STARTER (VIP 0) DAILY TASKS (2 Tasks @ 15 LKR) =================
  {
    id: 'task_starter_1',
    title: 'Starter Daily Check-In & Sponsor Node Sync #1',
    category: 'Starter (VIP 0)',
    minVipLevel: 0,
    reward: 15,
    durationSec: 2,
    taskType: 'daily',
    description: 'Complete Starter Member daily platform check-in and verify sponsor node status.',
  },
  {
    id: 'task_starter_2',
    title: 'Starter Global Currency Feed Verification #2',
    category: 'Starter (VIP 0)',
    minVipLevel: 0,
    reward: 15,
    durationSec: 2,
    taskType: 'daily',
    description: 'Confirm real-time exchange rate synchronization for your selected currency.',
  },

  // ================= ZENTRO BRONZE (VIP 1) DAILY TASKS (5 Tasks @ 25 LKR) =================
  {
    id: 'task_bronze_verify',
    title: 'Zentro Bronze Merchant Order Verification #1',
    category: 'Zentro Bronze (VIP 1)',
    minVipLevel: 1,
    reward: 25,
    durationSec: 2,
    taskType: 'daily',
    description: 'Verify Zentro Bronze partner order completion and release 25 LKR daily reward.',
  },
  {
    id: 'task_egfr_docking',
    title: 'Zentro Bronze Sponsor Liquidity Dispatch #2',
    category: 'Zentro Bronze (VIP 1)',
    minVipLevel: 1,
    reward: 25,
    durationSec: 2,
    taskType: 'daily',
    description: 'Validate Bronze tier cross-border sponsor liquidity batch settlement.',
  },
  {
    id: 'task_bronze_3',
    title: 'Zentro Bronze Brand Promotion Audit #3',
    category: 'Zentro Bronze (VIP 1)',
    minVipLevel: 1,
    reward: 25,
    durationSec: 2,
    taskType: 'daily',
    description: 'Audit Bronze partner digital campaign impressions and confirm payout.',
  },
  {
    id: 'task_bronze_4',
    title: 'Zentro Bronze Mining Pool Hashrate Sync #4',
    category: 'Zentro Bronze (VIP 1)',
    minVipLevel: 1,
    reward: 25,
    durationSec: 2,
    taskType: 'daily',
    description: 'Synchronize Bronze 6% daily currency mining node telemetry.',
  },
  {
    id: 'task_bronze_5',
    title: 'Zentro Bronze Daily Settlement Sign-Off #5',
    category: 'Zentro Bronze (VIP 1)',
    minVipLevel: 1,
    reward: 25,
    durationSec: 2,
    taskType: 'daily',
    description: 'Complete final Bronze VIP daily ledger reconciliation and claim 25 LKR.',
  },

  // ================= ZENTRO SILVER (VIP 2) DAILY TASKS (8 Tasks @ 55 LKR) =================
  {
    id: 'task_quantum_arb',
    title: 'Approve Zentro Silver Arbitrage Tranche #1',
    category: 'Zentro Silver (VIP 2)',
    minVipLevel: 2,
    reward: 55,
    durationSec: 2,
    taskType: 'daily',
    description: 'Sign off on automated high-frequency Silver VIP liquidity tranche allocation.',
  },
  {
    id: 'task_silver_2',
    title: 'Zentro Silver Global Sponsor Clearing #2',
    category: 'Zentro Silver (VIP 2)',
    minVipLevel: 2,
    reward: 55,
    durationSec: 2,
    taskType: 'daily',
    description: 'Verify Silver tier regional sponsor merchant invoice settlement.',
  },
  {
    id: 'task_silver_3',
    title: 'Zentro Silver 8% Mining Yield Validation #3',
    category: 'Zentro Silver (VIP 2)',
    minVipLevel: 2,
    reward: 55,
    durationSec: 2,
    taskType: 'daily',
    description: 'Confirm Silver VIP 8% daily live currency mining block allocation.',
  },
  {
    id: 'task_silver_4',
    title: 'Zentro Silver Partner E-Commerce Audit #4',
    category: 'Zentro Silver (VIP 2)',
    minVipLevel: 2,
    reward: 55,
    durationSec: 2,
    taskType: 'daily',
    description: 'Verify priority e-commerce partner volume metrics for Silver VIP.',
  },
  {
    id: 'task_silver_5',
    title: 'Zentro Silver FX Treasury Balancing #5',
    category: 'Zentro Silver (VIP 2)',
    minVipLevel: 2,
    reward: 55,
    durationSec: 2,
    taskType: 'daily',
    description: 'Approve multi-currency FX liquidity pool balancing for Silver tier.',
  },
  {
    id: 'task_silver_6',
    title: 'Zentro Silver Ad-Network Engagement Sync #6',
    category: 'Zentro Silver (VIP 2)',
    minVipLevel: 2,
    reward: 55,
    durationSec: 2,
    taskType: 'daily',
    description: 'Confirm global sponsor ad-network engagement batch for Silver members.',
  },
  {
    id: 'task_silver_7',
    title: 'Zentro Silver Syndicate Node Check #7',
    category: 'Zentro Silver (VIP 2)',
    minVipLevel: 2,
    reward: 55,
    durationSec: 2,
    taskType: 'daily',
    description: 'Run automated diagnostic check on Silver VIP referral syndicate nodes.',
  },
  {
    id: 'task_silver_8',
    title: 'Zentro Silver Daily Ledger Finalization #8',
    category: 'Zentro Silver (VIP 2)',
    minVipLevel: 2,
    reward: 55,
    durationSec: 2,
    taskType: 'daily',
    description: 'Finalize Silver VIP daily task quota and credit 55 LKR settlement.',
  },

  // ================= ZENTRO GOLD (VIP 3) DAILY TASKS (10 Tasks @ 70 LKR) =================
  {
    id: 'task_brca1_variant',
    title: 'Zentro Gold Settlement Matrix Audit #1',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Cross-reference high-priority Zentro Gold settlement and audit logs.',
  },
  {
    id: 'task_gold_2',
    title: 'Zentro Gold 10% Mining Vault Authorization #2',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Authorize daily 10% live currency mining distribution for Gold VIP.',
  },
  {
    id: 'task_gold_3',
    title: 'Zentro Gold Prime Merchant Settlement #3',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Clear Gold tier international sponsor merchant order batch.',
  },
  {
    id: 'task_gold_4',
    title: 'Zentro Gold Liquidity Corridor Verification #4',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Validate high-speed USDT & LKR settlement corridor for Gold VIP.',
  },
  {
    id: 'task_gold_5',
    title: 'Zentro Gold Brand Syndicate Promotion #5',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Confirm executive brand syndicate promotional campaign delivery.',
  },
  {
    id: 'task_gold_6',
    title: 'Zentro Gold Treasury Yield Rebalancing #6',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Execute Gold VIP automated treasury yield rebalancing check.',
  },
  {
    id: 'task_gold_7',
    title: 'Zentro Gold Cross-Chain Bridge Audit #7',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Verify BEP-20 liquidity bridge reserve proofs for Gold members.',
  },
  {
    id: 'task_gold_8',
    title: 'Zentro Gold Priority Order Dispatch #8',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Approve priority partner fulfillment batch and release Gold reward.',
  },
  {
    id: 'task_gold_9',
    title: 'Zentro Gold Commission Pool Verification #9',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Audit 5-level Gold referral commission distribution ledger.',
  },
  {
    id: 'task_gold_10',
    title: 'Zentro Gold Executive Daily Sign-Off #10',
    category: 'Zentro Gold (VIP 3)',
    minVipLevel: 3,
    reward: 70,
    durationSec: 2,
    taskType: 'daily',
    description: 'Complete Gold VIP daily task quota and claim 70 LKR instant payout.',
  },

  // ================= ZENTRO PLATINUM (VIP 4) DAILY TASKS (15 Tasks @ 100 LKR) =================
  {
    id: 'task_sovereign_clearing',
    title: 'Authorize Zentro Platinum Syndicate Clearing #1',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Execute high-value Zentro Platinum syndicate clearing verification.',
  },
  {
    id: 'task_platinum_2',
    title: 'Zentro Platinum 12% Sovereign Mining Sync #2',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Validate sovereign 12% daily live currency mining pool distribution.',
  },
  {
    id: 'task_platinum_3',
    title: 'Zentro Platinum Institutional FX Clearing #3',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Approve institutional multi-currency FX settlement batch.',
  },
  {
    id: 'task_platinum_4',
    title: 'Zentro Platinum Global Sponsor Keynote Audit #4',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Confirm global tier-1 sponsor campaign allocation and yield.',
  },
  {
    id: 'task_platinum_5',
    title: 'Zentro Platinum BEP-20 Liquidity Vault Check #5',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Audit primary USDT BEP-20 hot-wallet liquidity reserve ratio.',
  },
  {
    id: 'task_platinum_6',
    title: 'Zentro Platinum High-Yield Tranche Release #6',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Authorize high-yield Platinum merchant settlement tranche.',
  },
  {
    id: 'task_platinum_7',
    title: 'Zentro Platinum L1–L5 Syndicate Audit #7',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Verify 25% L1 / 16% L2 / 12% L3 Platinum referral syndicate ledger.',
  },
  {
    id: 'task_platinum_8',
    title: 'Zentro Platinum Prime E-Commerce Clearing #8',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Clear luxury partner e-commerce order settlement batch.',
  },
  {
    id: 'task_platinum_9',
    title: 'Zentro Platinum Cross-Border Treasury Sync #9',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Synchronize international partner bank settlement nodes.',
  },
  {
    id: 'task_platinum_10',
    title: 'Zentro Platinum Quantum Node Telemetry #10',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Verify zero-trust ledger consensus across Platinum validator nodes.',
  },
  {
    id: 'task_platinum_11',
    title: 'Zentro Platinum Sovereign Reserve Proof #11',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Sign off on daily cryptographic proof-of-reserves snapshot.',
  },
  {
    id: 'task_platinum_12',
    title: 'Zentro Platinum Executive Ad-Pool Settlement #12',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Release executive sponsor advertising revenue share for Platinum VIP.',
  },
  {
    id: 'task_platinum_13',
    title: 'Zentro Platinum Priority Payout Corridor #13',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Validate instant withdrawal liquidity corridor for Platinum members.',
  },
  {
    id: 'task_platinum_14',
    title: 'Zentro Platinum Global Syndicate Reconciliation #14',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Reconcile global syndicate volume milestones for Platinum tier.',
  },
  {
    id: 'task_platinum_15',
    title: 'Zentro Platinum Daily Master Sign-Off #15',
    category: 'Zentro Platinum (VIP 4)',
    minVipLevel: 4,
    reward: 100,
    durationSec: 2,
    taskType: 'daily',
    description: 'Complete all 15 Platinum VIP daily tasks and claim 100 LKR settlement.',
  },
];

export const PLATFORM_DAILY_TASKS: ZentroPlatformTask[] = DEFAULT_PLATFORM_DAILY_TASKS.map((t) => ({
  ...t,
}));

export interface SponsorCountryItem {
  id: string;
  nameEn: string;
  nameSi: string;
  code: string;
  registeredUsers: number;
  growthRate: string;
  hubRoleEn: string;
  hubRoleSi: string;
  flagSvgUri: string;
}

export function buildDefaultCountryFlagSvgUri(code: string, nameEn?: string): string {
  const cleanCode = (code || 'GL').trim().toUpperCase().slice(0, 3);
  const label = (nameEn || cleanCode).slice(0, 12);
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
      <defs>
        <linearGradient id="fg_${cleanCode}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#ec4899"/>
        </linearGradient>
      </defs>
      <rect width="120" height="80" rx="6" fill="url(#fg_${cleanCode})"/>
      <circle cx="60" cy="34" r="18" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>
      <text x="60" y="40" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="18">${cleanCode}</text>
      <text x="60" y="68" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-weight="700" font-size="10">${label}</text>
    </svg>
  `)}`;
}

export const DEFAULT_SPONSOR_COUNTRIES: SponsorCountryItem[] = [
  {
    id: 'usa',
    nameEn: 'USA',
    nameSi: 'ඇමරිකා එක්සත් ජනපදය (USA)',
    code: 'US',
    registeredUsers: 148920,
    growthRate: '+14.8%',
    hubRoleEn: 'Primary Tier-1 Liquidity Sponsor',
    hubRoleSi: 'ප්‍රධාන අනුග්‍රාහක ජාලය',
    flagSvgUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
        <rect width="120" height="80" fill="#B22234"/>
        <g fill="#FFFFFF">
          <rect y="6.15" width="120" height="6.15"/>
          <rect y="18.46" width="120" height="6.15"/>
          <rect y="30.77" width="120" height="6.15"/>
          <rect y="43.08" width="120" height="6.15"/>
          <rect y="55.38" width="120" height="6.15"/>
          <rect y="67.69" width="120" height="6.15"/>
        </g>
        <rect width="52" height="43.08" fill="#3C3B6E"/>
        <g fill="#FFFFFF">
          <circle cx="8" cy="7" r="2.1"/><circle cx="18" cy="7" r="2.1"/><circle cx="28" cy="7" r="2.1"/><circle cx="38" cy="7" r="2.1"/><circle cx="46" cy="7" r="2.1"/>
          <circle cx="13" cy="14" r="2.1"/><circle cx="23" cy="14" r="2.1"/><circle cx="33" cy="14" r="2.1"/><circle cx="43" cy="14" r="2.1"/>
          <circle cx="8" cy="21" r="2.1"/><circle cx="18" cy="21" r="2.1"/><circle cx="28" cy="21" r="2.1"/><circle cx="38" cy="21" r="2.1"/><circle cx="46" cy="21" r="2.1"/>
          <circle cx="13" cy="28" r="2.1"/><circle cx="23" cy="28" r="2.1"/><circle cx="33" cy="28" r="2.1"/><circle cx="43" cy="28" r="2.1"/>
          <circle cx="8" cy="35" r="2.1"/><circle cx="18" cy="35" r="2.1"/><circle cx="28" cy="35" r="2.1"/><circle cx="38" cy="35" r="2.1"/><circle cx="46" cy="35" r="2.1"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'uk',
    nameEn: 'UK',
    nameSi: 'එක්සත් රාජධානිය (UK)',
    code: 'GB',
    registeredUsers: 94350,
    growthRate: '+11.2%',
    hubRoleEn: 'European Financial Reserve Sponsor',
    hubRoleSi: 'යුරෝපීය මූල්‍ය අනුග්‍රාහක',
    flagSvgUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
        <rect width="120" height="80" fill="#012169"/>
        <path d="M0,0 L120,80 M120,0 L0,80" stroke="#FFFFFF" stroke-width="14"/>
        <path d="M0,0 L120,80 M120,0 L0,80" stroke="#C8102E" stroke-width="6"/>
        <path d="M60,0 V80 M0,40 H120" stroke="#FFFFFF" stroke-width="22"/>
        <path d="M60,0 V80 M0,40 H120" stroke="#C8102E" stroke-width="12"/>
      </svg>
    `)}`,
  },
  {
    id: 'sri_lanka',
    nameEn: 'Sri Lanka',
    nameSi: 'ශ්‍රී ලංකාව (Sri Lanka)',
    code: 'LK',
    registeredUsers: 215640,
    growthRate: '+24.6%',
    hubRoleEn: 'Regional South Asian Operations Hub',
    hubRoleSi: 'ප්‍රධාන දකුණු ආසියානු මෙහෙයුම් මධ්‍යස්ථානය',
    flagSvgUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
        <rect width="120" height="80" fill="#FFB81C"/>
        <rect x="6" y="6" width="16" height="68" fill="#00534E"/>
        <rect x="22" y="6" width="16" height="68" fill="#EB7400"/>
        <rect x="42" y="6" width="72" height="68" fill="#8D153A"/>
        <circle cx="48" cy="12" r="3" fill="#FFB81C"/>
        <circle cx="108" cy="12" r="3" fill="#FFB81C"/>
        <circle cx="48" cy="68" r="3" fill="#FFB81C"/>
        <circle cx="108" cy="68" r="3" fill="#FFB81C"/>
        <path d="M64,52 H92 L95,38 L86,34 L88,24 L75,26 L70,20 L65,32 L58,30 L58,45 Z" fill="#FFB81C"/>
        <rect x="57" y="20" width="2.8" height="26" fill="#FFB81C"/>
      </svg>
    `)}`,
  },
  {
    id: 'india',
    nameEn: 'India',
    nameSi: 'ඉන්දියාව (India)',
    code: 'IN',
    registeredUsers: 186410,
    growthRate: '+19.4%',
    hubRoleEn: 'Asian Digital Mining Sponsor',
    hubRoleSi: 'ආසියානු ඩිජිටල් කැණීම් අනුග්‍රාහක',
    flagSvgUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
        <rect width="120" height="26.67" fill="#FF9933"/>
        <rect y="26.67" width="120" height="26.67" fill="#FFFFFF"/>
        <rect y="53.33" width="120" height="26.67" fill="#138808"/>
        <circle cx="60" cy="40" r="10.5" fill="none" stroke="#000080" stroke-width="2"/>
        <circle cx="60" cy="40" r="2.2" fill="#000080"/>
        <g stroke="#000080" stroke-width="1">
          <line x1="60" y1="29.5" x2="60" y2="50.5"/>
          <line x1="49.5" y1="40" x2="70.5" y2="40"/>
          <line x1="52.5" y1="32.5" x2="67.5" y2="47.5"/>
          <line x1="67.5" y1="32.5" x2="52.5" y2="47.5"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'australia',
    nameEn: 'Australia',
    nameSi: 'ඕස්ට්‍රේලියාව (Australia)',
    code: 'AU',
    registeredUsers: 68290,
    growthRate: '+10.5%',
    hubRoleEn: 'Oceania Cloud Node Sponsor',
    hubRoleSi: 'ඕෂනියා ක්ලවුඩ් අනුග්‍රාහක',
    flagSvgUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
        <rect width="120" height="80" fill="#00008B"/>
        <g>
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" stroke-width="7"/>
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" stroke-width="3"/>
          <path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" stroke-width="11"/>
          <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" stroke-width="6"/>
        </g>
        <g fill="#FFFFFF">
          <circle cx="30" cy="60" r="6"/>
          <circle cx="90" cy="18" r="3.2"/>
          <circle cx="76" cy="34" r="3.2"/>
          <circle cx="102" cy="30" r="3.2"/>
          <circle cx="90" cy="62" r="3.5"/>
          <circle cx="97" cy="44" r="2"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'pakistan',
    nameEn: 'Pakistan',
    nameSi: 'පාකිස්ථානය (Pakistan)',
    code: 'PK',
    registeredUsers: 112780,
    growthRate: '+16.1%',
    hubRoleEn: 'Regional Syndicate Partner',
    hubRoleSi: 'කලාපීය ජාල හවුල්කරු',
    flagSvgUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
        <rect width="120" height="80" fill="#01411C"/>
        <rect width="30" height="80" fill="#FFFFFF"/>
        <circle cx="72" cy="40" r="20" fill="#FFFFFF"/>
        <circle cx="77" cy="36" r="18" fill="#01411C"/>
        <polygon points="84,24 86,30 92,30 87,34 89,40 84,36 79,40 81,34 76,30 82,30" fill="#FFFFFF"/>
      </svg>
    `)}`,
  },
  {
    id: 'china',
    nameEn: 'China',
    nameSi: 'චීනය (China)',
    code: 'CN',
    registeredUsers: 164500,
    growthRate: '+18.3%',
    hubRoleEn: 'Hardware & ASIC Mining Sponsor',
    hubRoleSi: 'දෘඪාංග සහ කැණීම් තාක්ෂණ අනුග්‍රාහක',
    flagSvgUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
        <rect width="120" height="80" fill="#EE1C25"/>
        <polygon points="22,12 25,21 34,21 27,26 29,35 22,30 15,35 17,26 10,21 19,21" fill="#FFFF00"/>
        <circle cx="42" cy="10" r="2.8" fill="#FFFF00"/>
        <circle cx="48" cy="18" r="2.8" fill="#FFFF00"/>
        <circle cx="48" cy="28" r="2.8" fill="#FFFF00"/>
        <circle cx="42" cy="36" r="2.8" fill="#FFFF00"/>
      </svg>
    `)}`,
  },
  {
    id: 'france',
    nameEn: 'France',
    nameSi: 'ප්‍රංශය (French / France)',
    code: 'FR',
    registeredUsers: 79840,
    growthRate: '+12.7%',
    hubRoleEn: 'Continental EU Sponsor Partner',
    hubRoleSi: 'යුරෝපා සංගම් අනුග්‍රාහක ජාලය',
    flagSvgUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
        <rect width="40" height="80" fill="#002395"/>
        <rect x="40" width="40" height="80" fill="#FFFFFF"/>
        <rect x="80" width="40" height="80" fill="#ED2939"/>
      </svg>
    `)}`,
  },
];

export const SPONSOR_COUNTRIES: SponsorCountryItem[] = DEFAULT_SPONSOR_COUNTRIES.map((c) => ({
  ...c,
}));

const ADMIN_VIP_TIERS_STORAGE_KEY = 'zentro_admin_vip_tiers_v1';
const ADMIN_PLATFORM_TASKS_STORAGE_KEY = 'zentro_admin_platform_tasks_v1';
const ADMIN_SPONSOR_COUNTRIES_STORAGE_KEY = 'zentro_admin_sponsor_countries_v1';

export function dispatchCatalogUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zentro-catalog-updated'));
  }
}

function hydrateAdminCatalogFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const rawVips = window.localStorage.getItem(ADMIN_VIP_TIERS_STORAGE_KEY);
    if (rawVips) {
      const parsed = JSON.parse(rawVips) as VipTierConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sorted = [...parsed].sort((a, b) => a.level - b.level);
        VIP_TIERS.splice(0, VIP_TIERS.length, ...sorted);
      }
    }
  } catch {
    // ignore storage parse error
  }

  try {
    const rawTasks = window.localStorage.getItem(ADMIN_PLATFORM_TASKS_STORAGE_KEY);
    if (rawTasks) {
      const parsed = JSON.parse(rawTasks) as ZentroPlatformTask[];
      if (Array.isArray(parsed)) {
        PLATFORM_DAILY_TASKS.splice(0, PLATFORM_DAILY_TASKS.length, ...parsed);
      }
    }
  } catch {
    // ignore storage parse error
  }

  try {
    const rawCountries = window.localStorage.getItem(ADMIN_SPONSOR_COUNTRIES_STORAGE_KEY);
    if (rawCountries) {
      const parsed = JSON.parse(rawCountries) as SponsorCountryItem[];
      if (Array.isArray(parsed)) {
        SPONSOR_COUNTRIES.splice(0, SPONSOR_COUNTRIES.length, ...parsed);
      }
    }
  } catch {
    // ignore storage parse error
  }
}

hydrateAdminCatalogFromStorage();

export function getVipTiersCatalog(): VipTierConfig[] {
  return [...VIP_TIERS];
}

export function saveVipTiersCatalog(nextTiers: VipTierConfig[]): VipTierConfig[] {
  const sorted = [...nextTiers].sort((a, b) => a.level - b.level);
  VIP_TIERS.splice(0, VIP_TIERS.length, ...sorted);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ADMIN_VIP_TIERS_STORAGE_KEY, JSON.stringify(sorted));
  }
  dispatchCatalogUpdated();
  return [...VIP_TIERS];
}

export function resetVipTiersCatalogToDefault(): VipTierConfig[] {
  const fresh = DEFAULT_VIP_TIERS.map((t) => ({
    ...t,
    commissionLevels: t.commissionLevels.map((c) => ({ ...c })),
    benefits: [...t.benefits],
  }));
  VIP_TIERS.splice(0, VIP_TIERS.length, ...fresh);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ADMIN_VIP_TIERS_STORAGE_KEY);
  }
  dispatchCatalogUpdated();
  return [...VIP_TIERS];
}

export function getPlatformTasksCatalog(): ZentroPlatformTask[] {
  return [...PLATFORM_DAILY_TASKS];
}

export function savePlatformTasksCatalog(nextTasks: ZentroPlatformTask[]): ZentroPlatformTask[] {
  PLATFORM_DAILY_TASKS.splice(0, PLATFORM_DAILY_TASKS.length, ...nextTasks);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ADMIN_PLATFORM_TASKS_STORAGE_KEY, JSON.stringify(nextTasks));
  }
  dispatchCatalogUpdated();
  return [...PLATFORM_DAILY_TASKS];
}

export function resetPlatformTasksCatalogToDefault(): ZentroPlatformTask[] {
  const fresh = DEFAULT_PLATFORM_DAILY_TASKS.map((t) => ({ ...t }));
  PLATFORM_DAILY_TASKS.splice(0, PLATFORM_DAILY_TASKS.length, ...fresh);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ADMIN_PLATFORM_TASKS_STORAGE_KEY);
  }
  dispatchCatalogUpdated();
  return [...PLATFORM_DAILY_TASKS];
}

export function getSponsorCountriesCatalog(): SponsorCountryItem[] {
  return [...SPONSOR_COUNTRIES];
}

export function saveSponsorCountriesCatalog(
  nextCountries: SponsorCountryItem[]
): SponsorCountryItem[] {
  SPONSOR_COUNTRIES.splice(0, SPONSOR_COUNTRIES.length, ...nextCountries);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      ADMIN_SPONSOR_COUNTRIES_STORAGE_KEY,
      JSON.stringify(nextCountries)
    );
  }
  dispatchCatalogUpdated();
  return [...SPONSOR_COUNTRIES];
}

export function resetSponsorCountriesCatalogToDefault(): SponsorCountryItem[] {
  const fresh = DEFAULT_SPONSOR_COUNTRIES.map((c) => ({ ...c }));
  SPONSOR_COUNTRIES.splice(0, SPONSOR_COUNTRIES.length, ...fresh);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ADMIN_SPONSOR_COUNTRIES_STORAGE_KEY);
  }
  dispatchCatalogUpdated();
  return [...SPONSOR_COUNTRIES];
}


// Official Zentro Logo Asset Path
export const ZENTRO_LOGO_URL =
  '/assets/aistudio/file_00000000707c8207a0a0d9142f139304_382d263b.png';

// Pink + Red + White + Blue (රෝස + රතු + සුදු + නිල්) Creative Zentro Atrium Background Artwork (Inline Data URI)
export const ZENTRO_ATRIUM_BG_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bgBase" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#040b24"/>
      <stop offset="30%" stop-color="#091945"/>
      <stop offset="65%" stop-color="#1d0d3d"/>
      <stop offset="100%" stop-color="#0b051d"/>
    </linearGradient>

    <radialGradient id="cyanSupernova" cx="18%" cy="22%" r="52%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.65"/>
      <stop offset="35%" stop-color="#2563eb" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#1e1b4b" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#040b24" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="magentaNebula" cx="84%" cy="26%" r="50%">
      <stop offset="0%" stop-color="#f472b6" stop-opacity="0.62"/>
      <stop offset="35%" stop-color="#ec4899" stop-opacity="0.35"/>
      <stop offset="68%" stop-color="#be123c" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#0b051d" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="rubyHorizon" cx="50%" cy="62%" r="55%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.42"/>
      <stop offset="40%" stop-color="#ec4899" stop-opacity="0.22"/>
      <stop offset="75%" stop-color="#3b82f6" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#040b24" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="goldCore" cx="50%" cy="56%" r="28%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="35%" stop-color="#fb7185" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#091945" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="auroraWave1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.05"/>
      <stop offset="22%" stop-color="#38bdf8" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="78%" stop-color="#ec4899" stop-opacity="0.60"/>
      <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.08"/>
    </linearGradient>

    <linearGradient id="auroraWave2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.50"/>
      <stop offset="35%" stop-color="#ec4899" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#3b82f6" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.05"/>
    </linearGradient>

    <linearGradient id="crystalFacetBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="45%" stop-color="#38bdf8" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.06"/>
    </linearGradient>

    <linearGradient id="crystalFacetPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.48"/>
      <stop offset="45%" stop-color="#f472b6" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#e11d48" stop-opacity="0.08"/>
    </linearGradient>

    <linearGradient id="gridLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f472b6" stop-opacity="0.0"/>
      <stop offset="25%" stop-color="#ec4899" stop-opacity="0.45"/>
      <stop offset="65%" stop-color="#38bdf8" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.08"/>
    </linearGradient>

    <pattern id="hexMesh" width="80" height="92" patternUnits="userSpaceOnUse">
      <path d="M40 0 L80 23 L80 69 L40 92 L0 69 L0 23 Z" fill="none" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Base Deep Cosmic Atrium Canvas -->
  <rect width="1920" height="1080" fill="url(#bgBase)"/>
  <rect width="1920" height="1080" fill="url(#cyanSupernova)"/>
  <rect width="1920" height="1080" fill="url(#magentaNebula)"/>
  <rect width="1920" height="1080" fill="url(#rubyHorizon)"/>
  <rect width="1920" height="1080" fill="url(#goldCore)"/>
  <rect width="1920" height="1080" fill="url(#hexMesh)"/>

  <!-- Upper Celestial Dome Perspective Grid -->
  <g stroke="#38bdf8" stroke-opacity="0.16" stroke-width="1" fill="none">
    <path d="M0 120 Q960 320 1920 120"/>
    <path d="M0 40 Q960 260 1920 40"/>
    <path d="M0 210 Q960 380 1920 210"/>
    <line x1="960" y1="340" x2="120" y2="0"/>
    <line x1="960" y1="340" x2="480" y2="0"/>
    <line x1="960" y1="340" x2="820" y2="0"/>
    <line x1="960" y1="340" x2="1100" y2="0"/>
    <line x1="960" y1="340" x2="1440" y2="0"/>
    <line x1="960" y1="340" x2="1800" y2="0"/>
  </g>

  <!-- 3D Cyber-Atrium Perspective Floor Grid -->
  <g stroke="url(#gridLineGrad)" stroke-width="1.4" fill="none">
    <!-- Converging Perspective Rays -->
    <line x1="960" y1="580" x2="-300" y2="1080"/>
    <line x1="960" y1="580" x2="-40" y2="1080"/>
    <line x1="960" y1="580" x2="200" y2="1080"/>
    <line x1="960" y1="580" x2="420" y2="1080"/>
    <line x1="960" y1="580" x2="620" y2="1080"/>
    <line x1="960" y1="580" x2="795" y2="1080"/>
    <line x1="960" y1="580" x2="960" y2="1080"/>
    <line x1="960" y1="580" x2="1125" y2="1080"/>
    <line x1="960" y1="580" x2="1300" y2="1080"/>
    <line x1="960" y1="580" x2="1500" y2="1080"/>
    <line x1="960" y1="580" x2="1720" y2="1080"/>
    <line x1="960" y1="580" x2="1960" y2="1080"/>
    <line x1="960" y1="580" x2="2220" y2="1080"/>
    <!-- Horizontal Latitude Grid Lines -->
    <line x1="0" y1="620" x2="1920" y2="620" stroke="#ec4899" stroke-opacity="0.22"/>
    <line x1="0" y1="655" x2="1920" y2="655" stroke="#ec4899" stroke-opacity="0.24"/>
    <line x1="0" y1="700" x2="1920" y2="700" stroke="#38bdf8" stroke-opacity="0.25"/>
    <line x1="0" y1="758" x2="1920" y2="758" stroke="#38bdf8" stroke-opacity="0.28"/>
    <line x1="0" y1="832" x2="1920" y2="832" stroke="#f43f5e" stroke-opacity="0.26"/>
    <line x1="0" y1="930" x2="1920" y2="930" stroke="#38bdf8" stroke-opacity="0.32"/>
    <line x1="0" y1="1045" x2="1920" y2="1045" stroke="#ec4899" stroke-opacity="0.35"/>
  </g>

  <!-- Flowing Multi-Layered Silk Aurora Ribbons -->
  <path d="M-120 720 C 320 420, 680 860, 1140 520 C 1480 260, 1740 580, 2040 310 L 2040 540 C 1720 760, 1440 460, 1100 710 C 660 1010, 310 610, -120 880 Z" fill="url(#auroraWave2)" opacity="0.65"/>
  <path d="M-100 380 C 360 680, 760 180, 1220 490 C 1540 700, 1760 280, 2020 460 L 2020 620 C 1720 440, 1500 840, 1180 630 C 740 340, 350 820, -100 540 Z" fill="url(#auroraWave1)" opacity="0.52"/>

  <!-- Crisp Glowing Aurora Wave Filaments -->
  <g fill="none">
    <path d="M-80 460 C 380 740, 780 220, 1240 520 C 1560 720, 1760 320, 2000 490" stroke="url(#auroraWave1)" stroke-width="4"/>
    <path d="M-80 485 C 390 765, 790 245, 1250 545 C 1570 745, 1770 345, 2000 515" stroke="#ffffff" stroke-opacity="0.32" stroke-width="1.5" stroke-dasharray="10 8"/>
    <path d="M-100 760 C 340 460, 700 880, 1160 540 C 1490 290, 1750 600, 2020 350" stroke="url(#auroraWave2)" stroke-width="3.5"/>
    <path d="M-60 260 C 440 120, 880 540, 1380 240 C 1640 80, 1820 300, 2000 180" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="2"/>
  </g>

  <!-- Left Wing Holographic Currency & Live Mining Portal Ring -->
  <g transform="translate(250, 420)">
    <circle cx="0" cy="0" r="230" fill="none" stroke="#38bdf8" stroke-opacity="0.24" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="195" fill="none" stroke="#ec4899" stroke-opacity="0.38" stroke-width="2" stroke-dasharray="18 10 4 10"/>
    <circle cx="0" cy="0" r="155" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.2" stroke-dasharray="6 12"/>
    <circle cx="0" cy="0" r="115" fill="url(#crystalFacetBlue)" stroke="#38bdf8" stroke-opacity="0.5" stroke-width="1.8"/>
    <polygon points="0,-95 82,-47 82,47 0,95 -82,47 -82,-47" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.5"/>
    <polygon points="0,-65 56,32 -56,32" fill="url(#crystalFacetPink)" stroke="#f472b6" stroke-opacity="0.55" stroke-width="1.5"/>
    <polygon points="0,65 56,-32 -56,-32" fill="none" stroke="#38bdf8" stroke-opacity="0.45" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="14" fill="#ffffff" fill-opacity="0.8"/>
    <circle cx="0" cy="0" r="32" fill="none" stroke="#38bdf8" stroke-opacity="0.7" stroke-width="2"/>
    <!-- Orbital Nodes -->
    <circle cx="195" cy="0" r="6" fill="#38bdf8"/>
    <circle cx="-138" cy="-138" r="5" fill="#f472b6"/>
    <circle cx="-138" cy="138" r="5" fill="#ffffff"/>
    <circle cx="98" cy="168" r="6" fill="#f43f5e"/>
  </g>

  <!-- Right Wing Holographic VIP & Quantum Yield Ring -->
  <g transform="translate(1670, 380)">
    <circle cx="0" cy="0" r="260" fill="none" stroke="#f43f5e" stroke-opacity="0.24" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="220" fill="none" stroke="#38bdf8" stroke-opacity="0.38" stroke-width="2.2" stroke-dasharray="24 12 6 12"/>
    <circle cx="0" cy="0" r="175" fill="none" stroke="#f472b6" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="8 8"/>
    <circle cx="0" cy="0" r="130" fill="url(#crystalFacetPink)" stroke="#f472b6" stroke-opacity="0.55" stroke-width="2"/>
    <!-- 3D Octahedron / Diamond Core -->
    <polygon points="0,-105 95,0 0,105 -95,0" fill="url(#crystalFacetBlue)" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.8"/>
    <line x1="0" y1="-105" x2="0" y2="105" stroke="#ffffff" stroke-opacity="0.4" stroke-width="1.2"/>
    <line x1="-95" y1="0" x2="95" y2="0" stroke="#ffffff" stroke-opacity="0.4" stroke-width="1.2"/>
    <circle cx="0" cy="0" r="16" fill="#ffffff" fill-opacity="0.85"/>
    <circle cx="-220" cy="0" r="7" fill="#f472b6"/>
    <circle cx="155" cy="-155" r="6" fill="#38bdf8"/>
    <circle cx="155" cy="155" r="6" fill="#ffffff"/>
  </g>

  <!-- Floating Crystalline Prisms & Bioscience Molecular Constellation -->
  <g stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.2">
    <!-- Top Left Prism -->
    <polygon points="140,110 195,75 230,135 170,175" fill="url(#crystalFacetPink)"/>
    <line x1="140" y1="110" x2="230" y2="135"/>
    <!-- Bottom Left Prism -->
    <polygon points="160,840 245,790 290,875 205,930" fill="url(#crystalFacetBlue)"/>
    <line x1="245" y1="790" x2="205" y2="930"/>
    <!-- Top Right Prism -->
    <polygon points="1480,110 1560,70 1600,150 1515,185" fill="url(#crystalFacetBlue)"/>
    <line x1="1480" y1="110" x2="1600" y2="150"/>
    <!-- Bottom Right Prism -->
    <polygon points="1640,790 1735,735 1785,830 1690,890" fill="url(#crystalFacetPink)"/>
    <line x1="1735" y1="735" x2="1690" y2="890"/>
  </g>

  <!-- Molecular / Fintech Network Nodes & Connections -->
  <g stroke="#38bdf8" stroke-opacity="0.28" stroke-width="1.2" fill="none">
    <polyline points="80,220 180,170 290,210 380,130 490,180"/>
    <polyline points="1420,210 1530,150 1650,195 1780,120 1860,175"/>
    <polyline points="110,720 230,660 350,730 460,670"/>
    <polyline points="1460,710 1580,650 1710,720 1830,660"/>
  </g>
  <g fill="#ffffff">
    <circle cx="80" cy="220" r="4" fill="#38bdf8"/>
    <circle cx="180" cy="170" r="5" fill="#f472b6"/>
    <circle cx="290" cy="210" r="4" fill="#ffffff"/>
    <circle cx="380" cy="130" r="5" fill="#38bdf8"/>
    <circle cx="490" cy="180" r="3.5" fill="#f43f5e"/>
    <circle cx="1420" cy="210" r="4" fill="#f472b6"/>
    <circle cx="1530" cy="150" r="5" fill="#38bdf8"/>
    <circle cx="1650" cy="195" r="4" fill="#ffffff"/>
    <circle cx="1780" cy="120" r="5" fill="#f43f5e"/>
    <circle cx="1860" cy="175" r="4" fill="#38bdf8"/>
    <!-- Starlight Bokeh Particles -->
    <circle cx="620" cy="140" r="2.5" fill-opacity="0.7"/>
    <circle cx="780" cy="95" r="3.5" fill="#38bdf8" fill-opacity="0.8"/>
    <circle cx="1140" cy="110" r="3" fill="#f472b6" fill-opacity="0.8"/>
    <circle cx="1310" cy="155" r="2.5" fill-opacity="0.7"/>
    <circle cx="540" cy="420" r="3" fill="#38bdf8" fill-opacity="0.65"/>
    <circle cx="1390" cy="440" r="3.5" fill="#f472b6" fill-opacity="0.65"/>
    <circle cx="430" cy="860" r="4" fill="#ec4899" fill-opacity="0.7"/>
    <circle cx="1490" cy="880" r="4" fill="#38bdf8" fill-opacity="0.7"/>
  </g>

  <!-- Crisp 4-Point Star Flares -->
  <g fill="#ffffff" fill-opacity="0.85">
    <path d="M380 110 L383 125 L398 128 L383 131 L380 146 L377 131 L362 128 L377 125 Z"/>
    <path d="M1530 130 L1533 145 L1548 148 L1533 151 L1530 166 L1527 151 L1512 148 L1527 145 Z"/>
    <path d="M250 680 L252 692 L264 694 L252 696 L250 708 L248 696 L236 694 L248 692 Z"/>
    <path d="M1680 640 L1682 652 L1694 654 L1682 656 L1680 668 L1678 656 L1666 654 L1678 652 Z"/>
  </g>
</svg>`);

// Light Mode Luminous Crystal & Silk Aurora Atrium Background Artwork
export const ZENTRO_ATRIUM_LIGHT_BG_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="lightBase" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="35%" stop-color="#f8fafc"/>
      <stop offset="70%" stop-color="#fce7f3"/>
      <stop offset="100%" stop-color="#ffe4e6"/>
    </linearGradient>

    <radialGradient id="lightBlueGlow" cx="18%" cy="22%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.42"/>
      <stop offset="45%" stop-color="#60a5fa" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#e0f2fe" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="lightPinkGlow" cx="84%" cy="28%" r="50%">
      <stop offset="0%" stop-color="#f472b6" stop-opacity="0.42"/>
      <stop offset="45%" stop-color="#fb7185" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#fce7f3" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="lightRibbon1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.08"/>
      <stop offset="30%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="65%" stop-color="#ec4899" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.10"/>
    </linearGradient>

    <linearGradient id="lightRibbon2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="#ec4899" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#2563eb" stop-opacity="0.28"/>
    </linearGradient>

    <pattern id="lightHex" width="80" height="92" patternUnits="userSpaceOnUse">
      <path d="M40 0 L80 23 L80 69 L40 92 L0 69 L0 23 Z" fill="none" stroke="#0284c7" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1920" height="1080" fill="url(#lightBase)"/>
  <rect width="1920" height="1080" fill="url(#lightBlueGlow)"/>
  <rect width="1920" height="1080" fill="url(#lightPinkGlow)"/>
  <rect width="1920" height="1080" fill="url(#lightHex)"/>

  <!-- Perspective Atrium Grid -->
  <g stroke="#0284c7" stroke-opacity="0.16" stroke-width="1.2" fill="none">
    <line x1="960" y1="580" x2="-200" y2="1080"/>
    <line x1="960" y1="580" x2="150" y2="1080"/>
    <line x1="960" y1="580" x2="460" y2="1080"/>
    <line x1="960" y1="580" x2="720" y2="1080"/>
    <line x1="960" y1="580" x2="960" y2="1080"/>
    <line x1="960" y1="580" x2="1200" y2="1080"/>
    <line x1="960" y1="580" x2="1460" y2="1080"/>
    <line x1="960" y1="580" x2="1770" y2="1080"/>
    <line x1="960" y1="580" x2="2120" y2="1080"/>
    <line x1="0" y1="650" x2="1920" y2="650" stroke="#db2777" stroke-opacity="0.15"/>
    <line x1="0" y1="730" x2="1920" y2="730"/>
    <line x1="0" y1="830" x2="1920" y2="830" stroke="#db2777" stroke-opacity="0.18"/>
    <line x1="0" y1="950" x2="1920" y2="950"/>
  </g>

  <!-- Flowing Silk Aurora Waves -->
  <path d="M-120 720 C 320 420, 680 860, 1140 520 C 1480 260, 1740 580, 2040 310 L 2040 540 C 1720 760, 1440 460, 1100 710 C 660 1010, 310 610, -120 880 Z" fill="url(#lightRibbon2)"/>
  <path d="M-100 380 C 360 680, 760 180, 1220 490 C 1540 700, 1760 280, 2020 460 L 2020 620 C 1720 440, 1500 840, 1180 630 C 740 340, 350 820, -100 540 Z" fill="url(#lightRibbon1)"/>
  <path d="M-80 460 C 380 740, 780 220, 1240 520 C 1560 720, 1760 320, 2000 490" fill="none" stroke="#ec4899" stroke-opacity="0.45" stroke-width="3"/>
  <path d="M-100 760 C 340 460, 700 880, 1160 540 C 1490 290, 1750 600, 2020 350" fill="none" stroke="#0284c7" stroke-opacity="0.42" stroke-width="3"/>

  <!-- Left & Right Holographic Portal Rings -->
  <g transform="translate(250, 420)">
    <circle cx="0" cy="0" r="220" fill="none" stroke="#0284c7" stroke-opacity="0.25" stroke-width="1.8"/>
    <circle cx="0" cy="0" r="180" fill="none" stroke="#db2777" stroke-opacity="0.32" stroke-width="2" stroke-dasharray="16 10"/>
    <circle cx="0" cy="0" r="120" fill="#ffffff" fill-opacity="0.45" stroke="#0284c7" stroke-opacity="0.35" stroke-width="1.5"/>
    <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="none" stroke="#db2777" stroke-opacity="0.35" stroke-width="1.5"/>
  </g>
  <g transform="translate(1670, 380)">
    <circle cx="0" cy="0" r="240" fill="none" stroke="#e11d48" stroke-opacity="0.24" stroke-width="1.8"/>
    <circle cx="0" cy="0" r="195" fill="none" stroke="#0284c7" stroke-opacity="0.32" stroke-width="2" stroke-dasharray="22 10"/>
    <circle cx="0" cy="0" r="130" fill="#ffffff" fill-opacity="0.45" stroke="#db2777" stroke-opacity="0.38" stroke-width="1.5"/>
    <polygon points="0,-100 90,0 0,100 -90,0" fill="none" stroke="#0284c7" stroke-opacity="0.38" stroke-width="1.8"/>
  </g>
</svg>`);

export interface OfficialSettlementBank {
  id: string;
  country: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  swiftCode: string;
}

export interface UsdtNetworkOption {
  id: string;
  networkName: string;
  tokenStandard: string;
  walletAddress: string;
  minConfirmations: number;
}

export interface DepositRequestRecord {
  id: string;
  referenceCode: string;
  userId: string;
  username: string;
  depositType: 'bank' | 'usdt';
  country: string;
  selectedBankName: string;
  receivingAccountNumber: string;
  receivingAccountHolder: string;
  receivingBranchOrNetwork: string;
  selectedVipLabel: string;
  selectedVipLevel: number | null;
  amountInActiveCurrency: number;
  activeCurrency: string;
  amountInLkr: number;
  depositorName: string;
  slipFileName: string;
  slipDataUrl: string;
  status: 'pending_admin' | 'approved' | 'rejected';
  createdAt: string;
}

export const DEFAULT_OFFICIAL_DEPOSIT_BANKS: OfficialSettlementBank[] = [
  // Sri Lanka Banks
  {
    id: 'lk_boc',
    country: 'Sri Lanka',
    bankName: 'Bank of Ceylon (BOC)',
    accountName: 'ZENTRO OFFICIAL PARTNER SETTLEMENT (PVT) LTD',
    accountNumber: '0089-7412-9034',
    branchName: 'Colombo Head Office Branch (001)',
    swiftCode: 'BCEYLKLX',
  },
  {
    id: 'lk_combank',
    country: 'Sri Lanka',
    bankName: 'Commercial Bank of Ceylon PLC',
    accountName: 'ZENTRO OFFICIAL PARTNER SETTLEMENT (PVT) LTD',
    accountNumber: '1000-5849-2210',
    branchName: 'Colombo Fort Corporate Branch (014)',
    swiftCode: 'CCEYLKLX',
  },
  {
    id: 'lk_sampath',
    country: 'Sri Lanka',
    bankName: 'Sampath Bank PLC',
    accountName: 'ZENTRO OFFICIAL PARTNER SETTLEMENT (PVT) LTD',
    accountNumber: '0119-6004-8821',
    branchName: 'Colombo Super Branch (003)',
    swiftCode: 'BSAMLKLX',
  },
  {
    id: 'lk_hnb',
    country: 'Sri Lanka',
    bankName: 'Hatton National Bank (HNB)',
    accountName: 'ZENTRO OFFICIAL PARTNER SETTLEMENT (PVT) LTD',
    accountNumber: '0030-1049-7625',
    branchName: 'HNB Towers Head Office Branch (003)',
    swiftCode: 'HBLILKLX',
  },
  {
    id: 'lk_peoples',
    country: 'Sri Lanka',
    bankName: "People's Bank Sri Lanka",
    accountName: 'ZENTRO OFFICIAL PARTNER SETTLEMENT (PVT) LTD',
    accountNumber: '204-1001-9482-7315',
    branchName: 'Colombo International Banking Division',
    swiftCode: 'PSBKLKLX',
  },
  {
    id: 'lk_ntb',
    country: 'Sri Lanka',
    bankName: 'Nations Trust Bank (NTB)',
    accountName: 'ZENTRO OFFICIAL PARTNER SETTLEMENT (PVT) LTD',
    accountNumber: '1002-7008-4519',
    branchName: 'Nawam Mawatha Corporate Branch',
    swiftCode: 'NTBCLKLX',
  },
  // International & Regional Banks
  {
    id: 'uk_hsbc',
    country: 'United Kingdom',
    bankName: 'HSBC UK Corporate Banking',
    accountName: 'ZENTRO GLOBAL SETTLEMENT LTD',
    accountNumber: 'GB42-HBUK-4012-7689-0144-29',
    branchName: 'London Canary Wharf Corporate Desk',
    swiftCode: 'HBUKGB4B',
  },
  {
    id: 'uk_barclays',
    country: 'United Kingdom',
    bankName: 'Barclays Bank PLC',
    accountName: 'ZENTRO GLOBAL SETTLEMENT LTD',
    accountNumber: 'GB88-BARC-2000-5190-4421-88',
    branchName: 'London Churchill Place Branch',
    swiftCode: 'BARCGB22',
  },
  {
    id: 'us_chase',
    country: 'United States',
    bankName: 'JPMorgan Chase Bank N.A.',
    accountName: 'ZENTRO TREASURY CLEARING INC',
    accountNumber: '0048-9921-7054-1182',
    branchName: 'New York Madison Ave Commercial Desk',
    swiftCode: 'CHASUS33',
  },
  {
    id: 'ae_emirates',
    country: 'United Arab Emirates',
    bankName: 'Emirates NBD Corporate',
    accountName: 'ZENTRO MENA SETTLEMENT FZ-LLC',
    accountNumber: 'AE19-0260-0010-1588-4920-701',
    branchName: 'Dubai DIFC Financial Center Branch',
    swiftCode: 'EBILAEAD',
  },
  {
    id: 'in_hdfc',
    country: 'India',
    bankName: 'HDFC Bank Corporate Treasury',
    accountName: 'ZENTRO SOUTH ASIA CLEARING PVT LTD',
    accountNumber: '5020-0078-4129-63',
    branchName: 'Mumbai Nariman Point IFSC HDFC0000240',
    swiftCode: 'HDFCINBB',
  },
  {
    id: 'sg_dbs',
    country: 'Singapore',
    bankName: 'DBS Bank Ltd Singapore',
    accountName: 'ZENTRO APAC TREASURY PTE LTD',
    accountNumber: '0071-049281-01-8',
    branchName: 'Marina Bay Financial Centre Tower 3',
    swiftCode: 'DBSSSGSG',
  },
  {
    id: 'intl_standard',
    country: 'International',
    bankName: 'Standard Chartered Global Clearing Bank',
    accountName: 'ZENTRO GLOBAL SETTLEMENT LTD',
    accountNumber: 'SCBL-9904-2817-5501',
    branchName: 'International Multi-Currency Treasury Desk',
    swiftCode: 'SCBLGB2L',
  },
];

export const OFFICIAL_DEPOSIT_BANKS: OfficialSettlementBank[] = DEFAULT_OFFICIAL_DEPOSIT_BANKS.map(
  (b) => ({ ...b })
);

export const DEFAULT_USDT_NETWORK_OPTIONS: UsdtNetworkOption[] = [
  {
    id: 'usdt_bep20',
    networkName: 'BNB Smart Chain (BEP-20) — Primary',
    tokenStandard: 'USDT-BEP20',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    minConfirmations: 15,
  },
  {
    id: 'usdt_bep20_backup',
    networkName: 'BNB Smart Chain (BEP-20) — Treasury Desk #2',
    tokenStandard: 'USDT-BEP20',
    walletAddress: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
    minConfirmations: 15,
  },
  {
    id: 'usdt_trc20',
    networkName: 'TRON Network (TRC-20)',
    tokenStandard: 'USDT-TRC20',
    walletAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    minConfirmations: 19,
  },
];

export const USDT_NETWORK_OPTIONS: UsdtNetworkOption[] = DEFAULT_USDT_NETWORK_OPTIONS.map((u) => ({
  ...u,
}));

const OFFICIAL_DEPOSIT_BANKS_STORAGE_KEY = 'zentro_official_deposit_banks_v1';
const OFFICIAL_USDT_ADDRESSES_STORAGE_KEY = 'zentro_official_usdt_addresses_v1';

export function getOfficialDepositBanks(): OfficialSettlementBank[] {
  if (typeof window === 'undefined') return OFFICIAL_DEPOSIT_BANKS;
  try {
    const raw = localStorage.getItem(OFFICIAL_DEPOSIT_BANKS_STORAGE_KEY);
    if (!raw) return DEFAULT_OFFICIAL_DEPOSIT_BANKS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      OFFICIAL_DEPOSIT_BANKS.splice(0, OFFICIAL_DEPOSIT_BANKS.length, ...parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_OFFICIAL_DEPOSIT_BANKS;
}

export function saveOfficialDepositBanks(
  banks: OfficialSettlementBank[]
): OfficialSettlementBank[] {
  if (typeof window === 'undefined') return banks;
  try {
    localStorage.setItem(OFFICIAL_DEPOSIT_BANKS_STORAGE_KEY, JSON.stringify(banks));
    OFFICIAL_DEPOSIT_BANKS.splice(0, OFFICIAL_DEPOSIT_BANKS.length, ...banks);
    window.dispatchEvent(new CustomEvent('zentro-payment-methods-updated', { detail: { banks } }));
  } catch {
    // ignore
  }
  return banks;
}

export function getOfficialUsdtAddresses(): UsdtNetworkOption[] {
  if (typeof window === 'undefined') return USDT_NETWORK_OPTIONS;
  try {
    const raw = localStorage.getItem(OFFICIAL_USDT_ADDRESSES_STORAGE_KEY);
    if (!raw) return DEFAULT_USDT_NETWORK_OPTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      USDT_NETWORK_OPTIONS.splice(0, USDT_NETWORK_OPTIONS.length, ...parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_USDT_NETWORK_OPTIONS;
}

export function saveOfficialUsdtAddresses(
  addresses: UsdtNetworkOption[]
): UsdtNetworkOption[] {
  if (typeof window === 'undefined') return addresses;
  try {
    localStorage.setItem(OFFICIAL_USDT_ADDRESSES_STORAGE_KEY, JSON.stringify(addresses));
    USDT_NETWORK_OPTIONS.splice(0, USDT_NETWORK_OPTIONS.length, ...addresses);
    window.dispatchEvent(
      new CustomEvent('zentro-payment-methods-updated', { detail: { addresses } })
    );
  } catch {
    // ignore
  }
  return addresses;
}

export function getBanksForCountry(country: string): OfficialSettlementBank[] {
  const allBanks = getOfficialDepositBanks();
  const cleanCountry = (country || '').trim().toLowerCase();
  if (!cleanCountry || cleanCountry === 'all') {
    return allBanks;
  }
  const exact = allBanks.filter(
    (b) =>
      b.country.toLowerCase() === cleanCountry ||
      b.country.toLowerCase() === 'all countries' ||
      b.country.toLowerCase() === 'international'
  );
  if (exact.length > 0) {
    return exact;
  }
  return allBanks;
}

const DEPOSIT_REQUESTS_STORAGE_PREFIX = 'zentro_deposit_requests_v1_';

export function getLocalDepositRequests(userId: string): DepositRequestRecord[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${DEPOSIT_REQUESTS_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalDepositRequest(userId: string, record: DepositRequestRecord): DepositRequestRecord[] {
  if (typeof window === 'undefined' || !userId) return [record];
  try {
    const existing = getLocalDepositRequests(userId);
    const updated = [record, ...existing];
    localStorage.setItem(`${DEPOSIT_REQUESTS_STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
    return updated;
  } catch {
    return [record];
  }
}

// ================= WITHDRAWAL AREA CONSTANTS & HELPERS =================
export const BANK_MIN_WITHDRAW_LKR = 500;
export const BANK_WITHDRAW_FEE_LKR = 25;
export const BANK_WITHDRAW_PRESETS_LKR = [500, 1000, 2500, 5000, 10000, 25000];

export const USDT_BEP20_MIN_WITHDRAW_USDT = 5;
export const USDT_BEP20_WITHDRAW_FEE_USDT = 0.5;
export const USDT_BEP20_WITHDRAW_PRESETS_USDT = [5, 10, 25, 50, 100, 250];

export interface WithdrawalRequestRecord {
  id: string;
  referenceCode: string;
  userId: string;
  username: string;
  withdrawType: 'bank' | 'usdt_bep20';
  networkOrBankName: string;
  accountHolderOrLabel: string;
  accountNumberOrAddress: string;
  branchOrStandard: string;
  amountInLkr: number;
  feeInLkr: number;
  netAmountInLkr: number;
  amountInDisplayUnit: number;
  feeInDisplayUnit: number;
  netAmountInDisplayUnit: number;
  displayUnit: 'LKR' | 'USDT';
  activeCurrency: string;
  status: 'pending_admin' | 'approved' | 'rejected';
  createdAt: string;
}

export function isUsdtBep20BankAccount(account: BankAccountRecord): boolean {
  const routing = (account.routingOrSwift || '').toUpperCase();
  const bankName = (account.bankName || '').toUpperCase();
  return (
    routing.includes('BEP20') ||
    routing.includes('BEP-20') ||
    bankName.includes('BEP20') ||
    bankName.includes('BEP-20') ||
    bankName.includes('USDT')
  );
}

const WITHDRAWAL_REQUESTS_STORAGE_PREFIX = 'zentro_withdrawal_requests_v1_';

export function getLocalWithdrawalRequests(userId: string): WithdrawalRequestRecord[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${WITHDRAWAL_REQUESTS_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalWithdrawalRequest(
  userId: string,
  record: WithdrawalRequestRecord
): WithdrawalRequestRecord[] {
  if (typeof window === 'undefined' || !userId) return [record];
  try {
    const existing = getLocalWithdrawalRequests(userId);
    const updated = [record, ...existing];
    localStorage.setItem(
      `${WITHDRAWAL_REQUESTS_STORAGE_PREFIX}${userId}`,
      JSON.stringify(updated)
    );
    return updated;
  } catch {
    return [record];
  }
}

// ================= ADMIN PANEL CONSTANTS & HELPERS =================
export const ADMIN_LOGIN_ID = '0711452778';
export const ADMIN_PASSWORD = 'viduth';

export function isAdminCredentials(identifier: string, password: string): boolean {
  const cleanId = identifier.trim().replace(/\s+/g, '');
  const normalizedDigits = cleanId.replace(/[^0-9]/g, '');
  const idMatch =
    cleanId === ADMIN_LOGIN_ID ||
    normalizedDigits === ADMIN_LOGIN_ID ||
    normalizedDigits === '94711452778' ||
    normalizedDigits === '711452778';
  return idMatch && password === ADMIN_PASSWORD;
}

export function updateLocalDepositRequestStatus(
  userId: string,
  requestId: string,
  nextStatus: 'pending_admin' | 'approved' | 'rejected'
): DepositRequestRecord[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const list = getLocalDepositRequests(userId);
    const updated = list.map((item) =>
      item.id === requestId ? { ...item, status: nextStatus } : item
    );
    localStorage.setItem(
      `${DEPOSIT_REQUESTS_STORAGE_PREFIX}${userId}`,
      JSON.stringify(updated)
    );
    return updated;
  } catch {
    return [];
  }
}

export function updateLocalWithdrawalRequestStatus(
  userId: string,
  requestId: string,
  nextStatus: 'pending_admin' | 'approved' | 'rejected'
): WithdrawalRequestRecord[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const list = getLocalWithdrawalRequests(userId);
    const updated = list.map((item) =>
      item.id === requestId ? { ...item, status: nextStatus } : item
    );
    localStorage.setItem(
      `${WITHDRAWAL_REQUESTS_STORAGE_PREFIX}${userId}`,
      JSON.stringify(updated)
    );
    return updated;
  } catch {
    return [];
  }
}

// ================= NOTIFICATION SYSTEM TYPES & STORAGE HELPERS =================
export type NotificationCategory =
  | 'transaction'
  | 'vip'
  | 'mining'
  | 'task'
  | 'referral'
  | 'security'
  | 'system';

export type NotificationPriority = 'normal' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  userId: string; // specific user uid or 'ALL' for global broadcast
  targetUsername?: string;
  title: string;
  titleSi?: string;
  message: string;
  messageSi?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  isBroadcast?: boolean;
  actionTab?: 'home' | 'team' | 'task' | 'vip' | 'my';
  actionModal?: 'deposit' | 'withdrawal' | 'active_vip' | 'support' | 'compare_tiers';
  actionLabel?: string;
  actionLabelSi?: string;
  createdAt: string;
}

const USER_NOTIFICATIONS_PREFIX = 'zentro_notifications_v1_';
const GLOBAL_BROADCASTS_KEY = 'zentro_global_broadcasts_v1';
const USER_READ_BROADCASTS_PREFIX = 'zentro_read_broadcasts_v1_';
const USER_DISMISSED_BROADCASTS_PREFIX = 'zentro_dismissed_broadcasts_v1_';

export function emitNotificationsUpdatedEvent(detail?: {
  userId?: string;
  notification?: AppNotification;
}) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('zentro-notifications-updated', { detail: detail || {} })
    );
  } catch {
    // ignore
  }
}

export function getGlobalBroadcastNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GLOBAL_BROADCASTS_KEY);
    if (!raw) {
      const defaultBroadcast: AppNotification = {
        id: 'bcast_welcome_zentro_v1',
        userId: 'ALL',
        title: 'Zentro Live Currency Mining & VIP Compare Now Active',
        titleSi: 'Zentro සජීවී මුදල් කැණීම සහ VIP සංසන්දනය දැන් ක්‍රියාත්මකයි',
        message:
          'Earn up to 12% daily mining yield with Zentro Platinum, complete daily VIP tasks, and earn 5-level referral commissions.',
        messageSi:
          'Zentro Platinum සමඟ දිනකට 12% දක්වා සජීවී පතල් කැණීමේ ප්‍රතිලාභ, දෛනික කාර්යයන් සහ මට්ටම් 5 කොමිස් ලබා ගන්න.',
        category: 'system',
        priority: 'high',
        read: false,
        isBroadcast: true,
        actionTab: 'vip',
        actionModal: 'compare_tiers',
        actionLabel: 'Compare VIP Tiers',
        actionLabelSi: 'VIP මට්ටම් සසඳන්න',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      };
      localStorage.setItem(GLOBAL_BROADCASTS_KEY, JSON.stringify([defaultBroadcast]));
      return [defaultBroadcast];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getUserNotifications(
  userId: string,
  username?: string
): AppNotification[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const key = `${USER_NOTIFICATIONS_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    let personalList: AppNotification[] = [];

    if (!raw) {
      const seedWelcome: AppNotification = {
        id: `notif_welcome_${userId}`,
        userId,
        title: `Welcome to Zentro, ${username || 'Member'}!`,
        titleSi: `Zentro වෙත සාදරයෙන් පිළිගනිමු, ${username || 'සාමාජිකයා'}!`,
        message:
          'Your +100 LKR Welcome Invitee Bonus is active. Complete your profile settings and explore VIP tiers to unlock daily mining yields.',
        messageSi:
          'ඔබගේ +100 LKR පිළිගැනීමේ ප්‍රසාද දීමනාව සක්‍රියයි. දෛනික ප්‍රතිලාභ ලබා ගැනීමට ඔබගේ ගිණුම සම්පූර්ණ කර VIP මට්ටම් පරීක්ෂා කරන්න.',
        category: 'system',
        priority: 'normal',
        read: false,
        actionTab: 'vip',
        actionLabel: 'Explore VIP Tiers',
        actionLabelSi: 'VIP මට්ටම් බලන්න',
        createdAt: new Date().toISOString(),
      };
      personalList = [seedWelcome];
      localStorage.setItem(key, JSON.stringify(personalList));
    } else {
      const parsed = JSON.parse(raw);
      personalList = Array.isArray(parsed) ? parsed : [];
    }

    const readBroadcastIds: string[] = JSON.parse(
      localStorage.getItem(`${USER_READ_BROADCASTS_PREFIX}${userId}`) || '[]'
    );
    const dismissedBroadcastIds: string[] = JSON.parse(
      localStorage.getItem(`${USER_DISMISSED_BROADCASTS_PREFIX}${userId}`) || '[]'
    );

    const broadcasts = getGlobalBroadcastNotifications()
      .filter((b) => !dismissedBroadcastIds.includes(b.id))
      .map((b) => ({
        ...b,
        isBroadcast: true,
        read: readBroadcastIds.includes(b.id),
      }));

    const combined = [...personalList, ...broadcasts];
    combined.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return combined;
  } catch {
    return [];
  }
}

export function pushUserNotification(
  userId: string,
  payload: {
    title: string;
    titleSi?: string;
    message: string;
    messageSi?: string;
    category: NotificationCategory;
    priority?: NotificationPriority;
    actionTab?: 'home' | 'team' | 'task' | 'vip' | 'my';
    actionModal?: 'deposit' | 'withdrawal' | 'active_vip' | 'support' | 'compare_tiers';
    actionLabel?: string;
    actionLabelSi?: string;
  }
): AppNotification {
  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title: payload.title,
    titleSi: payload.titleSi,
    message: payload.message,
    messageSi: payload.messageSi,
    category: payload.category,
    priority: payload.priority || 'normal',
    read: false,
    actionTab: payload.actionTab,
    actionModal: payload.actionModal,
    actionLabel: payload.actionLabel,
    actionLabelSi: payload.actionLabelSi,
    createdAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined' || !userId) return newNotif;

  try {
    const key = `${USER_NOTIFICATIONS_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    const existing: AppNotification[] = raw ? JSON.parse(raw) : [];
    const updated = [newNotif, ...existing].slice(0, 120);
    localStorage.setItem(key, JSON.stringify(updated));
    emitNotificationsUpdatedEvent({ userId, notification: newNotif });
  } catch {
    // ignore storage errors
  }

  return newNotif;
}

export function pushGlobalBroadcastNotification(payload: {
  title: string;
  titleSi?: string;
  message: string;
  messageSi?: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  actionTab?: 'home' | 'team' | 'task' | 'vip' | 'my';
  actionModal?: 'deposit' | 'withdrawal' | 'active_vip' | 'support' | 'compare_tiers';
  actionLabel?: string;
  actionLabelSi?: string;
}): AppNotification {
  const newBroadcast: AppNotification = {
    id: `bcast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: 'ALL',
    title: payload.title,
    titleSi: payload.titleSi,
    message: payload.message,
    messageSi: payload.messageSi,
    category: payload.category,
    priority: payload.priority || 'high',
    read: false,
    isBroadcast: true,
    actionTab: payload.actionTab,
    actionModal: payload.actionModal,
    actionLabel: payload.actionLabel,
    actionLabelSi: payload.actionLabelSi,
    createdAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return newBroadcast;

  try {
    const existing = getGlobalBroadcastNotifications();
    const updated = [newBroadcast, ...existing].slice(0, 50);
    localStorage.setItem(GLOBAL_BROADCASTS_KEY, JSON.stringify(updated));
    emitNotificationsUpdatedEvent({ userId: 'ALL', notification: newBroadcast });
  } catch {
    // ignore
  }

  return newBroadcast;
}

export function deleteGlobalBroadcastNotification(broadcastId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getGlobalBroadcastNotifications();
    const updated = existing.filter((b) => b.id !== broadcastId);
    localStorage.setItem(GLOBAL_BROADCASTS_KEY, JSON.stringify(updated));
    emitNotificationsUpdatedEvent({ userId: 'ALL' });
  } catch {
    // ignore
  }
}

export function updateGlobalBroadcastNotification(
  broadcastId: string,
  patch: Partial<AppNotification>
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getGlobalBroadcastNotifications();
    const updated = existing.map((b) => (b.id === broadcastId ? { ...b, ...patch } : b));
    localStorage.setItem(GLOBAL_BROADCASTS_KEY, JSON.stringify(updated));
    emitNotificationsUpdatedEvent({ userId: 'ALL' });
  } catch {
    // ignore
  }
}

const USER_CLOSED_DASHBOARD_BANNERS_PREFIX = 'zentro_closed_dash_banners_v1_';

export function getActiveDashboardAnnouncementsForUser(userId: string): AppNotification[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const closedIds: string[] = JSON.parse(
      localStorage.getItem(`${USER_CLOSED_DASHBOARD_BANNERS_PREFIX}${userId}`) || '[]'
    );
    const dismissedIds: string[] = JSON.parse(
      localStorage.getItem(`${USER_DISMISSED_BROADCASTS_PREFIX}${userId}`) || '[]'
    );
    return getGlobalBroadcastNotifications().filter(
      (b) => !closedIds.includes(b.id) && !dismissedIds.includes(b.id)
    );
  } catch {
    return [];
  }
}

export function dismissDashboardAnnouncementBanner(
  userId: string,
  broadcastId: string
): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const key = `${USER_CLOSED_DASHBOARD_BANNERS_PREFIX}${userId}`;
    const closedIds: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!closedIds.includes(broadcastId)) {
      localStorage.setItem(key, JSON.stringify([...closedIds, broadcastId]));
    }
    emitNotificationsUpdatedEvent({ userId });
  } catch {
    // ignore
  }
}

export function markNotificationAsRead(userId: string, notificationId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    if (notificationId.startsWith('bcast_')) {
      const readKey = `${USER_READ_BROADCASTS_PREFIX}${userId}`;
      const readIds: string[] = JSON.parse(localStorage.getItem(readKey) || '[]');
      if (!readIds.includes(notificationId)) {
        localStorage.setItem(readKey, JSON.stringify([...readIds, notificationId]));
      }
    } else {
      const key = `${USER_NOTIFICATIONS_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: AppNotification[] = JSON.parse(raw);
        const updated = list.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        localStorage.setItem(key, JSON.stringify(updated));
      }
    }
    emitNotificationsUpdatedEvent({ userId });
  } catch {
    // ignore
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const key = `${USER_NOTIFICATIONS_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: AppNotification[] = JSON.parse(raw);
      const updated = list.map((n) => ({ ...n, read: true }));
      localStorage.setItem(key, JSON.stringify(updated));
    }

    const broadcasts = getGlobalBroadcastNotifications();
    const readKey = `${USER_READ_BROADCASTS_PREFIX}${userId}`;
    const allBroadcastIds = broadcasts.map((b) => b.id);
    localStorage.setItem(readKey, JSON.stringify(allBroadcastIds));
    emitNotificationsUpdatedEvent({ userId });
  } catch {
    // ignore
  }
}

export function deleteUserNotification(userId: string, notificationId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    if (notificationId.startsWith('bcast_')) {
      const disKey = `${USER_DISMISSED_BROADCASTS_PREFIX}${userId}`;
      const dismissedIds: string[] = JSON.parse(localStorage.getItem(disKey) || '[]');
      if (!dismissedIds.includes(notificationId)) {
        localStorage.setItem(disKey, JSON.stringify([...dismissedIds, notificationId]));
      }
    } else {
      const key = `${USER_NOTIFICATIONS_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: AppNotification[] = JSON.parse(raw);
        const updated = list.filter((n) => n.id !== notificationId);
        localStorage.setItem(key, JSON.stringify(updated));
      }
    }
    emitNotificationsUpdatedEvent({ userId });
  } catch {
    // ignore
  }
}

export function clearReadUserNotifications(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const key = `${USER_NOTIFICATIONS_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: AppNotification[] = JSON.parse(raw);
      const unreadOnly = list.filter((n) => !n.read);
      localStorage.setItem(key, JSON.stringify(unreadOnly));
    }

    const readKey = `${USER_READ_BROADCASTS_PREFIX}${userId}`;
    const disKey = `${USER_DISMISSED_BROADCASTS_PREFIX}${userId}`;
    const readIds: string[] = JSON.parse(localStorage.getItem(readKey) || '[]');
    const dismissedIds: string[] = JSON.parse(localStorage.getItem(disKey) || '[]');
    const mergedDismissed = Array.from(new Set([...dismissedIds, ...readIds]));
    localStorage.setItem(disKey, JSON.stringify(mergedDismissed));

    emitNotificationsUpdatedEvent({ userId });
  } catch {
    // ignore
  }
}

// ================= KYC VERIFICATION LOCAL STORAGE HELPERS =================
const KYC_REQUESTS_STORAGE_KEY = 'zentro_kyc_requests_v1';

export function getLocalKycRequests(): KycRecordData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KYC_REQUESTS_STORAGE_KEY);
    const list: KycRecordData[] = raw ? JSON.parse(raw) : [];
    const byUser = new Map<string, KycRecordData>();
    if (Array.isArray(list)) {
      list.forEach((item) => {
        if (item && item.userId) {
          byUser.set(item.userId, item);
        }
      });
    }

    // Also merge any kycRecord stored in zentro_accounts_db_v1
    const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
    if (rawAccounts) {
      const accounts: Record<
        string,
        { profile: UserProfile; kycRecord?: KycRecordData | null }
      > = JSON.parse(rawAccounts);
      Object.values(accounts).forEach((acc) => {
        if (acc?.kycRecord && acc.profile?.uid) {
          const existing = byUser.get(acc.profile.uid);
          byUser.set(acc.profile.uid, {
            ...acc.kycRecord,
            ...existing,
            userId: acc.profile.uid,
            username: existing?.username || acc.kycRecord.username || acc.profile.username,
            mobile:
              existing?.mobile ||
              acc.kycRecord.mobile ||
              `${acc.profile.countryCode || ''} ${acc.profile.mobile || ''}`.trim(),
            country: existing?.country || acc.kycRecord.country || acc.profile.country,
            documentImageDataUrl:
              existing?.documentImageDataUrl || acc.kycRecord.documentImageDataUrl,
            documentBackImageDataUrl:
              existing?.documentBackImageDataUrl || acc.kycRecord.documentBackImageDataUrl,
          });
        }
      });
    }

    return Array.from(byUser.values()).sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
    );
  } catch {
    return [];
  }
}

export function getLocalKycRequestByUser(userId: string): KycRecordData | null {
  if (!userId) return null;
  const all = getLocalKycRequests();
  return all.find((item) => item.userId === userId) || null;
}

export function saveLocalKycRequest(record: KycRecordData): KycRecordData[] {
  if (typeof window === 'undefined' || !record?.userId) return [];
  try {
    const raw = localStorage.getItem(KYC_REQUESTS_STORAGE_KEY);
    const existing: KycRecordData[] = raw ? JSON.parse(raw) : [];
    const filtered = Array.isArray(existing)
      ? existing.filter((item) => item.userId !== record.userId)
      : [];
    const updated = [record, ...filtered];
    localStorage.setItem(KYC_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('zentro-kyc-updated', { detail: { userId: record.userId, record } }));
    return updated;
  } catch {
    return [record];
  }
}

export function updateLocalKycRequestStatus(
  userId: string,
  nextStatus: 'pending' | 'verified' | 'rejected',
  processingStage?: 'submitted' | 'processing' | 'verified' | 'rejected',
  adminNotes?: string
): KycRecordData | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const nowIso = new Date().toISOString();
    const all = getLocalKycRequests();
    const target = all.find((r) => r.userId === userId);
    const computedStage: 'submitted' | 'processing' | 'verified' | 'rejected' =
      processingStage ||
      (nextStatus === 'verified'
        ? 'verified'
        : nextStatus === 'rejected'
          ? 'rejected'
          : 'processing');

    const updatedRecord: KycRecordData = target
      ? {
          ...target,
          status: nextStatus,
          processingStage: computedStage,
          adminNotes: adminNotes !== undefined ? adminNotes : target.adminNotes,
          reviewedAt: nowIso,
          updatedAt: nowIso,
        }
      : {
          id: `kyc_${userId}`,
          userId,
          fullName: 'Verified by Admin',
          documentType: 'national_id',
          documentNumber: 'ADMIN-VERIFIED',
          aiVerificationNotes: adminNotes || 'Manually updated by Admin',
          status: nextStatus,
          processingStage: computedStage,
          adminNotes: adminNotes || '',
          reviewedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

    const raw = localStorage.getItem(KYC_REQUESTS_STORAGE_KEY);
    const existing: KycRecordData[] = raw ? JSON.parse(raw) : [];
    const nextList = [
      updatedRecord,
      ...(Array.isArray(existing) ? existing.filter((r) => r.userId !== userId) : []),
    ];
    localStorage.setItem(KYC_REQUESTS_STORAGE_KEY, JSON.stringify(nextList));

    // Also update zentro_accounts_db_v1 and active session if present
    const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
    if (rawAccounts) {
      const accounts = JSON.parse(rawAccounts);
      Object.keys(accounts).forEach((key) => {
        const entry = accounts[key];
        if (entry?.profile?.uid === userId) {
          entry.profile = {
            ...entry.profile,
            kycStatus: nextStatus,
            updatedAt: nowIso,
          };
          entry.kycRecord = updatedRecord;
        }
      });
      localStorage.setItem('zentro_accounts_db_v1', JSON.stringify(accounts));
    }

    const activeRaw = localStorage.getItem('zentro_active_local_user_v1');
    if (activeRaw) {
      const activeUser: UserProfile = JSON.parse(activeRaw);
      if (activeUser?.uid === userId) {
        const nextActive: UserProfile = {
          ...activeUser,
          kycStatus: nextStatus,
          updatedAt: nowIso,
        };
        localStorage.setItem('zentro_active_local_user_v1', JSON.stringify(nextActive));
      }
    }

    window.dispatchEvent(
      new CustomEvent('zentro-kyc-updated', {
        detail: { userId, record: updatedRecord },
      })
    );
    return updatedRecord;
  } catch {
    return null;
  }
}

// ================= VIP DAY CHALLENGE EXTRA INVESTMENT TASKS =================
// Bronze: 7 Days · Invest 1,000 LKR · 1.5x Net Profit (+1,500 LKR · Total: 2,500 LKR)
// Silver: 14 Days · Invest 3,000 LKR · 1.8x Net Profit (+5,400 LKR · Total: 8,400 LKR)
// Gold: 21 Days · Invest 6,000 LKR · 2.2x Net Profit (+13,200 LKR · Total: 19,200 LKR)
// Platinum: 28 Days · Invest 10,000 LKR · 2.8x Net Profit (+28,000 LKR · Total: 38,000 LKR)
// Rule: Higher VIP package members are eligible for all challenges of their tier AND lower tiers
// (e.g., Gold member can join Bronze 7-Day, Silver 14-Day, and Gold 21-Day challenges).

export interface VipDayChallengeConfig {
  id: string;
  vipLevel: number;
  vipName: string;
  vipNameSi: string;
  durationDays: number;
  investmentAmountLkr: number;
  netProfitMultiplier: number;
  netProfitLkr: number;
  totalReturnLkr: number;
  title: string;
  titleSi: string;
  badge: string;
  badgeSi: string;
  gradient: string;
  borderClass: string;
  accentColor: string;
  tagColor: string;
  imageUrl: string;
}

export interface UserVipDayChallengeState {
  challengeId: string;
  userId: string;
  investedAmountLkr: number;
  netProfitLkr: number;
  totalReturnLkr: number;
  durationDays: number;
  currentDay: number;
  startedAt: string;
  lastDayAdvanceAt: string;
  status: 'active' | 'completed' | 'claimed';
  claimedAt?: string;
}

export const DEFAULT_VIP_DAY_CHALLENGES: VipDayChallengeConfig[] = [
  {
    id: 'bronze_7d',
    vipLevel: 1,
    vipName: 'Zentro Bronze',
    vipNameSi: 'Zentro බ්‍රෝන්ස්',
    durationDays: 7,
    investmentAmountLkr: 1000,
    netProfitMultiplier: 1.5,
    netProfitLkr: 500,
    totalReturnLkr: 1500,
    title: 'Bronze 7-Day Challenge',
    titleSi: 'බ්‍රෝන්ස් දින 7 අභියෝගය',
    badge: '7 DAYS · 1.5x TOTAL RETURN',
    badgeSi: 'දින 7 · 1.5x මුළු ප්‍රතිලාභය',
    gradient: 'from-amber-500 via-orange-600 to-amber-700',
    borderClass: 'border-amber-400/50',
    accentColor: 'text-amber-500',
    tagColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    imageUrl: VIP_TIER_IMAGES[1],
  },
  {
    id: 'silver_14d',
    vipLevel: 2,
    vipName: 'Zentro Silver',
    vipNameSi: 'Zentro සිල්වර්',
    durationDays: 14,
    investmentAmountLkr: 3000,
    netProfitMultiplier: 1.5,
    netProfitLkr: 1500,
    totalReturnLkr: 4500,
    title: 'Silver 14-Day Challenge',
    titleSi: 'සිල්වර් දින 14 අභියෝගය',
    badge: '14 DAYS · 1.5x TOTAL RETURN',
    badgeSi: 'දින 14 · 1.5x මුළු ප්‍රතිලාභය',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    borderClass: 'border-sky-400/50',
    accentColor: 'text-sky-400',
    tagColor: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
    imageUrl: VIP_TIER_IMAGES[2],
  },
  {
    id: 'gold_14d',
    vipLevel: 3,
    vipName: 'Zentro Gold',
    vipNameSi: 'Zentro ගෝල්ඩ්',
    durationDays: 14,
    investmentAmountLkr: 6000,
    netProfitMultiplier: 1.5,
    netProfitLkr: 3000,
    totalReturnLkr: 9000,
    title: 'Gold 14-Day Challenge',
    titleSi: 'ගෝල්ඩ් දින 14 අභියෝගය',
    badge: '14 DAYS · 1.5x TOTAL RETURN',
    badgeSi: 'දින 14 · 1.5x මුළු ප්‍රතිලාභය',
    gradient: 'from-yellow-500 via-amber-500 to-rose-600',
    borderClass: 'border-yellow-400/50',
    accentColor: 'text-yellow-400',
    tagColor: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    imageUrl: VIP_TIER_IMAGES[3],
  },
  {
    id: 'platinum_14d',
    vipLevel: 4,
    vipName: 'Zentro Platinum',
    vipNameSi: 'Zentro ප්ලැටිනම්',
    durationDays: 14,
    investmentAmountLkr: 10000,
    netProfitMultiplier: 1.5,
    netProfitLkr: 5000,
    totalReturnLkr: 15000,
    title: 'Platinum 14-Day Challenge',
    titleSi: 'ප්ලැටිනම් දින 14 අභියෝගය',
    badge: '14 DAYS · 1.5x TOTAL RETURN',
    badgeSi: 'දින 14 · 1.5x මුළු ප්‍රතිලාභය',
    gradient: 'from-purple-600 via-pink-600 to-blue-600',
    borderClass: 'border-purple-400/50',
    accentColor: 'text-purple-400',
    tagColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    imageUrl: VIP_TIER_IMAGES[4],
  },
];

export const VIP_DAY_CHALLENGES = DEFAULT_VIP_DAY_CHALLENGES;

const VIP_DAY_CHALLENGES_CATALOG_STORAGE_KEY = 'zentro_vip_day_challenges_catalog_v2';

export function getVipDayChallengesCatalog(): VipDayChallengeConfig[] {
  if (typeof window === 'undefined') return DEFAULT_VIP_DAY_CHALLENGES;
  try {
    const raw = localStorage.getItem(VIP_DAY_CHALLENGES_CATALOG_STORAGE_KEY);
    if (!raw) return DEFAULT_VIP_DAY_CHALLENGES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_VIP_DAY_CHALLENGES;
    // Auto-migrate outdated 2500 total payout math if found from earlier build
    const needsMigration = parsed.some((c: VipDayChallengeConfig) => 
      c.id === 'bronze_7d' && c.totalReturnLkr === 2500
    );
    if (needsMigration) {
      localStorage.removeItem(VIP_DAY_CHALLENGES_CATALOG_STORAGE_KEY);
      return DEFAULT_VIP_DAY_CHALLENGES;
    }
    return parsed;
  } catch {
    return DEFAULT_VIP_DAY_CHALLENGES;
  }
}

export function saveVipDayChallengesCatalog(
  challenges: VipDayChallengeConfig[]
): VipDayChallengeConfig[] {
  if (typeof window === 'undefined') return challenges;
  try {
    localStorage.setItem(
      VIP_DAY_CHALLENGES_CATALOG_STORAGE_KEY,
      JSON.stringify(challenges)
    );
    window.dispatchEvent(
      new CustomEvent('zentro-day-challenges-catalog-updated', {
        detail: challenges,
      })
    );
  } catch (e) {
    console.error('Error saving VIP day challenges catalog:', e);
  }
  return challenges;
}

export function resetVipDayChallengesCatalogToDefault(): VipDayChallengeConfig[] {
  if (typeof window === 'undefined') return DEFAULT_VIP_DAY_CHALLENGES;
  try {
    localStorage.removeItem(VIP_DAY_CHALLENGES_CATALOG_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('zentro-day-challenges-catalog-updated', {
        detail: DEFAULT_VIP_DAY_CHALLENGES,
      })
    );
  } catch (e) {
    console.error('Error resetting VIP day challenges catalog:', e);
  }
  return DEFAULT_VIP_DAY_CHALLENGES;
}

const VIP_DAY_CHALLENGES_STORAGE_PREFIX = 'zentro_vip_day_challenges_v1_';

export function getUserVipDayChallenges(userId: string): Record<string, UserVipDayChallengeState> {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const raw = localStorage.getItem(`${VIP_DAY_CHALLENGES_STORAGE_PREFIX}${userId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveUserVipDayChallenge(
  userId: string,
  state: UserVipDayChallengeState
): Record<string, UserVipDayChallengeState> {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const existing = getUserVipDayChallenges(userId);
    existing[state.challengeId] = state;
    localStorage.setItem(
      `${VIP_DAY_CHALLENGES_STORAGE_PREFIX}${userId}`,
      JSON.stringify(existing)
    );
    window.dispatchEvent(
      new CustomEvent('zentro-vip-challenges-updated', {
        detail: { userId, challengeId: state.challengeId, state },
      })
    );
    return existing;
  } catch {
    return {};
  }
}

export function advanceUserVipDayChallengeDay(
  userId: string,
  challengeId: string
): UserVipDayChallengeState | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const existing = getUserVipDayChallenges(userId);
    const item = existing[challengeId];
    if (!item || item.status === 'claimed') return null;

    const nextDay = Math.min(item.durationDays, item.currentDay + 1);
    const nextStatus = nextDay >= item.durationDays ? 'completed' : 'active';
    const updated: UserVipDayChallengeState = {
      ...item,
      currentDay: nextDay,
      status: nextStatus,
      lastDayAdvanceAt: new Date().toISOString(),
    };
    existing[challengeId] = updated;
    localStorage.setItem(
      `${VIP_DAY_CHALLENGES_STORAGE_PREFIX}${userId}`,
      JSON.stringify(existing)
    );
    window.dispatchEvent(
      new CustomEvent('zentro-vip-challenges-updated', {
        detail: { userId, challengeId, state: updated },
      })
    );
    return updated;
  } catch {
    return null;
  }
}

export function resetUserVipDayChallenge(userId: string, challengeId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const existing = getUserVipDayChallenges(userId);
    delete existing[challengeId];
    localStorage.setItem(
      `${VIP_DAY_CHALLENGES_STORAGE_PREFIX}${userId}`,
      JSON.stringify(existing)
    );
    window.dispatchEvent(
      new CustomEvent('zentro-vip-challenges-updated', {
        detail: { userId, challengeId },
      })
    );
  } catch {
    // ignore
  }
}

/* ============================================================================
 * OFFICIAL CUSTOMER SUPPORT CHANNELS & REAL-TIME LIVE CHAT TYPES + HELPERS
 * ============================================================================ */

export interface LiveChatMessage {
  id: string;
  senderUid: string;
  senderUsername: string;
  senderVipLevel: number;
  senderIsAdmin: boolean;
  recipientUid: string; // 'GLOBAL' | 'ADMIN' | target user uid
  recipientUsername?: string;
  text: string;
  createdAt: string;
}

export interface LiveChatUserPresence {
  uid: string;
  username: string;
  vipLevel: number;
  isAdmin: boolean;
  country?: string;
  lastSeenAt: string;
}

export type SupportChannelLogoType =
  | 'whatsapp_channel'
  | 'telegram_channel'
  | 'whatsapp_care'
  | 'telegram_care';

export interface SupportChannelItem {
  id: string;
  logoType: SupportChannelLogoType;
  title: string;
  titleSi: string;
  subtitle: string;
  subtitleSi: string;
  badge: string;
  url: string;
}

export const DEFAULT_SUPPORT_CHANNELS: SupportChannelItem[] = [
  {
    id: 'ch_whatsapp_official',
    logoType: 'whatsapp_channel',
    title: 'WhatsApp Official Channel',
    titleSi: 'WhatsApp නිල නාලිකාව (Official Channel)',
    subtitle: 'Join Zentro Official WhatsApp broadcast channel for daily payout & VIP updates',
    subtitleSi: 'දෛනික ගෙවීම් සහ නිල නිවේදන සඳහා WhatsApp නිල නාලිකාවට එක්වන්න',
    badge: 'OFFICIAL WHATSAPP',
    url: 'https://whatsapp.com/channel/0029VaZentroOfficial',
  },
  {
    id: 'ch_telegram_official',
    logoType: 'telegram_channel',
    title: 'Telegram Official Channel',
    titleSi: 'Telegram නිල නාලිකාව (Official Channel)',
    subtitle: 'Join Zentro Official Telegram community channel for global announcements',
    subtitleSi: 'ජාත්‍යන්තර නිවේදන සහ VIP තොරතුරු සඳහා Telegram නිල නාලිකාවට එක්වන්න',
    badge: 'OFFICIAL TELEGRAM',
    url: 'https://t.me/ZentroOfficialChannel',
  },
  {
    id: 'ch_whatsapp_care',
    logoType: 'whatsapp_care',
    title: 'WhatsApp Support Care',
    titleSi: 'WhatsApp පාරිභෝගික සහාය (Hiring Manager)',
    subtitle: 'Direct WhatsApp desk for VIP upgrades, team hiring & settlement assistance',
    subtitleSi: 'VIP උත්ශ්‍රේණි කිරීම් සහ ගිණුම් සහාය සඳහා Hiring Manager WhatsApp සේවාව',
    badge: 'HIRING MANAGER · WHATSAPP',
    url: 'https://wa.me/94770090007?text=Hello%20Zentro%20Hiring%20Manager%20Support',
  },
  {
    id: 'ch_telegram_care',
    logoType: 'telegram_care',
    title: 'Telegram Support Care',
    titleSi: 'Telegram පාරිභෝගික සහාය (Hiring Manager)',
    subtitle: 'Direct Telegram Hiring Manager support desk for 24/7 member care',
    subtitleSi: 'පැය 24 පුරා ක්‍රියාත්මක Hiring Manager Telegram පාරිභෝගික සහාය සේවාව',
    badge: 'HIRING MANAGER · TELEGRAM',
    url: 'https://t.me/ZentroHiringManagerCare',
  },
];

export interface SupportLinksConfig {
  whatsappOfficialChannelUrl: string;
  telegramOfficialChannelUrl: string;
  whatsappSupportCareUrl: string;
  telegramSupportCareUrl: string;
  whatsappSupportCareLabel: string;
  telegramSupportCareLabel: string;
  channels?: SupportChannelItem[];
}

const LIVE_CHAT_MESSAGES_STORAGE_KEY = 'zentro_live_chat_messages_v1';
const SUPPORT_CONFIG_STORAGE_KEY = 'zentro_support_links_config_v1';

export const DEFAULT_SUPPORT_LINKS_CONFIG: SupportLinksConfig = {
  whatsappOfficialChannelUrl: 'https://whatsapp.com/channel/0029VaZentroOfficial',
  telegramOfficialChannelUrl: 'https://t.me/ZentroOfficialChannel',
  whatsappSupportCareUrl:
    'https://wa.me/94770090007?text=Hello%20Zentro%20Hiring%20Manager%20Support',
  telegramSupportCareUrl: 'https://t.me/ZentroHiringManagerCare',
  whatsappSupportCareLabel: 'Hiring Manager Care (WhatsApp)',
  telegramSupportCareLabel: 'Hiring Manager Care (Telegram)',
  channels: DEFAULT_SUPPORT_CHANNELS,
};

export function getSupportLinksConfig(): SupportLinksConfig {
  if (typeof window === 'undefined') return DEFAULT_SUPPORT_LINKS_CONFIG;
  try {
    const raw = localStorage.getItem(SUPPORT_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_SUPPORT_LINKS_CONFIG;
    const parsed = JSON.parse(raw);
    const channels =
      Array.isArray(parsed?.channels) && parsed.channels.length > 0
        ? parsed.channels
        : DEFAULT_SUPPORT_CHANNELS;
    return {
      ...DEFAULT_SUPPORT_LINKS_CONFIG,
      ...(parsed || {}),
      channels,
    };
  } catch {
    return DEFAULT_SUPPORT_LINKS_CONFIG;
  }
}

export function saveSupportLinksConfig(config: SupportLinksConfig): SupportLinksConfig {
  if (typeof window === 'undefined') return config;
  const merged: SupportLinksConfig = {
    ...DEFAULT_SUPPORT_LINKS_CONFIG,
    ...config,
    channels:
      Array.isArray(config.channels) && config.channels.length > 0
        ? config.channels
        : DEFAULT_SUPPORT_CHANNELS,
  };
  try {
    localStorage.setItem(SUPPORT_CONFIG_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('zentro-support-config-updated', { detail: merged }));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('zentro_live_chat_v1');
      bc.postMessage({ type: 'config:updated', supportConfig: merged });
      bc.close();
    }
  } catch {
    // ignore
  }
  fetch('/api/live-chat/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(merged),
  }).catch(() => {});
  return merged;
}

export function getLocalLiveChatMessages(): LiveChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LIVE_CHAT_MESSAGES_STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: 'msg_welcome_global_1',
          senderUid: 'ADMIN',
          senderUsername: 'Zentro Official Admin',
          senderVipLevel: 4,
          senderIsAdmin: true,
          recipientUid: 'GLOBAL',
          recipientUsername: 'All Members',
          text: 'Welcome to Zentro 24/7 Live Community & Support Chat! You can message all members in Global Live Chat or send a Direct Message to Admin or any member anytime.',
          createdAt: new Date().toISOString(),
        },
      ];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mergeAndSaveLocalLiveChatMessages(
  incoming: LiveChatMessage[]
): LiveChatMessage[] {
  if (typeof window === 'undefined') return incoming;
  try {
    const existing = getLocalLiveChatMessages();
    const map = new Map<string, LiveChatMessage>();
    for (const m of existing) {
      if (m && m.id) map.set(m.id, m);
    }
    for (const m of incoming) {
      if (m && m.id) map.set(m.id, m);
    }
    const merged = Array.from(map.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-400);
    localStorage.setItem(LIVE_CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('zentro-live-chat-updated', { detail: merged }));
    return merged;
  } catch {
    return incoming;
  }
}

export function deleteLocalLiveChatMessage(messageId: string): LiveChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getLocalLiveChatMessages().filter((m) => m.id !== messageId);
    localStorage.setItem(LIVE_CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent('zentro-live-chat-updated', { detail: existing }));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('zentro_live_chat_v1');
      bc.postMessage({ type: 'message:deleted', messageId });
      bc.close();
    }
    fetch('/api/live-chat/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    }).catch(() => {});
    return existing;
  } catch {
    return [];
  }
}

export function getAllKnownLiveChatUsers(
  serverUsers: LiveChatUserPresence[] = []
): LiveChatUserPresence[] {
  const map = new Map<string, LiveChatUserPresence>();
  map.set('ADMIN', {
    uid: 'ADMIN',
    username: 'Zentro Official Admin',
    vipLevel: 4,
    isAdmin: true,
    country: 'Official HQ',
    lastSeenAt: new Date().toISOString(),
  });

  if (typeof window !== 'undefined') {
    try {
      const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
      const accounts: Record<string, { profile: UserProfile }> = rawAccounts
        ? JSON.parse(rawAccounts)
        : {};
      for (const [uid, entry] of Object.entries(accounts)) {
        if (entry?.profile) {
          map.set(uid, {
            uid,
            username: entry.profile.username || 'Member',
            vipLevel: entry.profile.vipLevel || 0,
            isAdmin: false,
            country: entry.profile.country || '',
            lastSeenAt: String(entry.profile.updatedAt || new Date().toISOString()),
          });
        }
      }
    } catch {
      // ignore
    }
  }

  for (const u of serverUsers) {
    if (u && u.uid) {
      map.set(u.uid, u);
    }
  }

  return Array.from(map.values());
}

