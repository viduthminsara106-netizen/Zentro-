import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sun,
  Moon,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  COUNTRY_OPTIONS,
  DeviceSecurityTelemetry,
  DeviceAccountLockRecord,
  collectDeviceSecurityTelemetry,
  detectIncognitoBrowsing,
  getDeterministicDeviceAndMac,
  getExistingDeviceAccountLock,
  syncLocalDeviceLockToServer,
  isValidReferralCodeFormat,
  isAdminCredentials,
  ZENTRO_ATRIUM_BG_DATA_URI,
  ZENTRO_ATRIUM_LIGHT_BG_DATA_URI,
  ZENTRO_LOGO_URL,
} from '../types';

export interface PendingRegistrationData {
  username: string;
  countryCode: string;
  mobile: string;
  email: string;
  password: string;
  securityPassword: string;
  referralCode: string;
  rememberMe: boolean;
  deviceTelemetry?: DeviceSecurityTelemetry;
}

export interface PendingLoginData {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

interface AuthGateProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onRegisterAccount: (data: PendingRegistrationData) => Promise<void>;
  onLoginAccount: (data: PendingLoginData) => Promise<void>;
  authError: string | null;
  isSubmitting: boolean;
}

/* ============================================================================
 * MULTI-COLOR (BLUE + PINK + RED) INPUT FIELD ILLUSTRATIONS
 * Pure standalone SVG pictures without any button/squircle container
 * ============================================================================ */

// 1. User Portrait Illustration (Blue + Pink + Red)
const UserPictureIcon: React.FC = () => (
  <svg
    viewBox="0 0 36 36"
    className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="userHeadGrad" x1="8" y1="4" x2="28" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="55%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="userBodyGrad" x1="5" y1="20" x2="31" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="50%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="11.5" r="6.5" fill="url(#userHeadGrad)" />
    <circle cx="16" cy="9.5" r="1.5" fill="#ffffff" fillOpacity="0.65" />
    <path
      d="M6.5 30.5C6.5 24.7 11.4 20.5 18 20.5C24.6 20.5 29.5 24.7 29.5 30.5C29.5 31.6 28.6 32.5 27.5 32.5H8.5C7.4 32.5 6.5 31.6 6.5 30.5Z"
      fill="url(#userBodyGrad)"
    />
    <path
      d="M14 21.2L18 26.5L22 21.2"
      stroke="#ffffff"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 2. Mobile Phone Illustration (Blue + Pink + Red)
const PhonePictureIcon: React.FC = () => (
  <svg
    viewBox="0 0 36 36"
    className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="phoneScreenGrad" x1="9" y1="3" x2="27" y2="33" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <rect
      x="9"
      y="3.5"
      width="18"
      height="29"
      rx="4.5"
      fill="url(#phoneScreenGrad)"
      stroke="#ffffff"
      strokeOpacity="0.5"
      strokeWidth="1.2"
    />
    <rect x="11.5" y="7" width="13" height="19.5" rx="2" fill="#0f172a" fillOpacity="0.25" />
    <path
      d="M13.5 13.5C15.5 11.5 20.5 11.5 22.5 13.5"
      stroke="#ffffff"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M15.5 17C16.8 15.8 19.2 15.8 20.5 17"
      stroke="#fde047"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="18" cy="29.5" r="1.5" fill="#ffffff" />
  </svg>
);

// 3. Letter / Envelope Illustration
const LetterEnvelopePictureIcon: React.FC = () => (
  <svg
    viewBox="0 0 36 36"
    className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="envBodyGrad" x1="3" y1="11" x2="33" y2="31" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="52%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="envFlapGrad" x1="4" y1="10" x2="32" y2="23" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
    {/* Rising White & Pink Letter Sheet inside the Envelope */}
    <rect
      x="8"
      y="5.5"
      width="20"
      height="15"
      rx="2.5"
      fill="#ffffff"
      stroke="#f43f5e"
      strokeWidth="1.2"
    />
    <line x1="11.5" y1="9.5" x2="20.5" y2="9.5" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="11.5" y1="13" x2="24.5" y2="13" stroke="#ec4899" strokeWidth="1.6" strokeLinecap="round" />
    {/* Envelope Main Body */}
    <rect x="4" y="13" width="28" height="18" rx="4" fill="url(#envBodyGrad)" />
    {/* Envelope Flap Lines */}
    <path d="M4.8 14.2L18 23.2L31.2 14.2" fill="url(#envFlapGrad)" />
    <path
      d="M4.8 14.2L18 23.2L31.2 14.2"
      stroke="#ffffff"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Red/Pink Wax Seal Dot */}
    <circle cx="18" cy="23" r="2.6" fill="#ffffff" />
    <circle cx="18" cy="23" r="1.5" fill="#ef4444" />
  </svg>
);

// 4. Password Padlock Illustration (Blue + Pink + Red)
const PasswordLockPictureIcon: React.FC = () => (
  <svg
    viewBox="0 0 36 36"
    className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="lockBodyGrad" x1="7" y1="15" x2="29" y2="33" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <path
      d="M12 15V10.5C12 7.18629 14.6863 4.5 18 4.5C21.3137 4.5 24 7.18629 24 10.5V15"
      stroke="#38bdf8"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <rect x="7.5" y="14.5" width="21" height="17" rx="4.5" fill="url(#lockBodyGrad)" />
    <circle cx="18" cy="21.5" r="2.3" fill="#ffffff" />
    <path d="M18 23.2V26.8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// 5. Confirm Password Double-Shield Lock Illustration (Blue + Pink + Red)
const ConfirmLockPictureIcon: React.FC = () => (
  <svg
    viewBox="0 0 36 36"
    className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="shieldGrad" x1="6" y1="4" x2="30" y2="33" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <path
      d="M18 4L29 8.5V17.5C29 24.8 24.2 30.4 18 32.5C11.8 30.4 7 24.8 7 17.5V8.5L18 4Z"
      fill="url(#shieldGrad)"
    />
    <path
      d="M13.5 18.5L16.8 21.8L23 14.8"
      stroke="#ffffff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 6. Security Password Key & Gem Illustration (Blue + Pink + Red)
const SecurityKeyPictureIcon: React.FC = () => (
  <svg
    viewBox="0 0 36 36"
    className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="keyGrad" x1="4" y1="6" x2="32" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <circle cx="13" cy="14" r="7" fill="url(#keyGrad)" />
    <circle cx="13" cy="14" r="2.6" fill="#ffffff" />
    <path
      d="M18.2 18.8L29.5 30.1M25.5 26.1L28.5 23.1M22 22.6L24.8 19.8"
      stroke="url(#keyGrad)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 7. Invitee / Referral Gift & Star Ribbon Illustration (Blue + Pink + Red)
const InviteePictureIcon: React.FC = () => (
  <svg
    viewBox="0 0 36 36"
    className="w-7 h-7 shrink-0 overflow-visible drop-shadow-sm"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="giftBoxGrad" x1="6" y1="11" x2="30" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <path
      d="M18 12C15 7.5 10.5 7.5 10.5 10.5C10.5 12.5 14.5 12.5 18 12ZM18 12C21 7.5 25.5 7.5 25.5 10.5C25.5 12.5 21.5 12.5 18 12Z"
      stroke="#f43f5e"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="6.5" y="12" width="23" height="6" rx="2" fill="url(#giftBoxGrad)" />
    <rect x="8.5" y="18" width="19" height="13" rx="3" fill="url(#giftBoxGrad)" />
    <rect x="16.5" y="12" width="3" height="19" fill="#ffffff" />
    <rect x="8.5" y="22.5" width="19" height="2.6" fill="#ffffff" fillOpacity="0.85" />
  </svg>
);

/* ============================================================================
 * 100% AUTHENTIC & CRYSTAL-CLEAR iOS CURSIVE "Welcome" HANDWRITING ANIMATION
 * - NO card, NO border, NO box around it (pure floating iOS calligraphy)
 * - Uses connected monoline cursive script ('Pacifico', 'Dancing Script')
 *   with left-to-right SVG clip-path pen reveal + glowing stroke trace
 * ============================================================================ */
const IosWelcomeCalligraphy: React.FC<{
  isDark: boolean;
}> = ({ isDark }) => {
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setReplayKey((prev) => prev + 1);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={() => setReplayKey((prev) => prev + 1)}
      title="Tap to replay iOS Welcome animation"
      className="relative w-full flex flex-col items-center justify-center py-3 select-none cursor-pointer"
    >
      <svg
        key={replayKey}
        viewBox="0 0 520 145"
        className="w-72 sm:w-96 h-24 sm:h-28 overflow-visible"
      >
        <defs>
          {/* Left-to-right iOS handwriting reveal clip-path */}
          <clipPath id={`iosWriteClip-${replayKey}`}>
            <motion.rect
              x="0"
              y="0"
              height="150"
              initial={{ width: 0 }}
              animate={{ width: 520 }}
              transition={{
                duration: 1.85,
                ease: [0.35, 0, 0.25, 1],
              }}
            />
          </clipPath>

          {/* Vibrant Blue + Pink + Red iOS Stroke Gradient */}
          <linearGradient
            id="iosWelcomeStrokeGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          {/* High-contrast Fill Gradient for Light Mode */}
          <linearGradient
            id="iosWelcomeLightFill"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="52%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Layer 1: Continuous iOS Cursive Monoline Stroke Outline Drawing */}
        <motion.text
          x="50%"
          y="98"
          textAnchor="middle"
          fill="none"
          stroke="url(#iosWelcomeStrokeGrad)"
          strokeWidth={isDark ? '3.5' : '2.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            fontFamily: "'Pacifico', 'Dancing Script', Georgia, cursive",
            fontSize: '86px',
            fontWeight: 400,
          }}
          initial={{ strokeDasharray: 1400, strokeDashoffset: 1400 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{
            duration: 1.85,
            ease: [0.35, 0, 0.25, 1],
          }}
        >
          Welcome
        </motion.text>

        {/* Layer 2: Crystal-Clear Solid Cursive Script Fill Revealed Left-to-Right like iOS */}
        <g clipPath={`url(#iosWriteClip-${replayKey})`}>
          <text
            x="50%"
            y="98"
            textAnchor="middle"
            fill={isDark ? '#ffffff' : 'url(#iosWelcomeLightFill)'}
            style={{
              fontFamily: "'Pacifico', 'Dancing Script', Georgia, cursive",
              fontSize: '86px',
              fontWeight: 400,
              filter: isDark
                ? 'drop-shadow(0 4px 18px rgba(236, 72, 153, 0.55))'
                : 'drop-shadow(0 2px 10px rgba(219, 39, 119, 0.22))',
            }}
          >
            Welcome
          </text>
        </g>

        {/* Layer 3: Signature iOS Flourish Underline Stroke */}
        <motion.path
          d="M 105 124 C 195 138, 325 138, 415 120"
          fill="none"
          stroke="url(#iosWelcomeStrokeGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 1.1,
            delay: 1.15,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </svg>
    </div>
  );
};

export const AuthGate: React.FC<AuthGateProps> = ({
  isDark,
  onToggleTheme,
  onRegisterAccount,
  onLoginAccount,
  authError,
  isSubmitting,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');

  // Form states
  const [username, setUsername] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0].code);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityPassword, setSecurityPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptPrivacy, setAcceptPrivacy] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecPassword, setShowSecPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Device, MAC, IP & Location tracking state (1 account per device policy)
  const [deviceTelemetry, setDeviceTelemetry] = useState<DeviceSecurityTelemetry>(() => {
    const base = getDeterministicDeviceAndMac();
    return {
      deviceId: base.deviceId,
      macAddress: base.macAddress,
      ipAddress: localStorage.getItem('zentro_tracked_ip_v1') || 'Detecting IP...',
      location: localStorage.getItem('zentro_tracked_loc_v1') || base.timezoneLocation,
      hardwareSummary: base.hardwareSummary,
    };
  });
  const [existingDeviceLock, setExistingDeviceLock] =
    useState<DeviceAccountLockRecord | null>(() => getExistingDeviceAccountLock());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = (params.get('ref') || params.get('invite') || params.get('code') || '')
      .trim()
      .toUpperCase();
    if (refParam && isValidReferralCodeFormat(refParam)) {
      let isNonVipLocalReferrer = false;
      try {
        const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
        if (rawAccounts) {
          const accounts = JSON.parse(rawAccounts);
          const matched = Object.values(accounts).find(
            (acc: any) => acc?.profile?.referralCode?.toUpperCase() === refParam
          ) as any;
          if (matched && (matched.profile?.vipLevel ?? 0) < 1) {
            isNonVipLocalReferrer = true;
          }
        }
      } catch {
        // ignore
      }
      if (!isNonVipLocalReferrer) {
        setReferralCode(refParam);
      } else {
        setReferralCode('');
      }
    } else {
      setReferralCode('');
    }
    const savedEmail = localStorage.getItem('zentro_remember_email');
    const savedUsername = localStorage.getItem('zentro_remember_username');
    if (savedEmail) setEmail(savedEmail);
    if (savedUsername) setUsername(savedUsername);

    let mounted = true;
    collectDeviceSecurityTelemetry().then(async (telemetry) => {
      if (!mounted) return;
      setDeviceTelemetry(telemetry);
      const syncedLock = await syncLocalDeviceLockToServer(telemetry);
      if (mounted && syncedLock) {
        setExistingDeviceLock(syncedLock);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const currentCountryObj =
    COUNTRY_OPTIONS.find((c) => c.code === selectedCountry) || COUNTRY_OPTIONS[0];
  const dialCodeFormatted = `${currentCountryObj.flag} ${currentCountryObj.dialCode.replace('-CA', '')}`;
  const isRefValid = Boolean(referralCode.trim()) && isValidReferralCodeFormat(referralCode);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const isIncognitoNow =
      Boolean(deviceTelemetry.isIncognito) || (await detectIncognitoBrowsing());
    if (isIncognitoNow) {
      setLocalError(
        'Incognito / Private browsing tabs cannot be used to create an account. Only 1 account per device, IP, MAC, and location is permitted.'
      );
      return;
    }

    const activeLock =
      existingDeviceLock ||
      getExistingDeviceAccountLock(deviceTelemetry) ||
      (await syncLocalDeviceLockToServer(deviceTelemetry));
    if (activeLock) {
      setExistingDeviceLock(activeLock);
      setLocalError(
        `Only 1 account is permitted per device, IP, MAC, and location (Cross-Browser & Incognito Protected). This device (Device: ${activeLock.deviceId} · MAC: ${activeLock.macAddress} · IP: ${activeLock.ipAddress} · Location: ${activeLock.location}) is already registered to "${activeLock.username}". Please Sign in instead.`
      );
      return;
    }

    if (username.trim().length < 2) {
      setLocalError('Please enter one user name (at least 2 characters).');
      return;
    }
    if (mobile.trim().length < 5) {
      setLocalError('Please enter your phone number.');
      return;
    }
    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Please input a password (at least 6 characters).');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Password and confirmation password do not match.');
      return;
    }
    if (securityPassword.trim().length < 4) {
      setLocalError('Please create a Security Password (at least 4 digits/characters).');
      return;
    }
    if (!referralCode.trim() || !isRefValid) {
      setLocalError(
        'An Invite Code is required to register. Please open the registration link shared by an active VIP member.'
      );
      return;
    }
    if (!acceptPrivacy) {
      setLocalError('Please tick the Privacy Policy checkbox to continue.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('zentro_remember_email', email.trim());
      localStorage.setItem('zentro_remember_username', username.trim());
    } else {
      localStorage.removeItem('zentro_remember_email');
      localStorage.removeItem('zentro_remember_username');
    }

    await onRegisterAccount({
      username: username.trim(),
      countryCode: dialCodeFormatted,
      mobile: mobile.trim(),
      email: email.trim(),
      password,
      securityPassword: securityPassword.trim(),
      referralCode: referralCode.trim().toUpperCase(),
      rememberMe,
      deviceTelemetry,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const identifier = (email.trim() || username.trim()).trim();
    if (!identifier) {
      setLocalError('Please enter your user name or email.');
      return;
    }
    if (!password) {
      setLocalError('Please input your password.');
      return;
    }

    if (rememberMe && !isAdminCredentials(identifier, password)) {
      localStorage.setItem('zentro_remember_email', identifier);
    }

    await onLoginAccount({
      identifier,
      password,
      rememberMe,
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between bg-gradient-to-b from-[#0b193c] via-[#131b42] to-[#1e0e33] text-slate-900 dark:text-white">
      {/* Creative Zentro Atrium Background Image with Pink + Red + White + Blue Atmospheric Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={isDark ? ZENTRO_ATRIUM_BG_DATA_URI : ZENTRO_ATRIUM_LIGHT_BG_DATA_URI}
          alt="Zentro Creative Atrium Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-100 scale-105 transition-transform duration-700"
        />
        <div
          className={`absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl animate-pulse ${
            isDark ? 'bg-sky-500/20' : 'bg-sky-400/25'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-20 w-96 h-96 rounded-full blur-3xl animate-pulse ${
            isDark ? 'bg-pink-500/20' : 'bg-pink-400/25'
          }`}
        />
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isDark
              ? 'bg-gradient-to-b from-[#040b24]/30 via-[#0d1538]/35 to-[#160728]/50'
              : 'bg-gradient-to-b from-white/30 via-pink-50/25 to-rose-100/35'
          }`}
        />
      </div>

      {/* Top Bar: Up-Left Country Flag + Dark/Light Toggle & Clean ZENTRO Brand (No Card Around Welcome) */}
      <header className="relative z-20 max-w-xl w-full mx-auto px-5 pt-6 pb-1 flex items-center justify-between">
        {/* Up-Left Country Flag Badge + Dark/Light Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl border border-white/25 bg-white/15 dark:bg-slate-800/70 backdrop-blur-md flex items-center justify-center text-2xl shadow-md">
            {currentCountryObj.flag}
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle Dark or Light Mode"
            className="h-11 px-3.5 rounded-2xl border border-pink-400/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-white text-xs font-bold flex items-center gap-2 shadow-md hover:border-pink-500 transition-all cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-pink-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <img
            src={ZENTRO_LOGO_URL}
            alt="Zentro Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-md border border-pink-400/40 bg-white"
          />
          <span className="text-sm font-extrabold tracking-widest uppercase bg-gradient-to-r from-sky-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
            ZENTRO
          </span>
        </div>
      </header>

      {/* Main Centered Container */}
      <main className="relative z-10 flex-1 w-full max-w-xl mx-auto px-4 py-2 flex flex-col justify-center">
        {/* Official Zentro Logo Showcase on Login / Registration Page */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          className="flex flex-col items-center justify-center pt-1"
        >
          <div className="relative group">
            <div className="pointer-events-none absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-sky-400 via-pink-500 to-rose-500 opacity-70 blur-md group-hover:opacity-95 transition-opacity" />
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-1.5 shadow-2xl border border-white/60 overflow-hidden flex items-center justify-center">
              <img
                src={ZENTRO_LOGO_URL}
                alt="Zentro - Connect • Earn • Grow"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </div>
        </motion.div>

        {/* 100% Authentic iOS Cursive "Welcome" Animation — Floating Directly Without Any Surrounding Card */}
        <IosWelcomeCalligraphy isDark={isDark} />

        {/* Sign in / Register Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className={`relative z-20 rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#101626]/95 border-white/10 text-white'
              : 'bg-white/95 border-pink-200 text-slate-900'
          } backdrop-blur-xl`}
        >
          {/* Top Dual Tab Bar: "Sign in" | "Register" (White Rounded Pill for Active Tab) */}
          <div
            className={`grid grid-cols-2 items-center p-2 ${
              isDark ? 'bg-[#171f32]' : 'bg-gradient-to-r from-blue-50 via-pink-50 to-rose-50'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
              }}
              className={`py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-950 shadow-md'
                  : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
              }}
              className={`py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-950 shadow-md'
                  : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form Body */}
          <div className="p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={ZENTRO_LOGO_URL}
                  alt="Zentro"
                  className="w-7 h-7 rounded-lg object-cover bg-white border border-pink-400/30 shadow-sm"
                />
                <h2 className="text-xl font-bold tracking-tight">
                  {mode === 'register' ? 'Register' : 'Sign in'}
                </h2>
              </div>
            </div>

            {(localError || authError) && (
              <div className="p-3.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{localError || authError}</span>
              </div>
            )}

            {mode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* 1. User name ("enter one user name") */}
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#182032] border-white/10 focus-within:border-pink-500/60'
                      : 'bg-slate-50 border-slate-200 focus-within:border-pink-500'
                  }`}
                >
                  <UserPictureIcon />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="enter one user name"
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* 2. Mobile number with Country Flag & Code Selectbox ("Please enter your phone number") */}
                <div
                  className={`flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#182032] border-white/10 focus-within:border-pink-500/60'
                      : 'bg-slate-50 border-slate-200 focus-within:border-pink-500'
                  }`}
                >
                  <PhonePictureIcon />
                  <select
                    aria-label="Country Flag and Code"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className={`text-xs font-mono font-bold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer ${
                      isDark
                        ? 'bg-[#101626] border-white/15 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.dialCode.replace('-CA', '')}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^0-9\- ]/g, ''))}
                    placeholder="Please enter your phone number"
                    className="w-full bg-transparent text-sm font-mono tabular-nums focus:outline-none placeholder:font-sans placeholder:text-slate-400"
                  />
                </div>

                {/* 3. Email Address — Illustrated Blue + Pink + Red Letter / Envelope */}
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#182032] border-white/10 focus-within:border-pink-500/60'
                      : 'bg-slate-50 border-slate-200 focus-within:border-pink-500'
                  }`}
                >
                  <LetterEnvelopePictureIcon />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Please enter your email address"
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* 4. Password ("Please input a password") */}
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#182032] border-white/10 focus-within:border-pink-500/60'
                      : 'bg-slate-50 border-slate-200 focus-within:border-pink-500'
                  }`}
                >
                  <PasswordLockPictureIcon />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Please input a password"
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-pink-400 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* 5. Confirm Password ("Please enter the confirmation password") */}
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#182032] border-white/10 focus-within:border-pink-500/60'
                      : 'bg-slate-50 border-slate-200 focus-within:border-pink-500'
                  }`}
                >
                  <ConfirmLockPictureIcon />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Please enter the confirmation password"
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-pink-400 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* 6. Create Security Password */}
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#182032] border-white/10 focus-within:border-pink-500/60'
                      : 'bg-slate-50 border-slate-200 focus-within:border-pink-500'
                  }`}
                >
                  <SecurityKeyPictureIcon />
                  <input
                    type={showSecPassword ? 'text' : 'password'}
                    required
                    value={securityPassword}
                    onChange={(e) => setSecurityPassword(e.target.value)}
                    placeholder="Create Security Password (Withdrawal PIN)"
                    className="w-full bg-transparent text-sm font-mono focus:outline-none placeholder:font-sans placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecPassword(!showSecPassword)}
                    className="text-slate-400 hover:text-pink-400 cursor-pointer"
                  >
                    {showSecPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* 7. Referral Code / Invitee (Empty unless visited via VIP member ref link) */}
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border ${
                    isRefValid
                      ? isDark
                        ? 'bg-[#182032]/90 border-pink-500/40'
                        : 'bg-pink-50/50 border-pink-300'
                      : isDark
                        ? 'bg-[#182032]/70 border-rose-500/40'
                        : 'bg-rose-50/50 border-rose-300'
                  }`}
                >
                  <InviteePictureIcon />
                  <input
                    type="text"
                    readOnly
                    value={referralCode}
                    placeholder="Invite code empty (Use VIP member ref link)"
                    title="Invite code is only populated via a VIP member's referral link"
                    className="w-full bg-transparent text-sm font-mono font-bold focus:outline-none cursor-not-allowed select-none placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
                  />
                  {isRefValid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white text-[10px] font-mono font-bold shrink-0">
                      <Lock className="w-3 h-3" /> VALID
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-mono font-bold shrink-0">
                      <Lock className="w-3 h-3" /> REQUIRED
                    </span>
                  )}
                </div>

                {/* 8. Tick for Remember Me & 9. Tick for Privacy Policy */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                    />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      Remember me
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={acceptPrivacy}
                        onChange={(e) => setAcceptPrivacy(e.target.checked)}
                        className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                      />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        Agree to Privacy Policy
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-pink-400 hover:underline font-semibold cursor-pointer"
                    >
                      (View)
                    </button>
                  </div>
                </div>

                {/* 10. Full-Width Glowing Gradient "Register" Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 hover:opacity-95 disabled:opacity-50 text-white font-bold text-base tracking-wide shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </form>
            ) : (
              /* SIGN IN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#182032] border-white/10 focus-within:border-pink-500/60'
                      : 'bg-slate-50 border-slate-200 focus-within:border-pink-500'
                  }`}
                >
                  <LetterEnvelopePictureIcon />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enter user name, mobile number or email"
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#182032] border-white/10 focus-within:border-pink-500/60'
                      : 'bg-slate-50 border-slate-200 focus-within:border-pink-500'
                  }`}
                >
                  <PasswordLockPictureIcon />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Please input a password"
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-pink-400 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-pink-500"
                    />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      Remember me
                    </span>
                  </label>
                  {referralCode ? (
                    <span className="font-mono text-pink-400">Invitee: {referralCode}</span>
                  ) : null}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 hover:opacity-95 disabled:opacity-50 text-white font-bold text-base tracking-wide shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </main>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full rounded-3xl border border-pink-500/30 bg-white dark:bg-[#101626] p-6 space-y-4">
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
              Zentro Privacy Policy & Terms
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 max-h-64 overflow-y-auto leading-relaxed">
              <p>
                1. <strong>Zero-Trust Data Isolation:</strong> Your personal contact details,
                mobile number, KYC identity records, and linked bank accounts are stored in
                your encrypted Zentro database profile with strict owner-only access rules.
              </p>
              <p>
                2. <strong>Referral Integrity:</strong> Every Zentro account requires a verified
                referral code (invitee) at registration. Referral codes are permanently bound to
                your account and cannot be modified after registration.
              </p>
              <p>
                3. <strong>Security Password Protection:</strong> Withdrawals, VIP upgrades, and
                bank modifications require your personal Security Password.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAcceptPrivacy(true);
                  setShowPrivacyModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-pink-500 to-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} Zentro Platform
      </footer>
    </div>
  );
};
