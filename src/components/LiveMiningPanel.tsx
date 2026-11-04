import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Coins,
  Cpu,
  Crown,
  Flame,
  Lock,
  Play,
  Pause,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  CURRENCY_OPTIONS,
  UserProfile,
  VIP_TIERS,
  VipTierConfig,
  convertFromLkr,
  formatCurrencyValue,
  formatSiteAmount,
  getActiveCurrency,
  getHighestVipLevel,
  tr,
} from '../types';

interface LiveMiningState {
  isRunning: boolean;
  lastTickTimestamp: number;
  accruedLkr: number;
  lastDailyCycleClaimDate: string | null;
  totalMinedLkr: number;
}

interface LiveMiningPanelProps {
  profile: UserProfile;
  isDark: boolean;
  onClaimMiningReward: (amountInLkr: number, description: string) => Promise<void>;
  onNavigateVip: () => void;
}

const MINING_STORAGE_PREFIX = 'zentro_live_mining_v1_';

function loadMiningState(uid: string, isVip: boolean): LiveMiningState {
  const now = Date.now();
  if (typeof window === 'undefined' || !uid) {
    return {
      isRunning: isVip,
      lastTickTimestamp: now,
      accruedLkr: 0,
      lastDailyCycleClaimDate: null,
      totalMinedLkr: 0,
    };
  }
  try {
    const raw = localStorage.getItem(`${MINING_STORAGE_PREFIX}${uid}`);
    if (!raw) {
      return {
        isRunning: isVip,
        lastTickTimestamp: now,
        accruedLkr: 0,
        lastDailyCycleClaimDate: null,
        totalMinedLkr: 0,
      };
    }
    const parsed = JSON.parse(raw) as LiveMiningState;
    return {
      isRunning: typeof parsed.isRunning === 'boolean' ? parsed.isRunning : isVip,
      lastTickTimestamp: parsed.lastTickTimestamp || now,
      accruedLkr: Number(parsed.accruedLkr) || 0,
      lastDailyCycleClaimDate: parsed.lastDailyCycleClaimDate || null,
      totalMinedLkr: Number(parsed.totalMinedLkr) || 0,
    };
  } catch {
    return {
      isRunning: isVip,
      lastTickTimestamp: now,
      accruedLkr: 0,
      lastDailyCycleClaimDate: null,
      totalMinedLkr: 0,
    };
  }
}

function saveMiningState(uid: string, state: LiveMiningState): void {
  if (typeof window === 'undefined' || !uid) return;
  try {
    localStorage.setItem(`${MINING_STORAGE_PREFIX}${uid}`, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

// Helper SVG component for a small, creative animated honeybee
const CreativeHoneyBee: React.FC<{
  className?: string;
  flip?: boolean;
  isFlying?: boolean;
  size?: number;
}> = ({ className = '', flip = false, isFlying = true, size = 28 }) => (
  <div
    className={`pointer-events-none select-none z-20 ${className}`}
    aria-hidden="true"
  >
    <div className={flip ? '-scale-x-100' : ''}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_3px_8px_rgba(245,158,11,0.55)]"
      >
        {/* Glowing pollen trail dots */}
        <circle
          cx="4"
          cy="21"
          r="1.6"
          fill="#FBBF24"
          className={isFlying ? 'animate-ping' : 'opacity-40'}
        />
        <circle cx="8" cy="20" r="1.2" fill="#FDE68A" opacity="0.85" />

        {/* Back Wing */}
        <g className={isFlying ? 'animate-bee-wing' : ''}>
          <ellipse
            cx="17"
            cy="11.5"
            rx="4.2"
            ry="6.2"
            transform="rotate(-22 17 11.5)"
            fill="rgba(186, 230, 253, 0.72)"
            stroke="#7DD3FC"
            strokeWidth="0.9"
          />
          {/* Front Wing */}
          <ellipse
            cx="21"
            cy="11"
            rx="4.8"
            ry="6.8"
            transform="rotate(14 21 11)"
            fill="rgba(224, 242, 254, 0.88)"
            stroke="#38BDF8"
            strokeWidth="1"
          />
        </g>

        {/* Stinger */}
        <path d="M10.5 19.5L7.2 20.2L10.5 21.2Z" fill="#1E293B" />

        {/* Bee Abdomen / Body */}
        <ellipse
          cx="18.5"
          cy="19.8"
          rx="8.2"
          ry="5.6"
          fill="url(#beeGoldGrad)"
          stroke="#78350F"
          strokeWidth="1.1"
        />

        {/* Honeybee Stripes */}
        <path
          d="M14.5 14.8C13.8 17.8 13.8 21.8 14.5 24.8"
          stroke="#1E1B18"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M18.5 14.3C17.8 17.8 17.8 21.8 18.5 25.3"
          stroke="#1E1B18"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M22.3 15.2C21.8 18 21.8 21.5 22.3 24.3"
          stroke="#1E1B18"
          strokeWidth="2.1"
          strokeLinecap="round"
        />

        {/* Bee Head */}
        <circle cx="26.2" cy="19.2" r="3.8" fill="#1E1B18" />
        {/* Cute Eye + Highlight */}
        <circle cx="27.5" cy="18.3" r="1.1" fill="#FFFFFF" />
        <circle cx="27.8" cy="18.1" r="0.45" fill="#0F172A" />
        {/* Warm Cheek Glow */}
        <circle cx="27.2" cy="20.4" r="0.9" fill="#F43F5E" opacity="0.85" />

        {/* Antennae */}
        <path
          d="M27.2 15.8C28.2 13.5 29.8 12.6 31.2 12.8"
          stroke="#F59E0B"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <circle cx="31.4" cy="12.8" r="1.1" fill="#FBBF24" />
        <path
          d="M25.5 15.8C25.8 13.6 27.1 12.4 28.4 12.3"
          stroke="#F59E0B"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="28.6" cy="12.3" r="1" fill="#FBBF24" />

        <defs>
          <linearGradient
            id="beeGoldGrad"
            x1="11"
            y1="14"
            x2="26"
            y2="25"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FDE047" />
            <stop offset="0.5" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

export const LiveMiningPanel: React.FC<LiveMiningPanelProps> = ({
  profile,
  isDark,
  onClaimMiningReward,
  onNavigateVip,
}) => {
  const activeCurrency = getActiveCurrency(profile);
  const currencyMeta =
    CURRENCY_OPTIONS.find((c) => c.code === activeCurrency) || CURRENCY_OPTIONS[0];

  const highestMiningVipLevel = getHighestVipLevel(profile);
  const userVipTier =
    VIP_TIERS.find((t) => t.level === highestMiningVipLevel) || VIP_TIERS[0];
  const currentTaskVipTier =
    VIP_TIERS.find((t) => t.level === profile.vipLevel) || VIP_TIERS[0];
  const isUpgradeRequired = Boolean(profile.mustUpgradeNextVip);
  const nextRequiredVipTier =
    VIP_TIERS.find((t) => t.level === Math.min(4, highestMiningVipLevel + 1)) || VIP_TIERS[4];
  const isVipActive = highestMiningVipLevel >= 1 && !isUpgradeRequired;

  // Allow user to preview any tier's mining rate or view their highest mining VIP tier
  const [previewLevel, setPreviewLevel] = useState<number>(
    highestMiningVipLevel >= 1 ? highestMiningVipLevel : 1
  );

  useEffect(() => {
    if (highestMiningVipLevel >= 1) {
      setPreviewLevel(highestMiningVipLevel);
    }
  }, [highestMiningVipLevel]);

  const [miningState, setMiningState] = useState<LiveMiningState>(() =>
    loadMiningState(profile.uid, isVipActive)
  );
  const [claiming, setClaiming] = useState(false);

  // Active mining principal in LKR:
  // Uses the user's active VIP package value + available wallet balance so mining scales with both VIP package and balance
  const activePrincipalLkr = isVipActive
    ? Math.max(userVipTier.unlockAmount, userVipTier.unlockAmount + profile.balance)
    : (VIP_TIERS.find((t) => t.level === previewLevel)?.unlockAmount || 1000);

  const activeRatePercent = isVipActive
    ? userVipTier.dailyMiningRatePercent
    : (VIP_TIERS.find((t) => t.level === previewLevel)?.dailyMiningRatePercent || 6);

  const dailyMiningLkr = (activePrincipalLkr * activeRatePercent) / 100;
  const perSecondLkr = dailyMiningLkr / 86400;

  // Sync mining state when user changes
  useEffect(() => {
    const loaded = loadMiningState(profile.uid, isVipActive);
    if (isUpgradeRequired) {
      const pausedState: LiveMiningState = {
        ...loaded,
        isRunning: false,
        lastTickTimestamp: Date.now(),
      };
      setMiningState(pausedState);
      saveMiningState(profile.uid, pausedState);
      return;
    }
    if (isVipActive && loaded.isRunning) {
      const now = Date.now();
      const elapsedSec = Math.max(0, (now - loaded.lastTickTimestamp) / 1000);
      const userRate = userVipTier.dailyMiningRatePercent;
      const principal = Math.max(
        userVipTier.unlockAmount,
        userVipTier.unlockAmount + profile.balance
      );
      const secYield = (principal * (userRate / 100)) / 86400;
      const updated: LiveMiningState = {
        ...loaded,
        accruedLkr: loaded.accruedLkr + elapsedSec * secYield,
        lastTickTimestamp: now,
      };
      setMiningState(updated);
      saveMiningState(profile.uid, updated);
    } else {
      setMiningState(loaded);
    }
  }, [
    profile.uid,
    isVipActive,
    isUpgradeRequired,
    userVipTier.dailyMiningRatePercent,
    userVipTier.unlockAmount,
  ]);

  // Live 1000ms ticker for real-time selected currency mining (smooth & throttled to eliminate UI lag)
  useEffect(() => {
    if (!miningState.isRunning || isUpgradeRequired) return;

    let tickCount = 0;
    const interval = setInterval(() => {
      setMiningState((prev) => {
        const now = Date.now();
        const elapsedSec = Math.max(0, (now - prev.lastTickTimestamp) / 1000);
        const nextAccrued = prev.accruedLkr + elapsedSec * perSecondLkr;
        const nextState: LiveMiningState = {
          ...prev,
          accruedLkr: nextAccrued,
          lastTickTimestamp: now,
        };
        tickCount += 1;
        // Throttle disk writes: write to localStorage once every 10 seconds instead of multiple times per second
        if (isVipActive && tickCount % 10 === 0) {
          saveMiningState(profile.uid, nextState);
        }
        return nextState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [miningState.isRunning, isUpgradeRequired, perSecondLkr, isVipActive, profile.uid]);

  const toggleMiningRunning = () => {
    setMiningState((prev) => {
      const next: LiveMiningState = {
        ...prev,
        isRunning: !prev.isRunning,
        lastTickTimestamp: Date.now(),
      };
      saveMiningState(profile.uid, next);
      return next;
    });
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const hasClaimedDailyCycleToday = miningState.lastDailyCycleClaimDate === todayKey;

  // Claim either full 24h daily mining yield (once per day) or accrued live mining
  const handleClaimDailyCycle = async () => {
    if (!isVipActive) {
      onNavigateVip();
      return;
    }
    if (claiming) return;

    const claimAmtLkr = !hasClaimedDailyCycleToday
      ? Number((dailyMiningLkr + miningState.accruedLkr).toFixed(2))
      : Number(miningState.accruedLkr.toFixed(2));

    if (claimAmtLkr < 0.5) {
      return;
    }

    setClaiming(true);
    try {
      const desc = `${userVipTier.name} Live ${activeCurrency} Mining Yield (${userVipTier.dailyMiningRatePercent}% Daily)`;
      await onClaimMiningReward(claimAmtLkr, desc);

      const nextState: LiveMiningState = {
        ...miningState,
        accruedLkr: 0,
        lastTickTimestamp: Date.now(),
        lastDailyCycleClaimDate: todayKey,
        totalMinedLkr: Number((miningState.totalMinedLkr + claimAmtLkr).toFixed(2)),
      };
      setMiningState(nextState);
      saveMiningState(profile.uid, nextState);
    } finally {
      setClaiming(false);
    }
  };

  // Convert live accrued LKR to active currency with 6 decimals for live counter
  const accruedInActiveCurrency =
    (miningState.accruedLkr || 0) / (currencyMeta.lkrPerUnit || 1);
  const dailyInActiveCurrency = convertFromLkr(dailyMiningLkr, activeCurrency);
  const hourlyInActiveCurrency = dailyInActiveCurrency / 24;
  const perSecondInActiveCurrency = dailyInActiveCurrency / 86400;
  const totalMinedInCurrency = convertFromLkr(miningState.totalMinedLkr, activeCurrency);

  const isBeesActive = miningState.isRunning && !isUpgradeRequired;

  // Visual progress percentage of accrued relative to daily cycle (clamped 8% to 100% for clear visual bar)
  const cycleProgressPercent = Math.min(
    100,
    Math.max(
      isBeesActive ? 14 : 6,
      dailyMiningLkr > 0
        ? ((!hasClaimedDailyCycleToday ? dailyMiningLkr * 0.65 : 0) +
            miningState.accruedLkr) /
            dailyMiningLkr *
            100
        : 15
    )
  );

  return (
    <div
      className={`p-4 sm:p-6 rounded-3xl border space-y-4 relative overflow-hidden transition-all ${
        isDark
          ? 'bg-gradient-to-br from-[#0e1528] via-[#131c36] to-[#23142e] border-amber-400/35 text-white shadow-[0_20px_60px_-15px_rgba(245,158,11,0.18)]'
          : 'bg-gradient-to-br from-amber-50/70 via-white to-sky-50/80 border-amber-300/80 text-slate-900 shadow-lg'
      }`}
    >
      {/* Subtle Honeycomb Hexagonal Ambient Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.1]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, #f59e0b 1.5px, transparent 1.5px), radial-gradient(circle at 80% 70%, #38bdf8 1.5px, transparent 1.5px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Compact Top Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
            <Cpu className="w-4 h-4 animate-pulse text-amber-400" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-mono">
              <span className="text-amber-400 font-extrabold uppercase">
                {tr(
                  profile,
                  `LIVE ${activeCurrency} MINING & INSTANT COLLECT`,
                  `සජීවී ${activeCurrency} පතල් ආදායම සහ ක්ෂණික ලබාගැනීම (Collect)`
                )}
              </span>
              <span className="hidden sm:inline text-slate-400">·</span>
              <span className="text-pink-400 font-bold">
                {userVipTier.name} ({isVipActive ? `${userVipTier.dailyMiningRatePercent}%/Day` : `Preview ${activeRatePercent}%/Day`})
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-black font-display tracking-tight leading-snug">
              {tr(
                profile,
                `Live ${activeCurrency} (${currencyMeta.symbol}) Automated Mining`,
                `සජීවී ${activeCurrency} (${currencyMeta.symbol}) දෛනික ප්‍රතිලාභ පද්ධතිය`
              )}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono ${
              isDark ? 'bg-black/35 border-white/15' : 'bg-white border-amber-200 shadow-xs'
            }`}
          >
            <span className="text-slate-400">
              {tr(profile, 'Capital:', 'ප්‍රාග්ධනය:')}{' '}
            </span>
            <strong className="text-amber-400 font-extrabold">
              {formatSiteAmount(activePrincipalLkr, activeCurrency)}
            </strong>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              isUpgradeRequired
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                : miningState.isRunning
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isUpgradeRequired
                  ? 'bg-rose-500 animate-pulse'
                  : miningState.isRunning
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-amber-400'
              }`}
            />
            <span className="font-extrabold">
              {isUpgradeRequired
                ? tr(
                    profile,
                    `Upgrade to ${nextRequiredVipTier.name}`,
                    `${nextRequiredVipTier.name} වෙත Upgrade කරන්න`
                  )
                : isVipActive
                  ? miningState.isRunning
                    ? tr(profile, 'LIVE MINING', 'සජීවීව ක්‍රියාත්මකයි')
                    : tr(profile, 'PAUSED', 'නවතා ඇත')
                  : tr(profile, `VIP ${previewLevel} PREVIEW`, `VIP ${previewLevel} පෙරදසුන`)}
            </span>
          </div>
        </div>
      </div>

      {isUpgradeRequired && (
        <div className="relative z-10 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-rose-400 uppercase tracking-wide">
                {tr(
                  profile,
                  `Next VIP Upgrade Required (${nextRequiredVipTier.name}): `,
                  `මීළඟ VIP මට්ටමට (${nextRequiredVipTier.name}) උත්ශ්‍රේණි කිරීම අනිවාර්ය වේ: `
                )}
              </span>
              <span className="text-rose-200/90">
                {tr(
                  profile,
                  `Upgrade to ${nextRequiredVipTier.name} (${formatSiteAmount(
                    nextRequiredVipTier.unlockAmount,
                    activeCurrency
                  )}) to resume Live Mining and Withdrawals.`,
                  `නැවත සජීවී Mining සහ Withdraw සක්‍රිය කිරීමට ${nextRequiredVipTier.name} වෙත Upgrade කරන්න.`
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateVip}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 text-white font-extrabold text-xs shrink-0 cursor-pointer shadow-md"
          >
            {tr(
              profile,
              `Upgrade to ${nextRequiredVipTier.name}`,
              `${nextRequiredVipTier.name} වෙත Upgrade කරන්න`
            )}
          </button>
        </div>
      )}

      {/* UNIFIED ABOVE-THE-FOLD LIVE MINING CHAMBER + INSTANT COLLECT CONSOLE */}
      <div
        className={`relative z-10 p-4 sm:p-6 rounded-3xl border overflow-hidden space-y-4 ${
          isDark
            ? 'bg-gradient-to-br from-[#090f1e]/95 via-[#101932]/95 to-[#1c1328]/95 border-amber-400/35 shadow-inner'
            : 'bg-gradient-to-br from-white via-amber-50/40 to-sky-50/50 border-amber-300 shadow-md'
        }`}
      >
        {/* Ambient Golden Glow inside the mining chamber */}
        <div className="pointer-events-none absolute -top-12 right-8 w-44 h-44 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-10 w-44 h-44 rounded-full bg-sky-400/15 blur-3xl" />

        {/* Small Creative Animated Honeybees (මී මැස්සන්) Flying Around the Live Mining Area */}
        <CreativeHoneyBee
          className={`absolute top-3 left-[26%] sm:left-[32%] ${
            isBeesActive ? 'animate-bee-1' : 'opacity-60'
          }`}
          isFlying={isBeesActive}
          size={26}
        />
        <CreativeHoneyBee
          className={`absolute top-10 right-6 sm:right-14 ${
            isBeesActive ? 'animate-bee-2' : 'opacity-60'
          }`}
          flip
          isFlying={isBeesActive}
          size={28}
        />
        <CreativeHoneyBee
          className={`absolute top-[48%] left-3 sm:left-6 ${
            isBeesActive ? 'animate-bee-3' : 'opacity-60'
          }`}
          isFlying={isBeesActive}
          size={22}
        />
        <CreativeHoneyBee
          className={`absolute bottom-14 right-[20%] sm:right-[28%] ${
            isBeesActive ? 'animate-bee-4' : 'opacity-60'
          }`}
          flip
          isFlying={isBeesActive}
          size={24}
        />
        <CreativeHoneyBee
          className={`absolute top-[22%] left-[48%] ${
            isBeesActive ? 'animate-bee-5' : 'opacity-60'
          }`}
          isFlying={isBeesActive}
          size={22}
        />

        {/* Main Row: Live Counter on Left + Instant Collect / Claim Button Right Next to It (Zero Scroll!) */}
        <div
          className={`relative z-10 p-4 sm:p-5 rounded-2xl border transition-all ${
            isDark
              ? 'bg-[#060b16]/90 border-amber-400/35 shadow-[0_0_35px_rgba(245,158,11,0.12)]'
              : 'bg-gradient-to-r from-amber-50/90 via-white to-sky-50/90 border-amber-300 shadow-sm'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left 7 Cols: Live Ticking Counter + Flying Hive Emblem */}
            <div className="lg:col-span-7 flex items-center justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    {tr(profile, 'LIVE ACCRUED BALANCE', 'සජීවීව එකතු වන මුදල')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-extrabold">
                    +{activeRatePercent}% / 24h
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    +{perSecondInActiveCurrency.toFixed(6)} {activeCurrency}/s
                  </span>
                </div>

                {/* Big, High-Contrast Live Counter */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg sm:text-2xl font-extrabold font-mono text-amber-400">
                    {currencyMeta.symbol}
                  </span>
                  <span className="text-3xl sm:text-4xl xl:text-5xl font-black font-mono tabular-nums tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-sky-400 drop-shadow-[0_2px_12px_rgba(251,191,36,0.28)]">
                    {accruedInActiveCurrency.toLocaleString('en-US', {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    })}
                  </span>
                  <span className="text-xs sm:text-base font-extrabold font-mono text-sky-400">
                    {activeCurrency}
                  </span>
                </div>

                {isVipActive && !hasClaimedDailyCycleToday && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-400 font-extrabold">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      + {formatSiteAmount(dailyMiningLkr, activeCurrency)}{' '}
                      {tr(profile, 'Daily Yield Ready to Collect!', 'දෛනික ප්‍රතිලාභය දැන් ලබාගත හැක!')}
                    </span>
                  </div>
                )}
              </div>

              {/* Golden Honeycomb Core Emblem with Hovering Mini Bee */}
              <div className="shrink-0 hidden sm:flex items-center justify-center">
                <div
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border flex flex-col items-center justify-center relative ${
                    isDark
                      ? 'bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-pink-500/20 border-amber-400/40'
                      : 'bg-gradient-to-br from-amber-100 via-yellow-50 to-pink-100 border-amber-300'
                  }`}
                >
                  <CreativeHoneyBee
                    className="-mt-1"
                    isFlying={isBeesActive}
                    size={30}
                  />
                  <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-amber-400 mt-0.5">
                    {isBeesActive
                      ? tr(profile, '5 BEES LIVE', 'සජීවී වදය')
                      : tr(profile, 'PAUSED', 'නවතා ඇත')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Immediate One-Tap COLLECT / CLAIM + Pause Button (No Scrolling Needed!) */}
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              {isUpgradeRequired ? (
                <button
                  type="button"
                  onClick={onNavigateVip}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    {tr(
                      profile,
                      `Upgrade to ${nextRequiredVipTier.name} (${formatSiteAmount(
                        nextRequiredVipTier.unlockAmount,
                        activeCurrency
                      )}) to Collect`,
                      `Collect කිරීමට ${nextRequiredVipTier.name} වෙත Upgrade කරන්න`
                    )}
                  </span>
                </button>
              ) : isVipActive ? (
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2.5">
                  <button
                    type="button"
                    disabled={
                      claiming ||
                      (hasClaimedDailyCycleToday && miningState.accruedLkr < 0.5)
                    }
                    onClick={handleClaimDailyCycle}
                    className="flex-1 py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-sky-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_10px_25px_-5px_rgba(245,158,11,0.45)] disabled:opacity-50 transition-all"
                  >
                    <Zap className="w-5 h-5 shrink-0 animate-bounce" />
                    <span className="text-left sm:text-center leading-tight">
                      {claiming
                        ? tr(profile, 'Collecting Mined Funds...', 'ගිණුමට බැර වෙමින්...')
                        : !hasClaimedDailyCycleToday
                          ? tr(
                              profile,
                              `COLLECT NOW: +${formatSiteAmount(
                                dailyMiningLkr + miningState.accruedLkr,
                                activeCurrency
                              )} (${userVipTier.dailyMiningRatePercent}%)`,
                              `දැන්ම ලබාගන්න (COLLECT): +${formatSiteAmount(
                                dailyMiningLkr + miningState.accruedLkr,
                                activeCurrency
                              )}`
                            )
                          : tr(
                              profile,
                              `COLLECT ACCRUED: +${formatSiteAmount(
                                miningState.accruedLkr,
                                activeCurrency
                              )}`,
                              `එකතු වූ මුදල ලබාගන්න (COLLECT): +${formatSiteAmount(
                                miningState.accruedLkr,
                                activeCurrency
                              )}`
                            )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleMiningRunning}
                    className={`py-3.5 px-4 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                      isDark
                        ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                        : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900 shadow-xs'
                    }`}
                  >
                    {miningState.isRunning ? (
                      <>
                        <Pause className="w-4 h-4 text-amber-400" />
                        <span>{tr(profile, 'Pause', 'නවත්වන්න')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span>{tr(profile, 'Resume', 'ආරම්භ කරන්න')}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateVip}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-sky-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    {tr(
                      profile,
                      `Activate VIP (6%–12% Daily) to Mine & Collect ${activeCurrency}`,
                      `${activeCurrency} සජීවීව උපයා Collect කිරීමට VIP සක්‍රිය කරන්න`
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Live 24h Mining Energy Progress Bar */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {tr(
                  profile,
                  '24H LIVE HIVE MINING CYCLE (5 WORKER BEES ACTIVE)',
                  'පැය 24 සජීවී පතල් චක්‍රය (මී මැස්සන් 5ක් සජීවීව සැරිසරයි)'
                )}
              </span>
              <span className="text-amber-400 font-extrabold">
                {isBeesActive
                  ? tr(profile, 'ACTIVE · 100% SPEED', 'ක්‍රියාකාරීයි · උපරිම වේගය')
                  : tr(profile, 'STANDBY', 'පොරොත්තු තත්ත්වයේ')}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800/90 overflow-hidden p-0.5 border border-amber-500/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 via-pink-500 to-sky-400 relative overflow-hidden transition-all duration-500"
                style={{ width: `${cycleProgressPercent}%` }}
              >
                {isBeesActive && (
                  <div className="
                    absolute inset-0 w-1/2 h-full
                    bg-gradient-to-r from-transparent via-white/60 to-transparent
                    animate-shimmer-slide
                  " />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compact 4-Card Summary Strip */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-amber-200/80'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              {tr(profile, 'Mining VIP Tier (Highest)', 'පතල් කැණීමේ ඉහළම VIP මට්ටම')}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-pink-400 mt-0.5 truncate">
              {userVipTier.name} ({isVipActive ? `${userVipTier.dailyMiningRatePercent}%` : 'Locked'})
            </div>
            {highestMiningVipLevel > profile.vipLevel && (
              <div className="text-[10px] text-amber-400 font-bold truncate mt-0.5">
                {tr(
                  profile,
                  `Tasks Active: ${currentTaskVipTier.name}`,
                  `Tasks මට්ටම: ${currentTaskVipTier.name}`
                )}
              </div>
            )}
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-amber-200/80'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              {tr(profile, 'Daily Yield', 'දෛනික ආදායම')}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-amber-400 mt-0.5 tabular-nums truncate">
              +{formatCurrencyValue(dailyMiningLkr, activeCurrency)} {activeCurrency}
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-amber-200/80'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              {tr(profile, 'Hourly Yield', 'පැයකට ලැබෙන මුදල')}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-sky-400 mt-0.5 tabular-nums truncate">
              +{hourlyInActiveCurrency.toFixed(4)} {activeCurrency}/hr
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-amber-200/80'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              {tr(profile, 'Total Mined', 'මුළු පතල් ආදායම')}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-emerald-400 mt-0.5 tabular-nums truncate">
              +{formatCurrencyValue(miningState.totalMinedLkr, activeCurrency)} {activeCurrency}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

