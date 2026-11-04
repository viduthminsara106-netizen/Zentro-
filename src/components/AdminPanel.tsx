import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Crown,
  Edit3,
  Eye,
  FileImage,
  Flame,
  Globe,
  History,
  ListChecks,
  Lock,
  LogOut,
  Megaphone,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
  Unlock,
  UserPlus,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import {
  ADMIN_LOGIN_ID,
  AppNotification,
  BankAccountRecord,
  DepositRequestRecord,
  KycRecordData,
  NotificationCategory,
  NotificationPriority,
  OfficialSettlementBank,
  PLATFORM_DAILY_TASKS,
  ReferralRecordData,
  SPONSOR_COUNTRIES,
  TransactionRecord,
  UsdtNetworkOption,
  UserProfile,
  VIP_TIERS,
  WithdrawalRequestRecord,
  ZENTRO_ATRIUM_BG_DATA_URI,
  ZENTRO_ATRIUM_LIGHT_BG_DATA_URI,
  ZENTRO_LOGO_URL,
  deleteGlobalBroadcastNotification,
  deleteUserFromCentralDatabaseAndLocal,
  distributeFiveLevelVipAndDepositCommissions,
  formatCurrencyValue,
  formatSiteAmount,
  getActiveCurrency,
  getCommissionLevelsForVip,
  getGlobalBroadcastNotifications,
  getLocalDepositRequests,
  getLocalKycRequestByUser,
  getLocalKycRequests,
  getLocalWithdrawalRequests,
  getOfficialDepositBanks,
  getOfficialUsdtAddresses,
  getPlatformSponsorGlobalStats,
  pushGlobalBroadcastNotification,
  pushUserNotification,
  recordFiveLevelReferralOnRegistration,
  saveOfficialDepositBanks,
  saveOfficialUsdtAddresses,
  savePlatformSponsorGlobalStats,
  syncCentralDatabaseWithServer,
  updateGlobalBroadcastNotification,
  updateLocalDepositRequestStatus,
  updateLocalKycRequestStatus,
  updateLocalWithdrawalRequestStatus,
} from '../types';
import {
  AdminSponsorCountriesManager,
  AdminVipPackagesManager,
  AdminTasksManager,
  AdminVipDayChallengesManager,
} from './AdminCatalogManagers';
import { CustomerSupportPage } from './CustomerSupportPage';

export interface AdminUserBundle {
  uid: string;
  profile: UserProfile;
  password: string;
  transactions: TransactionRecord[];
  bankAccounts: BankAccountRecord[];
  kycRecord: KycRecordData | null;
  referrals: ReferralRecordData[];
  depositRequests: DepositRequestRecord[];
  withdrawalRequests: WithdrawalRequestRecord[];
  isCurrentlyLoggedIn: boolean;
}

interface AdminPanelProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onExitAdmin: () => void;
  onAdminMutateUser?: (uid: string) => void;
  onForceLogoutActiveUser?: (uid: string) => void;
}

type AdminTabId =
  | 'users'
  | 'kyc_requests'
  | 'deposits'
  | 'withdrawals'
  | 'notifications'
  | 'live_chat'
  | 'sponsors'
  | 'vip_manager'
  | 'tasks_manager'
  | 'day_challenges';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isDark,
  onToggleTheme,
  onExitAdmin,
  onAdminMutateUser,
  onForceLogoutActiveUser,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('users');
  const [userBundles, setUserBundles] = useState<AdminUserBundle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [vipFilter, setVipFilter] = useState<string>('all');
  const [depositFilter, setDepositFilter] = useState<
    'all' | 'pending_admin' | 'approved' | 'rejected'
  >('all');
  const [withdrawFilter, setWithdrawFilter] = useState<
    'all' | 'pending_admin' | 'approved' | 'rejected'
  >('all');
  const [kycFilter, setKycFilter] = useState<
    'all' | 'pending' | 'verified' | 'rejected'
  >('all');
  const [allKycRecords, setAllKycRecords] = useState<KycRecordData[]>([]);
  const [viewingKycModal, setViewingKycModal] = useState<{
    record: KycRecordData | null;
    bundle: AdminUserBundle;
  } | null>(null);
  const [adminKycNoteInput, setAdminKycNoteInput] = useState<string>('');

  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals for User Management
  const [editingBalanceUser, setEditingBalanceUser] = useState<AdminUserBundle | null>(
    null
  );
  const [balanceMode, setBalanceMode] = useState<'set' | 'add' | 'deduct'>('set');
  const [balanceInputLkr, setBalanceInputLkr] = useState<string>('0');
  const [balanceNote, setBalanceNote] = useState<string>('');

  const [editingVipUser, setEditingVipUser] = useState<AdminUserBundle | null>(null);
  const [selectedNewVip, setSelectedNewVip] = useState<number>(1);

  const [viewingTxUser, setViewingTxUser] = useState<AdminUserBundle | null>(null);
  const [viewingRefUser, setViewingRefUser] = useState<AdminUserBundle | null>(null);
  const [viewingReceiptDeposit, setViewingReceiptDeposit] = useState<{
    deposit: DepositRequestRecord;
    user: UserProfile | null;
  } | null>(null);
  const [viewingUserBanksModal, setViewingUserBanksModal] =
    useState<AdminUserBundle | null>(null);

  // Admin Add User & Delete User states + Quick All Members Count state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newCountryCode, setNewCountryCode] = useState<string>('🇱🇰 +94');
  const [newMobile, setNewMobile] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('zentro123');
  const [newSecurityPin, setNewSecurityPin] = useState<string>('888888');
  const [newCountry, setNewCountry] = useState<string>('Sri Lanka');
  const [newCurrency, setNewCurrency] = useState<string>('LKR');
  const [newVipLevel, setNewVipLevel] = useState<number>(1);
  const [newBalanceLkr, setNewBalanceLkr] = useState<string>('100');
  const [newKycStatus, setNewKycStatus] = useState<'unverified' | 'pending' | 'verified'>('verified');
  const [newReferredBy, setNewReferredBy] = useState<string>('ZENTRO-VIP888');

  const [deletingUserBundle, setDeletingUserBundle] = useState<AdminUserBundle | null>(null);
  const [quickAllMembersCount, setQuickAllMembersCount] = useState<string>(() =>
    String(getPlatformSponsorGlobalStats().totalMembersCount)
  );

  // Admin Notification & Broadcast composer state
  const [notifTargetUid, setNotifTargetUid] = useState<string>('ALL');
  const [notifCategory, setNotifCategory] = useState<NotificationCategory>('system');
  const [notifPriority, setNotifPriority] = useState<NotificationPriority>('high');
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifTitleSi, setNotifTitleSi] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [notifMessageSi, setNotifMessageSi] = useState<string>('');
  const [notifActionTab, setNotifActionTab] = useState<
    'none' | 'home' | 'team' | 'task' | 'vip' | 'my'
  >('vip');
  const [globalBroadcasts, setGlobalBroadcasts] = useState<AppNotification[]>([]);
  const [editingBroadcastId, setEditingBroadcastId] = useState<string | null>(null);

  // Admin Deposit Banks & USDT BEP-20 CRUD state
  const [officialDepositBanks, setOfficialDepositBanks] = useState<
    OfficialSettlementBank[]
  >(() => getOfficialDepositBanks());
  const [editingDepositBankId, setEditingDepositBankId] = useState<string | null>(null);
  const [bankFormName, setBankFormName] = useState<string>('');
  const [bankFormCountry, setBankFormCountry] = useState<string>('Sri Lanka');
  const [bankFormHolder, setBankFormHolder] = useState<string>(
    'ZENTRO HOLDINGS (PVT) LTD'
  );
  const [bankFormAccNo, setBankFormAccNo] = useState<string>('');
  const [bankFormBranch, setBankFormBranch] = useState<string>('');
  const [bankFormSwift, setBankFormSwift] = useState<string>('');

  const [officialUsdtList, setOfficialUsdtList] = useState<UsdtNetworkOption[]>(() =>
    getOfficialUsdtAddresses()
  );
  const [editingUsdtId, setEditingUsdtId] = useState<string | null>(null);
  const [usdtFormNetworkName, setUsdtFormNetworkName] = useState<string>(
    'BNB Smart Chain (BEP-20)'
  );
  const [usdtFormTokenStandard, setUsdtFormTokenStandard] =
    useState<string>('USDT-BEP20');
  const [usdtFormWalletAddress, setUsdtFormWalletAddress] = useState<string>('');
  const [usdtFormMinConf, setUsdtFormMinConf] = useState<string>('15');

  const showAdminNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4200);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Load all registered accounts and their associated transactions, banks, referrals, deposits, withdrawals
  const loadAllAdminData = () => {
    try {
      const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
      const accounts: Record<string, { profile: UserProfile; password: string }> =
        rawAccounts ? JSON.parse(rawAccounts) : {};
      const activeSessionUid = localStorage.getItem('zentro_active_session_uid');

      const bundles: AdminUserBundle[] = Object.entries(accounts).map(([uid, entry]) => {
        const rawTx = localStorage.getItem(`zentro_tx_${uid}`);
        const transactions: TransactionRecord[] = rawTx ? JSON.parse(rawTx) : [];

        const rawBanks = localStorage.getItem(`zentro_banks_${uid}`);
        const bankAccounts: BankAccountRecord[] = rawBanks ? JSON.parse(rawBanks) : [];

        const rawKyc = localStorage.getItem(`zentro_kyc_${uid}`);
        const legacyKyc: KycRecordData | null = rawKyc ? JSON.parse(rawKyc) : null;
        const storedKyc = getLocalKycRequestByUser(uid);
        const kycRecord: KycRecordData | null =
          storedKyc || legacyKyc
            ? ({
                ...legacyKyc,
                ...storedKyc,
                userId: uid,
                username: storedKyc?.username || entry.profile.username,
                mobile:
                  storedKyc?.mobile ||
                  `${entry.profile.countryCode || ''} ${entry.profile.mobile || ''}`.trim(),
                country: storedKyc?.country || entry.profile.country,
              } as KycRecordData)
            : null;

        const rawRefs = localStorage.getItem(`zentro_refs_${uid}`);
        const referrals: ReferralRecordData[] = rawRefs ? JSON.parse(rawRefs) : [];

        const depositRequests = getLocalDepositRequests(uid);
        const withdrawalRequests = getLocalWithdrawalRequests(uid);

        return {
          uid,
          profile: entry.profile,
          password: entry.password || 'zentro123',
          transactions,
          bankAccounts,
          kycRecord,
          referrals,
          depositRequests,
          withdrawalRequests,
          isCurrentlyLoggedIn: activeSessionUid === uid,
        };
      });

      // Sort newest first
      bundles.sort((a, b) => {
        const tA = new Date(a.profile.createdAt || 0).getTime();
        const tB = new Date(b.profile.createdAt || 0).getTime();
        return tB - tA;
      });

      setUserBundles(bundles);
      setAllKycRecords(getLocalKycRequests());
      setGlobalBroadcasts(getGlobalBroadcastNotifications());
      setOfficialDepositBanks(getOfficialDepositBanks());
      setOfficialUsdtList(getOfficialUsdtAddresses());

      // Keep open modals synced with fresh bundle data
      if (viewingTxUser) {
        const updated = bundles.find((b) => b.uid === viewingTxUser.uid);
        if (updated) setViewingTxUser(updated);
      }
      if (viewingRefUser) {
        const updated = bundles.find((b) => b.uid === viewingRefUser.uid);
        if (updated) setViewingRefUser(updated);
      }
      if (viewingUserBanksModal) {
        const updated = bundles.find((b) => b.uid === viewingUserBanksModal.uid);
        if (updated) setViewingUserBanksModal(updated);
      }
      if (viewingKycModal) {
        const updated = bundles.find((b) => b.uid === viewingKycModal.bundle.uid);
        if (updated) {
          setViewingKycModal({
            record: updated.kycRecord,
            bundle: updated,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  useEffect(() => {
    loadAllAdminData();
    syncCentralDatabaseWithServer().then(() => {
      loadAllAdminData();
      setQuickAllMembersCount(String(getPlatformSponsorGlobalStats().totalMembersCount));
    });
    const onKycUpdated = () => loadAllAdminData();
    const onDbSynced = () => {
      loadAllAdminData();
      setQuickAllMembersCount(String(getPlatformSponsorGlobalStats().totalMembersCount));
    };
    const onCatalogUpdated = () => {
      setQuickAllMembersCount(String(getPlatformSponsorGlobalStats().totalMembersCount));
    };
    window.addEventListener('zentro-kyc-updated', onKycUpdated);
    window.addEventListener('zentro-db-synced', onDbSynced);
    window.addEventListener('zentro-catalog-updated', onCatalogUpdated);
    return () => {
      window.removeEventListener('zentro-kyc-updated', onKycUpdated);
      window.removeEventListener('zentro-db-synced', onDbSynced);
      window.removeEventListener('zentro-catalog-updated', onCatalogUpdated);
    };
  }, []);

  // ================= ADMIN KYC APPROVE / REJECT / PROCESSING HANDLER =================
  const handleAdminKycDecision = (
    bundle: AdminUserBundle,
    nextStatus: 'pending' | 'verified' | 'rejected',
    processingStage: 'submitted' | 'processing' | 'verified' | 'rejected',
    customNote?: string
  ) => {
    const uid = bundle.uid;
    const nowIso = new Date().toISOString();
    const noteToSave = (customNote ?? adminKycNoteInput).trim();

    const updatedKyc = updateLocalKycRequestStatus(
      uid,
      nextStatus,
      processingStage,
      noteToSave || undefined
    );

    if (updatedKyc) {
      localStorage.setItem(`zentro_kyc_${uid}`, JSON.stringify(updatedKyc));
    }

    const updatedProfile: UserProfile = {
      ...bundle.profile,
      kycStatus: nextStatus,
      updatedAt: nowIso,
    };

    persistUserUpdate(uid, updatedProfile);

    if (nextStatus === 'verified') {
      pushUserNotification(uid, {
        title: 'KYC Identity Verified by Admin — Withdrawals Unlocked!',
        titleSi: 'ඔබගේ KYC අනන්‍යතාවය Admin විසින් තහවුරු කරන ලදී — දැන් මුදල් ආපසු ගත හැක!',
        message: `Congratulations ${bundle.profile.username}! Zentro Admin has inspected your uploaded ID document and verified your KYC status. Bank and USDT (BEP-20) withdrawals are now unlocked.`,
        messageSi: `සුබ පැතුම් ${bundle.profile.username}! Zentro Admin විසින් ඔබගේ හැඳුනුම්පත් ලේඛන පරීක්ෂා කර KYC සත්‍යාපනය අනුමත කර ඇත. දැන් ඔබට මුදල් ආපසු ගැනීම් (Withdrawals) සිදු කළ හැක.`,
        category: 'security',
        priority: 'high',
        actionTab: 'my',
        actionLabel: 'View Verified KYC',
        actionLabelSi: 'තහවුරු කළ KYC බලන්න',
      });
      showAdminNotice(`KYC Verified for ${bundle.profile.username}! Withdrawals are now unlocked for this user.`);
    } else if (nextStatus === 'rejected') {
      pushUserNotification(uid, {
        title: 'KYC Verification Rejected by Admin — Action Required',
        titleSi: 'KYC අයදුම්පත Admin විසින් ප්‍රතික්ෂේප කරන ලදී — නැවත යොමු කරන්න',
        message: noteToSave
          ? `Your KYC document was rejected by Admin. Note: "${noteToSave}". Please upload a clear ID photo in the My -> KYC tab.`
          : 'Your uploaded KYC document could not be verified by Admin. Please upload a clearer ID photo and resubmit in the My -> KYC tab.',
        messageSi: noteToSave
          ? `ඔබගේ KYC අයදුම්පත ප්‍රතික්ෂේප විය. Admin සටහන: "${noteToSave}". කරුණාකර පැහැදිලි හැඳුනුම්පත් ජායාරූපයක් නැවත යොමු කරන්න.`
          : 'ඔබ Upload කළ හැඳුනුම්පත් ජායාරූපය පැහැදිලි නොවන බැවින් ප්‍රතික්ෂේප විය. කරුණාකර My -> KYC වෙත ගොස් නැවත පැහැදිලි ජායාරූපයක් Upload කරන්න.',
        category: 'security',
        priority: 'urgent',
        actionTab: 'my',
        actionLabel: 'Resubmit KYC Document',
        actionLabelSi: 'නැවත KYC යොමු කරන්න',
      });
      showAdminNotice(`KYC Rejected for ${bundle.profile.username}. User notified to resubmit.`);
    } else {
      showAdminNotice(`KYC status set to Processing for ${bundle.profile.username}.`);
    }

    setAdminKycNoteInput('');
    loadAllAdminData();
  };

  // Helper to persist a single user's profile and transactions in localStorage
  const persistUserUpdate = (
    uid: string,
    updatedProfile: UserProfile,
    updatedTransactions?: TransactionRecord[],
    updatedReferrals?: ReferralRecordData[]
  ) => {
    try {
      const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
      const accounts: Record<string, { profile: UserProfile; password: string }> =
        rawAccounts ? JSON.parse(rawAccounts) : {};
      const existing = accounts[uid];
      accounts[uid] = {
        profile: updatedProfile,
        password: existing?.password || 'zentro123',
      };
      localStorage.setItem('zentro_accounts_db_v1', JSON.stringify(accounts));

      if (updatedTransactions !== undefined) {
        localStorage.setItem(`zentro_tx_${uid}`, JSON.stringify(updatedTransactions));
      }
      if (updatedReferrals !== undefined) {
        localStorage.setItem(`zentro_refs_${uid}`, JSON.stringify(updatedReferrals));
      }

      loadAllAdminData();
      syncCentralDatabaseWithServer({ forceOverwrite: true }).catch(() => {});
      if (onAdminMutateUser) {
        onAdminMutateUser(uid);
      }
    } catch (e) {
      console.error('Error persisting admin user update:', e);
    }
  };

  // ================= ADMIN ADD NEW USER & DELETE USER HANDLERS =================
  const handleCreateNewUserByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = newUsername.trim();
    const cleanEmail =
      newEmail.trim() || `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@zentro.io`;
    const cleanMobile = newMobile.trim() || '770000000';
    const cleanPassword = newPassword.trim() || 'zentro123';
    const cleanPin = newSecurityPin.trim() || '888888';

    if (!cleanUsername) {
      showAdminNotice('Please enter a username for the new user.');
      return;
    }

    const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
    const accounts: Record<string, { profile: UserProfile; password: string }> =
      rawAccounts ? JSON.parse(rawAccounts) : {};

    const duplicate = Object.values(accounts).find(
      (acc) =>
        acc?.profile &&
        (acc.profile.username.toLowerCase() === cleanUsername.toLowerCase() ||
          acc.profile.email.toLowerCase() === cleanEmail.toLowerCase())
    );
    if (duplicate) {
      showAdminNotice(`A user with username "${cleanUsername}" or email "${cleanEmail}" already exists.`);
      return;
    }

    const uid = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const generatedRefCode = `ZENTRO-${uid
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-6)
      .toUpperCase()}`;
    const initialBal = Math.max(0, Number(Number(newBalanceLkr || 0).toFixed(2)));
    const nowIso = new Date().toISOString();

    const createdProfile: UserProfile = {
      uid,
      username: cleanUsername.slice(0, 60),
      email: cleanEmail.slice(0, 120),
      countryCode: newCountryCode.trim() || '🇱🇰 +94',
      mobile: cleanMobile.slice(0, 30),
      country: newCountry.trim() || 'Sri Lanka',
      currency: newCurrency.trim() || 'LKR',
      language: 'English',
      deviceId: `ZNT-ADM-${uid.slice(-6).toUpperCase()}`,
      macAddress: '00:1A:2B:3C:4D:5E',
      ipAddress: 'Admin Created',
      locationTracked: `${newCountry.trim() || 'Sri Lanka'} (Admin Created)`,
      securityPasswordHash: cleanPin.slice(0, 128),
      referralCode: generatedRefCode,
      referredBy: (newReferredBy || 'ZENTRO-VIP888').trim().toUpperCase(),
      vipLevel: Number(newVipLevel) || 0,
      highestVipLevel: Number(newVipLevel) || 0,
      balance: initialBal,
      totalEarnings: 0,
      tasksCompletedToday: 0,
      kycStatus: newKycStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    accounts[uid] = {
      profile: createdProfile,
      password: cleanPassword,
    };
    localStorage.setItem('zentro_accounts_db_v1', JSON.stringify(accounts));

    const initTxList: TransactionRecord[] =
      initialBal > 0
        ? [
            {
              id: `tx_adm_init_${Date.now()}`,
              userId: uid,
              type: 'deposit',
              amount: initialBal,
              status: 'completed',
              description: `Initial Account Balance Credited by Admin (+${initialBal} LKR)`,
              createdAt: nowIso,
            },
          ]
        : [];
    localStorage.setItem(`zentro_tx_${uid}`, JSON.stringify(initTxList));
    localStorage.setItem(`zentro_banks_${uid}`, JSON.stringify([]));
    localStorage.setItem(`zentro_refs_${uid}`, JSON.stringify([]));

    if (newKycStatus === 'verified') {
      updateLocalKycRequestStatus(uid, 'verified', 'verified', 'Verified on creation by Admin');
    }

    // Record L1-L5 referral chain entries across uplines
    recordFiveLevelReferralOnRegistration(createdProfile);
    if (createdProfile.vipLevel >= 1) {
      distributeFiveLevelVipAndDepositCommissions(
        createdProfile,
        0,
        'Admin Created VIP Member',
        false
      );
    }

    await syncCentralDatabaseWithServer({ forceOverwrite: true });
    loadAllAdminData();
    setIsAddUserModalOpen(false);
    setNewUsername('');
    setNewEmail('');
    setNewMobile('');
    setNewBalanceLkr('100');
    showAdminNotice(
      `Created user "${createdProfile.username}" (VIP ${createdProfile.vipLevel}, Balance: ${formatCurrencyValue(
        initialBal,
        'LKR'
      )} LKR, Referral Code: ${createdProfile.referralCode}). User can now log in from any device.`
    );
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUserBundle) return;
    const targetUid = deletingUserBundle.uid;
    const targetUsername = deletingUserBundle.profile.username;
    setDeletingUserBundle(null);

    await deleteUserFromCentralDatabaseAndLocal(targetUid, targetUsername);
    if (onForceLogoutActiveUser) {
      onForceLogoutActiveUser(targetUid);
    }
    loadAllAdminData();
    showAdminNotice(
      `Deleted user "${targetUsername}" (${targetUid}) from central database and unlocked their device.`
    );
  };

  const handleQuickSaveAllMembersCount = () => {
    const parsed = Math.max(0, Math.round(Number(quickAllMembersCount) || 0));
    const saved = savePlatformSponsorGlobalStats({ totalMembersCount: parsed }, true);
    setQuickAllMembersCount(String(saved.totalMembersCount));
    syncCentralDatabaseWithServer({ forceOverwrite: true }).catch(() => {});
    showAdminNotice(
      `Updated All Members Count to ${saved.totalMembersCount.toLocaleString()} (displayed under Sponsor Countries).`
    );
  };

  // ================= 1. ADMIN EDIT USER BALANCE =================
  const openEditBalanceModal = (bundle: AdminUserBundle) => {
    setEditingBalanceUser(bundle);
    setBalanceMode('set');
    setBalanceInputLkr(String(Number(bundle.profile.balance.toFixed(2))));
    setBalanceNote('');
  };

  const handleSaveUserBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBalanceUser) return;

    const val = Number(balanceInputLkr);
    if (Number.isNaN(val) || val < 0) {
      showAdminNotice('Please enter a valid non-negative LKR amount.');
      return;
    }

    const currentBal = editingBalanceUser.profile.balance;
    let nextBalance = currentBal;
    if (balanceMode === 'set') {
      nextBalance = Number(val.toFixed(2));
    } else if (balanceMode === 'add') {
      nextBalance = Number((currentBal + val).toFixed(2));
    } else if (balanceMode === 'deduct') {
      nextBalance = Math.max(0, Number((currentBal - val).toFixed(2)));
    }

    const diff = Number((nextBalance - currentBal).toFixed(2));
    const updatedProfile: UserProfile = {
      ...editingBalanceUser.profile,
      balance: nextBalance,
      updatedAt: new Date().toISOString(),
    };

    let nextTx = [...editingBalanceUser.transactions];
    if (Math.abs(diff) > 0.001) {
      const adjustmentTx: TransactionRecord = {
        id: `tx_adm_bal_${Date.now()}`,
        userId: editingBalanceUser.uid,
        type: diff >= 0 ? 'deposit' : 'withdrawal',
        amount: Math.abs(diff),
        status: 'completed',
        description:
          balanceNote.trim() ||
          `Admin Balance Adjustment (${
            diff >= 0 ? `+${diff} LKR Credited` : `${diff} LKR Deducted`
          } → New Balance: ${nextBalance} LKR)`,
        createdAt: new Date().toISOString(),
      };
      nextTx = [adjustmentTx, ...nextTx];
    }

    persistUserUpdate(editingBalanceUser.uid, updatedProfile, nextTx);
    if (Math.abs(diff) > 0.001) {
      pushUserNotification(editingBalanceUser.uid, {
        title:
          diff >= 0
            ? `Wallet Credited: +${diff} LKR by Admin`
            : `Wallet Adjusted: ${diff} LKR by Admin`,
        titleSi:
          diff >= 0
            ? `පරිපාලක විසින් +${diff} LKR ඔබගේ ගිණුමට බැර කරන ලදී`
            : `පරිපාලක විසින් ${diff} LKR ගිණුම් ශේෂය සංශෝධනය කරන ලදී`,
        message:
          balanceNote.trim() ||
          `Your Zentro wallet balance has been updated to ${nextBalance} LKR.`,
        messageSi:
          balanceNote.trim() ||
          `ඔබගේ Zentro ගිණුම් ශේෂය ${nextBalance} LKR ලෙස යාවත්කාලීන කර ඇත.`,
        category: 'transaction',
        priority: 'high',
        actionTab: 'my',
        actionLabel: 'View Wallet Ledger',
        actionLabelSi: 'ගිණුම් ශේෂය බලන්න',
      });
    }
    setEditingBalanceUser(null);
    showAdminNotice(
      `Updated balance for "${editingBalanceUser.profile.username}" to ${formatCurrencyValue(
        nextBalance,
        'LKR'
      )} LKR.`
    );
  };

  // ================= 2. ADMIN EDIT USER VIP =================
  const openEditVipModal = (bundle: AdminUserBundle) => {
    setEditingVipUser(bundle);
    setSelectedNewVip(bundle.profile.vipLevel);
  };

  const handleSaveUserVip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVipUser) return;

    const tierObj =
      VIP_TIERS.find((t) => t.level === selectedNewVip) || VIP_TIERS[0];
    const upgradedHigher = selectedNewVip > editingVipUser.profile.vipLevel;

    const updatedProfile: UserProfile = {
      ...editingVipUser.profile,
      vipLevel: selectedNewVip,
      // If upgraded to next VIP, clear mustUpgradeNextVip automatically
      mustUpgradeNextVip: upgradedHigher
        ? false
        : editingVipUser.profile.mustUpgradeNextVip,
      updatedAt: new Date().toISOString(),
    };

    const vipTx: TransactionRecord = {
      id: `tx_adm_vip_${Date.now()}`,
      userId: editingVipUser.uid,
      type: 'vip_upgrade',
      amount: 0,
      status: 'completed',
      description: `Admin Set VIP Level to VIP ${selectedNewVip} (${tierObj.name})`,
      createdAt: new Date().toISOString(),
    };

    persistUserUpdate(editingVipUser.uid, updatedProfile, [
      vipTx,
      ...editingVipUser.transactions,
    ]);
    distributeFiveLevelVipAndDepositCommissions(
      updatedProfile,
      0,
      'Admin VIP Update',
      false
    );
    syncCentralDatabaseWithServer({ forceOverwrite: true }).catch(() => {});
    pushUserNotification(editingVipUser.uid, {
      title: `VIP Tier Updated: ${tierObj.name} (VIP ${selectedNewVip})`,
      titleSi: `VIP මට්ටම යාවත්කාලීන කරන ලදී: ${tierObj.name} (VIP ${selectedNewVip})`,
      message: `Admin has updated your membership tier to ${tierObj.name} (${tierObj.dailyMiningRatePercent}% daily mining yield & ${tierObj.dailyTasks} daily tasks).`,
      messageSi: `පරිපාලක විසින් ඔබගේ සාමාජිකත්වය ${tierObj.name} (දිනකට ${tierObj.dailyMiningRatePercent}% කැණීමේ ප්‍රතිලාභ සහ දෛනික කාර්යයන් ${tierObj.dailyTasks}) ලෙස සක්‍රිය කර ඇත.`,
      category: 'vip',
      priority: 'high',
      actionTab: 'vip',
      actionLabel: 'Open VIP Hub',
      actionLabelSi: 'VIP අංශය බලන්න',
    });
    setEditingVipUser(null);
    showAdminNotice(
      `Updated VIP level for "${editingVipUser.profile.username}" to ${tierObj.name} (VIP ${selectedNewVip}).`
    );
  };

  // ================= 3. ADMIN TOGGLE "UPGRADE WANT ENABLE" BUTTON =================
  const handleToggleUpgradeWant = (bundle: AdminUserBundle) => {
    const nextEnabled = !bundle.profile.mustUpgradeNextVip;
    const nextVipLevel = Math.min(4, bundle.profile.vipLevel + 1);
    const nextVipTier =
      VIP_TIERS.find((t) => t.level === nextVipLevel) || VIP_TIERS[4];

    const updatedProfile: UserProfile = {
      ...bundle.profile,
      mustUpgradeNextVip: nextEnabled,
      updatedAt: new Date().toISOString(),
    };

    // If enabling "Upgrade Want", also pause their live mining in localStorage immediately
    if (nextEnabled) {
      try {
        const rawMining = localStorage.getItem(`zentro_live_mining_v1_${bundle.uid}`);
        const parsedMining = rawMining ? JSON.parse(rawMining) : {};
        localStorage.setItem(
          `zentro_live_mining_v1_${bundle.uid}`,
          JSON.stringify({
            ...parsedMining,
            isRunning: false,
            lastTickTimestamp: Date.now(),
          })
        );
      } catch {
        // ignore
      }
    }

    persistUserUpdate(bundle.uid, updatedProfile);
    pushUserNotification(bundle.uid, {
      title: nextEnabled
        ? `Action Required: Upgrade to ${nextVipTier.name}`
        : 'VIP Upgrade Lock Removed — Mining & Withdrawals Unlocked',
      titleSi: nextEnabled
        ? `අවධානයයි: ${nextVipTier.name} වෙත උත්ශ්‍රේණි කරන්න`
        : 'VIP උත්ශ්‍රේණි කිරීමේ සීමාව ඉවත් කරන ලදී',
      message: nextEnabled
        ? `Your account requires upgrading to ${nextVipTier.name} to resume Live Currency Mining and unlock Withdrawals.`
        : 'Your account restrictions have been lifted by Admin. You may now mine and withdraw normally.',
      messageSi: nextEnabled
        ? `සජීවී පතල් කැණීම සහ මුදල් ආපසු ගැනීම් නැවත සක්‍රිය කිරීමට ${nextVipTier.name} වෙත උත්ශ්‍රේණි කිරීම අනිවාර්ය වේ.`
        : 'ඔබගේ ගිණුමේ පතල් කැණීම සහ මුදල් ආපසු ගැනීමේ පහසුකම් නැවත සක්‍රිය කර ඇත.',
      category: 'vip',
      priority: nextEnabled ? 'urgent' : 'high',
      actionTab: 'vip',
      actionLabel: nextEnabled ? 'Upgrade VIP Now' : 'View VIP Status',
      actionLabelSi: nextEnabled ? 'දැන්ම VIP Upgrade කරන්න' : 'VIP තත්ත්වය බලන්න',
    });
    showAdminNotice(
      nextEnabled
        ? `Enabled "Upgrade Want" for "${bundle.profile.username}": User is now NOT mining and CANNOT withdraw until they upgrade to ${nextVipTier.name}.`
        : `Disabled "Upgrade Want" requirement for "${bundle.profile.username}". Normal mining & withdrawal rules restored.`
    );
  };

  // ================= 4. ADMIN LOGOUT USER =================
  const handleForceLogoutUser = (bundle: AdminUserBundle) => {
    const updatedProfile: UserProfile = {
      ...bundle.profile,
      forceLogoutAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const activeUid = localStorage.getItem('zentro_active_session_uid');
    if (activeUid === bundle.uid) {
      localStorage.removeItem('zentro_active_session_uid');
    }

    persistUserUpdate(bundle.uid, updatedProfile);
    if (onForceLogoutActiveUser) {
      onForceLogoutActiveUser(bundle.uid);
    }

    showAdminNotice(
      `User "${bundle.profile.username}" has been logged out from their active session.`
    );
  };

  // ================= 5. ADMIN APPROVE / REJECT DEPOSIT =================
  const handleApproveDeposit = (
    deposit: DepositRequestRecord,
    ownerBundle: AdminUserBundle | undefined
  ) => {
    if (deposit.status === 'approved') return;

    // 1. Update status in zentro_deposit_requests_v1_${userId}
    updateLocalDepositRequestStatus(deposit.userId, deposit.id, 'approved');

    if (ownerBundle) {
      const creditLkr = Number(deposit.amountInLkr.toFixed(2));
      const nextBalance = Number((ownerBundle.profile.balance + creditLkr).toFixed(2));

      // Also check if deposit was for a specific VIP upgrade and user wants balance credited
      const updatedProfile: UserProfile = {
        ...ownerBundle.profile,
        balance: nextBalance,
        updatedAt: new Date().toISOString(),
      };

      // Update matching pending deposit transaction in zentro_tx_${uid} or prepend completed one
      let matchedTx = false;
      const updatedTx = ownerBundle.transactions.map((tx) => {
        if (
          !matchedTx &&
          tx.type === 'deposit' &&
          tx.status === 'pending' &&
          (tx.description.includes(deposit.referenceCode) ||
            Math.abs(tx.amount - creditLkr) < 1)
        ) {
          matchedTx = true;
          return {
            ...tx,
            status: 'completed' as const,
            description: tx.description.replace(
              '[Wait Admin Approve]',
              '[Approved by Admin]'
            ),
          };
        }
        return tx;
      });

      if (!matchedTx) {
        updatedTx.unshift({
          id: `tx_dep_app_${Date.now()}`,
          userId: ownerBundle.uid,
          type: 'deposit',
          amount: creditLkr,
          status: 'completed',
          description: `Deposit Approved (${deposit.selectedBankName}) · Ref: ${deposit.referenceCode}`,
          createdAt: new Date().toISOString(),
        });
      }

      persistUserUpdate(ownerBundle.uid, updatedProfile, updatedTx);
      pushUserNotification(ownerBundle.uid, {
        title: `Deposit Approved: +${creditLkr} LKR Credited`,
        titleSi: `තැන්පතුව අනුමත කරන ලදී: +${creditLkr} LKR බැර විය`,
        message: `Your deposit (${deposit.selectedBankName}, Ref: ${deposit.referenceCode}) has been verified and credited to your Zentro balance.`,
        messageSi: `ඔබගේ තැන්පතුව (${deposit.selectedBankName}, Ref: ${deposit.referenceCode}) සත්‍යාපනය කර ඔබගේ Zentro ගිණුම් ශේෂයට එක් කරන ලදී.`,
        category: 'transaction',
        priority: 'high',
        actionTab: 'vip',
        actionLabel: 'Activate VIP / View Balance',
        actionLabelSi: 'VIP සක්‍රිය කරන්න / ශේෂය බලන්න',
      });

      // Multi-level referral commission distribution (L1-L5) if user was referred by an active VIP member
      distributeReferralCommissionsOnDeposit(ownerBundle.profile, creditLkr);
    } else {
      loadAllAdminData();
    }

    if (viewingReceiptDeposit && viewingReceiptDeposit.deposit.id === deposit.id) {
      setViewingReceiptDeposit({
        ...viewingReceiptDeposit,
        deposit: { ...deposit, status: 'approved' },
      });
    }

    showAdminNotice(
      `Approved deposit ${deposit.referenceCode}: +${formatCurrencyValue(
        deposit.amountInLkr,
        'LKR'
      )} LKR credited to "${deposit.username}".`
    );
  };

  const distributeReferralCommissionsOnDeposit = (
    depositorProfile: UserProfile,
    depositAmountLkr: number
  ) => {
    distributeFiveLevelVipAndDepositCommissions(
      depositorProfile,
      depositAmountLkr,
      'Deposit Approval',
      true
    );
    syncCentralDatabaseWithServer({ forceOverwrite: true }).catch(() => {});
    loadAllAdminData();
  };

  const legacyDistributeUnused = (
    depositorProfile: UserProfile,
    depositAmountLkr: number
  ) => {
    try {
      const rawAccounts = localStorage.getItem('zentro_accounts_db_v1');
      if (!rawAccounts) return;
      const accounts: Record<string, { profile: UserProfile; password: string }> =
        JSON.parse(rawAccounts);

      let currentReferredByCode = (depositorProfile.referredBy || '')
        .trim()
        .toUpperCase();

      for (let tierLevel = 1; tierLevel <= 5; tierLevel++) {
        if (!currentReferredByCode) break;
        const uplineEntry = Object.values(accounts).find(
          (acc) =>
            acc.profile.referralCode.toUpperCase() === currentReferredByCode &&
            acc.profile.uid !== depositorProfile.uid
        );
        if (!uplineEntry) break;

        const uplineProfile = uplineEntry.profile;
        if (uplineProfile.vipLevel >= 1) {
          const commLevels = getCommissionLevelsForVip(uplineProfile.vipLevel);
          const rateObj = commLevels.find((l) => l.level === tierLevel);
          if (rateObj && rateObj.rate > 0) {
            const commissionLkr = Number((depositAmountLkr * rateObj.rate).toFixed(2));
            if (commissionLkr > 0) {
              const nextUplineBal = Number(
                (uplineProfile.balance + commissionLkr).toFixed(2)
              );
              const nextUplineEarn = Number(
                (uplineProfile.totalEarnings + commissionLkr).toFixed(2)
              );
              const updatedUpline: UserProfile = {
                ...uplineProfile,
                balance: nextUplineBal,
                totalEarnings: nextUplineEarn,
                updatedAt: new Date().toISOString(),
              };
              accounts[uplineProfile.uid] = {
                profile: updatedUpline,
                password: uplineEntry.password,
              };

              const rawUplineTx = localStorage.getItem(`zentro_tx_${uplineProfile.uid}`);
              const uplineTxList: TransactionRecord[] = rawUplineTx
                ? JSON.parse(rawUplineTx)
                : [];
              uplineTxList.unshift({
                id: `tx_ref_comm_${Date.now()}_L${tierLevel}`,
                userId: uplineProfile.uid,
                type: 'referral_bonus',
                amount: commissionLkr,
                status: 'completed',
                description: `L${tierLevel} (${rateObj.ratePercent}%) Deposit Referral Bonus from ${depositorProfile.username}`,
                createdAt: new Date().toISOString(),
              });
              localStorage.setItem(
                `zentro_tx_${uplineProfile.uid}`,
                JSON.stringify(uplineTxList)
              );

              const rawUplineRefs = localStorage.getItem(
                `zentro_refs_${uplineProfile.uid}`
              );
              const uplineRefsList: ReferralRecordData[] = rawUplineRefs
                ? JSON.parse(rawUplineRefs)
                : [];
              uplineRefsList.unshift({
                id: `ref_dep_${Date.now()}_L${tierLevel}`,
                referrerUid: uplineProfile.uid,
                referredUsername: depositorProfile.username,
                referralCodeUsed: uplineProfile.referralCode,
                tierLevel,
                vipLevel: depositorProfile.vipLevel,
                commissionEarned: commissionLkr,
                createdAt: new Date().toISOString(),
              });
              localStorage.setItem(
                `zentro_refs_${uplineProfile.uid}`,
                JSON.stringify(uplineRefsList)
              );

              pushUserNotification(uplineProfile.uid, {
                title: `Level ${tierLevel} Commission Earned: +${commissionLkr} LKR`,
                titleSi: `මට්ටම ${tierLevel} කොමිස් මුදලක් ලැබුණි: +${commissionLkr} LKR`,
                message: `You earned a ${rateObj.ratePercent}% Level ${tierLevel} deposit referral commission from team member ${depositorProfile.username}.`,
                messageSi: `ඔබගේ කණ්ඩායම් සාමාජික ${depositorProfile.username} ගේ තැන්පතුවෙන් ${rateObj.ratePercent}% (මට්ටම ${tierLevel}) කොමිස් මුදලක් ඔබගේ ගිණුමට එක් විය.`,
                category: 'referral',
                priority: 'high',
                actionTab: 'team',
                actionLabel: 'View Team Earnings',
                actionLabelSi: 'කණ්ඩායම් ආදායම බලන්න',
              });
            }
          }
        }
        currentReferredByCode = (uplineProfile.referredBy || '').trim().toUpperCase();
      }

      localStorage.setItem('zentro_accounts_db_v1', JSON.stringify(accounts));
      loadAllAdminData();
    } catch (e) {
      console.error('Error distributing referral commissions:', e);
    }
  };

  const handleRejectDeposit = (
    deposit: DepositRequestRecord,
    ownerBundle: AdminUserBundle | undefined
  ) => {
    if (deposit.status === 'rejected') return;

    updateLocalDepositRequestStatus(deposit.userId, deposit.id, 'rejected');

    if (ownerBundle) {
      const updatedTx = ownerBundle.transactions.map((tx) => {
        if (
          tx.type === 'deposit' &&
          tx.status === 'pending' &&
          (tx.description.includes(deposit.referenceCode) ||
            Math.abs(tx.amount - deposit.amountInLkr) < 1)
        ) {
          return {
            ...tx,
            status: 'rejected' as const,
            description: tx.description.replace(
              '[Wait Admin Approve]',
              '[Rejected by Admin]'
            ),
          };
        }
        return tx;
      });
      persistUserUpdate(ownerBundle.uid, ownerBundle.profile, updatedTx);
      pushUserNotification(ownerBundle.uid, {
        title: `Deposit Request Rejected (${deposit.referenceCode})`,
        titleSi: `තැන්පතු ඉල්ලීම ප්‍රතික්ෂේප විය (${deposit.referenceCode})`,
        message: `Your deposit request of ${deposit.amountInLkr} LKR via ${deposit.selectedBankName} could not be verified. Please check your payment slip and resubmit.`,
        messageSi: `ඔබගේ ${deposit.amountInLkr} LKR තැන්පතු ඉල්ලීම සත්‍යාපනය කළ නොහැකි විය. කරුණාකර රිසිට්පත පරීක්ෂා කර නැවත ඉදිරිපත් කරන්න.`,
        category: 'transaction',
        priority: 'urgent',
        actionModal: 'deposit',
        actionLabel: 'Open Deposit Desk',
        actionLabelSi: 'තැන්පතු අංශය විවෘත කරන්න',
      });
    } else {
      loadAllAdminData();
    }

    if (viewingReceiptDeposit && viewingReceiptDeposit.deposit.id === deposit.id) {
      setViewingReceiptDeposit({
        ...viewingReceiptDeposit,
        deposit: { ...deposit, status: 'rejected' },
      });
    }

    showAdminNotice(
      `Rejected deposit request ${deposit.referenceCode} from "${deposit.username}".`
    );
  };

  // ================= 6. ADMIN APPROVE / REJECT WITHDRAWAL =================
  const handleApproveWithdrawal = (
    withdrawal: WithdrawalRequestRecord,
    ownerBundle: AdminUserBundle | undefined
  ) => {
    if (withdrawal.status === 'approved') return;

    updateLocalWithdrawalRequestStatus(withdrawal.userId, withdrawal.id, 'approved');

    if (ownerBundle) {
      const updatedTx = ownerBundle.transactions.map((tx) => {
        if (
          tx.type === 'withdrawal' &&
          tx.status === 'pending' &&
          (tx.description.includes(withdrawal.referenceCode) ||
            Math.abs(tx.amount - withdrawal.amountInLkr) < 1)
        ) {
          return {
            ...tx,
            status: 'completed' as const,
            description: tx.description.replace(
              '[Pending Admin Approve]',
              '[Approved & Paid by Admin]'
            ),
          };
        }
        return tx;
      });
      persistUserUpdate(ownerBundle.uid, ownerBundle.profile, updatedTx);
      pushUserNotification(ownerBundle.uid, {
        title: `Withdrawal Approved & Paid (${withdrawal.netAmountInDisplayUnit} ${withdrawal.displayUnit})`,
        titleSi: `මුදල් ආපසු ගැනීම අනුමත කර ගෙවන ලදී (${withdrawal.netAmountInDisplayUnit} ${withdrawal.displayUnit})`,
        message: `Your withdrawal (${withdrawal.referenceCode}) to ${withdrawal.networkOrBankName} (${withdrawal.accountNumberOrAddress}) has been approved and settled by Admin.`,
        messageSi: `ඔබගේ මුදල් ආපසු ගැනීමේ ඉල්ලීම (${withdrawal.referenceCode}) පරිපාලක විසින් අනුමත කර ඔබගේ ගිණුමට යොමු කර ඇත.`,
        category: 'transaction',
        priority: 'high',
        actionTab: 'my',
        actionLabel: 'View Ledger',
        actionLabelSi: 'ගනුදෙනු ඉතිහාසය බලන්න',
      });
    } else {
      loadAllAdminData();
    }

    showAdminNotice(
      `Approved withdrawal ${withdrawal.referenceCode} (${withdrawal.netAmountInDisplayUnit} ${withdrawal.displayUnit} net payout to "${withdrawal.username}").`
    );
  };

  const handleRejectWithdrawal = (
    withdrawal: WithdrawalRequestRecord,
    ownerBundle: AdminUserBundle | undefined
  ) => {
    if (withdrawal.status === 'rejected') return;

    updateLocalWithdrawalRequestStatus(withdrawal.userId, withdrawal.id, 'rejected');

    if (ownerBundle) {
      // Refund the deducted withdrawal amount back to the user's balance
      const refundLkr = Number(withdrawal.amountInLkr.toFixed(2));
      const restoredBalance = Number(
        (ownerBundle.profile.balance + refundLkr).toFixed(2)
      );
      const updatedProfile: UserProfile = {
        ...ownerBundle.profile,
        balance: restoredBalance,
        updatedAt: new Date().toISOString(),
      };

      const updatedTx = ownerBundle.transactions.map((tx) => {
        if (
          tx.type === 'withdrawal' &&
          tx.status === 'pending' &&
          (tx.description.includes(withdrawal.referenceCode) ||
            Math.abs(tx.amount - withdrawal.amountInLkr) < 1)
        ) {
          return {
            ...tx,
            status: 'rejected' as const,
            description: tx.description.replace(
              '[Pending Admin Approve]',
              `[Rejected by Admin — ${refundLkr} LKR Refunded to Balance]`
            ),
          };
        }
        return tx;
      });

      persistUserUpdate(ownerBundle.uid, updatedProfile, updatedTx);
      pushUserNotification(ownerBundle.uid, {
        title: `Withdrawal Rejected & Refunded (+${refundLkr} LKR)`,
        titleSi: `මුදල් ආපසු ගැනීම ප්‍රතික්ෂේප කර ශේෂය ආපසු බැර කරන ලදී (+${refundLkr} LKR)`,
        message: `Your withdrawal request (${withdrawal.referenceCode}) was declined and ${refundLkr} LKR has been refunded to your available balance.`,
        messageSi: `ඔබගේ මුදල් ආපසු ගැනීමේ ඉල්ලීම (${withdrawal.referenceCode}) ප්‍රතික්ෂේප වූ අතර ${refundLkr} LKR නැවත ඔබගේ ගිණුම් ශේෂයට එක් කරන ලදී.`,
        category: 'transaction',
        priority: 'urgent',
        actionTab: 'my',
        actionLabel: 'Check Balance',
        actionLabelSi: 'ශේෂය පරීක්ෂා කරන්න',
      });
    } else {
      loadAllAdminData();
    }

    showAdminNotice(
      `Rejected withdrawal ${withdrawal.referenceCode} and refunded ${formatCurrencyValue(
        withdrawal.amountInLkr,
        'LKR'
      )} LKR back to "${withdrawal.username}".`
    );
  };

  // ================= 7. ADMIN SEND / EDIT BROADCAST OR DIRECT NOTIFICATION =================
  const handleSendAdminNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showAdminNotice('Please enter an Announcement Title and Message.');
      return;
    }

    const chosenTab = notifActionTab === 'none' ? undefined : notifActionTab;

    if (editingBroadcastId) {
      updateGlobalBroadcastNotification(editingBroadcastId, {
        title: notifTitle.trim(),
        titleSi: notifTitleSi.trim() || undefined,
        message: notifMessage.trim(),
        messageSi: notifMessageSi.trim() || undefined,
        category: notifCategory,
        priority: notifPriority,
        actionTab: chosenTab,
        actionLabel: chosenTab ? `Open ${chosenTab.toUpperCase()}` : undefined,
      });
      setGlobalBroadcasts(getGlobalBroadcastNotifications());
      setEditingBroadcastId(null);
      showAdminNotice('Announcement updated and republished to User Dashboards!');
    } else if (notifTargetUid === 'ALL') {
      pushGlobalBroadcastNotification({
        title: notifTitle.trim(),
        titleSi: notifTitleSi.trim() || undefined,
        message: notifMessage.trim(),
        messageSi: notifMessageSi.trim() || undefined,
        category: notifCategory,
        priority: notifPriority,
        actionTab: chosenTab,
        actionLabel: chosenTab ? `Open ${chosenTab.toUpperCase()}` : undefined,
      });
      setGlobalBroadcasts(getGlobalBroadcastNotifications());
      showAdminNotice(
        'Announcement sent to ALL users! It is now displayed at the top of every User Dashboard.'
      );
    } else {
      const targetUser = userBundles.find((b) => b.uid === notifTargetUid);
      pushUserNotification(notifTargetUid, {
        title: notifTitle.trim(),
        titleSi: notifTitleSi.trim() || undefined,
        message: notifMessage.trim(),
        messageSi: notifMessageSi.trim() || undefined,
        category: notifCategory,
        priority: notifPriority,
        actionTab: chosenTab,
        actionLabel: chosenTab ? `Open ${chosenTab.toUpperCase()}` : undefined,
      });
      showAdminNotice(
        `Direct Notification sent to "${targetUser?.profile.username || notifTargetUid}"!`
      );
    }

    setNotifTitle('');
    setNotifTitleSi('');
    setNotifMessage('');
    setNotifMessageSi('');
  };

  // ================= 8. ADMIN DEPOSIT BANKS & USDT BEP-20 CRUD HANDLERS =================
  const resetBankForm = () => {
    setEditingDepositBankId(null);
    setBankFormName('');
    setBankFormCountry('Sri Lanka');
    setBankFormHolder('ZENTRO HOLDINGS (PVT) LTD');
    setBankFormAccNo('');
    setBankFormBranch('');
    setBankFormSwift('');
  };

  const handleSaveDepositBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankFormName.trim() || !bankFormAccNo.trim() || !bankFormHolder.trim()) {
      showAdminNotice('Please fill in Bank Name, Account Number, and Account Holder Name.');
      return;
    }

    const current = getOfficialDepositBanks();
    if (editingDepositBankId) {
      const updated = current.map((b) =>
        b.id === editingDepositBankId
          ? {
              ...b,
              bankName: bankFormName.trim(),
              country: bankFormCountry.trim() || 'Sri Lanka',
              accountName: bankFormHolder.trim(),
              accountNumber: bankFormAccNo.trim(),
              branchName: bankFormBranch.trim() || 'Main Corporate Branch',
              swiftCode: bankFormSwift.trim() || 'ZENTLKLX',
            }
          : b
      );
      saveOfficialDepositBanks(updated);
      setOfficialDepositBanks(updated);
      showAdminNotice(`Updated deposit bank: ${bankFormName.trim()}`);
    } else {
      const newBank: OfficialSettlementBank = {
        id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        bankName: bankFormName.trim(),
        country: bankFormCountry.trim() || 'Sri Lanka',
        accountName: bankFormHolder.trim(),
        accountNumber: bankFormAccNo.trim(),
        branchName: bankFormBranch.trim() || 'Main Corporate Branch',
        swiftCode: bankFormSwift.trim() || 'ZENTLKLX',
      };
      const updated = [...current, newBank];
      saveOfficialDepositBanks(updated);
      setOfficialDepositBanks(updated);
      showAdminNotice(`Added new deposit bank: ${newBank.bankName}`);
    }
    resetBankForm();
  };

  const handleEditDepositBank = (bank: OfficialSettlementBank) => {
    setEditingDepositBankId(bank.id);
    setBankFormName(bank.bankName);
    setBankFormCountry(bank.country);
    setBankFormHolder(bank.accountName);
    setBankFormAccNo(bank.accountNumber);
    setBankFormBranch(bank.branchName);
    setBankFormSwift(bank.swiftCode);
  };

  const handleDeleteDepositBank = (bankId: string) => {
    const current = getOfficialDepositBanks();
    const filtered = current.filter((b) => b.id !== bankId);
    saveOfficialDepositBanks(filtered);
    setOfficialDepositBanks(filtered);
    if (editingDepositBankId === bankId) resetBankForm();
    showAdminNotice('Deleted deposit bank detail.');
  };

  const resetUsdtForm = () => {
    setEditingUsdtId(null);
    setUsdtFormNetworkName('BNB Smart Chain (BEP-20)');
    setUsdtFormTokenStandard('USDT-BEP20');
    setUsdtFormWalletAddress('');
    setUsdtFormMinConf('15');
  };

  const handleSaveUsdtAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usdtFormWalletAddress.trim() || !usdtFormNetworkName.trim()) {
      showAdminNotice('Please enter the USDT (BEP-20) Network Name and Wallet Address.');
      return;
    }

    const parsedConf = Math.max(1, parseInt(usdtFormMinConf, 10) || 15);
    const current = getOfficialUsdtAddresses();
    if (editingUsdtId) {
      const updated: UsdtNetworkOption[] = current.map((u) =>
        u.id === editingUsdtId
          ? {
              ...u,
              networkName: usdtFormNetworkName.trim(),
              tokenStandard: usdtFormTokenStandard.trim() || 'USDT-BEP20',
              walletAddress: usdtFormWalletAddress.trim(),
              minConfirmations: parsedConf,
            }
          : u
      );
      saveOfficialUsdtAddresses(updated);
      setOfficialUsdtList(updated);
      showAdminNotice(`Updated USDT address: ${usdtFormNetworkName.trim()}`);
    } else {
      const newUsdt: UsdtNetworkOption = {
        id: `usdt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        networkName: usdtFormNetworkName.trim(),
        tokenStandard: usdtFormTokenStandard.trim() || 'USDT-BEP20',
        walletAddress: usdtFormWalletAddress.trim(),
        minConfirmations: parsedConf,
      };
      const updated = [...current, newUsdt];
      saveOfficialUsdtAddresses(updated);
      setOfficialUsdtList(updated);
      showAdminNotice(`Added new USDT address: ${newUsdt.networkName}`);
    }
    resetUsdtForm();
  };

  const handleEditUsdtAddress = (usdt: UsdtNetworkOption) => {
    setEditingUsdtId(usdt.id);
    setUsdtFormNetworkName(usdt.networkName);
    setUsdtFormTokenStandard(usdt.tokenStandard);
    setUsdtFormWalletAddress(usdt.walletAddress);
    setUsdtFormMinConf(String(usdt.minConfirmations || 15));
  };

  const handleDeleteUsdtAddress = (usdtId: string) => {
    const current = getOfficialUsdtAddresses();
    const filtered = current.filter((u) => u.id !== usdtId);
    saveOfficialUsdtAddresses(filtered);
    setOfficialUsdtList(filtered);
    if (editingUsdtId === usdtId) resetUsdtForm();
    showAdminNotice('Deleted USDT wallet address.');
  };

  // ================= AGGREGATE DEPOSITS & WITHDRAWALS ACROSS ALL USERS =================
  const allDeposits: {
    deposit: DepositRequestRecord;
    owner: AdminUserBundle | undefined;
  }[] = [];

  const allWithdrawals: {
    withdrawal: WithdrawalRequestRecord;
    owner: AdminUserBundle | undefined;
  }[] = [];

  userBundles.forEach((bundle) => {
    bundle.depositRequests.forEach((dep) => {
      allDeposits.push({ deposit: dep, owner: bundle });
    });

    // Also include any legacy deposit transaction that doesn't have a matching DepositRequestRecord
    bundle.transactions
      .filter((tx) => tx.type === 'deposit')
      .forEach((tx) => {
        const alreadyExists = bundle.depositRequests.some(
          (d) =>
            tx.description.includes(d.referenceCode) ||
            Math.abs(d.amountInLkr - tx.amount) < 0.5
        );
        if (!alreadyExists && !tx.description.includes('Admin Balance Adjustment')) {
          allDeposits.push({
            deposit: {
              id: tx.id,
              referenceCode: `TX-${tx.id.slice(-6).toUpperCase()}`,
              userId: bundle.uid,
              username: bundle.profile.username,
              depositType: tx.description.toLowerCase().includes('usdt')
                ? 'usdt'
                : 'bank',
              country: bundle.profile.country || 'Sri Lanka',
              selectedBankName: 'Direct Deposit Transaction',
              receivingAccountNumber: 'Official Settlement Vault',
              receivingAccountHolder: 'Zentro Treasury',
              receivingBranchOrNetwork: 'Main Branch',
              selectedVipLabel: 'Wallet Deposit',
              selectedVipLevel: null,
              amountInActiveCurrency: tx.amount,
              activeCurrency: 'LKR',
              amountInLkr: tx.amount,
              depositorName: bundle.profile.username,
              slipFileName: 'deposit-record.jpg',
              slipDataUrl: '',
              status:
                tx.status === 'completed'
                  ? 'approved'
                  : tx.status === 'rejected'
                    ? 'rejected'
                    : 'pending_admin',
              createdAt: String(tx.createdAt || new Date().toISOString()),
            },
            owner: bundle,
          });
        }
      });

    bundle.withdrawalRequests.forEach((wdr) => {
      allWithdrawals.push({ withdrawal: wdr, owner: bundle });
    });

    // Also include any legacy withdrawal transaction that doesn't have a matching WithdrawalRequestRecord
    bundle.transactions
      .filter((tx) => tx.type === 'withdrawal')
      .forEach((tx) => {
        const alreadyExists = bundle.withdrawalRequests.some(
          (w) =>
            tx.description.includes(w.referenceCode) ||
            Math.abs(w.amountInLkr - tx.amount) < 0.5
        );
        if (!alreadyExists && !tx.description.includes('Admin Balance Adjustment')) {
          const primaryBank = bundle.bankAccounts[0];
          allWithdrawals.push({
            withdrawal: {
              id: tx.id,
              referenceCode: `WDR-${tx.id.slice(-6).toUpperCase()}`,
              userId: bundle.uid,
              username: bundle.profile.username,
              withdrawType: tx.description.toLowerCase().includes('usdt')
                ? 'usdt_bep20'
                : 'bank',
              networkOrBankName: primaryBank?.bankName || 'Bound Bank Account',
              accountHolderOrLabel:
                primaryBank?.accountHolder || bundle.profile.username,
              accountNumberOrAddress:
                primaryBank?.accountNumber || 'See User Bound Accounts',
              branchOrStandard: primaryBank?.routingOrSwift || 'BANK-LKR',
              amountInLkr: tx.amount,
              feeInLkr: 25,
              netAmountInLkr: Math.max(0, tx.amount - 25),
              amountInDisplayUnit: tx.amount,
              feeInDisplayUnit: 25,
              netAmountInDisplayUnit: Math.max(0, tx.amount - 25),
              displayUnit: 'LKR',
              activeCurrency: getActiveCurrency(bundle.profile),
              status:
                tx.status === 'completed'
                  ? 'approved'
                  : tx.status === 'rejected'
                    ? 'rejected'
                    : 'pending_admin',
              createdAt: String(tx.createdAt || new Date().toISOString()),
            },
            owner: bundle,
          });
        }
      });
  });

  allDeposits.sort(
    (a, b) =>
      new Date(b.deposit.createdAt || 0).getTime() -
      new Date(a.deposit.createdAt || 0).getTime()
  );
  allWithdrawals.sort(
    (a, b) =>
      new Date(b.withdrawal.createdAt || 0).getTime() -
      new Date(a.withdrawal.createdAt || 0).getTime()
  );

  // Filtered lists
  const filteredUsers = userBundles.filter((b) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.profile.username.toLowerCase().includes(q) ||
      b.profile.email.toLowerCase().includes(q) ||
      b.profile.mobile.toLowerCase().includes(q) ||
      b.profile.uid.toLowerCase().includes(q) ||
      b.profile.referralCode.toLowerCase().includes(q);

    const matchesVip =
      vipFilter === 'all'
        ? true
        : vipFilter === 'upgrade_required'
          ? Boolean(b.profile.mustUpgradeNextVip)
          : String(b.profile.vipLevel) === vipFilter;

    return matchesSearch && matchesVip;
  });

  const filteredDeposits = allDeposits.filter((item) =>
    depositFilter === 'all' ? true : item.deposit.status === depositFilter
  );

  const filteredWithdrawals = allWithdrawals.filter((item) =>
    withdrawFilter === 'all' ? true : item.withdrawal.status === withdrawFilter
  );

  // Summary KPIs
  const totalPlatformBalanceLkr = userBundles.reduce(
    (acc, b) => acc + (Number(b.profile.balance) || 0),
    0
  );
  const pendingDepositsCount = allDeposits.filter(
    (d) => d.deposit.status === 'pending_admin'
  ).length;
  const pendingWithdrawalsCount = allWithdrawals.filter(
    (w) => w.withdrawal.status === 'pending_admin'
  ).length;
  const upgradeRequiredUsersCount = userBundles.filter((u) =>
    Boolean(u.profile.mustUpgradeNextVip)
  ).length;

  // Helper to build full upline + downline referral chain for a user
  const computeReferralChainForUser = (targetBundle: AdminUserBundle) => {
    const uplineBundle = userBundles.find(
      (b) =>
        b.profile.referralCode.toUpperCase() ===
          (targetBundle.profile.referredBy || '').trim().toUpperCase() &&
        b.uid !== targetBundle.uid
    );

    // Find L1-L5 downline users registered in the database
    const downlineByLevel: {
      level: number;
      bundle: AdminUserBundle;
      invitedByCode: string;
    }[] = [];

    let currentLevelCodes = [targetBundle.profile.referralCode.toUpperCase()];
    const visitedUids = new Set<string>([targetBundle.uid]);

    for (let lvl = 1; lvl <= 5; lvl++) {
      const nextCodes: string[] = [];
      userBundles.forEach((candidate) => {
        if (visitedUids.has(candidate.uid)) return;
        const candRefBy = (candidate.profile.referredBy || '').trim().toUpperCase();
        if (candRefBy && currentLevelCodes.includes(candRefBy)) {
          visitedUids.add(candidate.uid);
          downlineByLevel.push({
            level: lvl,
            bundle: candidate,
            invitedByCode: candRefBy,
          });
          nextCodes.push(candidate.profile.referralCode.toUpperCase());
        }
      });
      currentLevelCodes = nextCodes;
      if (currentLevelCodes.length === 0) break;
    }

    return { uplineBundle, downlineByLevel };
  };

  return (
    <div
      className={`relative min-h-screen pb-14 flex flex-col transition-colors ${
        isDark
          ? 'bg-gradient-to-b from-[#081229] via-[#0e172c] to-[#170b28] text-white'
          : 'bg-gradient-to-b from-slate-100 via-white to-pink-50/60 text-slate-900'
      }`}
    >
      {/* Background Artwork */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={isDark ? ZENTRO_ATRIUM_BG_DATA_URI : ZENTRO_ATRIUM_LIGHT_BG_DATA_URI}
          alt="Zentro Admin Atrium"
          className="w-full h-full object-cover object-center opacity-40"
        />
        <div
          className={`absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-b from-[#050b1c]/80 via-[#0b1328]/85 to-[#120722]/90'
              : 'bg-gradient-to-b from-white/80 via-slate-50/85 to-pink-50/85'
          }`}
        />
      </div>

      {/* Top Admin Header */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl px-4 sm:px-6 py-3.5 ${
          isDark
            ? 'bg-[#0c1428]/95 border-pink-500/30'
            : 'bg-white/95 border-pink-200 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={ZENTRO_LOGO_URL}
              alt="Zentro Admin"
              className="w-10 h-10 rounded-2xl object-cover bg-white border border-pink-500/40 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                  MASTER ADMIN PANEL
                </span>
                <span className="text-xs font-mono text-pink-400 font-bold">
                  ID: {ADMIN_LOGIN_ID}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold font-display tracking-tight">
                Zentro Central Control & Settlement Desk
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                loadAllAdminData();
                showAdminNotice('Refreshed all users, deposits, and withdrawals.');
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#162038] border-white/15 hover:border-sky-400 text-sky-400'
                  : 'bg-slate-100 border-slate-300 hover:border-sky-500 text-sky-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#162038] border-white/15 text-pink-400'
                  : 'bg-slate-100 border-slate-300 text-blue-700'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {bannerNotice && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-pink-500 to-rose-500 text-white text-xs font-bold flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{bannerNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-xs underline cursor-pointer ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#121c33]/90 border-white/10' : 'bg-white border-pink-200 shadow-sm'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Registered Users</span>
            </div>
            <div className="text-2xl font-mono font-extrabold mt-1">
              {userBundles.length}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
              {userBundles.filter((u) => u.isCurrentlyLoggedIn).length} Active Session(s)
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#121c33]/90 border-white/10' : 'bg-white border-pink-200 shadow-sm'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-pink-400" />
              <span>Total User Balances</span>
            </div>
            <div className="text-xl font-mono font-extrabold text-pink-400 mt-1 tabular-nums">
              {formatCurrencyValue(totalPlatformBalanceLkr, 'LKR')} LKR
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              ≈ {formatCurrencyValue(totalPlatformBalanceLkr, 'USDT')} USDT
            </div>
          </div>

          <div
            onClick={() => setActiveTab('deposits')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              isDark
                ? 'bg-[#121c33]/90 border-amber-500/35 hover:border-amber-400'
                : 'bg-white border-amber-300 shadow-sm'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-amber-400 flex items-center gap-1.5 font-bold">
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Pending Deposits</span>
            </div>
            <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
              {pendingDepositsCount}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Total Requests: {allDeposits.length}
            </div>
          </div>

          <div
            onClick={() => setActiveTab('withdrawals')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              isDark
                ? 'bg-[#121c33]/90 border-rose-500/35 hover:border-rose-400'
                : 'bg-white border-rose-300 shadow-sm'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-rose-400 flex items-center gap-1.5 font-bold">
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>Pending Withdrawals</span>
            </div>
            <div className="text-2xl font-mono font-extrabold text-rose-400 mt-1">
              {pendingWithdrawalsCount}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Total Requests: {allWithdrawals.length}
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('users');
              setVipFilter('upgrade_required');
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all col-span-2 lg:col-span-1 ${
              isDark
                ? 'bg-[#121c33]/90 border-pink-500/35 hover:border-pink-400'
                : 'bg-white border-pink-300 shadow-sm'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-pink-400 flex items-center gap-1.5 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Upgrade Want Active</span>
            </div>
            <div className="text-2xl font-mono font-extrabold text-pink-400 mt-1">
              {upgradeRequiredUsersCount}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Must Upgrade Next VIP
            </div>
          </div>
        </div>

        {/* 7 Main Admin Navigation Tabs */}
        <div
          className={`p-2 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 ${
            isDark ? 'bg-[#121c33]/95 border-white/10' : 'bg-white border-pink-200 shadow-sm'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Registered Users ({userBundles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kyc_requests')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'kyc_requests'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              KYC Verification &amp; Docs (
              {
                userBundles.filter(
                  (b) => b.kycRecord || b.profile.kycStatus !== 'unverified'
                ).length
              }
              )
            </span>
            {userBundles.filter(
              (b) =>
                b.profile.kycStatus === 'pending' || b.kycRecord?.status === 'pending'
            ).length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-extrabold">
                {
                  userBundles.filter(
                    (b) =>
                      b.profile.kycStatus === 'pending' ||
                      b.kycRecord?.status === 'pending'
                  ).length
                }{' '}
                Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deposits')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'deposits'
                ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Deposit Tab ({allDeposits.length})</span>
            {pendingDepositsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-extrabold">
                {pendingDepositsCount} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span>Withdrawal Tab ({allWithdrawals.length})</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-extrabold">
                {pendingWithdrawalsCount} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Notifications &amp; Broadcasts ({globalBroadcasts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sponsors')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sponsors'
                ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4 text-pink-400" />
            <span>Sponsor Countries &amp; Members ({SPONSOR_COUNTRIES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vip_manager')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'vip_manager'
                ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>VIP Packages Manager ({VIP_TIERS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks_manager')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tasks_manager'
                ? 'bg-gradient-to-r from-emerald-500 via-sky-500 to-pink-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ListChecks className="w-4 h-4 text-emerald-400" />
            <span>VIP Tasks Manager ({PLATFORM_DAILY_TASKS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('day_challenges')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'day_challenges'
                ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-rose-600 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>VIP Day Challenges Manager (1.5x)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live_chat')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'live_chat'
                ? 'bg-gradient-to-r from-emerald-500 via-sky-500 to-pink-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Live Chat &amp; Support Channels</span>
          </button>
        </div>

        {/* =====================================================================
         * TAB 1: ALL REGISTERED USERS TAB
         * ===================================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div
              className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#121c33]/90 border-white/10'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by username, mobile number, email, UID, or referral code..."
                  className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    isDark
                      ? 'bg-[#0c1428] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Edit All Members Count inline control */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                    isDark
                      ? 'bg-[#0c1428] border-sky-500/35'
                      : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-[11px] font-mono font-bold text-slate-400 whitespace-nowrap">
                    All Members:
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={quickAllMembersCount}
                    onChange={(e) => setQuickAllMembersCount(e.target.value)}
                    className={`w-28 px-2 py-1 rounded-lg border text-xs font-mono font-extrabold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleQuickSaveAllMembersCount}
                    className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                    title="Save All Members Count"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>

                <select
                  value={vipFilter}
                  onChange={(e) => setVipFilter(e.target.value)}
                  className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border cursor-pointer ${
                    isDark
                      ? 'bg-[#0c1428] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="all">All VIP Levels ({userBundles.length})</option>
                  <option value="0">VIP 0 — Starter</option>
                  <option value="1">VIP 1 — Zentro Bronze</option>
                  <option value="2">VIP 2 — Zentro Silver</option>
                  <option value="3">VIP 3 — Zentro Gold</option>
                  <option value="4">VIP 4 — Zentro Platinum</option>
                  <option value="upgrade_required">
                    Upgrade Want Enabled ({upgradeRequiredUsersCount})
                  </option>
                </select>

                {/* Admin Add New User Button */}
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add User</span>
                </button>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div
                className={`p-12 rounded-3xl border text-center space-y-2 ${
                  isDark ? 'bg-[#121c33]/80 border-white/10' : 'bg-white border-pink-200'
                }`}
              >
                <Users className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="text-base font-bold">No Registered Users Found</div>
                <p className="text-xs text-slate-400">
                  Users who register on the platform will appear here automatically with their full account balance and controls.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((bundle) => {
                  const u = bundle.profile;
                  const userCurr = getActiveCurrency(u);
                  const vipObj =
                    VIP_TIERS.find((t) => t.level === u.vipLevel) || VIP_TIERS[0];
                  const nextVipObj =
                    VIP_TIERS.find((t) => t.level === Math.min(4, u.vipLevel + 1)) ||
                    VIP_TIERS[4];
                  const isUpgradeEnabled = Boolean(u.mustUpgradeNextVip);

                  return (
                    <div
                      key={bundle.uid}
                      className={`p-5 rounded-3xl border transition-all space-y-4 ${
                        isUpgradeEnabled
                          ? isDark
                            ? 'bg-gradient-to-r from-[#1a132c] via-[#141c34] to-[#241228] border-rose-500/50'
                            : 'bg-rose-50/40 border-rose-300 shadow-sm'
                          : isDark
                            ? 'bg-[#121c33]/95 border-white/10 hover:border-pink-500/40'
                            : 'bg-white border-pink-200 shadow-sm'
                      }`}
                    >
                      {/* Top Row: User Identity, VIP Badge, Session Status & Account Balance */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base sm:text-lg font-extrabold font-display">
                              {u.username}
                            </span>

                            <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-sky-500/20 to-pink-500/20 border border-pink-500/40 text-pink-400 text-xs font-mono font-bold flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span>
                                VIP {u.vipLevel} · {vipObj.name}
                              </span>
                            </span>

                            {bundle.isCurrentlyLoggedIn ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-extrabold">
                                ● ONLINE SESSION
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-500/20 border border-slate-400/30 text-slate-400 text-[10px] font-mono font-bold">
                                OFFLINE / LOGGED OUT
                              </span>
                            )}

                            {/* Live KYC Verification Badge on User Card */}
                            {u.kycStatus === 'verified' ||
                            bundle.kycRecord?.status === 'verified' ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-extrabold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>KYC VERIFIED ✓ (WITHDRAW UNLOCKED)</span>
                              </span>
                            ) : u.kycStatus === 'pending' ||
                              bundle.kycRecord?.status === 'pending' ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-extrabold flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>KYC PENDING ADMIN VERIFICATION</span>
                              </span>
                            ) : u.kycStatus === 'rejected' ||
                              bundle.kycRecord?.status === 'rejected' ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-mono font-extrabold">
                                KYC REJECTED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/15 border border-rose-400/30 text-rose-300 text-[10px] font-mono font-bold">
                                🔒 KYC UNVERIFIED (WITHDRAW LOCKED)
                              </span>
                            )}

                            {isUpgradeEnabled && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/25 border border-rose-400/50 text-rose-300 text-[10px] font-mono font-extrabold animate-pulse">
                                UPGRADE WANT ENABLED → MUST UPGRADE TO {nextVipObj.name.toUpperCase()} (NO MINING / NO WITHDRAW)
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                            <span>UID: {u.uid}</span>
                            <span>
                              Phone: {u.countryCode} {u.mobile}
                            </span>
                            <span>Email: {u.email}</span>
                            <span>
                              Country: {u.country || 'Not Set'} · Currency:{' '}
                              <strong className="text-sky-400">{userCurr}</strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono">
                            <span>
                              Referral Code:{' '}
                              <strong className="text-pink-400">{u.referralCode}</strong>
                            </span>
                            <span>
                              Invited By:{' '}
                              <strong className="text-sky-400">
                                {u.referredBy || 'None'}
                              </strong>
                            </span>
                            {u.ipAddress && <span>IP: {u.ipAddress}</span>}
                            {u.deviceId && <span>Device: {u.deviceId}</span>}
                          </div>
                        </div>

                        {/* Right Side: Account Balance Showcase */}
                        <div
                          className={`p-3.5 rounded-2xl border flex flex-col sm:items-end justify-center shrink-0 ${
                            isDark
                              ? 'bg-[#0b1326] border-pink-500/30'
                              : 'bg-pink-50/70 border-pink-200'
                          }`}
                        >
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            Account Balance
                          </div>
                          <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 tabular-nums">
                            {formatCurrencyValue(u.balance, 'LKR')} LKR
                          </div>
                          <div className="text-xs font-mono text-sky-400 font-bold">
                            {userCurr !== 'LKR'
                              ? `${formatSiteAmount(u.balance, userCurr)} · `
                              : ''}
                            Total Yield: {formatCurrencyValue(u.totalEarnings, 'LKR')} LKR
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: All Admin Action Controls for This User */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. Edit User Balance */}
                          <button
                            type="button"
                            onClick={() => openEditBalanceModal(bundle)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Edit Balance</span>
                          </button>

                          {/* 2. Edit User VIP */}
                          <button
                            type="button"
                            onClick={() => openEditVipModal(bundle)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Edit VIP (VIP {u.vipLevel})</span>
                          </button>

                          {/* 3. View / Verify KYC & Uploaded ID Documents */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdminKycNoteInput(bundle.kycRecord?.adminNotes || '');
                              setViewingKycModal({
                                record: bundle.kycRecord,
                                bundle,
                              });
                            }}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                              u.kycStatus === 'verified'
                                ? 'bg-teal-500/15 hover:bg-teal-500/25 border-teal-500/40 text-teal-300'
                                : u.kycStatus === 'pending' || bundle.kycRecord
                                  ? 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-400 text-amber-200'
                                  : 'bg-slate-500/15 hover:bg-slate-500/25 border-slate-500/40 text-slate-300'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {bundle.kycRecord?.documentImageDataUrl
                                ? 'Inspect KYC ID Photo & Verify'
                                : `Manage KYC (${u.kycStatus.toUpperCase()})`}
                            </span>
                          </button>

                          {/* 4. View User Transaction History */}
                          <button
                            type="button"
                            onClick={() => setViewingTxUser(bundle)}
                            className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>
                              Transaction History ({bundle.transactions.length})
                            </span>
                          </button>

                          {/* 5. View User Referral Chain */}
                          <button
                            type="button"
                            onClick={() => setViewingRefUser(bundle)}
                            className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>View Referral Chain</span>
                          </button>

                          {/* View Bound Bank / USDT Details */}
                          <button
                            type="button"
                            onClick={() => setViewingUserBanksModal(bundle)}
                            className="px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Bound Banks ({bundle.bankAccounts.length})</span>
                          </button>

                          {/* Direct Notify User Shortcut */}
                          <button
                            type="button"
                            onClick={() => {
                              setNotifTargetUid(bundle.uid);
                              setActiveTab('notifications');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Notify User</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* 5. Admin "User Upgrade Want Enable" Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleUpgradeWant(bundle)}
                            className={`px-4 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                              isUpgradeEnabled
                                ? 'bg-gradient-to-r from-rose-600 to-pink-600 border-rose-400 text-white'
                                : 'bg-pink-500/15 hover:bg-pink-500/25 border-pink-500/40 text-pink-300'
                            }`}
                          >
                            {isUpgradeEnabled ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>
                                  Upgrade Want: ENABLED (Must Upgrade VIP {Math.min(4, u.vipLevel + 1)} — Click to Disable)
                                </span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>
                                  Upgrade Want Enable (Require Next VIP)
                                </span>
                              </>
                            )}
                          </button>

                          {/* 6. Admin Logout User Button */}
                          <button
                            type="button"
                            onClick={() => handleForceLogoutUser(bundle)}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Logout User</span>
                          </button>

                          {/* 7. Admin Delete User Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingUserBundle(bundle)}
                            className="px-3.5 py-2 rounded-xl bg-red-600/25 hover:bg-red-600/40 border border-red-500/50 text-red-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete User</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
         * TAB 2: DEPOSIT TAB (Manage Deposit Banks & USDT BEP-20 + Approve/Reject Deposits)
         * ===================================================================== */}
        {activeTab === 'deposits' && (
          <div className="space-y-6">
            {/* ADMIN DEPOSIT BANK DETAILS & USDT BEP-20 ADDRESSES CRUD MANAGER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. Deposit Bank Details Manager (Add / Edit / Delete + Add More Banks) */}
              <div
                className={`p-5 rounded-3xl border space-y-4 ${
                  isDark
                    ? 'bg-[#121c33]/95 border-white/10'
                    : 'bg-white border-pink-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold font-display flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-400" />
                      <span>
                        Deposit Bank Details ({officialDepositBanks.length} Banks)
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Admin can Add more banks, Edit, or Delete deposit bank accounts.
                    </p>
                  </div>
                  {editingDepositBankId && (
                    <button
                      type="button"
                      onClick={resetBankForm}
                      className="px-2.5 py-1 rounded-lg bg-slate-500/20 text-xs font-bold cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Add / Edit Bank Form */}
                <form onSubmit={handleSaveDepositBank} className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1 text-[11px]">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankFormName}
                        onChange={(e) => setBankFormName(e.target.value)}
                        placeholder="e.g. Commercial Bank / BOC / HNB"
                        className={`w-full px-3 py-2 rounded-xl border ${
                          isDark
                            ? 'bg-[#0b1326] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-[11px]">
                        Country / Scope *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankFormCountry}
                        onChange={(e) => setBankFormCountry(e.target.value)}
                        placeholder="Sri Lanka or International"
                        className={`w-full px-3 py-2 rounded-xl border ${
                          isDark
                            ? 'bg-[#0b1326] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1 text-[11px]">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankFormAccNo}
                        onChange={(e) => setBankFormAccNo(e.target.value)}
                        placeholder="e.g. 8840 1920 4410"
                        className={`w-full px-3 py-2 rounded-xl border font-mono ${
                          isDark
                            ? 'bg-[#0b1326] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-[11px]">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankFormHolder}
                        onChange={(e) => setBankFormHolder(e.target.value)}
                        placeholder="ZENTRO HOLDINGS (PVT) LTD"
                        className={`w-full px-3 py-2 rounded-xl border ${
                          isDark
                            ? 'bg-[#0b1326] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1 text-[11px]">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        value={bankFormBranch}
                        onChange={(e) => setBankFormBranch(e.target.value)}
                        placeholder="e.g. Colombo 01 Corporate Branch"
                        className={`w-full px-3 py-2 rounded-xl border ${
                          isDark
                            ? 'bg-[#0b1326] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-[11px]">
                        SWIFT / BIC Code
                      </label>
                      <input
                        type="text"
                        value={bankFormSwift}
                        onChange={(e) => setBankFormSwift(e.target.value)}
                        placeholder="e.g. CCEYLKLX"
                        className={`w-full px-3 py-2 rounded-xl border font-mono ${
                          isDark
                            ? 'bg-[#0b1326] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-95 text-white font-extrabold text-xs cursor-pointer shadow-sm"
                  >
                    {editingDepositBankId
                      ? 'Save Updated Bank Details'
                      : '+ Add Deposit Bank Account'}
                  </button>
                </form>

                {/* Existing Deposit Banks List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 pt-1">
                  {officialDepositBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                        isDark
                          ? 'bg-[#0b1326] border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold truncate">
                          {bank.bankName}{' '}
                          <span className="text-[10px] font-mono text-sky-400">
                            ({bank.country})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-pink-400 font-bold">
                          Acc: {bank.accountNumber} · {bank.accountName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Branch: {bank.branchName} · SWIFT: {bank.swiftCode}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditDepositBank(bank)}
                          className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 cursor-pointer"
                          title="Edit Bank"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDepositBank(bank.id)}
                          className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 cursor-pointer"
                          title="Delete Bank"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. USDT (BEP-20) Addresses Manager (Add / Edit / Delete) */}
              <div
                className={`p-5 rounded-3xl border space-y-4 ${
                  isDark
                    ? 'bg-[#121c33]/95 border-white/10'
                    : 'bg-white border-pink-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold font-display flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span>
                        USDT (BEP-20) Deposit Addresses ({officialUsdtList.length})
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Admin can Add, Edit, or Delete USDT (BEP-20 / TRC-20) wallet addresses.
                    </p>
                  </div>
                  {editingUsdtId && (
                    <button
                      type="button"
                      onClick={resetUsdtForm}
                      className="px-2.5 py-1 rounded-lg bg-slate-500/20 text-xs font-bold cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Add / Edit USDT Address Form */}
                <form onSubmit={handleSaveUsdtAddress} className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1 text-[11px]">
                        Network Name / Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={usdtFormNetworkName}
                        onChange={(e) => setUsdtFormNetworkName(e.target.value)}
                        placeholder="e.g. BNB Smart Chain (BEP-20)"
                        className={`w-full px-3 py-2 rounded-xl border ${
                          isDark
                            ? 'bg-[#0b1326] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-[11px]">
                        Token Standard *
                      </label>
                      <input
                        type="text"
                        required
                        value={usdtFormTokenStandard}
                        onChange={(e) => setUsdtFormTokenStandard(e.target.value)}
                        placeholder="USDT-BEP20"
                        className={`w-full px-3 py-2 rounded-xl border font-mono ${
                          isDark
                            ? 'bg-[#0b1326] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[11px]">
                      USDT (BEP-20) Wallet Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={usdtFormWalletAddress}
                      onChange={(e) => setUsdtFormWalletAddress(e.target.value)}
                      placeholder="0x... or T..."
                      className={`w-full px-3 py-2 rounded-xl border font-mono ${
                        isDark
                          ? 'bg-[#0b1326] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[11px]">
                      Confirmation Time / Note
                    </label>
                    <input
                      type="text"
                      value={usdtFormMinConf}
                      onChange={(e) => setUsdtFormMinConf(e.target.value)}
                      placeholder="15 Blocks (~45 sec)"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isDark
                          ? 'bg-[#0b1326] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs cursor-pointer shadow-sm"
                  >
                    {editingUsdtId
                      ? 'Save Updated USDT Address'
                      : '+ Add USDT (BEP-20) Address'}
                  </button>
                </form>

                {/* Existing USDT Addresses List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 pt-1">
                  {officialUsdtList.map((net) => (
                    <div
                      key={net.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                        isDark
                          ? 'bg-[#0b1326] border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold flex items-center gap-1.5">
                          <span>{net.networkName}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                            {net.tokenStandard}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 break-all mt-0.5">
                          {net.walletAddress}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Confirmations: {net.minConfirmations}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditUsdtAddress(net)}
                          className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 cursor-pointer"
                          title="Edit USDT Address"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUsdtAddress(net.id)}
                          className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 cursor-pointer"
                          title="Delete USDT Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#121c33]/90 border-white/10'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div>
                <h2 className="text-base font-extrabold font-display">
                  Deposit Requests & Payment Receipt Verification
                </h2>
                <p className="text-xs text-slate-400">
                  Review uploaded bank slips / USDT receipts and Approve or Reject deposits. Approving automatically credits the user&apos;s balance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: `All (${allDeposits.length})` },
                    {
                      id: 'pending_admin',
                      label: `Pending (${
                        allDeposits.filter((d) => d.deposit.status === 'pending_admin')
                          .length
                      })`,
                    },
                    {
                      id: 'approved',
                      label: `Approved (${
                        allDeposits.filter((d) => d.deposit.status === 'approved').length
                      })`,
                    },
                    {
                      id: 'rejected',
                      label: `Rejected (${
                        allDeposits.filter((d) => d.deposit.status === 'rejected').length
                      })`,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDepositFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      depositFilter === f.id
                        ? 'bg-pink-500 text-white shadow-sm'
                        : isDark
                          ? 'bg-[#0c1428] text-slate-300 border border-white/10'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredDeposits.length === 0 ? (
              <div
                className={`p-12 rounded-3xl border text-center space-y-2 ${
                  isDark ? 'bg-[#121c33]/80 border-white/10' : 'bg-white border-pink-200'
                }`}
              >
                <ArrowDownToLine className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="text-base font-bold">No Deposit Requests Found</div>
                <p className="text-xs text-slate-400">
                  Submitted user deposits with uploaded bank slips will appear here for approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeposits.map(({ deposit, owner }) => {
                  const isPending = deposit.status === 'pending_admin';
                  const isApproved = deposit.status === 'approved';

                  return (
                    <div
                      key={deposit.id}
                      className={`p-5 rounded-3xl border space-y-4 ${
                        isDark
                          ? 'bg-[#121c33]/95 border-white/10'
                          : 'bg-white border-pink-200 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-pink-400">
                              {deposit.referenceCode}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-mono font-bold uppercase">
                              {deposit.depositType === 'bank'
                                ? `BANK · ${deposit.country}`
                                : 'USDT CRYPTO'}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase ${
                                isApproved
                                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                                  : deposit.status === 'rejected'
                                    ? 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                                    : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                              }`}
                            >
                              {isApproved
                                ? 'APPROVED'
                                : deposit.status === 'rejected'
                                  ? 'REJECTED'
                                  : 'PENDING ADMIN APPROVE'}
                            </span>
                          </div>

                          <div className="text-sm font-bold">
                            User:{' '}
                            <span className="text-sky-400">{deposit.username}</span>{' '}
                            {owner && (
                              <span className="text-xs font-mono text-slate-400">
                                ({owner.profile.countryCode} {owner.profile.mobile} ·
                                Current Balance:{' '}
                                {formatCurrencyValue(owner.profile.balance, 'LKR')} LKR)
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-300 font-mono pt-1">
                            <div>
                              <span className="text-slate-400">Selected Bank/Network:</span>{' '}
                              <strong>{deposit.selectedBankName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Depositor Name:</span>{' '}
                              <strong>{deposit.depositorName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Package / Purpose:</span>{' '}
                              <strong>{deposit.selectedVipLabel}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Submitted At:</span>{' '}
                              <span>
                                {new Date(deposit.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Deposit Amount & Receipt Preview Thumbnail */}
                        <div className="flex flex-wrap items-center gap-4 shrink-0">
                          {deposit.slipDataUrl && (
                            <div
                              onClick={() =>
                                setViewingReceiptDeposit({
                                  deposit,
                                  user: owner?.profile || null,
                                })
                              }
                              title="Click to View Full Receipt"
                              className="w-16 h-16 rounded-2xl border border-pink-500/40 overflow-hidden bg-black/40 cursor-pointer relative group shrink-0"
                            >
                              <img
                                src={deposit.slipDataUrl}
                                alt="Deposit Slip"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl border text-right ${
                              isDark
                                ? 'bg-[#0b1326] border-emerald-500/30'
                                : 'bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            <div className="text-[10px] font-mono uppercase text-slate-400">
                              Deposit Amount
                            </div>
                            <div className="text-xl font-mono font-extrabold text-emerald-400 tabular-nums">
                              +{formatCurrencyValue(deposit.amountInLkr, 'LKR')} LKR
                            </div>
                            {deposit.activeCurrency !== 'LKR' && (
                              <div className="text-xs font-mono text-sky-400 font-bold">
                                ({deposit.amountInActiveCurrency} {deposit.activeCurrency})
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: View Receipt + Approve + Reject */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setViewingReceiptDeposit({
                              deposit,
                              user: owner?.profile || null,
                            })
                          }
                          className="px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                        >
                          <FileImage className="w-4 h-4" />
                          <span>
                            View Receipt Slip ({deposit.slipFileName || 'Slip Image'})
                          </span>
                        </button>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveDeposit(deposit, owner)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>
                                  Approve Deposit (+
                                  {formatCurrencyValue(deposit.amountInLkr, 'LKR')} LKR)
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectDeposit(deposit, owner)}
                                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject Deposit</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-mono text-slate-400">
                              Decision recorded:{' '}
                              <strong
                                className={
                                  isApproved ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {isApproved ? 'APPROVED & CREDITED' : 'REJECTED'}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
         * TAB 3: WITHDRAWAL TAB (Approve / Reject + User Bank Details with Copy Buttons)
         * ===================================================================== */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#121c33]/90 border-white/10'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div>
                <h2 className="text-base font-extrabold font-display">
                  Withdrawal Requests & Bound Bank / USDT (BEP-20) Payout Details
                </h2>
                <p className="text-xs text-slate-400">
                  Copy user bank or USDT BEP-20 wallet details with one click, then Approve or Reject (rejecting automatically refunds the user&apos;s balance).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: `All (${allWithdrawals.length})` },
                    {
                      id: 'pending_admin',
                      label: `Pending (${
                        allWithdrawals.filter(
                          (w) => w.withdrawal.status === 'pending_admin'
                        ).length
                      })`,
                    },
                    {
                      id: 'approved',
                      label: `Approved (${
                        allWithdrawals.filter((w) => w.withdrawal.status === 'approved')
                          .length
                      })`,
                    },
                    {
                      id: 'rejected',
                      label: `Rejected (${
                        allWithdrawals.filter((w) => w.withdrawal.status === 'rejected')
                          .length
                      })`,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setWithdrawFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      withdrawFilter === f.id
                        ? 'bg-pink-500 text-white shadow-sm'
                        : isDark
                          ? 'bg-[#0c1428] text-slate-300 border border-white/10'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div
                className={`p-12 rounded-3xl border text-center space-y-2 ${
                  isDark ? 'bg-[#121c33]/80 border-white/10' : 'bg-white border-pink-200'
                }`}
              >
                <ArrowUpFromLine className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="text-base font-bold">No Withdrawal Requests Found</div>
                <p className="text-xs text-slate-400">
                  User Bank (LKR) and USDT (BEP-20) withdrawal requests will appear here with copyable payout details.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWithdrawals.map(({ withdrawal, owner }) => {
                  const isPending = withdrawal.status === 'pending_admin';
                  const isApproved = withdrawal.status === 'approved';
                  const isBank = withdrawal.withdrawType === 'bank';

                  return (
                    <div
                      key={withdrawal.id}
                      className={`p-5 rounded-3xl border space-y-4 ${
                        isDark
                          ? 'bg-[#121c33]/95 border-white/10'
                          : 'bg-white border-pink-200 shadow-sm'
                      }`}
                    >
                      {/* Top Row: User Info & Payout Summary */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-pink-400">
                              {withdrawal.referenceCode}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase ${
                                isBank
                                  ? 'bg-sky-500/20 border border-sky-400/40 text-sky-300'
                                  : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                              }`}
                            >
                              {isBank
                                ? 'BANK WITHDRAWAL (LKR)'
                                : 'USDT (BEP-20) WITHDRAWAL'}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase ${
                                isApproved
                                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                                  : withdrawal.status === 'rejected'
                                    ? 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                                    : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                              }`}
                            >
                              {isApproved
                                ? 'APPROVED & PAID'
                                : withdrawal.status === 'rejected'
                                  ? 'REJECTED (REFUNDED)'
                                  : 'PENDING ADMIN APPROVE'}
                            </span>
                          </div>

                          <div className="text-sm font-bold">
                            User:{' '}
                            <span className="text-sky-400">{withdrawal.username}</span>{' '}
                            {owner && (
                              <span className="text-xs font-mono text-slate-400">
                                ({owner.profile.countryCode} {owner.profile.mobile} ·
                                Remaining Wallet:{' '}
                                {formatCurrencyValue(owner.profile.balance, 'LKR')} LKR)
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-mono text-slate-400">
                            Requested At:{' '}
                            {new Date(withdrawal.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Gross, Fee, and Net Payout Box */}
                        <div
                          className={`p-3.5 rounded-2xl border flex flex-wrap items-center gap-4 ${
                            isDark
                              ? 'bg-[#0b1326] border-pink-500/30'
                              : 'bg-pink-50/70 border-pink-200'
                          }`}
                        >
                          <div>
                            <div className="text-[10px] font-mono uppercase text-slate-400">
                              Gross Amount
                            </div>
                            <div className="text-sm font-mono font-bold">
                              {withdrawal.amountInDisplayUnit} {withdrawal.displayUnit}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase text-slate-400">
                              Fee
                            </div>
                            <div className="text-sm font-mono font-bold text-amber-400">
                              -{withdrawal.feeInDisplayUnit} {withdrawal.displayUnit}
                            </div>
                          </div>
                          <div className="pl-3 border-l border-white/10">
                            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                              Net Payout To Send
                            </div>
                            <div className="text-xl font-mono font-extrabold text-emerald-400 tabular-nums">
                              {withdrawal.netAmountInDisplayUnit}{' '}
                              {withdrawal.displayUnit}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* USER BANK / USDT BEP-20 DETAILS WITH COPY BUTTONS */}
                      <div
                        className={`p-4 rounded-2xl border space-y-3 ${
                          isDark
                            ? 'bg-[#0c1428] border-sky-500/30'
                            : 'bg-slate-50 border-sky-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-extrabold flex items-center gap-1.5">
                            {isBank ? (
                              <Building2 className="w-4 h-4 text-sky-400" />
                            ) : (
                              <Coins className="w-4 h-4 text-emerald-400" />
                            )}
                            <span>
                              {isBank
                                ? 'User Bank Account Details (Click to Copy)'
                                : 'User USDT (BEP-20) Wallet Details (Click to Copy)'}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                `${withdrawal.networkOrBankName} | Holder: ${withdrawal.accountHolderOrLabel} | Acc/Addr: ${withdrawal.accountNumberOrAddress} | Branch/Net: ${withdrawal.branchOrStandard} | Net Payout: ${withdrawal.netAmountInDisplayUnit} ${withdrawal.displayUnit}`,
                                `all_${withdrawal.id}`
                              )
                            }
                            className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === `all_${withdrawal.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied All Details!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy All Payout Details</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* Field 1: Bank Name / Network */}
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                              isDark
                                ? 'bg-[#131d36] border-white/10'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-[10px] font-mono uppercase text-slate-400">
                                {isBank ? 'Bank Name' : 'Network'}
                              </div>
                              <div className="font-bold truncate mt-0.5">
                                {withdrawal.networkOrBankName}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  withdrawal.networkOrBankName,
                                  `bank_${withdrawal.id}`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {copiedKey === `bank_${withdrawal.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-sky-400" />
                              )}
                              <span>
                                {copiedKey === `bank_${withdrawal.id}` ? 'Copied' : 'Copy'}
                              </span>
                            </button>
                          </div>

                          {/* Field 2: Account Holder Name / Label */}
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                              isDark
                                ? 'bg-[#131d36] border-white/10'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-[10px] font-mono uppercase text-slate-400">
                                {isBank ? 'Account Holder Name' : 'Wallet Label'}
                              </div>
                              <div className="font-bold truncate mt-0.5">
                                {withdrawal.accountHolderOrLabel}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  withdrawal.accountHolderOrLabel,
                                  `holder_${withdrawal.id}`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {copiedKey === `holder_${withdrawal.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-sky-400" />
                              )}
                              <span>
                                {copiedKey === `holder_${withdrawal.id}`
                                  ? 'Copied'
                                  : 'Copy'}
                              </span>
                            </button>
                          </div>

                          {/* Field 3: Account Number / 0x BEP-20 Address */}
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                              isDark
                                ? 'bg-[#131d36] border-pink-500/30'
                                : 'bg-white border-pink-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-[10px] font-mono uppercase text-pink-400 font-bold">
                                {isBank
                                  ? 'Bank Account Number'
                                  : 'USDT (BEP-20) Address'}
                              </div>
                              <div className="font-mono font-extrabold text-sky-400 break-all mt-0.5">
                                {withdrawal.accountNumberOrAddress}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  withdrawal.accountNumberOrAddress,
                                  `acc_${withdrawal.id}`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 text-xs font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {copiedKey === `acc_${withdrawal.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {copiedKey === `acc_${withdrawal.id}` ? 'Copied' : 'Copy'}
                              </span>
                            </button>
                          </div>

                          {/* Field 4: Branch / Standard + Net Amount Copy */}
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                              isDark
                                ? 'bg-[#131d36] border-white/10'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-[10px] font-mono uppercase text-slate-400">
                                {isBank ? 'Branch / Code' : 'Token Standard'}
                              </div>
                              <div className="font-mono font-bold truncate mt-0.5">
                                {withdrawal.branchOrStandard}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  withdrawal.branchOrStandard,
                                  `branch_${withdrawal.id}`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {copiedKey === `branch_${withdrawal.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-sky-400" />
                              )}
                              <span>
                                {copiedKey === `branch_${withdrawal.id}`
                                  ? 'Copied'
                                  : 'Copy'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: View All User Bound Banks + Approve / Reject Withdrawal */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                String(withdrawal.netAmountInDisplayUnit),
                                `netamt_${withdrawal.id}`
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === `netamt_${withdrawal.id}` ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>
                              Copy Net Amount ({withdrawal.netAmountInDisplayUnit}{' '}
                              {withdrawal.displayUnit})
                            </span>
                          </button>

                          {owner && (
                            <button
                              type="button"
                              onClick={() => setViewingUserBanksModal(owner)}
                              className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              <span>
                                View All User Bound Accounts ({owner.bankAccounts.length})
                              </span>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveWithdrawal(withdrawal, owner)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>
                                  Approve Withdrawal ({withdrawal.netAmountInDisplayUnit}{' '}
                                  {withdrawal.displayUnit})
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectWithdrawal(withdrawal, owner)}
                                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject & Refund Balance</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-mono text-slate-400">
                              Status:{' '}
                              <strong
                                className={
                                  isApproved ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {isApproved
                                  ? 'APPROVED BY ADMIN'
                                  : 'REJECTED & REFUNDED'}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
         * TAB 4: NOTIFICATIONS & GLOBAL BROADCASTS TAB
         * ===================================================================== */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Notification Composer */}
            <div
              className={`lg:col-span-7 p-5 sm:p-6 rounded-3xl border space-y-4 ${
                isDark
                  ? 'bg-[#121c33]/95 border-white/10'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-base font-extrabold font-display flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-pink-400" />
                    <span>Send Notification / Global Broadcast</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dispatch real-time notifications to all members or a specific user.
                  </p>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                  1-Click Quick Templates:
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: 'VIP Upgrade Promo',
                      cat: 'vip' as NotificationCategory,
                      pri: 'high' as NotificationPriority,
                      tab: 'vip' as const,
                      title: 'Unlock Higher Daily Mining Yields Today!',
                      titleSi: 'අදම ඉහළ දෛනික පතල් කැණීමේ ප්‍රතිලාභ ලබා ගන්න!',
                      msg: 'Upgrade to Zentro Gold (10%/day) or Zentro Platinum (12%/day) to maximize your daily mining and L1-L5 team referral commissions.',
                      msgSi:
                        'Zentro Gold (දිනකට 10%) හෝ Zentro Platinum (දිනකට 12%) වෙත උත්ශ්‍රේණි කර ඔබගේ දෛනික ආදායම සහ කණ්ඩායම් කොමිස් වැඩි කරගන්න.',
                    },
                    {
                      label: 'Daily Tasks Reminder',
                      cat: 'task' as NotificationCategory,
                      pri: 'normal' as NotificationPriority,
                      tab: 'task' as const,
                      title: 'Daily VIP Tasks & 5-Member Bonus Ready',
                      titleSi: 'දෛනික VIP කාර්යයන් සහ ප්‍රසාද දීමනා සූදානම්',
                      msg: 'Complete your daily VIP tasks and claim your Live Currency Mining rewards before the daily reset.',
                      msgSi:
                        'ඔබගේ දෛනික VIP කාර්යයන් සම්පූර්ණ කර සජීවී පතල් කැණීමේ ප්‍රතිලාභ දැන්ම ලබා ගන්න.',
                    },
                    {
                      label: 'Fast Settlement Notice',
                      cat: 'transaction' as NotificationCategory,
                      pri: 'high' as NotificationPriority,
                      tab: 'home' as const,
                      title: 'Instant Bank & USDT (BEP-20) Settlements Active',
                      titleSi: 'බැංකු සහ USDT (BEP-20) ගෙවීම් ක්‍රියාත්මකයි',
                      msg: 'All Bank LKR and USDT (BEP-20) deposits and withdrawals are being processed smoothly by the Zentro Settlement Desk.',
                      msgSi:
                        'සියලුම බැංකු සහ USDT (BEP-20) තැන්පතු හා මුදල් ආපසු ගැනීම් වේගවත්ව ක්‍රියාත්මක වේ.',
                    },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => {
                        setNotifCategory(tpl.cat);
                        setNotifPriority(tpl.pri);
                        setNotifActionTab(tpl.tab);
                        setNotifTitle(tpl.title);
                        setNotifTitleSi(tpl.titleSi);
                        setNotifMessage(tpl.msg);
                        setNotifMessageSi(tpl.msgSi);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/35 text-pink-300 text-xs font-bold cursor-pointer"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendAdminNotification} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Target Recipient</label>
                    <select
                      value={notifTargetUid}
                      onChange={(e) => setNotifTargetUid(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border font-bold ${
                        isDark
                          ? 'bg-[#16223d] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="ALL">📢 All Users (Global Broadcast)</option>
                      {userBundles.map((b) => (
                        <option key={b.uid} value={b.uid}>
                          👤 {b.profile.username} ({b.profile.mobile})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Category</label>
                    <select
                      value={notifCategory}
                      onChange={(e) =>
                        setNotifCategory(e.target.value as NotificationCategory)
                      }
                      className={`w-full px-3 py-2.5 rounded-xl border font-bold ${
                        isDark
                          ? 'bg-[#16223d] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="system">System Announcement</option>
                      <option value="vip">VIP Membership</option>
                      <option value="mining">Live Mining</option>
                      <option value="transaction">Wallet / Settlement</option>
                      <option value="task">Daily Tasks</option>
                      <option value="referral">Team & Referrals</option>
                      <option value="security">Security Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Priority & Link Tab</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={notifPriority}
                        onChange={(e) =>
                          setNotifPriority(e.target.value as NotificationPriority)
                        }
                        className={`w-full px-2.5 py-2.5 rounded-xl border font-bold ${
                          isDark
                            ? 'bg-[#16223d] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>

                      <select
                        value={notifActionTab}
                        onChange={(e) =>
                          setNotifActionTab(
                            e.target.value as
                              | 'none'
                              | 'home'
                              | 'team'
                              | 'task'
                              | 'vip'
                              | 'my'
                          )
                        }
                        className={`w-full px-2.5 py-2.5 rounded-xl border font-bold ${
                          isDark
                            ? 'bg-[#16223d] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="vip">Link: VIP</option>
                        <option value="home">Link: Home</option>
                        <option value="task">Link: Task</option>
                        <option value="team">Link: Team</option>
                        <option value="my">Link: My</option>
                        <option value="none">No Link</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">
                      Notification Title (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="e.g. Special VIP Bonus Active"
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        isDark
                          ? 'bg-[#16223d] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      Title in Sinhala (Optional)
                    </label>
                    <input
                      type="text"
                      value={notifTitleSi}
                      onChange={(e) => setNotifTitleSi(e.target.value)}
                      placeholder="සිංහල මාතෘකාව (අත්‍යවශ්‍ය නොවේ)"
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        isDark
                          ? 'bg-[#16223d] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    Notification Message (English) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Enter the full announcement or personal message for the user..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    Message in Sinhala (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notifMessageSi}
                    onChange={(e) => setNotifMessageSi(e.target.value)}
                    placeholder="සිංහල පණිවිඩය (අත්‍යවශ්‍ය නොවේ)..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 via-pink-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {editingBroadcastId
                          ? 'Save & Republish Announcement to User Dashboard'
                          : notifTargetUid === 'ALL'
                            ? 'Send Announcement to Top of All User Dashboards'
                            : 'Send Direct Notification to Selected User'}
                      </span>
                    </button>
                    {editingBroadcastId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBroadcastId(null);
                          setNotifTitle('');
                          setNotifTitleSi('');
                          setNotifMessage('');
                          setNotifMessageSi('');
                        }}
                        className="py-3 px-4 rounded-2xl bg-slate-500/20 text-xs font-extrabold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
              </form>
            </div>

            {/* Right Column: Active Global Broadcasts / Dashboard Announcements History */}
            <div
              className={`lg:col-span-5 p-5 sm:p-6 rounded-3xl border space-y-4 ${
                isDark
                  ? 'bg-[#121c33]/95 border-white/10'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-extrabold font-display flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-400" />
                    <span>Active Announcements ({globalBroadcasts.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Displayed at the top of every User Dashboard (users can close/dismiss).
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {globalBroadcasts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No active announcements.
                  </div>
                ) : (
                  globalBroadcasts.map((b) => (
                    <div
                      key={b.id}
                      className={`p-4 rounded-2xl border space-y-2 text-xs ${
                        isDark
                          ? 'bg-[#16223d] border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[10px] font-bold uppercase">
                          {b.category} · {b.priority}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBroadcastId(b.id);
                              setNotifTargetUid('ALL');
                              setNotifCategory(b.category);
                              setNotifPriority(b.priority);
                              setNotifTitle(b.title);
                              setNotifTitleSi(b.titleSi || '');
                              setNotifMessage(b.message);
                              setNotifMessageSi(b.messageSi || '');
                              setNotifActionTab(b.actionTab || 'none');
                            }}
                            className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/15 cursor-pointer"
                            title="Edit Announcement"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteGlobalBroadcastNotification(b.id);
                              setGlobalBroadcasts(getGlobalBroadcastNotifications());
                              if (editingBroadcastId === b.id) {
                                setEditingBroadcastId(null);
                              }
                              showAdminNotice('Removed announcement.');
                            }}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                            title="Delete Announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="font-extrabold text-sm">{b.title}</div>
                      {b.titleSi && (
                        <div className="font-bold text-xs text-pink-300">{b.titleSi}</div>
                      )}
                      <p className="text-slate-300 leading-relaxed">{b.message}</p>
                      <div className="text-[10px] font-mono text-slate-400">
                        Sent: {new Date(b.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
         * TAB 1B: MANUAL KYC VERIFICATION & UPLOADED ID DOCUMENTS TAB
         * ===================================================================== */}
        {activeTab === 'kyc_requests' && (
          <div className="space-y-4">
            <div
              className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark
                  ? 'bg-[#121c33]/95 border-emerald-500/35'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base sm:text-lg font-extrabold font-display">
                    User KYC Verification &amp; Uploaded ID Documents
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Inspect user-uploaded NIC, Passport, and Driver License photos and manually Approve (Verify) or Reject KYC applications. Unverified users cannot make withdrawals.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: 'All Users' },
                    { id: 'pending', label: 'Pending Review' },
                    { id: 'verified', label: 'Verified' },
                    { id: 'rejected', label: 'Rejected' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setKycFilter(f.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      kycFilter === f.id
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 text-white shadow-md'
                        : isDark
                          ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const filteredKycBundles = userBundles.filter((b) => {
                const st = b.kycRecord?.status || b.profile.kycStatus;
                if (kycFilter === 'all') return true;
                return st === kycFilter;
              });

              if (filteredKycBundles.length === 0) {
                return (
                  <div
                    className={`p-12 rounded-3xl border text-center space-y-2 ${
                      isDark ? 'bg-[#121c33]/80 border-white/10' : 'bg-white border-pink-200'
                    }`}
                  >
                    <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
                    <div className="text-base font-bold">
                      No KYC Records Matching Filter ({kycFilter.toUpperCase()})
                    </div>
                    <p className="text-xs text-slate-400">
                      When users submit their KYC form and upload ID photos in the My -&gt; KYC tab, they appear here for manual Admin verification.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredKycBundles.map((bundle) => {
                    const u = bundle.profile;
                    const rec = bundle.kycRecord;
                    const st = rec?.status || u.kycStatus;

                    return (
                      <div
                        key={bundle.uid}
                        className={`p-5 rounded-3xl border space-y-4 ${
                          st === 'pending'
                            ? isDark
                              ? 'bg-[#161f38] border-amber-500/50 shadow-lg'
                              : 'bg-amber-50/40 border-amber-300 shadow-sm'
                            : st === 'verified'
                              ? isDark
                                ? 'bg-[#112229] border-emerald-500/40'
                                : 'bg-emerald-50/40 border-emerald-300'
                              : isDark
                                ? 'bg-[#121c33]/90 border-white/10'
                                : 'bg-white border-pink-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-extrabold font-display">
                                {u.username}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                                  st === 'verified'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : st === 'pending'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : st === 'rejected'
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                }`}
                              >
                                KYC: {st.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-slate-400 mt-1">
                              UID: {u.uid} · {u.countryCode} {u.mobile} · {u.country || 'No Country'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAdminKycNoteInput(rec?.adminNotes || '');
                              setViewingKycModal({ record: rec, bundle });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Full Docs</span>
                          </button>
                        </div>

                        {rec ? (
                          <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono p-3 rounded-2xl bg-black/20 border border-white/10">
                              <div>
                                <div className="text-[10px] text-slate-400">FULL LEGAL NAME</div>
                                <div className="font-bold text-white truncate">
                                  {rec.fullName}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400">DOCUMENT TYPE</div>
                                <div className="font-bold text-pink-400 uppercase">
                                  {rec.documentType.replace('_', ' ')}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400">ID / SERIAL NO</div>
                                <div className="font-bold text-sky-400">
                                  {rec.documentNumber}
                                </div>
                              </div>
                            </div>

                            {/* Uploaded Document Thumbnails */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {rec.documentImageDataUrl ? (
                                <div
                                  onClick={() => {
                                    setAdminKycNoteInput(rec.adminNotes || '');
                                    setViewingKycModal({ record: rec, bundle });
                                  }}
                                  className="p-2.5 rounded-2xl border border-white/15 bg-black/40 space-y-1.5 cursor-pointer hover:border-pink-400 transition-colors"
                                >
                                  <div className="flex items-center justify-between text-[11px] font-mono text-sky-400 font-bold">
                                    <span>Front ID Document Photo</span>
                                    <span className="underline">Click to Enlarge</span>
                                  </div>
                                  <img
                                    src={rec.documentImageDataUrl}
                                    alt="User Uploaded Front ID"
                                    className="w-full h-36 object-contain rounded-xl bg-black"
                                  />
                                </div>
                              ) : (
                                <div className="p-4 rounded-2xl border border-dashed border-white/15 text-center text-slate-400 flex items-center justify-center">
                                  No Front ID Image Attached
                                </div>
                              )}

                              {rec.documentBackImageDataUrl ? (
                                <div
                                  onClick={() => {
                                    setAdminKycNoteInput(rec.adminNotes || '');
                                    setViewingKycModal({ record: rec, bundle });
                                  }}
                                  className="p-2.5 rounded-2xl border border-white/15 bg-black/40 space-y-1.5 cursor-pointer hover:border-pink-400 transition-colors"
                                >
                                  <div className="flex items-center justify-between text-[11px] font-mono text-sky-400 font-bold">
                                    <span>Back / Selfie Photo</span>
                                    <span className="underline">Click to Enlarge</span>
                                  </div>
                                  <img
                                    src={rec.documentBackImageDataUrl}
                                    alt="User Uploaded Back ID"
                                    className="w-full h-36 object-contain rounded-xl bg-black"
                                  />
                                </div>
                              ) : (
                                <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center text-slate-500 flex items-center justify-center text-[11px]">
                                  No Back / Selfie Image Uploaded
                                </div>
                              )}
                            </div>

                            {rec.aiVerificationNotes && (
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
                                <span className="font-mono font-bold text-pink-400">
                                  Document Summary:{' '}
                                </span>
                                {rec.aiVerificationNotes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-black/20 border border-white/10 text-xs text-slate-400">
                            This user has not uploaded KYC documents yet. You can still manually verify or unverify their account below.
                          </div>
                        )}

                        {/* Admin Action Buttons: Verify (Approve), Processing, Reject */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleAdminKycDecision(
                                  bundle,
                                  'verified',
                                  'verified',
                                  'Verified by Zentro Admin'
                                )
                              }
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verify KYC (Unlock Withdrawals)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleAdminKycDecision(
                                  bundle,
                                  'pending',
                                  'processing',
                                  'Under manual Admin review'
                                )
                              }
                              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Set Processing</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleAdminKycDecision(
                                  bundle,
                                  'rejected',
                                  'rejected',
                                  'Please upload a clearer photo of your government ID'
                                )
                              }
                              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject KYC</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* =====================================================================
         * TAB 5: SPONSOR COUNTRIES & MEMBERS MANAGER
         * ===================================================================== */}
        {activeTab === 'sponsors' && (
          <AdminSponsorCountriesManager
            isDark={isDark}
            onNotice={(msg) => showAdminNotice(msg)}
          />
        )}

        {/* =====================================================================
         * TAB 6: VIP PACKAGES MANAGER
         * ===================================================================== */}
        {activeTab === 'vip_manager' && (
          <AdminVipPackagesManager
            isDark={isDark}
            onNotice={(msg) => showAdminNotice(msg)}
          />
        )}

        {/* =====================================================================
         * TAB 7: VIP TASKS MANAGER (STRICT VIP-MATCHED TASK COMPLETION)
         * ===================================================================== */}
        {activeTab === 'tasks_manager' && (
          <AdminTasksManager
            isDark={isDark}
            onNotice={(msg) => showAdminNotice(msg)}
          />
        )}

        {/* =====================================================================
         * TAB 8: VIP DAY CHALLENGES MANAGER (1.5x MULTIPLIER · ADD / EDIT / DELETE)
         * ===================================================================== */}
        {activeTab === 'day_challenges' && (
          <AdminVipDayChallengesManager
            isDark={isDark}
            onNotice={(msg) => showAdminNotice(msg)}
          />
        )}

        {/* =====================================================================
         * TAB 9: ADMIN LIVE CHAT & OFFICIAL CHANNELS MANAGER
         * ===================================================================== */}
        {activeTab === 'live_chat' && (
          <CustomerSupportPage
            profile={
              userBundles[0]?.profile || {
                uid: 'ADMIN',
                username: 'Zentro Official Admin',
                email: 'admin@zentro.io',
                countryCode: '🇱🇰 +94',
                mobile: '770090007',
                country: 'Sri Lanka',
                currency: 'LKR',
                language: 'English',
                deviceId: 'ADMIN-HQ',
                macAddress: '00:00:00:00:00:00',
                securityPasswordHash: '000000',
                referralCode: 'ZENTRO-VIP888',
                referredBy: 'HQ',
                vipLevel: 4,
                balance: 0,
                totalEarnings: 0,
                tasksCompletedToday: 0,
                kycStatus: 'verified',
              }
            }
            isDark={isDark}
            isAdminMode={true}
          />
        )}
      </main>

      {/* =====================================================================
       * MODAL 0: INSPECT USER UPLOADED KYC DOCUMENTS & APPROVE / REJECT
       * ===================================================================== */}
      {viewingKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div
            className={`max-w-3xl w-full my-auto rounded-3xl border p-6 space-y-5 shadow-2xl ${
              isDark
                ? 'bg-[#10182d] border-emerald-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold font-display flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>
                    Admin KYC Document Inspection — {viewingKycModal.bundle.profile.username}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  UID: {viewingKycModal.bundle.uid} · Current Status:{' '}
                  <strong className="uppercase text-amber-400">
                    {viewingKycModal.record?.status || viewingKycModal.bundle.profile.kycStatus}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingKycModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewingKycModal.record ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono p-3.5 rounded-2xl bg-black/25 border border-white/10">
                  <div>
                    <div className="text-[10px] text-slate-400">FULL LEGAL NAME ON ID</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {viewingKycModal.record.fullName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">DOCUMENT TYPE</div>
                    <div className="text-sm font-extrabold text-pink-400 uppercase mt-0.5">
                      {viewingKycModal.record.documentType.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">DOCUMENT SERIAL / ID NO</div>
                    <div className="text-sm font-extrabold text-sky-400 mt-0.5">
                      {viewingKycModal.record.documentNumber}
                    </div>
                  </div>
                </div>

                {/* High-Resolution Uploaded Document Photos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl border border-white/15 bg-black/50 space-y-2">
                    <div className="text-xs font-mono font-bold text-sky-400">
                      1. Uploaded Front ID Document Photo
                    </div>
                    {viewingKycModal.record.documentImageDataUrl ? (
                      <img
                        src={viewingKycModal.record.documentImageDataUrl}
                        alt="Uploaded Front ID Document"
                        className="w-full max-h-[340px] object-contain rounded-xl bg-black"
                      />
                    ) : (
                      <div className="p-10 text-center text-slate-400">
                        No Front ID Image Uploaded
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl border border-white/15 bg-black/50 space-y-2">
                    <div className="text-xs font-mono font-bold text-sky-400">
                      2. Uploaded Back / Selfie Photo
                    </div>
                    {viewingKycModal.record.documentBackImageDataUrl ? (
                      <img
                        src={viewingKycModal.record.documentBackImageDataUrl}
                        alt="Uploaded Back ID Document"
                        className="w-full max-h-[340px] object-contain rounded-xl bg-black"
                      />
                    ) : (
                      <div className="p-10 text-center text-slate-400">
                        No Back / Selfie Photo Uploaded
                      </div>
                    )}
                  </div>
                </div>

                {viewingKycModal.record.aiVerificationNotes && (
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="font-mono font-bold text-pink-400 mb-1">
                      PRE-CHECK / AI SUMMARY NOTES:
                    </div>
                    <p className="text-slate-300">
                      {viewingKycModal.record.aiVerificationNotes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-white/10 text-center text-xs text-slate-400">
                This user has not submitted KYC document photos yet, but you can still manually set their KYC verification status below.
              </div>
            )}

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-300">
                Admin Review / Rejection Note (Shown to user in My -&gt; KYC Stepper):
              </label>
              <input
                type="text"
                value={adminKycNoteInput}
                onChange={(e) => setAdminKycNoteInput(e.target.value)}
                placeholder="e.g. Verified official NIC / Or reason for rejection..."
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs ${
                  isDark
                    ? 'bg-[#16223d] border-white/15 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setViewingKycModal(null)}
                className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAdminKycDecision(
                      viewingKycModal.bundle,
                      'verified',
                      'verified',
                      adminKycNoteInput || 'Verified by Zentro Admin'
                    );
                    setViewingKycModal(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve &amp; Verify KYC (Unlock Withdrawals)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleAdminKycDecision(
                      viewingKycModal.bundle,
                      'pending',
                      'processing',
                      adminKycNoteInput || 'Processing Admin Verification'
                    );
                    setViewingKycModal(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Set Processing</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleAdminKycDecision(
                      viewingKycModal.bundle,
                      'rejected',
                      'rejected',
                      adminKycNoteInput ||
                        'Document photo unclear — please upload a clear ID photo and resubmit.'
                    );
                    setViewingKycModal(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject KYC</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL 1: EDIT USER BALANCE MODAL
       * ===================================================================== */}
      {editingBalanceUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            className={`max-w-md w-full rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#10182d] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold font-display">
                  Edit User Balance — {editingBalanceUser.profile.username}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBalanceUser(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserBalance} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Current Balance:</span>
                <span className="text-base font-mono font-extrabold text-emerald-400">
                  {formatCurrencyValue(editingBalanceUser.profile.balance, 'LKR')} LKR
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'set', label: 'Set Exact Balance' },
                    { id: 'add', label: 'Add (+ LKR)' },
                    { id: 'deduct', label: 'Deduct (- LKR)' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setBalanceMode(m.id);
                      if (m.id === 'set') {
                        setBalanceInputLkr(
                          String(Number(editingBalanceUser.profile.balance.toFixed(2)))
                        );
                      } else {
                        setBalanceInputLkr('1000');
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold border text-center cursor-pointer ${
                      balanceMode === m.id
                        ? 'bg-pink-500 text-white border-pink-400'
                        : isDark
                          ? 'bg-[#16223d] border-white/10 text-slate-300'
                          : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold mb-1.5">
                  {balanceMode === 'set'
                    ? 'New Exact Balance Amount (LKR)'
                    : balanceMode === 'add'
                      ? 'Amount to Add (+ LKR)'
                      : 'Amount to Deduct (- LKR)'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={balanceInputLkr}
                  onChange={(e) => setBalanceInputLkr(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[500, 1000, 3500, 5000, 10000, 25000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBalanceInputLkr(String(preset))}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[11px] cursor-pointer"
                    >
                      {preset.toLocaleString()} LKR
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5">
                  Admin Note (Optional — shown in user transaction history)
                </label>
                <input
                  type="text"
                  value={balanceNote}
                  onChange={(e) => setBalanceNote(e.target.value)}
                  placeholder="e.g. Bonus credited by Admin"
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBalanceUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-extrabold cursor-pointer shadow-md"
                >
                  Save Balance Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL 2: EDIT USER VIP MODAL
       * ===================================================================== */}
      {editingVipUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            className={`max-w-md w-full rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#10182d] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold font-display">
                  Edit User VIP — {editingVipUser.profile.username}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingVipUser(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserVip} className="space-y-3 text-xs">
              <div className="space-y-2">
                {VIP_TIERS.map((tier) => (
                  <button
                    key={tier.level}
                    type="button"
                    onClick={() => setSelectedNewVip(tier.level)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                      selectedNewVip === tier.level
                        ? 'border-pink-500 bg-pink-500/15'
                        : isDark
                          ? 'border-white/10 bg-[#16223d] hover:border-white/25'
                          : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>
                          VIP {tier.level} — {tier.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Unlock: {formatCurrencyValue(tier.unlockAmount, 'LKR')} LKR ·
                        Daily Mining: {tier.dailyMiningRatePercent}% · Daily Tasks:{' '}
                        {tier.dailyTasks}
                      </div>
                    </div>
                    {selectedNewVip === tier.level && (
                      <CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVipUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 text-white text-xs font-extrabold cursor-pointer shadow-md"
                >
                  Save VIP Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL 3: VIEW USER TRANSACTION HISTORY MODAL
       * ===================================================================== */}
      {viewingTxUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className={`max-w-2xl w-full my-auto rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#10182d] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold font-display flex items-center gap-2">
                  <History className="w-5 h-5 text-sky-400" />
                  <span>
                    Transaction History — {viewingTxUser.profile.username}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  UID: {viewingTxUser.uid} · Current Balance:{' '}
                  {formatCurrencyValue(viewingTxUser.profile.balance, 'LKR')} LKR · Total
                  Transactions: {viewingTxUser.transactions.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingTxUser(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto space-y-2.5 pr-1">
              {viewingTxUser.transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No transactions recorded for this user yet.
                </div>
              ) : (
                viewingTxUser.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                      isDark
                        ? 'bg-[#15203a] border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-[10px] font-bold uppercase">
                          {tx.type.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : tx.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {tx.createdAt
                            ? new Date(tx.createdAt).toLocaleString()
                            : 'Recent'}
                        </span>
                      </div>
                      <div className="text-xs font-medium">{tx.description}</div>
                    </div>

                    <div
                      className={`font-mono font-extrabold text-sm shrink-0 ${
                        tx.type === 'withdrawal' || tx.type === 'vip_upgrade'
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {tx.type === 'withdrawal' || tx.type === 'vip_upgrade' ? '-' : '+'}
                      {formatCurrencyValue(tx.amount, 'LKR')} LKR
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL 4: VIEW USER REFERRAL CHAIN MODAL
       * ===================================================================== */}
      {viewingRefUser && (() => {
        const { uplineBundle, downlineByLevel } =
          computeReferralChainForUser(viewingRefUser);
        const totalRefCommission = viewingRefUser.referrals.reduce(
          (sum, r) => sum + (Number(r.commissionEarned) || 0),
          0
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <div
              className={`max-w-2xl w-full my-auto rounded-3xl border p-6 space-y-4 shadow-2xl ${
                isDark
                  ? 'bg-[#10182d] border-pink-500/40 text-white'
                  : 'bg-white border-pink-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-extrabold font-display flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span>
                      Referral Chain (Upline & L1–L5 Downline) —{' '}
                      {viewingRefUser.profile.username}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Own Referral Code:{' '}
                    <strong className="text-pink-400">
                      {viewingRefUser.profile.referralCode}
                    </strong>{' '}
                    · Total Referral Bonus Earned:{' '}
                    <strong className="text-emerald-400">
                      {formatCurrencyValue(totalRefCommission, 'LKR')} LKR
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingRefUser(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[68vh] overflow-y-auto space-y-4 pr-1 text-xs">
                {/* 1. Upline Inviter Section */}
                <div
                  className={`p-4 rounded-2xl border space-y-1.5 ${
                    isDark
                      ? 'bg-[#16223d] border-sky-500/30'
                      : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase text-sky-400 font-extrabold">
                    Upline Inviter (Who Referred {viewingRefUser.profile.username})
                  </div>
                  <div className="font-mono">
                    Used Referral Code:{' '}
                    <strong className="text-pink-400">
                      {viewingRefUser.profile.referredBy || 'N/A'}
                    </strong>
                  </div>
                  {uplineBundle ? (
                    <div className="text-xs flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span>
                        Inviter Username:{' '}
                        <strong className="text-emerald-400">
                          {uplineBundle.profile.username}
                        </strong>{' '}
                        (VIP {uplineBundle.profile.vipLevel} · {uplineBundle.profile.mobile})
                      </span>
                      <span className="font-mono text-slate-400">
                        UID: {uplineBundle.uid}
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      Registered via official platform code (
                      {viewingRefUser.profile.referredBy || 'ZENTRO-VIP888'}).
                    </div>
                  )}
                </div>

                {/* 2. Downline Registered Users Tree (L1 - L5) */}
                <div className="space-y-2">
                  <div className="font-mono uppercase text-pink-400 font-extrabold text-[11px]">
                    Registered Downline Chain (L1–L5 Members: {downlineByLevel.length})
                  </div>
                  {downlineByLevel.length === 0 ? (
                    <div
                      className={`p-4 rounded-2xl border text-slate-400 ${
                        isDark
                          ? 'bg-[#15203a] border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      No registered users in downline chain yet.
                    </div>
                  ) : (
                    downlineByLevel.map(({ level, bundle, invitedByCode }) => (
                      <div
                        key={bundle.uid}
                        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ${
                          isDark
                            ? 'bg-[#15203a] border-white/10'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-pink-500/20 border border-pink-500/40 text-pink-300 font-mono text-[10px] font-extrabold">
                              LEVEL L{level}
                            </span>
                            <span className="font-extrabold">
                              {bundle.profile.username}
                            </span>
                            <span className="text-[11px] font-mono text-amber-400">
                              VIP {bundle.profile.vipLevel}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Own Code: {bundle.profile.referralCode} · Invited via:{' '}
                            {invitedByCode}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-emerald-400">
                            Balance: {formatCurrencyValue(bundle.profile.balance, 'LKR')}{' '}
                            LKR
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {bundle.profile.countryCode} {bundle.profile.mobile}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 3. Recorded Referral Bonus Ledger Entries */}
                <div className="space-y-2">
                  <div className="font-mono uppercase text-emerald-400 font-extrabold text-[11px]">
                    Referral Commission Records ({viewingRefUser.referrals.length})
                  </div>
                  {viewingRefUser.referrals.length === 0 ? (
                    <div
                      className={`p-4 rounded-2xl border text-slate-400 ${
                        isDark
                          ? 'bg-[#15203a] border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      No referral commission payouts recorded yet.
                    </div>
                  ) : (
                    viewingRefUser.referrals.map((ref) => (
                      <div
                        key={ref.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                          isDark
                            ? 'bg-[#15203a] border-white/10'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold">
                            L{ref.tierLevel} Member: {ref.referredUsername}{' '}
                            <span className="text-amber-400 font-mono">
                              (VIP {ref.vipLevel})
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Code Used: {ref.referralCodeUsed} ·{' '}
                            {ref.createdAt
                              ? new Date(ref.createdAt).toLocaleString()
                              : ''}
                          </div>
                        </div>
                        <div className="font-mono font-extrabold text-emerald-400">
                          +{formatCurrencyValue(ref.commissionEarned, 'LKR')} LKR
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
       * MODAL 5: VIEW DEPOSIT RECEIPT SLIP MODAL
       * ===================================================================== */}
      {viewingReceiptDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div
            className={`max-w-xl w-full my-auto rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#10182d] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold font-display flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-pink-400" />
                  <span>
                    Deposit Receipt — {viewingReceiptDeposit.deposit.referenceCode}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  User: {viewingReceiptDeposit.deposit.username} · Depositor:{' '}
                  {viewingReceiptDeposit.deposit.depositorName} · Amount:{' '}
                  {formatCurrencyValue(
                    viewingReceiptDeposit.deposit.amountInLkr,
                    'LKR'
                  )}{' '}
                  LKR
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceiptDeposit(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewingReceiptDeposit.deposit.slipDataUrl ? (
              <div className="rounded-2xl border border-white/15 overflow-hidden bg-black/50 max-h-[55vh] flex items-center justify-center">
                <img
                  src={viewingReceiptDeposit.deposit.slipDataUrl}
                  alt="Uploaded Payment Receipt"
                  className="max-h-[55vh] w-auto object-contain"
                />
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-white/10 text-center text-xs text-slate-400">
                No receipt image attached to this legacy transaction record.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs font-mono p-3.5 rounded-2xl bg-black/25 border border-white/10">
              <div>
                <span className="text-slate-400">Bank / Network:</span>{' '}
                <strong>{viewingReceiptDeposit.deposit.selectedBankName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Package:</span>{' '}
                <strong>{viewingReceiptDeposit.deposit.selectedVipLabel}</strong>
              </div>
              <div>
                <span className="text-slate-400">Amount (LKR):</span>{' '}
                <strong className="text-emerald-400">
                  {formatCurrencyValue(
                    viewingReceiptDeposit.deposit.amountInLkr,
                    'LKR'
                  )}{' '}
                  LKR
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>{' '}
                <strong className=" uppercase text-pink-400">
                  {viewingReceiptDeposit.deposit.status}
                </strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingReceiptDeposit(null)}
                className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>

              {viewingReceiptDeposit.deposit.status === 'pending_admin' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const owner = userBundles.find(
                        (b) => b.uid === viewingReceiptDeposit.deposit.userId
                      );
                      handleApproveDeposit(viewingReceiptDeposit.deposit, owner);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Deposit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const owner = userBundles.find(
                        (b) => b.uid === viewingReceiptDeposit.deposit.userId
                      );
                      handleRejectDeposit(viewingReceiptDeposit.deposit, owner);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL 6: VIEW ALL BOUND BANK / USDT ACCOUNTS FOR A USER
       * ===================================================================== */}
      {viewingUserBanksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className={`max-w-xl w-full my-auto rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#10182d] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold font-display flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-400" />
                  <span>
                    Bound Bank & USDT Accounts — {viewingUserBanksModal.profile.username}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Click any Copy button below to copy payout details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingUserBanksModal(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {viewingUserBanksModal.bankAccounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  This user has not bound any Bank or USDT (BEP-20) accounts yet.
                </div>
              ) : (
                viewingUserBanksModal.bankAccounts.map((b) => (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                      isDark
                        ? 'bg-[#15203a] border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-sky-400">
                        {b.bankName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `${b.bankName} | ${b.accountHolder} | ${b.accountNumber} | ${b.routingOrSwift}`,
                            `modal_bank_all_${b.id}`
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-300 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `modal_bank_all_${b.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy All</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                      <div className="p-2.5 rounded-xl bg-black/20 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="text-[10px] text-slate-400">Holder / Label</div>
                          <div className="font-bold truncate">{b.accountHolder}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(b.accountHolder, `modal_holder_${b.id}`)
                          }
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
                        >
                          {copiedKey === `modal_holder_${b.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/20 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="text-[10px] text-slate-400">
                            Account No / Address
                          </div>
                          <div className="font-bold text-emerald-400 truncate">
                            {b.accountNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(b.accountNumber, `modal_acc_${b.id}`)
                          }
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
                        >
                          {copiedKey === `modal_acc_${b.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL 7: ADMIN ADD NEW USER MODAL
       * ===================================================================== */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className={`max-w-lg w-full my-auto rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#10182d] border-sky-500/40 text-white'
                : 'bg-white border-sky-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-extrabold font-display">
                    Add New Zentro User Account
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Saved directly to the central database — user can log in from any device.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUserByAdmin} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. kavindu_vip"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@zentro.io"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Dial Code</label>
                  <input
                    type="text"
                    value={newCountryCode}
                    onChange={(e) => setNewCountryCode(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="771234567"
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Security PIN (6-Digit) *</label>
                  <input
                    type="text"
                    required
                    value={newSecurityPin}
                    onChange={(e) => setNewSecurityPin(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">VIP Tier</label>
                  <select
                    value={newVipLevel}
                    onChange={(e) => setNewVipLevel(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={0}>VIP 0 — Starter</option>
                    <option value={1}>VIP 1 — Bronze</option>
                    <option value={2}>VIP 2 — Silver</option>
                    <option value={3}>VIP 3 — Gold</option>
                    <option value={4}>VIP 4 — Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Initial Balance (LKR)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newBalanceLkr}
                    onChange={(e) => setNewBalanceLkr(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-extrabold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">KYC Status</label>
                  <select
                    value={newKycStatus}
                    onChange={(e) =>
                      setNewKycStatus(e.target.value as 'unverified' | 'pending' | 'verified')
                    }
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="verified">Verified ✓</option>
                    <option value="pending">Pending</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Country</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="LKR">LKR</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Invited By Code</label>
                  <input
                    type="text"
                    value={newReferredBy}
                    onChange={(e) => setNewReferredBy(e.target.value.toUpperCase())}
                    placeholder="ZENTRO-VIP888"
                    className={`w-full px-3 py-2 rounded-xl border font-mono uppercase ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create User Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL 8: ADMIN DELETE USER CONFIRMATION MODAL
       * ===================================================================== */}
      {deletingUserBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className={`max-w-md w-full rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#141026] border-red-500/50 text-white'
                : 'bg-white border-red-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-extrabold font-display">
                  Delete User Account?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingUserBundle(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                Are you sure you want to permanently delete user{' '}
                <strong className="text-pink-400">{deletingUserBundle.profile.username}</strong> (
                <span className="font-mono">{deletingUserBundle.uid}</span>)?
              </p>
              <p className="text-slate-400">
                This will remove their account, balance, transactions, KYC records, and unlock their registered device in the central database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUserBundle(null)}
                className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete User</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
