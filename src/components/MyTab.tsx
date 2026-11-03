import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  History,
  Users,
  Landmark,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  LogOut,
  Clock,
  FileCheck2,
  Sparkles,
  Wallet,
  Crown,
  Camera,
  Eye,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import {
  UserProfile,
  TransactionRecord,
  BankAccountRecord,
  KycRecordData,
  ReferralRecordData,
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  VIP_TIERS,
  isProfileSetupComplete,
  getActiveCurrency,
  formatCurrencyValue,
  formatSiteAmount,
  replaceCurrencyInText,
  getDeterministicDeviceAndMac,
  isUsdtBep20BankAccount,
  getLocalKycRequestByUser,
  tr,
} from '../types';

function compressKycImageFile(file: File, maxDim = 960, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Invalid image result'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(reader.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

interface MyTabProps {
  profile: UserProfile;
  transactions: TransactionRecord[];
  bankAccounts: BankAccountRecord[];
  kycRecord: KycRecordData | null;
  referrals: ReferralRecordData[];
  initialSubTab?: 'profile' | 'kyc' | 'transactions' | 'referrals' | 'bank' | 'security';
  onUpdateProfile: (data: {
    username: string;
    countryCode: string;
    mobile: string;
    country: string;
    currency: string;
    language: string;
    securityPasswordHash: string;
  }) => Promise<void>;
  onSubmitKyc: (data: {
    fullName: string;
    documentType: 'passport' | 'national_id' | 'driver_license';
    documentNumber: string;
    aiVerificationNotes: string;
    documentImageDataUrl?: string;
    documentBackImageDataUrl?: string;
    documentFileName?: string;
    documentBackFileName?: string;
  }) => Promise<void>;
  onAddBankAccount: (data: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    routingOrSwift: string;
    securityPassword: string;
  }) => Promise<void>;
  onDeleteBankAccount: (bankId: string) => Promise<void>;
  onQuickChangeLanguage?: (nextLang: string) => void;
  onOpenCustomerSupport?: () => void;
  onSignOut?: () => void;
}

/* ============================================================================
 * CREATIVE ZENTRO MULTI-COLOR (BLUE + PINK + RED/GOLD) ILLUSTRATIONS FOR MY TAB
 * Matches the standalone creative SVG artwork style on Login/Registration Page
 * ============================================================================ */

const ZentroProfileArtIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 36 36" className={`${className} shrink-0 overflow-visible drop-shadow-sm`} fill="none">
    <defs>
      <linearGradient id="myUserHeadG" x1="8" y1="4" x2="28" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="55%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="myUserBodyG" x1="5" y1="20" x2="31" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="50%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="11.5" r="6.5" fill="url(#myUserHeadG)" />
    <circle cx="16" cy="9.5" r="1.5" fill="#ffffff" fillOpacity="0.7" />
    <path
      d="M6.5 30.5C6.5 24.7 11.4 20.5 18 20.5C24.6 20.5 29.5 24.7 29.5 30.5C29.5 31.6 28.6 32.5 27.5 32.5H8.5C7.4 32.5 6.5 31.6 6.5 30.5Z"
      fill="url(#myUserBodyG)"
    />
    <path d="M14 21.2L18 26.5L22 21.2" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ZentroKycShieldArtIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 36 36" className={`${className} shrink-0 overflow-visible drop-shadow-sm`} fill="none">
    <defs>
      <linearGradient id="myKycShieldG" x1="6" y1="4" x2="30" y2="33" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <path
      d="M18 3.5L29.5 8.2V17.5C29.5 25.1 24.5 30.8 18 33C11.5 30.8 6.5 25.1 6.5 17.5V8.2L18 3.5Z"
      fill="url(#myKycShieldG)"
    />
    <circle cx="18" cy="15.5" r="3.5" fill="#ffffff" />
    <path d="M12.5 24.5C13.8 21.5 15.8 20.2 18 20.2C20.2 20.2 22.2 21.5 23.5 24.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="26.5" cy="26.5" r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M24.2 26.5L25.8 28.1L29 24.9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ZentroBankVaultArtIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 36 36" className={`${className} shrink-0 overflow-visible drop-shadow-sm`} fill="none">
    <defs>
      <linearGradient id="myBankG" x1="4" y1="5" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="52%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path d="M18 4L32 11.5V14.5H4V11.5L18 4Z" fill="url(#myBankG)" />
    <rect x="7" y="16" width="3.8" height="11" rx="1.2" fill="#38bdf8" />
    <rect x="13.4" y="16" width="3.8" height="11" rx="1.2" fill="#ec4899" />
    <rect x="19.8" y="16" width="3.8" height="11" rx="1.2" fill="#ec4899" />
    <rect x="25.8" y="16" width="3.8" height="11" rx="1.2" fill="#f43f5e" />
    <rect x="4" y="28" width="28" height="4" rx="1.8" fill="url(#myBankG)" />
    <circle cx="18" cy="10.2" r="2" fill="#fde047" />
  </svg>
);

const ZentroLedgerHistoryArtIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 36 36" className={`${className} shrink-0 overflow-visible drop-shadow-sm`} fill="none">
    <defs>
      <linearGradient id="myLedgerG" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
    <rect x="6" y="4" width="22" height="28" rx="4.5" fill="url(#myLedgerG)" />
    <line x1="11" y1="11" x2="22" y2="11" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="11" y1="16.5" x2="23" y2="16.5" stroke="#fde047" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="11" y1="22" x2="18" y2="22" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="26.5" cy="25.5" r="6.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.6" />
    <path d="M26.5 22.5V25.8L28.8 27.2" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ZentroTeamNetworkArtIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 36 36" className={`${className} shrink-0 overflow-visible drop-shadow-sm`} fill="none">
    <defs>
      <linearGradient id="myTeamG" x1="4" y1="6" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="10" r="5" fill="url(#myTeamG)" />
    <circle cx="8.5" cy="14.5" r="3.8" fill="#38bdf8" />
    <circle cx="27.5" cy="14.5" r="3.8" fill="#f43f5e" />
    <path d="M10 28.5C10 23.8 13.6 20.5 18 20.5C22.4 20.5 26 23.8 26 28.5C26 29.6 25.1 30.5 24 30.5H12C10.9 30.5 10 29.6 10 28.5Z" fill="url(#myTeamG)" />
    <path d="M3 28.5C3 25.2 5.4 22.8 8.5 22.8" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M33 28.5C33 25.2 30.6 22.8 27.5 22.8" stroke="#f43f5e" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const ZentroHardwareSecurityArtIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 36 36" className={`${className} shrink-0 overflow-visible drop-shadow-sm`} fill="none">
    <defs>
      <linearGradient id="myCpuG" x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="50%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="20" height="20" rx="5" fill="url(#myCpuG)" />
    <rect x="13" y="13" width="10" height="10" rx="2.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="18" cy="18" r="2.2" fill="#4ade80" />
    <path d="M13 4V8M18 4V8M23 4V8M13 28V32M18 28V32M23 28V32M4 13H8M4 18H8M4 23H8M28 13H32M28 18H32M28 23H32" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ZentroSupportCareArtIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 36 36" className={`${className} shrink-0 overflow-visible drop-shadow-sm`} fill="none">
    <defs>
      <linearGradient id="mySupG" x1="5" y1="5" x2="31" y2="31" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    <path d="M8 18C8 12.5 12.5 8 18 8C23.5 8 28 12.5 28 18V23C28 24.7 26.7 26 25 26H22V18H26V17C26 12.6 22.4 9 18 9C13.6 9 10 12.6 10 17V18H14V26H11C9.3 26 8 24.7 8 23V18Z" fill="url(#mySupG)" />
    <circle cx="18" cy="19" r="5.5" fill="url(#mySupG)" />
    <path d="M25 25.5C25 28.5 22 30.5 18 30.5" stroke="#ec4899" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="18" cy="30.5" r="2" fill="#22c55e" />
  </svg>
);

const ZentroSignOutArtIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 36 36" className={`${className} shrink-0 overflow-visible drop-shadow-sm`} fill="none">
    <defs>
      <linearGradient id="myOutG" x1="5" y1="5" x2="31" y2="31" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="55%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <rect x="6" y="5" width="16" height="26" rx="4" fill="url(#myOutG)" />
    <path d="M17 18H31M31 18L26.5 13.5M31 18L26.5 22.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 18H31M31 18L26.5 13.5M31 18L26.5 22.5" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ZentroGlobeArtIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm" fill="none">
    <defs>
      <linearGradient id="myGlobeG" x1="5" y1="5" x2="31" y2="31" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="13" fill="url(#myGlobeG)" />
    <ellipse cx="18" cy="18" rx="6" ry="13" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="1.6" />
    <line x1="5" y1="18" x2="31" y2="18" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="1.6" />
  </svg>
);

const ZentroCurrencyCoinArtIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm" fill="none">
    <defs>
      <linearGradient id="myCoinG" x1="5" y1="5" x2="31" y2="31" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="13" fill="url(#myCoinG)" />
    <circle cx="18" cy="18" r="9.5" stroke="#fde047" strokeWidth="1.5" strokeDasharray="3 2" />
    <path d="M18 11V25M14.5 14.5C14.5 13 16 12 18 12C20 12 21.5 13 21.5 14.5C21.5 16 20 17 18 17.5C16 18 14.5 19 14.5 20.8C14.5 22.5 16 23.5 18 23.5C20 23.5 21.5 22.5 21.5 20.8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ZentroLanguageBubbleArtIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm" fill="none">
    <defs>
      <linearGradient id="myLangG" x1="4" y1="6" x2="32" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
    <rect x="4" y="6" width="20" height="15" rx="4.5" fill="url(#myLangG)" />
    <rect x="12" y="15" width="20" height="15" rx="4.5" fill="#2563eb" fillOpacity="0.9" stroke="#ffffff" strokeWidth="1.2" />
    <text x="10" y="16" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">A</text>
    <text x="19" y="25.5" fill="#fde047" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">අ</text>
  </svg>
);

const ZentroEmailEnvelopeArtIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm" fill="none">
    <defs>
      <linearGradient id="myEnvG" x1="3" y1="11" x2="33" y2="31" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="52%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <rect x="8" y="5.5" width="20" height="15" rx="2.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="1.2" />
    <rect x="4" y="13" width="28" height="18" rx="4" fill="url(#myEnvG)" />
    <path d="M4.8 14.2L18 23.2L31.2 14.2" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="23" r="2.2" fill="#fde047" />
  </svg>
);

const ZentroPhoneArtIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm" fill="none">
    <defs>
      <linearGradient id="myPhoneG" x1="9" y1="3" x2="27" y2="33" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <rect x="9" y="3.5" width="18" height="29" rx="4.5" fill="url(#myPhoneG)" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.2" />
    <rect x="11.5" y="7" width="13" height="19.5" rx="2" fill="#0f172a" fillOpacity="0.25" />
    <circle cx="18" cy="29.5" r="1.5" fill="#ffffff" />
  </svg>
);

const ZentroReferralGiftArtIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm" fill="none">
    <defs>
      <linearGradient id="myGiftG" x1="6" y1="11" x2="30" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <path d="M18 12C15 7.5 10.5 7.5 10.5 10.5C10.5 12.5 14.5 12.5 18 12ZM18 12C21 7.5 25.5 7.5 25.5 10.5C25.5 12.5 21.5 12.5 18 12Z" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" />
    <rect x="6.5" y="12" width="23" height="6" rx="2" fill="url(#myGiftG)" />
    <rect x="8.5" y="18" width="19" height="13" rx="3" fill="url(#myGiftG)" />
    <rect x="16.5" y="12" width="3" height="19" fill="#ffffff" />
  </svg>
);

const ZentroSecurityKeyArtIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm" fill="none">
    <defs>
      <linearGradient id="myKeyG" x1="4" y1="6" x2="32" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <circle cx="13" cy="14" r="7" fill="url(#myKeyG)" />
    <circle cx="13" cy="14" r="2.6" fill="#ffffff" />
    <path d="M18.2 18.8L29.5 30.1M25.5 26.1L28.5 23.1M22 22.6L24.8 19.8" stroke="url(#myKeyG)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MyTab: React.FC<MyTabProps> = ({
  profile,
  transactions,
  bankAccounts,
  kycRecord,
  referrals,
  initialSubTab,
  onUpdateProfile,
  onSubmitKyc,
  onAddBankAccount,
  onDeleteBankAccount,
  onQuickChangeLanguage,
  onOpenCustomerSupport,
  onSignOut,
}) => {
  const [activeSubPage, setActiveSubPage] = useState<
    'profile' | 'kyc' | 'transactions' | 'referrals' | 'bank' | 'security' | null
  >(initialSubTab || null);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubPage(initialSubTab);
    }
  }, [initialSubTab]);

  // Sync local KYC record (includes uploaded document image data URLs & admin review stage)
  const [localKycRecord, setLocalKycRecord] = useState<KycRecordData | null>(() =>
    getLocalKycRequestByUser(profile.uid)
  );

  useEffect(() => {
    const syncKyc = () => {
      setLocalKycRecord(getLocalKycRequestByUser(profile.uid));
    };
    syncKyc();
    window.addEventListener('zentro-kyc-updated', syncKyc);
    window.addEventListener('storage', syncKyc);
    return () => {
      window.removeEventListener('zentro-kyc-updated', syncKyc);
      window.removeEventListener('storage', syncKyc);
    };
  }, [profile.uid, kycRecord, profile.kycStatus]);

  const mergedKycRecord: KycRecordData | null = localKycRecord
    ? {
        ...kycRecord,
        ...localKycRecord,
        status:
          profile.kycStatus === 'verified'
            ? 'verified'
            : profile.kycStatus === 'rejected'
              ? 'rejected'
              : localKycRecord.status || kycRecord?.status || 'pending',
      }
    : kycRecord;

  const effectiveKycStatus: 'unverified' | 'pending' | 'verified' | 'rejected' =
    profile.kycStatus === 'verified' || mergedKycRecord?.status === 'verified'
      ? 'verified'
      : profile.kycStatus === 'rejected' || mergedKycRecord?.status === 'rejected'
        ? 'rejected'
        : profile.kycStatus === 'pending' || mergedKycRecord?.status === 'pending'
          ? 'pending'
          : 'unverified';

  // Profile form state
  const [username, setUsername] = useState(profile.username);
  const [countryCode, setCountryCode] = useState(profile.countryCode);
  const [mobile, setMobile] = useState(profile.mobile);
  const [country, setCountry] = useState(profile.country || '');
  const [currency, setCurrency] = useState(profile.currency || '');
  const [language, setLanguage] = useState(profile.language || '');
  const [newSecPass, setNewSecPass] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(profile.username);
    setCountryCode(profile.countryCode);
    setMobile(profile.mobile);
    setCountry(profile.country || '');
    setCurrency(profile.currency || '');
    setLanguage(profile.language || '');
  }, [
    profile.uid,
    profile.username,
    profile.countryCode,
    profile.mobile,
    profile.country,
    profile.currency,
    profile.language,
  ]);

  const setupDone = isProfileSetupComplete(profile);
  const activeCurrency = getActiveCurrency(profile);
  // Default is English; Sinhala activates only when selected
  const activeLang = language || profile.language || 'English';
  const hwInfo = getDeterministicDeviceAndMac();
  const trackedIp =
    profile.ipAddress || localStorage.getItem('zentro_tracked_ip_v1') || '112.134.10.25';
  const trackedLoc =
    profile.locationTracked ||
    localStorage.getItem('zentro_tracked_loc_v1') ||
    hwInfo.timezoneLocation;

  // KYC form state
  const [fullName, setFullName] = useState(
    mergedKycRecord?.fullName || profile.username
  );
  const [documentType, setDocumentType] = useState<
    'passport' | 'national_id' | 'driver_license'
  >(mergedKycRecord?.documentType || 'national_id');
  const [documentNumber, setDocumentNumber] = useState(
    mergedKycRecord?.documentNumber || ''
  );
  const [kycDocBase64, setKycDocBase64] = useState<string | null>(
    mergedKycRecord?.documentImageDataUrl || null
  );
  const [kycDocFileName, setKycDocFileName] = useState<string>(
    mergedKycRecord?.documentFileName || ''
  );
  const [kycBackDocBase64, setKycBackDocBase64] = useState<string | null>(
    mergedKycRecord?.documentBackImageDataUrl || null
  );
  const [kycBackDocFileName, setKycBackDocFileName] = useState<string>(
    mergedKycRecord?.documentBackFileName || ''
  );
  const [kycDocMime, setKycDocMime] = useState<string>('image/jpeg');
  const [aiNotes, setAiNotes] = useState<string>(
    mergedKycRecord?.aiVerificationNotes || ''
  );
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [kycSuccessMsg, setKycSuccessMsg] = useState<string | null>(null);
  const [previewDocModalUrl, setPreviewDocModalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mergedKycRecord) {
      if (mergedKycRecord.fullName) setFullName(mergedKycRecord.fullName);
      if (mergedKycRecord.documentType) setDocumentType(mergedKycRecord.documentType);
      if (mergedKycRecord.documentNumber) setDocumentNumber(mergedKycRecord.documentNumber);
      if (mergedKycRecord.documentImageDataUrl && !kycDocBase64) {
        setKycDocBase64(mergedKycRecord.documentImageDataUrl);
      }
      if (mergedKycRecord.documentBackImageDataUrl && !kycBackDocBase64) {
        setKycBackDocBase64(mergedKycRecord.documentBackImageDataUrl);
      }
    }
  }, [mergedKycRecord?.userId, mergedKycRecord?.updatedAt]);

  // Bank / USDT BEP-20 form state
  const [bindMode, setBindMode] = useState<'bank' | 'usdt_bep20'>('bank');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingOrSwift, setRoutingOrSwift] = useState('');
  const [bankSecPass, setBankSecPass] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [confirmDeleteBankId, setConfirmDeleteBankId] = useState<string | null>(null);

  // Transaction filter state
  const [txFilter, setTxFilter] = useState<string>('all');

  const currentVip =
    VIP_TIERS.find((v) => v.level === profile.vipLevel) || VIP_TIERS[0];

  const handleBackToMenu = () => {
    setActiveSubPage(null);
    setTimeout(() => {
      try {
        const menuEl = document.getElementById('my-tab-menu-list');
        if (menuEl) {
          menuEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch {
        // ignore
      }
    }, 40);
  };

  const handleSubTabChange = (
    target: 'profile' | 'kyc' | 'transactions' | 'referrals' | 'bank' | 'security'
  ) => {
    setProfileError(null);
    setActiveSubPage(target);
    setTimeout(() => {
      try {
        const subEl = document.getElementById('my-tab-subpage-view');
        if (subEl) {
          subEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch {
        // ignore
      }
    }, 40);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError(null);

    if (!country.trim() || !currency.trim() || !language.trim()) {
      setProfileError(
        tr(
          activeLang,
          'Please select your Country, Currency, and Language before saving your profile.',
          'ගිණුම සුරැකීමට පෙර කරුණාකර Country, Currency සහ Language තෝරන්න.'
        )
      );
      return;
    }

    setProfileSaving(true);
    try {
      try {
        localStorage.setItem('zentro_active_language_v1', language.trim());
      } catch {
        // ignore
      }
      await onUpdateProfile({
        username: username.trim(),
        countryCode,
        mobile: mobile.trim(),
        country: country.trim(),
        currency: currency.trim(),
        language: language.trim(),
        securityPasswordHash: newSecPass.trim()
          ? newSecPass.trim()
          : profile.securityPasswordHash,
      });
      setNewSecPass('');
      setProfileMsg(
        tr(
          language.trim(),
          `Profile saved! Country (${country.trim()}), Currency (${currency.trim()}), and Language (${language.trim()}) are now active across Zentro.`,
          `ගිණුම සුරැකිණි! රට (${country.trim()}), මුදල් ඒකකය (${currency.trim()}) සහ භාෂාව (${language.trim()}) දැන් සක්‍රියයි.`
        )
      );
    } catch (err: any) {
      setProfileError(err?.message || 'Error updating profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleKycPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back' = 'front'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKycError(null);
    setKycSuccessMsg(null);
    setKycLoading(true);
    try {
      const compressedDataUrl = await compressKycImageFile(file, 960, 0.78);
      if (side === 'back') {
        setKycBackDocBase64(compressedDataUrl);
        setKycBackDocFileName(file.name);
      } else {
        setKycDocBase64(compressedDataUrl);
        setKycDocFileName(file.name);
        setKycDocMime('image/jpeg');
        try {
          const res = await fetch('/api/ai/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: compressedDataUrl,
              mimeType: 'image/jpeg',
              prompt:
                'Inspect this KYC identity document image. Summarize document type, legibility, visible name or identifier fields, and confirm whether it appears clear for Admin KYC review (keep under 350 characters).',
            }),
          });
          const data = await res.json();
          if (res.ok && data.text) {
            setAiNotes(data.text.slice(0, 800));
          }
        } catch {
          // Optional AI assist for Admin review notes
        }
      }
    } catch {
      setKycError(
        tr(
          activeLang,
          'Could not process the selected image. Please choose a clear JPG or PNG photo.',
          'තෝරාගත් ජායාරූපය කියවිය නොහැක. කරුණාකර පැහැදිලි JPG හෝ PNG ජායාරූපයක් තෝරන්න.'
        )
      );
    } finally {
      setKycLoading(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError(null);
    setKycSuccessMsg(null);

    if (fullName.trim().length < 2 || documentNumber.trim().length < 3) {
      setKycError(
        tr(
          activeLang,
          'Please provide your Full Legal Name and a valid ID / Document Number.',
          'කරුණාකර ඔබගේ සම්පූර්ණ නීතිමය නම සහ නිවැරදි හැඳුනුම්පත් අංකය ඇතුළත් කරන්න.'
        )
      );
      return;
    }

    const finalFrontPhoto = kycDocBase64 || mergedKycRecord?.documentImageDataUrl;
    if (!finalFrontPhoto) {
      setKycError(
        tr(
          activeLang,
          'Please upload a clear photo of your ID / Passport / Driver License document for Admin verification.',
          'පරිපාලක (Admin) පරීක්ෂාව සඳහා කරුණාකර ඔබගේ හැඳුනුම්පතේ / ගමන් බලපත්‍රයේ පැහැදිලි ජායාරූපයක් Upload කරන්න.'
        )
      );
      return;
    }

    setKycLoading(true);
    try {
      await onSubmitKyc({
        fullName: fullName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        aiVerificationNotes:
          aiNotes.trim() ||
          `Submitted ${documentType.toUpperCase()} (${documentNumber.trim()}) for Zentro Team verification review.`,
        documentImageDataUrl: finalFrontPhoto,
        documentBackImageDataUrl:
          kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl || undefined,
        documentFileName: kycDocFileName || mergedKycRecord?.documentFileName || 'id_front.jpg',
        documentBackFileName:
          kycBackDocFileName || mergedKycRecord?.documentBackFileName || undefined,
      });
      setKycSuccessMsg(
        tr(
          activeLang,
          'Your KYC application and uploaded ID document have been submitted! Status is now Processing — awaiting Zentro Team verification.',
          'ඔබගේ KYC අයදුම්පත සහ හැඳුනුම්පත් ජායාරූප සාර්ථකව යොමු කරන ලදී! දැන් එය Zentro Team එක විසින් පරීක්ෂා කරමින් පවතී.'
        )
      );
    } catch (err: any) {
      setKycError(err?.message || 'Failed to submit KYC record.');
    } finally {
      setKycLoading(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError(null);
    setBankLoading(true);
    try {
      if (bindMode === 'usdt_bep20') {
        await onAddBankAccount({
          bankName: 'USDT (BEP-20) BNB Smart Chain',
          accountHolder: (accountHolder.trim() || profile.username || 'BEP-20 Wallet').slice(0, 80),
          accountNumber: accountNumber.trim(),
          routingOrSwift: 'USDT-BEP20',
          securityPassword: bankSecPass.trim(),
        });
      } else {
        await onAddBankAccount({
          bankName: bankName.trim(),
          accountHolder: accountHolder.trim(),
          accountNumber: accountNumber.trim(),
          routingOrSwift: routingOrSwift.trim() || 'BANK-LKR',
          securityPassword: bankSecPass.trim(),
        });
      }
      setBankName('');
      setAccountHolder('');
      setAccountNumber('');
      setRoutingOrSwift('');
      setBankSecPass('');
    } catch (err: any) {
      setBankError(err?.message || 'Could not add bank account / wallet address.');
    } finally {
      setBankLoading(false);
    }
  };

  const filteredTransactions =
    txFilter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === txFilter);

  // Determine current KYC Stepper Stage (0 = Not Submitted, 1 = Submitted, 2 = Processing, 3 = Verified, -1 = Rejected)
  const kycStageNumber =
    effectiveKycStatus === 'verified'
      ? 3
      : effectiveKycStatus === 'pending'
        ? mergedKycRecord?.processingStage === 'submitted'
          ? 1
          : 2
        : effectiveKycStatus === 'rejected'
          ? -1
          : 0;

  return (
    <div className="space-y-6">
      {/* ================= CREATIVE EXECUTIVE MY ACCOUNT HERO & NAVIGATION ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 dark:border-pink-500/30 bg-gradient-to-br from-white via-pink-50/50 to-sky-50/60 dark:from-[#0f1629] dark:via-[#161c33] dark:to-[#1e152c] p-5 sm:p-6 shadow-xl space-y-5">
        {/* Decorative ambient glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-pink-500/20 via-rose-500/15 to-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-sky-500/20 via-blue-500/15 to-pink-500/20 blur-3xl" />

        {/* Top Row: User Identity + Language Switcher & Sign Out */}
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-extrabold font-display text-2xl flex items-center justify-center shadow-lg border-2 border-white/40">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-[#101626] shadow ${
                  effectiveKycStatus === 'verified'
                    ? 'bg-emerald-500 text-white'
                    : effectiveKycStatus === 'pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                }`}
                title={`KYC: ${effectiveKycStatus.toUpperCase()}`}
              >
                {effectiveKycStatus === 'verified' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : effectiveKycStatus === 'pending' ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
                  {profile.username}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500 via-pink-500 to-rose-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm">
                  <Crown className="w-3 h-3" />
                  <span>{currentVip.name}</span>
                </span>
                {effectiveKycStatus === 'verified' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{tr(activeLang, 'KYC Verified ✓', 'KYC තහවුරු කර ඇත ✓')}</span>
                  </span>
                ) : effectiveKycStatus === 'pending' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>
                      {tr(
                        activeLang,
                        'KYC Processing (Zentro Team Review)',
                        'KYC Zentro Team පරීක්ෂාවේ පවතී'
                      )}
                    </span>
                  </span>
                ) : effectiveKycStatus === 'rejected' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>{tr(activeLang, 'KYC Rejected — Resubmit', 'KYC ප්‍රතික්ෂේප විය')}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>
                      {tr(activeLang, 'KYC Unverified (Withdraw Locked)', 'KYC තහවුරු කර නැත')}
                    </span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-mono">{profile.email}</span>
                <span>·</span>
                <span className="font-mono font-semibold text-pink-600 dark:text-pink-400">
                  {profile.vipLevel >= 1
                    ? `Ref: ${profile.referralCode}`
                    : tr(
                        activeLang,
                        '🔒 Referral Locked (VIP 1+)',
                        '🔒 Referral අගුළු දමා ඇත (VIP 1+)'
                      )}
                </span>
                {setupDone && (
                  <>
                    <span>·</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {profile.country} · {activeCurrency} · {profile.language}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Language Change + Sign Out Button right next to it */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-pink-300 dark:border-pink-500/40 bg-white/90 dark:bg-[#192236] shadow-sm">
              <Globe className="w-4 h-4 text-pink-500 shrink-0" />
              <select
                aria-label="Change Language in My Tab"
                value={activeLang}
                onChange={(e) => {
                  const nextLang = e.target.value;
                  setLanguage(nextLang);
                  if (nextLang) {
                    try {
                      localStorage.setItem('zentro_active_language_v1', nextLang);
                    } catch {
                      // ignore
                    }
                    onQuickChangeLanguage?.(nextLang);
                  }
                }}
                className="bg-transparent text-slate-900 dark:text-white text-xs font-bold cursor-pointer focus:outline-none pr-1"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-white dark:bg-[#101626] text-slate-900 dark:text-white"
                  >
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md hover:opacity-95 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{tr(activeLang, 'Sign Out', 'ඉවත් වන්න')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Middle Row: 4 Creative Executive Stat Cards */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border border-sky-500/25 bg-white/80 dark:bg-[#131c31]/90 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
              <span>{tr(activeLang, 'Wallet Balance', 'ගිණුමේ ශේෂය')}</span>
              <Wallet className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatSiteAmount(profile.balance, activeCurrency)}
            </div>
            <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
              ≈ {formatCurrencyValue(profile.balance, 'USDT')} USDT
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-emerald-500/25 bg-white/80 dark:bg-[#131c31]/90 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
              <span>{tr(activeLang, 'Total Earnings', 'මුළු ඉපැයීම්')}</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatSiteAmount(profile.totalEarnings, activeCurrency)}
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {tr(activeLang, 'Tasks & Mining Yield', 'කාර්යයන් සහ මයිනින්')}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-pink-500/25 bg-white/80 dark:bg-[#131c31]/90 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
              <span>{tr(activeLang, 'Active VIP Tier', 'සක්‍රිය VIP මට්ටම')}</span>
              <Crown className="w-3.5 h-3.5 text-pink-500" />
            </div>
            <div className="text-base sm:text-lg font-display font-extrabold text-pink-600 dark:text-pink-400">
              {currentVip.name}
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {currentVip.dailyTasks} {tr(activeLang, 'Tasks/day', 'දෛනික කාර්යයන්')} ·{' '}
              {currentVip.dailyMiningRatePercent}% {tr(activeLang, 'Mining', 'මයිනින්')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSubTabChange('kyc')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm space-y-1 ${
              effectiveKycStatus === 'verified'
                ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15'
                : effectiveKycStatus === 'pending'
                  ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15'
                  : 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold">
              <span
                className={
                  effectiveKycStatus === 'verified'
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : effectiveKycStatus === 'pending'
                      ? 'text-amber-600 dark:text-amber-300'
                      : 'text-rose-600 dark:text-rose-300'
                }
              >
                {tr(activeLang, 'KYC & Withdraw Status', 'KYC සහ මුදල් ආපසු ගැනීම')}
              </span>
              <ShieldCheck
                className={`w-4 h-4 ${
                  effectiveKycStatus === 'verified'
                    ? 'text-emerald-500'
                    : effectiveKycStatus === 'pending'
                      ? 'text-amber-500'
                      : 'text-rose-500'
                }`}
              />
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>
                {effectiveKycStatus === 'verified'
                  ? tr(activeLang, 'Verified (Unlocked)', 'තහවුරුයි (අගුළු හැර ඇත)')
                  : effectiveKycStatus === 'pending'
                    ? tr(activeLang, 'Processing Review...', 'පරීක්ෂා කෙරෙමින්...')
                    : effectiveKycStatus === 'rejected'
                      ? tr(activeLang, 'Rejected — Resubmit', 'ප්‍රතික්ෂේප විය — නැවත යොමු කරන්න')
                      : tr(activeLang, 'Unverified (Locked)', 'තහවුරු කර නැත (අගුළු දමා ඇත)')}
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </div>
            <div className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
              {effectiveKycStatus === 'verified'
                ? tr(activeLang, 'Withdrawals Enabled ✓', 'මුදල් ආපසු ගැනීම් සක්‍රියයි ✓')
                : tr(
                    activeLang,
                    'Zentro Team KYC Required to Withdraw',
                    'මුදල් ගැනීමට Zentro Team KYC අනිවාර්යයි'
                  )}
            </div>
          </button>
        </div>
      </div>

      {/* ================= MAIN VIEW: INTERACTIVE MENU LIST ("list list වගයෙන්") ================= */}
      {activeSubPage === null && (
        <div id="my-tab-menu-list" className="space-y-4 scroll-mt-20">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-sky-400 to-pink-500 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
                {tr(activeLang, 'Account Services & Menu List', 'ගිණුමේ සේවාවන් සහ සැකසුම් ලැයිස්තුව')}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {tr(activeLang, 'Tap row to open page →', 'පිටුවට පිවිසීමට තෝරන්න →')}
            </span>
          </div>

          {/* Interactive Menu List: Rows with Creative Zentro SVG Illustration, Title, Subtitle, Badge, and ChevronRight */}
          <div className="space-y-2.5">
            {[
              {
                id: 'profile' as const,
                label: tr(activeLang, '1. My Profile & Account Settings', '1. මගේ ගිණුම සහ සැකසුම්'),
                sub: tr(
                  activeLang,
                  'Select Country, Currency & Language, and update Security Password',
                  'රට, මුදල් ඒකකය, භාෂාව තෝරා ආරක්ෂක මුරපදය සකසන්න'
                ),
                artIcon: ZentroProfileArtIcon,
                badge: setupDone
                  ? tr(activeLang, 'ACTIVE ✓', 'සක්‍රියයි ✓')
                  : tr(activeLang, 'ACTION REQUIRED', 'සැකසීම අවශ්‍යයි'),
                badgeColor: setupDone
                  ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-400',
              },
              {
                id: 'kyc' as const,
                label: tr(activeLang, '2. KYC Identity Verification', '2. KYC අනන්‍යතා සත්‍යාපනය'),
                sub: tr(
                  activeLang,
                  'Verified by Zentro Team · Unlocks Bank & USDT (BEP-20) withdrawals',
                  'Zentro Team එක විසින් verified කරනු ලැබේ · මුදල් ආපසු ගැනීම් අගුළු හරියි'
                ),
                artIcon: ZentroKycShieldArtIcon,
                badge:
                  effectiveKycStatus === 'verified'
                    ? tr(activeLang, 'VERIFIED ✓', 'තහවුරුයි ✓')
                    : effectiveKycStatus === 'pending'
                      ? tr(activeLang, 'PROCESSING (TEAM REVIEW)', 'ZENTRO TEAM පරීක්ෂාවේ')
                      : effectiveKycStatus === 'rejected'
                        ? tr(activeLang, 'REJECTED — RESUBMIT', 'ප්‍රතික්ෂේප විය')
                        : tr(activeLang, 'UNVERIFIED (LOCKED)', 'තහවුරු කර නැත'),
                badgeColor:
                  effectiveKycStatus === 'verified'
                    ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400'
                    : effectiveKycStatus === 'pending'
                      ? 'bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-400',
              },
              {
                id: 'bank' as const,
                label: tr(activeLang, '3. My Bank & USDT (BEP-20) Accounts', '3. මගේ බැංකු සහ USDT ගිණුම්'),
                sub: tr(
                  activeLang,
                  'Bind withdrawal Bank Accounts (LKR) and USDT (BEP-20) wallet addresses',
                  'මුදල් ලබාගැනීමට බැංකු ගිණුම් සහ USDT (BEP-20) ලිපින සම්බන්ධ කරන්න'
                ),
                artIcon: ZentroBankVaultArtIcon,
                badge: `${bankAccounts.length} ${tr(activeLang, 'BOUND', 'සම්බන්ධයි')}`,
                badgeColor: 'bg-sky-500/15 border border-sky-500/35 text-sky-600 dark:text-sky-400',
              },
              {
                id: 'transactions' as const,
                label: tr(activeLang, '4. Transaction Ledger History', '4. මූල්‍ය ගනුදෙනු ඉතිහාසය'),
                sub: tr(
                  activeLang,
                  'Complete record of deposits, withdrawals, VIP packages & task yield',
                  'තැන්පතු, මුදල් ගැනීම්, VIP පැකේජ සහ Task ආදායම් වාර්තා'
                ),
                artIcon: ZentroLedgerHistoryArtIcon,
                badge: `${transactions.length} ${tr(activeLang, 'RECORDS', 'වාර්තා')}`,
                badgeColor: 'bg-purple-500/15 border border-purple-500/35 text-purple-600 dark:text-purple-400',
              },
              {
                id: 'referrals' as const,
                label: tr(activeLang, '5. Referral History & Team Commissions', '5. යොමු කිරීම් සහ කණ්ඩායම් ආදායම්'),
                sub: tr(
                  activeLang,
                  'VIP referral code, shareable link & 5-tier team commission tracking',
                  'ඔබගේ VIP Referral කේතය, ලින්ක් එක සහ 5-Level කණ්ඩායම් කොමිස්'
                ),
                artIcon: ZentroTeamNetworkArtIcon,
                badge: `${referrals.length} ${tr(activeLang, 'MEMBERS', 'සාමාජිකයින්')}`,
                badgeColor: 'bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-400',
              },
              {
                id: 'security' as const,
                label: tr(activeLang, '6. Device & Hardware Security Telemetry', '6. උපාංග සහ දෘඩාංග ආරක්ෂණ පද්ධතිය'),
                sub: tr(
                  activeLang,
                  '1-Device account lock, hardware MAC ID, tracked IP & geographic location',
                  '1-Device Lock, MAC හැඳුනුම, IP ලිපිනය සහ පිහිටීම'
                ),
                artIcon: ZentroHardwareSecurityArtIcon,
                badge: tr(activeLang, 'HARDWARE BOUND', 'උපාංගය සම්බන්ධයි'),
                badgeColor: 'bg-teal-500/15 border border-teal-500/35 text-teal-600 dark:text-teal-400',
              },
            ].map((item) => {
              const ArtIconComp = item.artIcon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSubTabChange(item.id)}
                  className="w-full p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left group shadow-sm bg-white dark:bg-[#12192b] border-slate-200/90 dark:border-white/10 hover:border-pink-500/50 hover:shadow-md hover:scale-[1.005]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/10 via-pink-500/10 to-rose-500/10 border border-pink-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ArtIconComp className="w-8 h-8" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.sub}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-pink-500 group-hover:bg-pink-500/10 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* 7. Official Customer Support & Live Chat Row */}
            {onOpenCustomerSupport && (
              <button
                type="button"
                onClick={onOpenCustomerSupport}
                className="w-full p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left group shadow-sm bg-white dark:bg-[#12192b] border-slate-200/90 dark:border-white/10 hover:border-pink-500/50 hover:shadow-md hover:scale-[1.005]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/10 via-pink-500/10 to-emerald-500/10 border border-pink-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ZentroSupportCareArtIcon className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {tr(
                        activeLang,
                        '7. Customer Support & Online Live Chat',
                        '7. පාරිභෝගික සහාය සහ සජීවී චැට් (Live Chat)'
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {tr(
                        activeLang,
                        'WhatsApp & Telegram Channels, Hiring Manager Care & Live Chat',
                        'WhatsApp/Telegram නාලිකා, Hiring Manager සහ සජීවී පණිවිඩ'
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400">
                    24/7 LIVE
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-pink-500 group-hover:bg-pink-500/10 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            )}

            {/* Direct Sign Out Action Row in the List */}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/15 text-left transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ZentroSignOutArtIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400">
                      {tr(activeLang, '8. Sign Out of Account', '8. ගිණුමෙන් ඉවත් වන්න (Sign Out)')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {tr(activeLang, 'Safely end your current session', 'ඔබගේ ගිණුමෙන් ආරක්ෂිතව ඉවත් වන්න')}
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <LogOut className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-PAGE VIEW: TOP BACK BAR & SELECTED SECTION ================= */}
      {activeSubPage !== null && (
        <div
          id="my-tab-subpage-view"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#12192b] border border-pink-500/30 shadow-md scroll-mt-24"
        >
          <button
            type="button"
            onClick={handleBackToMenu}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-pink-500 to-rose-500 text-white font-extrabold text-xs cursor-pointer shadow-md hover:opacity-95 transition-all self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tr(activeLang, '← Back to Menu List', '← ආපසු ලැයිස්තුවට')}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {tr(activeLang, 'Active Section:', 'වත්මන් අංශය:')}
            </span>
            <span className="text-sm font-extrabold font-display text-slate-900 dark:text-white">
              {activeSubPage === 'profile' && tr(activeLang, 'My Profile & Account Settings', 'මගේ ගිණුම සහ සැකසුම්')}
              {activeSubPage === 'kyc' && tr(activeLang, 'KYC Identity Verification', 'KYC අනන්‍යතා සත්‍යාපනය')}
              {activeSubPage === 'bank' && tr(activeLang, 'My Bank & USDT (BEP-20) Accounts', 'මගේ බැංකු සහ USDT ගිණුම්')}
              {activeSubPage === 'transactions' && tr(activeLang, 'Transaction Ledger History', 'මූල්‍ය ගනුදෙනු ඉතිහාසය')}
              {activeSubPage === 'referrals' && tr(activeLang, 'Referral History & Team Commissions', 'යොමු කිරීම් සහ කණ්ඩායම')}
              {activeSubPage === 'security' && tr(activeLang, 'Device & Hardware Security Telemetry', 'උපාංග සහ දෘඩාංග ආරක්ෂණ පද්ධතිය')}
            </span>
          </div>
        </div>
      )}

      {/* 1. MY PROFILE */}
      {activeSubPage === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {tr(activeLang, 'Account & Security Profile', 'ගිණුම සහ ආරක්ෂක තොරතුරු')}
              </h3>
              {!setupDone ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-mono font-bold">
                  {tr(
                    activeLang,
                    'ACTION REQUIRED: SELECT COUNTRY, CURRENCY & LANGUAGE',
                    'අනිවාර්යයි: රට, මුදල් ඒකකය සහ භාෂාව තෝරන්න'
                  )}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold">
                  {tr(
                    activeLang,
                    `PROFILE UNLOCKED (${activeCurrency})`,
                    `ගිණුම සක්‍රියයි (${activeCurrency})`
                  )}
                </span>
              )}
            </div>

            {!setupDone && (
              <div className="p-4 rounded-xl border border-pink-500/40 bg-gradient-to-r from-blue-500/10 via-pink-500/10 to-rose-500/10 space-y-1.5">
                <div className="text-xs font-bold text-pink-600 dark:text-pink-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>
                    {tr(
                      activeLang,
                      'Complete Profile Setup to Unlock Platform (Country · Currency · Language)',
                      'වේදිකාව අගුළු හැරීමට Country, Currency සහ Language තෝරා සුරකින්න'
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tr(
                    activeLang,
                    'Immediately after registration, please select your Country, Currency, and Language below and click Save Profile Changes to unlock all platform sections. All balances and rewards will automatically display in your selected currency.',
                    'ලියාපදිංචි වූ වහාම වෙනත් කිසිවක් කිරීමට පෙර ඔබගේ Country, Currency සහ Language තෝරා Save Profile Changes ඔබන්න. ඔබ තෝරන Currency එකට අනුව මුළු වෙබ් අඩවියේම මුදල් ඒකකය පෙන්වනු ලැබේ.'
                  )}
                </p>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileMsg}</span>
              </div>
            )}

            {/* Mandatory Country, Currency, and Language Selection Box */}
            <div className="p-4 rounded-xl border-2 border-pink-500/40 bg-pink-50/30 dark:bg-slate-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                  {tr(
                    activeLang,
                    '1. Regional, Currency & Language Settings (Mandatory)',
                    '1. රට, මුදල් ඒකකය සහ භාෂාව (අනිවාර්යයි)'
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {tr(activeLang, 'Active Currency:', 'මුදල් ඒකකය:')}{' '}
                  <strong>{currency || tr(activeLang, 'Not Selected', 'තෝරා නැත')}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Country Selector with Creative Zentro Globe Image */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    {tr(activeLang, 'Country', 'රට (Country)')}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border border-pink-300 dark:border-pink-500/40 bg-white dark:bg-slate-900">
                    <ZentroGlobeArtIcon />
                    <select
                      required
                      value={country}
                      onChange={(e) => {
                        const nextCountry = e.target.value;
                        setCountry(nextCountry);
                        const matched = COUNTRY_OPTIONS.find((c) => c.name === nextCountry);
                        if (matched) {
                          const formattedDial = `${matched.flag} ${matched.dialCode.replace('-CA', '')}`;
                          setCountryCode(formattedDial);
                          if (!currency) {
                            setCurrency(matched.defaultCurrency);
                          }
                        }
                      }}
                      className="w-full text-xs font-semibold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">
                        {tr(activeLang, '-- Select Country --', '-- රට තෝරන්න --')}
                      </option>
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.name} className="bg-white dark:bg-slate-900">
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Currency Selector with Creative Zentro Coin Image */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    {tr(activeLang, 'Currency', 'මුදල් ඒකකය (Currency)')}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border border-pink-300 dark:border-pink-500/40 bg-white dark:bg-slate-900">
                    <ZentroCurrencyCoinArtIcon />
                    <select
                      required
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">
                        {tr(activeLang, '-- Select Currency --', '-- මුදල් ඒකකය තෝරන්න --')}
                      </option>
                      {CURRENCY_OPTIONS.map((cur) => (
                        <option key={cur.code} value={cur.code} className="bg-white dark:bg-slate-900">
                          {cur.flag} {cur.code} ({cur.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language Selector with Creative Zentro Language Image */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    {tr(activeLang, 'Language', 'භාෂාව (Language)')}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border border-pink-300 dark:border-pink-500/40 bg-white dark:bg-slate-900">
                    <ZentroLanguageBubbleArtIcon />
                    <select
                      required
                      value={language}
                      onChange={(e) => {
                        const nextLang = e.target.value;
                        setLanguage(nextLang);
                        if (nextLang) {
                          try {
                            localStorage.setItem('zentro_active_language_v1', nextLang);
                          } catch {
                            // ignore
                          }
                          onQuickChangeLanguage?.(nextLang);
                        }
                      }}
                      className="w-full text-xs font-semibold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">
                        {tr(activeLang, '-- Select Language --', '-- භාෂාව තෝරන්න --')}
                      </option>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900">
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Converted VIP Prices Preview for Selected Currency */}
              <div className="pt-2 border-t border-pink-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <span>
                  {tr(activeLang, 'Live Converted VIP Prices:', 'මුදල් ඒකකයට අනුව VIP මිල ගණන්:')}
                </span>
                <div className="flex flex-wrap items-center gap-2 font-bold text-pink-600 dark:text-pink-400">
                  <span>Bronze: {formatSiteAmount(1000, currency || activeCurrency)}</span>
                  <span>·</span>
                  <span>Silver: {formatSiteAmount(3500, currency || activeCurrency)}</span>
                  <span>·</span>
                  <span>Gold: {formatSiteAmount(5000, currency || activeCurrency)}</span>
                  <span>·</span>
                  <span>Platinum: {formatSiteAmount(10000, currency || activeCurrency)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {tr(activeLang, 'User Name', 'පරිශීලක නාමය (User Name)')}
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <ZentroProfileArtIcon className="w-7 h-7" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {tr(activeLang, 'Registered Email (Verified)', 'ලියාපදිංචි විද්‍යුත් තැපෑල')}
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50">
                  <ZentroEmailEnvelopeArtIcon />
                  <input
                    type="email"
                    readOnly
                    value={profile.email}
                    className="w-full text-sm bg-transparent text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {tr(activeLang, 'Mobile Number (Country Flag & Code)', 'දුරකථන අංකය')}
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <ZentroPhoneArtIcon />
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-40 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value={profile.countryCode}>{profile.countryCode}</option>
                  {COUNTRY_OPTIONS.map((c) => {
                    const formatted = `${c.flag} ${c.dialCode.replace('-CA', '')}`;
                    return (
                      <option key={c.code} value={formatted}>
                        {formatted} ({c.name})
                      </option>
                    );
                  })}
                </select>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="flex-1 text-sm font-mono tabular-nums bg-transparent text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {tr(activeLang, 'Your Unique Referral Code', 'ඔබගේ Referral කේතය')}{' '}
                  {profile.vipLevel >= 1 ? '(VIP Active)' : '(VIP 1+ Only)'}
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50">
                  <ZentroReferralGiftArtIcon />
                  <input
                    type="text"
                    readOnly
                    value={
                      profile.vipLevel >= 1
                        ? profile.referralCode
                        : tr(
                            activeLang,
                            '🔒 Locked — Upgrade to VIP 1+ to unlock referral',
                            '🔒 අගුළු දමා ඇත — Referral සඳහා VIP 1+ ලබාගන්න'
                          )
                    }
                    className="w-full text-sm font-mono bg-transparent text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {tr(activeLang, 'Referred By Sponsor Code (Locked)', 'අනුග්‍රාහක කේතය (Locked)')}
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50">
                  <ZentroTeamNetworkArtIcon className="w-7 h-7" />
                  <input
                    type="text"
                    readOnly
                    value={profile.referredBy}
                    className="w-full text-sm font-mono bg-transparent text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {tr(
                  activeLang,
                  'Update Security Password (leave blank to keep current)',
                  'ආරක්ෂක මුරපදය යාවත්කාලීන කරන්න (වෙනස් නොකරන්නේ නම් හිස්ව තබන්න)'
                )}
              </label>
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <ZentroSecurityKeyArtIcon />
                <input
                  type="password"
                  value={newSecPass}
                  onChange={(e) => setNewSecPass(e.target.value)}
                  placeholder={tr(
                    activeLang,
                    'Enter new 6-digit Security Password',
                    'නව ආරක්ෂක මුරපදය ඇතුළත් කරන්න'
                  )}
                  className="w-full text-sm font-mono bg-transparent text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                {profileSaving
                  ? tr(activeLang, 'Saving Profile...', 'සුරකිමින් පවතී...')
                  : !setupDone
                    ? tr(
                        activeLang,
                        'Save Country, Currency & Language to Unlock Platform',
                        'රට, මුදල් ඒකකය සහ භාෂාව සුරකින්න (Unlock Platform)'
                      )
                    : tr(activeLang, 'Save Profile Changes', 'ගිණුමේ වෙනස්කම් සුරකින්න')}
              </button>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:opacity-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{tr(activeLang, 'Sign Out of Account', 'ගිණුමෙන් ඉවත් වන්න (Sign Out)')}</span>
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {tr(activeLang, 'Account & Device Security Summary', 'ගිණුම සහ උපාංග ආරක්ෂක සාරාංශය')}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{tr(activeLang, 'Account UID', 'ගිණුම් අංකය')}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {profile.uid.slice(0, 14)}...
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{tr(activeLang, 'Selected Country', 'තෝරාගත් රට')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {profile.country || tr(activeLang, 'Not selected yet', 'තවම තෝරා නැත')}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{tr(activeLang, 'Site Currency', 'මුදල් ඒකකය')}</span>
                <span className="font-mono font-bold text-pink-600 dark:text-pink-400">
                  {profile.currency || tr(activeLang, 'Not selected yet (Default LKR)', 'තවම තෝරා නැත (LKR)')}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{tr(activeLang, 'Selected Language', 'තෝරාගත් භාෂාව')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {profile.language || tr(activeLang, 'Not selected yet (Default English)', 'තවම තෝරා නැත (English)')}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">
                  {tr(activeLang, 'Available Wallet Balance', 'ගිණුමේ ශේෂය')}
                </span>
                <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatSiteAmount(profile.balance, activeCurrency)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">
                  {tr(activeLang, 'Cumulative Yield Earnings', 'මුළු ඉපැයීම්')}
                </span>
                <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{formatSiteAmount(profile.totalEarnings, activeCurrency)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">
                  {tr(activeLang, 'Active VIP Membership', 'සක්‍රිය VIP මට්ටම')}
                </span>
                <span className="font-semibold text-pink-600 dark:text-pink-400">
                  {currentVip.name}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">
                  {tr(activeLang, 'Tracked Device ID (1 Account Lock)', 'උපාංග හැඳුනුම (Device ID)')}
                </span>
                <span className="font-mono font-bold text-sky-500">
                  {profile.deviceId || hwInfo.deviceId}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">
                  {tr(activeLang, 'Tracked Hardware MAC ID', 'MAC හැඳුනුම (MAC Address)')}
                </span>
                <span className="font-mono font-bold text-pink-500">
                  {profile.macAddress || hwInfo.macAddress}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">
                  {tr(activeLang, 'Tracked IP Address', 'IP ලිපිනය (IP Tracking)')}
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{trackedIp}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">
                  {tr(activeLang, 'Tracked Location', 'ස්ථානය (Location Tracking)')}
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200 text-right max-w-[200px] truncate">
                  {trackedLoc}
                </span>
              </div>
            </div>

            {/* Compact KYC Stepper Card inside My Profile Right Column */}
            <div className="p-4 rounded-2xl border border-pink-500/30 bg-gradient-to-br from-sky-500/10 via-pink-500/10 to-rose-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-pink-500" />
                  <span>{tr(activeLang, 'KYC Verification Progress', 'KYC සත්‍යාපන ප්‍රගතිය')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('kyc')}
                  className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{tr(activeLang, 'Open KYC', 'KYC විවෘත කරන්න')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  {
                    step: 1,
                    label: tr(activeLang, 'Submitted', 'යොමු කරන ලදී'),
                    done: kycStageNumber >= 1,
                    active: kycStageNumber === 1,
                  },
                  {
                    step: 2,
                    label: tr(activeLang, 'Processing', 'පරීක්ෂාවේ'),
                    done: kycStageNumber >= 2,
                    active: kycStageNumber === 2,
                  },
                  {
                    step: 3,
                    label: tr(activeLang, 'Verified', 'තහවුරුයි'),
                    done: kycStageNumber >= 3,
                    active: kycStageNumber === 3,
                  },
                ].map((st) => (
                  <div
                    key={st.step}
                    className={`p-2 rounded-xl border text-[11px] font-bold ${
                      st.done
                        ? st.step === 3
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : 'border-sky-500/40 bg-sky-500/15 text-sky-600 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <div className="font-mono text-[10px]">STEP {st.step}</div>
                    <div className="truncate">{st.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Back to Menu Button */}
          <div className="lg:col-span-12 pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-pink-500" />
              <span>{tr(activeLang, '← Back to Menu List', '← ආපසු ලැයිස්තුවට')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= 2. KYC VERIFICATION WITH VISUAL PROGRESS STEPPER ================= */}
      {activeSubPage === 'kyc' && (
        <div className="space-y-6">
          {/* VISUAL KYC PROGRESS STEPPER BANNER (Submitted -> Processing -> Verified) */}
          <div className="p-6 rounded-3xl border border-pink-500/30 bg-white dark:bg-[#11182b] shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-pink-500/15 border border-pink-500/30 text-pink-600 dark:text-pink-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {tr(
                      activeLang,
                      'OFFICIAL ZENTRO TEAM KYC VERIFICATION PIPELINE',
                      'ZENTRO කණ්ඩායමේ KYC අනන්‍යතා සත්‍යාපන පද්ධතිය'
                    )}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
                  {tr(
                    activeLang,
                    'KYC Application Progress Tracker',
                    'KYC අයදුම්පත් ප්‍රගති පියවර (Submitted → Processing → Verified)'
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {tr(
                    activeLang,
                    'Unverified users cannot make withdrawals. Upload your ID document below so the Zentro Team can inspect and verify your account.',
                    'තහවුරු නොකළ (Unverified) ගිණුම්වලට මුදල් ආපසු ගත නොහැක. Zentro Team එක විසින් පරීක්ෂා කර තහවුරු කිරීමට ඔබගේ හැඳුනුම්පත් ජායාරූප පහතින් Upload කරන්න.'
                  )}
                </p>
              </div>

              {/* Overall Status Pill */}
              <div className="shrink-0">
                {effectiveKycStatus === 'verified' ? (
                  <div className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>
                      {tr(
                        activeLang,
                        'STAGE 3 OF 3: VERIFIED BY ZENTRO TEAM',
                        'අදියර 3/3: ZENTRO TEAM විසින් තහවුරු කරන ලදී'
                      )}
                    </span>
                  </div>
                ) : effectiveKycStatus === 'pending' ? (
                  <div className="px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs font-extrabold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                    <span>
                      {tr(
                        activeLang,
                        'STAGE 2 OF 3: PROCESSING (ZENTRO TEAM REVIEW)',
                        'අදියර 2/3: ZENTRO TEAM පරීක්ෂාවේ පවතී (PROCESSING)'
                      )}
                    </span>
                  </div>
                ) : effectiveKycStatus === 'rejected' ? (
                  <div className="px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-extrabold flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>
                      {tr(
                        activeLang,
                        'APPLICATION REJECTED — PLEASE RESUBMIT',
                        'ප්‍රතික්ෂේප විය — නැවත පැහැදිලිව යොමු කරන්න'
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 text-xs font-extrabold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-500" />
                    <span>
                      {tr(
                        activeLang,
                        'NOT SUBMITTED YET — WITHDRAWALS LOCKED',
                        'තවම යොමු කර නැත — මුදල් ගැනීම අගුළු දමා ඇත'
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3-STAGE VISUAL PROGRESS STEPPER */}
            <div className="relative">
              {/* Connecting Horizontal Progress Bar (Desktop) */}
              <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    effectiveKycStatus === 'verified'
                      ? 'w-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500'
                      : effectiveKycStatus === 'pending'
                        ? 'w-1/2 bg-gradient-to-r from-sky-500 via-blue-500 to-amber-500'
                        : 'w-0'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {/* STEP 1: SUBMITTED */}
                {(() => {
                  const isCompleted =
                    effectiveKycStatus === 'pending' || effectiveKycStatus === 'verified';
                  const isCurrent = effectiveKycStatus === 'unverified' || effectiveKycStatus === 'rejected';
                  return (
                    <div
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-2.5 ${
                        isCompleted
                          ? 'border-sky-500/50 bg-sky-500/10 dark:bg-[#132038]'
                          : isCurrent
                            ? 'border-pink-500 bg-pink-500/10 dark:bg-[#1b1730] shadow-lg'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141c2e]'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-extrabold text-sm shadow-md ${
                          isCompleted
                            ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white'
                            : isCurrent
                              ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <FileCheck2 className="w-6 h-6" />}
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-widest font-bold text-sky-500">
                          {tr(activeLang, 'STAGE 1', 'අදියර 1')}
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {tr(activeLang, '1. Submitted', '1. Submitted (යොමු කරන ලදී)')}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {isCompleted
                            ? tr(
                                activeLang,
                                `Document (${(mergedKycRecord?.documentType || documentType).toUpperCase()}) & ID photo uploaded by ${mergedKycRecord?.fullName || fullName}.`,
                                `${mergedKycRecord?.fullName || fullName} විසින් හැඳුනුම්පත් තොරතුරු සහ ජායාරූප යොමු කර ඇත.`
                              )
                            : tr(
                                activeLang,
                                'Fill in your legal name, ID number, and upload your clear ID document photo below.',
                                'ඔබගේ නීතිමය නම, හැඳුනුම්පත් අංකය සහ පැහැදිලි හැඳුනුම්පත් ජායාරූපය පහතින් යොමු කරන්න.'
                              )}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                          isCompleted
                            ? 'bg-sky-500/20 text-sky-500 border border-sky-500/30'
                            : 'bg-pink-500/20 text-pink-500 border border-pink-500/30'
                        }`}
                      >
                        {isCompleted
                          ? tr(activeLang, '✓ COMPLETED', '✓ සම්පූර්ණයි')
                          : tr(activeLang, 'ACTION REQUIRED BELOW', 'පහතින් සම්පූර්ණ කරන්න')}
                      </span>
                    </div>
                  );
                })()}

                {/* STEP 2: PROCESSING (ZENTRO TEAM REVIEW) */}
                {(() => {
                  const isCompleted = effectiveKycStatus === 'verified';
                  const isCurrent = effectiveKycStatus === 'pending';
                  return (
                    <div
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-2.5 ${
                        isCompleted
                          ? 'border-sky-500/50 bg-sky-500/10 dark:bg-[#132038]'
                          : isCurrent
                            ? 'border-amber-500 bg-amber-500/10 dark:bg-[#241e18] shadow-lg'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141c2e] opacity-75'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-extrabold text-sm shadow-md ${
                          isCompleted
                            ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white'
                            : isCurrent
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Clock className={`w-6 h-6 ${isCurrent ? 'animate-spin' : ''}`} />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-widest font-bold text-amber-500">
                          {tr(activeLang, 'STAGE 2', 'අදියර 2')}
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {tr(activeLang, '2. Processing', '2. Processing (Zentro Team පරීක්ෂාව)')}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {isCompleted
                            ? tr(
                                activeLang,
                                'The Zentro Team inspected your uploaded ID document and approved your application.',
                                'Zentro Team එක විසින් ඔබගේ හැඳුනුම්පත් ලේඛන පරීක්ෂා කර අනුමත කරන ලදී.'
                              )
                            : isCurrent
                              ? tr(
                                  activeLang,
                                  'Your uploaded ID document is currently being reviewed manually by the Zentro Team.',
                                  'ඔබ Upload කළ හැඳුනුම්පත් ජායාරූපය දැනට Zentro Team එක විසින් පරීක්ෂා කරමින් පවතී.'
                                )
                              : tr(
                                  activeLang,
                                  'Once submitted, the Zentro Team manually inspects your uploaded ID documents.',
                                  'අයදුම්පත යොමු කළ පසු Zentro Team එක විසින් ඔබගේ ලේඛන පරීක්ෂා කරනු ලැබේ.'
                                )}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                          isCompleted
                            ? 'bg-sky-500/20 text-sky-500 border border-sky-500/30'
                            : isCurrent
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                        }`}
                      >
                        {isCompleted
                          ? tr(activeLang, '✓ ZENTRO TEAM REVIEWED', '✓ ZENTRO TEAM පරීක්ෂා කරන ලදී')
                          : isCurrent
                            ? tr(activeLang, '⏳ IN ZENTRO TEAM REVIEW', '⏳ ZENTRO TEAM පරීක්ෂාවේ පවතී')
                            : tr(activeLang, 'WAITING FOR SUBMISSION', 'යොමු කරන තෙක් රැඳී සිටී')}
                      </span>
                    </div>
                  );
                })()}

                {/* STEP 3: VERIFIED */}
                {(() => {
                  const isCompleted = effectiveKycStatus === 'verified';
                  return (
                    <div
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-2.5 ${
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-500/10 dark:bg-[#112622] shadow-lg'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141c2e] opacity-75'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-extrabold text-sm shadow-md ${
                          isCompleted
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-500">
                          {tr(activeLang, 'STAGE 3', 'අදියර 3')}
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {tr(activeLang, '3. Verified', '3. Verified (තහවුරු කරන ලදී)')}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {isCompleted
                            ? tr(
                                activeLang,
                                'Your identity is officially verified by the Zentro Team! Bank & USDT (BEP-20) withdrawals are unlocked.',
                                'ඔබගේ අනන්‍යතාවය Zentro Team එක විසින් තහවුරු කර ඇත! දැන් බැංකු සහ USDT මුදල් ආපසු ගැනීම් සක්‍රියයි.'
                              )
                            : tr(
                                activeLang,
                                'Zentro Team approval unlocks all Bank (LKR) and USDT (BEP-20) withdrawals for your account.',
                                'Zentro Team අනුමැතියෙන් පසු ඔබගේ ගිණුමේ සියලුම මුදල් ආපසු ගැනීම් (Withdrawals) අගුළු හැරේ.'
                              )}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                        }`}
                      >
                        {isCompleted
                          ? tr(activeLang, '✓ VERIFIED & UNLOCKED', '✓ තහවුරුයි — WITHDRAW UNLOCKED')
                          : tr(activeLang, 'LOCKED UNTIL VERIFIED', 'තහවුරු වන තෙක් අගුළු දමා ඇත')}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Rejected Notice Banner if Zentro Team Rejected */}
            {effectiveKycStatus === 'rejected' && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold uppercase tracking-wide">
                    {tr(
                      activeLang,
                      'Your previous KYC submission was rejected by the Zentro Team',
                      'ඔබගේ පෙර KYC අයදුම්පත Zentro Team එක විසින් ප්‍රතික්ෂේප කර ඇත'
                    )}
                  </div>
                  <p>
                    {mergedKycRecord?.adminNotes
                      ? `${tr(activeLang, 'Zentro Team Note:', 'Zentro Team සටහන:')} ${mergedKycRecord.adminNotes}`
                      : tr(
                          activeLang,
                          'Please upload a clearer, unobstructed photo of your government-issued ID document and submit again below.',
                          'කරුණාකර ඔබගේ හැඳුනුම්පතේ ඉතා පැහැදිලි ජායාරූපයක් නැවත Upload කර පහතින් යොමු කරන්න.'
                        )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* KYC CONTENT: VERIFIED CERTIFICATE (NO RE-UPLOAD / NO FILL) VS SUBMISSION FORM */}
          {effectiveKycStatus === 'verified' ? (
            /* OFFICIAL ZENTRO IDENTITY VERIFICATION CERTIFICATE (COMPLETELY HIDES INPUTS & UPLOAD DROPZONES) */
            <div className="p-6 sm:p-8 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 via-slate-900/90 to-[#0e172a] shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/30 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                    <ShieldCheck className="w-9 h-9" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {tr(activeLang, 'OFFICIAL KYC CERTIFICATE', 'නිල KYC සහතිකය')}
                      </span>
                      <span className="text-xs font-mono text-emerald-400/80">
                        ZTR-AUTH-{(profile.uid || '8849').slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      {tr(
                        activeLang,
                        'Identity Verified by Zentro Team',
                        'Zentro Team එක විසින් අනන්‍යතාවය සාර්ථකව සත්‍යාපනය කර ඇත'
                      )}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {tr(
                        activeLang,
                        'Your identity has been fully approved by the Zentro Global Compliance Team. All withdrawal privileges are unlocked.',
                        'ඔබගේ අනන්‍යතාවය Zentro කණ්ඩායම විසින් පරීක්ෂා කර සම්පූර්ණයෙන්ම අනුමත කර ඇත. සියලුම මුදල් ආපසු ගැනීමේ පහසුකම් සක්‍රියයි.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs flex items-center gap-2 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{tr(activeLang, 'VERIFIED & LOCKED', 'තහවුරු කර සුරක්ෂිත කර ඇත')}</span>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    {tr(activeLang, 'Verified Legal Name', 'තහවුරු කළ නීතිමය නම')}
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {fullName || mergedKycRecord?.fullName || profile.username}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    {tr(activeLang, 'Document Type', 'හැඳුනුම්පත් වර්ගය')}
                  </div>
                  <div className="text-sm font-bold text-white capitalize">
                    {documentType === 'national_id'
                      ? tr(activeLang, 'National Identity Card (NIC)', 'ජාතික හැඳුනුම්පත (NIC)')
                      : documentType === 'passport'
                        ? tr(activeLang, 'Passport', 'විදේශ ගමන් බලපත්‍රය')
                        : tr(activeLang, "Driver's License", 'රියදුරු බලපත්‍රය')}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    {tr(activeLang, 'Document Serial Number', 'හැඳුනුම්පත් අංකය')}
                  </div>
                  <div className="text-sm font-mono font-bold text-white tracking-wider">
                    {documentNumber
                      ? `${documentNumber.slice(0, 3)}••••${documentNumber.slice(-3)}`
                      : 'AUTHENTICATED'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    {tr(activeLang, 'Withdrawal Channels', 'මුදල් ආපසු ගැනීම්')}
                  </div>
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{tr(activeLang, 'LKR & USDT Active', 'LKR සහ USDT සක්‍රියයි')}</span>
                  </div>
                </div>
              </div>

              {/* Verified Documents on File (Read-Only Image Cards, No Upload Dropzones) */}
              {(kycDocBase64 || mergedKycRecord?.documentImageDataUrl || kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl) && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>{tr(activeLang, 'Verified Documents on Secure File', 'ආරක්ෂිතව ගබඩා කර ඇති තහවුරු කළ ලේඛන')}</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400/90">
                      {tr(activeLang, 'Certified by Zentro Team', 'Zentro Team විසින් සහතික කර ඇත')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(kycDocBase64 || mergedKycRecord?.documentImageDataUrl) && (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold">
                            {tr(activeLang, 'Front ID Document', 'හැඳුනුම්පතේ ඉදිරිපස')}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDocModalUrl(
                                kycDocBase64 || mergedKycRecord?.documentImageDataUrl || null
                              )
                            }
                            className="text-[11px] font-mono text-pink-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{tr(activeLang, 'View Full Image', 'විශාල කර බලන්න')}</span>
                          </button>
                        </div>
                        <img
                          src={kycDocBase64 || mergedKycRecord?.documentImageDataUrl}
                          alt="Verified KYC Front"
                          referrerPolicy="no-referrer"
                          onClick={() =>
                            setPreviewDocModalUrl(
                              kycDocBase64 || mergedKycRecord?.documentImageDataUrl || null
                            )
                          }
                          className="w-full h-36 rounded-lg object-contain bg-black/50 cursor-pointer border border-white/5"
                        />
                      </div>
                    )}

                    {(kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl) && (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold">
                            {tr(activeLang, 'Back ID / Selfie Document', 'හැඳුනුම්පතේ පිටුපස / සෙල්ෆි')}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDocModalUrl(
                                kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl || null
                              )
                            }
                            className="text-[11px] font-mono text-pink-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{tr(activeLang, 'View Full Image', 'විශාල කර බලන්න')}</span>
                          </button>
                        </div>
                        <img
                          src={kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl}
                          alt="Verified KYC Back"
                          referrerPolicy="no-referrer"
                          onClick={() =>
                            setPreviewDocModalUrl(
                              kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl || null
                            )
                          }
                          className="w-full h-36 rounded-lg object-contain bg-black/50 cursor-pointer border border-white/5"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  {tr(
                    activeLang,
                    'Your verification is permanent and in terminal state. No further document uploads, edits, or KYC actions are required.',
                    'ඔබගේ සත්‍යාපනය සාර්ථකව අවසන් කර ඇති බැවින් නැවත ලේඛන යොමු කිරීම හෝ පෝරම පිරවීම අවශ්‍ය නොවේ.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            /* KYC FORM & UPLOADED DOCUMENT PREVIEW GRID FOR UNVERIFIED / PENDING / REJECTED */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleKycSubmit}
                className="lg:col-span-7 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-pink-500" />
                      <span>
                        {tr(
                          activeLang,
                          'Submit Identity Verification Documents',
                          'අනන්‍යතා සත්‍යාපන ලේඛන යොමු කරන්න (KYC)'
                        )}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tr(
                        activeLang,
                        'All uploaded documents are manually inspected by Zentro Team before verification.',
                        'සියලුම ලේඛන Zentro Team එක විසින් පරීක්ෂා කර සත්‍යාපනය කරනු ලැබේ.'
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                      effectiveKycStatus === 'pending'
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {effectiveKycStatus}
                  </span>
                </div>

                {kycError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{kycError}</span>
                  </div>
                )}

                {kycSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{kycSuccessMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {tr(
                      activeLang,
                      '1. Full Legal Name (Exactly as shown on ID Document)',
                      '1. සම්පූර්ණ නීතිමය නම (හැඳුනුම්පතේ සඳහන් පරිදි)'
                    )}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={tr(activeLang, 'Enter your full legal name', 'ඔබගේ සම්පූර්ණ නම ඇතුළත් කරන්න')}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {tr(activeLang, '2. Government ID Document Type', '2. හැඳුනුම්පත් වර්ගය')}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="national_id">
                        {tr(activeLang, 'National Identity Card (NIC)', 'ජාතික හැඳුනුම්පත (NIC)')}
                      </option>
                      <option value="passport">
                        {tr(activeLang, 'International Passport', 'විදේශ ගමන් බලපත්‍රය (Passport)')}
                      </option>
                      <option value="driver_license">
                        {tr(activeLang, "Driver's License", 'රියදුරු බලපත්‍රය (Driving License)')}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {tr(activeLang, '3. Document Serial / ID Number', '3. හැඳුනුම්පත් / බලපත්‍ර අංකය')}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="e.g. 199824501823 / N9823412"
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Document Upload Boxes (Front Required + Back/Selfie Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {tr(
                        activeLang,
                        '4. Upload ID Front Photo (Required for Zentro Team)',
                        '4. හැඳුනුම්පතේ ඉදිරිපස ජායාරූපය (අනිවාර්යයි)'
                      )}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <label
                      className={`w-full min-h-[110px] p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2 ${
                        kycDocBase64
                          ? 'border-sky-500 bg-sky-500/10 cursor-pointer'
                          : 'border-pink-400/60 dark:border-pink-500/40 bg-pink-50/40 dark:bg-slate-800/60 hover:border-pink-500 cursor-pointer'
                      }`}
                    >
                      <Camera className="w-6 h-6 text-pink-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {kycLoading
                          ? tr(activeLang, 'Processing ID Photo...', 'ජායාරූපය සකසමින් පවතී...')
                          : kycDocBase64
                            ? tr(
                                activeLang,
                                '✓ Front ID Photo Ready (Click to Change)',
                                '✓ ඉදිරිපස ජායාරූපය ඇතුළත් කර ඇත (වෙනස් කිරීමට ඔබන්න)'
                              )
                            : tr(
                                activeLang,
                                'Click to Upload Front ID Photo',
                                'හැඳුනුම්පතේ ඉදිරිපස ජායාරූපය Upload කරන්න'
                              )}
                      </span>
                      {kycDocFileName && (
                        <span className="text-[10px] font-mono text-sky-500 truncate max-w-[200px]">
                          {kycDocFileName}
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleKycPhotoUpload(e, 'front')}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {tr(
                        activeLang,
                        '5. Upload ID Back / Selfie Photo (Optional)',
                        '5. හැඳුනුම්පතේ පිටුපස / සෙල්ෆි ජායාරූපය (අමතර)'
                      )}
                    </label>
                    <label
                      className={`w-full min-h-[110px] p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2 ${
                        kycBackDocBase64
                          ? 'border-sky-500 bg-sky-500/10 cursor-pointer'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-pink-400 cursor-pointer'
                      }`}
                    >
                      <Upload className="w-6 h-6 text-sky-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {kycBackDocBase64
                          ? tr(
                              activeLang,
                              '✓ Back / Selfie Photo Ready (Click to Change)',
                              '✓ පිටුපස ජායාරූපය ඇතුළත් කර ඇත'
                            )
                          : tr(
                              activeLang,
                              'Click to Upload Back / Selfie Photo',
                              'පිටුපස හෝ සෙල්ෆි ජායාරූපය Upload කරන්න'
                            )}
                      </span>
                      {kycBackDocFileName && (
                        <span className="text-[10px] font-mono text-sky-500 truncate max-w-[200px]">
                          {kycBackDocFileName}
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleKycPhotoUpload(e, 'back')}
                      />
                    </label>
                  </div>
                </div>

                {aiNotes && (
                  <div className="p-3.5 rounded-2xl border border-pink-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1">
                    <div className="font-mono font-bold text-pink-600 dark:text-pink-400">
                      {tr(
                        activeLang,
                        'PRE-CHECK SUMMARY FOR ZENTRO TEAM REVIEW:',
                        'ZENTRO TEAM පරීක්ෂාව සඳහා ලේඛන සාරාංශය:'
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{aiNotes}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={kycLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm cursor-pointer shadow-lg hover:opacity-95 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {kycLoading
                      ? tr(activeLang, 'Submitting Documents to Zentro Team...', 'Zentro Team වෙත යොමු කරමින් පවතී...')
                      : effectiveKycStatus === 'pending'
                        ? tr(
                            activeLang,
                            'Update & Resubmit KYC Documents for Zentro Team Review',
                            'KYC ලේඛන යාවත්කාලීන කර නැවත Zentro Team වෙත යොමු කරන්න'
                          )
                        : tr(
                            activeLang,
                            'Submit KYC Application for Zentro Team Verification',
                            'Zentro Team අනුමැතිය සඳහා KYC අයදුම්පත යොමු කරන්න'
                          )}
                  </span>
                </button>
              </form>

              {/* Right Column: Uploaded Documents Live Preview & KYC Rules */}
              <div className="lg:col-span-5 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-sky-500" />
                    <span>
                      {tr(
                        activeLang,
                        'Uploaded Verification Documents',
                        'Upload කළ හැඳුනුම්පත් ලේඛන'
                      )}
                    </span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {tr(activeLang, 'Zentro Team Review', 'Zentro Team පරීක්ෂාව සඳහා')}
                  </span>
                </div>

                {kycDocBase64 || mergedKycRecord?.documentImageDataUrl ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-sky-500">
                          {tr(activeLang, 'Front ID Document Photo', 'හැඳුනුම්පතේ ඉදිරිපස ජායාරූපය')}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDocModalUrl(
                              kycDocBase64 || mergedKycRecord?.documentImageDataUrl || null
                            )
                          }
                          className="text-[11px] font-mono text-pink-500 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{tr(activeLang, 'View Full Image', 'විශාල කර බලන්න')}</span>
                        </button>
                      </div>
                      <img
                        src={kycDocBase64 || mergedKycRecord?.documentImageDataUrl}
                        alt="Uploaded Front KYC Document"
                        referrerPolicy="no-referrer"
                        onClick={() =>
                          setPreviewDocModalUrl(
                            kycDocBase64 || mergedKycRecord?.documentImageDataUrl || null
                          )
                        }
                        className="w-full max-h-48 rounded-xl border border-slate-200 dark:border-slate-700 object-contain bg-black/20 cursor-pointer"
                      />
                    </div>

                    {(kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl) && (
                      <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-sky-500">
                            {tr(
                              activeLang,
                              'Back ID / Selfie Document Photo',
                              'හැඳුනුම්පතේ පිටුපස / සෙල්ෆි ජායාරූපය'
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDocModalUrl(
                                kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl || null
                              )
                            }
                            className="text-[11px] font-mono text-pink-500 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{tr(activeLang, 'View Full Image', 'විශාල කර බලන්න')}</span>
                          </button>
                        </div>
                        <img
                          src={kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl}
                          alt="Uploaded Back KYC Document"
                          referrerPolicy="no-referrer"
                          onClick={() =>
                            setPreviewDocModalUrl(
                              kycBackDocBase64 || mergedKycRecord?.documentBackImageDataUrl || null
                            )
                          }
                          className="w-full max-h-48 rounded-xl border border-slate-200 dark:border-slate-700 object-contain bg-black/20 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {tr(activeLang, 'No ID Document Uploaded Yet', 'තවම හැඳුනුම්පත් ජායාරූපයක් Upload කර නැත')}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {tr(
                        activeLang,
                        'Upload your NIC, Passport, or Driver License photo on the left so Zentro Team can inspect and verify your identity.',
                        'වම් පස ඇති පෝරමයෙන් ඔබගේ හැඳුනුම්පත් ජායාරූපය Upload කරන්න.'
                      )}
                    </p>
                  </div>
                )}

                {/* KYC Rules & Withdrawal Requirement Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-pink-500/10 to-rose-500/10 border border-pink-500/25 space-y-2 text-xs">
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-pink-500" />
                    <span>
                      {tr(
                        activeLang,
                        'Why KYC Verification is Required',
                        'KYC සත්‍යාපනය අනිවාර්ය ඇයි?'
                      )}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                    <li>
                      {tr(
                        activeLang,
                        'Unverified users cannot make Bank (LKR) or USDT (BEP-20) withdrawals.',
                        'KYC තහවුරු නොකළ පරිශීලකයින්ට මුදල් ආපසු ගැනීම් (Withdrawals) කළ නොහැක.'
                      )}
                    </li>
                    <li>
                      {tr(
                        activeLang,
                        'No automatic verification: Zentro Team manually inspects your uploaded ID document.',
                        'ස්වයංක්‍රීයව තහවුරු නොවේ: Zentro Team විසින් ඔබගේ ලේඛන පරීක්ෂා කර අනුමත කරයි.'
                      )}
                    </li>
                    <li>
                      {tr(
                        activeLang,
                        'Ensure your full name and ID number clearly match the uploaded photo.',
                        'ඔබ ඇතුළත් කරන නම සහ හැඳුනුම්පත් අංකය ජායාරූපය සමඟ පැහැදිලිව ගැලපිය යුතුය.'
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Fullscreen Lightbox Modal for Uploaded KYC Document */}
          {previewDocModalUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setPreviewDocModalUrl(null)}
            >
              <div
                className="max-w-3xl w-full bg-[#101626] border border-pink-500/40 rounded-3xl p-4 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between text-white">
                  <span className="text-xs font-mono font-bold uppercase text-pink-400">
                    {tr(activeLang, 'Uploaded KYC Document Preview', 'Upload කළ KYC ලේඛනය')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewDocModalUrl(null)}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
                  >
                    {tr(activeLang, 'Close', 'වසන්න')}
                  </button>
                </div>
                <img
                  src={previewDocModalUrl}
                  alt="KYC Document Full Preview"
                  className="w-full max-h-[75vh] object-contain rounded-2xl bg-black"
                />
              </div>
            </div>
          )}

          {/* Bottom Back to Menu Button */}
          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-pink-500" />
              <span>{tr(activeLang, '← Back to Menu List', '← ආපසු ලැයිස්තුවට')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. TRANSACTION HISTORY */}
      {activeSubPage === 'transactions' && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Financial Transaction Ledger
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'deposit', 'withdrawal', 'vip_upgrade', 'task_reward'] as const).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize cursor-pointer ${
                      txFilter === t
                        ? 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Amount ({activeCurrency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No transactions recorded for this filter yet.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isPositive =
                      tx.type === 'deposit' ||
                      tx.type === 'task_reward' ||
                      tx.type === 'referral_bonus';
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-3 font-mono uppercase font-semibold">
                          {tx.type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {replaceCurrencyInText(tx.description, activeCurrency)}
                        </td>
                        <td className="py-3 px-3 font-mono uppercase">
                          {tx.status === 'pending' ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                              PENDING ADMIN APPROVE
                            </span>
                          ) : tx.status === 'rejected' ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                              REJECTED
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {tx.status}
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {formatCurrencyValue(tx.amount, activeCurrency)} {activeCurrency}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Back to Menu Button */}
          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-pink-500" />
              <span>{tr(activeLang, '← Back to Menu List', '← ආපසු ලැයිස්තුවට')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. REFERRAL HISTORY */}
      {activeSubPage === 'referrals' && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Referral & Team Commission History
              </h3>
              {profile.vipLevel >= 1 ? (
                <p className="text-xs text-slate-500">
                  Your VIP Referral Code:{' '}
                  <span className="font-mono font-bold text-pink-600 dark:text-pink-400">
                    {profile.referralCode}
                  </span>{' '}
                  · Share Link:{' '}
                  <span className="font-mono">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/?ref=${profile.referralCode}`
                      : `/?ref=${profile.referralCode}`}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-rose-500 font-semibold">
                  🔒 Referral Link Locked — Only VIP 1+ members can share their referral link and refer team members.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-3 px-3">Team Member</th>
                  <th className="py-3 px-3">Referral Code Used</th>
                  <th className="py-3 px-3">Network Tier</th>
                  <th className="py-3 px-3">Member VIP</th>
                  <th className="py-3 px-3 text-right">Commission Earned ({activeCurrency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      {profile.vipLevel >= 1
                        ? `No referral records yet. Share your VIP referral link (${
                            typeof window !== 'undefined'
                              ? `${window.location.origin}/?ref=${profile.referralCode}`
                              : profile.referralCode
                          }) or add a team referral in the Team tab.`
                        : 'No referral records yet. Upgrade to VIP 1 or higher in the VIP tab to unlock your referral link and invite team members.'}
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => {
                    const refVip = VIP_TIERS.find((v) => v.level === ref.vipLevel);
                    return (
                      <tr key={ref.id}>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {ref.referredUsername}
                        </td>
                        <td className="py-3 px-3 font-mono">{ref.referralCodeUsed}</td>
                        <td className="py-3 px-3 font-mono">Level {ref.tierLevel}</td>
                        <td className="py-3 px-3 font-mono">
                          {refVip ? refVip.name : `VIP ${ref.vipLevel}`}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          +{formatCurrencyValue(ref.commissionEarned, activeCurrency)} {activeCurrency}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Back to Menu Button */}
          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-pink-500" />
              <span>{tr(activeLang, '← Back to Menu List', '← ආපසු ලැයිස්තුවට')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. MY BANK */}
      {activeSubPage === 'bank' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleBankSubmit}
            className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {tr(
                activeLang,
                'Bind Withdrawal Bank / USDT (BEP-20) Address',
                'බැංකු ගිණුම හෝ USDT (BEP-20) ලිපිනය සම්බන්ධ කරන්න'
              )}
            </h3>

            {/* Toggle between Bank Account and USDT BEP-20 Address */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setBindMode('bank');
                  setBankError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  bindMode === 'bank'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tr(activeLang, 'Bank Account (LKR)', 'බැංකු ගිණුම (Bank)')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBindMode('usdt_bep20');
                  setBankError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  bindMode === 'usdt_bep20'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tr(activeLang, 'USDT (BEP-20 Only)', 'USDT (BEP-20 පමණි)')}
              </button>
            </div>

            {bankError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs">
                {bankError}
              </div>
            )}

            {bindMode === 'bank' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tr(activeLang, 'Bank Name (e.g. BOC / Commercial / Sampath)', 'බැංකුවේ නම')}
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Enter Bank Name"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tr(activeLang, 'Account Holder Legal Name', 'ගිණුම් හිමියාගේ සම්පූර්ණ නම')}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Full legal name"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tr(activeLang, 'Bank Account Number', 'බැංකු ගිණුම් අංකය')}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter bank account number"
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tr(activeLang, 'Branch / SWIFT Code', 'ශාඛාව / SWIFT කේතය')}
                  </label>
                  <input
                    type="text"
                    required
                    value={routingOrSwift}
                    onChange={(e) => setRoutingOrSwift(e.target.value)}
                    placeholder="e.g. Colombo Main Branch"
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs">
                  {tr(
                    activeLang,
                    'Only USDT (BEP-20 / BNB Smart Chain) wallet addresses are supported for USDT withdrawals (Min 5 USDT, Fee 0.5 USDT).',
                    'USDT මුදල් ආපසු ගැනීම් සඳහා USDT (BEP-20 / BNB Smart Chain) ලිපිනයන් පමණක් භාවිතා කළ හැක (අවමය 5 USDT, ගාස්තුව 0.5 USDT).'
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tr(activeLang, 'USDT (BEP-20) Wallet Address', 'USDT (BEP-20) ලිපිනය')}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="0x... (BNB Smart Chain BEP-20 Address)"
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tr(activeLang, 'Wallet Label / Holder Name', 'Wallet නාමය / හිමිකරුගේ නම')}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="e.g. My Binance BEP-20 Wallet"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {tr(activeLang, 'Security Password', 'ආරක්ෂක මුරපදය (Security Password)')}
              </label>
              <input
                type="password"
                required
                value={bankSecPass}
                onChange={(e) => setBankSecPass(e.target.value)}
                placeholder="Enter your Security Password"
                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={bankLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              {bankLoading
                ? 'Binding...'
                : bindMode === 'bank'
                  ? tr(activeLang, 'Bind Bank Account', 'බැංකු ගිණුම Bind කරන්න')
                  : tr(activeLang, 'Bind USDT (BEP-20) Address', 'USDT (BEP-20) ලිපිනය Bind කරන්න')}
            </button>
          </form>

          <div className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {tr(
                activeLang,
                `Bound Withdrawal Accounts & BEP-20 Addresses (${bankAccounts.length})`,
                `සම්බන්ධ කළ බැංකු ගිණුම් සහ BEP-20 ලිපිනයන් (${bankAccounts.length})`
              )}
            </h3>
            <div className="space-y-3">
              {bankAccounts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {tr(
                    activeLang,
                    'No Bank Account or USDT (BEP-20) address bound yet. Bind your account on the left before withdrawing.',
                    'තවම බැංකු ගිණුමක් හෝ USDT (BEP-20) ලිපිනයක් සම්බන්ධ කර නැත. මුදල් ආපසු ගැනීමට පෙර වම් පසින් Bind කරන්න.'
                  )}
                </div>
              ) : (
                bankAccounts.map((b) => {
                  const isBep20 = isUsdtBep20BankAccount(b);
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isBep20
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-sky-500/20 text-sky-500'
                            }`}
                          >
                            {isBep20 ? 'USDT BEP-20' : 'BANK ACCOUNT'}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {b.bankName}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">
                          {isBep20 ? 'BEP-20 Address:' : 'Account:'} {b.accountNumber} ·{' '}
                          {isBep20 ? 'Network:' : 'Branch/Code:'} {b.routingOrSwift}
                        </div>
                        <div className="text-xs text-slate-500">
                          Holder / Label: {b.accountHolder}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteBankId(b.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Back to Menu Button */}
          <div className="lg:col-span-12 pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-pink-500" />
              <span>{tr(activeLang, '← Back to Menu List', '← ආපසු ලැයිස්තුවට')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. HARDWARE & DEVICE SECURITY TELEMETRY */}
      {activeSubPage === 'security' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {tr(activeLang, 'Device & Hardware Security Telemetry', 'උපාංග සහ දෘඩාංග ආරක්ෂණ පද්ධතිය')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tr(
                    activeLang,
                    'Strict 1-Device / 1-Account Anti-Sybil protection enforced on Zentro Global Network.',
                    'Zentro ජාලයේ 1-Device / 1-Account ආරක්ෂණ පද්ධතිය මගින් ගිණුම සුරක්ෂිත කර ඇත.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-mono font-bold self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{tr(activeLang, 'HARDWARE LOCKED', 'දෘඩාංග සුරක්ෂිතයි')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase">
                {tr(activeLang, 'Hardware MAC Address', 'MAC ලිපිනය')}
              </div>
              <div className="text-sm font-mono font-bold text-pink-500 break-all">
                {profile.macAddress || hwInfo.macAddress}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase">
                {tr(activeLang, 'Unique Terminal ID', 'උපාංග හැඳුනුම (Device ID)')}
              </div>
              <div className="text-sm font-mono font-bold text-sky-500 break-all">
                {profile.deviceId || hwInfo.deviceId}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase">
                {tr(activeLang, 'Tracked Public IP', 'පරීක්ෂා කළ IP ලිපිනය')}
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {trackedIp}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase">
                {tr(activeLang, 'Geo Location Node', 'ස්ථානය / නගරය')}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {trackedLoc}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-pink-500/10 to-rose-500/10 border border-pink-500/20 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{tr(activeLang, 'Zentro Terminal Anti-Fraud Protocol', 'Zentro වංචා විරෝධී ආරක්ෂක පද්ධතිය')}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {tr(
                activeLang,
                'Each member is permanently restricted to 1 device and 1 hardware MAC footprint. Multi-accounting, emulator spoofing, and automated bots are blocked in real-time.',
                'සෑම පරිශීලකයෙකුම 1 උපාංගයකට සහ 1 MAC ලිපිනයකට පමණක් සීමා කර ඇත. බහු ගිණුම් සෑදීම හෝ වංචනික ක්‍රියා ස්වයංක්‍රීයව අවහිර කරනු ලැබේ.'
              )}
            </p>
          </div>

          {/* Bottom Back to Menu Button */}
          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-pink-500" />
              <span>{tr(activeLang, '← Back to Menu List', '← ආපසු ලැයිස්තුවට')}</span>
            </button>
          </div>
        </div>
      )}

      {confirmDeleteBankId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Remove Linked Bank Account?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove this withdrawal bank account from your Zentro
              profile?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteBankId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeleteBankId;
                  setConfirmDeleteBankId(null);
                  await onDeleteBankAccount(id);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
