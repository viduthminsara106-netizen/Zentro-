import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Crown,
  FileImage,
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  User as UserIcon,
  Wallet,
  X,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import {
  COUNTRY_OPTIONS,
  DepositRequestRecord,
  OfficialSettlementBank,
  UsdtNetworkOption,
  UserProfile,
  VIP_TIERS,
  convertFromLkr,
  convertToLkr,
  formatCurrencyValue,
  formatSiteAmount,
  getActiveCurrency,
  getBanksForCountry,
  getLocalDepositRequests,
  getOfficialUsdtAddresses,
  saveLocalDepositRequest,
  tr,
} from '../types';

interface DepositAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  isDark: boolean;
  initialAmountInCurrency?: string;
  initialNotice?: string | null;
  onSubmitDepositRequest: (payload: {
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
  }) => Promise<void>;
}

type DepositStep = 'configure' | 'loading' | 'payment_and_slip' | 'submitted_waiting_admin';

export const DepositAreaModal: React.FC<DepositAreaModalProps> = ({
  isOpen,
  onClose,
  profile,
  isDark,
  initialAmountInCurrency,
  initialNotice,
  onSubmitDepositRequest,
}) => {
  const activeCurrency = getActiveCurrency(profile);
  const paidVipTiers = VIP_TIERS.filter((t) => t.level >= 1);

  // Step state
  const [step, setStep] = useState<DepositStep>('configure');

  // Step 1: Configure fields
  const [depositType, setDepositType] = useState<'bank' | 'usdt'>('bank');
  const [selectedCountry, setSelectedCountry] = useState<string>(
    profile.country && profile.country.trim() ? profile.country : 'Sri Lanka'
  );
  const [paymentMethodsRev, setPaymentMethodsRev] = useState<number>(0);
  const availableBanks: OfficialSettlementBank[] = getBanksForCountry(selectedCountry);
  const availableUsdtOptions: UsdtNetworkOption[] = getOfficialUsdtAddresses();
  const [selectedBankId, setSelectedBankId] = useState<string>(
    availableBanks[0]?.id || 'lk_boc'
  );
  const [selectedUsdtId, setSelectedUsdtId] = useState<string>(
    availableUsdtOptions[0]?.id || 'usdt_bep20'
  );

  const [selectedVipLevel, setSelectedVipLevel] = useState<number | null>(1);
  const [typedAmount, setTypedAmount] = useState<string>(
    initialAmountInCurrency || String(convertFromLkr(1000, activeCurrency))
  );
  const [depositorName, setDepositorName] = useState<string>(profile.username || '');

  // Step 3: Payment & Slip Upload fields
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [slipFileName, setSlipFileName] = useState<string>('');
  const [slipDataUrl, setSlipDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Step 4 & History: Submitted deposits waiting for admin approval
  const [submittedRecord, setSubmittedRecord] = useState<DepositRequestRecord | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<DepositRequestRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRecentDeposits(getLocalDepositRequests(profile.uid));
      setFormError(null);
      const defaultCountry =
        profile.country && profile.country.trim() ? profile.country : 'Sri Lanka';
      setSelectedCountry(defaultCountry);
      const banks = getBanksForCountry(defaultCountry);
      if (banks.length > 0) {
        setSelectedBankId(banks[0].id);
      }
      if (initialAmountInCurrency) {
        setTypedAmount(initialAmountInCurrency);
        const lkrVal = convertToLkr(Number(initialAmountInCurrency), activeCurrency);
        const matchingTier = paidVipTiers.find(
          (t) => Math.abs(t.unlockAmount - lkrVal) <= 25
        );
        setSelectedVipLevel(matchingTier ? matchingTier.level : null);
      } else {
        setSelectedVipLevel(1);
        setTypedAmount(String(convertFromLkr(1000, activeCurrency)));
      }
    }
  }, [isOpen, profile.uid, profile.country, initialAmountInCurrency, activeCurrency]);

  // Keep selectedBankId and selectedUsdtId valid when country or admin payment methods change
  useEffect(() => {
    const handlePaymentMethodsSync = () => {
      setPaymentMethodsRev((r) => r + 1);
    };
    window.addEventListener('zentro-payment-methods-updated', handlePaymentMethodsSync);
    window.addEventListener('storage', handlePaymentMethodsSync);
    return () => {
      window.removeEventListener('zentro-payment-methods-updated', handlePaymentMethodsSync);
      window.removeEventListener('storage', handlePaymentMethodsSync);
    };
  }, []);

  useEffect(() => {
    const banks = getBanksForCountry(selectedCountry);
    if (banks.length > 0 && !banks.some((b) => b.id === selectedBankId)) {
      setSelectedBankId(banks[0].id);
    }
    const usdts = getOfficialUsdtAddresses();
    if (usdts.length > 0 && !usdts.some((u) => u.id === selectedUsdtId)) {
      setSelectedUsdtId(usdts[0].id);
    }
  }, [selectedCountry, selectedBankId, selectedUsdtId, paymentMethodsRev]);

  if (!isOpen) return null;

  const activeBank =
    availableBanks.find((b) => b.id === selectedBankId) || availableBanks[0];
  const activeUsdt =
    availableUsdtOptions.find((u) => u.id === selectedUsdtId) || availableUsdtOptions[0];
  const activeVipObj =
    selectedVipLevel !== null
      ? paidVipTiers.find((t) => t.level === selectedVipLevel) || null
      : null;

  const numericAmount = Number(typedAmount) || 0;
  const amountInLkr = convertToLkr(numericAmount, activeCurrency);
  const amountInUsdt = convertFromLkr(amountInLkr, 'USDT');

  const handleSelectVipPackage = (level: number | null, unlockLkr?: number) => {
    setSelectedVipLevel(level);
    if (level !== null && unlockLkr !== undefined) {
      setTypedAmount(String(convertFromLkr(unlockLkr, activeCurrency)));
    }
    setFormError(null);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Step 1 -> Step 2 (Loading) -> Step 3 (Display Bank Account & Upload Slip)
  const handleConfirmDepositStep = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (Number.isNaN(numericAmount) || numericAmount <= 0 || amountInLkr < 50) {
      setFormError(
        tr(
          profile,
          `Please select a VIP package or type a valid deposit amount (minimum ${formatSiteAmount(100, activeCurrency)}).`,
          `කරුණාකර VIP පැකේජයක් තෝරන්න හෝ නිවැරදි තැන්පතු මුදලක් ඇතුළත් කරන්න (අවමය ${formatSiteAmount(100, activeCurrency)}).`
        )
      );
      return;
    }

    if (!depositorName.trim() || depositorName.trim().length < 2) {
      setFormError(
        tr(
          profile,
          'Please type your Depositor Name / Account Holder Name.',
          'කරුණාකර තැන්පත්කරුගේ නම ඇතුළත් කරන්න.'
        )
      );
      return;
    }

    const genRef = `ZNT-DEP-${Math.floor(100000 + Math.random() * 900000)}`;
    setReferenceCode(genRef);
    setStep('loading');

    setTimeout(() => {
      setStep('payment_and_slip');
    }, 950);
  };

  // Handle slip image selection & compression for smooth preview + persistence
  const handleSlipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);

    if (!file.type.startsWith('image/')) {
      setFormError(
        tr(
          profile,
          'Please upload a valid image file (PNG, JPG, WEBP) of your payment slip.',
          'කරුණාකර ඔබගේ ගෙවීම් රිසිට්පතේ (Payment Slip) පැහැදිලි ඡායාරූපයක් උඩුගත කරන්න.'
        )
      );
      return;
    }

    setSlipFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      // Compress image onto canvas if possible so localStorage stays lightweight
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 900;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setSlipDataUrl(compressed);
          } else {
            setSlipDataUrl(result);
          }
        } catch {
          setSlipDataUrl(result);
        }
      };
      img.onerror = () => {
        setSlipDataUrl(result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Step 3 -> Step 4 (Submit Deposit -> Wait Admin Approve)
  const handleFinalSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!slipDataUrl) {
      setFormError(
        tr(
          profile,
          'Please upload your payment receipt / bank transfer slip image before submitting.',
          'කරුණාකර තැන්පතුව ඉදිරිපත් කිරීමට පෙර බැංකු රිසිට්පතේ (Slip) ඡායාරූපය උඩුගත කරන්න.'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const selectedVipLabel = activeVipObj
        ? `${activeVipObj.name} (${formatSiteAmount(activeVipObj.unlockAmount, activeCurrency)})`
        : 'Custom Wallet Deposit';

      const selectedBankName =
        depositType === 'bank' ? activeBank.bankName : activeUsdt.networkName;
      const receivingAccountNumber =
        depositType === 'bank' ? activeBank.accountNumber : activeUsdt.walletAddress;
      const receivingAccountHolder =
        depositType === 'bank' ? activeBank.accountName : `Zentro ${activeUsdt.tokenStandard} Vault`;
      const receivingBranchOrNetwork =
        depositType === 'bank'
          ? `${activeBank.branchName} · SWIFT: ${activeBank.swiftCode}`
          : `${activeUsdt.networkName} (${activeUsdt.minConfirmations} Confirmations)`;

      const newRecord: DepositRequestRecord = {
        id: `dep_${Date.now()}`,
        referenceCode: referenceCode || `ZNT-DEP-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: profile.uid,
        username: profile.username,
        depositType,
        country: selectedCountry,
        selectedBankName,
        receivingAccountNumber,
        receivingAccountHolder,
        receivingBranchOrNetwork,
        selectedVipLabel,
        selectedVipLevel,
        amountInActiveCurrency: numericAmount,
        activeCurrency,
        amountInLkr,
        depositorName: depositorName.trim(),
        slipFileName: slipFileName || 'payment-slip.jpg',
        slipDataUrl,
        status: 'pending_admin',
        createdAt: new Date().toISOString(),
      };

      await onSubmitDepositRequest({
        amountInLkr,
        amountInCurrency: numericAmount,
        activeCurrency,
        depositType,
        country: selectedCountry,
        selectedBankName,
        receivingAccountNumber,
        receivingAccountHolder,
        receivingBranchOrNetwork,
        selectedVipLabel,
        selectedVipLevel,
        depositorName: depositorName.trim(),
        slipFileName: newRecord.slipFileName,
        slipDataUrl,
        referenceCode: newRecord.referenceCode,
      });

      const updatedList = saveLocalDepositRequest(profile.uid, newRecord);
      setRecentDeposits(updatedList);
      setSubmittedRecord(newRecord);
      setStep('submitted_waiting_admin');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit deposit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForNewDeposit = () => {
    setSlipDataUrl('');
    setSlipFileName('');
    setSubmittedRecord(null);
    setFormError(null);
    setStep('configure');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div
        className={`relative max-w-2xl w-full my-auto rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0e1526] border-pink-500/35 text-white'
            : 'bg-white border-pink-200 text-slate-900'
        }`}
      >
        {/* Top Gradient Header */}
        <div className="bg-gradient-to-r from-sky-500 via-blue-600 via-pink-500 to-rose-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/20 font-bold">
                  {tr(profile, 'OFFICIAL DEPOSIT AREA', 'නිල තැන්පතු අංශය')}
                </span>
                <span className="text-[11px] font-mono text-white/90">
                  {activeCurrency}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold font-display tracking-tight">
                {step === 'configure' &&
                  tr(profile, 'Configure & Confirm Deposit', 'තැන්පතු විස්තර තෝරා තහවුරු කරන්න')}
                {step === 'loading' &&
                  tr(profile, 'Connecting to Deposit Gateway...', 'තැන්පතු ගිණුම් විස්තර ලබා ගනිමින්...')}
                {step === 'payment_and_slip' &&
                  tr(
                    profile,
                    'Official Bank Account & Upload Payment Slip',
                    'බැංකු ගිණුම් විස්තර සහ රිසිට්පත උඩුගත කිරීම'
                  )}
                {step === 'submitted_waiting_admin' &&
                  tr(
                    profile,
                    'Deposit Submitted — Waiting for Admin Approval',
                    'තැන්පතුව යොමු කරන ලදී — පරිපාලක අනුමැතිය සඳහා රැඳී සිටී'
                  )}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div
          className={`px-6 py-3 border-b grid grid-cols-3 gap-2 text-[11px] font-bold ${
            isDark ? 'bg-[#131c31] border-white/10' : 'bg-slate-50 border-pink-100'
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              step === 'configure'
                ? 'text-pink-400'
                : 'text-emerald-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono bg-pink-500/20 border border-pink-500/40">
              1
            </span>
            <span className="truncate">
              {tr(profile, '1. Select & Confirm', '1. තැන්පතුව තෝරන්න')}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 ${
              step === 'loading' || step === 'payment_and_slip'
                ? 'text-pink-400'
                : step === 'submitted_waiting_admin'
                  ? 'text-emerald-400'
                  : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono bg-blue-500/20 border border-blue-500/40">
              2
            </span>
            <span className="truncate">
              {tr(profile, '2. Bank & Upload Slip', '2. ගිණුම සහ රිසිට්පත')}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 ${
              step === 'submitted_waiting_admin' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono bg-amber-500/20 border border-amber-500/40">
              3
            </span>
            <span className="truncate">
              {tr(profile, '3. Wait Admin Approve', '3. Admin අනුමැතිය')}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5">
          {initialNotice && step === 'configure' && (
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{initialNotice}</span>
            </div>
          )}

          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ================= STEP 1: CONFIGURE & CONFIRM DEPOSIT ================= */}
          {step === 'configure' && (
            <form onSubmit={handleConfirmDepositStep} className="space-y-5">
              {/* 1. Select Deposit Type (Bank / USDT) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {tr(
                    profile,
                    'Step 1 — Select Deposit Type (Bank / USDT)',
                    'පියවර 1 — තැන්පතු ක්‍රමය තෝරන්න (Bank / USDT)'
                  )}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDepositType('bank')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      depositType === 'bank'
                        ? 'border-pink-500 bg-gradient-to-r from-blue-500/15 via-pink-500/15 to-rose-500/15 shadow-sm'
                        : isDark
                          ? 'border-white/10 bg-[#151f36] hover:border-white/25'
                          : 'border-slate-200 bg-slate-50 hover:border-pink-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold">
                        {tr(profile, 'Via Selected Bank', 'බැංකු තැන්පතු (Bank)')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tr(profile, 'Local & International Bank Transfer', 'දේශීය සහ ජාත්‍යන්තර බැංකු හුවමාරු')}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositType('usdt')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      depositType === 'usdt'
                        ? 'border-pink-500 bg-gradient-to-r from-blue-500/15 via-pink-500/15 to-rose-500/15 shadow-sm'
                        : isDark
                          ? 'border-white/10 bg-[#151f36] hover:border-white/25'
                          : 'border-slate-200 bg-slate-50 hover:border-pink-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold">
                        {tr(profile, 'USDT Crypto', 'USDT ක්‍රිප්ටෝ (USDT)')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tr(profile, 'TRC-20 / BEP-20 / ERC-20', 'TRC-20 / BEP-20 / ERC-20 ජාලය')}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Via Selected Bank: Select Country & Bank / Network */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>{tr(profile, 'Select Country', 'රට තෝරන්න (Select Country)')}</span>
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border ${
                      isDark
                        ? 'bg-[#162038] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {depositType === 'bank' ? (
                  <div>
                    <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-pink-400" />
                      <span>
                        {tr(profile, 'Via Selected Bank', 'බැංකුව තෝරන්න (Select Bank)')}
                      </span>
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border ${
                        isDark
                          ? 'bg-[#162038] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {availableBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bankName} ({bank.country})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {tr(profile, 'Select USDT Network', 'USDT ජාලය තෝරන්න')}
                      </span>
                    </label>
                    <select
                      value={selectedUsdtId}
                      onChange={(e) => setSelectedUsdtId(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border ${
                        isDark
                          ? 'bg-[#162038] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {availableUsdtOptions.map((net) => (
                        <option key={net.id} value={net.id}>
                          {net.networkName} — {net.tokenStandard}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 3. Select Amount / VIP Package */}
              <div className="space-y-2">
                <label className="block text-xs font-bold flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {tr(
                      profile,
                      `Select Amount / VIP Package (${activeCurrency})`,
                      `මුදල / VIP පැකේජය තෝරන්න (${activeCurrency})`
                    )}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {paidVipTiers.map((tier) => {
                    const isSelected = selectedVipLevel === tier.level;
                    return (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={() => handleSelectVipPackage(tier.level, tier.unlockAmount)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-pink-500 bg-gradient-to-br from-sky-500/20 via-pink-500/20 to-rose-500/20 shadow-sm'
                            : isDark
                              ? 'border-white/10 bg-[#151f36] hover:border-pink-500/40'
                              : 'border-slate-200 bg-slate-50 hover:border-pink-300'
                        }`}
                      >
                        <div className="text-[10px] font-mono uppercase text-pink-400 font-bold">
                          VIP {tier.level}
                        </div>
                        <div className="text-xs font-extrabold mt-0.5 truncate">
                          {tier.name.replace('Zentro ', '')}
                        </div>
                        <div className="text-xs font-mono font-bold text-sky-400 mt-1 tabular-nums">
                          {formatSiteAmount(tier.unlockAmount, activeCurrency)}
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handleSelectVipPackage(null)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedVipLevel === null
                        ? 'border-pink-500 bg-gradient-to-br from-sky-500/20 via-pink-500/20 to-rose-500/20 shadow-sm'
                        : isDark
                          ? 'border-white/10 bg-[#151f36] hover:border-pink-500/40'
                          : 'border-slate-200 bg-slate-50 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      CUSTOM
                    </div>
                    <div className="text-xs font-extrabold mt-0.5">
                      {tr(profile, 'Other Amount', 'වෙනත් මුදලක්')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {tr(profile, 'Type below', 'පහතින් ලියන්න')}
                    </div>
                  </button>
                </div>
              </div>

              {/* 4. Type Amount & Type Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {tr(
                      profile,
                      `Type Amount (${activeCurrency})`,
                      `තැන්පත් කරන මුදල (${activeCurrency})`
                    )}
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={typedAmount}
                    onChange={(e) => {
                      setTypedAmount(e.target.value);
                      setFormError(null);
                    }}
                    placeholder={`Enter amount in ${activeCurrency}`}
                    className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold tabular-nums rounded-xl border ${
                      isDark
                        ? 'bg-[#162038] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="mt-1 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>
                      Base Value: {formatCurrencyValue(amountInLkr, 'LKR')} LKR
                    </span>
                    {depositType === 'usdt' && (
                      <span className="text-emerald-400">
                        ≈ {formatCurrencyValue(amountInLkr, 'USDT')} USDT
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>
                      {tr(
                        profile,
                        'Type Name (Depositor Full Name)',
                        'තැන්පත්කරුගේ සම්පූර්ණ නම (Type Name)'
                      )}
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={depositorName}
                    onChange={(e) => {
                      setDepositorName(e.target.value);
                      setFormError(null);
                    }}
                    placeholder={tr(
                      profile,
                      'Enter sender / account holder name',
                      'ඔබගේ සම්පූර්ණ නම ඇතුළත් කරන්න'
                    )}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                      isDark
                        ? 'bg-[#162038] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="mt-1 text-[11px] text-slate-400">
                    {tr(
                      profile,
                      'Used by Admin to verify your payment slip',
                      'රිසිට්පත පරීක්ෂා කිරීම සඳහා භාවිතා කෙරේ'
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Confirm Deposit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 hover:opacity-95 text-white font-extrabold text-sm cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {tr(
                    profile,
                    'Confirm Deposit & Go to Deposit Area',
                    'තැන්පතුව තහවුරු කර ගිණුම් අංශයට යන්න (Confirm Deposit)'
                  )}
                </span>
              </button>
            </form>
          )}

          {/* ================= STEP 2: LOADING DEPOSIT AREA ================= */}
          {step === 'loading' && (
            <div className="py-14 px-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl mx-auto bg-gradient-to-br from-sky-400 via-blue-500 via-pink-500 to-rose-500 flex items-center justify-center text-white shadow-xl">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-mono uppercase tracking-widest text-pink-400 font-bold">
                  {tr(profile, 'LOADING DEPOSIT AREA', 'තැන්පතු අංශය විවෘත වෙමින් පවතී...')}
                </div>
                <h4 className="text-lg font-extrabold font-display">
                  {depositType === 'bank'
                    ? tr(
                        profile,
                        `Preparing Official ${activeBank.bankName} Account Details...`,
                        `${activeBank.bankName} නිල බැංකු ගිණුම් විස්තර සූදානම් කරමින්...`
                      )
                    : tr(
                        profile,
                        `Preparing Official ${activeUsdt.networkName} Deposit Address...`,
                        `${activeUsdt.networkName} තැන්පතු ලිපිනය සූදානම් කරමින්...`
                      )}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {tr(
                    profile,
                    'Generating unique deposit reference code and opening payment slip upload gateway...',
                    'ඔබගේ තැන්පතු යොමු අංකය සහ රිසිට්පත් උඩුගත කිරීමේ පිටුව සකසමින් පවතී...'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 3: DISPLAY BANK ACCOUNT & UPLOAD SLIP ================= */}
          {step === 'payment_and_slip' && (
            <form onSubmit={handleFinalSubmitDeposit} className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('configure')}
                  className="text-xs font-bold text-sky-400 hover:text-pink-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{tr(profile, 'Back to Edit Deposit Details', 'ආපසු ගොස් විස්තර වෙනස් කරන්න')}</span>
                </button>
                <span className="text-xs font-mono font-bold text-pink-400">
                  Ref: {referenceCode}
                </span>
              </div>

              {/* Official Bank Account / USDT Details Display Card */}
              <div
                className={`p-5 rounded-3xl border space-y-4 ${
                  isDark
                    ? 'bg-gradient-to-br from-[#141f38] via-[#181b34] to-[#23142e] border-pink-500/40'
                    : 'bg-gradient-to-br from-sky-50 via-white to-pink-50 border-pink-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-pink-500/20 text-pink-400 font-bold">
                      {depositType === 'bank'
                        ? tr(profile, 'OFFICIAL RECEIVING BANK ACCOUNT', 'නිල තැන්පතු බැංකු ගිණුම')
                        : tr(profile, 'OFFICIAL USDT RECEIVING WALLET', 'නිල USDT තැන්පතු ලිපිනය')}
                    </span>
                    <h4 className="text-base font-extrabold mt-1">
                      {depositType === 'bank' ? activeBank.bankName : activeUsdt.networkName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">
                      {tr(profile, 'Exact Amount to Transfer', 'බැර කළ යුතු මුදල')}
                    </div>
                    <div className="text-lg font-mono font-extrabold text-emerald-400 tabular-nums">
                      {formatSiteAmount(amountInLkr, activeCurrency)}
                    </div>
                  </div>
                </div>

                {depositType === 'bank' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div
                      className={`p-3 rounded-2xl border ${
                        isDark ? 'bg-black/25 border-white/10' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-mono text-slate-400">
                        {tr(profile, 'Bank Name & Country', 'බැංකුව සහ රට')}
                      </div>
                      <div className="font-bold mt-0.5">
                        {activeBank.bankName} ({selectedCountry})
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border ${
                        isDark ? 'bg-black/25 border-white/10' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-mono text-slate-400">
                        {tr(profile, 'Account Holder / Beneficiary Name', 'ගිණුම් හිමියාගේ නම')}
                      </div>
                      <div className="font-bold mt-0.5">{activeBank.accountName}</div>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border sm:col-span-2 flex items-center justify-between gap-3 ${
                        isDark ? 'bg-black/35 border-pink-500/30' : 'bg-white border-pink-200'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] uppercase font-mono text-pink-400 font-bold">
                          {tr(profile, 'Official Bank Account Number', 'නිල බැංකු ගිණුම් අංකය')}
                        </div>
                        <div className="text-base sm:text-lg font-mono font-extrabold tracking-wider mt-0.5">
                          {activeBank.accountNumber}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(activeBank.accountNumber, 'account_number')
                        }
                        className="px-3 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {copiedField === 'account_number' ? 'Copied!' : 'Copy Account'}
                        </span>
                      </button>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border ${
                        isDark ? 'bg-black/25 border-white/10' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-mono text-slate-400">
                        {tr(profile, 'Branch & SWIFT Code', 'ශාඛාව සහ SWIFT කේතය')}
                      </div>
                      <div className="font-mono font-semibold mt-0.5">
                        {activeBank.branchName} · {activeBank.swiftCode}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border ${
                        isDark ? 'bg-black/25 border-white/10' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-mono text-slate-400">
                        {tr(profile, 'Confirmed Depositor Name', 'තැන්පත්කරුගේ නම')}
                      </div>
                      <div className="font-bold mt-0.5 text-sky-400">
                        {depositorName} ({activeVipObj ? activeVipObj.name : 'Custom Deposit'})
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-black/35 border-emerald-500/30' : 'bg-white border-emerald-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold">
                          {activeUsdt.networkName} ({activeUsdt.tokenStandard}) Wallet Address
                        </div>
                        <div className="text-xs sm:text-sm font-mono font-extrabold break-all mt-1">
                          {activeUsdt.walletAddress}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeUsdt.walletAddress, 'usdt_wallet')}
                        className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedField === 'usdt_wallet' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-between text-[11px] text-slate-400 font-mono">
                      <span>Depositor Name: {depositorName}</span>
                      <span>USDT Equivalent: ≈ {formatCurrencyValue(amountInUsdt, 'USDT')} USDT</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Slip (Image Upload Area) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <FileImage className="w-4 h-4" />
                  <span>
                    {tr(
                      profile,
                      'Upload Payment Slip / Bank Receipt (Image Upload Area)',
                      'බැංකු රිසිට්පතේ ඡායාරූපය උඩුගත කරන්න (Upload Slip)'
                    )}
                  </span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSlipFileChange}
                  className="hidden"
                />

                {!slipDataUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 text-center ${
                      isDark
                        ? 'border-pink-500/40 bg-[#151e34]/70 hover:bg-[#192440] hover:border-pink-400'
                        : 'border-pink-300 bg-pink-50/50 hover:bg-pink-50 hover:border-pink-500'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-pink-500 text-white flex items-center justify-center shadow-md">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold">
                        {tr(
                          profile,
                          'Click to Upload Payment Slip Image',
                          'ගෙවීම් රිසිට්පත (Slip) උඩුගත කිරීමට මෙතැන ක්ලික් කරන්න'
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {tr(
                          profile,
                          'Supports JPG, PNG, WEBP bank transfer slip or screenshot',
                          'බැංකු තැන්පතු රිසිට්පතේ හෝ Screenshot ඡායාරූපයක් තෝරන්න'
                        )}
                      </div>
                    </div>
                  </button>
                ) : (
                  <div
                    className={`p-4 rounded-3xl border space-y-3 ${
                      isDark ? 'bg-[#151f36] border-emerald-500/40' : 'bg-emerald-50/50 border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="truncate max-w-[240px]">
                          Slip Attached: {slipFileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 rounded-xl bg-pink-500/20 text-pink-400 text-xs font-bold cursor-pointer hover:bg-pink-500/30"
                      >
                        {tr(profile, 'Change Slip Image', 'වෙනත් ඡායාරූපයක් තෝරන්න')}
                      </button>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-white/10 max-h-56 bg-black/40 flex items-center justify-center">
                      <img
                        src={slipDataUrl}
                        alt="Uploaded Deposit Slip"
                        className="max-h-52 w-auto object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Deposit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 hover:opacity-95 text-white font-extrabold text-sm cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{tr(profile, 'Submitting Deposit...', 'තැන්පතුව යොමු කරමින්...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {tr(
                        profile,
                        `Submit Deposit (${formatSiteAmount(amountInLkr, activeCurrency)})`,
                        `තැන්පතුව ඉදිරිපත් කරන්න (Submit Deposit - ${formatSiteAmount(amountInLkr, activeCurrency)})`
                      )}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 4: AFTER SUBMIT — WAIT ADMIN APPROVE ================= */}
          {step === 'submitted_waiting_admin' && submittedRecord && (
            <div className="space-y-5">
              <div
                className={`p-6 rounded-3xl border text-center space-y-4 ${
                  isDark
                    ? 'bg-gradient-to-br from-amber-500/10 via-[#151f36] to-pink-500/10 border-amber-500/40'
                    : 'bg-amber-50/70 border-amber-300'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl mx-auto bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Clock className="w-3 h-3" />
                    {tr(
                      profile,
                      'WAIT ADMIN APPROVE · PENDING ADMIN VERIFICATION',
                      'පරිපාලක අනුමැතිය සඳහා රැඳී සිටී (Wait Admin Approve)'
                    )}
                  </span>
                  <h4 className="text-lg font-extrabold font-display pt-1">
                    {tr(
                      profile,
                      'Deposit Request Submitted Successfully!',
                      'ඔබගේ තැන්පතු ඉල්ලීම සාර්ථකව යොමු කරන ලදී!'
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {tr(
                      profile,
                      'Your bank transfer slip has been uploaded to the Zentro Admin Finance Desk. Your balance will be credited as soon as an administrator approves your slip.',
                      'ඔබගේ බැංකු රිසිට්පත පරිපාලක අංශය වෙත යොමු කර ඇත. පරිපාලක (Admin) අනුමැතිය ලැබුණු වහාම ඔබගේ ගිණුමට මුදල් බැර වේ.'
                    )}
                  </p>
                </div>

                {/* Submitted Summary Grid */}
                <div
                  className={`p-4 rounded-2xl border text-left grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${
                    isDark ? 'bg-black/30 border-white/10' : 'bg-white border-amber-200'
                  }`}
                >
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Reference ID
                    </div>
                    <div className="font-mono font-bold text-pink-400">
                      {submittedRecord.referenceCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Approval Status
                    </div>
                    <div className="font-mono font-bold text-amber-400">
                      PENDING ADMIN APPROVAL
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Deposit Method & Country
                    </div>
                    <div className="font-bold">
                      {submittedRecord.selectedBankName} ({submittedRecord.country})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Depositor Name
                    </div>
                    <div className="font-bold text-sky-400">
                      {submittedRecord.depositorName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Selected Amount / VIP
                    </div>
                    <div className="font-bold">{submittedRecord.selectedVipLabel}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Submitted Deposit Amount
                    </div>
                    <div className="font-mono font-extrabold text-emerald-400">
                      {formatSiteAmount(submittedRecord.amountInLkr, activeCurrency)}
                    </div>
                  </div>
                </div>

                {/* Uploaded Slip Thumbnail */}
                {submittedRecord.slipDataUrl && (
                  <div className="space-y-1.5 text-left">
                    <div className="text-[11px] font-mono uppercase text-slate-400">
                      Uploaded Payment Slip Preview ({submittedRecord.slipFileName})
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-white/10 max-h-44 bg-black/40 flex items-center justify-center p-2">
                      <img
                        src={submittedRecord.slipDataUrl}
                        alt="Submitted Slip"
                        className="max-h-40 w-auto object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForNewDeposit}
                    className={`flex-1 py-3 px-4 rounded-2xl border font-bold text-xs cursor-pointer ${
                      isDark
                        ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                        : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {tr(profile, 'Submit Another Deposit', 'තවත් තැන්පතුවක් කරන්න')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 via-pink-500 to-rose-500 text-white font-extrabold text-xs cursor-pointer shadow-md"
                  >
                    {tr(profile, 'Done (Wait Admin Approve)', 'හරි (Admin අනුමැතිය තෙක් රැඳෙන්න)')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Submitted Deposits Waiting for Admin Approval */}
          {recentDeposits.length > 0 && step !== 'loading' && (
            <div
              className={`pt-4 border-t space-y-2.5 ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {tr(
                    profile,
                    `Your Submitted Deposit Requests (${recentDeposits.length})`,
                    `ඔබ යොමු කළ තැන්පතු ඉල්ලීම් (${recentDeposits.length})`
                  )}
                </span>
                <span className="text-[11px] font-mono text-amber-400">
                  {tr(profile, 'Status: Wait Admin Approve', 'තත්ත්වය: Admin අනුමැතිය සඳහා')}
                </span>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {recentDeposits.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      isDark ? 'bg-[#141d33] border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {req.slipDataUrl && (
                        <img
                          src={req.slipDataUrl}
                          alt="Slip"
                          className="w-10 h-10 rounded-lg object-cover border border-white/15 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold truncate">
                          {req.selectedBankName} · {req.depositorName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          {req.referenceCode} · {req.country} · {req.selectedVipLabel}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-400">
                        {formatSiteAmount(req.amountInLkr, activeCurrency)}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                        WAIT ADMIN APPROVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
