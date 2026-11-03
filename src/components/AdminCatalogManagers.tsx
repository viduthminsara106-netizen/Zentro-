import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Crown,
  CheckCircle2,
  Lock,
  Sparkles,
  Save,
  X,
  ListChecks,
  ShieldCheck,
  Flame,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import {
  SponsorCountryItem,
  VipTierConfig,
  ZentroPlatformTask,
  VipDayChallengeConfig,
  VIP_TIER_IMAGES,
  buildDefaultCountryFlagSvgUri,
  getSponsorCountriesCatalog,
  saveSponsorCountriesCatalog,
  resetSponsorCountriesCatalogToDefault,
  getVipTiersCatalog,
  saveVipTiersCatalog,
  resetVipTiersCatalogToDefault,
  getPlatformTasksCatalog,
  savePlatformTasksCatalog,
  resetPlatformTasksCatalogToDefault,
  getVipDayChallengesCatalog,
  saveVipDayChallengesCatalog,
  resetVipDayChallengesCatalogToDefault,
  formatCurrencyValue,
} from '../types';

interface ManagerProps {
  isDark: boolean;
  onNotice: (msg: string) => void;
}

/* ============================================================================
 * 1. ADMIN SPONSOR COUNTRIES & MEMBERS MANAGER
 *    Admin can Add, Edit, Delete Sponsor Countries and Edit Registered Members
 * ============================================================================ */
export const AdminSponsorCountriesManager: React.FC<ManagerProps> = ({
  isDark,
  onNotice,
}) => {
  const [countries, setCountries] = useState<SponsorCountryItem[]>(() =>
    getSponsorCountriesCatalog()
  );
  const [memberDrafts, setMemberDrafts] = useState<Record<string, string>>({});
  const [editingCountry, setEditingCountry] = useState<SponsorCountryItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states for Add / Edit modal
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameSi, setFormNameSi] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formMembers, setFormMembers] = useState('50000');
  const [formGrowth, setFormGrowth] = useState('+15.0%');
  const [formRoleEn, setFormRoleEn] = useState('Official Global Sponsor Partner');
  const [formRoleSi, setFormRoleSi] = useState('නිල ජාත්‍යන්තර අනුග්‍රාහක ජාලය');
  const [formFlagUri, setFormFlagUri] = useState('');

  useEffect(() => {
    const sync = () => setCountries(getSponsorCountriesCatalog());
    window.addEventListener('zentro-catalog-updated', sync);
    return () => window.removeEventListener('zentro-catalog-updated', sync);
  }, []);

  const openAddModal = () => {
    setEditingCountry(null);
    setFormNameEn('');
    setFormNameSi('');
    setFormCode('');
    setFormMembers('85000');
    setFormGrowth('+14.5%');
    setFormRoleEn('Official Global Sponsor Partner');
    setFormRoleSi('නිල ජාත්‍යන්තර අනුග්‍රාහක ජාලය');
    setFormFlagUri('');
    setIsAddingNew(true);
  };

  const openEditModal = (country: SponsorCountryItem) => {
    setIsAddingNew(false);
    setEditingCountry(country);
    setFormNameEn(country.nameEn);
    setFormNameSi(country.nameSi);
    setFormCode(country.code);
    setFormMembers(String(country.registeredUsers));
    setFormGrowth(country.growthRate);
    setFormRoleEn(country.hubRoleEn);
    setFormRoleSi(country.hubRoleSi);
    setFormFlagUri(country.flagSvgUri);
  };

  const closeModal = () => {
    setEditingCountry(null);
    setIsAddingNew(false);
  };

  const handleSaveCountryModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNameEn = formNameEn.trim();
    const cleanCode = formCode.trim().toUpperCase() || cleanNameEn.slice(0, 2).toUpperCase();
    if (!cleanNameEn || !cleanCode) {
      onNotice('Please enter Country Name and Country Code.');
      return;
    }
    const membersCount = Math.max(0, Math.round(Number(formMembers) || 0));
    const finalFlag =
      formFlagUri.trim() || buildDefaultCountryFlagSvgUri(cleanCode, cleanNameEn);

    if (isAddingNew) {
      const newItem: SponsorCountryItem = {
        id: `country_${cleanCode.toLowerCase()}_${Date.now()}`,
        nameEn: cleanNameEn,
        nameSi: formNameSi.trim() || cleanNameEn,
        code: cleanCode,
        registeredUsers: membersCount,
        growthRate: formGrowth.trim() || '+12.0%',
        hubRoleEn: formRoleEn.trim() || 'Official Sponsor Country',
        hubRoleSi: formRoleSi.trim() || 'නිල අනුග්‍රාහක රට',
        flagSvgUri: finalFlag,
      };
      const next = [...countries, newItem];
      setCountries(saveSponsorCountriesCatalog(next));
      onNotice(
        `Added Sponsor Country "${cleanNameEn}" (${membersCount.toLocaleString()} members).`
      );
    } else if (editingCountry) {
      const next = countries.map((c) =>
        c.id === editingCountry.id
          ? {
              ...c,
              nameEn: cleanNameEn,
              nameSi: formNameSi.trim() || cleanNameEn,
              code: cleanCode,
              registeredUsers: membersCount,
              growthRate: formGrowth.trim() || '+12.0%',
              hubRoleEn: formRoleEn.trim() || c.hubRoleEn,
              hubRoleSi: formRoleSi.trim() || c.hubRoleSi,
              flagSvgUri: finalFlag,
            }
          : c
      );
      setCountries(saveSponsorCountriesCatalog(next));
      onNotice(
        `Updated Sponsor Country "${cleanNameEn}" (${membersCount.toLocaleString()} members).`
      );
    }
    closeModal();
  };

  const handleQuickSaveMembers = (country: SponsorCountryItem, customValue?: number) => {
    const rawVal =
      typeof customValue === 'number'
        ? customValue
        : Number(memberDrafts[country.id] ?? country.registeredUsers);
    const nextMembers = Math.max(0, Math.round(Number.isFinite(rawVal) ? rawVal : 0));
    const next = countries.map((c) =>
      c.id === country.id ? { ...c, registeredUsers: nextMembers } : c
    );
    setCountries(saveSponsorCountriesCatalog(next));
    setMemberDrafts((prev) => ({ ...prev, [country.id]: String(nextMembers) }));
    onNotice(
      `Updated ${country.nameEn} registered members to ${nextMembers.toLocaleString()}.`
    );
  };

  const handleDeleteCountry = (country: SponsorCountryItem) => {
    const next = countries.filter((c) => c.id !== country.id);
    setCountries(saveSponsorCountriesCatalog(next));
    onNotice(`Deleted Sponsor Country "${country.nameEn}".`);
  };

  const handleResetCountries = () => {
    const fresh = resetSponsorCountriesCatalogToDefault();
    setCountries(fresh);
    setMemberDrafts({});
    onNotice('Reset Sponsor Countries & Member Counts to default 8 countries.');
  };

  const totalMembers = countries.reduce(
    (sum, c) => sum + (Number(c.registeredUsers) || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#121c33] via-[#16223d] to-[#1f1435] border-pink-500/35'
            : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/35 text-pink-400 text-[11px] font-mono font-extrabold">
            <Globe className="w-3.5 h-3.5" />
            <span>SPONSOR COUNTRIES &amp; REGISTERED MEMBERS CONTROL</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold font-display">
            Manage Sponsor Countries &amp; Edit Member Counts ({countries.length} Countries ·{' '}
            {totalMembers.toLocaleString()} Total Members)
          </h2>
          <p className="text-xs text-slate-400">
            Add new sponsor countries, edit country names/flags, delete countries, or directly
            edit registered member counts shown on the Home tab marquee.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sponsor Country</span>
          </button>

          <button
            type="button"
            onClick={handleResetCountries}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#16223d] border-white/15 hover:border-amber-400 text-amber-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default (8)</span>
          </button>
        </div>
      </div>

      {/* Countries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {countries.map((country) => {
          const currentDraft =
            memberDrafts[country.id] !== undefined
              ? memberDrafts[country.id]
              : String(country.registeredUsers);

          return (
            <div
              key={country.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3.5 transition-all ${
                isDark
                  ? 'bg-[#121c33]/95 border-white/10 hover:border-pink-500/45'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              {/* Top Country Info */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={country.flagSvgUri}
                      alt={country.nameEn}
                      className="w-12 h-8 rounded-lg object-cover border border-white/20 shadow-sm"
                    />
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-slate-950 text-[9px] font-mono font-extrabold text-sky-300 border border-white/15">
                      {country.code}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold font-display text-sm truncate">
                        {country.nameEn}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                        {country.growthRate}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{country.nameSi}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(country)}
                    className="p-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 cursor-pointer"
                    title="Edit Country"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCountry(country)}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
                    title="Delete Country"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Direct Registered Members Editor */}
              <div
                className={`p-3 rounded-xl border space-y-2 ${
                  isDark
                    ? 'bg-[#16223d]/90 border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-pink-400" />
                    <span>Registered Members</span>
                  </span>
                  <span className="font-mono font-extrabold text-pink-400">
                    {country.registeredUsers.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={currentDraft}
                    onChange={(e) =>
                      setMemberDrafts((prev) => ({
                        ...prev,
                        [country.id]: e.target.value,
                      }))
                    }
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-extrabold ${
                      isDark
                        ? 'bg-[#0e1629] border-white/15 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickSaveMembers(country)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>

                {/* Quick Step Buttons (+100, +1K, -1K) */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSaveMembers(
                        country,
                        Math.max(0, country.registeredUsers - 1000)
                      )
                    }
                    className="flex-1 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    -1,000
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSaveMembers(country, country.registeredUsers + 100)
                    }
                    className="flex-1 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSaveMembers(country, country.registeredUsers + 1000)
                    }
                    className="flex-1 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    +1,000
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Country Modal */}
      {(isAddingNew || editingCountry) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            className={`max-w-lg w-full rounded-3xl border p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ${
              isDark
                ? 'bg-[#10182d] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-extrabold font-display">
                  {isAddingNew
                    ? 'Add New Sponsor Country'
                    : `Edit Sponsor Country: ${editingCountry?.nameEn}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCountryModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Country Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. UAE / Canada / Japan"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ISO Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AE"
                    className={`w-full px-3 py-2 rounded-xl border font-mono uppercase ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Country Name in Sinhala (Optional)
                </label>
                <input
                  type="text"
                  value={formNameSi}
                  onChange={(e) => setFormNameSi(e.target.value)}
                  placeholder="e.g. එක්සත් අරාබි එමීර් රාජ්‍යය (UAE)"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Registered Members Count *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formMembers}
                    onChange={(e) => setFormMembers(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-extrabold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Growth Badge (e.g. +16.4%)</label>
                  <input
                    type="text"
                    value={formGrowth}
                    onChange={(e) => setFormGrowth(e.target.value)}
                    placeholder="+16.4%"
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Custom Flag Image URL / Data URI (Leave blank for auto-generated flag)
                </label>
                <input
                  type="text"
                  value={formFlagUri}
                  onChange={(e) => setFormFlagUri(e.target.value)}
                  placeholder="https://flagcdn.com/w160/ae.png or leave blank"
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-[11px] ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-500 text-white text-xs font-extrabold cursor-pointer shadow-md"
                >
                  {isAddingNew ? 'Add Sponsor Country' : 'Save Country Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2. ADMIN VIP PACKAGES MANAGER
 *    Admin can Add, Edit, Delete VIP Tiers
 * ============================================================================ */
export const AdminVipPackagesManager: React.FC<ManagerProps> = ({ isDark, onNotice }) => {
  const [vipTiers, setVipTiers] = useState<VipTierConfig[]>(() => getVipTiersCatalog());
  const [editingVip, setEditingVip] = useState<VipTierConfig | null>(null);
  const [isAddingVip, setIsAddingVip] = useState(false);

  // Form states
  const [levelInput, setLevelInput] = useState('5');
  const [nameInput, setNameInput] = useState('');
  const [audienceInput, setAudienceInput] = useState(
    'Share your Link and Promote our platform'
  );
  const [unlockInput, setUnlockInput] = useState('15000');
  const [miningRateInput, setMiningRateInput] = useState('15');
  const [dailyTasksInput, setDailyTasksInput] = useState('20');
  const [rewardPerTaskInput, setRewardPerTaskInput] = useState('120');
  const [regBonusInput, setRegBonusInput] = useState('150');
  const [teamTaskRewardInput, setTeamTaskRewardInput] = useState('8000');
  const [l1Rate, setL1Rate] = useState('28');
  const [l2Rate, setL2Rate] = useState('18');
  const [l3Rate, setL3Rate] = useState('12');
  const [l4Rate, setL4Rate] = useState('6');
  const [l5Rate, setL5Rate] = useState('4');
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    const sync = () => setVipTiers(getVipTiersCatalog());
    window.addEventListener('zentro-catalog-updated', sync);
    return () => window.removeEventListener('zentro-catalog-updated', sync);
  }, []);

  const openAddVipModal = () => {
    const maxLvl = vipTiers.reduce((m, v) => Math.max(m, v.level), 0);
    const nextLvl = maxLvl + 1;
    setEditingVip(null);
    setIsAddingVip(true);
    setLevelInput(String(nextLvl));
    setNameInput(`Zentro Diamond VIP ${nextLvl}`);
    setAudienceInput('Share your Link and Promote our platform');
    setUnlockInput('15000');
    setMiningRateInput('15');
    setDailyTasksInput('20');
    setRewardPerTaskInput('125');
    setRegBonusInput('150');
    setTeamTaskRewardInput('7500');
    setL1Rate('28');
    setL2Rate('18');
    setL3Rate('12');
    setL4Rate('6');
    setL5Rate('4');
    setImageUrlInput(VIP_TIER_IMAGES[4] || VIP_TIER_IMAGES[1]);
  };

  const openEditVipModal = (tier: VipTierConfig) => {
    setIsAddingVip(false);
    setEditingVip(tier);
    setLevelInput(String(tier.level));
    setNameInput(tier.name);
    setAudienceInput(tier.audience);
    setUnlockInput(String(tier.unlockAmount));
    setMiningRateInput(String(tier.dailyMiningRatePercent));
    setDailyTasksInput(String(tier.dailyTasks));
    setRewardPerTaskInput(String(tier.rewardPerTask));
    setRegBonusInput(String(tier.registrationBonusPerFriend));
    setTeamTaskRewardInput(String(tier.teamTaskReward));

    const getRate = (lvl: number, fallback: number) =>
      tier.commissionLevels?.find((c) => c.level === lvl)?.ratePercent ?? fallback;
    setL1Rate(String(getRate(1, 10)));
    setL2Rate(String(getRate(2, 6)));
    setL3Rate(String(getRate(3, 2)));
    setL4Rate(String(getRate(4, 1)));
    setL5Rate(String(getRate(5, 1)));
    setImageUrlInput(tier.imageUrl);
  };

  const closeVipModal = () => {
    setEditingVip(null);
    setIsAddingVip(false);
  };

  const handleSaveVip = (e: React.FormEvent) => {
    e.preventDefault();
    const lvl = Math.max(0, Math.round(Number(levelInput) || 0));
    const cleanName = nameInput.trim() || `Zentro VIP ${lvl}`;
    const unlockAmount = Math.max(0, Number(unlockInput) || 0);
    const miningPct = Math.max(0, Number(miningRateInput) || 0);
    const dailyTasks = Math.max(1, Math.round(Number(dailyTasksInput) || 1));
    const rewardPerTask = Math.max(0, Number(rewardPerTaskInput) || 0);
    const dailyYield = Number((dailyTasks * rewardPerTask).toFixed(2));
    const annualReturn = Number((dailyYield * 365).toFixed(2));
    const regBonus = Math.max(0, Number(regBonusInput) || 0);
    const teamReward = Math.max(0, Number(teamTaskRewardInput) || 0);

    const r1 = Math.max(0, Number(l1Rate) || 0);
    const r2 = Math.max(0, Number(l2Rate) || 0);
    const r3 = Math.max(0, Number(l3Rate) || 0);
    const r4 = Math.max(0, Number(l4Rate) || 0);
    const r5 = Math.max(0, Number(l5Rate) || 0);

    const commissionLevels = [
      { level: 1, label: 'Level 1', ratePercent: r1, rate: Number((r1 / 100).toFixed(4)) },
      { level: 2, label: 'Level 2', ratePercent: r2, rate: Number((r2 / 100).toFixed(4)) },
      { level: 3, label: 'Level 3', ratePercent: r3, rate: Number((r3 / 100).toFixed(4)) },
      { level: 4, label: 'Level 4', ratePercent: r4, rate: Number((r4 / 100).toFixed(4)) },
      { level: 5, label: 'Level 5', ratePercent: r5, rate: Number((r5 / 100).toFixed(4)) },
    ];

    const commissionRates =
      lvl === 0
        ? 'Referral Locked (VIP Required)'
        : `L1: ${r1}% · L2: ${r2}% · L3: ${r3}% · L4: ${r4}% · L5: ${r5}%`;

    const teamTaskLabel =
      lvl === 0
        ? 'Upgrade to VIP to unlock team tasks'
        : `Build 5 deposit members team - ${teamReward.toLocaleString()} LKR`;

    const benefits =
      lvl === 0
        ? [
            'Selected Currency Live Mining Locked (Activate VIP)',
            'Referral Link Locked (Activate VIP 1 or higher)',
            'Basic platform access',
          ]
        : [
            `Selected Currency Live Mining: Daily ${miningPct}%`,
            audienceInput.trim() || 'Share your Link and Promote our platform',
            `Registration only members: 1 Friend registration = ${regBonus} LKR`,
            `Task: Build 5 deposit members team = ${teamReward.toLocaleString()} LKR`,
            `Deposit Referral Commission: L1 ${r1}% · L2 ${r2}% · L3 ${r3}% · L4 ${r4}% · L5 ${r5}%`,
          ];

    const builtTier: VipTierConfig = {
      level: lvl,
      name: cleanName,
      audience: audienceInput.trim() || 'Share your Link and Promote our platform',
      imageUrl:
        imageUrlInput.trim() ||
        VIP_TIER_IMAGES[lvl] ||
        VIP_TIER_IMAGES[4] ||
        VIP_TIER_IMAGES[1],
      unlockAmount,
      dailyMiningRatePercent: miningPct,
      dailyMiningRate: Number((miningPct / 100).toFixed(4)),
      dailyTasks,
      rewardPerTask,
      dailyYield,
      annualReturn,
      registrationBonusPerFriend: regBonus,
      teamTaskLabel,
      teamTaskReward: teamReward,
      commissionRates,
      commissionLevels,
      benefits,
    };

    if (isAddingVip) {
      const exists = vipTiers.some((v) => v.level === lvl);
      const next = exists
        ? vipTiers.map((v) => (v.level === lvl ? builtTier : v))
        : [...vipTiers, builtTier];
      setVipTiers(saveVipTiersCatalog(next));
      onNotice(`Saved VIP Package "${cleanName}" (VIP ${lvl}).`);
    } else if (editingVip) {
      const filtered = vipTiers.filter((v) => v.level !== editingVip.level && v.level !== lvl);
      const next = [...filtered, builtTier];
      setVipTiers(saveVipTiersCatalog(next));
      onNotice(`Updated VIP Package "${cleanName}" (VIP ${lvl}).`);
    }
    closeVipModal();
  };

  const handleDeleteVip = (tier: VipTierConfig) => {
    if (tier.level === 0) {
      onNotice('Starter Member (VIP 0) is the base non-VIP tier and can be edited but not deleted.');
      return;
    }
    const next = vipTiers.filter((v) => v.level !== tier.level);
    setVipTiers(saveVipTiersCatalog(next));
    onNotice(`Deleted VIP Package "${tier.name}" (VIP ${tier.level}).`);
  };

  const handleResetVips = () => {
    setVipTiers(resetVipTiersCatalogToDefault());
    onNotice('Reset all VIP Packages to default Zentro Bronze, Silver, Gold, and Platinum.');
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#121c33] via-[#16223d] to-[#1f1435] border-pink-500/35'
            : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 text-[11px] font-mono font-extrabold">
            <Crown className="w-3.5 h-3.5" />
            <span>VIP PACKAGES &amp; COMMISSION RATES MANAGER</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold font-display">
            Add, Edit, or Delete VIP Tiers ({vipTiers.length} Tiers Active)
          </h2>
          <p className="text-xs text-slate-400">
            Configure unlock prices, daily mining percentages, daily tasks, task rewards, friend
            registration bonuses, and L1–L5 deposit referral commissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={openAddVipModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New VIP Tier</span>
          </button>

          <button
            type="button"
            onClick={handleResetVips}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#16223d] border-white/15 hover:border-amber-400 text-amber-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default VIPs</span>
          </button>
        </div>
      </div>

      {/* VIP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vipTiers.map((tier) => (
          <div
            key={tier.level}
            className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 ${
              isDark
                ? 'bg-[#121c33]/95 border-white/10 hover:border-pink-500/45'
                : 'bg-white border-pink-200 shadow-sm'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={tier.imageUrl}
                    alt={tier.name}
                    className="w-16 h-11 rounded-xl object-cover border border-white/15 shrink-0"
                  />
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[10px] font-mono font-extrabold">
                      VIP LEVEL {tier.level}
                    </span>
                    <h3 className="text-base font-extrabold font-display mt-0.5">
                      {tier.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditVipModal(tier)}
                    className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 cursor-pointer"
                    title="Edit VIP Tier"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {tier.level > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteVip(tier)}
                      className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
                      title="Delete VIP Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#16223d] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">Unlock Deposit</div>
                  <div className="font-extrabold text-amber-400">
                    {tier.unlockAmount.toLocaleString()} LKR
                  </div>
                </div>
                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#16223d] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">Daily Live Mining</div>
                  <div className="font-extrabold text-emerald-400">
                    {tier.dailyMiningRatePercent}% / Day
                  </div>
                </div>
                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#16223d] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">Daily Tasks</div>
                  <div className="font-extrabold text-sky-400">
                    {tier.dailyTasks} × {tier.rewardPerTask} LKR ({tier.dailyYield} LKR)
                  </div>
                </div>
                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#16223d] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">1 Friend Reg / 5-Team</div>
                  <div className="font-extrabold text-pink-400">
                    +{tier.registrationBonusPerFriend} / +{tier.teamTaskReward} LKR
                  </div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border text-[11px] font-mono ${
                  isDark ? 'bg-[#0e1629] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-pink-400 font-bold">Commissions: </span>
                {tier.commissionRates}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openEditVipModal(tier)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500/20 to-pink-500/20 hover:from-sky-500/30 hover:to-pink-500/30 border border-pink-500/35 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-pink-400" />
              <span>Edit {tier.name} Package</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add / Edit VIP Modal */}
      {(isAddingVip || editingVip) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            className={`max-w-2xl w-full rounded-3xl border p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto ${
              isDark
                ? 'bg-[#10182d] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold font-display">
                  {isAddingVip
                    ? 'Add New VIP Tier Package'
                    : `Edit VIP Package: ${editingVip?.name} (VIP ${editingVip?.level})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeVipModal}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVip} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">VIP Level Number *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={20}
                    value={levelInput}
                    onChange={(e) => setLevelInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-extrabold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">VIP Package Name *</label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Zentro Bronze / Zentro Diamond"
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold mb-1">Unlock Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={unlockInput}
                    onChange={(e) => setUnlockInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Daily Mining (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    value={miningRateInput}
                    onChange={(e) => setMiningRateInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Daily Tasks Count *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={dailyTasksInput}
                    onChange={(e) => setDailyTasksInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Reward / Task (LKR) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    min={0}
                    value={rewardPerTaskInput}
                    onChange={(e) => setRewardPerTaskInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    1 Friend Registration Bonus (LKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={regBonusInput}
                    onChange={(e) => setRegBonusInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    5-Deposit Members Team Task Bonus (LKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={teamTaskRewardInput}
                    onChange={(e) => setTeamTaskRewardInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* L1 - L5 Deposit Commission Percentages */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-[#16223d]/70 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-extrabold text-pink-400">
                  5-Level Deposit Referral Commission Percentages (L1 – L5)
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { lbl: 'L1 (%)', val: l1Rate, set: setL1Rate },
                    { lbl: 'L2 (%)', val: l2Rate, set: setL2Rate },
                    { lbl: 'L3 (%)', val: l3Rate, set: setL3Rate },
                    { lbl: 'L4 (%)', val: l4Rate, set: setL4Rate },
                    { lbl: 'L5 (%)', val: l5Rate, set: setL5Rate },
                  ].map((item) => (
                    <div key={item.lbl}>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">
                        {item.lbl}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={item.val}
                        onChange={(e) => item.set(e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold text-center ${
                          isDark
                            ? 'bg-[#0e1629] border-white/15 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Subtitle / Audience Note</label>
                <input
                  type="text"
                  value={audienceInput}
                  onChange={(e) => setAudienceInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeVipModal}
                  className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 text-white text-xs font-extrabold cursor-pointer shadow-md"
                >
                  {isAddingVip ? 'Create VIP Package' : 'Save VIP Package Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 3. ADMIN VIP TASKS MANAGER
 *    Admin can Add, Edit, Delete Tasks assigned to strict VIP tiers:
 *    - Bronze tasks (VIP 1) can ONLY be completed by Bronze users
 *    - Silver tasks (VIP 2) can ONLY be completed by Silver users
 *    - Gold tasks (VIP 3) can ONLY be completed by Gold users
 *    - Platinum tasks (VIP 4) can ONLY be completed by Platinum users
 * ============================================================================ */
export const AdminTasksManager: React.FC<ManagerProps> = ({ isDark, onNotice }) => {
  const [tasks, setTasks] = useState<ZentroPlatformTask[]>(() => getPlatformTasksCatalog());
  const [vipTiers, setVipTiers] = useState<VipTierConfig[]>(() => getVipTiersCatalog());
  const [vipFilter, setVipFilter] = useState<number | 'all'>('all');

  const [editingTask, setEditingTask] = useState<ZentroPlatformTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Task Modal Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskVipLevel, setTaskVipLevel] = useState<number>(1);
  const [taskCategory, setTaskCategory] = useState('Zentro Bronze (VIP 1)');
  const [taskReward, setTaskReward] = useState('25');
  const [taskDuration, setTaskDuration] = useState('2');
  const [taskType, setTaskType] = useState<'daily' | 'team_milestone'>('daily');
  const [taskTargetMembers, setTaskTargetMembers] = useState('5');
  const [taskDescription, setTaskDescription] = useState('');

  useEffect(() => {
    const sync = () => {
      setTasks(getPlatformTasksCatalog());
      setVipTiers(getVipTiersCatalog());
    };
    window.addEventListener('zentro-catalog-updated', sync);
    return () => window.removeEventListener('zentro-catalog-updated', sync);
  }, []);

  const getTierLabel = (lvl: number) => {
    const found = vipTiers.find((v) => v.level === lvl);
    if (found) return `${found.name} (VIP ${lvl})`;
    if (lvl === 1) return 'Zentro Bronze (VIP 1)';
    if (lvl === 2) return 'Zentro Silver (VIP 2)';
    if (lvl === 3) return 'Zentro Gold (VIP 3)';
    if (lvl === 4) return 'Zentro Platinum (VIP 4)';
    return `Starter (VIP ${lvl})`;
  };

  const handleVipLevelSelectInModal = (lvl: number, type: 'daily' | 'team_milestone') => {
    setTaskVipLevel(lvl);
    const matchedTier = vipTiers.find((v) => v.level === lvl);
    if (type === 'team_milestone') {
      setTaskCategory(`${matchedTier?.name || `VIP ${lvl}`} Team Task`);
      if (matchedTier?.teamTaskReward) {
        setTaskReward(String(matchedTier.teamTaskReward));
      }
    } else {
      setTaskCategory(getTierLabel(lvl));
      if (matchedTier?.rewardPerTask) {
        setTaskReward(String(matchedTier.rewardPerTask));
      }
    }
  };

  const openAddTaskModal = (presetVipLevel?: number) => {
    const defaultLvl =
      typeof presetVipLevel === 'number'
        ? presetVipLevel
        : vipFilter === 'all'
          ? 1
          : vipFilter;
    const matchedTier = vipTiers.find((v) => v.level === defaultLvl);
    setEditingTask(null);
    setIsAddingTask(true);
    setTaskVipLevel(defaultLvl);
    setTaskType('daily');
    setTaskCategory(getTierLabel(defaultLvl));
    setTaskReward(String(matchedTier?.rewardPerTask ?? 25));
    setTaskDuration('2');
    setTaskTargetMembers('5');
    setTaskTitle(`${matchedTier?.name || `VIP ${defaultLvl}`} Daily Order Verification`);
    setTaskDescription(
      `Exclusive ${matchedTier?.name || `VIP ${defaultLvl}`} task: Only ${matchedTier?.name || `VIP ${defaultLvl}`} members can complete and claim this reward.`
    );
  };

  const openEditTaskModal = (task: ZentroPlatformTask) => {
    setIsAddingTask(false);
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskVipLevel(task.minVipLevel);
    setTaskCategory(task.category);
    setTaskReward(String(task.reward));
    setTaskDuration(String(task.durationSec || 2));
    setTaskType(task.taskType === 'team_milestone' ? 'team_milestone' : 'daily');
    setTaskTargetMembers(String(task.targetDepositMembers || 5));
    setTaskDescription(task.description);
  };

  const closeTaskModal = () => {
    setEditingTask(null);
    setIsAddingTask(false);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = taskTitle.trim();
    if (!cleanTitle) {
      onNotice('Please enter a task title.');
      return;
    }
    const reward = Math.max(0, Number(taskReward) || 0);
    const durationSec = Math.max(1, Math.round(Number(taskDuration) || 2));
    const builtTask: ZentroPlatformTask = {
      id: editingTask ? editingTask.id : `task_vip${taskVipLevel}_${Date.now()}`,
      title: cleanTitle,
      category: taskCategory.trim() || getTierLabel(taskVipLevel),
      minVipLevel: taskVipLevel,
      reward,
      durationSec,
      taskType,
      ...(taskType === 'team_milestone'
        ? { targetDepositMembers: Math.max(1, Math.round(Number(taskTargetMembers) || 5)) }
        : {}),
      description:
        taskDescription.trim() ||
        `Exclusive ${getTierLabel(taskVipLevel)} task (${reward} LKR reward).`,
    };

    if (isAddingTask) {
      const next = [builtTask, ...tasks];
      setTasks(savePlatformTasksCatalog(next));
      onNotice(
        `Added new task "${cleanTitle}" for ${getTierLabel(taskVipLevel)} users only.`
      );
    } else if (editingTask) {
      const next = tasks.map((t) => (t.id === editingTask.id ? builtTask : t));
      setTasks(savePlatformTasksCatalog(next));
      onNotice(
        `Updated task "${cleanTitle}" (${getTierLabel(taskVipLevel)} users only).`
      );
    }
    closeTaskModal();
  };

  const handleDeleteTask = (task: ZentroPlatformTask) => {
    const next = tasks.filter((t) => t.id !== task.id);
    setTasks(savePlatformTasksCatalog(next));
    onNotice(`Deleted task "${task.title}".`);
  };

  const handleResetTasks = () => {
    setTasks(resetPlatformTasksCatalogToDefault());
    onNotice('Reset all VIP Tasks to default catalog.');
  };

  const filteredTasks =
    vipFilter === 'all' ? tasks : tasks.filter((t) => t.minVipLevel === vipFilter);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#121c33] via-[#16223d] to-[#1f1435] border-pink-500/35'
            : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-[11px] font-mono font-extrabold">
            <ListChecks className="w-3.5 h-3.5" />
            <span>VIP TIER-LOCKED TASK MANAGER ({tasks.length} Total Tasks)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold font-display">
            Add, Edit, or Delete VIP Tasks (Strict Tier-Matched Completion)
          </h2>
          <p className="text-xs text-slate-400">
            <strong className="text-pink-400">Strict VIP Rule Active:</strong> Bronze tasks (VIP
            1) can ONLY be completed by Bronze users · Silver tasks (VIP 2) ONLY by Silver users
            · Gold tasks (VIP 3) ONLY by Gold users · Platinum tasks (VIP 4) ONLY by Platinum
            users.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openAddTaskModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-sky-500 to-pink-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New VIP Task</span>
          </button>

          <button
            type="button"
            onClick={handleResetTasks}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#16223d] border-white/15 hover:border-amber-400 text-amber-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Tasks</span>
          </button>
        </div>
      </div>

      {/* Strict Tier Rule Cards & Quick Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setVipFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition-all ${
            vipFilter === 'all'
              ? 'bg-gradient-to-r from-sky-500 to-pink-500 text-white border-transparent shadow-md'
              : isDark
                ? 'bg-[#121c33] border-white/10 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          All VIP Tasks ({tasks.length})
        </button>

        {vipTiers.map((tier) => {
          const count = tasks.filter((t) => t.minVipLevel === tier.level).length;
          return (
            <button
              key={tier.level}
              type="button"
              onClick={() => setVipFilter(tier.level)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition-all flex items-center gap-1.5 ${
                vipFilter === tier.level
                  ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 text-white border-transparent shadow-md'
                  : isDark
                    ? 'bg-[#121c33] border-white/10 text-slate-300 hover:border-pink-500/40'
                    : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {tier.name} (VIP {tier.level}) Only ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredTasks.map((task) => {
          const tierObj = vipTiers.find((v) => v.level === task.minVipLevel);
          const tierName = tierObj?.name || `VIP ${task.minVipLevel}`;
          const isTeamTask =
            task.taskType === 'team_milestone' || Boolean(task.targetDepositMembers);

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                isDark
                  ? 'bg-[#121c33]/95 border-white/10 hover:border-pink-500/40'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>
                        ONLY {tierName.toUpperCase()} (VIP {task.minVipLevel}) USERS CAN COMPLETE
                      </span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        isTeamTask
                          ? 'bg-pink-500/20 text-pink-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {isTeamTask
                        ? `Team Milestone (${task.targetDepositMembers || 5} Deposit Members)`
                        : 'Daily VIP Task'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditTaskModal(task)}
                      className="p-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-extrabold font-display">{task.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono">
                <span className="text-slate-400">{task.category}</span>
                <span className="font-extrabold text-emerald-400">
                  Reward: +{task.reward.toLocaleString()} LKR
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Task Modal */}
      {(isAddingTask || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            className={`max-w-lg w-full rounded-3xl border p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ${
              isDark
                ? 'bg-[#10182d] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold font-display">
                  {isAddingTask ? 'Add New VIP Task' : `Edit VIP Task: ${editingTask?.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeTaskModal}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  Exclusive VIP Tier Required to Complete This Task *
                </label>
                <select
                  value={taskVipLevel}
                  onChange={(e) =>
                    handleVipLevelSelectInModal(Number(e.target.value), taskType)
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border font-extrabold ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {vipTiers.map((tier) => (
                    <option key={tier.level} value={tier.level}>
                      VIP {tier.level} — {tier.name} (Only {tier.name} users can complete)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-amber-400 font-mono mt-1">
                  ★ Only users whose active VIP level is VIP {taskVipLevel} (
                  {getTierLabel(taskVipLevel)}) can complete this task.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Task Type *</label>
                  <select
                    value={taskType}
                    onChange={(e) => {
                      const nextType = e.target.value as 'daily' | 'team_milestone';
                      setTaskType(nextType);
                      handleVipLevelSelectInModal(taskVipLevel, nextType);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="daily">Daily VIP Task</option>
                    <option value="team_milestone">Team Deposit Milestone Task</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Task Reward (LKR) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    min={0}
                    value={taskReward}
                    onChange={(e) => setTaskReward(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-extrabold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Zentro Bronze Merchant Order Verification #6"
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Category Badge</label>
                  <input
                    type="text"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                {taskType === 'team_milestone' ? (
                  <div>
                    <label className="block font-bold mb-1">Required Deposit Members</label>
                    <input
                      type="number"
                      min={1}
                      value={taskTargetMembers}
                      onChange={(e) => setTaskTargetMembers(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                        isDark
                          ? 'bg-[#16223d] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold mb-1">Verification Duration (Sec)</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                        isDark
                          ? 'bg-[#16223d] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1">Task Description</label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-sky-500 to-pink-500 text-white text-xs font-extrabold cursor-pointer shadow-md"
                >
                  {isAddingTask ? 'Add VIP Task' : 'Save Task Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 4. ADMIN VIP DAY CHALLENGES MANAGER (1.5x NET PROFIT BONUS)
 *    Admin can Add, Edit, Delete VIP Day Challenges
 * ============================================================================ */
export const AdminVipDayChallengesManager: React.FC<ManagerProps> = ({
  isDark,
  onNotice,
}) => {
  const [challenges, setChallenges] = useState<VipDayChallengeConfig[]>(() =>
    getVipDayChallengesCatalog()
  );
  const [editingChallenge, setEditingChallenge] = useState<VipDayChallengeConfig | null>(
    null
  );
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [vipLevel, setVipLevel] = useState<number>(1);
  const [durationDays, setDurationDays] = useState<string>('7');
  const [investmentAmount, setInvestmentAmount] = useState<string>('1000');
  const [multiplier, setMultiplier] = useState<string>('1.5');
  const [title, setTitle] = useState('');
  const [titleSi, setTitleSi] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeSi, setBadgeSi] = useState('');

  const vipTiers = [
    { level: 1, name: 'Zentro Bronze', nameSi: 'Zentro බ්‍රෝන්ස්', defaultDays: 7 },
    { level: 2, name: 'Zentro Silver', nameSi: 'Zentro සිල්වර්', defaultDays: 14 },
    { level: 3, name: 'Zentro Gold', nameSi: 'Zentro ගෝල්ඩ්', defaultDays: 14 },
    { level: 4, name: 'Zentro Platinum', nameSi: 'Zentro ප්ලැටිනම්', defaultDays: 14 },
  ];

  const openAddModal = (lvl = 1) => {
    const tier = vipTiers.find((t) => t.level === lvl) || vipTiers[0];
    const defaultDays = tier.defaultDays;
    const defaultInvest = lvl === 1 ? 1000 : lvl === 2 ? 3000 : lvl === 3 ? 6000 : 10000;
    setEditingChallenge(null);
    setIsAdding(true);
    setVipLevel(lvl);
    setDurationDays(String(defaultDays));
    setInvestmentAmount(String(defaultInvest));
    setMultiplier('1.5');
    setTitle(`${tier.name} ${defaultDays}-Day Challenge`);
    setTitleSi(`${tier.nameSi} දින ${defaultDays} අභියෝගය`);
    setBadge(`${defaultDays} DAYS · 1.5x NET PROFIT`);
    setBadgeSi(`දින ${defaultDays} · 1.5x ශුද්ධ ලාභය`);
  };

  const openEditModal = (c: VipDayChallengeConfig) => {
    setIsAdding(false);
    setEditingChallenge(c);
    setVipLevel(c.vipLevel);
    setDurationDays(String(c.durationDays));
    setInvestmentAmount(String(c.investmentAmountLkr));
    setMultiplier(String(c.netProfitMultiplier));
    setTitle(c.title);
    setTitleSi(c.titleSi);
    setBadge(c.badge);
    setBadgeSi(c.badgeSi);
  };

  const closeModal = () => {
    setEditingChallenge(null);
    setIsAdding(false);
  };

  const handleSaveChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      onNotice('Please enter a challenge title.');
      return;
    }
    const days = Math.max(1, Math.round(Number(durationDays) || 7));
    const invest = Math.max(100, Math.round(Number(investmentAmount) || 1000));
    const mult = Math.max(0.1, Number(multiplier) || 1.5);
    // If mult >= 1, mult represents total payout ratio (e.g. 1.5x = 1500 total return on 1000 invest)
    // If mult < 1, mult represents net profit ratio (e.g. 0.5 = 50% profit)
    const totalReturn = mult >= 1 ? Math.round(invest * mult) : Math.round(invest * (1 + mult));
    const netProfit = Math.max(0, totalReturn - invest);
    const matchedTier = vipTiers.find((t) => t.level === vipLevel) || vipTiers[0];

    const gradients: Record<number, string> = {
      1: 'from-amber-500 via-orange-600 to-amber-700',
      2: 'from-sky-500 via-blue-600 to-indigo-700',
      3: 'from-yellow-500 via-amber-500 to-rose-600',
      4: 'from-purple-600 via-pink-600 to-blue-600',
    };

    const built: VipDayChallengeConfig = {
      id: editingChallenge ? editingChallenge.id : `challenge_vip${vipLevel}_${Date.now()}`,
      vipLevel,
      vipName: matchedTier.name,
      vipNameSi: matchedTier.nameSi,
      durationDays: days,
      investmentAmountLkr: invest,
      netProfitMultiplier: mult,
      netProfitLkr: netProfit,
      totalReturnLkr: totalReturn,
      title: cleanTitle,
      titleSi: titleSi.trim() || `${matchedTier.nameSi} දින ${days} අභියෝගය`,
      badge: badge.trim() || `${days} DAYS · ${mult}x NET PROFIT`,
      badgeSi: badgeSi.trim() || `දින ${days} · ${mult}x ශුද්ධ ලාභය`,
      gradient: gradients[vipLevel] || gradients[1],
      borderClass:
        vipLevel === 1
          ? 'border-amber-400/50'
          : vipLevel === 2
            ? 'border-sky-400/50'
            : vipLevel === 3
              ? 'border-yellow-400/50'
              : 'border-purple-400/50',
      accentColor:
        vipLevel === 1
          ? 'text-amber-500'
          : vipLevel === 2
            ? 'text-sky-400'
            : vipLevel === 3
              ? 'text-yellow-400'
              : 'text-purple-400',
      tagColor:
        vipLevel === 1
          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
          : vipLevel === 2
            ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'
            : vipLevel === 3
              ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
              : 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
      imageUrl: VIP_TIER_IMAGES[vipLevel] || VIP_TIER_IMAGES[1],
    };

    if (isAdding) {
      const next = [...challenges, built];
      setChallenges(saveVipDayChallengesCatalog(next));
      onNotice(`Added Day Challenge "${cleanTitle}" (${days} days · ${mult}x net profit).`);
    } else if (editingChallenge) {
      const next = challenges.map((c) => (c.id === editingChallenge.id ? built : c));
      setChallenges(saveVipDayChallengesCatalog(next));
      onNotice(`Updated Day Challenge "${cleanTitle}".`);
    }
    closeModal();
  };

  const handleDelete = (item: VipDayChallengeConfig) => {
    const next = challenges.filter((c) => c.id !== item.id);
    setChallenges(saveVipDayChallengesCatalog(next));
    onNotice(`Deleted challenge "${item.title}".`);
  };

  const handleReset = () => {
    const def = resetVipDayChallengesCatalogToDefault();
    setChallenges(def);
    onNotice('Reset VIP Day Challenges to default configuration (1.5x Net Profit on All).');
  };

  // Preview calculations
  const parsedInvest = Math.max(0, Number(investmentAmount) || 0);
  const parsedMult = Math.max(0, Number(multiplier) || 1.5);
  const previewTotalReturn = parsedMult >= 1 ? Math.round(parsedInvest * parsedMult) : Math.round(parsedInvest * (1 + parsedMult));
  const previewNetProfit = Math.max(0, previewTotalReturn - parsedInvest);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#121c33] via-[#16223d] to-[#1f1435] border-pink-500/35'
            : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 text-[11px] font-mono font-extrabold">
            <Flame className="w-3.5 h-3.5" />
            <span>VIP DAY CHALLENGES MANAGER ({challenges.length} Challenges)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold font-display">
            Add, Edit, or Delete VIP Day Challenges (1.5x Net Profit)
          </h2>
          <p className="text-xs text-slate-400">
            Bronze is 7 days, other VIP packages (Silver, Gold, Platinum) are 14 days with uniform
            1.5x Net Profit multiplier. Higher VIP tier users can access their own and all lower tier challenges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openAddModal(1)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-rose-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Day Challenge</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#16223d] border-white/15 hover:border-amber-400 text-amber-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Challenges</span>
          </button>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((c) => {
          return (
            <div
              key={c.id}
              className={`p-4 rounded-3xl border flex flex-col justify-between gap-3 ${
                isDark
                  ? 'bg-[#121c33]/95 border-white/10 hover:border-pink-500/40'
                  : 'bg-white border-pink-200 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-extrabold flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>VIP {c.vipLevel} · {c.vipName}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[10px] font-mono font-extrabold">
                      {c.durationDays} DAYS DURATION
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-extrabold">
                      {c.netProfitMultiplier}x NET PROFIT
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sky-400 cursor-pointer"
                      title="Edit Challenge"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                      title="Delete Challenge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>{c.title}</span>
                  </h4>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">
                    {c.titleSi}
                  </div>
                </div>

                {/* Investment & Returns breakdown */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/20 font-mono text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">INVEST EXTRA</div>
                    <div className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                      {formatCurrencyValue(c.investmentAmountLkr, 'LKR')} LKR
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-pink-400">{c.netProfitMultiplier}x NET PROFIT</div>
                    <div className="text-xs sm:text-sm font-extrabold text-pink-400 mt-0.5">
                      +{formatCurrencyValue(c.netProfitLkr, 'LKR')} LKR
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400">TOTAL RETURN</div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-400 mt-0.5">
                      {formatCurrencyValue(c.totalReturnLkr, 'LKR')} LKR
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Badge: {c.badge}</span>
                <span className="text-amber-400">Duration: {c.durationDays} Days</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Challenge Modal */}
      {(isAdding || editingChallenge) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className={`max-w-lg w-full my-auto rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#101728] border-pink-500/40 text-white'
                : 'bg-white border-pink-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-extrabold font-display flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>
                  {isAdding ? 'Add New VIP Day Challenge' : `Edit Challenge — ${editingChallenge?.title}`}
                </span>
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChallenge} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">VIP Target Package</label>
                  <select
                    value={vipLevel}
                    onChange={(e) => {
                      const lvl = Number(e.target.value);
                      setVipLevel(lvl);
                      const tier = vipTiers.find((t) => t.level === lvl) || vipTiers[0];
                      setDurationDays(String(tier.defaultDays));
                      const defaultInvest = lvl === 1 ? 1000 : lvl === 2 ? 3000 : lvl === 3 ? 6000 : 10000;
                      setInvestmentAmount(String(defaultInvest));
                      setTitle(`${tier.name} ${tier.defaultDays}-Day Challenge`);
                      setTitleSi(`${tier.nameSi} දින ${tier.defaultDays} අභියෝගය`);
                      setBadge(`${tier.defaultDays} DAYS · 1.5x NET PROFIT`);
                      setBadgeSi(`දින ${tier.defaultDays} · 1.5x ශුද්ධ ලාභය`);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {vipTiers.map((t) => (
                      <option key={t.level} value={t.level} className="text-slate-950">
                        {t.name} (VIP {t.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Investment Amount (LKR)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    required
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Net Profit Multiplier (e.g. 1.5)</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    required
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Live Return Preview Card */}
              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-1 font-mono">
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Live Challenge Payout Preview:
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Investment Capital:</span>
                  <strong className="text-white">{parsedInvest.toLocaleString()} LKR</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-pink-400">
                  <span>{parsedMult}x Net Profit Bonus:</span>
                  <strong>+{previewNetProfit.toLocaleString()} LKR</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold border-t border-white/10 pt-1">
                  <span>Total Maturity Return (Capital + Profit):</span>
                  <strong>{previewTotalReturn.toLocaleString()} LKR</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Challenge Title (English)</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bronze 7-Day Challenge"
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Challenge Title (Sinhala)</label>
                <input
                  type="text"
                  value={titleSi}
                  onChange={(e) => setTitleSi(e.target.value)}
                  placeholder="e.g. බ්‍රෝන්ස් දින 7 අභියෝගය"
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    isDark
                      ? 'bg-[#16223d] border-white/15 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Badge Text (English)</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-[#16223d] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Badge Text (Sinhala)</label>
                  <input
                    type="text"
                    value={badgeSi}
                    onChange={(e) => setBadgeSi(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
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
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-rose-600 text-white text-xs font-extrabold cursor-pointer shadow-md"
                >
                  {isAdding ? 'Add Day Challenge' : 'Save Challenge Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

