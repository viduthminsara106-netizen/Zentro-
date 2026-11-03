import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  X,
  Copy,
  Check,
  Crown,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  UserPlus,
  ArrowRight,
  Filter,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import {
  UserProfile,
  ReferralRecordData,
  VIP_TIERS,
  getActiveCurrency,
  formatCurrencyValue,
  formatSiteAmount,
  getCommissionLevelsForVip,
  tr,
} from '../types';

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  isDark: boolean;
  referrals: ReferralRecordData[];
  onOpenVipTab?: () => void;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  isOpen,
  onClose,
  profile,
  isDark,
  referrals,
  onOpenVipTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'vip' | 'free'>('all');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const activeCurrency = getActiveCurrency(profile);
  const currentVip = VIP_TIERS.find((v) => v.level === profile.vipLevel) || VIP_TIERS[0];
  const commissionRates = getCommissionLevelsForVip(profile.vipLevel);

  // Summary Metrics
  const totalMembers = referrals.length;
  const directL1Members = referrals.filter((r) => r.tierLevel === 1).length;
  const indirectMembers = referrals.filter((r) => r.tierLevel > 1).length;
  const activeVipMembers = referrals.filter((r) => r.vipLevel > 0).length;
  const freeMembers = referrals.filter((r) => r.vipLevel === 0).length;
  const totalCommissionEarned = referrals.reduce(
    (sum, r) => sum + (Number(r.commissionEarned) || 0),
    0
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtered members list
  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.referredUsername.toLowerCase().includes(q) ||
        (r.referralCodeUsed && r.referralCodeUsed.toLowerCase().includes(q));

      // Level filter
      const matchesLevel = selectedLevel === 'all' || r.tierLevel === selectedLevel;

      // Status filter
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'vip'
            ? r.vipLevel > 0
            : r.vipLevel === 0;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [referrals, searchQuery, selectedLevel, statusFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div
        className={`max-w-4xl w-full my-auto rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
          isDark
            ? 'bg-[#101728] border-pink-500/40 text-white'
            : 'bg-white border-pink-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-[#141e33] border-white/10' : 'bg-slate-50 border-pink-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold font-display flex items-center gap-2">
                <span>{tr(profile, 'My Team Details', 'මගේ කණ්ඩායම් විස්තර')}</span>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-[10px] font-mono text-pink-500 dark:text-pink-400 font-bold">
                  {totalMembers} {tr(profile, 'Members', 'සාමාජිකයන්')}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tr(
                  profile,
                  '5-Level Downline Network & Commission Breakdown',
                  'මට්ටම් 5 කණ්ඩායම් ජාලය සහ කොමිස් විස්තර'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold cursor-pointer shadow-sm hover:opacity-95"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? tr(profile, 'Link Copied', 'පිටපත් විය') : tr(profile, 'Copy Referral Link', 'සබැඳිය පිටපත්')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Top Quick Referral Bar */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-gradient-to-r from-pink-950/30 via-[#15213b] to-sky-950/30 border-pink-500/30'
                : 'bg-gradient-to-r from-pink-50 via-slate-50 to-sky-50 border-pink-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {tr(profile, 'My Referral Code:', 'මගේ යොමු කිරීමේ කේතය:')}
              </span>
              <span className="px-3 py-1 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-600 dark:text-pink-400 font-mono font-extrabold text-sm tracking-wider">
                {profile.referralCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 dark:text-pink-400 cursor-pointer"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {tr(profile, 'Current VIP Tier:', 'වත්මන් VIP මට්ටම:')}{' '}
                <strong className="text-amber-500 dark:text-amber-400 font-extrabold">
                  {currentVip.name}
                </strong>
              </span>
              {profile.vipLevel < 4 && onOpenVipTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVipTab();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-amber-500/30"
                >
                  <Crown className="w-3 h-3" />
                  <span>{tr(profile, 'Upgrade VIP', 'VIP උසස් කරන්න')}</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-[#152038] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>{tr(profile, 'Total Team Members', 'මුළු සාමාජිකයන්')}</span>
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1 text-slate-900 dark:text-white">
                {totalMembers}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {directL1Members} Direct · {indirectMembers} Multi-Tier
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-[#152038] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>{tr(profile, 'Active VIP Members', 'සක්‍රිය VIP සාමාජිකයන්')}</span>
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1 text-amber-500 dark:text-amber-400">
                {activeVipMembers}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {freeMembers} {tr(profile, 'Registration Only', 'නොමිලේ ලියාපදිංචි')}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-[#152038] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-pink-500" />
                <span>{tr(profile, 'Total Commission Earned', 'මුළු කොමිස් ආදායම')}</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-pink-600 dark:text-pink-400 tabular-nums">
                +{formatCurrencyValue(totalCommissionEarned, activeCurrency)} {activeCurrency}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {tr(profile, 'Paid directly to wallet', 'ගිණුමට බැර කරන ලද')}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-[#152038] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{tr(profile, '5-Level Commission Pool', 'මට්ටම් 5 කොමිස් එකතුව')}</span>
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-500 dark:text-emerald-400">
                {commissionRates.reduce((sum, r) => sum + r.ratePercent, 0)}%
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {currentVip.name} {tr(profile, 'Active Pool', 'සක්‍රිය අනුපාතය')}
              </div>
            </div>
          </div>

          {/* 5-Tier Level Breakdown Cards (L1 through L5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-pink-500" />
                <span>{tr(profile, '5-Tier Level Breakdown (Click level to filter)', 'මට්ටම් 5 විස්තර (තෝරා filter කරන්න)')}</span>
              </span>
              {selectedLevel !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedLevel('all')}
                  className="text-pink-500 dark:text-pink-400 text-[11px] underline cursor-pointer"
                >
                  {tr(profile, 'Show All Levels', 'සියලු මට්ටම් පෙන්වන්න')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {commissionRates.map((lv) => {
                const count = referrals.filter((r) => r.tierLevel === lv.level).length;
                const earned = referrals
                  .filter((r) => r.tierLevel === lv.level)
                  .reduce((sum, r) => sum + (Number(r.commissionEarned) || 0), 0);
                const isSelected = selectedLevel === lv.level;

                const levelLabel =
                  lv.level === 1
                    ? tr(profile, 'Direct Invite (L1)', 'සෘජු මිතුරන් (L1)')
                    : lv.level === 2
                      ? tr(profile, '2nd Gen (L2)', '2 වන පෙළ (L2)')
                      : lv.level === 3
                        ? tr(profile, '3rd Gen (L3)', '3 වන පෙළ (L3)')
                        : lv.level === 4
                          ? tr(profile, '4th Gen (L4)', '4 වන පෙළ (L4)')
                          : tr(profile, '5th Gen (L5)', '5 වන පෙළ (L5)');

                return (
                  <button
                    key={lv.level}
                    type="button"
                    onClick={() => setSelectedLevel(isSelected ? 'all' : (lv.level as 1 | 2 | 3 | 4 | 5))}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500/15 ring-2 ring-pink-500/40'
                        : isDark
                          ? 'border-white/10 bg-[#152038] hover:border-pink-500/40'
                          : 'border-slate-200 bg-slate-50 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="px-2 py-0.5 rounded-lg bg-pink-500 text-white text-[10px] font-mono font-extrabold">
                        L{lv.level}
                      </span>
                      <span className="text-sm font-mono font-extrabold text-pink-600 dark:text-pink-400">
                        {lv.ratePercent}%
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                      {levelLabel}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 dark:text-slate-400">
                        {count} {tr(profile, 'Users', 'අය')}
                      </span>
                      <span className="font-extrabold text-emerald-500">
                        +{formatCurrencyValue(earned, activeCurrency)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Filter Control Bar */}
          <div
            className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 ${
              isDark ? 'bg-[#152038] border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr(
                  profile,
                  'Search member by username or code...',
                  'සාමාජික නම හෝ කේතයෙන් සොයන්න...'
                )}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none ${
                  isDark
                    ? 'bg-[#101728] border-white/15 text-white placeholder-slate-500 focus:border-pink-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-pink-500'
                }`}
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : isDark
                      ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tr(profile, 'All Members', 'සියල්ල')} ({referrals.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('vip')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'vip'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : isDark
                      ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tr(profile, 'VIP Only', 'VIP පමණි')} ({activeVipMembers})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('free')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'free'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : isDark
                      ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tr(profile, 'Registration', 'නොමිලේ')} ({freeMembers})
              </button>
            </div>
          </div>

          {/* Member List Table / Cards */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#121a2d] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b font-mono uppercase text-[10px] ${
                      isDark
                        ? 'bg-[#18233c] border-white/10 text-slate-400'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  >
                    <th className="py-3 px-3.5">
                      {tr(profile, 'Member Details', 'සාමාජික විස්තර')}
                    </th>
                    <th className="py-3 px-3.5">{tr(profile, 'Tier Level', 'මට්ටම')}</th>
                    <th className="py-3 px-3.5">
                      {tr(profile, 'VIP Package', 'VIP පැකේජය')}
                    </th>
                    <th className="py-3 px-3.5 text-right">
                      {tr(profile, 'Commission Earned', 'ලැබුණු කොමිස් මුදල')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center space-y-3">
                        <Users className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
                        <div className="text-xs text-slate-400">
                          {searchQuery || selectedLevel !== 'all' || statusFilter !== 'all'
                            ? tr(
                                profile,
                                'No team members match your active filters.',
                                'තෝරාගත් filter වලට අදාළ සාමාජිකයින් හමු නොවීය.'
                              )
                            : tr(
                                profile,
                                'You do not have any referred team members yet.',
                                'තවමත් යොමු කළ කණ්ඩායම් සාමාජිකයින් නොමැත.'
                              )}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-pink-500 to-rose-500 text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-95"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>{tr(profile, 'Invite Members Now', 'දැන් සාමාජිකයින්ට ආරාධනා කරන්න')}</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map((r) => {
                      const refVip = VIP_TIERS.find((v) => v.level === r.vipLevel);
                      const isVip = r.vipLevel > 0;
                      const levelBadgeClass =
                        r.tierLevel === 1
                          ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400 border-sky-500/40'
                          : r.tierLevel === 2
                            ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400 border-blue-500/40'
                            : r.tierLevel === 3
                              ? 'bg-pink-500/20 text-pink-500 dark:text-pink-400 border-pink-500/40'
                              : r.tierLevel === 4
                                ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border-rose-500/40';

                      return (
                        <tr
                          key={r.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Member info */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                  isVip
                                    ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {r.referredUsername.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{r.referredUsername}</span>
                                  {isVip && (
                                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  {r.createdAt
                                    ? new Date(r.createdAt).toLocaleDateString()
                                    : 'Active Member'}
                                  {r.referralCodeUsed && (
                                    <span> · Code: {r.referralCodeUsed}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Level badge */}
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg border font-mono font-extrabold text-[10px] ${levelBadgeClass}`}
                            >
                              LEVEL {r.tierLevel}
                            </span>
                          </td>

                          {/* VIP Package */}
                          <td className="py-3 px-3.5">
                            {isVip ? (
                              <div className="flex items-center gap-1.5 font-bold text-amber-500 dark:text-amber-400">
                                <Crown className="w-3.5 h-3.5" />
                                <span>{refVip?.name || `VIP ${r.vipLevel}`}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 font-mono">
                                {tr(profile, 'Registration Only', 'ලියාපදිංචි සාමාජික')}
                              </span>
                            )}
                          </td>

                          {/* Commission */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="font-mono font-extrabold text-sm text-emerald-500 dark:text-emerald-400 tabular-nums">
                              +{formatCurrencyValue(r.commissionEarned, activeCurrency)}{' '}
                              <span className="text-[10px]">{activeCurrency}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {r.vipLevel > 0
                                ? tr(profile, 'Deposit Bonus', 'තැන්පතු කොමිස්')
                                : tr(profile, 'Signup Bonus', 'ලියාපදිංචි දීමනාව')}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-3.5 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-[#141e33] border-white/10' : 'bg-slate-50 border-pink-100'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>
              {tr(
                profile,
                'Commissions are automatically credited to your balance in real time.',
                'කොමිස් මුදල් සජීවීව ඔබගේ ගිණුම් ශේෂයට බැර වේ.'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-pink-500 to-rose-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:opacity-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{copiedLink ? tr(profile, 'Link Copied ✓', 'පිටපත් විය ✓') : tr(profile, 'Share Invite Link', 'ආරාධනා සබැඳිය')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10"
            >
              {tr(profile, 'Close', 'වසන්න')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
