import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
  ListChecks,
  AlertCircle,
  Crown,
  Lock,
  Sparkles,
  Flame,
  Zap,
  TrendingUp,
  Calendar,
  Check,
  RotateCcw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Gift,
  UserPlus,
} from 'lucide-react';
import {
  UserProfile,
  VIP_TIERS,
  PLATFORM_DAILY_TASKS,
  ZentroPlatformTask,
  ReferralRecordData,
  getActiveCurrency,
  formatCurrencyValue,
  formatSiteAmount,
  replaceCurrencyInText,
  VIP_DAY_CHALLENGES,
  VipDayChallengeConfig,
  UserVipDayChallengeState,
  getUserVipDayChallenges,
  saveUserVipDayChallenge,
  advanceUserVipDayChallengeDay,
  resetUserVipDayChallenge,
  getVipDayChallengesCatalog,
  pushUserNotification,
  tr,
} from '../types';
import { getAccessToken, googleSignIn } from '../firebase';

interface TaskTabProps {
  profile: UserProfile;
  referrals?: ReferralRecordData[];
  onCompletePlatformTask: (task: ZentroPlatformTask) => Promise<void>;
  completingTaskId: string | null;
  onNavigateVip?: () => void;
  onUpdateWalletBalance?: (
    amountDelta: number,
    description: string,
    txType?: 'task_reward' | 'deposit' | 'withdrawal' | 'vip_upgrade'
  ) => Promise<boolean>;
  onNavigateDeposit?: () => void;
}

interface GoogleTaskList {
  id: string;
  title: string;
}

interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export const TaskTab: React.FC<TaskTabProps> = ({
  profile,
  referrals = [],
  onCompletePlatformTask,
  completingTaskId,
  onNavigateVip,
  onUpdateWalletBalance,
  onNavigateDeposit,
}) => {
  const depositTeamCount = referrals.filter((r) => r.vipLevel >= 1).length;
  const activeCurrency = getActiveCurrency(profile);
  const currentVip =
    VIP_TIERS.find((v) => v.level === profile.vipLevel) || VIP_TIERS[0];
  const remainingQuota = Math.max(
    0,
    currentVip.dailyTasks - profile.tasksCompletedToday
  );

  // VIP Day Challenges state
  const [dayChallenges, setDayChallenges] = useState<VipDayChallengeConfig[]>(() =>
    getVipDayChallengesCatalog()
  );
  const [challengeStates, setChallengeStates] = useState<Record<string, UserVipDayChallengeState>>(() =>
    getUserVipDayChallenges(profile.uid)
  );
  const [busyChallengeId, setBusyChallengeId] = useState<string | null>(null);
  const [challengeNotice, setChallengeNotice] = useState<string | null>(null);
  const [claimingRegBonus, setClaimingRegBonus] = useState(false);

  const regClaimsStorageKey = `zentro_unlimited_reg_claims_v1_${profile.uid}`;
  const depositClaimsStorageKey = `zentro_claimed_deposit_members_v1_${profile.uid}`;
  const dailyClaimsCountStorageKey = `zentro_daily_task_claims_count_v1_${profile.uid}`;

  // Track which Daily VIP Tasks have been "Completed" (100% bar) and are waiting for the user to click "Claim"
  const [readyToClaimTaskIds, setReadyToClaimTaskIds] = useState<string[]>([]);

  // Track how many times each Daily Task has been claimed & auto-renewed
  const [dailyTaskClaimCounts, setDailyTaskClaimCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`zentro_daily_task_claims_count_v1_${profile.uid}`);
      if (saved) return JSON.parse(saved) || {};
    } catch {
      // ignore
    }
    return {};
  });

  // Track how many deposit members have been claimed per VIP tier (for 5-Deposit Task Auto-Renew)
  const [claimedDepositMap, setClaimedDepositMap] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem(`zentro_claimed_deposit_members_v1_${profile.uid}`);
      if (saved) return JSON.parse(saved) || {};
    } catch {
      // ignore
    }
    return {};
  });

  const [claimedRegCount, setClaimedRegCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`zentro_unlimited_reg_claims_v1_${profile.uid}`);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`zentro_unlimited_reg_claims_v1_${profile.uid}`);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          setClaimedRegCount(parsed);
        } else {
          setClaimedRegCount(0);
        }
      } else {
        setClaimedRegCount(0);
      }
    } catch {
      setClaimedRegCount(0);
    }

    try {
      const savedDep = localStorage.getItem(`zentro_claimed_deposit_members_v1_${profile.uid}`);
      setClaimedDepositMap(savedDep ? JSON.parse(savedDep) || {} : {});
    } catch {
      setClaimedDepositMap({});
    }

    try {
      const savedDaily = localStorage.getItem(`zentro_daily_task_claims_count_v1_${profile.uid}`);
      setDailyTaskClaimCounts(savedDaily ? JSON.parse(savedDaily) || {} : {});
    } catch {
      setDailyTaskClaimCounts({});
    }
  }, [profile.uid]);

  useEffect(() => {
    const syncDepositClaims = () => {
      try {
        const savedDep = localStorage.getItem(depositClaimsStorageKey);
        setClaimedDepositMap(savedDep ? JSON.parse(savedDep) || {} : {});
      } catch {
        // ignore
      }
    };
    window.addEventListener('zentro-deposit-task-renewed', syncDepositClaims);
    return () => window.removeEventListener('zentro-deposit-task-renewed', syncDepositClaims);
  }, [depositClaimsStorageKey]);

  const handleMarkDailyTaskCompleted = (task: ZentroPlatformTask) => {
    if (profile.vipLevel !== task.minVipLevel) return;
    setReadyToClaimTaskIds((prev) => (prev.includes(task.id) ? prev : [...prev, task.id]));
    setChallengeNotice(
      tr(
        profile,
        `✓ "${task.title}" completed (100%)! Click "Claim +${formatSiteAmount(task.reward, activeCurrency)}" to add to your balance & auto-renew.`,
        `✓ "${task.title}" සම්පූර්ණයි (100%)! දැන් "Claim +${formatSiteAmount(task.reward, activeCurrency)}" ක්ලික් කර මුදල ශේෂයට එක් කර Task එක Auto-Renew කරගන්න.`
      )
    );
  };

  const handleClaimAndRenewDailyTask = async (task: ZentroPlatformTask) => {
    if (completingTaskId) return;
    await onCompletePlatformTask(task);
    setReadyToClaimTaskIds((prev) => prev.filter((id) => id !== task.id));
    setDailyTaskClaimCounts((prev) => {
      const next = { ...prev, [task.id]: (prev[task.id] || 0) + 1 };
      try {
        localStorage.setItem(dailyClaimsCountStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setChallengeNotice(
      tr(
        profile,
        `🎉 +${formatSiteAmount(task.reward, activeCurrency)} added to your balance! Task automatically renewed (0%) for the next cycle ↻`,
        `🎉 +${formatSiteAmount(task.reward, activeCurrency)} ඔබගේ ශේෂයට එකතු විය! Task එක මීළඟ වටය සඳහා ස්වයංක්‍රීයව අලුත් විය (Auto-Renewed ↻).`
      )
    );
  };

  const handleClaimRegistrationBonus = async (cfg: (typeof teamTaskConfigs)[0]) => {
    if (claimingRegBonus || profile.vipLevel !== cfg.level) return;
    const totalRegMembers = referrals.length;
    const unclaimedCount = Math.max(0, totalRegMembers - claimedRegCount);
    if (unclaimedCount <= 0) return;

    const claimAmountLkr = unclaimedCount * cfg.regBonus;
    const nextClaimedCount = totalRegMembers;
    const nextTotalClaimLkr = nextClaimedCount * cfg.regBonus;

    setClaimingRegBonus(true);
    try {
      if (onUpdateWalletBalance) {
        const ok = await onUpdateWalletBalance(
          claimAmountLkr,
          `1 Member Registration Bonus (${unclaimedCount} New Member${unclaimedCount > 1 ? 's' : ''}) — Total Claim: +${nextTotalClaimLkr} LKR (Auto-Renewed)`,
          'task_reward'
        );
        if (!ok) return;
      }
      setClaimedRegCount(nextClaimedCount);
      try {
        localStorage.setItem(regClaimsStorageKey, String(nextClaimedCount));
      } catch {
        // ignore
      }
      pushUserNotification(profile.uid, {
        title: `🎉 Registration Bonus Claimed: +${claimAmountLkr} LKR (Auto-Renewed ↻)`,
        titleSi: `🎉 සාමාජික ලියාපදිංචි ප්‍රසාද දීමනාව: +${claimAmountLkr} LKR (Auto-Renewed ↻)`,
        message: `Claimed +${claimAmountLkr} LKR for ${unclaimedCount} registered member(s). Total Registration Claim: +${nextTotalClaimLkr} LKR (${nextClaimedCount} members). Task auto-renewed for your next member!`,
        messageSi: `සාමාජිකයින් ${unclaimedCount} දෙනෙකු සඳහා +${claimAmountLkr} LKR ශේෂයට එක් විය. මුළු Total Claim: +${nextTotalClaimLkr} LKR. Task එක මීළඟ සාමාජිකයා සඳහා ස්වයංක්‍රීයව අලුත් විය (Auto-Renewed ↻).`,
        category: 'task',
        priority: 'high',
        actionTab: 'task',
      });
      setChallengeNotice(
        tr(
          profile,
          `🎉 +${formatSiteAmount(claimAmountLkr, activeCurrency)} added to balance! Total Claim: +${formatSiteAmount(nextTotalClaimLkr, activeCurrency)} · Task Auto-Renewed ↻`,
          `🎉 +${formatSiteAmount(claimAmountLkr, activeCurrency)} ශේෂයට එකතු විය! මුළු Total Claim: +${formatSiteAmount(nextTotalClaimLkr, activeCurrency)} · Task එක Auto-Renew විය ↻`
        )
      );
    } finally {
      setClaimingRegBonus(false);
    }
  };

  useEffect(() => {
    setChallengeStates(getUserVipDayChallenges(profile.uid));
  }, [profile.uid]);

  useEffect(() => {
    const handleChallengesUpdate = () => {
      setChallengeStates(getUserVipDayChallenges(profile.uid));
    };
    const handleCatalogUpdate = () => {
      setDayChallenges(getVipDayChallengesCatalog());
    };
    window.addEventListener('zentro-vip-challenges-updated', handleChallengesUpdate);
    window.addEventListener('zentro-day-challenges-catalog-updated', handleCatalogUpdate);
    window.addEventListener('zentro-catalog-updated', handleCatalogUpdate);
    return () => {
      window.removeEventListener('zentro-vip-challenges-updated', handleChallengesUpdate);
      window.removeEventListener('zentro-day-challenges-catalog-updated', handleCatalogUpdate);
      window.removeEventListener('zentro-catalog-updated', handleCatalogUpdate);
    };
  }, [profile.uid]);

  const handleInvestChallenge = async (challenge: VipDayChallengeConfig) => {
    if (profile.vipLevel < challenge.vipLevel) {
      if (onNavigateVip) onNavigateVip();
      return;
    }
    if (profile.balance < challenge.investmentAmountLkr) {
      setChallengeNotice(
        tr(
          profile,
          `Insufficient balance. You need ${formatSiteAmount(challenge.investmentAmountLkr, activeCurrency)} to start this challenge.`,
          `ශේෂය ප්‍රමාණවත් නොවේ. මෙම අභියෝගය ආරම්භ කිරීමට ඔබට ${formatSiteAmount(challenge.investmentAmountLkr, activeCurrency)} අවශ්‍ය වේ.`
        )
      );
      return;
    }

    setBusyChallengeId(challenge.id);
    setChallengeNotice(null);
    try {
      if (onUpdateWalletBalance) {
        const success = await onUpdateWalletBalance(
          -challenge.investmentAmountLkr,
          `${challenge.title} Extra Investment: -${challenge.investmentAmountLkr} LKR`,
          'vip_upgrade'
        );
        if (!success) {
          setChallengeNotice(
            tr(profile, 'Failed to process investment deduction.', 'ආයෝජන මුදල අඩු කිරීම අසාර්ථක විය.')
          );
          return;
        }
      }

      const newState: UserVipDayChallengeState = {
        challengeId: challenge.id,
        userId: profile.uid,
        investedAmountLkr: challenge.investmentAmountLkr,
        netProfitLkr: challenge.netProfitLkr,
        totalReturnLkr: challenge.totalReturnLkr,
        durationDays: challenge.durationDays,
        currentDay: 0,
        startedAt: new Date().toISOString(),
        lastDayAdvanceAt: new Date().toISOString(),
        status: 'active',
      };
      saveUserVipDayChallenge(profile.uid, newState);
      setChallengeStates((prev) => ({ ...prev, [challenge.id]: newState }));

      pushUserNotification(profile.uid, {
        title: `${challenge.title} Started! (${challenge.durationDays} Days)`,
        titleSi: `${challenge.titleSi} ආරම්භ විය! (දින ${challenge.durationDays})`,
        message: `Invested ${challenge.investmentAmountLkr} LKR extra. Track your daily task bar to reach Day ${challenge.durationDays} and receive ${challenge.totalReturnLkr} LKR total return (+${challenge.netProfitLkr} LKR profit).`,
        messageSi: `අමතර ${challenge.investmentAmountLkr} LKR ආයෝජනය කරන ලදී. දින ${challenge.durationDays} අවසානයේ +${challenge.netProfitLkr} LKR ලාභය සමඟ සම්පූර්ණ ${challenge.totalReturnLkr} LKR ලබා ගැනීමට දිනපතා task bar සම්පූර්ණ කරන්න!`,
        category: 'task',
        priority: 'high',
        actionTab: 'task',
      });

      setChallengeNotice(
        tr(
          profile,
          `Successfully invested ${formatSiteAmount(challenge.investmentAmountLkr, activeCurrency)}! Challenge active (0/${challenge.durationDays} Days completed).`,
          `${formatSiteAmount(challenge.investmentAmountLkr, activeCurrency)} සාර්ථකව ආයෝජනය කරන ලදී! අභියෝගය සක්‍රියයි (දින 0/${challenge.durationDays}).`
        )
      );
    } finally {
      setBusyChallengeId(null);
    }
  };

  const handleAdvanceDay = (challenge: VipDayChallengeConfig) => {
    const updated = advanceUserVipDayChallengeDay(profile.uid, challenge.id);
    if (!updated) return;
    setChallengeStates((prev) => ({ ...prev, [challenge.id]: updated }));
    if (updated.status === 'completed') {
      pushUserNotification(profile.uid, {
        title: `🎉 ${challenge.title} Completed!`,
        titleSi: `🎉 ${challenge.titleSi} සම්පූර්ණ විය!`,
        message: `Congratulations! You reached Day ${challenge.durationDays} of ${challenge.durationDays}. Claim your maturity payout of +${challenge.totalReturnLkr} LKR now!`,
        messageSi: `සුබ පැතුම්! ඔබ දින ${challenge.durationDays} සාර්ථකව අවසන් කළා. දැන් ඔබගේ සම්පූර්ණ මුදල +${challenge.totalReturnLkr} LKR ලබා ගන්න!`,
        category: 'task',
        priority: 'urgent',
        actionTab: 'task',
      });
      setChallengeNotice(
        tr(
          profile,
          `🎉 ${challenge.title} 100% Completed! Claim your ${formatSiteAmount(challenge.totalReturnLkr, activeCurrency)} payout now!`,
          `🎉 ${challenge.titleSi} 100% සම්පූර්ණයි! දැන් ඔබගේ ${formatSiteAmount(challenge.totalReturnLkr, activeCurrency)} ලබා ගන්න!`
        )
      );
    } else {
      setChallengeNotice(
        tr(
          profile,
          `Advanced to Day ${updated.currentDay} of ${challenge.durationDays} (${Math.round((updated.currentDay / challenge.durationDays) * 100)}% complete).`,
          `දින ${updated.currentDay} වෙත ඉදිරියට ගියා (සම්පූර්ණ ${challenge.durationDays} න් ${Math.round((updated.currentDay / challenge.durationDays) * 100)}%).`
        )
      );
    }
  };

  const handleClaimChallengeReward = async (
    challenge: VipDayChallengeConfig,
    state: UserVipDayChallengeState
  ) => {
    setBusyChallengeId(challenge.id);
    setChallengeNotice(null);
    try {
      if (onUpdateWalletBalance) {
        await onUpdateWalletBalance(
          state.totalReturnLkr,
          `${challenge.title} Maturity Payout: +${state.totalReturnLkr} LKR (+${state.netProfitLkr} Net Profit)`,
          'task_reward'
        );
      }
      const updated: UserVipDayChallengeState = {
        ...state,
        status: 'claimed',
        claimedAt: new Date().toISOString(),
      };
      saveUserVipDayChallenge(profile.uid, updated);
      setChallengeStates((prev) => ({ ...prev, [challenge.id]: updated }));

      pushUserNotification(profile.uid, {
        title: `Maturity Bonus Credited: +${state.totalReturnLkr} LKR!`,
        titleSi: `ප්‍රතිලාභ ප්‍රසාද දීමනාව බැර විය: +${state.totalReturnLkr} LKR!`,
        message: `Maturity payout of ${state.totalReturnLkr} LKR (including +${state.netProfitLkr} LKR profit) credited to your balance.`,
        messageSi: `සම්පූර්ණ ප්‍රතිලාභය ${state.totalReturnLkr} LKR (+${state.netProfitLkr} LKR ලාභය ඇතුළුව) ඔබගේ ගිණුමට බැර විය.`,
        category: 'task',
        priority: 'high',
        actionTab: 'task',
      });
      setChallengeNotice(
        tr(
          profile,
          `🎉 Success! +${formatSiteAmount(state.totalReturnLkr, activeCurrency)} credited to your wallet balance!`,
          `🎉 සාර්ථකයි! +${formatSiteAmount(state.totalReturnLkr, activeCurrency)} ඔබගේ ශේෂයට එකතු විය!`
        )
      );
    } finally {
      setBusyChallengeId(null);
    }
  };

  const handleResetChallenge = (challengeId: string) => {
    resetUserVipDayChallenge(profile.uid, challengeId);
    setChallengeStates((prev) => {
      const copy = { ...prev };
      delete copy[challengeId];
      return copy;
    });
    setChallengeNotice(
      tr(
        profile,
        'Challenge reset. You can now invest again for another cycle!',
        'අභියෝගය reset කරන ලදී. ඔබට නැවත අලුත් වටයක් සඳහා ආයෝජනය කළ හැක!'
      )
    );
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const completedTodayIds =
    profile.lastTaskCompletionDate === todayKey
      ? profile.completedTaskIdsToday || []
      : [];
  const claimedTeamTiers = profile.claimedTeamTaskTiers || [];

  // Default filter shows the user's current active VIP level tasks
  const [selectedVipFilter, setSelectedVipFilter] = useState<number | 'all'>(
    profile.vipLevel
  );
  const [, setCatalogVersion] = useState(0);

  useEffect(() => {
    setSelectedVipFilter(profile.vipLevel);
  }, [profile.vipLevel]);

  useEffect(() => {
    const handleCatalogUpdate = () => setCatalogVersion((v) => v + 1);
    window.addEventListener('zentro-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('zentro-catalog-updated', handleCatalogUpdate);
  }, []);

  const activeTierDailyTasks = PLATFORM_DAILY_TASKS.filter(
    (t) => t.taskType === 'daily' && t.minVipLevel === profile.vipLevel
  );
  const nextAvailableDailyTask =
    activeTierDailyTasks.find((t) => !completedTodayIds.includes(t.id)) ||
    activeTierDailyTasks[0];

  const filteredTasks = PLATFORM_DAILY_TASKS.filter((task) => {
    if (selectedVipFilter === 'all') return true;
    return task.minVipLevel === selectedVipFilter;
  });

  // Google Tasks states
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(false);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [googleTasks, setGoogleTasks] = useState<GoogleTaskItem[]>([]);
  const [loadingGoogleTasks, setLoadingGoogleTasks] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Mandatory Confirmation Dialog state for mutating/deleting Google Tasks
  const [confirmAction, setConfirmAction] = useState<{
    type: 'toggle' | 'delete';
    task: GoogleTaskItem;
  } | null>(null);

  const fetchGoogleTaskLists = async () => {
    setLoadingGoogleTasks(true);
    setGoogleError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setNeedsGoogleAuth(true);
        setLoadingGoogleTasks(false);
        return;
      }
      const res = await fetch(
        'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 401 || res.status === 403) {
        setNeedsGoogleAuth(true);
        setLoadingGoogleTasks(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch Google Task lists (${res.status})`);
      }
      const data = await res.json();
      const lists: GoogleTaskList[] = data.items || [];
      setTaskLists(lists);
      setNeedsGoogleAuth(false);
      if (lists.length > 0) {
        const defaultId = selectedListId || lists[0].id;
        setSelectedListId(defaultId);
        await fetchTasksForList(defaultId, token);
      }
    } catch (err: any) {
      setGoogleError(err?.message || 'Unable to load Google Tasks.');
    } finally {
      setLoadingGoogleTasks(false);
    }
  };

  const fetchTasksForList = async (listId: string, tokenOverride?: string) => {
    try {
      const token = tokenOverride || (await getAccessToken());
      if (!token) {
        setNeedsGoogleAuth(true);
        return;
      }
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks?showCompleted=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to load tasks (${res.status})`);
      }
      const data = await res.json();
      setGoogleTasks(data.items || []);
    } catch (err: any) {
      setGoogleError(err?.message || 'Error loading tasks for list.');
    }
  };

  useEffect(() => {
    fetchGoogleTaskLists();
  }, []);

  const handleConnectGoogleTasks = async () => {
    setGoogleError(null);
    try {
      const result = await googleSignIn();
      if (result?.accessToken) {
        setNeedsGoogleAuth(false);
        await fetchGoogleTaskLists();
      }
    } catch (err: any) {
      setGoogleError(err?.message || 'Google Sign-In cancelled or failed.');
    }
  };

  const handleCreateGoogleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedListId) return;
    setLoadingGoogleTasks(true);
    setGoogleError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setNeedsGoogleAuth(true);
        return;
      }
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(selectedListId)}/tasks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newTaskTitle.trim(),
            notes: newTaskNotes.trim() || undefined,
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to create task in Google Tasks');
      setNewTaskTitle('');
      setNewTaskNotes('');
      await fetchTasksForList(selectedListId, token);
    } catch (err: any) {
      setGoogleError(err?.message || 'Could not create task.');
    } finally {
      setLoadingGoogleTasks(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction || !selectedListId) return;
    const { type, task } = confirmAction;
    setConfirmAction(null);
    setLoadingGoogleTasks(true);
    setGoogleError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setNeedsGoogleAuth(true);
        return;
      }

      if (type === 'delete') {
        const res = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(selectedListId)}/tasks/${encodeURIComponent(task.id)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error('Failed to delete task from Google Tasks');
      } else if (type === 'toggle') {
        const nextStatus =
          task.status === 'completed' ? 'needsAction' : 'completed';
        const res = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(selectedListId)}/tasks/${encodeURIComponent(task.id)}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: nextStatus }),
          }
        );
        if (!res.ok) throw new Error('Failed to update task status in Google Tasks');
      }

      await fetchTasksForList(selectedListId, token);
    } catch (err: any) {
      setGoogleError(err?.message || 'Error modifying Google Task.');
    } finally {
      setLoadingGoogleTasks(false);
    }
  };

  const teamTaskConfigs = [
    {
      level: 1,
      tier: VIP_TIERS[1],
      taskId: 'task_build_5_deposit_team',
      reward: 500,
      regBonus: 10,
      commText: 'L1: 10% · L2: 6% · L3: 2% · L4: 1% · L5: 1%',
      gradient: 'from-amber-600 via-orange-500 to-pink-600',
      border: 'border-amber-400',
      pillBg: 'bg-amber-950/90',
      accentText: 'text-amber-300',
    },
    {
      level: 2,
      tier: VIP_TIERS[2],
      taskId: 'task_silver_build_5_deposit_team',
      reward: 1500,
      regBonus: 30,
      commText: 'L1: 15% · L2: 10% · L3: 6% · L4: 2% · L5: 1%',
      gradient: 'from-blue-600 via-pink-500 to-rose-600',
      border: 'border-sky-400',
      pillBg: 'bg-blue-950/90',
      accentText: 'text-sky-300',
    },
    {
      level: 3,
      tier: VIP_TIERS[3],
      taskId: 'task_gold_build_5_deposit_team',
      reward: 3000,
      regBonus: 50,
      commText: 'L1: 20% · L2: 12% · L3: 8% · L4: 3% · L5: 1%',
      gradient: 'from-pink-600 via-rose-500 to-blue-600',
      border: 'border-pink-400',
      pillBg: 'bg-rose-950/90',
      accentText: 'text-pink-300',
    },
    {
      level: 4,
      tier: VIP_TIERS[4],
      taskId: 'task_platinum_build_5_deposit_team',
      reward: 5000,
      regBonus: 100,
      commText: 'L1: 25% · L2: 16% · L3: 12% · L4: 5% · L5: 3%',
      gradient: 'from-sky-500 via-blue-600 to-pink-600',
      border: 'border-sky-300',
      pillBg: 'bg-slate-900/90',
      accentText: 'text-sky-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ================= COMPACT VIP DAY CHALLENGE EXTRA INVESTMENT TASKS (තීරු තීරු / LIST ROWS) ================= */}
      <div className="p-4 sm:p-5 rounded-3xl border border-amber-400/50 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/50 via-white to-pink-50/30 dark:from-[#171a28] dark:via-[#131926] dark:to-[#1a1426] shadow-sm space-y-3">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-300/40 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {tr(profile, 'VIP Day Challenges', 'VIP දින අභියෝග')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  1.5x – 2.8x Net Profit
                </span>
              </div>
              <p className="text-[11px] text-slate-900 dark:text-slate-300 font-medium">
                {tr(
                  profile,
                  'Higher VIP tiers unlock lower tier challenges (e.g. Gold can join Bronze 7D & Silver 14D).',
                  'ඉහළ VIP සාමාජිකයින්ට පහළ සියලු අභියෝග වලට සහභාගී විය හැක (උදා: Gold සාමාජිකයින්ට Bronze 7D සහ Silver 14D වලට සහභාගී විය හැක).'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-xl bg-white/90 dark:bg-[#1a2235] border border-amber-300/50 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentVip.name} (VIP {profile.vipLevel})</span>
            </span>
          </div>
        </div>

        {/* Inline Feedback Toast */}
        {challengeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{challengeNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setChallengeNotice(null)}
              className="text-xs font-bold text-emerald-800 dark:text-emerald-300 px-1 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* List Rows of VIP Day Challenges (තීරු තීරු) */}
        <div className="space-y-2.5">
          {dayChallenges.map((challenge) => {
            const isEligible = profile.vipLevel >= challenge.vipLevel;
            const isHigherPrivileged = profile.vipLevel > challenge.vipLevel;
            const state = challengeStates[challenge.id];
            const isStarted = Boolean(state);
            const isCompleted = state?.status === 'completed';
            const isClaimed = state?.status === 'claimed';
            const currentDay = state?.currentDay || 0;
            const progressPercent = isStarted
              ? Math.min(100, Math.round((currentDay / challenge.durationDays) * 100))
              : 0;
            const isBusy = busyChallengeId === challenge.id;
            const hasSufficientBalance = profile.balance >= challenge.investmentAmountLkr;

            return (
              <div
                key={challenge.id}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                    : isStarted
                      ? 'border-pink-500 bg-white dark:bg-[#151d30] shadow-xs'
                      : isEligible
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151d30] hover:border-amber-400'
                        : 'border-slate-200 dark:border-slate-800/70 bg-slate-50/70 dark:bg-[#111622] opacity-85'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Column: Artwork + Title + Key Financials */}
                  <div className="flex items-center gap-3 shrink-0">
                    <img
                      src={challenge.imageUrl}
                      alt={challenge.vipName}
                      className="w-10 h-7 rounded-lg object-cover border border-slate-300 dark:border-white/10 shrink-0"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                          {challenge.title}
                        </span>
                        <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          {challenge.durationDays}D · {challenge.netProfitMultiplier}x Net Profit
                        </span>
                        {isEligible ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>{isHigherPrivileged ? `Unlocked via VIP ${profile.vipLevel}` : 'Active'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span>VIP {challenge.vipLevel}+</span>
                          </span>
                        )}
                      </div>

                      {/* Prominent Large Financial Stats Display */}
                      <div className="mt-2.5 grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-100 dark:bg-[#101625] border border-slate-200 dark:border-slate-800">
                        <div className="text-center sm:text-left">
                          <div className="text-[10px] uppercase tracking-wider text-slate-800 dark:text-slate-300 font-extrabold">
                            {tr(profile, 'Investment', 'ආයෝජන මුදල')}
                          </div>
                          <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">
                            {formatSiteAmount(challenge.investmentAmountLkr, activeCurrency)}
                          </div>
                        </div>
                        <div className="text-center border-x border-slate-200 dark:border-slate-800/80 px-1">
                          <div className="text-[10px] uppercase tracking-wider text-pink-600 dark:text-pink-400 font-extrabold">
                            {tr(profile, 'Net Profit (+50%)', 'ශුද්ධ ලාභය (+50%)')}
                          </div>
                          <div className="text-xs sm:text-sm font-black text-pink-600 dark:text-pink-400 mt-0.5">
                            +{formatSiteAmount(challenge.netProfitLkr, activeCurrency)}
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <div className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-extrabold">
                            {tr(profile, 'Maturity Return', 'ලැබෙන මුළු මුදල')}
                          </div>
                          <div className="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {formatSiteAmount(challenge.totalReturnLkr, activeCurrency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Slim Compact Task Bar */}
                  <div className="w-full lg:max-w-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">
                        {isStarted
                          ? `Day ${currentDay} of ${challenge.durationDays} Days (${progressPercent}%)`
                          : isEligible
                            ? `${challenge.durationDays}-Day Task Bar`
                            : `Requires VIP ${challenge.vipLevel}`}
                      </span>
                      <span
                        className={`font-bold ${
                          isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isStarted
                              ? 'text-pink-600 dark:text-pink-400'
                              : 'text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        {isCompleted
                          ? '100% DONE ✓'
                          : isStarted
                            ? `${progressPercent}%`
                            : '0%'}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600'
                            : `bg-gradient-to-r ${challenge.gradient}`
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Compact Row Action Button */}
                  <div className="shrink-0 flex items-center gap-2">
                    {!isEligible ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateVip) onNavigateVip();
                        }}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-300 hover:bg-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Only VIP {challenge.vipLevel}+ · Upgrade</span>
                      </button>
                    ) : !isStarted ? (
                      hasSufficientBalance ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleInvestChallenge(challenge)}
                          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm bg-gradient-to-r ${challenge.gradient} hover:opacity-95 whitespace-nowrap`}
                        >
                          <Zap className="w-3.5 h-3.5 text-yellow-300" />
                          <span>
                            {isBusy
                              ? 'Investing...'
                              : `Invest ${formatSiteAmount(challenge.investmentAmountLkr, activeCurrency)}`}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateDeposit) onNavigateDeposit();
                          }}
                          className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-900 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-500/25 cursor-pointer whitespace-nowrap"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Deposit Needed</span>
                        </button>
                      )
                    ) : isCompleted ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleClaimChallengeReward(challenge, state!)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md animate-pulse cursor-pointer whitespace-nowrap"
                      >
                        <Gift className="w-3.5 h-3.5 text-yellow-200" />
                        <span>
                          {isBusy
                            ? 'Claiming...'
                            : `Claim +${formatSiteAmount(challenge.totalReturnLkr, activeCurrency)}`}
                        </span>
                      </button>
                    ) : isClaimed ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 text-center whitespace-nowrap">
                          {tr(
                            profile,
                            `Claimed +${formatSiteAmount(challenge.totalReturnLkr, activeCurrency)} ✓`,
                            `+${formatSiteAmount(challenge.totalReturnLkr, activeCurrency)} ලබා ගන්නා ලදී ✓`
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResetChallenge(challenge.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-300 text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {tr(
                              profile,
                              'Renew If Desired',
                              'කැමතිනම් පමණක් Renew කරන්න'
                            )}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-rose-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>
                          {tr(
                            profile,
                            `Active Challenge · Day ${currentDay}/${challenge.durationDays}`,
                            `අභියෝගය සක්‍රියයි · දින ${currentDay}/${challenge.durationDays}`
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Tasks Section */}
      <div className="space-y-4">
        {/* Compact Daily Quota & Fast Task Bar */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131926] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={currentVip.imageUrl}
              alt={currentVip.name}
              className="w-10 h-7 rounded-lg object-cover border border-slate-300 dark:border-white/10 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-pink-600 dark:text-pink-400">
                  {currentVip.name} (VIP {profile.vipLevel})
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  +{formatSiteAmount(currentVip.rewardPerTask, activeCurrency)} / Task · Auto-Renews on Claim ↻
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {tr(profile, 'Current Cycle Progress:', 'වත්මන් වටයේ ප්‍රගතිය:')}{' '}
                <span className="font-mono text-pink-600 dark:text-pink-400">
                  {profile.tasksCompletedToday} / {currentVip.dailyTasks}
                </span>
                {' · '}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {tr(
                    profile,
                    'Complete -> Claim -> Balance + Auto-Renew ↻',
                    'Complete -> Claim -> ශේෂයට එක් වී ස්වයංක්‍රීයව Renew වේ ↻'
                  )}
                </span>
              </div>
            </div>
          </div>

          {nextAvailableDailyTask && (
            <button
              type="button"
              disabled={Boolean(completingTaskId)}
              onClick={() => {
                if (readyToClaimTaskIds.includes(nextAvailableDailyTask.id)) {
                  handleClaimAndRenewDailyTask(nextAvailableDailyTask);
                } else {
                  handleMarkDailyTaskCompleted(nextAvailableDailyTask);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs text-white hover:opacity-95 ${
                readyToClaimTaskIds.includes(nextAvailableDailyTask.id)
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 animate-pulse'
                  : 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500'
              }`}
            >
              {readyToClaimTaskIds.includes(nextAvailableDailyTask.id) ? (
                <>
                  <Gift className="w-3.5 h-3.5 text-yellow-200" />
                  <span>
                    {completingTaskId
                      ? tr(profile, 'Claiming...', 'ලබා ගනිමින්...')
                      : tr(
                          profile,
                          `Claim +${formatSiteAmount(currentVip.rewardPerTask, activeCurrency)} & Auto-Renew ↻`,
                          `+${formatSiteAmount(currentVip.rewardPerTask, activeCurrency)} Claim කර Auto-Renew කරන්න ↻`
                        )}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {tr(
                      profile,
                      `Complete Next Task (+${formatSiteAmount(currentVip.rewardPerTask, activeCurrency)})`,
                      `මීළඟ Task එක සම්පූර්ණ කරන්න (+${formatSiteAmount(currentVip.rewardPerTask, activeCurrency)})`
                    )}
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* VIP Tier Task Selector Bar (Easy 1-Tap Switching Without Scrolling) */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131926] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {VIP_TIERS.map((tier) => {
              const isSelected = selectedVipFilter === tier.level;
              const isUserTier = profile.vipLevel === tier.level;
              return (
                <button
                  key={tier.level}
                  type="button"
                  onClick={() => setSelectedVipFilter(tier.level)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-[#192236] text-slate-700 dark:text-slate-300 hover:border-pink-400'
                  }`}
                >
                  <img
                    src={tier.imageUrl}
                    alt={tier.name}
                    className="w-6 h-4 rounded object-cover border border-white/30"
                  />
                  <span>{tier.level === 0 ? 'Starter (VIP 0)' : tier.name}</span>
                  {isUserTier && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-mono uppercase">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedVipFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedVipFilter === 'all'
                  ? 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#192236] text-slate-700 dark:text-slate-300'
              }`}
            >
              All VIP Tiers
            </button>
          </div>

          {onNavigateVip && profile.vipLevel < 4 && (
            <button
              type="button"
              onClick={onNavigateVip}
              className="px-3.5 py-2 rounded-xl bg-pink-500/15 border border-pink-500/40 text-pink-600 dark:text-pink-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-pink-500/25"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Upgrade VIP Package for Higher Task Rewards</span>
            </button>
          )}
        </div>

        {/* Daily Tasks Grid for Selected VIP Tier */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, index) => {
            const isTeamMilestone = task.taskType === 'team_milestone';
            const reqVip = VIP_TIERS.find((v) => v.level === task.minVipLevel) || VIP_TIERS[0];
            const isUserCurrentVip = profile.vipLevel === task.minVipLevel;
            const isHigherVipLocked = profile.vipLevel < task.minVipLevel;
            const isLowerVipTask = profile.vipLevel > task.minVipLevel;

            // For 5-Deposit Team Milestone task: calculate current cycle progress after auto-renewals
            const targetDepCount = task.targetDepositMembers || 5;
            const claimedDepForTier = claimedDepositMap[task.minVipLevel] || 0;
            const completedDepCycles = Math.floor(claimedDepForTier / targetDepCount);
            const activeDepositProgress = isUserCurrentVip
              ? Math.max(0, depositTeamCount - claimedDepForTier)
              : 0;
            const effectiveDepProgress = Math.min(targetDepCount, activeDepositProgress);
            const isMilestoneReadyToClaim =
              isTeamMilestone && isUserCurrentVip && activeDepositProgress >= targetDepCount;
            const isMilestoneTeamShort =
              isTeamMilestone && activeDepositProgress < targetDepCount;

            // For Daily VIP Tasks: Step 1 = Complete (fills to 100%), Step 2 = Claim (credits balance & auto-renews to 0%)
            const isDailyReadyToClaim =
              !isTeamMilestone && isUserCurrentVip && readyToClaimTaskIds.includes(task.id);
            const taskClaimedTimes = dailyTaskClaimCounts[task.id] || 0;
            const isRunning = completingTaskId === task.id;

            // Individual Task Bar fill percentage (100% when completed and ready to claim, 0% when renewed)
            const dailyTaskBarFill = isUserCurrentVip ? (isDailyReadyToClaim ? 100 : 0) : 0;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, delay: index * 0.02 }}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 shadow-md ${
                  isDailyReadyToClaim || isMilestoneReadyToClaim
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-[#132226] ring-1 ring-emerald-500/40'
                    : isTeamMilestone
                      ? 'border-pink-500 bg-white dark:bg-[#131926]'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131926]'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={reqVip.imageUrl}
                        alt={reqVip.name}
                        className="w-8 h-5 rounded object-cover border border-pink-500/30"
                      />
                      <span className="font-bold text-pink-600 dark:text-pink-400">
                        {task.category}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isDailyReadyToClaim || isMilestoneReadyToClaim
                          ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 border border-emerald-500/40'
                          : isUserCurrentVip
                            ? 'bg-pink-500/20 text-pink-500 dark:text-pink-300 border border-pink-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isDailyReadyToClaim || isMilestoneReadyToClaim
                        ? tr(profile, 'READY TO CLAIM ✓', 'CLAIM කිරීමට සූදානම් ✓')
                        : isUserCurrentVip
                          ? taskClaimedTimes > 0 || completedDepCycles > 0
                            ? `AUTO-RENEWED ↻ (${isTeamMilestone ? completedDepCycles : taskClaimedTimes}x)`
                            : `ACTIVE · ${reqVip.name}`
                          : `VIP ${task.minVipLevel} · ${reqVip.name}`}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {replaceCurrencyInText(task.title, activeCurrency)}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {replaceCurrencyInText(task.description, activeCurrency)}
                  </p>

                  {task.targetDepositMembers ? (
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-pink-400 dark:border-pink-600 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">
                          5 Deposit Members Task Bar (Cycle #{completedDepCycles + 1})
                        </span>
                        <span className="text-pink-600 dark:text-pink-400 font-bold">
                          {effectiveDepProgress} / {targetDepCount} (
                          {Math.min(
                            100,
                            Math.round((effectiveDepProgress / targetDepCount) * 100)
                          )}
                          %)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isMilestoneReadyToClaim
                              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500'
                              : 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (effectiveDepProgress / targetDepCount) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      {completedDepCycles > 0 && isUserCurrentVip && (
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Claimed {completedDepCycles}x (+
                          {formatSiteAmount(completedDepCycles * task.reward, activeCurrency)}) · Auto-Renewed ↻
                        </div>
                      )}
                      {!isUserCurrentVip && (
                        <div className="text-[10px] font-mono text-amber-500 dark:text-amber-400">
                          Task bar fills only for your active VIP ({currentVip.name})
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-600 dark:text-slate-300">
                          {reqVip.name} Task Bar {taskClaimedTimes > 0 ? `(Cycle #${taskClaimedTimes + 1})` : ''}
                        </span>
                        <span
                          className={`font-bold ${
                            isDailyReadyToClaim
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isUserCurrentVip
                                ? 'text-pink-600 dark:text-pink-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {dailyTaskBarFill}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isDailyReadyToClaim
                              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500'
                              : 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500'
                          }`}
                          style={{ width: `${dailyTaskBarFill}%` }}
                        />
                      </div>
                      {taskClaimedTimes > 0 && isUserCurrentVip && (
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Claimed {taskClaimedTimes}x (+
                          {formatSiteAmount(taskClaimedTimes * task.reward, activeCurrency)}) · Auto-Renewed ↻
                        </div>
                      )}
                      {!isUserCurrentVip && (
                        <div className="text-[10px] font-mono text-amber-500 dark:text-amber-400 font-semibold">
                          ★ Only {reqVip.name} (VIP {task.minVipLevel}) users can complete this task
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      VIP Task Reward
                    </div>
                    <div className="text-sm font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{formatCurrencyValue(task.reward, activeCurrency)} {activeCurrency}
                    </div>
                  </div>

                  {isHigherVipLocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateVip) onNavigateVip();
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-pink-500/15 border border-pink-500/40 text-pink-600 dark:text-pink-300 flex items-center gap-1.5 cursor-pointer hover:bg-pink-500/25 whitespace-nowrap shrink-0"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Only {reqVip.name} · Upgrade</span>
                    </button>
                  ) : isLowerVipTask ? (
                    <button
                      type="button"
                      onClick={() => setSelectedVipFilter(profile.vipLevel)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Only {reqVip.name} Users</span>
                    </button>
                  ) : isTeamMilestone ? (
                    <button
                      type="button"
                      disabled={isMilestoneTeamShort || isRunning}
                      onClick={() => onCompletePlatformTask(task)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        isMilestoneTeamShort
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md animate-pulse hover:opacity-95 cursor-pointer'
                      }`}
                    >
                      {isRunning ? (
                        <span>{tr(profile, 'Claiming...', 'ලබා ගනිමින්...')}</span>
                      ) : isMilestoneTeamShort ? (
                        <span>
                          Need {targetDepCount} Deposit Members ({effectiveDepProgress}/{targetDepCount})
                        </span>
                      ) : (
                        <>
                          <Gift className="w-3.5 h-3.5 text-yellow-200" />
                          <span>
                            Claim +{formatCurrencyValue(task.reward, activeCurrency)} {activeCurrency}
                          </span>
                        </>
                      )}
                    </button>
                  ) : isDailyReadyToClaim ? (
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => handleClaimAndRenewDailyTask(task)}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md animate-pulse hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5 text-yellow-200" />
                      <span>
                        {isRunning
                          ? tr(profile, 'Claiming...', 'ලබා ගනිමින්...')
                          : tr(
                              profile,
                              `Claim +${formatCurrencyValue(task.reward, activeCurrency)} ${activeCurrency}`,
                              `+${formatCurrencyValue(task.reward, activeCurrency)} ${activeCurrency} Claim කරන්න`
                            )}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => handleMarkDailyTaskCompleted(task)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white shadow-sm hover:opacity-95 cursor-pointer"
                    >
                      {tr(
                        profile,
                        `Complete Task (+${formatCurrencyValue(task.reward, activeCurrency)} ${activeCurrency})`,
                        `Task සම්පූර්ණ කරන්න (+${formatCurrencyValue(task.reward, activeCurrency)} ${activeCurrency})`
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* All VIP Tiers: 1 Member Registration (Unlimited) & 5-Deposit Member Build Tasks */}
        <div className="pt-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {tr(
                  profile,
                  '1 Member Registration (Unlimited) & Team Build Tasks',
                  '1 සාමාජික ලියාපදිංචි (Unlimited) සහ කණ්ඩායම් ගොඩනැගීමේ Tasks'
                )}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">
                {currentVip.name} (VIP {profile.vipLevel})
              </span>
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
              {tr(
                profile,
                'Only your active VIP task is completable. Other VIP tasks are shown in gray (locked).',
                'දැනට සිටින VIP මට්ටමේ Task පමණක් සම්පූර්ණ කළ හැක. අනෙකුත් VIP Tasks අළු පැහැයෙන් (Gray) පෙන්වයි.'
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamTaskConfigs.map((cfg) => {
              const milestoneTask = PLATFORM_DAILY_TASKS.find((t) => t.id === cfg.taskId);
              const isUserCurrentVip = profile.vipLevel === cfg.level;

              // Unlimited 1-Member Registration tracking (active only for current VIP, auto-renews to 0% after each claim)
              const totalRegMembers = isUserCurrentVip ? referrals.length : 0;
              const activeClaimedCount = isUserCurrentVip ? Math.min(totalRegMembers, claimedRegCount) : 0;
              const unclaimedRegCount = isUserCurrentVip
                ? Math.max(0, totalRegMembers - activeClaimedCount)
                : 0;
              const totalRegClaimLkr = totalRegMembers * cfg.regBonus;
              const claimedRegLkr = activeClaimedCount * cfg.regBonus;
              const unclaimedRegLkr = unclaimedRegCount * cfg.regBonus;
              const regProgressPercent = isUserCurrentVip
                ? unclaimedRegCount > 0
                  ? 100
                  : 0
                : 0;

              // 5-Deposit Members Task Bar (active only for current VIP, auto-renews to 0/5 after each claim)
              const claimedDepositForTier = isUserCurrentVip ? claimedDepositMap[cfg.level] || 0 : 0;
              const completedDepositCycles = Math.floor(claimedDepositForTier / 5);
              const totalDepositClaimedLkr = completedDepositCycles * cfg.reward;
              const unclaimedDepositCount = isUserCurrentVip
                ? Math.max(0, depositTeamCount - claimedDepositForTier)
                : 0;
              const effectiveDepositCount = isUserCurrentVip ? Math.min(5, unclaimedDepositCount) : 0;
              const effectiveFillPercent = isUserCurrentVip
                ? Math.min(100, Math.round((effectiveDepositCount / 5) * 100))
                : 0;
              const hasFiveMembers = isUserCurrentVip && unclaimedDepositCount >= 5;
              const isBusy = completingTaskId === cfg.taskId;

              return (
                <div
                  key={cfg.level}
                  className={`p-5 rounded-2xl flex flex-col justify-between gap-4 border transition-all ${
                    isUserCurrentVip
                      ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-lg ${cfg.border} ring-2 ring-white/40`
                      : 'bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase ${
                          isUserCurrentVip
                            ? `${cfg.pillBg} text-white`
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span>
                          {cfg.tier.name}{' '}
                          {isUserCurrentVip ? '· ACTIVE VIP TASKS' : '· LOCKED (INACTIVE VIP)'}
                        </span>
                      </div>
                      <img
                        src={cfg.tier.imageUrl}
                        alt={cfg.tier.name}
                        className={`w-12 h-8 rounded-lg object-cover border shadow-sm ${
                          isUserCurrentVip
                            ? 'border-white/40'
                            : 'border-slate-400/40 grayscale opacity-70'
                        }`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-extrabold font-display ${
                        isUserCurrentVip ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cfg.tier.name} — 1 Member & 5 Deposit Tasks
                    </h3>
                    <p
                      className={`text-xs leading-relaxed ${
                        isUserCurrentVip ? 'text-white/95' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      1 Member Registration (Unlimited) ={' '}
                      <strong>+{formatSiteAmount(cfg.regBonus, activeCurrency)} / Member</strong> · 5
                      Deposit Team = <strong>+{formatSiteAmount(cfg.reward, activeCurrency)}</strong>
                    </p>
                  </div>

                  {/* ================= TASK 1: 1 MEMBER REGISTRATION TASK (UNLIMITED JOINS & AUTO-RENEW) ================= */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isUserCurrentVip
                        ? `bg-[#131926] ${cfg.border}`
                        : 'bg-slate-300/70 dark:bg-slate-900/70 border-slate-400/50 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span
                        className={`font-bold flex items-center gap-1.5 ${
                          isUserCurrentVip ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <UserPlus
                          className={`w-3.5 h-3.5 ${
                            isUserCurrentVip ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        />
                        <span>1 Member Registration Task (Unlimited)</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold ${
                          isUserCurrentVip
                            ? unclaimedRegCount > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-400/30 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isUserCurrentVip
                          ? unclaimedRegCount > 0
                            ? `${unclaimedRegCount}/1 Ready to Claim ✓`
                            : activeClaimedCount > 0
                              ? `0/1 · Auto-Renewed ↻`
                              : `0/1 · Unlimited`
                          : `+${formatSiteAmount(cfg.regBonus, activeCurrency)} / 1 Member`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className={`w-full h-2.5 rounded-full overflow-hidden ${
                        isUserCurrentVip ? 'bg-slate-800' : 'bg-slate-400/40 dark:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`h-full transition-all duration-300 ${
                          isUserCurrentVip
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500'
                            : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        style={{ width: `${regProgressPercent}%` }}
                      />
                    </div>

                    {/* Total Claim & Per-Member Stats Box */}
                    <div
                      className={`grid grid-cols-3 gap-1.5 p-2 rounded-xl border text-center ${
                        isUserCurrentVip
                          ? 'bg-slate-900/90 border-white/10'
                          : 'bg-slate-200/80 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div>
                        <div
                          className={`text-[9px] uppercase font-bold ${
                            isUserCurrentVip ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {tr(profile, 'Per 1 Member', '1 සාමාජිකයෙකුට')}
                        </div>
                        <div
                          className={`text-xs font-extrabold font-mono ${
                            isUserCurrentVip ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          +{formatSiteAmount(cfg.regBonus, activeCurrency)}
                        </div>
                      </div>
                      <div
                        className={`border-x px-1 ${
                          isUserCurrentVip
                            ? 'border-white/10'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <div
                          className={`text-[9px] uppercase font-bold ${
                            isUserCurrentVip ? 'text-pink-300' : 'text-slate-500'
                          }`}
                        >
                          {tr(profile, 'Registered', 'ලියාපදිංචි ගණන')}
                        </div>
                        <div
                          className={`text-xs font-extrabold font-mono ${
                            isUserCurrentVip ? 'text-pink-300' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isUserCurrentVip ? `${totalRegMembers} Members` : '0 Members'}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`text-[9px] uppercase font-bold ${
                            isUserCurrentVip ? 'text-emerald-300' : 'text-slate-500'
                          }`}
                        >
                          {tr(profile, 'Total Claim', 'මුළු Total Claim')}
                        </div>
                        <div
                          className={`text-xs font-extrabold font-mono ${
                            isUserCurrentVip
                              ? 'text-emerald-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          +{formatSiteAmount(isUserCurrentVip ? totalRegClaimLkr : 0, activeCurrency)}
                        </div>
                      </div>
                    </div>

                    {/* Action / Claim Button at the End */}
                    {!isUserCurrentVip ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-400/40 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {tr(
                            profile,
                            `Locked · Only Active for ${cfg.tier.name} (VIP ${cfg.level})`,
                            `අගුළු දමා ඇත · ${cfg.tier.name} (VIP ${cfg.level}) සඳහා පමණි`
                          )}
                        </span>
                      </button>
                    ) : unclaimedRegCount > 0 ? (
                      <button
                        type="button"
                        disabled={claimingRegBonus}
                        onClick={() => handleClaimRegistrationBonus(cfg)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md animate-pulse cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Gift className="w-4 h-4 text-yellow-200 shrink-0" />
                        <span>
                          {claimingRegBonus
                            ? 'Claiming...'
                            : `Claim +${formatSiteAmount(unclaimedRegLkr, activeCurrency)} (${unclaimedRegCount} New) · Auto-Renews ↻`}
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        {claimedRegLkr > 0 && (
                          <div className="w-full sm:w-auto px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono font-bold text-center whitespace-nowrap">
                            Claimed: +{formatSiteAmount(claimedRegLkr, activeCurrency)} ({activeClaimedCount}) · Renewed ↻
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/?ref=${profile.referralCode}`;
                            navigator.clipboard.writeText(shareUrl);
                            setChallengeNotice(
                              tr(
                                profile,
                                `Referral link copied! Invite unlimited friends (+${formatSiteAmount(cfg.regBonus, activeCurrency)} per registration).`,
                                `යොමු කිරීමේ සබැඳිය පිටපත් කරන ලදී! සීමාවකින් තොරව මිතුරන් ලියාපදිංචි කරවා +${formatSiteAmount(cfg.regBonus, activeCurrency)} බැගින් ලබා ගන්න.`
                              )
                            );
                          }}
                          className="w-full flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-white/15"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            {totalRegMembers > 0
                              ? `Invite Next Member (+${formatSiteAmount(cfg.regBonus, activeCurrency)}) · Copy Link`
                              : `Invite 1 Member to Claim +${formatSiteAmount(cfg.regBonus, activeCurrency)} · Copy Link`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ================= TASK 2: 5 DEPOSIT MEMBERS TEAM BUILD TASK BAR (AUTO-RENEWS ON CLAIM) ================= */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isUserCurrentVip
                        ? `bg-[#131926] ${cfg.border}`
                        : 'bg-slate-300/70 dark:bg-slate-900/70 border-slate-400/50 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-bold flex items-center gap-1.5 ${
                          isUserCurrentVip ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Crown
                          className={`w-3.5 h-3.5 ${
                            isUserCurrentVip ? 'text-amber-400' : 'text-slate-500'
                          }`}
                        />
                        <span>
                          5 Deposit Members Task Bar{' '}
                          {isUserCurrentVip && completedDepositCycles > 0
                            ? `(Cycle #${completedDepositCycles + 1})`
                            : ''}
                        </span>
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isUserCurrentVip ? cfg.accentText : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {effectiveDepositCount} / 5 ({effectiveFillPercent}%)
                      </span>
                    </div>

                    <div
                      className={`w-full h-2.5 rounded-full overflow-hidden ${
                        isUserCurrentVip ? 'bg-slate-800' : 'bg-slate-400/40 dark:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`h-full transition-all duration-300 ${
                          isUserCurrentVip
                            ? hasFiveMembers
                              ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500'
                              : 'bg-gradient-to-r from-sky-300 via-white to-pink-200'
                            : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        style={{ width: `${effectiveFillPercent}%` }}
                      />
                    </div>

                    <div
                      className={`flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono ${
                        isUserCurrentVip ? 'text-pink-200' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <span>
                        Reward: <strong>+{formatSiteAmount(cfg.reward, activeCurrency)}</strong>
                      </span>
                      <span>
                        {isUserCurrentVip
                          ? completedDepositCycles > 0
                            ? `Total Claimed: +${formatSiteAmount(totalDepositClaimedLkr, activeCurrency)} (${completedDepositCycles}x) · Auto-Renewed ↻`
                            : 'Auto-Renews After Claim ↻'
                          : `Locked (${cfg.tier.name})`}
                      </span>
                    </div>

                    {!isUserCurrentVip ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-400/40 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {tr(
                            profile,
                            `Locked · Only Active for ${cfg.tier.name} (VIP ${cfg.level})`,
                            `අගුළු දමා ඇත · ${cfg.tier.name} (VIP ${cfg.level}) සඳහා පමණි`
                          )}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!hasFiveMembers || isBusy}
                        onClick={() => {
                          if (milestoneTask) {
                            onCompletePlatformTask(milestoneTask);
                          }
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                          !hasFiveMembers
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md animate-pulse cursor-pointer'
                        }`}
                      >
                        {isBusy ? (
                          <span>Crediting Reward & Renewing...</span>
                        ) : !hasFiveMembers ? (
                          <span>
                            {completedDepositCycles > 0
                              ? `Auto-Renewed ↻ · Build Next 5 Deposit Members (${effectiveDepositCount}/5)`
                              : `Build 5 Deposit Members (${effectiveDepositCount}/5)`}
                          </span>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 text-yellow-200 shrink-0" />
                            <span>
                              Claim +{formatSiteAmount(cfg.reward, activeCurrency)} Reward · Auto-Renews ↻
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Google Tasks Workspace Integration */}
      <div className="p-6 rounded-2xl border border-pink-300 dark:border-slate-700 bg-white dark:bg-[#131926] space-y-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-mono text-pink-600 dark:text-pink-400">
              GOOGLE WORKSPACE INTEGRATION
            </div>
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <ListChecks className="w-5 h-5 text-pink-500" />
              <span>Synchronized Google Tasks Manager</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {taskLists.length > 0 && (
              <select
                value={selectedListId}
                onChange={(e) => {
                  setSelectedListId(e.target.value);
                  fetchTasksForList(e.target.value);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {taskLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={fetchGoogleTaskLists}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {googleError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{googleError}</span>
          </div>
        )}

        {needsGoogleAuth ? (
          <div className="py-8 max-w-md mx-auto text-center space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Connect your Google account to view, create, and manage your personal task lists in
              Google Tasks.
            </p>
            <button
              type="button"
              onClick={handleConnectGoogleTasks}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">Sign in with Google</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateGoogleTask}
              className="lg:col-span-5 space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Add New Task to Google Tasks
              </div>
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title (e.g. Review VIP 3 portfolio yield)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <textarea
                rows={2}
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={loadingGoogleTasks}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Google Task</span>
              </button>
            </form>

            <div className="lg:col-span-7 divide-y divide-slate-100 dark:divide-slate-800">
              {loadingGoogleTasks ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Synchronizing with Google Tasks...
                </div>
              ) : googleTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No tasks in this Google Task list yet. Create one on the left!
                </div>
              ) : (
                googleTasks.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: 'toggle', task: item })}
                      className="flex items-start gap-2.5 text-left cursor-pointer"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          item.status === 'completed'
                            ? 'text-emerald-500'
                            : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <div
                          className={`text-xs font-semibold ${
                            item.status === 'completed'
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.title}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: 'delete', task: item })}
                      title="Delete Google Task"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory User Confirmation Modal for Google Tasks Update / Delete */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {confirmAction.type === 'delete'
                ? 'Confirm Google Task Deletion'
                : 'Confirm Google Task Status Update'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmAction.type === 'delete'
                ? `Are you sure you want to permanently delete the task "${confirmAction.task.title}" from your Google Tasks list?`
                : `Are you sure you want to mark "${confirmAction.task.title}" as ${
                    confirmAction.task.status === 'completed' ? 'Needs Action' : 'Completed'
                  } in Google Tasks?`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white cursor-pointer ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white'
                }`}
              >
                {confirmAction.type === 'delete' ? 'Confirm Delete' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
