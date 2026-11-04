import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  TrendingUp,
  Users,
  Layers,
  CheckCircle2,
  Zap,
  Award,
  Calculator,
  ArrowUpRight,
} from 'lucide-react';
import {
  UserProfile,
  VipTierConfig,
  getVipTiersCatalog,
  getCommissionLevelsForVip,
  getHighestVipLevel,
  formatSiteAmount,
  tr,
} from '../types';

interface VipBenefitsPosterProps {
  profile: UserProfile;
  activeCurrency: string;
  isDark: boolean;
  onSelectTier?: (tier: VipTierConfig) => void;
}

export const VipBenefitsPoster: React.FC<VipBenefitsPosterProps> = ({
  profile,
  activeCurrency,
  isDark,
  onSelectTier,
}) => {
  const [vipTiers, setVipTiers] = useState<VipTierConfig[]>(() => getVipTiersCatalog());
  const [simulatedTierLevel, setSimulatedTierLevel] = useState<number>(4);

  useEffect(() => {
    const refresh = () => setVipTiers(getVipTiersCatalog());
    window.addEventListener('zentro-catalog-updated', refresh);
    return () => window.removeEventListener('zentro-catalog-updated', refresh);
  }, []);

  const paidTiers = vipTiers.filter((t) => t.level >= 1 && t.level <= 4);
  const highestMiningVip = getHighestVipLevel(profile);
  const simulatedTier =
    paidTiers.find((t) => t.level === simulatedTierLevel) ||
    paidTiers[paidTiers.length - 1] ||
    vipTiers[1];

  const getTierTheme = (level: number) => {
    switch (level) {
      case 1:
        return {
          badgeBg: 'from-amber-600 to-orange-500',
          border: 'border-amber-500/40',
          glow: 'from-amber-500/15 via-orange-500/10 to-transparent',
          barGradient: 'from-amber-400 to-orange-500',
          textAccent: 'text-amber-400',
          pillBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          levelColors: [
            'bg-amber-400',
            'bg-amber-500',
            'bg-orange-400',
            'bg-orange-500',
            'bg-yellow-500',
          ],
        };
      case 2:
        return {
          badgeBg: 'from-slate-400 via-sky-500 to-blue-600',
          border: 'border-sky-500/40',
          glow: 'from-sky-500/15 via-blue-500/10 to-transparent',
          barGradient: 'from-sky-400 to-blue-500',
          textAccent: 'text-sky-400',
          pillBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          levelColors: [
            'bg-sky-400',
            'bg-sky-500',
            'bg-blue-400',
            'bg-blue-500',
            'bg-indigo-400',
          ],
        };
      case 3:
        return {
          badgeBg: 'from-pink-500 via-rose-500 to-amber-500',
          border: 'border-rose-500/40',
          glow: 'from-rose-500/15 via-pink-500/10 to-transparent',
          barGradient: 'from-pink-400 via-rose-500 to-amber-400',
          textAccent: 'text-rose-400',
          pillBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          levelColors: [
            'bg-pink-400',
            'bg-rose-400',
            'bg-rose-500',
            'bg-amber-400',
            'bg-orange-400',
          ],
        };
      default:
        return {
          badgeBg: 'from-sky-400 via-blue-600 to-pink-500',
          border: 'border-pink-500/50',
          glow: 'from-sky-500/20 via-pink-500/15 to-transparent',
          barGradient: 'from-sky-400 via-blue-500 to-pink-500',
          textAccent: 'text-pink-400',
          pillBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
          levelColors: [
            'bg-sky-400',
            'bg-blue-400',
            'bg-indigo-400',
            'bg-pink-400',
            'bg-rose-400',
          ],
        };
    }
  };

  return (
    <section
      className={`rounded-3xl border overflow-hidden transition-all ${
        isDark
          ? 'bg-[#111827] border-pink-500/30 shadow-2xl shadow-pink-950/20'
          : 'bg-white border-pink-200 shadow-xl'
      }`}
    >
      {/* Top Poster Banner Header */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#3b0764] text-white overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 20%, rgba(56, 189, 248, 0.45), transparent 45%), radial-gradient(circle at 82% 75%, rgba(2ec, 72, 153, 0.45), transparent 50%)',
          }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-300 text-xs font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>
                {tr(
                  profile,
                  'OFFICIAL ZENTRO VIP BENEFITS & 5-LEVEL COMMISSION POSTER',
                  'නිල ZENTRO VIP ප්‍රතිලාභ සහ මට්ටම් 5 කොමිස් සැසඳුම් පෝස්ටරය'
                )}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-tight">
              {tr(
                profile,
                '5-Level Commission Breakdown & Side-by-Side VIP Matrix',
                'මට්ටම් 5 කොමිස් ව්‍යුහය සහ VIP පැකේජ සැසඳුම් වගුව'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {tr(
                profile,
                'Compare daily live mining rates, task rewards, friend registration bonuses, and 5-generation team deposit commissions across Bronze, Silver, Gold, and Platinum.',
                'Bronze, Silver, Gold සහ Platinum පැකේජ හරහා දෛනික Mining ප්‍රතිශත, Task ආදායම්, මිතුරන් ලියාපදිංචි කිරීමේ දීමනා සහ පරම්පරා 5ක කොමිස් ප්‍රතිලාභ එකම තැනකින් සසඳා බලන්න.'
              )}
            </p>
          </div>

          {/* Summary KPI Badges in Header */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="text-[10px] font-mono uppercase text-slate-300">
                {tr(profile, 'Max Commission Pool', 'උපරිම කොමිස් එකතුව')}
              </div>
              <div className="text-xl font-extrabold font-mono tabular-nums text-sky-300 mt-0.5">
                61% <span className="text-xs font-normal text-white/75">(L1–L5)</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="text-[10px] font-mono uppercase text-slate-300">
                {tr(profile, 'Max Live Mining', 'උපරිම දෛනික Mining')}
              </div>
              <div className="text-xl font-extrabold font-mono tabular-nums text-emerald-300 mt-0.5">
                12% <span className="text-xs font-normal text-white/75">/ Day</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="text-[10px] font-mono uppercase text-slate-300">
                {tr(profile, 'Your Active Status', 'ඔබගේ වත්මන් මට්ටම')}
              </div>
              <div className="text-sm font-extrabold font-mono text-pink-300 mt-1 truncate">
                {profile.vipLevel > 0
                  ? paidTiers.find((t) => t.level === profile.vipLevel)?.name ||
                    `VIP ${profile.vipLevel}`
                  : tr(profile, 'Starter (VIP 0)', 'ආරම්භක (VIP 0)')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-8">
        {/* PART 1: VISUAL 5-LEVEL COMMISSION BREAKDOWN GRID & PROPORTIONAL BARS */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-pink-500 font-bold">
                <Layers className="w-4 h-4" />
                <span>
                  {tr(
                    profile,
                    'PART 1 · 5-LEVEL REFERRAL COMMISSION VISUALIZER',
                    '1 කොටස · මට්ටම් 5 කොමිස් ප්‍රතිශත දෘශ්‍ය සැසඳුම'
                  )}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold font-display mt-0.5">
                {tr(
                  profile,
                  'L1 to L5 Commission Distribution by VIP Package',
                  'එක් එක් VIP පැකේජය සඳහා L1 සිට L5 දක්වා කොමිස් බෙදී යන ආකාරය'
                )}
              </h3>
            </div>

            {/* Interactive Downline Package Selector for Live Payout Calculation */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10">
              <span className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-sky-400" />
                {tr(profile, 'Simulate Member Deposit:', 'සාමාජික තැන්පතුව:')}
              </span>
              {paidTiers.map((t) => {
                const active = simulatedTier?.level === t.level;
                return (
                  <button
                    key={t.level}
                    type="button"
                    onClick={() => setSimulatedTierLevel(t.level)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-sky-500 to-pink-500 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {t.name.replace('Zentro ', '')} (
                    {formatSiteAmount(t.unlockAmount, activeCurrency)})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4-Column CSS Grid for 5-Level Commission Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {paidTiers.map((tier) => {
              const theme = getTierTheme(tier.level);
              const levels =
                tier.commissionLevels && tier.commissionLevels.length > 0
                  ? tier.commissionLevels
                  : getCommissionLevelsForVip(tier.level);
              const totalPoolPercent = levels.reduce((sum, item) => sum + item.ratePercent, 0);
              const isUserCurrentVip = profile.vipLevel === tier.level;
              const baseDepositAmount = simulatedTier
                ? simulatedTier.unlockAmount
                : tier.unlockAmount;

              return (
                <div
                  key={tier.level}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 relative overflow-hidden ${
                    isDark ? 'bg-[#172036]' : 'bg-slate-50'
                  } ${
                    isUserCurrentVip
                      ? 'border-pink-500 ring-2 ring-pink-500/30'
                      : theme.border
                  }`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${theme.glow} pointer-events-none`}
                  />

                  <div className="relative z-10 space-y-3">
                    {/* Tier Title + Total Pool Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${theme.badgeBg}`}
                        >
                          <Crown className="w-3 h-3" />
                          VIP {tier.level}
                        </span>
                        <h4 className="text-base font-extrabold font-display mt-1">
                          {tier.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          {tr(profile, 'Total Pool', 'මුළු කොමිස්')}
                        </div>
                        <div
                          className={`text-xl font-extrabold font-mono tabular-nums ${theme.textAccent}`}
                        >
                          {totalPoolPercent}%
                        </div>
                      </div>
                    </div>

                    {/* Stacked Proportional Bar showing L1-L5 share of 65% max scale */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{tr(profile, '5-Level Pool Scale', 'මට්ටම් 5 අනුපාතය')}</span>
                        <span className="font-bold text-slate-300">{totalPoolPercent}% / 61% Max</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-900/80 p-0.5 flex gap-0.5 overflow-hidden border border-white/10">
                        {levels.map((lv, idx) => (
                          <div
                            key={lv.level}
                            title={`L${lv.level}: ${lv.ratePercent}%`}
                            className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 ${
                              theme.levelColors[idx % theme.levelColors.length]
                            }`}
                            style={{
                              width: `${Math.max(4, (lv.ratePercent / 61) * 100)}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Individual L1 to L5 Horizontal Bar Matrix */}
                    <div className="space-y-2 pt-1">
                      {levels.map((lv, idx) => {
                        const payoutAmount = (baseDepositAmount * lv.ratePercent) / 100;
                        const barWidthPercent = Math.min(100, Math.round((lv.ratePercent / 25) * 100));
                        return (
                          <div
                            key={lv.level}
                            className={`p-2 rounded-xl border ${
                              isDark
                                ? 'bg-slate-900/65 border-white/10'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono mb-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold text-slate-950 ${
                                    theme.levelColors[idx % theme.levelColors.length]
                                  }`}
                                >
                                  L{lv.level}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-300">
                                  {lv.level === 1
                                    ? tr(profile, 'Direct Invite', 'සෘජු ආරාධිත')
                                    : `${tr(profile, 'Gen', 'පරම්පරාව')} ${lv.level}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 tabular-nums">
                                <span className={`font-extrabold ${theme.textAccent}`}>
                                  {lv.ratePercent}%
                                </span>
                                <span className="text-[11px] font-bold text-emerald-400">
                                  +{formatSiteAmount(payoutAmount, activeCurrency)}
                                </span>
                              </div>
                            </div>
                            {/* Proportional Bar */}
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${theme.barGradient}`}
                                style={{ width: `${barWidthPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Simulated 5-Level Payout Footer */}
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      {tr(profile, '5-Level Total Payout:', 'මට්ටම් 5 මුළු ගෙවීම:')}
                    </span>
                    <span className="font-extrabold text-emerald-400 tabular-nums">
                      +{formatSiteAmount((baseDepositAmount * totalPoolPercent) / 100, activeCurrency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PART 2: SIDE-BY-SIDE VIP COMPARISON MATRIX (CSS GRID) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-sky-400 font-bold">
                <Award className="w-4 h-4" />
                <span>
                  {tr(
                    profile,
                    'PART 2 · SIDE-BY-SIDE VIP TIER COMPARISON MATRIX',
                    '2 කොටස · සියලුම VIP පැකේජ ප්‍රතිලාභ සැසඳුම් වගුව'
                  )}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold font-display mt-0.5">
                {tr(
                  profile,
                  'Complete VIP Benefits & Yield Comparison',
                  'සම්පූර්ණ VIP ප්‍රතිලාභ සහ දෛනික ආදායම් සැසඳුම'
                )}
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {tr(
                profile,
                `All values displayed in ${activeCurrency}`,
                `සියලුම අගයන් ${activeCurrency} මුදල් ඒකකයෙන් දැක්වේ`
              )}
            </div>
          </div>

          {/* Responsive CSS Grid Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/15">
            <div className="min-w-[760px]">
              {/* Header Row: Metric Label + 4 VIP Columns */}
              <div
                className={`grid grid-cols-5 border-b ${
                  isDark ? 'bg-[#172036] border-white/10' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="p-4 flex flex-col justify-center">
                  <span className="text-xs font-mono uppercase text-slate-400">
                    {tr(profile, 'Benefit / Feature', 'ප්‍රතිලාභය / විශේෂාංගය')}
                  </span>
                  <span className="text-sm font-extrabold font-display mt-0.5">
                    {tr(profile, 'VIP Package Tier', 'VIP පැකේජ මට්ටම')}
                  </span>
                </div>
                {paidTiers.map((tier) => {
                  const theme = getTierTheme(tier.level);
                  const isCurrent = profile.vipLevel === tier.level;
                  const isHighestMining = highestMiningVip === tier.level && highestMiningVip > 0;
                  return (
                    <div
                      key={tier.level}
                      className={`p-4 border-l ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                      } ${isCurrent ? 'bg-pink-500/10' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${theme.badgeBg}`}
                        >
                          VIP {tier.level}
                        </span>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        ) : isHighestMining ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⚡ MINING
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm font-extrabold font-display">{tier.name}</div>
                      <div className={`text-sm font-mono font-extrabold tabular-nums mt-0.5 ${theme.textAccent}`}>
                        {formatSiteAmount(tier.unlockAmount, activeCurrency)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Row 1: Live Mining Daily % & Daily Profit */}
              <div
                className={`grid grid-cols-5 border-b ${
                  isDark ? 'bg-[#121a2d] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className="p-3.5 flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {tr(profile, 'Live Mining Rate', 'දෛනික Mining ප්‍රතිශතය')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {tr(profile, 'Uses highest purchased VIP', 'ඉහළම VIP මට්ටම අනුව')}
                    </div>
                  </div>
                </div>
                {paidTiers.map((tier) => {
                  const dailyMiningAmount =
                    (tier.unlockAmount * tier.dailyMiningRatePercent) / 100;
                  return (
                    <div
                      key={tier.level}
                      className={`p-3.5 border-l font-mono flex flex-col justify-center ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                      }`}
                    >
                      <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
                        +{tier.dailyMiningRatePercent}% / Day
                      </span>
                      <span className="text-[11px] text-slate-300 tabular-nums">
                        +{formatSiteAmount(dailyMiningAmount, activeCurrency)} / day
                      </span>
                      <span className="text-[10px] text-emerald-300/80 tabular-nums">
                        30d: {tier.dailyMiningRatePercent * 30}% (
                        +{formatSiteAmount(dailyMiningAmount * 30, activeCurrency)})
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Row 2: Daily Tasks & Per-Task Reward */}
              <div
                className={`grid grid-cols-5 border-b ${
                  isDark ? 'bg-[#151e34] border-white/10' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="p-3.5 flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-pink-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {tr(profile, 'Daily Tasks & Reward', 'දෛනික Tasks සහ ගෙවීම')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {tr(profile, 'Auto-renews after claim', 'Claim පසු ස්වයංක්‍රීයව අලුත් වේ')}
                    </div>
                  </div>
                </div>
                {paidTiers.map((tier) => (
                  <div
                    key={tier.level}
                    className={`p-3.5 border-l font-mono flex flex-col justify-center ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <span className="text-sm font-extrabold text-pink-400 tabular-nums">
                      {tier.dailyTasks} Tasks / Day
                    </span>
                    <span className="text-[11px] text-slate-300 tabular-nums">
                      +{formatSiteAmount(tier.rewardPerTask, activeCurrency)} / task
                    </span>
                    <span className="text-[10px] text-pink-300/80 tabular-nums">
                      {tr(profile, 'Daily:', 'දිනකට:')}{' '}
                      +{formatSiteAmount(tier.dailyYield, activeCurrency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Row 3: 1 Friend Registration Bonus */}
              <div
                className={`grid grid-cols-5 border-b ${
                  isDark ? 'bg-[#121a2d] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className="p-3.5 flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {tr(profile, '1 Friend Registration', 'මිතුරෙකු ලියාපදිංචි දීමනාව')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {tr(profile, 'Instant invite reward', 'ආරාධනා කේතයෙන් ලියාපදිංචියට')}
                    </div>
                  </div>
                </div>
                {paidTiers.map((tier) => (
                  <div
                    key={tier.level}
                    className={`p-3.5 border-l font-mono flex flex-col justify-center ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <span className="text-sm font-extrabold text-sky-400 tabular-nums">
                      +{formatSiteAmount(tier.registrationBonusPerFriend, activeCurrency)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tr(profile, 'Per verified friend', 'එක් සාමාජිකයෙකුට')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Row 4: 5 Deposit Members Team Task */}
              <div
                className={`grid grid-cols-5 border-b ${
                  isDark ? 'bg-[#151e34] border-white/10' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="p-3.5 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {tr(profile, '5 Deposit Members Task', 'තැන්පතු සාමාජිකයන් 5 දීමනාව')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {tr(profile, 'Repeatable team milestone', 'නැවත නැවත ලබාගත හැක')}
                    </div>
                  </div>
                </div>
                {paidTiers.map((tier) => (
                  <div
                    key={tier.level}
                    className={`p-3.5 border-l font-mono flex flex-col justify-center ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <span className="text-sm font-extrabold text-amber-400 tabular-nums">
                      +{formatSiteAmount(tier.teamTaskReward, activeCurrency)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tr(profile, 'Every 5 VIP referrals', 'සෑම VIP සාමාජිකයන් 5කටම')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Row 5: L1 - L5 Commission Rates Summary Row */}
              <div
                className={`grid grid-cols-5 border-b ${
                  isDark ? 'bg-[#121a2d] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className="p-3.5 flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {tr(profile, '5-Level Commission (L1–L5)', 'මට්ටම් 5 කොමිස් (L1–L5)')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {tr(profile, 'Team deposit commission', 'කණ්ඩායම් තැන්පතු කොමිස්')}
                    </div>
                  </div>
                </div>
                {paidTiers.map((tier) => {
                  const levels =
                    tier.commissionLevels && tier.commissionLevels.length > 0
                      ? tier.commissionLevels
                      : getCommissionLevelsForVip(tier.level);
                  const total = levels.reduce((acc, l) => acc + l.ratePercent, 0);
                  return (
                    <div
                      key={tier.level}
                      className={`p-3.5 border-l font-mono flex flex-col justify-center gap-1 ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-extrabold text-purple-300 tabular-nums">
                        {total}% Total Pool
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {levels.map((l) => (
                          <span
                            key={l.level}
                            className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[10px] text-purple-200 tabular-nums"
                          >
                            L{l.level}:{l.ratePercent}%
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Row: Direct Select / Upgrade Buttons */}
              {onSelectTier && (
                <div
                  className={`grid grid-cols-5 ${
                    isDark ? 'bg-[#172036]' : 'bg-slate-100'
                  }`}
                >
                  <div className="p-3.5 flex items-center text-xs font-mono text-slate-400">
                    {tr(profile, 'Instant Activation', 'ක්ෂණිකව සක්‍රිය කරන්න')}
                  </div>
                  {paidTiers.map((tier) => {
                    const isCurrent = profile.vipLevel === tier.level;
                    const isLower = tier.level < profile.vipLevel;
                    return (
                      <div
                        key={tier.level}
                        className={`p-3.5 border-l ${
                          isDark ? 'border-white/10' : 'border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => onSelectTier(tier)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                              : isLower
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-95 shadow-sm'
                                : 'bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white hover:opacity-95 shadow-sm'
                          }`}
                        >
                          <span>
                            {isCurrent
                              ? tr(profile, 'Active Tier ✓', 'සක්‍රියයි ✓')
                              : isLower
                                ? tr(profile, 'Buy Lower VIP', 'මිලදී ගන්න')
                                : tr(profile, 'Activate VIP', 'සක්‍රිය කරන්න')}
                          </span>
                          {!isCurrent && <ArrowUpRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
