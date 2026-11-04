/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Moon,
  Crown,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  ListChecks,
  Headphones,
  Users,
  Copy,
  Check,
  LogOut,
  Wallet,
  TrendingUp,
  Home as HomeIcon,
  User as UserIcon,
  X,
  Send,
  UserPlus,
  Lock,
  Bell,
} from 'lucide-react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  db,
  initAuth,
  googleSignIn,
  logout,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  AppNotification,
  UserProfile,
  TransactionRecord,
  BankAccountRecord,
  KycRecordData,
  ReferralRecordData,
  VIP_TIERS,
  VipTierConfig,
  ZentroPlatformTask,
  PLATFORM_DAILY_TASKS,
  BRONZE_COMMISSION_LEVELS,
  SILVER_COMMISSION_LEVELS,
  GOLD_COMMISSION_LEVELS,
  PLATINUM_COMMISSION_LEVELS,
  getCommissionLevelsForVip,
  getFriendRegistrationBonusForVip,
  isProfileSetupComplete,
  getActiveCurrency,
  getActiveLanguage,
  LANGUAGE_OPTIONS,
  convertFromLkr,
  convertToLkr,
  formatCurrencyValue,
  formatSiteAmount,
  replaceCurrencyInText,
  tr,
  collectDeviceSecurityTelemetry,
  detectIncognitoBrowsing,
  getDeterministicDeviceAndMac,
  getExistingDeviceAccountLock,
  bindDeviceAccountLock,
  syncLocalDeviceLockToServer,
  isAdminCredentials,
  isValidReferralCodeFormat,
  getUserNotifications,
  pushUserNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteUserNotification,
  clearReadUserNotifications,
  getActiveDashboardAnnouncementsForUser,
  dismissDashboardAnnouncementBanner,
  getLocalKycRequestByUser,
  saveLocalKycRequest,
  getHighestVipLevel,
  recordHighestVipLevel,
  ZENTRO_ATRIUM_BG_DATA_URI,
  ZENTRO_ATRIUM_LIGHT_BG_DATA_URI,
} from './types';
import {
  AuthGate,
  PendingRegistrationData,
  PendingLoginData,
} from './components/AuthGate';
import { TaskTab } from './components/TaskTab';
import { MyTab } from './components/MyTab';
import { DepositAreaModal } from './components/DepositAreaModal';
import { WithdrawAreaModal } from './components/WithdrawAreaModal';
import { LiveMiningPanel } from './components/LiveMiningPanel';
import { AdminPanel } from './components/AdminPanel';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { TeamDetailsModal } from './components/TeamDetailsModal';
import { CustomerSupportPage } from './components/CustomerSupportPage';
import {
  SponsorCountriesSection,
  VipCommissionComparisonPoster,
} from './components/SponsorCountriesAndVipPoster';
import { VipBenefitsPoster } from './components/VipBenefitsPoster';

type MainTab = 'home' | 'team' | 'task' | 'vip' | 'my' | 'support';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('zentro_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('zentro_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('zentro_theme', 'light');
    }
  }, [isDark]);

  // Prevent user pinch-to-zoom, double-tap zoom, and Ctrl+wheel zoom across the site
  useEffect(() => {
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };
    const preventMultiTouchZoom = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    const preventKeyZoom = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchmove', preventMultiTouchZoom, { passive: false });
    window.addEventListener('wheel', preventWheelZoom, { passive: false });
    window.addEventListener('keydown', preventKeyZoom);

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchmove', preventMultiTouchZoom);
      window.removeEventListener('wheel', preventWheelZoom);
      window.removeEventListener('keydown', preventKeyZoom);
    };
  }, []);

  // Auth & Firestore states
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (profile?.language) {
      try {
        localStorage.setItem('zentro_active_language_v1', profile.language);
      } catch {
        // ignore
      }
    }
  }, [profile?.language]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [kycRecord, setKycRecord] = useState<KycRecordData | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecordData[]>([]);

  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [myInitialSubTab, setMyInitialSubTab] = useState<
    'profile' | 'kyc' | 'transactions' | 'referrals' | 'bank' | undefined
  >(undefined);
  const [copiedRef, setCopiedRef] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Sync KYC status whenever Admin approves/rejects KYC or local KYC storage updates
  useEffect(() => {
    if (!profile?.uid) return;
    const syncKycStatusFromLocal = () => {
      const localRec = getLocalKycRequestByUser(profile.uid);
      if (localRec) {
        setKycRecord((prev) => ({
          ...prev,
          ...localRec,
        }));
        if (localRec.status && localRec.status !== profile.kycStatus) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  kycStatus: localRec.status,
                }
              : prev
          );
        }
      }
    };
    syncKycStatusFromLocal();
    window.addEventListener('zentro-kyc-updated', syncKycStatusFromLocal);
    return () => {
      window.removeEventListener('zentro-kyc-updated', syncKycStatusFromLocal);
    };
  }, [profile?.uid, profile?.kycStatus]);

  // Modals on Home / VIP / Admin
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('zentro_admin_session_v1') === 'true';
  });
  const [activeModal, setActiveModal] = useState<
    null | 'deposit' | 'withdrawal' | 'active_vip' | 'support' | 'compare_tiers'
  >(null);
  const [depositAmount, setDepositAmount] = useState('1000');
  const [depositSecPass, setDepositSecPass] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawBankId, setWithdrawBankId] = useState('');
  const [withdrawSecPass, setWithdrawSecPass] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [isTeamDetailsModalOpen, setIsTeamDetailsModalOpen] = useState(false);

  // Customer Support Low-Latency AI Chat (gemini-3.1-flash-lite)
  const [supportInput, setSupportInput] = useState('');
  const [supportMessages, setSupportMessages] = useState<
    { sender: 'user' | 'agent'; text: string }[]
  >([
    {
      sender: 'agent',
      text: 'Welcome to Zentro 24/7 Priority Desk. Ask me anything about VIP tiers, deposits, withdrawals, KYC, or Google Tasks synchronization.',
    },
  ]);
  const [supportLoading, setSupportLoading] = useState(false);

  // Team referral quick registration state
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [referralMode, setReferralMode] = useState<'deposit_member' | 'registration_only'>(
    'deposit_member'
  );
  const [newMemberTier, setNewMemberTier] = useState<number>(1);
  const [newMemberVip, setNewMemberVip] = useState<number>(1);
  const [addingReferral, setAddingReferral] = useState(false);

  // Real-time Notification System states
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dashboardAnnouncements, setDashboardAnnouncements] = useState<
    AppNotification[]
  >([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] =
    useState<boolean>(false);
  const [liveToastNotification, setLiveToastNotification] =
    useState<AppNotification | null>(null);
  const [notifAlertsEnabled, setNotifAlertsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('zentro_notif_alerts_enabled');
    return saved ? saved === 'true' : true;
  });

  const showNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4500);
  };

  // Load and sync notifications for the active user
  useEffect(() => {
    if (!profile?.uid) {
      setNotifications([]);
      setDashboardAnnouncements([]);
      return;
    }

    const refreshNotifications = () => {
      const list = getUserNotifications(profile.uid, profile.username);
      setNotifications(list);
      setDashboardAnnouncements(getActiveDashboardAnnouncementsForUser(profile.uid));
    };

    refreshNotifications();

    const handleCustomNotifUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{
        userId?: string;
        notification?: AppNotification;
      }>;
      const detail = customEvt.detail;
      if (
        !detail?.userId ||
        detail.userId === profile.uid ||
        detail.userId === 'ALL'
      ) {
        refreshNotifications();
        if (detail?.notification && notifAlertsEnabled) {
          setLiveToastNotification(detail.notification);
        }
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key.includes('zentro_notifications_v1_') ||
        e.key.includes('zentro_global_broadcasts_v1') ||
        e.key.includes('zentro_accounts_db_v1')
      ) {
        refreshNotifications();
        if (e.key === 'zentro_accounts_db_v1' && !authUser) {
          loadSessionFromStorage(profile.uid);
        }
      }
    };

    window.addEventListener(
      'zentro-notifications-updated',
      handleCustomNotifUpdate as EventListener
    );
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(
        'zentro-notifications-updated',
        handleCustomNotifUpdate as EventListener
      );
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [profile?.uid, profile?.username, notifAlertsEnabled, authUser]);

  useEffect(() => {
    if (!liveToastNotification) return;
    const timer = setTimeout(() => {
      setLiveToastNotification(null);
    }, 5200);
    return () => clearTimeout(timer);
  }, [liveToastNotification]);

  // Enforce mandatory post-registration Profile setup (Country, Currency, Language)
  useEffect(() => {
    if (profile && !isProfileSetupComplete(profile) && activeTab !== 'my') {
      setActiveTab('my');
    }
  }, [profile, activeTab]);

  const handleSelectTab = (targetTab: MainTab) => {
    if (profile && !isProfileSetupComplete(profile) && targetTab !== 'my') {
      setActiveTab('my');
      showNotice(
        tr(
          profile,
          'Please select and save your Country, Currency, and Language in My Profile first to unlock other sections.',
          'අනෙකුත් කොටස් භාවිතා කිරීමට පෙර කරුණාකර Profile වෙත ගොස් Country, Currency සහ Language තෝරා Save කරන්න.'
        )
      );
      return;
    }
    setActiveTab(targetTab);
  };

  // Persistent local database helpers for direct Zentro username/password accounts
  const saveLocalUserRecord = (
    userProfile: UserProfile,
    rawPassword?: string,
    txList?: TransactionRecord[],
    bankList?: BankAccountRecord[],
    kycData?: KycRecordData | null,
    refList?: ReferralRecordData[]
  ) => {
    try {
      const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
      const accounts: Record<
        string,
        {
          profile: UserProfile;
          password: string;
        }
      > = rawAccounts ? JSON.parse(rawAccounts) : {};
      const existingEntry = accounts[userProfile.uid];
      accounts[userProfile.uid] = {
        profile: userProfile,
        password: rawPassword ?? existingEntry?.password ?? 'zentro123',
      };
      localStorage.setItem('zentro_accounts_db_v1', JSON.stringify(accounts));
      if (txList !== undefined) {
        localStorage.setItem(`zentro_tx_${userProfile.uid}`, JSON.stringify(txList));
      }
      if (bankList !== undefined) {
        localStorage.setItem(`zentro_banks_${userProfile.uid}`, JSON.stringify(bankList));
      }
      if (kycData !== undefined) {
        if (kycData) {
          localStorage.setItem(`zentro_kyc_${userProfile.uid}`, JSON.stringify(kycData));
        } else {
          localStorage.removeItem(`zentro_kyc_${userProfile.uid}`);
        }
      }
      if (refList !== undefined) {
        localStorage.setItem(`zentro_refs_${userProfile.uid}`, JSON.stringify(refList));
      }
    } catch (e) {
      console.error('Error saving local account record:', e);
    }
  };

  const loadSessionFromStorage = (uid: string) => {
    try {
      const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
      const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
      const entry = accounts[uid];
      if (!entry) return false;
      setProfile(entry.profile);
      const savedTx = localStorage.getItem(`zentro_tx_${uid}`);
      setTransactions(savedTx ? JSON.parse(savedTx) : []);
      const savedBanks = localStorage.getItem(`zentro_banks_${uid}`);
      setBankAccounts(savedBanks ? JSON.parse(savedBanks) : []);
      const savedKyc = localStorage.getItem(`zentro_kyc_${uid}`);
      setKycRecord(savedKyc ? JSON.parse(savedKyc) : null);
      const savedRefs = localStorage.getItem(`zentro_refs_${uid}`);
      setReferrals(savedRefs ? JSON.parse(savedRefs) : []);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(async (user) => {
      const savedUid = localStorage.getItem('zentro_active_session_uid');
      // Clear any leftover Google Auth session if the user has not signed in via Zentro
      if (user && !savedUid) {
        await logout();
        setAuthUser(null);
        setAuthReady(true);
        return;
      }
      if (savedUid && (!user || user.uid !== savedUid)) {
        if (user) {
          await logout();
        }
        setAuthUser(null);
        loadSessionFromStorage(savedUid);
        setAuthReady(true);
        return;
      }
      setAuthUser(user);
      if (!user && savedUid) {
        loadSessionFromStorage(savedUid);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Automatically sync any existing local account or active profile lock to the server registry
  // so other browsers and Incognito tabs on the same Device / IP / MAC / Location are always blocked
  useEffect(() => {
    collectDeviceSecurityTelemetry()
      .then(async (telemetry) => {
        if (profile?.uid && profile.uid !== 'ADMIN') {
          bindDeviceAccountLock({
            uid: profile.uid,
            username: profile.username,
            email: profile.email,
            deviceId: telemetry.deviceId,
            macAddress: telemetry.macAddress,
            ipAddress: telemetry.ipAddress,
            location: telemetry.location,
            lockedAt: String(profile.createdAt || new Date().toISOString()),
          });
        }
        await syncLocalDeviceLockToServer(telemetry);
      })
      .catch(() => {
        // ignore
      });
  }, [profile?.uid]);

  useEffect(() => {
    if (!authReady || !authUser) {
      return;
    }

    const uid = authUser.uid;
    const userDocRef = doc(db, 'users', uid);

    const safeFirestoreCatch = (
      error: unknown,
      op: OperationType,
      path: string
    ) => {
      try {
        const msg = error instanceof Error ? error.message : String(error);
        if (
          msg.includes('offline') ||
          msg.includes('Could not reach Cloud Firestore') ||
          msg.includes('backend')
        ) {
          console.warn(`Firestore offline fallback for ${path}:`, msg);
          loadSessionFromStorage(uid);
          return;
        }
        handleFirestoreError(error, op, path);
      } catch {
        // Fallback to local session storage if Firestore rules reject a stale token or network fails
        loadSessionFromStorage(uid);
      }
    };

    const unsubUser = onSnapshot(
      userDocRef,
      async (snap) => {
        if (snap.exists()) {
          const remoteProfile = snap.data() as UserProfile;
          const highestVip = recordHighestVipLevel(
            remoteProfile.uid || uid,
            Math.max(remoteProfile.vipLevel || 0, remoteProfile.highestVipLevel || 0)
          );
          setProfile({ ...remoteProfile, highestVipLevel: highestVip });
        } else {
          const generatedRefCode = `ZENTRO-${uid
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 6)
            .toUpperCase()}`;
          const { deviceId, macAddress } = getDeterministicDeviceAndMac();
          const newProfile = {
            uid,
            username:
              authUser.displayName?.trim().slice(0, 40) ||
              authUser.email?.split('@')[0]?.slice(0, 40) ||
              'zentro_member',
            email: authUser.email || 'member@zentro.io',
            countryCode: '🇱🇰 +94',
            mobile: '7700900077',
            country: '',
            currency: '',
            language: '',
            deviceId: deviceId.slice(0, 80),
            macAddress: macAddress.slice(0, 40),
            ipAddress: '127.0.0.1',
            locationTracked: 'Detected via Network',
            securityPasswordHash: '888888',
            referralCode: generatedRefCode,
            referredBy: 'ZENTRO-VIP888',
            vipLevel: 0,
            balance: 25.0,
            totalEarnings: 0,
            tasksCompletedToday: 0,
            kycStatus: 'unverified' as const,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newProfile);
            setActiveTab('my');
          } catch (error) {
            safeFirestoreCatch(error, OperationType.CREATE, `users/${uid}`);
          }
        }
      },
      (error) => {
        safeFirestoreCatch(error, OperationType.GET, `users/${uid}`);
      }
    );

    const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
    const unsubTx = onSnapshot(
      txQuery,
      (snap) => {
        const list: TransactionRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TransactionRecord, 'id'>),
        }));
        setTransactions(list);
      },
      (error) => {
        safeFirestoreCatch(error, OperationType.LIST, 'transactions');
      }
    );

    const bankQuery = query(collection(db, 'bank_accounts'), where('userId', '==', uid));
    const unsubBanks = onSnapshot(
      bankQuery,
      (snap) => {
        const list: BankAccountRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BankAccountRecord, 'id'>),
        }));
        setBankAccounts(list);
      },
      (error) => {
        safeFirestoreCatch(error, OperationType.LIST, 'bank_accounts');
      }
    );

    const kycDocRef = doc(db, 'kyc_records', uid);
    const unsubKyc = onSnapshot(
      kycDocRef,
      (snap) => {
        if (snap.exists()) {
          setKycRecord(snap.data() as KycRecordData);
        } else {
          setKycRecord(null);
        }
      },
      (error) => {
        safeFirestoreCatch(error, OperationType.GET, `kyc_records/${uid}`);
      }
    );

    const refQuery = query(collection(db, 'referrals'), where('referrerUid', '==', uid));
    const unsubRefs = onSnapshot(
      refQuery,
      (snap) => {
        const list: ReferralRecordData[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ReferralRecordData, 'id'>),
        }));
        setReferrals(list);
      },
      (error) => {
        safeFirestoreCatch(error, OperationType.LIST, 'referrals');
      }
    );

    return () => {
      unsubUser();
      unsubTx();
      unsubBanks();
      unsubKyc();
      unsubRefs();
    };
  }, [authReady, authUser]);

  const handleRegisterAccount = async (pendingReg: PendingRegistrationData) => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      const telemetry =
        pendingReg.deviceTelemetry || (await collectDeviceSecurityTelemetry());

      // 0. Block registration in Incognito / Private Browsing tabs
      const isIncognitoNow =
        Boolean(telemetry.isIncognito) || (await detectIncognitoBrowsing());
      if (isIncognitoNow) {
        setAuthError(
          'Incognito / Private browsing tabs cannot be used to create an account. Only 1 account per device, IP, MAC, and location is permitted.'
        );
        return;
      }

      // 1. Check local & cross-browser server device lock (Device ID, MAC Address, IP Address, Location)
      const existingDeviceLock =
        getExistingDeviceAccountLock(telemetry) ||
        (await syncLocalDeviceLockToServer(telemetry));
      if (existingDeviceLock) {
        setAuthError(
          `Only 1 account can be created per device, IP, MAC, and location (Cross-Browser & Incognito Protected). This device (Device: ${telemetry.deviceId}, MAC: ${telemetry.macAddress}, IP: ${telemetry.ipAddress}, Location: ${telemetry.location}) is already registered to "${existingDeviceLock.username}". Please sign in instead.`
        );
        return;
      }

      const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
      const accounts: Record<string, { profile: UserProfile; password: string }> = rawAccounts
        ? JSON.parse(rawAccounts)
        : {};

      // Also check if any existing account in local registry has already been created on this device/MAC/IP
      const existingDeviceAccount = Object.values(accounts).find(
        (acc) =>
          (acc.profile.deviceId && acc.profile.deviceId === telemetry.deviceId) ||
          (acc.profile.macAddress && acc.profile.macAddress === telemetry.macAddress) ||
          (acc.profile.ipAddress &&
            telemetry.ipAddress !== '127.0.0.1' &&
            acc.profile.ipAddress === telemetry.ipAddress) ||
          Object.keys(accounts).length >= 1
      );
      if (existingDeviceAccount) {
        bindDeviceAccountLock({
          uid: existingDeviceAccount.profile.uid,
          username: existingDeviceAccount.profile.username,
          email: existingDeviceAccount.profile.email,
          deviceId: telemetry.deviceId,
          macAddress: telemetry.macAddress,
          ipAddress: telemetry.ipAddress,
          location: telemetry.location,
          lockedAt: String(existingDeviceAccount.profile.createdAt || new Date().toISOString()),
        });
        setAuthError(
          `Only 1 account can be created per device (IP: ${telemetry.ipAddress}, MAC: ${telemetry.macAddress}, Device: ${telemetry.deviceId}, Location: ${telemetry.location}). Existing account: "${existingDeviceAccount.profile.username}". Please sign in.`
        );
        return;
      }

      const duplicate = Object.values(accounts).find(
        (acc) =>
          acc.profile.username.toLowerCase() === pendingReg.username.toLowerCase() ||
          acc.profile.email.toLowerCase() === pendingReg.email.toLowerCase()
      );
      if (duplicate) {
        setAuthError('An account with this user name or email already exists. Please Sign in.');
        return;
      }

      if (
        !pendingReg.referralCode ||
        !pendingReg.referralCode.trim() ||
        !isValidReferralCodeFormat(pendingReg.referralCode)
      ) {
        setAuthError(
          'An Invite Code is required to register. Please open the registration link shared by an active VIP member.'
        );
        return;
      }

      // Verify if the referral code belongs to a registered member; if so, they MUST be a VIP member (vipLevel >= 1)
      const referrerAccount = Object.values(accounts).find(
        (acc) =>
          acc.profile.referralCode.toUpperCase() ===
          pendingReg.referralCode.trim().toUpperCase()
      );
      if (referrerAccount && referrerAccount.profile.vipLevel < 1) {
        setAuthError(
          'Only active VIP members (Zentro Bronze, Silver, Gold, or Platinum) can share referral links and refer new members.'
        );
        return;
      }

      const cleanId = `usr_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;

      // 2. Register and verify single-device lock on server (IP, MAC, Device ID, Location, Hardware Summary)
      try {
        const lockRes = await fetch('/api/security/register-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: telemetry.deviceId,
            macAddress: telemetry.macAddress,
            ipAddress: telemetry.ipAddress,
            locationTracked: telemetry.location,
            hardwareSummary: telemetry.hardwareSummary,
            uid: cleanId,
            username: pendingReg.username.slice(0, 60),
            email: pendingReg.email.slice(0, 120),
          }),
        });
        if (lockRes.status === 409) {
          const lockData = await lockRes.json();
          if (lockData?.entry) {
            bindDeviceAccountLock({
              uid: lockData.entry.uid,
              username: lockData.entry.username,
              email: lockData.entry.email || '',
              deviceId: lockData.entry.deviceId || telemetry.deviceId,
              macAddress: lockData.entry.macAddress || telemetry.macAddress,
              ipAddress: lockData.entry.ipAddress || telemetry.ipAddress,
              location: lockData.entry.location || telemetry.location,
              lockedAt: lockData.entry.registeredAt || new Date().toISOString(),
            });
          }
          setAuthError(
            lockData?.error ||
              `Only 1 account can be created per device. Existing account: "${lockData?.existingAccount?.username || 'Registered Member'}".`
          );
          return;
        }
      } catch {
        // Server lock fallback handled by local device lock
      }

      const generatedRefCode = `ZENTRO-${cleanId
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(-6)
        .toUpperCase()}`;

      const newProfile: UserProfile = {
        uid: cleanId,
        username: pendingReg.username.slice(0, 60),
        email: pendingReg.email.slice(0, 120),
        countryCode: pendingReg.countryCode.slice(0, 16),
        mobile: pendingReg.mobile.slice(0, 30),
        country: '',
        currency: '',
        language: '',
        deviceId: telemetry.deviceId.slice(0, 80),
        macAddress: telemetry.macAddress.slice(0, 40),
        ipAddress: telemetry.ipAddress.slice(0, 64),
        locationTracked: telemetry.location.slice(0, 120),
        securityPasswordHash: pendingReg.securityPassword.slice(0, 128),
        referralCode: generatedRefCode,
        referredBy: pendingReg.referralCode.slice(0, 32),
        vipLevel: 0,
        balance: 100.0,
        totalEarnings: 0,
        tasksCompletedToday: 0,
        kycStatus: 'unverified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const welcomeTx: TransactionRecord = {
        id: `tx_${Date.now()}`,
        userId: cleanId,
        type: 'referral_bonus',
        amount: 100.0,
        status: 'completed',
        description: `Welcome Invitee Bonus (${pendingReg.referralCode})`,
        createdAt: new Date().toISOString(),
      };

      // If referred by an active VIP member (vipLevel >= 1), credit 10 LKR (Bronze), 30 LKR (Silver), 50 LKR (Gold), or 100 LKR (Platinum)
      if (referrerAccount && referrerAccount.profile.vipLevel >= 1) {
        const refRecord = accounts[referrerAccount.profile.uid] as any;
        if (refRecord && refRecord.profile) {
          const friendRegBonus = getFriendRegistrationBonusForVip(refRecord.profile.vipLevel);
          const updatedRefProfile: UserProfile = {
            ...refRecord.profile,
            balance: Number((refRecord.profile.balance + friendRegBonus).toFixed(2)),
            totalEarnings: Number((refRecord.profile.totalEarnings + friendRegBonus).toFixed(2)),
            updatedAt: new Date().toISOString(),
          };
          const friendRefEntry: ReferralRecordData = {
            id: `ref_${Date.now()}_reg`,
            referrerUid: refRecord.profile.uid,
            referredUsername: pendingReg.username.slice(0, 60),
            referralCodeUsed: refRecord.profile.referralCode,
            tierLevel: 1,
            vipLevel: 0,
            commissionEarned: friendRegBonus,
            createdAt: new Date().toISOString(),
          };
          const friendBonusTx: TransactionRecord = {
            id: `tx_${Date.now()}_reg`,
            userId: refRecord.profile.uid,
            type: 'referral_bonus',
            amount: friendRegBonus,
            status: 'completed',
            description: `1 Friend Registration Bonus (+${friendRegBonus} LKR — ${pendingReg.username.slice(0, 40)})`,
            createdAt: new Date().toISOString(),
          };
          saveLocalUserRecord(
            updatedRefProfile,
            refRecord.password,
            [friendBonusTx, ...(refRecord.transactions || [])],
            refRecord.bankAccounts,
            refRecord.kycRecord,
            [friendRefEntry, ...(refRecord.referrals || [])]
          );
          pushUserNotification(refRecord.profile.uid, {
            title: `New Friend Registered: +${friendRegBonus} LKR Bonus!`,
            titleSi: `නව මිතුරෙකු ලියාපදිංචි විය: +${friendRegBonus} LKR ප්‍රසාද දීමනාව!`,
            message: `${pendingReg.username.slice(0, 40)} registered using your referral code (${refRecord.profile.referralCode}). +${friendRegBonus} LKR has been credited to your wallet.`,
            messageSi: `${pendingReg.username.slice(0, 40)} ඔබගේ යොමු කේතය භාවිතා කර ලියාපදිංචි විය. +${friendRegBonus} LKR ඔබගේ ගිණුමට එක් කරන ලදී.`,
            category: 'referral',
            priority: 'high',
            actionTab: 'team',
            actionLabel: 'View Team',
            actionLabelSi: 'කණ්ඩායම බලන්න',
          });
        }
      }

      bindDeviceAccountLock({
        uid: cleanId,
        username: newProfile.username,
        email: newProfile.email,
        deviceId: telemetry.deviceId,
        macAddress: telemetry.macAddress,
        ipAddress: telemetry.ipAddress,
        location: telemetry.location,
        lockedAt: new Date().toISOString(),
      });
      saveLocalUserRecord(newProfile, pendingReg.password, [welcomeTx], [], null, []);
      localStorage.setItem('zentro_active_session_uid', cleanId);
      setProfile(newProfile);
      setTransactions([welcomeTx]);
      setBankAccounts([]);
      setKycRecord(null);
      setReferrals([]);
      setActiveTab('my');
      pushUserNotification(cleanId, {
        title: `Welcome to Zentro, ${newProfile.username}! (+100 LKR Bonus)`,
        titleSi: `Zentro වෙත සාදරයෙන් පිළිගනිමු, ${newProfile.username}! (+100 LKR දීමනාව)`,
        message:
          'Your +100 LKR Welcome Invitee Bonus is credited. Please select and save your Country, Currency, and Language in My Profile to unlock all tabs.',
        messageSi:
          'ඔබගේ +100 LKR පිළිගැනීමේ දීමනාව ගිණුමට බැර විය. සියලුම අංශ විවෘත කිරීමට කරුණාකර Country, Currency සහ Language තෝරා Save කරන්න.',
        category: 'system',
        priority: 'high',
        actionTab: 'my',
        actionLabel: 'Complete Profile Setup',
        actionLabelSi: 'Profile සම්පූර්ණ කරන්න',
      });
      showNotice(
        'Registration complete! Please select and save your Country, Currency, and Language in My Profile first to unlock the platform.'
      );
    } catch (err: any) {
      setAuthError(err?.message || 'Registration failed.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLoginAccount = async (loginData: PendingLoginData) => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      // 1. Check if Admin Login credentials (0711452778 / viduth)
      if (isAdminCredentials(loginData.identifier, loginData.password)) {
        localStorage.setItem('zentro_admin_session_v1', 'true');
        setIsAdminLoggedIn(true);
        return;
      }

      const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
      const accounts: Record<string, { profile: UserProfile; password: string }> = rawAccounts
        ? JSON.parse(rawAccounts)
        : {};

      const queryStr = loginData.identifier.trim().toLowerCase();
      const queryDigits = queryStr.replace(/[^0-9]/g, '');
      const matched = Object.values(accounts).find((acc) => {
        const uMobileDigits = (acc.profile.mobile || '').replace(/[^0-9]/g, '');
        return (
          acc.profile.username.toLowerCase() === queryStr ||
          acc.profile.email.toLowerCase() === queryStr ||
          (queryDigits.length >= 6 &&
            (uMobileDigits === queryDigits ||
              uMobileDigits.endsWith(queryDigits.slice(-9))))
        );
      });

      if (!matched) {
        setAuthError('Account not found. Please register your Zentro account first.');
        return;
      }

      if (matched.password !== loginData.password) {
        setAuthError('Incorrect password. Please check your password and try again.');
        return;
      }

      localStorage.setItem('zentro_active_session_uid', matched.profile.uid);
      loadSessionFromStorage(matched.profile.uid);
      if (!isProfileSetupComplete(matched.profile)) {
        setActiveTab('my');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Sign in failed.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignOutAll = async () => {
    localStorage.removeItem('zentro_active_session_uid');
    setProfile(null);
    setTransactions([]);
    setBankAccounts([]);
    setKycRecord(null);
    setReferrals([]);
    if (authUser) {
      await logout();
    }
  };

  const handleSubmitDepositRequest = async (payload: {
    amountInLkr: number;
    amountInCurrency: number;
    activeCurrency: string;
    depositType: 'bank' | 'usdt';
    country: string;
    selectedBankName: string;
    receivingAccountNumber: string;
    receivingAccountHolder: string;
    receivingBranchOrNetwork: string;
    selectedVipLabel: string;
    selectedVipLevel: number | null;
    depositorName: string;
    slipFileName: string;
    slipDataUrl: string;
    referenceCode: string;
  }) => {
    if (!profile) return;
    if (!isProfileSetupComplete(profile)) {
      setActiveModal(null);
      setActiveTab('my');
      showNotice('Please select and save your Country, Currency, and Language in My Profile first.');
      return;
    }

    const amtInLkr = Number(payload.amountInLkr.toFixed(2));
    const desc = `Deposit (${payload.depositType.toUpperCase()}: ${payload.selectedBankName}, ${payload.country}) · Name: ${payload.depositorName} · Ref: ${payload.referenceCode} [Wait Admin Approve]`.slice(
      0,
      195
    );

    try {
      if (authUser) {
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          type: 'deposit',
          amount: amtInLkr,
          status: 'pending',
          description: desc,
          createdAt: serverTimestamp(),
        });
      } else {
        const newTx: TransactionRecord = {
          id: `tx_${Date.now()}`,
          userId: profile.uid,
          type: 'deposit',
          amount: amtInLkr,
          status: 'pending',
          description: desc,
          createdAt: new Date().toISOString(),
        };
        const nextTx = [newTx, ...transactions];
        setTransactions(nextTx);
        saveLocalUserRecord(profile, undefined, nextTx);
      }
      pushUserNotification(profile.uid, {
        title: `Deposit Request Submitted (${payload.referenceCode})`,
        titleSi: `තැන්පතු ඉල්ලීම යොමු කරන ලදී (${payload.referenceCode})`,
        message: `Your deposit of ${amtInLkr} LKR via ${payload.selectedBankName} has been submitted with slip. Status: Waiting Admin Approval.`,
        messageSi: `ඔබගේ ${amtInLkr} LKR තැන්පතු ඉල්ලීම (${payload.selectedBankName}) රිසිට්පත සමඟ යොමු කරන ලදී. පරිපාලක අනුමැතිය අපේක්ෂාවෙන් පවතී.`,
        category: 'transaction',
        priority: 'high',
        actionTab: 'my',
        actionLabel: 'Track Status',
        actionLabelSi: 'තත්ත්වය පරීක්ෂා කරන්න',
      });
      showNotice(
        `Deposit request (${formatSiteAmount(amtInLkr, payload.activeCurrency)}) submitted with slip — Waiting for Admin Approval.`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  const handleBindBankOrWalletAccount = async (data: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    routingOrSwift: string;
    securityPassword: string;
  }) => {
    if (!profile) return;
    if (data.securityPassword !== profile.securityPasswordHash) {
      throw new Error('Invalid Security Password.');
    }
    try {
      if (authUser) {
        await addDoc(collection(db, 'bank_accounts'), {
          userId: profile.uid,
          bankName: data.bankName.slice(0, 80),
          accountHolder: data.accountHolder.slice(0, 80),
          accountNumber: data.accountNumber.slice(0, 64),
          routingOrSwift: data.routingOrSwift.slice(0, 40),
          createdAt: serverTimestamp(),
        });
      } else {
        const newBank: BankAccountRecord = {
          id: `bank_${Date.now()}`,
          userId: profile.uid,
          bankName: data.bankName.slice(0, 80),
          accountHolder: data.accountHolder.slice(0, 80),
          accountNumber: data.accountNumber.slice(0, 64),
          routingOrSwift: data.routingOrSwift.slice(0, 40),
          createdAt: new Date().toISOString(),
        };
        const nextBanks = [newBank, ...bankAccounts];
        setBankAccounts(nextBanks);
        saveLocalUserRecord(profile, undefined, undefined, nextBanks);
      }
      pushUserNotification(profile.uid, {
        title: `Payout Account Bound: ${data.bankName.slice(0, 40)}`,
        titleSi: `මුදල් ආපසු ගැනීමේ ගිණුම සම්බන්ධ කරන ලදී: ${data.bankName.slice(0, 40)}`,
        message: `Account ${data.accountNumber.slice(0, 32)} (${data.accountHolder.slice(0, 40)}) is now bound for withdrawals.`,
        messageSi: `${data.accountNumber.slice(0, 32)} ගිණුම මුදල් ආපසු ගැනීම් සඳහා සාර්ථකව සම්බන්ධ කරන ලදී.`,
        category: 'security',
        priority: 'normal',
        actionModal: 'withdrawal',
        actionLabel: 'Open Withdraw Area',
        actionLabelSi: 'මුදල් ආපසු ගැනීමේ අංශය',
      });
      showNotice('Withdrawal Bank / USDT (BEP-20) account bound!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bank_accounts');
    }
  };

  const handleSubmitWithdrawalRequest = async (payload: {
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
    referenceCode: string;
  }) => {
    if (!profile) return;
    if (!isProfileSetupComplete(profile)) {
      setActiveModal(null);
      setActiveTab('my');
      showNotice('Please select and save your Country, Currency, and Language in My Profile first.');
      return;
    }

    const localKyc = getLocalKycRequestByUser(profile.uid);
    const isKycVerified =
      profile.kycStatus === 'verified' ||
      kycRecord?.status === 'verified' ||
      localKyc?.status === 'verified';

    if (!isKycVerified) {
      throw new Error(
        tr(
          profile,
          'Withdrawal Locked: Unverified users cannot make withdrawals. Please upload your ID document in the My -> KYC tab and wait for Admin verification.',
          'මුදල් ආපසු ගැනීම අගුළු දමා ඇත: KYC තහවුරු නොකළ පරිශීලකයින්ට මුදල් ආපසු ගත නොහැක. කරුණාකර My -> KYC වෙත ගොස් ඔබගේ හැඳුනුම්පත යොමු කර Admin අනුමැතිය ලබාගන්න.'
        )
      );
    }

    if (profile.mustUpgradeNextVip) {
      const nextVip =
        VIP_TIERS.find((v) => v.level === Math.min(4, profile.vipLevel + 1)) || VIP_TIERS[4];
      throw new Error(
        `Withdrawal Locked: You must upgrade to the next VIP level (${nextVip.name}) while not mining before withdrawing.`
      );
    }

    const amtInLkr = Number(payload.amountInLkr.toFixed(2));
    if (amtInLkr > profile.balance + 0.05) {
      throw new Error('Insufficient withdrawal balance.');
    }

    const nextBalance = Math.max(0, Number((profile.balance - amtInLkr).toFixed(2)));
    const desc =
      payload.withdrawType === 'bank'
        ? `Bank Withdrawal: ${payload.amountInDisplayUnit} LKR (Fee: 25 LKR · Net: ${payload.netAmountInDisplayUnit} LKR) to ${payload.networkOrBankName} (${payload.accountNumberOrAddress}) · Ref: ${payload.referenceCode} [Pending Admin Approve]`.slice(
            0,
            195
          )
        : `USDT (BEP-20) Withdrawal: ${payload.amountInDisplayUnit} USDT (Fee: 0.5 USDT · Net: ${payload.netAmountInDisplayUnit} USDT) to ${payload.accountNumberOrAddress} · Ref: ${payload.referenceCode} [Pending Admin Approve]`.slice(
            0,
            195
          );

    try {
      if (authUser) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          balance: nextBalance,
          updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          type: 'withdrawal',
          amount: amtInLkr,
          status: 'pending',
          description: desc,
          createdAt: serverTimestamp(),
        });
      } else {
        const updatedProfile = {
          ...profile,
          balance: nextBalance,
          updatedAt: new Date().toISOString(),
        };
        const newTx: TransactionRecord = {
          id: `tx_${Date.now()}`,
          userId: profile.uid,
          type: 'withdrawal',
          amount: amtInLkr,
          status: 'pending',
          description: desc,
          createdAt: new Date().toISOString(),
        };
        const nextTx = [newTx, ...transactions];
        setProfile(updatedProfile);
        setTransactions(nextTx);
        saveLocalUserRecord(updatedProfile, undefined, nextTx);
      }
      pushUserNotification(profile.uid, {
        title: `Withdrawal Submitted: ${payload.amountInDisplayUnit} ${payload.displayUnit}`,
        titleSi: `මුදල් ආපසු ගැනීමේ ඉල්ලීම යොමු විය: ${payload.amountInDisplayUnit} ${payload.displayUnit}`,
        message: `Net payout: ${payload.netAmountInDisplayUnit} ${payload.displayUnit} (Fee: ${payload.feeInDisplayUnit} ${payload.displayUnit}) to ${payload.networkOrBankName} · Ref: ${payload.referenceCode} [Pending Admin Approval].`,
        messageSi: `ශුද්ධ ගෙවීම: ${payload.netAmountInDisplayUnit} ${payload.displayUnit} (${payload.networkOrBankName}) · Ref: ${payload.referenceCode} [පරිපාලක අනුමැතිය අපේක්ෂාවෙන්].`,
        category: 'transaction',
        priority: 'high',
        actionTab: 'my',
        actionLabel: 'View Withdrawal Status',
        actionLabelSi: 'තත්ත්වය බලන්න',
      });
      showNotice(
        `Withdrawal request (${payload.amountInDisplayUnit} ${payload.displayUnit}, Fee: ${payload.feeInDisplayUnit} ${payload.displayUnit}) submitted — Pending Admin Approval.`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  const handleUpgradeVip = async (tier: VipTierConfig) => {
    if (!profile) return;
    if (!isProfileSetupComplete(profile)) {
      setActiveTab('my');
      showNotice('Please select and save your Country, Currency, and Language in My Profile first.');
      return;
    }
    const curr = getActiveCurrency(profile);
    if (tier.level === profile.vipLevel) {
      showNotice(
        tr(
          profile,
          `${tier.name} is already your currently active VIP package.`,
          `ඔබ දැනටමත් ${tier.name} පැකේජයේ සක්‍රියව සිටියි.`
        )
      );
      return;
    }
    if (profile.balance < tier.unlockAmount) {
      setDepositAmount(String(convertFromLkr(tier.unlockAmount, curr)));
      setActiveModal('deposit');
      setModalError(
        `Activating ${tier.name} requires ${formatSiteAmount(tier.unlockAmount, curr)}. Please deposit funds first.`
      );
      return;
    }

    try {
      const nextBalance = Number((profile.balance - tier.unlockAmount).toFixed(2));
      const previousHighestVip = getHighestVipLevel(profile);
      const nextHighestVip = recordHighestVipLevel(
        profile.uid,
        Math.max(previousHighestVip, tier.level)
      );
      const highestTierObj = VIP_TIERS[nextHighestVip] || tier;
      const isDowngradeForTasks = tier.level < nextHighestVip;

      if (authUser) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          balance: nextBalance,
          vipLevel: tier.level,
          updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          type: 'vip_upgrade',
          amount: tier.unlockAmount,
          status: 'completed',
          description: `Activated ${tier.name} Membership (${tier.unlockAmount} LKR)`,
          createdAt: serverTimestamp(),
        });
      }

      const updatedProfile: UserProfile = {
        ...profile,
        balance: nextBalance,
        vipLevel: tier.level,
        highestVipLevel: nextHighestVip,
        mustUpgradeNextVip: false,
        updatedAt: new Date().toISOString(),
      };
      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}`,
        userId: profile.uid,
        type: 'vip_upgrade',
        amount: tier.unlockAmount,
        status: 'completed',
        description: `Activated ${tier.name} Membership (${tier.unlockAmount} LKR)`,
        createdAt: new Date().toISOString(),
      };
      const nextTx = [newTx, ...transactions];
      setProfile(updatedProfile);
      if (!authUser) {
        setTransactions(nextTx);
      }
      saveLocalUserRecord(updatedProfile, undefined, nextTx);

      pushUserNotification(profile.uid, {
        title: `VIP Activated: ${tier.name} (VIP ${tier.level})!`,
        titleSi: `${tier.name} (VIP ${tier.level}) සාර්ථකව සක්‍රිය කරන ලදී!`,
        message: isDowngradeForTasks
          ? `Tasks switched to ${tier.name} (VIP ${tier.level}), while Live Mining continues at your highest tier ${highestTierObj.name} (+${highestTierObj.dailyMiningRatePercent}%/day)!`
          : `You now earn ${tier.dailyMiningRatePercent}% Daily Live Currency Mining Yield, ${tier.dailyTasks} daily tasks, and L1–L5 team deposit commissions!`,
        messageSi: isDowngradeForTasks
          ? `ඔබගේ Tasks දැන් ${tier.name} (VIP ${tier.level}) මට්ටමට මාරු වූ අතර, Live Mining පමණක් ඉහළම VIP පැකේජය වන ${highestTierObj.name} (+${highestTierObj.dailyMiningRatePercent}%/දිනකට) අනුව ක්‍රියාත්මක වේ!`
          : `ඔබට දැන් දිනකට ${tier.dailyMiningRatePercent}% සජීවී පතල් කැණීමේ ප්‍රතිලාභ, දෛනික කාර්යයන් ${tier.dailyTasks} ක් සහ මට්ටම් 5 කොමිස් හිමිවේ!`,
        category: 'vip',
        priority: 'high',
        actionTab: 'vip',
        actionLabel: 'Start Live Mining',
        actionLabelSi: 'සජීවී පතල් කැණීම අරඹන්න',
      });
      showNotice(
        isDowngradeForTasks
          ? tr(
              profile,
              `Activated ${tier.name}! Live Mining stays on ${highestTierObj.name} (VIP ${nextHighestVip}), and all Tasks are now set to ${tier.name} (VIP ${tier.level}).`,
              `${tier.name} සක්‍රිය කරන ලදී! Live Mining පමණක් ඉහළම ${highestTierObj.name} (VIP ${nextHighestVip}) පැකේජයට අදාලව සිදුවන අතර අනෙක් සියලුම Tasks ${tier.name} (VIP ${tier.level}) මට්ටමට පත්විය.`
            )
          : `Congratulations! You have activated ${tier.name} (${formatSiteAmount(tier.unlockAmount, curr)}).`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const [, setAdminCatalogTick] = useState(0);
  useEffect(() => {
    const handleCatalogUpdate = () => setAdminCatalogTick((v) => v + 1);
    window.addEventListener('zentro-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('zentro-catalog-updated', handleCatalogUpdate);
  }, []);

  const handleCompletePlatformTask = async (task: ZentroPlatformTask) => {
    if (!profile) return;
    if (!isProfileSetupComplete(profile)) {
      setActiveTab('my');
      showNotice('Please select and save your Country, Currency, and Language in My Profile first.');
      return;
    }
    const curr = getActiveCurrency(profile);
    const currentVip =
      VIP_TIERS.find((v) => v.level === profile.vipLevel) || VIP_TIERS[0];
    const reqVip =
      VIP_TIERS.find((v) => v.level === task.minVipLevel) || VIP_TIERS[0];

    // 1. Enforce strict VIP-tier task matching:
    // Bronze tasks can ONLY be completed by Bronze users, Silver ONLY by Silver, Gold ONLY by Gold, Platinum ONLY by Platinum.
    if (profile.vipLevel < task.minVipLevel) {
      setActiveTab('vip');
      showNotice(
        `Only ${reqVip.name} (VIP ${task.minVipLevel}) users can complete ${reqVip.name} tasks. Please activate ${reqVip.name} first.`
      );
      return;
    }

    if (task.minVipLevel !== profile.vipLevel) {
      showNotice(
        `Only ${reqVip.name} (VIP ${task.minVipLevel}) users can complete ${reqVip.name} tasks. Your active package is ${currentVip.name} (VIP ${profile.vipLevel}).`
      );
      return;
    }

    const isTeamMilestone =
      task.taskType === 'team_milestone' || Boolean(task.targetDepositMembers);
    const depositTeamCount = referrals.filter((r) => r.vipLevel >= 1).length;
    const todayKey = new Date().toISOString().slice(0, 10);
    const currentTasksDoneToday =
      profile.lastTaskCompletionDate === todayKey ? profile.tasksCompletedToday : 0;

    const depositClaimsKey = `zentro_claimed_deposit_members_v1_${profile.uid}`;
    let claimedDepositMap: Record<number, number> = {};
    try {
      const savedMap = localStorage.getItem(depositClaimsKey);
      if (savedMap) {
        claimedDepositMap = JSON.parse(savedMap) || {};
      }
    } catch {
      claimedDepositMap = {};
    }

    const targetCount = task.targetDepositMembers || 5;
    const alreadyClaimedDepositMembers = claimedDepositMap[task.minVipLevel] || 0;
    const unclaimedDepositMembers = Math.max(0, depositTeamCount - alreadyClaimedDepositMembers);

    if (isTeamMilestone) {
      if (unclaimedDepositMembers < targetCount) {
        showNotice(
          tr(
            profile,
            `Team Task Incomplete: You need ${targetCount} Deposit Members in this cycle (${unclaimedDepositMembers}/${targetCount} completed).`,
            `කණ්ඩායම් කාර්යය සම්පූර්ණ නැත: මෙම වටය සඳහා තැන්පතු සාමාජිකයින් ${targetCount} දෙනෙකු අවශ්‍ය වේ (${unclaimedDepositMembers}/${targetCount}).`
          )
        );
        return;
      }
    }

    setCompletingTaskId(task.id);
    try {
      const reward =
        isTeamMilestone || task.reward > 0 ? task.reward : currentVip.rewardPerTask;
      const nextBalance = Number((profile.balance + reward).toFixed(2));
      const nextEarnings = Number((profile.totalEarnings + reward).toFixed(2));

      // Auto-renew cycle: when daily quota is reached, it wraps around cleanly for the next renewed cycle
      const rawNextTasks = isTeamMilestone ? currentTasksDoneToday : currentTasksDoneToday + 1;
      const nextTasks =
        !isTeamMilestone && rawNextTasks >= currentVip.dailyTasks ? 0 : rawNextTasks;

      // Empty completedTaskIdsToday & claimedTeamTaskTiers so claimed tasks auto-renew immediately
      const nextCompletedIds: string[] = [];
      const nextClaimedTeamTiers: number[] = [];

      if (isTeamMilestone) {
        const nextClaimedForTier = alreadyClaimedDepositMembers + targetCount;
        const nextMap = {
          ...claimedDepositMap,
          [task.minVipLevel]: nextClaimedForTier,
        };
        try {
          localStorage.setItem(depositClaimsKey, JSON.stringify(nextMap));
          window.dispatchEvent(new Event('zentro-deposit-task-renewed'));
        } catch {
          // ignore
        }
      }

      if (authUser) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          balance: nextBalance,
          totalEarnings: nextEarnings,
          tasksCompletedToday: nextTasks,
          completedTaskIdsToday: nextCompletedIds,
          lastTaskCompletionDate: todayKey,
          claimedTeamTaskTiers: nextClaimedTeamTiers,
          updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          type: 'task_reward',
          amount: reward,
          status: 'completed',
          description: `VIP ${profile.vipLevel} Task Claimed & Auto-Renewed: ${task.title}`.slice(
            0,
            190
          ),
          createdAt: serverTimestamp(),
        });
      } else {
        const updatedProfile: UserProfile = {
          ...profile,
          balance: nextBalance,
          totalEarnings: nextEarnings,
          tasksCompletedToday: nextTasks,
          completedTaskIdsToday: nextCompletedIds,
          lastTaskCompletionDate: todayKey,
          claimedTeamTaskTiers: nextClaimedTeamTiers,
          updatedAt: new Date().toISOString(),
        };
        const newTx: TransactionRecord = {
          id: `tx_${Date.now()}`,
          userId: profile.uid,
          type: 'task_reward',
          amount: reward,
          status: 'completed',
          description: `VIP ${profile.vipLevel} Task Claimed & Auto-Renewed: ${task.title}`.slice(
            0,
            190
          ),
          createdAt: new Date().toISOString(),
        };
        const nextTx = [newTx, ...transactions];
        setProfile(updatedProfile);
        setTransactions(nextTx);
        saveLocalUserRecord(updatedProfile, undefined, nextTx);
      }
      pushUserNotification(profile.uid, {
        title: `${currentVip.name} Task Claimed: +${reward} LKR (Auto-Renewed ↻)`,
        titleSi: `${currentVip.name} කාර්ය ප්‍රතිලාභය: +${reward} LKR (ස්වයංක්‍රීයව අලුත් විය ↻)`,
        message: isTeamMilestone
          ? `Claimed "${task.title}" reward! +${reward} LKR credited to your balance and task auto-renewed for the next 5 members.`
          : `Claimed "${task.title}"! +${reward} LKR added to your wallet balance and task auto-renewed for the next round.`,
        messageSi: isTeamMilestone
          ? `"${task.title}" කණ්ඩායම් කාර්ය ප්‍රතිලාභය +${reward} LKR ඔබගේ ශේෂයට එක් විය. Task එක මීළඟ වටය සඳහා ස්වයංක්‍රීයව අලුත් විය (Auto-Renewed).`
          : `"${task.title}" සම්පූර්ණ කර +${reward} LKR ඔබගේ ශේෂයට එක් විය. Task එක ස්වයංක්‍රීයව අලුත් විය (Auto-Renewed).`,
        category: 'task',
        priority: 'normal',
        actionTab: 'task',
        actionLabel: 'View VIP Tasks',
        actionLabelSi: 'VIP කාර්යයන් බලන්න',
      });
      showNotice(
        tr(
          profile,
          `🎉 +${formatSiteAmount(reward, curr)} added to your balance! Task automatically renewed ↻`,
          `🎉 +${formatSiteAmount(reward, curr)} ඔබගේ ශේෂයට එකතු විය! Task එක ස්වයංක්‍රීයව අලුත් විය (Auto-Renewed ↻)`
        )
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleClaimMiningReward = async (amountInLkr: number, description: string) => {
    if (!profile) return;
    if (!isProfileSetupComplete(profile)) {
      setActiveTab('my');
      showNotice('Please select and save your Country, Currency, and Language in My Profile first.');
      return;
    }
    if (profile.mustUpgradeNextVip) {
      const nextVip =
        VIP_TIERS.find((v) => v.level === Math.min(4, profile.vipLevel + 1)) || VIP_TIERS[4];
      setActiveTab('vip');
      showNotice(
        `Mining Locked: You must upgrade to the next VIP level (${nextVip.name}) to resume Live Mining and Withdrawals.`
      );
      return;
    }
    const curr = getActiveCurrency(profile);
    const cleanReward = Number(amountInLkr.toFixed(2));
    if (cleanReward <= 0) return;

    try {
      const nextBalance = Number((profile.balance + cleanReward).toFixed(2));
      const nextEarnings = Number((profile.totalEarnings + cleanReward).toFixed(2));

      if (authUser) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          balance: nextBalance,
          totalEarnings: nextEarnings,
          updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          type: 'task_reward',
          amount: cleanReward,
          status: 'completed',
          description: description.slice(0, 190),
          createdAt: serverTimestamp(),
        });
      } else {
        const updatedProfile = {
          ...profile,
          balance: nextBalance,
          totalEarnings: nextEarnings,
          updatedAt: new Date().toISOString(),
        };
        const newTx: TransactionRecord = {
          id: `tx_${Date.now()}`,
          userId: profile.uid,
          type: 'task_reward',
          amount: cleanReward,
          status: 'completed',
          description: description.slice(0, 190),
          createdAt: new Date().toISOString(),
        };
        const nextTx = [newTx, ...transactions];
        setProfile(updatedProfile);
        setTransactions(nextTx);
        saveLocalUserRecord(updatedProfile, undefined, nextTx);
      }
      pushUserNotification(profile.uid, {
        title: `Live Mining Yield Claimed: +${cleanReward} LKR`,
        titleSi: `සජීවී පතල් කැණීමේ ප්‍රතිලාභය: +${cleanReward} LKR`,
        message: `${description} — +${cleanReward} LKR has been credited to your wallet balance.`,
        messageSi: `${description} — +${cleanReward} LKR ඔබගේ ගිණුම් ශේෂයට එක් කරන ලදී.`,
        category: 'mining',
        priority: 'normal',
        actionTab: 'vip',
        actionLabel: 'Open Mining Rig',
        actionLabelSi: 'පතල් කැණීම් අංශය',
      });
      showNotice(
        `Live ${curr} Mining Yield Claimed! +${formatSiteAmount(cleanReward, curr)} added to your wallet.`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  const handleUpdateBalance = async (
    amountDelta: number,
    description: string,
    txType: 'task_reward' | 'deposit' | 'withdrawal' | 'vip_upgrade' = 'task_reward'
  ): Promise<boolean> => {
    if (!profile) return false;
    const cleanDelta = Number(amountDelta.toFixed(2));
    const nextBalance = Number((profile.balance + cleanDelta).toFixed(2));
    if (nextBalance < 0) {
      showNotice('Insufficient balance to perform this operation.');
      return false;
    }
    const nextEarnings =
      cleanDelta > 0
        ? Number((profile.totalEarnings + cleanDelta).toFixed(2))
        : profile.totalEarnings;

    try {
      if (authUser) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          balance: nextBalance,
          totalEarnings: nextEarnings,
          updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          type: txType,
          amount: Math.abs(cleanDelta),
          status: 'completed',
          description: description.slice(0, 190),
          createdAt: serverTimestamp(),
        });
      } else {
        const updatedProfile = {
          ...profile,
          balance: nextBalance,
          totalEarnings: nextEarnings,
          updatedAt: new Date().toISOString(),
        };
        const newTx: TransactionRecord = {
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          userId: profile.uid,
          type: txType,
          amount: Math.abs(cleanDelta),
          status: 'completed',
          description: description.slice(0, 190),
          createdAt: new Date().toISOString(),
        };
        const nextTx = [newTx, ...transactions];
        setProfile(updatedProfile);
        setTransactions(nextTx);
        saveLocalUserRecord(updatedProfile, undefined, nextTx);
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
      return false;
    }
  };

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const curr = getActiveCurrency(profile);
    const userMsg = supportInput.trim();
    setSupportInput('');
    setSupportMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setSupportLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          mode: 'fast',
          systemInstruction: `You are Zentro Customer Support. Help the member (${profile?.username}, VIP ${profile?.vipLevel}, Balance ${formatSiteAmount(profile?.balance || 0, curr)}) with deposits, withdrawals, VIP upgrades (Zentro Bronze ${formatSiteAmount(1000, curr)}, Zentro Silver ${formatSiteAmount(3500, curr)}, Zentro Gold ${formatSiteAmount(5000, curr)}, Zentro Platinum ${formatSiteAmount(10000, curr)}), referral codes, KYC verification, or Google Tasks sync in 2-3 concise sentences.`,
        }),
      });
      const data = await res.json();
      setSupportMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: data.text || 'Our desk has logged your inquiry.',
        },
      ]);
    } catch {
      setSupportMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Unable to reach instant support right now. Please try again shortly.',
        },
      ]);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleAddTeamReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!isProfileSetupComplete(profile)) {
      setActiveTab('my');
      showNotice('Please select and save your Country, Currency, and Language in My Profile first.');
      return;
    }
    const curr = getActiveCurrency(profile);
    if (profile.vipLevel < 1) {
      showNotice(
        'Only active VIP members (Zentro Bronze, Silver, Gold, or Platinum) can share referral links and refer new members.'
      );
      setActiveTab('vip');
      return;
    }
    if (newMemberUsername.trim().length < 2) return;
    setAddingReferral(true);
    try {
      const isRegOnly = referralMode === 'registration_only';
      const vipConfig = VIP_TIERS.find((v) => v.level === newMemberVip) || VIP_TIERS[1];
      const activeCommLevels = getCommissionLevelsForVip(profile.vipLevel);
      const levelRateObj =
        activeCommLevels.find((l) => l.level === newMemberTier) || activeCommLevels[0];
      const rate = levelRateObj.rate;
      const friendRegBonusAmount = getFriendRegistrationBonusForVip(profile.vipLevel) || 10;
      const commission = isRegOnly
        ? friendRegBonusAmount
        : Number((Math.max(1000, vipConfig.unlockAmount) * rate).toFixed(2));
      const recordedTier = isRegOnly ? 1 : newMemberTier;
      const recordedVip = isRegOnly ? 0 : newMemberVip;
      const txDesc = isRegOnly
        ? `1 Friend Registration Bonus (+${friendRegBonusAmount} LKR) — ${newMemberUsername.trim()}`
        : `L${recordedTier} (${levelRateObj.ratePercent}%) Deposit Referral Bonus — ${newMemberUsername.trim()}`;

      const nextBalance = Number((profile.balance + commission).toFixed(2));
      const nextEarnings = Number((profile.totalEarnings + commission).toFixed(2));

      if (authUser) {
        await addDoc(collection(db, 'referrals'), {
          referrerUid: profile.uid,
          referredUsername: newMemberUsername.trim().slice(0, 60),
          referralCodeUsed: profile.referralCode,
          tierLevel: recordedTier,
          vipLevel: recordedVip,
          commissionEarned: commission,
          createdAt: serverTimestamp(),
        });

        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          balance: nextBalance,
          totalEarnings: nextEarnings,
          updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          type: 'referral_bonus',
          amount: commission,
          status: 'completed',
          description: txDesc.slice(0, 190),
          createdAt: serverTimestamp(),
        });
      } else {
        const newRef: ReferralRecordData = {
          id: `ref_${Date.now()}`,
          referrerUid: profile.uid,
          referredUsername: newMemberUsername.trim().slice(0, 60),
          referralCodeUsed: profile.referralCode,
          tierLevel: recordedTier,
          vipLevel: recordedVip,
          commissionEarned: commission,
          createdAt: new Date().toISOString(),
        };
        const newTx: TransactionRecord = {
          id: `tx_${Date.now()}`,
          userId: profile.uid,
          type: 'referral_bonus',
          amount: commission,
          status: 'completed',
          description: txDesc.slice(0, 190),
          createdAt: new Date().toISOString(),
        };
        const updatedProfile = {
          ...profile,
          balance: nextBalance,
          totalEarnings: nextEarnings,
          updatedAt: new Date().toISOString(),
        };
        const nextRefs = [newRef, ...referrals];
        const nextTx = [newTx, ...transactions];
        setProfile(updatedProfile);
        setReferrals(nextRefs);
        setTransactions(nextTx);
        saveLocalUserRecord(updatedProfile, undefined, nextTx, undefined, undefined, nextRefs);
      }

      setNewMemberUsername('');
      pushUserNotification(profile.uid, {
        title: `Referral Bonus Earned: +${commission} LKR`,
        titleSi: `යොමු කිරීමේ ප්‍රසාද දීමනාව: +${commission} LKR`,
        message: `${txDesc} has been credited to your wallet balance.`,
        messageSi: `${txDesc} ඔබගේ ගිණුම් ශේෂයට සාර්ථකව එක් කරන ලදී.`,
        category: 'referral',
        priority: 'high',
        actionTab: 'team',
        actionLabel: 'View Team Network',
        actionLabelSi: 'කණ්ඩායම් ජාලය බලන්න',
      });
      showNotice(`Referral recorded! +${formatSiteAmount(commission, curr)} commission credited.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'referrals');
    } finally {
      setAddingReferral(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b193c] text-white text-sm font-mono">
        Loading Zentro Platform...
      </div>
    );
  }

  if (isAdminLoggedIn) {
    return (
      <AdminPanel
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onExitAdmin={() => {
          localStorage.removeItem('zentro_admin_session_v1');
          setIsAdminLoggedIn(false);
        }}
        onAdminMutateUser={(mutatedUid) => {
          if (profile && profile.uid === mutatedUid) {
            loadSessionFromStorage(mutatedUid);
          }
        }}
        onForceLogoutActiveUser={(loggedOutUid) => {
          if (profile && profile.uid === loggedOutUid) {
            handleSignOutAll();
          }
        }}
      />
    );
  }

  if (!profile) {
    return (
      <AuthGate
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onRegisterAccount={handleRegisterAccount}
        onLoginAccount={handleLoginAccount}
        authError={authError}
        isSubmitting={isSubmittingAuth}
      />
    );
  }

  const currentVip =
    VIP_TIERS.find((v) => v.level === profile.vipLevel) || VIP_TIERS[0];
  const setupDone = isProfileSetupComplete(profile);
  const activeCurrency = getActiveCurrency(profile);
  const activeLang = getActiveLanguage(profile);

  const handleQuickLanguageChange = async (nextLang: string) => {
    if (!nextLang || !profile) return;
    try {
      localStorage.setItem('zentro_active_language_v1', nextLang);
    } catch {
      // ignore
    }
    const updatedProfile: UserProfile = {
      ...profile,
      language: nextLang,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updatedProfile);
    saveLocalUserRecord(updatedProfile);
    if (authUser) {
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          language: nextLang,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore offline update error
      }
    }
  };

  return (
    <div
      className={`relative min-h-screen pb-20 md:pb-8 flex flex-col transition-colors ${
        isDark
          ? 'bg-gradient-to-b from-[#0b193c] via-[#101626] to-[#1a0b2e] text-white'
          : 'bg-gradient-to-b from-blue-50 via-white to-pink-50 text-slate-900'
      }`}
    >
      {/* Full-Viewport Creative Zentro Atrium Background Image & Ambient Aurora Accents */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={isDark ? ZENTRO_ATRIUM_BG_DATA_URI : ZENTRO_ATRIUM_LIGHT_BG_DATA_URI}
          alt="Zentro Creative Atrium Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-100 scale-105 transition-transform duration-700"
        />
        {/* Animated Floating Ambient Aurora Orbs */}
        <div
          className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl animate-pulse ${
            isDark ? 'bg-sky-500/20' : 'bg-sky-400/25'
          }`}
        />
        <div
          className={`absolute top-1/4 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl animate-pulse ${
            isDark ? 'bg-pink-500/20' : 'bg-pink-400/25'
          }`}
        />
        <div
          className={`absolute -bottom-28 left-1/3 w-96 h-96 rounded-full blur-3xl ${
            isDark ? 'bg-rose-500/15' : 'bg-rose-400/20'
          }`}
        />
        {/* Subtle Depth Scrim that preserves full background artwork visibility */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isDark
              ? 'bg-gradient-to-b from-[#040b24]/25 via-[#091536]/30 to-[#120624]/45'
              : 'bg-gradient-to-b from-white/25 via-pink-50/20 to-blue-100/30'
          }`}
        />
      </div>

      {/* Top Bar Contract: Zone 1 (Up-Left Dark/Light Toggle + Brand), Zone 2 (5 Core Tabs), Zone 3 (Language Switcher + Sign Out + Notification Bell) */}
      <header
        className={`sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 border-b backdrop-blur-xl ${
          isDark
            ? 'bg-[#101626]/90 border-white/10'
            : 'bg-white/90 border-pink-200/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle Dark or Light Mode"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-pink-500/40 bg-gradient-to-r from-blue-500/10 via-pink-500/10 to-rose-500/10 text-xs font-bold hover:border-pink-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('home')}
            className="text-base sm:text-lg font-serif italic font-extrabold tracking-wider bg-gradient-to-r from-sky-400 via-pink-500 to-rose-500 bg-clip-text text-transparent whitespace-nowrap shrink-0 cursor-pointer"
          >
            ZENTRO
          </button>
        </div>

        {/* 5 Primary Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {(
            [
              { id: 'home', label: tr(profile, 'Home', 'මුල් පිටුව') },
              { id: 'team', label: tr(profile, 'Team', 'කණ්ඩායම') },
              { id: 'task', label: tr(profile, 'Task', 'කාර්යයන්') },
              { id: 'vip', label: tr(profile, 'VIP', 'VIP') },
              { id: 'my', label: tr(profile, 'My', 'මගේ ගිණුම') },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`py-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-500 font-bold'
                  : isDark
                    ? 'border-transparent text-slate-300 hover:text-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
              } ${!setupDone && tab.id !== 'my' ? 'opacity-60' : ''}`}
            >
              {!setupDone && tab.id !== 'my' && <Lock className="w-3 h-3 text-rose-400" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Language Switcher in Header */}
          <select
            aria-label="Select Site Language"
            value={activeLang}
            onChange={(e) => handleQuickLanguageChange(e.target.value)}
            className={`max-w-[118px] sm:max-w-[150px] px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none truncate ${
              isDark
                ? 'bg-[#162038] border-pink-500/40 text-white'
                : 'bg-pink-50 border-pink-200 text-slate-900'
            }`}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>

          {/* Sign Out Button Directly to the Right of Language Change Button */}
          <button
            type="button"
            onClick={handleSignOutAll}
            title={tr(profile, 'Sign Out', 'ඉවත් වන්න')}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-md border border-white/20 hover:opacity-95"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>{tr(profile, 'Sign Out', 'ඉවත් වන්න')}</span>
          </button>

          {/* Real-Time Notification Bell Button with Unread Counter */}
          <button
            type="button"
            onClick={() => setIsNotificationCenterOpen(true)}
            aria-label="Open Notification Center"
            className={`relative p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isDark
                ? 'bg-[#162038] border-pink-500/40 hover:border-pink-400 text-white'
                : 'bg-pink-50 border-pink-200 hover:border-pink-400 text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-extrabold flex items-center justify-center shadow-sm animate-pulse">
                {notifications.filter((n) => !n.read).length > 99
                  ? '99+'
                  : notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Real-Time Floating Live Notification Toast Popup */}
      <AnimatePresence>
        {liveToastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed top-16 right-4 z-50 max-w-sm w-[calc(100%-2rem)]"
          >
            <div
              className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 ${
                isDark
                  ? 'bg-[#111a30]/95 border-pink-500/50 text-white'
                  : 'bg-white/95 border-pink-300 text-slate-900'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 via-pink-500 to-rose-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                <Bell className="w-4 h-4" />
              </div>
              <div
                onClick={() => {
                  setLiveToastNotification(null);
                  setIsNotificationCenterOpen(true);
                }}
                className="flex-1 min-w-0 cursor-pointer space-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-pink-400">
                    {liveToastNotification.isBroadcast
                      ? tr(profile, 'ADMIN BROADCAST', 'ප්‍රධාන නිවේදනය')
                      : tr(profile, 'NEW NOTIFICATION', 'නව දැනුම්දීමක්')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {tr(profile, 'Just now', 'දැන්')}
                  </span>
                </div>
                <div className="text-xs font-extrabold truncate">
                  {replaceCurrencyInText(
                    tr(
                      profile,
                      liveToastNotification.title,
                      liveToastNotification.titleSi || liveToastNotification.title
                    ),
                    activeCurrency
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {replaceCurrencyInText(
                    tr(
                      profile,
                      liveToastNotification.message,
                      liveToastNotification.messageSi || liveToastNotification.message
                    ),
                    activeCurrency
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLiveToastNotification(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secondary Workspace Bar (Core Tabs + Live Balance) */}
      <div
        className={`border-b px-5 py-2 ${
          isDark ? 'bg-[#151d30]/80 border-white/10' : 'bg-pink-50/60 border-pink-200/60'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'home', label: tr(profile, 'Home', 'මුල් පිටුව') },
                { id: 'team', label: tr(profile, 'Team', 'කණ්ඩායම') },
                { id: 'task', label: tr(profile, 'Task', 'කාර්යයන්') },
                { id: 'vip', label: tr(profile, 'VIP', 'VIP') },
                { id: 'my', label: tr(profile, 'My', 'මගේ ගිණුම') },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  activeTab === item.id
                    ? 'bg-white text-slate-950 shadow-sm'
                    : isDark
                      ? 'text-slate-300 hover:bg-white/10'
                      : 'text-slate-600 hover:bg-white'
                } ${!setupDone && item.id !== 'my' ? 'opacity-55' : ''}`}
              >
                {!setupDone && item.id !== 'my' && <Lock className="w-3 h-3 text-rose-400" />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span>
              {tr(profile, 'Balance:', 'ශේෂය:')}{' '}
              <strong className="text-pink-500 dark:text-pink-400">
                {formatSiteAmount(profile.balance, activeCurrency)}
              </strong>
            </span>
            <span>·</span>
            <span>
              {tr(profile, 'Currency:', 'මුදල් ඒකකය:')} <strong>{activeCurrency}</strong>
            </span>
            <span>·</span>
            <span>{currentVip.name}</span>
          </div>
        </div>
      </div>

      {!setupDone && (
        <div className="max-w-7xl w-full mx-auto px-5 pt-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-blue-600 text-white text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg border border-white/20">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                {tr(
                  profile,
                  'Action Required After Registration: Please select your Country, Currency, and Language below and click "Save Profile Changes" to unlock all platform tabs.',
                  'ලියාපදිංචි වූ වහාම පළමුව Country, Currency සහ Language තෝරා "Save Profile Changes" ක්ලික් කර සියලුම කොටස් අගුළු හරින්න.'
                )}
              </span>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-black/25 shrink-0">
              STEP 1 OF 1 · PROFILE LOCK ACTIVE
            </span>
          </div>
        </div>
      )}

      {profile.mustUpgradeNextVip && (
        <div className="max-w-7xl w-full mx-auto px-5 pt-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-blue-600 text-white text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border border-white/25">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                {tr(
                  profile,
                  `VIP Upgrade Required: You must upgrade to the next VIP level (${
                    (
                      VIP_TIERS.find(
                        (v) => v.level === Math.min(4, profile.vipLevel + 1)
                      ) || VIP_TIERS[4]
                    ).name
                  }) to resume Live Mining and unlock Withdrawals.`,
                  `මීළඟ VIP මට්ටමට උත්ශ්‍රේණි කිරීම අනිවාර්ය වේ: නැවත සජීවී පතල් කැණීම (Mining) සහ මුදල් ආපසු ගැනීම (Withdraw) සඳහා මීළඟ VIP මට්ටම සක්‍රිය කරන්න.`
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectTab('vip')}
              className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 font-extrabold text-xs shrink-0 cursor-pointer shadow-sm"
            >
              {tr(profile, 'Upgrade Next VIP Now', 'දැන්ම VIP Upgrade කරන්න')}
            </button>
          </div>
        </div>
      )}

      {bannerNotice && (
        <div className="max-w-7xl w-full mx-auto px-5 pt-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-pink-500 to-rose-500 text-white text-xs font-bold flex items-center justify-between shadow-md">
            <span>{bannerNotice}</span>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ADMIN ANNOUNCEMENTS AT TOP OF USER DASHBOARD (Closeable by User) */}
      {dashboardAnnouncements.length > 0 && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-2.5 relative z-20">
          {dashboardAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-pink-600 to-rose-600 text-white shadow-lg border border-white/25 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/25 text-[10px] font-mono font-extrabold uppercase tracking-wider">
                      {tr(profile, 'ADMIN ANNOUNCEMENT', 'ප්‍රධාන නිවේදනය')}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold">
                      {tr(profile, ann.title, ann.titleSi || ann.title)}
                    </span>
                  </div>
                  <p className="text-xs text-white/95 leading-relaxed break-words">
                    {tr(profile, ann.message, ann.messageSi || ann.message)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  dismissDashboardAnnouncementBanner(profile.uid, ann.id);
                  setDashboardAnnouncements(
                    getActiveDashboardAnnouncementsForUser(profile.uid)
                  );
                }}
                title={tr(profile, 'Close Announcement', 'නිවේදනය වසන්න')}
                className="px-2.5 py-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-white text-xs font-extrabold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
                <span>{tr(profile, 'Close', 'වසන්න')}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            {/* ================= HOME TAB ================= */}
            {activeTab === 'home' && (
              <div className="space-y-5">
            {/* Compact Zentro Portfolio Hero Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-pink-500 to-rose-600 text-white shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-center border border-white/20"
            >
              <img
                src={ZENTRO_ATRIUM_BG_DATA_URI}
                alt="Zentro Hero Artwork"
                referrerPolicy="no-referrer"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-55 mix-blend-screen"
              />
              {/* Overlapping White Translucent Circles */}
              <div className="pointer-events-none absolute -right-10 -top-10 w-60 h-60 rounded-full bg-white/15" />
              <div className="pointer-events-none absolute right-12 -bottom-16 w-48 h-48 rounded-full border-[18px] border-white/15 bg-sky-300/10" />

              <div className="relative z-10 lg:col-span-7 space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-slate-950 text-xs font-extrabold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>ZENTRO · {currentVip.name}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif italic font-extrabold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
                  {tr(profile, `Welcome, ${profile.username}`, `සාදරයෙන් පිළිගනිමු, ${profile.username}`)}
                </h1>

                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  {profile.vipLevel >= 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/?ref=${profile.referralCode}`;
                        navigator.clipboard.writeText(shareUrl);
                        setCopiedRef(true);
                        showNotice(
                          tr(
                            profile,
                            'Your VIP referral link has been copied!',
                            'ඔබගේ VIP යොමු කිරීමේ සබැඳිය පිටපත් කරන ලදී!'
                          )
                        );
                        setTimeout(() => setCopiedRef(false), 2000);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <span>
                        {tr(
                          profile,
                          `Share Referral Link (${profile.referralCode})`,
                          `යොමු කිරීමේ සබැඳිය බෙදාගන්න (${profile.referralCode})`
                        )}
                      </span>
                      {copiedRef ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/80" />
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectTab('vip')}
                      className="px-3.5 py-1.5 rounded-xl bg-black/25 hover:bg-black/35 border border-white/25 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-pink-200" />
                      <span>
                        {tr(
                          profile,
                          'Referral Link Locked (VIP 1+ Members Only — Tap to Upgrade)',
                          'යොමු කිරීමේ සබැඳිය අගුළු දමා ඇත (VIP 1+ සාමාජිකයින්ට පමණි)'
                        )}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative z-10 lg:col-span-5 grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25">
                  <div className="text-xs text-white/85 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-white" />
                    <span>{tr(profile, 'Wallet Balance', 'ගිණුම් ශේෂය')}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-white mt-0.5">
                    {formatSiteAmount(profile.balance, activeCurrency)}
                  </div>
                  <div className="text-[11px] text-white/80">
                    {tr(profile, `Available ${activeCurrency}`, `පවතින ${activeCurrency} ශේෂය`)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25">
                  <div className="text-xs text-white/85 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                    <span>{tr(profile, 'Total Yield', 'මුළු ඉපැයීම්')}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-white mt-0.5">
                    +{formatSiteAmount(profile.totalEarnings, activeCurrency)}
                  </div>
                  <div className="text-[11px] text-white/80">
                    {tr(profile, 'Tasks:', 'කාර්යයන්:')} {profile.tasksCompletedToday}/{currentVip.dailyTasks}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 6 Home Action Icons at the Top (VIP, Deposit, Withdrawal, Active VIP, My Tasks, Customer Support) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  label: tr(profile, 'VIP', 'VIP මට්ටම්'),
                  sub: 'Bronze – Platinum',
                  icon: Crown,
                  badgeBg: 'from-pink-500 to-rose-500',
                  onClick: () => handleSelectTab('vip'),
                },
                {
                  label: tr(profile, 'Deposit', 'තැන්පතු'),
                  sub: `Instant ${activeCurrency}`,
                  icon: ArrowDownToLine,
                  badgeBg: 'from-sky-400 to-blue-600',
                  onClick: () => {
                    if (!setupDone) {
                      handleSelectTab('my');
                      return;
                    }
                    setDepositAmount(String(convertFromLkr(1000, activeCurrency)));
                    setModalError(null);
                    setActiveModal('deposit');
                  },
                },
                {
                  label: tr(profile, 'Withdrawal', 'මුදල් ගැනීම්'),
                  sub: tr(profile, 'Bank / USDT BEP-20', 'බැංකු / USDT BEP-20'),
                  icon: ArrowUpFromLine,
                  badgeBg: 'from-rose-500 to-red-600',
                  onClick: () => {
                    if (!setupDone) {
                      handleSelectTab('my');
                      return;
                    }
                    setModalError(null);
                    setActiveModal('withdrawal');
                  },
                },
                {
                  label: tr(profile, 'Active VIP', 'සක්‍රිය VIP'),
                  sub: currentVip.name,
                  icon: ShieldCheck,
                  badgeBg: 'from-blue-500 to-pink-500',
                  onClick: () => {
                    setModalError(null);
                    setActiveModal('active_vip');
                  },
                },
                {
                  label: tr(profile, 'My Tasks', 'මගේ කාර්යයන්'),
                  sub: `${profile.tasksCompletedToday}/${currentVip.dailyTasks} ${tr(profile, 'Done', 'අවසන්')}`,
                  icon: ListChecks,
                  badgeBg: 'from-pink-500 to-blue-500',
                  onClick: () => handleSelectTab('task'),
                },
                {
                  label: tr(profile, 'Customer Support', 'පාරිභෝගික සහාය'),
                  sub: tr(profile, 'Channels & Live Chat', 'නිල නාලිකා සහ සජීවී චැට්'),
                  icon: Headphones,
                  badgeBg: 'from-red-500 to-pink-500',
                  onClick: () => {
                    setModalError(null);
                    handleSelectTab('support');
                  },
                },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    type="button"
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, delay: idx * 0.03 }}
                    onClick={item.onClick}
                    className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2.5 cursor-pointer transition-all shadow-sm ${
                      isDark
                        ? 'bg-[#151d30] border-white/10 hover:border-pink-500/60'
                        : 'bg-white border-pink-200/80 hover:border-pink-500'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.badgeBg} flex items-center justify-center text-white shadow-md`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold whitespace-nowrap">{item.label}</div>
                    <div className="text-[11px] text-slate-400 whitespace-nowrap">{item.sub}</div>
                  </motion.button>
                );
              })}
            </div>

            {/* LIVE MINING & INSTANT COLLECT */}
            <LiveMiningPanel
              profile={profile}
              isDark={isDark}
              onClaimMiningReward={handleClaimMiningReward}
              onNavigateVip={() => handleSelectTab('vip')}
            />

            {/* Team & Referral Syndicate Banner */}
            <motion.div
              whileHover={{ y: -3 }}
              className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark ? 'bg-[#151d30] border-white/10' : 'bg-white border-pink-200/80 shadow-sm'
              }`}
            >
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-rose-400">
                  {tr(profile, 'TEAM & REFERRAL SYNDICATE', 'කණ්ඩායම් සහ යොමු කිරීමේ ජාලය')}
                </div>
                <h3 className="text-lg font-bold font-display">
                  {tr(
                    profile,
                    '5-Level Team Commission Network',
                    'මට්ටම් 5 කණ්ඩායම් කොමිස් ජාලය'
                  )}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  {tr(
                    profile,
                    'Earn automatic L1 (up to 25%), L2 (up to 16%), and L3 (up to 12%) commissions when team members register with your locked invite code.',
                    'ඔබගේ යොමු කිරීමේ කේතය (Invite Code) මගින් සාමාජිකයන් ලියාපදිංචි වී තැන්පතු කරන විට L1 (25% දක්වා), L2 (16% දක්වා) සහ L3 (12% දක්වා) කොමිස් ස්වයංක්‍රීයව උපයන්න.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectTab('team')}
                className="sm:w-auto w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-500 via-pink-500 to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
              >
                <Users className="w-4 h-4" />
                <span>{tr(profile, 'Manage Team Network', 'කණ්ඩායම් ජාලය කළමනාකරණය කරන්න')}</span>
              </button>
            </motion.div>

            {/* Bottom of Home Tab: Sponsor Countries (with Flag Images) & Registered User Counts */}
            <SponsorCountriesSection profile={profile} isDark={isDark} />
          </div>
        )}

        {/* ================= TEAM TAB ================= */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-pink-500 to-rose-600 text-white grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-lg">
              <div className="lg:col-span-7 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-white/90">
                  {tr(
                    profile,
                    'ZENTRO VIP REFERRAL & PROMOTION BENEFITS (BRONZE · SILVER · GOLD · PLATINUM)',
                    'ZENTRO VIP යොමු කිරීම් සහ ප්‍රවර්ධන ප්‍රතිලාභ (BRONZE · SILVER · GOLD · PLATINUM)'
                  )}
                </div>
                <h2 className="text-2xl font-bold font-display">
                  {tr(
                    profile,
                    'Share Your Link & Promote Our Platform',
                    'ඔබගේ සබැඳිය බෙදාගෙන වේදිකාව ප්‍රවර්ධනය කරන්න'
                  )}
                </h2>
                <p className="text-xs text-white/90 leading-relaxed">
                  <strong>{tr(profile, 'Registration only members:', 'ලියාපදිංචි වීම පමණක්:')}</strong>{' '}
                  {tr(profile, '1 Friend registration =', '1 මිතුරෙකු ලියාපදිංචි වීම =')}{' '}
                  <strong>
                    {formatSiteAmount(10, activeCurrency)} (Bronze) ·{' '}
                    {formatSiteAmount(30, activeCurrency)} (Silver) ·{' '}
                    {formatSiteAmount(50, activeCurrency)} (Gold) ·{' '}
                    {formatSiteAmount(100, activeCurrency)} (Platinum)
                  </strong>{' '}
                  ·{' '}
                  <strong>
                    {tr(
                      profile,
                      'Team Task (Build 5 Deposit Members):',
                      'කණ්ඩායම් කාර්යය (තැන්පතු කළ සාමාජිකයන් 5):'
                    )}
                  </strong>{' '}
                  <strong>
                    {formatSiteAmount(500, activeCurrency)} (Bronze) ·{' '}
                    {formatSiteAmount(1500, activeCurrency)} (Silver) ·{' '}
                    {formatSiteAmount(3000, activeCurrency)} (Gold) ·{' '}
                    {formatSiteAmount(5000, activeCurrency)} (Platinum)
                  </strong>{' '}
                  ·{' '}
                  <strong>
                    {tr(
                      profile,
                      'Platinum Deposit Referral Commission:',
                      'Platinum තැන්පතු කොමිස්:'
                    )}
                  </strong>{' '}
                  L1 (25%), L2 (16%), L3 (12%), L4 (5%), L5 (3%).
                </p>
              </div>
              <div className="lg:col-span-5 p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 space-y-2.5">
                {profile.vipLevel >= 1 ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-white/90">
                      <span>
                        {tr(
                          profile,
                          'Your VIP Referral Link & Code',
                          'ඔබගේ VIP යොමු කිරීමේ සබැඳිය සහ කේතය'
                        )}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300/40 text-[10px] font-mono font-bold">
                        {currentVip.name.toUpperCase()} ACTIVE
                      </span>
                    </div>
                    <div className="text-xs font-mono bg-black/20 px-3 py-2 rounded-xl truncate text-white/95">
                      {`${window.location.origin}/?ref=${profile.referralCode}`}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span className="text-sm font-extrabold font-mono text-white">
                        Code: {profile.referralCode}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsTeamDetailsModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-pink-500 hover:from-sky-500 hover:to-pink-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{tr(profile, 'View My Team Details', 'මගේ කණ්ඩායම් විස්තර')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/?ref=${profile.referralCode}`;
                            navigator.clipboard.writeText(shareUrl);
                            showNotice(
                              tr(
                                profile,
                                'VIP Referral registration link copied to clipboard!',
                                'VIP යොමු කිරීමේ සබැඳිය පිටපත් කරන ලදී!'
                              )
                            );
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold cursor-pointer shadow-sm hover:opacity-95"
                        >
                          {tr(profile, 'Copy Referral Link', 'සබැඳිය පිටපත් කරන්න')}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Lock className="w-4 h-4 text-pink-200 shrink-0" />
                      <span>
                        {tr(
                          profile,
                          'Referral Link Restricted to VIP Members',
                          'යොමු කිරීමේ සබැඳිය VIP සාමාජිකයින්ට පමණි'
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/90 leading-relaxed">
                      {tr(
                        profile,
                        'Only active VIP members (Zentro Bronze, Silver, Gold, or Platinum) can unlock and share their personal referral link to invite new team members.',
                        'නව සාමාජිකයින්ට ආරාධනා කිරීම සඳහා පුද්ගලික යොමු කිරීමේ සබැඳිය ලබාගත හැක්කේ සක්‍රිය VIP සාමාජිකයින්ට පමණි.'
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('vip')}
                      className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Crown className="w-3.5 h-3.5 text-pink-600" />
                      <span>
                        {tr(
                          profile,
                          `Upgrade to Zentro Bronze (${formatSiteAmount(1000, activeCurrency)}) to Unlock`,
                          `Zentro Bronze (${formatSiteAmount(1000, activeCurrency)}) සක්‍රිය කර අගුළු හරින්න`
                        )}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Creative, Clear & User-Friendly 5-Level Deposit Referral Commission Percentage Visualizer */}
            <div
              className={`p-5 rounded-3xl border space-y-4 ${
                isDark ? 'bg-[#151d30] border-pink-500/35' : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-white/10 pb-3.5">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-pink-500">
                    {tr(
                      profile,
                      `5-LEVEL DEPOSIT REFERRAL COMMISSION PERCENTAGES (${currentVip.name.toUpperCase()})`,
                      `මට්ටම් 5 තැන්පතු කොමිස් ප්‍රතිශත සටහන (${currentVip.name})`
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold font-display">
                    {tr(
                      profile,
                      'Your Active Team Commission Percentages (L1 to L5)',
                      'ඔබගේ කණ්ඩායමේ මට්ටම් 5 සඳහා හිමිවන කොමිස් ප්‍රතිශත (%)'
                    )}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/20 via-pink-500/20 to-rose-500/20 border border-pink-500/40 text-xs font-mono font-extrabold text-pink-400">
                    Total 5-Level Pool:{' '}
                    {getCommissionLevelsForVip(profile.vipLevel).reduce(
                      (sum, item) => sum + item.ratePercent,
                      0
                    )}
                    %
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {getCommissionLevelsForVip(profile.vipLevel).map((lv) => {
                  const count = referrals.filter((r) => r.tierLevel === lv.level).length;
                  const levelRole =
                    lv.level === 1
                      ? tr(profile, 'Direct Invite (L1)', 'සෘජු මිතුරන් (L1)')
                      : lv.level === 2
                        ? tr(profile, '2nd Gen Team (L2)', '2 වන පෙළ (L2)')
                        : lv.level === 3
                          ? tr(profile, '3rd Gen Network (L3)', '3 වන පෙළ (L3)')
                          : lv.level === 4
                            ? tr(profile, '4th Gen Syndicate (L4)', '4 වන පෙළ (L4)')
                            : tr(profile, '5th Gen Global (L5)', '5 වන පෙළ (L5)');
                  const fillWidth = Math.min(100, Math.round((lv.ratePercent / 25) * 100));
                  const examplePayoutLkr = (1000 * lv.ratePercent) / 100;

                  return (
                    <div
                      key={lv.level}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                        isDark
                          ? 'bg-gradient-to-b from-[#1a243b] to-[#111728] border-pink-500/30 hover:border-pink-400'
                          : 'bg-gradient-to-b from-pink-50/60 to-white border-pink-200 hover:border-pink-400'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white text-[10px] font-mono font-extrabold">
                            LEVEL {lv.level}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 text-[10px] font-mono font-bold">
                            {count} {tr(profile, 'Members', 'සාමාජිකයන්')}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                          {levelRole}
                        </div>

                        {/* Creative Large Percentage Display + Meter */}
                        <div className="p-2.5 rounded-xl bg-slate-900/85 text-white border border-white/10 space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] font-mono uppercase text-slate-300">
                              {tr(profile, 'Commission', 'කොමිස් ප්‍රතිශතය')}
                            </span>
                            <span className="text-2xl font-extrabold font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-pink-400 to-rose-300">
                              {lv.ratePercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-pink-500 to-rose-500 transition-all duration-300"
                              style={{ width: `${fillWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">
                          {tr(profile, 'Per 1K Deposit:', '1K තැන්පතුවකට:')}
                        </span>
                        <span className="font-extrabold text-emerald-400">
                          +{formatSiteAmount(examplePayoutLkr, activeCurrency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zentro Bronze, Silver, Gold & Platinum Team Task Bars (ONLY User's Active VIP Task Bar Fills) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  level: 1,
                  tier: VIP_TIERS[1],
                  taskId: 'task_build_5_deposit_team',
                  reward: 500,
                  regBonus: 10,
                  comm: '10% / 6% / 2% / 1% / 1%',
                  border: isDark ? 'bg-[#151d30] border-pink-500' : 'bg-white border-pink-300 shadow-sm',
                  barBorder: 'border-pink-500',
                  barGrad: 'from-amber-500 via-pink-500 to-rose-500',
                  accent: 'text-amber-500',
                },
                {
                  level: 2,
                  tier: VIP_TIERS[2],
                  taskId: 'task_silver_build_5_deposit_team',
                  reward: 1500,
                  regBonus: 30,
                  comm: '15% / 10% / 6% / 2% / 1%',
                  border: isDark ? 'bg-[#151d30] border-sky-500' : 'bg-white border-sky-300 shadow-sm',
                  barBorder: 'border-sky-500',
                  barGrad: 'from-sky-400 via-blue-500 via-pink-500 to-rose-500',
                  accent: 'text-sky-400',
                },
                {
                  level: 3,
                  tier: VIP_TIERS[3],
                  taskId: 'task_gold_build_5_deposit_team',
                  reward: 3000,
                  regBonus: 50,
                  comm: '20% / 12% / 8% / 3% / 1%',
                  border: isDark ? 'bg-[#151d30] border-rose-500' : 'bg-white border-rose-300 shadow-sm',
                  barBorder: 'border-rose-500',
                  barGrad: 'from-pink-500 via-rose-500 to-blue-500',
                  accent: 'text-rose-400',
                },
                {
                  level: 4,
                  tier: VIP_TIERS[4],
                  taskId: 'task_platinum_build_5_deposit_team',
                  reward: 5000,
                  regBonus: 100,
                  comm: '25% / 16% / 12% / 5% / 3%',
                  border: isDark ? 'bg-[#151d30] border-blue-500' : 'bg-white border-blue-300 shadow-sm',
                  barBorder: 'border-blue-500',
                  barGrad: 'from-sky-400 via-blue-500 to-pink-500',
                  accent: 'text-sky-400',
                },
              ].map((cfg) => {
                const depositCount = referrals.filter((r) => r.vipLevel >= 1).length;
                const isUserCurrentVip = profile.vipLevel === cfg.level;
                const isHigherVipLocked = profile.vipLevel < cfg.level;
                const isClaimed = (profile.claimedTeamTaskTiers || []).includes(cfg.level);
                // Task bar ONLY fills for the VIP tier the user is currently in!
                const activeDepositCount = isUserCurrentVip ? Math.min(5, depositCount) : 0;
                const activeFillPercent = isUserCurrentVip
                  ? Math.min(100, Math.round((depositCount / 5) * 100))
                  : 0;
                const hasFive = isUserCurrentVip && depositCount >= 5;
                return (
                  <div
                    key={cfg.level}
                    className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 ${cfg.border} ${
                      isUserCurrentVip ? 'ring-2 ring-pink-500 shadow-lg' : 'opacity-90'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={cfg.tier.imageUrl}
                            alt={cfg.tier.name}
                            className="w-11 h-7 rounded-lg object-cover border border-pink-500/30"
                          />
                          <span className={`text-xs font-mono font-bold ${cfg.accent}`}>
                            {cfg.tier.name.toUpperCase()} {isUserCurrentVip ? '· ACTIVE' : 'TASK'}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-pink-500">
                          +{formatSiteAmount(cfg.reward, activeCurrency)}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold font-display">
                        Build 5 Deposit Members Team — {formatSiteAmount(cfg.reward, activeCurrency)}
                      </h3>
                      <p className="text-xs text-slate-400">
                        1 Friend registration ={' '}
                        <strong>{formatSiteAmount(cfg.regBonus, activeCurrency)}</strong> · Deposit
                        Commission: <strong>{cfg.comm}</strong>
                      </p>
                      <div
                        className={`p-3 rounded-2xl bg-slate-100 dark:bg-[#101626] border ${cfg.barBorder} space-y-1.5`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 dark:text-slate-300">
                            Task Bar Progress
                          </span>
                          <span className="text-pink-500 dark:text-pink-400 font-bold">
                            {activeDepositCount} / 5 ({activeFillPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${cfg.barGrad} transition-all duration-300`}
                            style={{
                              width: `${activeFillPercent}%`,
                            }}
                          />
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {isUserCurrentVip
                            ? tr(
                                profile,
                                'Your Active VIP Task Bar ✓',
                                'ඔබගේ සක්‍රිය VIP Task Bar එක ✓'
                              )
                            : tr(
                                profile,
                                `Fills only when ${cfg.tier.name} is your active VIP`,
                                `${cfg.tier.name} සක්‍රිය වූ විට පමණක් පිරේ`
                              )}
                        </div>
                      </div>
                    </div>
                    {isHigherVipLocked ? (
                      <button
                        type="button"
                        onClick={() => handleSelectTab('vip')}
                        className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-pink-500/15 border border-pink-500/40 text-pink-500 dark:text-pink-300 cursor-pointer hover:bg-pink-500/25"
                      >
                        Activate {cfg.tier.name} (
                        {formatSiteAmount(cfg.tier.unlockAmount, activeCurrency)})
                      </button>
                    ) : !isUserCurrentVip ? (
                      <div className="w-full py-3 px-4 rounded-2xl text-xs font-mono text-center bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {tr(
                          profile,
                          `Active VIP is ${currentVip.name} (Only Active VIP Task Bar Fills)`,
                          `ඔබ දැනට සිටින ${currentVip.name} හි පමණක් Task Bar පිරේ`
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isClaimed || !hasFive || completingTaskId === cfg.taskId}
                        onClick={() => {
                          const targetTask = PLATFORM_DAILY_TASKS.find(
                            (t) => t.id === cfg.taskId
                          );
                          if (targetTask) {
                            handleCompletePlatformTask(targetTask);
                          }
                        }}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-bold whitespace-nowrap ${
                          isClaimed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : !hasFive
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                              : `bg-gradient-to-r ${cfg.barGrad} text-white shadow-md cursor-pointer`
                        }`}
                      >
                        {isClaimed
                          ? 'Team Task Claimed ✓'
                          : completingTaskId === cfg.taskId
                            ? `Crediting ${formatSiteAmount(cfg.reward, activeCurrency)}...`
                            : !hasFive
                              ? `Need 5 Deposit Members (${activeDepositCount}/5)`
                              : `Claim ${formatSiteAmount(cfg.reward, activeCurrency)} ${cfg.tier.name} Reward`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-[#151d30] border-white/10' : 'bg-white border-pink-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-500" />
                    <span>{tr(profile, 'Active Team Roster', 'සක්‍රිය කණ්ඩායම් සාමාජික ලැයිස්තුව')} ({referrals.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tr(
                      profile,
                      'Real-time overview of members recruited across all 5 tiers',
                      'සියලුම මට්ටම් 5 හරහා ලියාපදිංචි වූ සාමාජිකයන්'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTeamDetailsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-pink-500 to-rose-500 text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md hover:opacity-95 self-start sm:self-auto"
                >
                  <Users className="w-4 h-4" />
                  <span>{tr(profile, 'View My Team Details', 'මගේ කණ්ඩායම් විස්තර')}</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400">
                      <th className="py-2.5 px-2">{tr(profile, 'Member', 'සාමාජිකයා')}</th>
                      <th className="py-2.5 px-2">{tr(profile, 'Level', 'මට්ටම')}</th>
                      <th className="py-2.5 px-2">{tr(profile, 'Type / VIP Package', 'වර්ගය / VIP පැකේජය')}</th>
                      <th className="py-2.5 px-2 text-right">
                        {tr(profile, 'Commission', 'කොමිස් මුදල')} ({activeCurrency})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {referrals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          {tr(
                            profile,
                            'No referred team members yet.',
                            'තවමත් යොමු කළ කණ්ඩායම් සාමාජිකයින් නොමැත.'
                          )}
                        </td>
                      </tr>
                    ) : (
                      referrals.map((r) => {
                        const refVip = VIP_TIERS.find((v) => v.level === r.vipLevel);
                        return (
                          <tr key={r.id}>
                            <td className="py-2.5 px-2 font-semibold">{r.referredUsername}</td>
                            <td className="py-2.5 px-2 font-mono">Level {r.tierLevel}</td>
                            <td className="py-2.5 px-2 font-mono">
                              {r.vipLevel === 0
                                ? 'Registration Only (1 Friend)'
                                : refVip
                                  ? refVip.name
                                  : `VIP ${r.vipLevel}`}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold tabular-nums text-pink-500">
                              +{formatCurrencyValue(r.commissionEarned, activeCurrency)}{' '}
                              {activeCurrency}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom of Team Tab: Full VIP Tier & Commission Comparison Image */}
            <VipCommissionComparisonPoster
              profile={profile}
              activeCurrency={activeCurrency}
              isDark={isDark}
              onUpgradeClick={() => handleSelectTab('vip')}
            />
          </div>
        )}

        {/* ================= TASK TAB ================= */}
        {activeTab === 'task' && (
          <TaskTab
            profile={profile}
            referrals={referrals}
            onCompletePlatformTask={handleCompletePlatformTask}
            completingTaskId={completingTaskId}
            onNavigateVip={() => handleSelectTab('vip')}
            onUpdateWalletBalance={handleUpdateBalance}
            onNavigateDeposit={() => {
              setModalError(null);
              setActiveModal('deposit');
            }}
          />
        )}

        {/* ================= VIP TAB ================= */}
        {activeTab === 'vip' && (
          <div className="space-y-6">
            {/* Compact VIP Header Banner with Active VIP Emblem */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-pink-500 to-rose-600 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <img
                  src={currentVip.imageUrl}
                  alt={currentVip.name}
                  className="w-24 h-16 rounded-2xl object-cover border border-white/40 shadow-md shrink-0"
                />
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-white/90">
                    {tr(
                      profile,
                      `SELECT & ACTIVATE VIP PACKAGE INSTANTLY (${activeCurrency})`,
                      `VIP පැකේජ පහසුවෙන් තෝරන්න (${activeCurrency})`
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-display mt-0.5">
                    Zentro Bronze · Silver · Gold · Platinum
                  </h2>
                </div>
              </div>
              <div className="flex flex-wrap items-center sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalError(null);
                    setActiveModal('compare_tiers');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>{tr(profile, 'Compare Tiers', 'VIP මට්ටම් සසඳන්න')}</span>
                </button>
                <div className="text-right font-mono bg-black/25 px-3.5 py-2 rounded-2xl border border-white/20">
                  <div className="text-[11px] text-white/80">
                    {tr(profile, 'Active Tasks VIP Tier', 'සක්‍රිය Tasks VIP මට්ටම')}
                  </div>
                  <div className="text-sm font-bold text-white">{currentVip.name}</div>
                  {getHighestVipLevel(profile) > profile.vipLevel && (
                    <div className="text-[10px] font-bold text-emerald-300 mt-0.5">
                      ⚡ {tr(profile, 'Mining at:', 'Mining සිදුවන්නේ:')}{' '}
                      {(VIP_TIERS[getHighestVipLevel(profile)] || currentVip).name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VIP PACKAGE SELECTOR CARDS (LiveMiningPanel removed from VIP tab as requested) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div>
                  <h3 className="text-base font-extrabold font-display">
                    {tr(
                      profile,
                      'Choose & Activate Your VIP Package',
                      'ඔබට අවශ්‍ය VIP පැකේජය මෙතැනින් ක්ෂණිකව තෝරා සක්‍රිය කරන්න'
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {tr(
                      profile,
                      'You can buy a higher or lower VIP package anytime. Live Mining always stays at your highest purchased VIP tier, while Tasks switch to your newly purchased VIP tier.',
                      'ඉහළ VIP එකක් මිලදී ගෙන තිබුණද පසුව පහළ VIP එකක් මිලදී ගත හැක. එවිට Live Mining පමණක් ඉහළම VIP පැකේජයට අදාලව සිදුවන අතර අනෙක් Tasks පහළ VIP මට්ටමට මාරු වේ.'
                    )}
                  </p>
                </div>
                <div className="text-xs font-mono text-pink-400 font-bold">
                  {tr(profile, 'Wallet Balance:', 'ගිණුම් ශේෂය:')}{' '}
                  {formatSiteAmount(profile.balance, activeCurrency)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {VIP_TIERS.slice(1).map((tier, index) => {
                  const highestVip = getHighestVipLevel(profile);
                  const isCurrent = profile.vipLevel === tier.level;
                  const isHighestMiningTier = highestVip === tier.level && highestVip > 0;
                  const isLowerThanCurrent = tier.level < profile.vipLevel;
                  const badgeGradient =
                    tier.level === 1
                      ? 'from-amber-600 to-orange-500'
                      : tier.level === 2
                        ? 'from-slate-400 to-blue-400'
                        : tier.level === 3
                          ? 'from-yellow-400 to-amber-500'
                          : 'from-sky-400 via-pink-500 to-rose-500';
                  return (
                    <motion.div
                      key={tier.level}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, delay: index * 0.03 }}
                      className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 ${
                        isCurrent
                          ? 'border-pink-500 ring-2 ring-pink-500/30'
                          : isHighestMiningTier
                            ? 'border-emerald-500/70 ring-1 ring-emerald-500/30'
                            : isDark
                              ? 'border-white/15 hover:border-pink-500/60'
                              : 'border-pink-200 hover:border-pink-500'
                      } ${isDark ? 'bg-[#151d30]' : 'bg-white shadow-sm'}`}
                    >
                      <div className="space-y-3">
                        {/* VIP Tier Badge Artwork Image */}
                        <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-md">
                          <img
                            src={tier.imageUrl}
                            alt={tier.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                            <span
                              className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${badgeGradient} text-white font-bold text-[10px] shadow-sm`}
                            >
                              {tier.name}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-black/75 text-white font-mono font-bold text-[10px] border border-white/20">
                              {isCurrent
                                ? 'ACTIVE TASKS'
                                : isHighestMiningTier
                                  ? '⚡ MINING TIER'
                                  : `VIP ${tier.level}`}
                            </span>
                          </div>
                        </div>

                        {/* Price & Instant Action Button right near the top */}
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 via-pink-500/10 to-rose-500/10 border border-pink-500/25 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-mono uppercase text-slate-400">
                              {tr(profile, 'Package Price', 'පැකේජ මිල')}
                            </div>
                            <div className="text-xl font-extrabold font-mono tabular-nums text-pink-500 dark:text-pink-400">
                              {formatSiteAmount(tier.unlockAmount, activeCurrency)}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleUpgradeVip(tier)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                              isCurrent
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                                : isLowerThanCurrent
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:opacity-95'
                                  : 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white shadow-md hover:opacity-95'
                            }`}
                          >
                            {isCurrent
                              ? tr(profile, 'Active ✓', 'සක්‍රියයි ✓')
                              : isLowerThanCurrent
                                ? tr(profile, 'Buy Lower VIP', 'මිලදී ගන්න')
                                : tr(profile, 'Select & Activate', 'තෝරන්න')}
                          </button>
                        </div>

                        <div className="space-y-2.5 text-xs pt-1">
                          {/* Creative Daily Mining Percentage Meter Box */}
                          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-400">
                                {tr(profile, 'Live Mining Profit %', 'දෛනික පතල් ප්‍රතිශතය')}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-extrabold text-xs">
                                +{tier.dailyMiningRatePercent}% / Day
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-900/70 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-pink-500"
                                style={{
                                  width: `${Math.min(100, Math.round((tier.dailyMiningRatePercent / 12) * 100))}%`,
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                              <span>
                                1 Day: +
                                {formatSiteAmount(
                                  (tier.unlockAmount * tier.dailyMiningRatePercent) / 100,
                                  activeCurrency
                                )}
                              </span>
                              <span className="text-emerald-300 font-bold">
                                30 Days: {tier.dailyMiningRatePercent * 30}%
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              {tr(profile, 'Daily Tasks & Reward', 'දෛනික කාර්යයන් සහ ප්‍රතිලාභ')}
                            </span>
                            <span className="font-mono font-bold text-pink-400">
                              {tier.dailyTasks} × +{formatSiteAmount(tier.rewardPerTask, activeCurrency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              {tr(profile, '1 Friend Registration', '1 මිතුරෙකු ලියාපදිංචි දීමනාව')}
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              +{formatSiteAmount(tier.registrationBonusPerFriend, activeCurrency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              {tr(profile, '5 Deposit Members Task', 'තැන්පතු සාමාජිකයන් 5 දීමනාව')}
                            </span>
                            <span className="font-mono font-bold text-pink-500">
                              +{formatSiteAmount(tier.teamTaskReward, activeCurrency)}
                            </span>
                          </div>

                          {/* Creative 5-Level Commission Percentage Pills */}
                          <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-400 font-semibold">
                                {tr(profile, '5-Level Commission %', 'මට්ටම් 5 කොමිස් %')}
                              </span>
                              <span className="text-sky-400 font-bold">
                                Total{' '}
                                {getCommissionLevelsForVip(tier.level).reduce(
                                  (acc, l) => acc + l.ratePercent,
                                  0
                                )}
                                %
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1 text-center">
                              {getCommissionLevelsForVip(tier.level).map((lv) => (
                                <div
                                  key={lv.level}
                                  className="py-1 px-1 rounded-lg bg-sky-500/10 border border-sky-500/25"
                                >
                                  <div className="text-[9px] font-mono text-slate-400">
                                    L{lv.level}
                                  </div>
                                  <div className="text-[11px] font-extrabold font-mono text-sky-400">
                                    {lv.ratePercent}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => handleUpgradeVip(tier)}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-pink-500/20 text-pink-400 cursor-default'
                            : isLowerThanCurrent
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:opacity-95'
                              : 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white shadow-md hover:opacity-95'
                        }`}
                      >
                        {isCurrent
                          ? tr(profile, 'Currently Active Package', 'දැනට සක්‍රිය පැකේජය')
                          : isLowerThanCurrent
                            ? `${tr(profile, 'Buy Lower VIP:', 'පහළ VIP මිලදී ගන්න:')} ${tier.name} (${formatSiteAmount(
                                tier.unlockAmount,
                                activeCurrency
                              )})`
                            : `${tr(profile, 'Activate', 'සක්‍රිය කරන්න')} ${tier.name} (${formatSiteAmount(
                                tier.unlockAmount,
                                activeCurrency
                              )})`}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 2.5 Visual 5-Level Commission Breakdown & Side-by-Side VIP Comparison Poster */}
            <VipBenefitsPoster
              profile={profile}
              activeCurrency={activeCurrency}
              isDark={isDark}
              onSelectTier={handleUpgradeVip}
            />

            {/* 3. Zentro Bronze, Silver, Gold & Platinum Featured Commission & Benefits Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bronze Benefits Card */}
              <div
                className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-[#151d30] border-pink-500/40' : 'bg-white border-pink-300 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs font-bold">
                      <Crown className="w-3.5 h-3.5" />
                      <span>
                        Zentro Bronze Benefits ({formatSiteAmount(1000, activeCurrency)})
                      </span>
                    </div>
                    <img
                      src={VIP_TIERS[1].imageUrl}
                      alt="Zentro Bronze"
                      className="w-16 h-10 rounded-xl object-cover border border-amber-400/40"
                    />
                  </div>
                  <h3 className="text-lg font-extrabold font-display">
                    Share Your Link & Promote Our Platform
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Selected Currency Live Mining:</strong>{' '}
                        <strong className="text-emerald-400">
                          Daily 6% (+{formatSiteAmount(60, activeCurrency)}/day · 180%/30d)
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Registration only members:</strong> 1 Friend registration ={' '}
                        <strong className="text-pink-400">
                          {formatSiteAmount(10, activeCurrency)}
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Task:</strong> Build 5 deposit members team ={' '}
                        <strong className="text-pink-400">
                          {formatSiteAmount(500, activeCurrency)}
                        </strong>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Creative 5-Level Percentage Breakdown for Bronze */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-pink-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-300 font-bold">
                      5-Level Deposit Commission Percentages
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px]">
                      20% Total Pool
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {BRONZE_COMMISSION_LEVELS.map((lv) => (
                      <div
                        key={lv.level}
                        className="p-2.5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-pink-500/15 to-rose-500/15 border border-pink-500/30 space-y-1.5"
                      >
                        <div className="text-[10px] font-mono font-bold text-amber-200">
                          L{lv.level}
                        </div>
                        <div className="text-base font-extrabold font-mono text-pink-400">
                          {lv.ratePercent}%
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-pink-500"
                            style={{ width: `${Math.min(100, (lv.ratePercent / 25) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[9px] font-mono text-emerald-300">
                          +{formatSiteAmount((1000 * lv.ratePercent) / 100, activeCurrency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Silver Benefits Card */}
              <div
                className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-[#151d30] border-sky-500/40' : 'bg-white border-sky-300 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-slate-400 via-sky-500 to-blue-600 text-white text-xs font-bold">
                      <Crown className="w-3.5 h-3.5" />
                      <span>
                        Zentro Silver Benefits ({formatSiteAmount(3500, activeCurrency)})
                      </span>
                    </div>
                    <img
                      src={VIP_TIERS[2].imageUrl}
                      alt="Zentro Silver"
                      className="w-16 h-10 rounded-xl object-cover border border-sky-400/40"
                    />
                  </div>
                  <h3 className="text-lg font-extrabold font-display">
                    Silver VIP Promotion & High Commission Matrix
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Selected Currency Live Mining:</strong>{' '}
                        <strong className="text-emerald-400">
                          Daily 8% (+{formatSiteAmount(280, activeCurrency)}/day · 240%/30d)
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Registration only members:</strong> 1 Friend registration ={' '}
                        <strong className="text-sky-400">
                          {formatSiteAmount(30, activeCurrency)}
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Task:</strong> Build 5 deposit members ={' '}
                        <strong className="text-pink-400">
                          {formatSiteAmount(1500, activeCurrency)}
                        </strong>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Creative 5-Level Percentage Breakdown for Silver */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-sky-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sky-300 font-bold">
                      5-Level Deposit Commission Percentages
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-extrabold text-[11px]">
                      34% Total Pool
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {SILVER_COMMISSION_LEVELS.map((lv) => (
                      <div
                        key={lv.level}
                        className="p-2.5 rounded-2xl bg-gradient-to-b from-sky-500/20 via-blue-500/15 to-pink-500/15 border border-sky-500/30 space-y-1.5"
                      >
                        <div className="text-[10px] font-mono font-bold text-sky-200">
                          L{lv.level}
                        </div>
                        <div className="text-base font-extrabold font-mono text-sky-400">
                          {lv.ratePercent}%
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                            style={{ width: `${Math.min(100, (lv.ratePercent / 25) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[9px] font-mono text-emerald-300">
                          +{formatSiteAmount((3500 * lv.ratePercent) / 100, activeCurrency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gold Benefits Card */}
              <div
                className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-[#151d30] border-rose-500/40' : 'bg-white border-rose-300 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-blue-600 text-white text-xs font-bold">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Zentro Gold Benefits ({formatSiteAmount(5000, activeCurrency)})</span>
                    </div>
                    <img
                      src={VIP_TIERS[3].imageUrl}
                      alt="Zentro Gold"
                      className="w-16 h-10 rounded-xl object-cover border border-rose-400/40"
                    />
                  </div>
                  <h3 className="text-lg font-extrabold font-display">
                    Share Your Link & Promote Our Platform
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Selected Currency Live Mining:</strong>{' '}
                        <strong className="text-emerald-400">
                          Daily 10% (+{formatSiteAmount(500, activeCurrency)}/day · 300%/30d)
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Registration only members:</strong> 1 Friend registration ={' '}
                        <strong className="text-pink-400">
                          {formatSiteAmount(50, activeCurrency)}
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Task:</strong> Build 5 deposit members team ={' '}
                        <strong className="text-rose-400">
                          {formatSiteAmount(3000, activeCurrency)}
                        </strong>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Creative 5-Level Percentage Breakdown for Gold */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-rose-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-300 font-bold">
                      5-Level Deposit Commission Percentages
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[11px]">
                      44% Total Pool
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {GOLD_COMMISSION_LEVELS.map((lv) => (
                      <div
                        key={lv.level}
                        className="p-2.5 rounded-2xl bg-gradient-to-b from-pink-500/20 via-rose-500/15 to-blue-500/15 border border-rose-500/30 space-y-1.5"
                      >
                        <div className="text-[10px] font-mono font-bold text-rose-200">
                          L{lv.level}
                        </div>
                        <div className="text-base font-extrabold font-mono text-rose-400">
                          {lv.ratePercent}%
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500"
                            style={{ width: `${Math.min(100, (lv.ratePercent / 25) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[9px] font-mono text-emerald-300">
                          +{formatSiteAmount((5000 * lv.ratePercent) / 100, activeCurrency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platinum Benefits Card */}
              <div
                className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-[#151d30] border-blue-500/40' : 'bg-white border-blue-300 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-400 via-blue-600 to-pink-500 text-white text-xs font-bold">
                      <Crown className="w-3.5 h-3.5" />
                      <span>
                        Zentro Platinum Benefits ({formatSiteAmount(10000, activeCurrency)})
                      </span>
                    </div>
                    <img
                      src={VIP_TIERS[4].imageUrl}
                      alt="Zentro Platinum"
                      className="w-16 h-10 rounded-xl object-cover border border-sky-400/40"
                    />
                  </div>
                  <h3 className="text-lg font-extrabold font-display">
                    Share Your Link & Promote Our Platform
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Selected Currency Live Mining:</strong>{' '}
                        <strong className="text-emerald-400">
                          Daily 12% (+{formatSiteAmount(1200, activeCurrency)}/day · 360%/30d)
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Registration only members:</strong> 1 Friend registration ={' '}
                        <strong className="text-sky-400">
                          {formatSiteAmount(100, activeCurrency)}
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Task:</strong> Build 5 deposit members team ={' '}
                        <strong className="text-pink-400">
                          {formatSiteAmount(5000, activeCurrency)}
                        </strong>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Creative 5-Level Percentage Breakdown for Platinum */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sky-300 font-bold">
                      5-Level Deposit Commission Percentages
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-extrabold text-[11px]">
                      61% Total Pool
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {PLATINUM_COMMISSION_LEVELS.map((lv) => (
                      <div
                        key={lv.level}
                        className="p-2.5 rounded-2xl bg-gradient-to-b from-sky-500/20 via-blue-500/15 to-pink-500/15 border border-blue-500/30 space-y-1.5"
                      >
                        <div className="text-[10px] font-mono font-bold text-sky-200">
                          L{lv.level}
                        </div>
                        <div className="text-base font-extrabold font-mono text-sky-400">
                          {lv.ratePercent}%
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-pink-500"
                            style={{ width: `${Math.min(100, (lv.ratePercent / 25) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[9px] font-mono text-emerald-300">
                          +{formatSiteAmount((10000 * lv.ratePercent) / 100, activeCurrency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MY TAB ================= */}
        {activeTab === 'my' && (
          <MyTab
            profile={profile}
            transactions={transactions}
            bankAccounts={bankAccounts}
            kycRecord={kycRecord}
            referrals={referrals}
            initialSubTab={myInitialSubTab}
            onUpdateProfile={async (data) => {
              try {
                if (authUser) {
                  await updateDoc(doc(db, 'users', profile.uid), {
                    ...data,
                    updatedAt: serverTimestamp(),
                  });
                } else {
                  const updatedProfile = {
                    ...profile,
                    ...data,
                    updatedAt: new Date().toISOString(),
                  };
                  setProfile(updatedProfile);
                  saveLocalUserRecord(updatedProfile);
                }
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
              }
            }}
            onSubmitKyc={async (data) => {
              try {
                const nowIso = new Date().toISOString();
                const fullLocalKycRecord: KycRecordData = {
                  id: `kyc_${profile.uid}`,
                  userId: profile.uid,
                  username: profile.username,
                  mobile: `${profile.countryCode || ''} ${profile.mobile || ''}`.trim(),
                  country: profile.country || '',
                  fullName: data.fullName,
                  documentType: data.documentType,
                  documentNumber: data.documentNumber,
                  aiVerificationNotes: (data.aiVerificationNotes || '').slice(0, 950),
                  documentImageDataUrl: data.documentImageDataUrl,
                  documentBackImageDataUrl: data.documentBackImageDataUrl,
                  documentFileName: data.documentFileName,
                  documentBackFileName: data.documentBackFileName,
                  processingStage: 'processing',
                  status: 'pending',
                  createdAt: kycRecord?.createdAt || nowIso,
                  updatedAt: nowIso,
                };

                // Save full KYC record (including uploaded document image base64) to local storage for Admin review
                saveLocalKycRequest(fullLocalKycRecord);

                if (authUser) {
                  const kycRef = doc(db, 'kyc_records', profile.uid);
                  await setDoc(kycRef, {
                    userId: profile.uid,
                    fullName: data.fullName,
                    documentType: data.documentType,
                    documentNumber: data.documentNumber,
                    aiVerificationNotes: (data.aiVerificationNotes || '').slice(0, 950),
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });
                  await updateDoc(doc(db, 'users', profile.uid), {
                    kycStatus: 'pending',
                    updatedAt: serverTimestamp(),
                  });
                }

                const updatedProfile: UserProfile = {
                  ...profile,
                  kycStatus: 'pending',
                  updatedAt: nowIso,
                };
                setKycRecord(fullLocalKycRecord);
                setProfile(updatedProfile);
                saveLocalUserRecord(
                  updatedProfile,
                  undefined,
                  undefined,
                  undefined,
                  fullLocalKycRecord
                );

                pushUserNotification(profile.uid, {
                  title: 'KYC Application Submitted — Processing Admin Review',
                  titleSi: 'KYC අයදුම්පත යොමු කරන ලදී — පරිපාලක (Admin) පරීක්ෂාවේ පවතී',
                  message: `Your identity document (${data.documentType.toUpperCase()}: ${data.documentNumber}) for ${data.fullName} has been submitted and is awaiting manual verification by Zentro Admin.`,
                  messageSi: `${data.fullName} සඳහා ඔබගේ ${data.documentType.toUpperCase()} අනන්‍යතා ලේඛනය යොමු කර ඇති අතර දැනට Admin අනුමැතිය සඳහා Processing තත්ත්වයේ පවතී.`,
                  category: 'security',
                  priority: 'high',
                  actionTab: 'my',
                  actionLabel: 'Track KYC Progress',
                  actionLabelSi: 'KYC ප්‍රගතිය බලන්න',
                });
                showNotice(
                  tr(
                    profile,
                    'KYC Documents Submitted! Status: Processing (Awaiting Admin Verification).',
                    'KYC ලේඛන යොමු කරන ලදී! දැන් Admin අනුමැතිය සඳහා Processing තත්ත්වයේ පවතී.'
                  )
                );
              } catch (error) {
                handleFirestoreError(
                  error,
                  OperationType.WRITE,
                  `kyc_records/${profile.uid}`
                );
              }
            }}
            onAddBankAccount={handleBindBankOrWalletAccount}
            onQuickChangeLanguage={handleQuickLanguageChange}
            onOpenCustomerSupport={() => handleSelectTab('support')}
            onSignOut={handleSignOutAll}
            onDeleteBankAccount={async (bankId) => {
              try {
                if (authUser) {
                  await deleteDoc(doc(db, 'bank_accounts', bankId));
                } else {
                  const nextBanks = bankAccounts.filter((b) => b.id !== bankId);
                  setBankAccounts(nextBanks);
                  saveLocalUserRecord(profile, undefined, undefined, nextBanks);
                }
                showNotice('Bank account removed.');
              } catch (error) {
                handleFirestoreError(error, OperationType.DELETE, `bank_accounts/${bankId}`);
              }
            }}
          />
        )}

        {activeTab === 'support' && (
          <CustomerSupportPage
            profile={profile}
            isDark={isDark}
            onBack={() => handleSelectTab('home')}
          />
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Mobile Tab Bar (Home, Team, Task, VIP, My) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 items-center h-16 border-t backdrop-blur-xl ${
          isDark ? 'bg-[#101626]/95 border-white/10' : 'bg-white/95 border-pink-200'
        }`}
      >
        {(
          [
            { id: 'home', label: tr(profile, 'Home', 'මුල් පිටුව'), icon: HomeIcon },
            { id: 'team', label: tr(profile, 'Team', 'කණ්ඩායම'), icon: Users },
            { id: 'task', label: tr(profile, 'Task', 'කාර්යයන්'), icon: ListChecks },
            { id: 'vip', label: tr(profile, 'VIP', 'VIP'), icon: Crown },
            { id: 'my', label: tr(profile, 'My', 'මගේ ගිණුම'), icon: UserIcon },
          ] as const
        ).map((tab) => {
          const IconComp = tab.icon;
          const isAct = activeTab === tab.id;
          const isLocked = !setupDone && tab.id !== 'my';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
                isAct
                  ? 'text-pink-500 font-bold'
                  : isLocked
                    ? 'text-slate-400/50'
                    : 'text-slate-400'
              }`}
            >
              {isAct && (
                <motion.div
                  layoutId="bottomTabActiveIndicator"
                  className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-gradient-to-r from-sky-400 via-pink-500 to-rose-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative">
                <IconComp className="w-5 h-5" />
                {isLocked && (
                  <Lock className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1.5" />
                )}
              </div>
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ================= DEDICATED MULTI-STEP DEPOSIT AREA MODAL ================= */}
      {activeModal === 'deposit' && (
        <DepositAreaModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setModalError(null);
          }}
          profile={profile}
          isDark={isDark}
          initialAmountInCurrency={depositAmount}
          initialNotice={modalError}
          onSubmitDepositRequest={handleSubmitDepositRequest}
        />
      )}

      {/* ================= DEDICATED MULTI-STEP WITHDRAW AREA MODAL ================= */}
      {activeModal === 'withdrawal' && (
        <WithdrawAreaModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setModalError(null);
          }}
          profile={profile}
          isDark={isDark}
          bankAccounts={bankAccounts}
          onBindAccount={handleBindBankOrWalletAccount}
          onNavigateToMyBank={() => {
            setActiveModal(null);
            setMyInitialSubTab('bank');
            handleSelectTab('my');
          }}
          onNavigateToKyc={() => {
            setActiveModal(null);
            setMyInitialSubTab('kyc');
            handleSelectTab('my');
          }}
          onNavigateToVip={() => {
            setActiveModal(null);
            handleSelectTab('vip');
          }}
          onSubmitWithdrawalRequest={handleSubmitWithdrawalRequest}
        />
      )}

      {/* ================= DEDICATED TEAM DETAILS ANALYTICS MODAL ================= */}
      {isTeamDetailsModalOpen && profile && (
        <TeamDetailsModal
          isOpen={isTeamDetailsModalOpen}
          onClose={() => setIsTeamDetailsModalOpen(false)}
          profile={profile}
          isDark={isDark}
          referrals={referrals}
          onOpenVipTab={() => {
            setIsTeamDetailsModalOpen(false);
            handleSelectTab('vip');
          }}
        />
      )}

      {/* ================= MODALS FOR OTHER HOME QUICK ACTIONS & COMPARE TIERS ================= */}
      {activeModal && activeModal !== 'deposit' && activeModal !== 'withdrawal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div
            className={`${
              activeModal === 'compare_tiers'
                ? 'max-w-6xl max-h-[90vh] overflow-y-auto'
                : 'max-w-md'
            } w-full rounded-3xl border p-6 space-y-4 ${
              isDark
                ? 'bg-[#101626] border-pink-500/30 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  {activeModal === 'active_vip' && 'Your Active VIP Standing'}
                  {activeModal === 'support' && 'Zentro 24/7 Priority Customer Support'}
                  {activeModal === 'compare_tiers' && (
                    <>
                      <Crown className="w-5 h-5 text-pink-500" />
                      <span>
                        {tr(
                          profile,
                          'VIP Tiers Side-by-Side Comparison',
                          'VIP මට්ටම් සවිස්තරාත්මක සංසන්දනය'
                        )}
                      </span>
                    </>
                  )}
                </h3>
                {activeModal === 'compare_tiers' && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tr(
                      profile,
                      `Compare daily tasks, multi-level commission rates, and live ${activeCurrency} mining yields across all tiers.`,
                      `සියලුම VIP මට්ටම්වල දෛනික කාර්යයන්, කොමිස් ප්‍රතිශත සහ ${activeCurrency} මයිනින් ප්‍රතිලාභ සසඳන්න.`
                    )}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-pink-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                {modalError}
              </div>
            )}

            {activeModal === 'compare_tiers' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                  <table className="w-full text-left border-collapse text-xs min-w-[780px]">
                    <thead>
                      <tr
                        className={`border-b ${
                          isDark
                            ? 'bg-[#151d30] border-white/10'
                            : 'bg-pink-50/70 border-pink-200/80'
                        }`}
                      >
                        <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] text-slate-400 w-52">
                          {tr(profile, 'Feature / Metric', 'විශේෂාංගය')}
                        </th>
                        {VIP_TIERS.map((tier) => {
                          const isCurrent = profile.vipLevel === tier.level;
                          const headerBadge =
                            tier.level === 0
                              ? 'from-slate-500 to-slate-600'
                              : tier.level === 1
                                ? 'from-amber-600 to-orange-500'
                                : tier.level === 2
                                  ? 'from-slate-400 to-blue-500'
                                  : tier.level === 3
                                    ? 'from-yellow-400 to-amber-500'
                                    : 'from-sky-400 via-pink-500 to-rose-500';
                          return (
                            <th
                              key={tier.level}
                              className={`py-3.5 px-4 text-center align-top ${
                                isCurrent
                                  ? isDark
                                    ? 'bg-pink-500/15'
                                    : 'bg-pink-500/10'
                                  : ''
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1.5">
                                <img
                                  src={tier.imageUrl}
                                  alt={tier.name}
                                  className="w-20 h-12 rounded-xl object-cover border border-white/25 shadow-sm"
                                />
                                <span
                                  className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${headerBadge} text-white font-bold text-[10px] shadow-sm whitespace-nowrap`}
                                >
                                  {tier.level === 0 ? 'STARTER (VIP 0)' : `VIP ${tier.level}`}
                                </span>
                                <span className="font-display font-extrabold text-sm whitespace-nowrap">
                                  {tier.level === 0 ? 'Starter' : tier.name}
                                </span>
                                <span className="font-mono font-bold text-pink-500 dark:text-pink-400 text-xs">
                                  {tier.unlockAmount === 0
                                    ? tr(profile, 'Free', 'නොමිලේ')
                                    : formatSiteAmount(tier.unlockAmount, activeCurrency)}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
                                    CURRENT TIER
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                      {/* SECTION 1: MINING YIELDS */}
                      <tr
                        className={
                          isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                        }
                      >
                        <td
                          colSpan={VIP_TIERS.length + 1}
                          className="py-2 px-4 font-mono font-bold text-[11px] uppercase tracking-wider"
                        >
                          1. {tr(profile, 'Live Currency Mining Yields', 'සජීවී මයිනින් ප්‍රතිලාභ')} (
                          {activeCurrency})
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">
                          {tr(profile, 'Daily Mining Rate (%)', 'දෛනික මයිනින් ප්‍රතිශතය')}
                        </td>
                        {VIP_TIERS.map((tier) => (
                          <td
                            key={tier.level}
                            className={`py-3 px-4 text-center font-mono font-extrabold ${
                              profile.vipLevel === tier.level
                                ? 'bg-pink-500/10'
                                : ''
                            } ${
                              tier.dailyMiningRatePercent > 0
                                ? 'text-emerald-400 text-sm'
                                : 'text-slate-400'
                            }`}
                          >
                            {tier.dailyMiningRatePercent > 0
                              ? `${tier.dailyMiningRatePercent}% / day`
                              : 'Locked (0%)'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">
                          {tr(profile, 'Daily Mining Yield', 'දෛනික මයිනින් ආදායම')}
                        </td>
                        {VIP_TIERS.map((tier) => {
                          const dailyMine =
                            (tier.unlockAmount * tier.dailyMiningRatePercent) / 100;
                          return (
                            <td
                              key={tier.level}
                              className={`py-3 px-4 text-center font-mono font-bold ${
                                profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                              } ${dailyMine > 0 ? 'text-emerald-400' : 'text-slate-400'}`}
                            >
                              {dailyMine > 0
                                ? `+${formatSiteAmount(dailyMine, activeCurrency)}/day`
                                : '—'}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">
                          {tr(profile, '30-Day Mining Projection', 'දින 30 මයිනින් ආදායම')}
                        </td>
                        {VIP_TIERS.map((tier) => {
                          const monthlyMine =
                            ((tier.unlockAmount * tier.dailyMiningRatePercent) / 100) * 30;
                          return (
                            <td
                              key={tier.level}
                              className={`py-3 px-4 text-center font-mono font-bold ${
                                profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                              } ${monthlyMine > 0 ? 'text-sky-400' : 'text-slate-400'}`}
                            >
                              {monthlyMine > 0
                                ? `+${formatSiteAmount(monthlyMine, activeCurrency)}`
                                : '—'}
                            </td>
                          );
                        })}
                      </tr>

                      {/* SECTION 2: DAILY TASKS */}
                      <tr
                        className={
                          isDark ? 'bg-pink-500/10 text-pink-300' : 'bg-pink-50 text-pink-800'
                        }
                      >
                        <td
                          colSpan={VIP_TIERS.length + 1}
                          className="py-2 px-4 font-mono font-bold text-[11px] uppercase tracking-wider"
                        >
                          2. {tr(profile, 'Daily Tasks & Team Milestones', 'දෛනික කාර්යයන් සහ ඉපැයීම්')}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">
                          {tr(profile, 'Daily Tasks Quota', 'දෛනික කාර්යයන් ගණන')}
                        </td>
                        {VIP_TIERS.map((tier) => (
                          <td
                            key={tier.level}
                            className={`py-3 px-4 text-center font-mono font-bold ${
                              profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                            }`}
                          >
                            {tier.dailyTasks} Tasks / day
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">
                          {tr(profile, 'Reward per Task', 'එක් කාර්යයකට ගෙවීම')}
                        </td>
                        {VIP_TIERS.map((tier) => (
                          <td
                            key={tier.level}
                            className={`py-3 px-4 text-center font-mono font-bold text-pink-400 ${
                              profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                            }`}
                          >
                            +{formatSiteAmount(tier.rewardPerTask, activeCurrency)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">
                          {tr(profile, 'Daily Task Yield', 'දෛනික කාර්ය මුළු ආදායම')}
                        </td>
                        {VIP_TIERS.map((tier) => (
                          <td
                            key={tier.level}
                            className={`py-3 px-4 text-center font-mono font-extrabold text-pink-500 ${
                              profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                            }`}
                          >
                            +{formatSiteAmount(tier.dailyYield, activeCurrency)}/day
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">
                          {tr(profile, '5 Deposit Members Team Task', 'සාමාජිකයන් 5 කණ්ඩායම් දීමනාව')}
                        </td>
                        {VIP_TIERS.map((tier) => (
                          <td
                            key={tier.level}
                            className={`py-3 px-4 text-center font-mono font-bold ${
                              profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                            } ${tier.teamTaskReward > 0 ? 'text-amber-400' : 'text-slate-400'}`}
                          >
                            {tier.teamTaskReward > 0
                              ? `+${formatSiteAmount(tier.teamTaskReward, activeCurrency)}`
                              : 'Locked'}
                          </td>
                        ))}
                      </tr>

                      {/* SECTION 3: COMMISSION RATES */}
                      <tr
                        className={
                          isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-800'
                        }
                      >
                        <td
                          colSpan={VIP_TIERS.length + 1}
                          className="py-2 px-4 font-mono font-bold text-[11px] uppercase tracking-wider"
                        >
                          3.{' '}
                          {tr(
                            profile,
                            'Referral & 5-Level Deposit Commission Rates',
                            'යොමු කිරීම් සහ මට්ටම් 5 කොමිස් ප්‍රතිශත'
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">
                          {tr(profile, '1 Friend Registration Bonus', 'මිතුරෙකු ලියාපදිංචි කිරීමේ දීමනාව')}
                        </td>
                        {VIP_TIERS.map((tier) => (
                          <td
                            key={tier.level}
                            className={`py-3 px-4 text-center font-mono font-bold ${
                              profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                            } ${
                              tier.registrationBonusPerFriend > 0
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {tier.registrationBonusPerFriend > 0
                              ? `+${formatSiteAmount(tier.registrationBonusPerFriend, activeCurrency)}`
                              : 'Locked'}
                          </td>
                        ))}
                      </tr>
                      {[1, 2, 3, 4, 5].map((lvNum) => (
                        <tr key={lvNum}>
                          <td className="py-2.5 px-4 font-mono text-slate-400">
                            Level {lvNum} Deposit Commission
                          </td>
                          {VIP_TIERS.map((tier) => {
                            const foundLv = tier.commissionLevels.find(
                              (c) => c.level === lvNum
                            );
                            return (
                              <td
                                key={tier.level}
                                className={`py-2.5 px-4 text-center font-mono font-bold ${
                                  profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                                } ${tier.level === 0 ? 'text-slate-500' : 'text-sky-400'}`}
                              >
                                {tier.level === 0
                                  ? 'Locked'
                                  : `${foundLv ? foundLv.ratePercent : 0}%`}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-400">
                          {tr(profile, 'Total 5-Level Commission Pool', 'මුළු මට්ටම් 5 කොමිස් එකතුව')}
                        </td>
                        {VIP_TIERS.map((tier) => {
                          const totalRate = tier.commissionLevels.reduce(
                            (acc, item) => acc + item.ratePercent,
                            0
                          );
                          return (
                            <td
                              key={tier.level}
                              className={`py-3 px-4 text-center font-mono font-extrabold ${
                                profile.vipLevel === tier.level ? 'bg-pink-500/10' : ''
                              } ${tier.level === 0 ? 'text-slate-500' : 'text-pink-400 text-sm'}`}
                            >
                              {tier.level === 0 ? '0% (VIP Required)' : `${totalRate}% Total`}
                            </td>
                          );
                        })}
                      </tr>

                      {/* ACTION ROW */}
                      <tr>
                        <td className="py-3.5 px-4 font-bold text-slate-400">
                          {tr(profile, 'Tier Status / Upgrade', 'මට්ටම සක්‍රිය කරන්න')}
                        </td>
                        {VIP_TIERS.map((tier) => {
                          const isCurrent = profile.vipLevel === tier.level;
                          const isLowerThanCurrent = tier.level < profile.vipLevel;
                          return (
                            <td
                              key={tier.level}
                              className={`py-3.5 px-3 text-center ${
                                isCurrent ? 'bg-pink-500/10' : ''
                              }`}
                            >
                              {tier.level === 0 ? (
                                <span className="text-[11px] font-mono text-slate-400">
                                  {isCurrent ? 'Current Starter' : 'Base Account'}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isCurrent}
                                  onClick={() => {
                                    setActiveModal(null);
                                    handleUpgradeVip(tier);
                                  }}
                                  className={`w-full py-2 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-pink-500/20 text-pink-400 cursor-default'
                                      : isLowerThanCurrent
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                                        : 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white shadow-sm'
                                  }`}
                                >
                                  {isCurrent
                                    ? 'Active Tier'
                                    : isLowerThanCurrent
                                      ? `Buy VIP ${tier.level}`
                                      : `Activate VIP ${tier.level}`}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeModal === 'active_vip' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 via-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center gap-4">
                  <img
                    src={currentVip.imageUrl}
                    alt={currentVip.name}
                    className="w-24 h-16 rounded-xl object-cover border border-pink-500/40 shadow-md shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="font-mono text-pink-400 font-bold">
                      CURRENT ACTIVE MEMBERSHIP
                    </div>
                    <div className="text-lg font-extrabold">{currentVip.name}</div>
                    <div className="text-slate-300">
                      Daily Quota: {currentVip.dailyTasks} tasks · +
                      {formatSiteAmount(currentVip.rewardPerTask, activeCurrency)}/task
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setModalError(null);
                      setActiveModal('compare_tiers');
                    }}
                    className="py-3 px-4 rounded-2xl border border-pink-500/40 text-pink-400 font-bold cursor-pointer hover:bg-pink-500/10"
                  >
                    Compare Tiers
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      handleSelectTab('vip');
                    }}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-bold cursor-pointer"
                  >
                    View VIP Tab
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'support' && (
              <div className="space-y-3">
                <div
                  className={`h-56 overflow-y-auto space-y-2.5 p-3 rounded-2xl text-xs ${
                    isDark ? 'bg-[#182032]' : 'bg-slate-50'
                  }`}
                >
                  {supportMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white ml-8 font-medium'
                          : isDark
                            ? 'bg-[#101626] border border-white/10 mr-8'
                            : 'bg-white border border-slate-200 mr-8'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  {supportLoading && (
                    <div className="text-pink-400 font-mono text-[11px]">
                      Zentro Support Desk typing (gemini-3.1-flash-lite)...
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendSupportMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={supportInput}
                    onChange={(e) => setSupportInput(e.target.value)}
                    placeholder="Ask Customer Support..."
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border ${
                      isDark ? 'bg-[#182032] border-white/15' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={supportLoading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= NOTIFICATION CENTER MODAL ================= */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        isDark={isDark}
        profile={profile}
        notifications={notifications}
        soundEnabled={notifAlertsEnabled}
        onToggleSound={() => {
          const next = !notifAlertsEnabled;
          setNotifAlertsEnabled(next);
          localStorage.setItem('zentro_notif_alerts_enabled', String(next));
        }}
        onMarkAsRead={(id) => markNotificationAsRead(profile.uid, id)}
        onMarkAllAsRead={() => markAllNotificationsAsRead(profile.uid)}
        onDeleteNotification={(id) => deleteUserNotification(profile.uid, id)}
        onClearReadNotifications={() => clearReadUserNotifications(profile.uid)}
        onNavigateAction={(tab, modal, notifId) => {
          if (notifId) {
            markNotificationAsRead(profile.uid, notifId);
          }
          setIsNotificationCenterOpen(false);
          if (modal === 'support') {
            handleSelectTab('support');
            return;
          }
          if (tab) {
            handleSelectTab(tab);
          }
          if (modal) {
            setModalError(null);
            setActiveModal(modal);
          }
        }}
      />

      <footer className="py-5 px-6 border-t border-slate-200/50 dark:border-white/10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Zentro Official Sponsor Partner Platform · Zero-Trust
        Firestore Ledger
      </footer>
    </div>
  );
}
