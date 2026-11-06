import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  Crown,
  Sparkles,
  Maximize2,
  X,
  Download,
  TrendingUp,
  Coins,
} from 'lucide-react';
import {
  UserProfile,
  formatSiteAmount,
  getActiveCurrency,
  tr,
  SponsorCountryItem,
  VipTierConfig,
  PlatformSponsorGlobalStats,
  getSponsorCountriesCatalog,
  getPlatformSponsorGlobalStats,
  getVipTiersCatalog,
} from '../types';

export const SponsorCountriesSection: React.FC<{
  profile: UserProfile;
  isDark: boolean;
}> = ({ profile, isDark }) => {
  const [countries, setCountries] = useState<SponsorCountryItem[]>(() =>
    getSponsorCountriesCatalog()
  );
  const [globalStats, setGlobalStats] = useState<PlatformSponsorGlobalStats>(() =>
    getPlatformSponsorGlobalStats()
  );

  useEffect(() => {
    const handleCatalogUpdate = () => {
      setCountries(getSponsorCountriesCatalog());
      setGlobalStats(getPlatformSponsorGlobalStats());
    };
    window.addEventListener('zentro-catalog-updated', handleCatalogUpdate);
    window.addEventListener('zentro-db-synced', handleCatalogUpdate);
    return () => {
      window.removeEventListener('zentro-catalog-updated', handleCatalogUpdate);
      window.removeEventListener('zentro-db-synced', handleCatalogUpdate);
    };
  }, []);

  const countriesSum = countries.reduce(
    (sum, item) => sum + (Number(item.registeredUsers) || 0),
    0
  );
  const totalGlobalUsers =
    typeof globalStats.totalMembersCount === 'number' && globalStats.totalMembersCount > 0
      ? globalStats.totalMembersCount
      : countriesSum;
  const activeCurrency = getActiveCurrency(profile);

  // Duplicate list twice for a seamless infinite left-to-right marquee loop
  const marqueeItems =
    countries.length > 0 ? [...countries, ...countries] : [];

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 overflow-hidden ${
        isDark
          ? 'bg-gradient-to-r from-[#12192b] via-[#151e34] to-[#1a1630] border-pink-500/30 shadow-lg'
          : 'bg-gradient-to-r from-white via-sky-50/40 to-pink-50/50 border-pink-200/90 shadow-sm'
      }`}
    >
      {/* Compact Single-Line Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-pink-500 text-white shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs sm:text-sm font-extrabold font-display truncate">
            {tr(
              profile,
              'Official Sponsor Countries & Registered Users',
              'අනුග්‍රාහක රටවල් (Sponsor Countries) සහ ලියාපදිංචි සාමාජිකයන්'
            )}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-500/10 border border-pink-500/30 text-[11px] font-mono">
          <Users className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          <span className="text-slate-400">
            {tr(profile, 'Total:', 'මුළු පරිශීලකයන්:')}
          </span>
          <span className="font-extrabold text-pink-500 dark:text-pink-400 tabular-nums">
            {totalGlobalUsers.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Single Compact Row — Smooth Left-to-Right Marquee Track */}
      {marqueeItems.length === 0 ? (
        <div className="py-3 text-center text-xs text-slate-400 font-mono">
          No sponsor countries configured.
        </div>
      ) : (
        <div className="relative w-full overflow-hidden py-0.5">
          <div className="flex w-max items-center gap-2.5 animate-sponsor-ltr">
            {marqueeItems.map((country, idx) => (
              <div
                key={`${country.id}_${idx}`}
                className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 shrink-0 transition-colors ${
                  isDark
                    ? 'bg-[#172138]/95 border-white/10 hover:border-pink-500/50'
                    : 'bg-white border-pink-200/80 hover:border-pink-400 shadow-xs'
                }`}
              >
                {/* Crisp Flag Image */}
                <div className="relative shrink-0">
                  <img
                    src={country.flagSvgUri}
                    alt={`${country.nameEn} Flag`}
                    className="w-9 h-6 rounded-md object-cover border border-white/20 shadow-xs"
                  />
                  <span className="absolute -bottom-1 -right-1 px-1 rounded bg-slate-950/90 text-[8px] font-mono font-bold text-sky-300 border border-white/15 leading-tight">
                    {country.code}
                  </span>
                </div>

                {/* Compact Country Name & Registered Users */}
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold font-display whitespace-nowrap">
                      {country.nameEn === 'France'
                        ? tr(profile, 'France (French)', 'ප්‍රංශය (French)')
                        : tr(profile, country.nameEn, country.nameSi || country.nameEn)}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-bold">
                      {country.growthRate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono whitespace-nowrap mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="font-extrabold text-pink-500 dark:text-pink-400 tabular-nums">
                      {(Number(country.registeredUsers) || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tr(profile, 'Users', 'සාමාජිකයන්')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Platform Summary Row Under Sponsor Countries: Total Members, Total Investing, Total Payout */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t ${
          isDark ? 'border-white/10' : 'border-pink-200/70'
        }`}
      >
        {/* 1. Total Members */}
        <div
          className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-[#0e1629]/90 border-sky-500/30'
              : 'bg-sky-50/70 border-sky-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Users className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">
                {tr(profile, 'Total Members', 'මුළු සාමාජිකයන්')}
              </div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-sky-400 tabular-nums">
                {totalGlobalUsers.toLocaleString()}
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-bold shrink-0">
            ● LIVE
          </span>
        </div>

        {/* 2. Total Investing */}
        <div
          className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-[#0e1629]/90 border-pink-500/30'
              : 'bg-pink-50/70 border-pink-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">
                {tr(profile, 'Total Investing', 'මුළු ආයෝජන')}
              </div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-pink-500 dark:text-pink-400 tabular-nums truncate">
                {formatSiteAmount(globalStats.totalInvestingLkr || 485920000, activeCurrency)}
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-400 text-[9px] font-mono font-bold shrink-0">
            VIP POOL
          </span>
        </div>

        {/* 3. Total Payout */}
        <div
          className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-[#0e1629]/90 border-emerald-500/30'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Coins className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">
                {tr(profile, 'Total Payout', 'මුළු ගෙවීම්')}
              </div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-emerald-500 dark:text-emerald-400 tabular-nums truncate">
                {formatSiteAmount(globalStats.totalPayoutLkr || 194368000, activeCurrency)}
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-bold shrink-0">
            VERIFIED
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Generates a high-definition full SVG infographic image data URI showing:
 * - Zentro Bronze (VIP 1), Silver (VIP 2), Gold (VIP 3), Platinum (VIP 4) (or Admin-updated VIP tiers)
 * - How L1, L2, L3, L4, L5 commissions & total commission pool change from VIP to VIP
 * - Friend Registration Bonus, 5-Member Team Task Bonus, Daily Mining Return, Unlock Deposit
 */
function buildVipComparisonFullPosterSvgUri(
  activeCurrency: string,
  vipTiers: VipTierConfig[]
): string {
  const paidTiers = vipTiers.filter((v) => v.level >= 1).sort((a, b) => a.level - b.level);
  const t1 = paidTiers[0] || vipTiers.find((v) => v.level === 1);
  const t2 = paidTiers[1] || vipTiers.find((v) => v.level === 2) || t1;
  const t3 = paidTiers[2] || vipTiers.find((v) => v.level === 3) || t2;
  const t4 = paidTiers[3] || vipTiers.find((v) => v.level === 4) || t3;

  const getRate = (tier: VipTierConfig | undefined, lvl: number, fallback: number) => {
    const found = tier?.commissionLevels?.find((c) => c.level === lvl);
    return found ? found.ratePercent : fallback;
  };
  const getPool = (tier: VipTierConfig | undefined, fallback: number) => {
    if (!tier?.commissionLevels || tier.commissionLevels.length === 0) return fallback;
    return tier.commissionLevels.reduce((s, c) => s + (Number(c.ratePercent) || 0), 0);
  };

  const bName = t1?.name || 'Zentro Bronze';
  const sName = t2?.name || 'Zentro Silver';
  const gName = t3?.name || 'Zentro Gold';
  const pName = t4?.name || 'Zentro Platinum';

  const bUnlock = formatSiteAmount(t1?.unlockAmount ?? 1000, activeCurrency);
  const sUnlock = formatSiteAmount(t2?.unlockAmount ?? 3500, activeCurrency);
  const gUnlock = formatSiteAmount(t3?.unlockAmount ?? 5000, activeCurrency);
  const pUnlock = formatSiteAmount(t4?.unlockAmount ?? 10000, activeCurrency);

  const bReg = formatSiteAmount(t1?.registrationBonusPerFriend ?? 10, activeCurrency);
  const sReg = formatSiteAmount(t2?.registrationBonusPerFriend ?? 30, activeCurrency);
  const gReg = formatSiteAmount(t3?.registrationBonusPerFriend ?? 50, activeCurrency);
  const pReg = formatSiteAmount(t4?.registrationBonusPerFriend ?? 100, activeCurrency);

  const bTeam = formatSiteAmount(t1?.teamTaskReward ?? 500, activeCurrency);
  const sTeam = formatSiteAmount(t2?.teamTaskReward ?? 1500, activeCurrency);
  const gTeam = formatSiteAmount(t3?.teamTaskReward ?? 3000, activeCurrency);
  const pTeam = formatSiteAmount(t4?.teamTaskReward ?? 5000, activeCurrency);

  const bTask = formatSiteAmount(t1?.dailyYield ?? 125, activeCurrency);
  const sTask = formatSiteAmount(t2?.dailyYield ?? 440, activeCurrency);
  const gTask = formatSiteAmount(t3?.dailyYield ?? 700, activeCurrency);
  const pTask = formatSiteAmount(t4?.dailyYield ?? 1500, activeCurrency);

  const bMine = t1?.dailyMiningRatePercent ?? 6;
  const sMine = t2?.dailyMiningRatePercent ?? 8;
  const gMine = t3?.dailyMiningRatePercent ?? 10;
  const pMine = t4?.dailyMiningRatePercent ?? 12;

  const bPool = getPool(t1, 20);
  const sPool = getPool(t2, 34);
  const gPool = getPool(t3, 44);
  const pPool = getPool(t4, 61);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 940" width="1400" height="940">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d1a"/>
        <stop offset="50%" stop-color="#111a30"/>
        <stop offset="100%" stop-color="#1b112c"/>
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="50%" stop-color="#ec4899"/>
        <stop offset="100%" stop-color="#e11d48"/>
      </linearGradient>
      <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#ec4899"/>
      </linearGradient>
      <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#6366f1"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#f43f5e"/>
      </linearGradient>
      <linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#22d3ee"/>
        <stop offset="50%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#ec4899"/>
      </linearGradient>
    </defs>

    <!-- Main Background -->
    <rect width="1400" height="940" rx="32" fill="url(#bgGrad)"/>
    <rect x="4" y="4" width="1392" height="932" rx="28" fill="none" stroke="#ec4899" stroke-opacity="0.4" stroke-width="2"/>

    <!-- Top Banner -->
    <rect x="36" y="28" width="1328" height="106" rx="22" fill="url(#headerGrad)"/>
    <text x="64" y="68" fill="#ffffff" font-family="Arial, sans-serif" font-size="27" font-weight="900" letter-spacing="0.5">
      ZENTRO VIP TIER &amp; 5-LEVEL COMMISSION COMPARISON CHART
    </text>
    <text x="64" y="102" fill="#ffe4e6" font-family="Arial, sans-serif" font-size="16" font-weight="700">
      VIP එකෙන් VIP එකට (${bName} · ${sName} · ${gName} · ${pName}) කොමිස් ප්‍රතිශත (L1 - L5) සහ ප්‍රතිලාභ වෙනස් වන ආකාරය
    </text>
    <rect x="1110" y="50" width="226" height="62" rx="14" fill="#0f172a" fill-opacity="0.45" stroke="#ffffff" stroke-opacity="0.35"/>
    <text x="1223" y="76" text-anchor="middle" fill="#38bdf8" font-family="Arial, sans-serif" font-size="13" font-weight="800">
      MAX 5-LEVEL POOL
    </text>
    <text x="1223" y="101" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="22" font-weight="900">
      UP TO ${pPool}% TOTAL
    </text>

    <!-- Column Headers -->
    <!-- Metric Column -->
    <rect x="36" y="154" width="288" height="108" rx="18" fill="#162038" stroke="#334155" stroke-width="1.5"/>
    <text x="58" y="196" fill="#38bdf8" font-family="Arial, sans-serif" font-size="15" font-weight="800">
      VIP LEVEL &amp; COMMISSION
    </text>
    <text x="58" y="222" fill="#ffffff" font-family="Arial, sans-serif" font-size="20" font-weight="900">
      Comparison Factor
    </text>
    <text x="58" y="246" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13" font-weight="600">
      සංසන්දනාත්මක විස්තරය
    </text>

    <!-- VIP 1: Bronze -->
    <rect x="340" y="154" width="242" height="108" rx="18" fill="#1c2237" stroke="#f59e0b" stroke-width="2"/>
    <rect x="356" y="168" width="94" height="24" rx="8" fill="url(#bronzeGrad)"/>
    <text x="403" y="185" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="900">
      VIP LEVEL ${t1?.level ?? 1}
    </text>
    <text x="356" y="218" fill="#fbbf24" font-family="Arial, sans-serif" font-size="22" font-weight="900">
      ${bName}
    </text>
    <text x="356" y="244" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" font-weight="700">
      Unlock: ${bUnlock}
    </text>

    <!-- VIP 2: Silver -->
    <rect x="598" y="154" width="242" height="108" rx="18" fill="#18243c" stroke="#38bdf8" stroke-width="2"/>
    <rect x="614" y="168" width="94" height="24" rx="8" fill="url(#silverGrad)"/>
    <text x="661" y="185" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="900">
      VIP LEVEL ${t2?.level ?? 2}
    </text>
    <text x="614" y="218" fill="#38bdf8" font-family="Arial, sans-serif" font-size="22" font-weight="900">
      ${sName}
    </text>
    <text x="614" y="244" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" font-weight="700">
      Unlock: ${sUnlock}
    </text>

    <!-- VIP 3: Gold -->
    <rect x="856" y="154" width="242" height="108" rx="18" fill="#231d36" stroke="#f43f5e" stroke-width="2"/>
    <rect x="872" y="168" width="94" height="24" rx="8" fill="url(#goldGrad)"/>
    <text x="919" y="185" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="900">
      VIP LEVEL ${t3?.level ?? 3}
    </text>
    <text x="872" y="218" fill="#fb7185" font-family="Arial, sans-serif" font-size="22" font-weight="900">
      ${gName}
    </text>
    <text x="872" y="244" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" font-weight="700">
      Unlock: ${gUnlock}
    </text>

    <!-- VIP 4: Platinum -->
    <rect x="1114" y="154" width="250" height="108" rx="18" fill="#172542" stroke="#22d3ee" stroke-width="2.5"/>
    <rect x="1130" y="168" width="128" height="24" rx="8" fill="url(#platGrad)"/>
    <text x="1194" y="185" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="900">
      VIP ${t4?.level ?? 4} · MAX TIER
    </text>
    <text x="1130" y="218" fill="#22d3ee" font-family="Arial, sans-serif" font-size="22" font-weight="900">
      ${pName}
    </text>
    <text x="1130" y="244" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" font-weight="800">
      Unlock: ${pUnlock}
    </text>

    <!-- ================= ROW 1: LEVEL 1 DIRECT DEPOSIT COMMISSION ================= -->
    <rect x="36" y="276" width="1328" height="62" rx="14" fill="#151f36" stroke="#ec4899" stroke-opacity="0.35"/>
    <text x="56" y="303" fill="#f472b6" font-family="Arial, sans-serif" font-size="15" font-weight="900">
      LEVEL 1 COMMISSION (Direct Invite)
    </text>
    <text x="56" y="324" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" font-weight="600">
      සෘජුවම සම්බන්ධ වන මිතුරන්ගේ තැන්පතු කොමිස් (L1)
    </text>
    <text x="461" y="315" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="26" font-weight="900">${getRate(t1, 1, 10)}%</text>
    <text x="719" y="315" text-anchor="middle" fill="#38bdf8" font-family="Arial, sans-serif" font-size="26" font-weight="900">${getRate(t2, 1, 15)}%</text>
    <text x="977" y="315" text-anchor="middle" fill="#fb7185" font-family="Arial, sans-serif" font-size="26" font-weight="900">${getRate(t3, 1, 20)}%</text>
    <text x="1239" y="315" text-anchor="middle" fill="#22d3ee" font-family="Arial, sans-serif" font-size="28" font-weight="900">${getRate(t4, 1, 25)}% ★</text>

    <!-- ================= ROW 2: LEVEL 2 DEPOSIT COMMISSION ================= -->
    <rect x="36" y="348" width="1328" height="62" rx="14" fill="#11192c" stroke="#334155" stroke-opacity="0.6"/>
    <text x="56" y="375" fill="#38bdf8" font-family="Arial, sans-serif" font-size="15" font-weight="900">
      LEVEL 2 COMMISSION (2nd Gen Team)
    </text>
    <text x="56" y="396" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" font-weight="600">
      දෙවන පෙළ සාමාජික තැන්පතු කොමිස් (L2)
    </text>
    <text x="461" y="387" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="24" font-weight="900">${getRate(t1, 2, 6)}%</text>
    <text x="719" y="387" text-anchor="middle" fill="#38bdf8" font-family="Arial, sans-serif" font-size="24" font-weight="900">${getRate(t2, 2, 10)}%</text>
    <text x="977" y="387" text-anchor="middle" fill="#fb7185" font-family="Arial, sans-serif" font-size="24" font-weight="900">${getRate(t3, 2, 12)}%</text>
    <text x="1239" y="387" text-anchor="middle" fill="#22d3ee" font-family="Arial, sans-serif" font-size="26" font-weight="900">${getRate(t4, 2, 16)}% ★</text>

    <!-- ================= ROW 3: LEVEL 3 DEPOSIT COMMISSION ================= -->
    <rect x="36" y="420" width="1328" height="62" rx="14" fill="#151f36" stroke="#334155" stroke-opacity="0.6"/>
    <text x="56" y="447" fill="#a78bfa" font-family="Arial, sans-serif" font-size="15" font-weight="900">
      LEVEL 3 COMMISSION (3rd Gen Network)
    </text>
    <text x="56" y="468" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" font-weight="600">
      තුන්වන පෙළ සාමාජික තැන්පතු කොමිස් (L3)
    </text>
    <text x="461" y="459" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="24" font-weight="900">${getRate(t1, 3, 2)}%</text>
    <text x="719" y="459" text-anchor="middle" fill="#38bdf8" font-family="Arial, sans-serif" font-size="24" font-weight="900">${getRate(t2, 3, 6)}%</text>
    <text x="977" y="459" text-anchor="middle" fill="#fb7185" font-family="Arial, sans-serif" font-size="24" font-weight="900">${getRate(t3, 3, 8)}%</text>
    <text x="1239" y="459" text-anchor="middle" fill="#22d3ee" font-family="Arial, sans-serif" font-size="26" font-weight="900">${getRate(t4, 3, 12)}% ★</text>

    <!-- ================= ROW 4: LEVEL 4 DEPOSIT COMMISSION ================= -->
    <rect x="36" y="492" width="1328" height="62" rx="14" fill="#11192c" stroke="#334155" stroke-opacity="0.6"/>
    <text x="56" y="519" fill="#34d399" font-family="Arial, sans-serif" font-size="15" font-weight="900">
      LEVEL 4 COMMISSION (4th Gen Syndicate)
    </text>
    <text x="56" y="540" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" font-weight="600">
      සිව්වන පෙළ සාමාජික තැන්පතු කොමිස් (L4)
    </text>
    <text x="461" y="531" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="22" font-weight="900">${getRate(t1, 4, 1)}%</text>
    <text x="719" y="531" text-anchor="middle" fill="#38bdf8" font-family="Arial, sans-serif" font-size="22" font-weight="900">${getRate(t2, 4, 2)}%</text>
    <text x="977" y="531" text-anchor="middle" fill="#fb7185" font-family="Arial, sans-serif" font-size="22" font-weight="900">${getRate(t3, 4, 3)}%</text>
    <text x="1239" y="531" text-anchor="middle" fill="#22d3ee" font-family="Arial, sans-serif" font-size="24" font-weight="900">${getRate(t4, 4, 5)}% ★</text>

    <!-- ================= ROW 5: LEVEL 5 DEPOSIT COMMISSION ================= -->
    <rect x="36" y="564" width="1328" height="62" rx="14" fill="#151f36" stroke="#334155" stroke-opacity="0.6"/>
    <text x="56" y="591" fill="#fbbf24" font-family="Arial, sans-serif" font-size="15" font-weight="900">
      LEVEL 5 COMMISSION (5th Gen Global)
    </text>
    <text x="56" y="612" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" font-weight="600">
      පස්වන පෙළ සාමාජික තැන්පතු කොමිස් (L5)
    </text>
    <text x="461" y="603" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="22" font-weight="900">${getRate(t1, 5, 1)}%</text>
    <text x="719" y="603" text-anchor="middle" fill="#38bdf8" font-family="Arial, sans-serif" font-size="22" font-weight="900">${getRate(t2, 5, 1)}%</text>
    <text x="977" y="603" text-anchor="middle" fill="#fb7185" font-family="Arial, sans-serif" font-size="22" font-weight="900">${getRate(t3, 5, 1)}%</text>
    <text x="1239" y="603" text-anchor="middle" fill="#22d3ee" font-family="Arial, sans-serif" font-size="24" font-weight="900">${getRate(t4, 5, 3)}% ★</text>

    <!-- ================= ROW 6: TOTAL 5-LEVEL COMMISSION POOL ================= -->
    <rect x="36" y="636" width="1328" height="68" rx="16" fill="#23153c" stroke="#ec4899" stroke-width="2"/>
    <text x="56" y="666" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="900">
      TOTAL 5-LEVEL COMMISSION POOL (L1+L2+L3+L4+L5)
    </text>
    <text x="56" y="688" fill="#f9a8d4" font-family="Arial, sans-serif" font-size="12" font-weight="700">
      මට්ටම් 5 ම එකතුවෙන් ලැබෙන මුළු කොමිස් ප්‍රතිශතය
    </text>
    <text x="461" y="678" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="26" font-weight="900">${bPool}% Pool</text>
    <text x="719" y="678" text-anchor="middle" fill="#38bdf8" font-family="Arial, sans-serif" font-size="26" font-weight="900">${sPool}% Pool</text>
    <text x="977" y="678" text-anchor="middle" fill="#fb7185" font-family="Arial, sans-serif" font-size="26" font-weight="900">${gPool}% Pool</text>
    <text x="1239" y="678" text-anchor="middle" fill="#34d399" font-family="Arial, sans-serif" font-size="28" font-weight="900">${pPool}% Pool</text>

    <!-- ================= ROW 7: 1 FRIEND REGISTRATION BONUS ================= -->
    <rect x="36" y="714" width="1328" height="62" rx="14" fill="#11192c" stroke="#334155" stroke-opacity="0.6"/>
    <text x="56" y="741" fill="#38bdf8" font-family="Arial, sans-serif" font-size="15" font-weight="900">
      1 FRIEND REGISTRATION BONUS (Invite Code)
    </text>
    <text x="56" y="762" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" font-weight="600">
      1 මිතුරෙකු ලියාපදිංචි වීමේදී ලැබෙන ප්‍රසාද දීමනාව
    </text>
    <text x="461" y="753" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="20" font-weight="900">+${bReg}</text>
    <text x="719" y="753" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="20" font-weight="900">+${sReg}</text>
    <text x="977" y="753" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="20" font-weight="900">+${gReg}</text>
    <text x="1239" y="753" text-anchor="middle" fill="#34d399" font-family="Arial, sans-serif" font-size="22" font-weight="900">+${pReg}</text>

    <!-- ================= ROW 8: 5 DEPOSIT MEMBERS TEAM TASK BONUS ================= -->
    <rect x="36" y="786" width="1328" height="62" rx="14" fill="#151f36" stroke="#334155" stroke-opacity="0.6"/>
    <text x="56" y="813" fill="#f472b6" font-family="Arial, sans-serif" font-size="15" font-weight="900">
      BUILD 5 DEPOSIT MEMBERS TEAM TASK REWARD
    </text>
    <text x="56" y="834" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" font-weight="600">
      තැන්පතු කළ සාමාජිකයන් 5 දෙනෙකුගේ කණ්ඩායම් දීමනාව
    </text>
    <text x="461" y="825" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="20" font-weight="900">+${bTeam}</text>
    <text x="719" y="825" text-anchor="middle" fill="#38bdf8" font-family="Arial, sans-serif" font-size="20" font-weight="900">+${sTeam}</text>
    <text x="977" y="825" text-anchor="middle" fill="#fb7185" font-family="Arial, sans-serif" font-size="20" font-weight="900">+${gTeam}</text>
    <text x="1239" y="825" text-anchor="middle" fill="#22d3ee" font-family="Arial, sans-serif" font-size="22" font-weight="900">+${pTeam}</text>

    <!-- ================= ROW 9: DAILY MINING & DAILY TASKS ================= -->
    <rect x="36" y="858" width="1328" height="58" rx="14" fill="#11192c" stroke="#38bdf8" stroke-opacity="0.4"/>
    <text x="56" y="883" fill="#34d399" font-family="Arial, sans-serif" font-size="15" font-weight="900">
      DAILY LIVE MINING % &amp; DAILY TASKS INCOME
    </text>
    <text x="56" y="903" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" font-weight="600">
      දෛනික Live Mining ප්‍රතිශතය සහ දෛනික Tasks ආදායම
    </text>
    <text x="461" y="893" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="17" font-weight="800">${bMine}%/Day · ${bTask}</text>
    <text x="719" y="893" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="17" font-weight="800">${sMine}%/Day · ${sTask}</text>
    <text x="977" y="893" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="17" font-weight="800">${gMine}%/Day · ${gTask}</text>
    <text x="1239" y="893" text-anchor="middle" fill="#34d399" font-family="Arial, sans-serif" font-size="18" font-weight="900">${pMine}%/Day · ${pTask}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const VipCommissionComparisonPoster: React.FC<{
  profile: UserProfile;
  activeCurrency: string;
  isDark: boolean;
  onUpgradeClick: () => void;
}> = ({ profile, activeCurrency, isDark, onUpgradeClick }) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [vipTiers, setVipTiers] = useState<VipTierConfig[]>(() => getVipTiersCatalog());

  useEffect(() => {
    const handleCatalogUpdate = () => {
      setVipTiers(getVipTiersCatalog());
    };
    window.addEventListener('zentro-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('zentro-catalog-updated', handleCatalogUpdate);
  }, []);

  const posterDataUri = buildVipComparisonFullPosterSvgUri(activeCurrency, vipTiers);


  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl border space-y-4 ${
        isDark
          ? 'bg-gradient-to-b from-[#131b2e] to-[#0e1424] border-pink-500/40 shadow-xl'
          : 'bg-white border-pink-200 shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-sky-500/15 via-pink-500/15 to-rose-500/15 border border-pink-500/35 text-[10px] font-mono font-extrabold text-pink-400">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {tr(
                profile,
                'FULL VIP TIER & COMMISSION COMPARISON IMAGE',
                'VIP මට්ටමෙන් මට්ටමට කොමිස් ප්‍රතිශත වෙනස් වන සම්පූර්ණ සටහන (FULL IMAGE)'
              )}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold font-display">
            {tr(
              profile,
              'How Commissions & Rewards Increase Across VIP Tiers (Bronze → Platinum)',
              'VIP එකෙන් VIP එකට (Bronze, Silver, Gold, Platinum) කොමිස් වෙනස් වන ආකාරය'
            )}
          </h3>
          <p className="text-xs text-slate-400">
            {tr(
              profile,
              'Full visual comparison image of L1–L5 deposit commissions, registration bonuses, and team task rewards across all 4 VIP packages.',
              'සියලුම VIP පැකේජ 4 හි L1 සිට L5 දක්වා කොමිස් ප්‍රතිශත සහ ප්‍රතිලාභ වෙනස් වන ආකාරය පහත සම්පූර්ණ රූපයෙන් (Full Image) බලාගන්න.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{tr(profile, 'View Full Screen Image', 'විශාල කර බලන්න')}</span>
          </button>
          <a
            href={posterDataUri}
            download={`Zentro-VIP-Commission-Comparison-${activeCurrency}.svg`}
            className="px-3.5 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{tr(profile, 'Save Chart', 'Save කරගන්න')}</span>
          </a>
        </div>
      </div>

      {/* Full Width Comparison Image */}
      <div
        onClick={() => setIsZoomOpen(true)}
        className="relative group rounded-2xl overflow-hidden border-2 border-pink-500/35 shadow-2xl cursor-zoom-in bg-[#090d1a]"
      >
        <img
          src={posterDataUri}
          alt="Zentro VIP Tier and Commission Comparison Full Chart"
          className="w-full h-auto block select-none"
        />
        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold text-white flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{tr(profile, 'Tap image to zoom full screen', 'රූපය මත Tap කර විශාල කර බලන්න')}</span>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="text-xs text-slate-400">
          {tr(
            profile,
            'Higher VIP tiers automatically unlock higher L1–L5 deposit commissions on every team member deposit.',
            'ඔබගේ VIP මට්ටම ඉහළ යන විට L1 සිට L5 දක්වා ලැබෙන කොමිස් ප්‍රතිශත ස්වයංක්‍රීයව වැඩි වේ (20% → 34% → 44% → 61%).'
          )}
        </div>
        <button
          type="button"
          onClick={onUpgradeClick}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-pink-500 to-rose-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
        >
          <Crown className="w-4 h-4" />
          <span>
            {tr(profile, 'Upgrade VIP Tier for Higher Commissions', 'වැඩි කොමිස් සඳහා VIP Upgrade කරන්න')}
          </span>
        </button>
      </div>

      {/* Full-Screen Lightbox Modal when user clicks the image */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-6xl w-full max-h-[92vh] overflow-auto rounded-3xl border border-pink-500/40 bg-[#090d1a] p-2 sm:p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 pb-3 px-2">
              <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>
                  {tr(
                    profile,
                    'Zentro VIP Tier & 5-Level Commission Comparison (Full Image)',
                    'VIP මට්ටමෙන් මට්ටමට කොමිස් වෙනස් වන සම්පූර්ණ රූප සටහන'
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={posterDataUri}
              alt="Zentro VIP Tier and Commission Comparison Full Chart"
              className="w-full h-auto rounded-2xl border border-white/15"
            />
          </div>
        </div>
      )}
    </div>
  );
};
