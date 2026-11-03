import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowUpFromLine,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  Link2,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import {
  BANK_MIN_WITHDRAW_LKR,
  BANK_WITHDRAW_FEE_LKR,
  BANK_WITHDRAW_PRESETS_LKR,
  BankAccountRecord,
  USDT_BEP20_MIN_WITHDRAW_USDT,
  USDT_BEP20_WITHDRAW_FEE_USDT,
  USDT_BEP20_WITHDRAW_PRESETS_USDT,
  UserProfile,
  VIP_TIERS,
  WithdrawalRequestRecord,
  convertFromLkr,
  convertToLkr,
  formatCurrencyValue,
  formatSiteAmount,
  getActiveCurrency,
  getLocalKycRequestByUser,
  getLocalWithdrawalRequests,
  isUsdtBep20BankAccount,
  saveLocalWithdrawalRequest,
  tr,
} from '../types';

interface WithdrawAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  isDark: boolean;
  bankAccounts: BankAccountRecord[];
  onBindAccount: (data: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    routingOrSwift: string;
    securityPassword: string;
  }) => Promise<void>;
  onNavigateToMyBank: () => void;
  onNavigateToKyc?: () => void;
  onNavigateToVip?: () => void;
  onSubmitWithdrawalRequest: (payload: {
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
  }) => Promise<void>;
}

type WithdrawStep = 'configure' | 'loading' | 'pending_admin';

export const WithdrawAreaModal: React.FC<WithdrawAreaModalProps> = ({
  isOpen,
  onClose,
  profile,
  isDark,
  bankAccounts,
  onBindAccount,
  onNavigateToMyBank,
  onNavigateToKyc,
  onNavigateToVip,
  onSubmitWithdrawalRequest,
}) => {
  const activeCurrency = getActiveCurrency(profile);
  const localKyc = getLocalKycRequestByUser(profile.uid);
  const isKycVerified =
    profile.kycStatus === 'verified' || localKyc?.status === 'verified';
  const kycStatusLabel =
    profile.kycStatus === 'verified' || localKyc?.status === 'verified'
      ? 'verified'
      : profile.kycStatus === 'pending' || localKyc?.status === 'pending'
        ? 'pending'
        : profile.kycStatus === 'rejected' || localKyc?.status === 'rejected'
          ? 'rejected'
          : 'unverified';
  const isUpgradeRequired = Boolean(profile.mustUpgradeNextVip);
  const nextRequiredVipTier =
    VIP_TIERS.find((t) => t.level === Math.min(4, profile.vipLevel + 1)) || VIP_TIERS[4];

  // Separate bound Bank accounts vs bound USDT BEP-20 wallet addresses
  const boundBankAccounts = bankAccounts.filter((b) => !isUsdtBep20BankAccount(b));
  const boundUsdtAddresses = bankAccounts.filter((b) => isUsdtBep20BankAccount(b));

  const [step, setStep] = useState<WithdrawStep>('configure');
  const [withdrawType, setWithdrawType] = useState<'bank' | 'usdt_bep20'>('bank');

  // Selected bound account IDs
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedUsdtId, setSelectedUsdtId] = useState<string>('');

  // Selected / typed withdrawal amounts
  // Bank input is in LKR (min 500 LKR, fee 25 LKR)
  // USDT input is in USDT BEP-20 (min 5 USDT, fee 0.5 USDT)
  const [bankAmountLkr, setBankAmountLkr] = useState<string>(String(BANK_MIN_WITHDRAW_LKR));
  const [usdtAmount, setUsdtAmount] = useState<string>(String(USDT_BEP20_MIN_WITHDRAW_USDT));
  const [securityPassword, setSecurityPassword] = useState<string>('');

  // Inline Bind Bank / USDT BEP-20 Address form state
  const [showBindForm, setShowBindForm] = useState<boolean>(false);
  const [bindBankName, setBindBankName] = useState<string>('Bank of Ceylon (BOC)');
  const [bindAccountHolder, setBindAccountHolder] = useState<string>(profile.username || '');
  const [bindAccountNumber, setBindAccountNumber] = useState<string>('');
  const [bindBranchCode, setBindBranchCode] = useState<string>('Colombo Main Branch');
  const [bindUsdtAddress, setBindUsdtAddress] = useState<string>('');
  const [bindUsdtLabel, setBindUsdtLabel] = useState<string>(
    profile.username ? `${profile.username} BEP-20` : 'My BEP-20 Wallet'
  );
  const [bindSecPass, setBindSecPass] = useState<string>('');
  const [bindingSubmitting, setBindingSubmitting] = useState<boolean>(false);
  const [bindSuccessMsg, setBindSuccessMsg] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<WithdrawalRequestRecord | null>(null);
  const [recentWithdrawals, setRecentWithdrawals] = useState<WithdrawalRequestRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('configure');
      setFormError(null);
      setBindSuccessMsg(null);
      setSecurityPassword('');
      setRecentWithdrawals(getLocalWithdrawalRequests(profile.uid));
    }
  }, [isOpen, profile.uid]);

  // Keep selected bound account IDs synced when bankAccounts updates
  useEffect(() => {
    if (boundBankAccounts.length > 0) {
      if (!boundBankAccounts.some((b) => b.id === selectedBankId)) {
        setSelectedBankId(boundBankAccounts[0].id);
      }
    } else {
      setSelectedBankId('');
    }

    if (boundUsdtAddresses.length > 0) {
      if (!boundUsdtAddresses.some((b) => b.id === selectedUsdtId)) {
        setSelectedUsdtId(boundUsdtAddresses[0].id);
      }
    } else {
      setSelectedUsdtId('');
    }
  }, [bankAccounts, selectedBankId, selectedUsdtId]);

  // Automatically open inline bind form if user switches to a type with no bound account/address
  useEffect(() => {
    setFormError(null);
    setBindSuccessMsg(null);
    if (withdrawType === 'bank' && boundBankAccounts.length === 0) {
      setShowBindForm(true);
    } else if (withdrawType === 'usdt_bep20' && boundUsdtAddresses.length === 0) {
      setShowBindForm(true);
    } else {
      setShowBindForm(false);
    }
  }, [withdrawType, boundBankAccounts.length, boundUsdtAddresses.length]);

  if (!isOpen) return null;

  // Balance calculations
  const availableBalanceLkr = Number(profile.balance.toFixed(2));
  const availableBalanceUsdt = convertFromLkr(availableBalanceLkr, 'USDT');

  // Active bound selection check
  const isCurrentTypeBound =
    withdrawType === 'bank' ? boundBankAccounts.length > 0 : boundUsdtAddresses.length > 0;

  const activeBoundBank =
    boundBankAccounts.find((b) => b.id === selectedBankId) || boundBankAccounts[0] || null;
  const activeBoundUsdt =
    boundUsdtAddresses.find((b) => b.id === selectedUsdtId) || boundUsdtAddresses[0] || null;

  // Amount & Fee calculations
  const parsedBankLkr = Number(bankAmountLkr) || 0;
  const bankFeeLkr = BANK_WITHDRAW_FEE_LKR; // 25 LKR
  const bankNetLkr = Math.max(0, Number((parsedBankLkr - bankFeeLkr).toFixed(2)));

  const parsedUsdt = Number(usdtAmount) || 0;
  const usdtFee = USDT_BEP20_WITHDRAW_FEE_USDT; // 0.5 USDT
  const usdtNet = Math.max(0, Number((parsedUsdt - usdtFee).toFixed(2)));
  const usdtAmountInLkr = convertToLkr(parsedUsdt, 'USDT');
  const usdtFeeInLkr = convertToLkr(usdtFee, 'USDT');
  const usdtNetInLkr = Math.max(0, Number((usdtAmountInLkr - usdtFeeInLkr).toFixed(2)));

  // Handle inline binding of Bank Account or USDT BEP-20 Address
  const handleInlineBindSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setBindSuccessMsg(null);

    if (withdrawType === 'bank') {
      if (!bindBankName.trim() || bindBankName.trim().length < 2) {
        setFormError(
          tr(profile, 'Please enter a valid Bank Name.', 'කරුණාකර නිවැරදි බැංකු නාමයක් ඇතුළත් කරන්න.')
        );
        return;
      }
      if (!bindAccountHolder.trim() || bindAccountHolder.trim().length < 2) {
        setFormError(
          tr(
            profile,
            'Please enter the Account Holder Name.',
            'කරුණාකර ගිණුම් හිමියාගේ සම්පූර්ණ නම ඇතුළත් කරන්න.'
          )
        );
        return;
      }
      if (!bindAccountNumber.trim() || bindAccountNumber.trim().length < 4) {
        setFormError(
          tr(
            profile,
            'Please enter a valid Bank Account Number.',
            'කරුණාකර නිවැරදි බැංකු ගිණුම් අංකයක් ඇතුළත් කරන්න.'
          )
        );
        return;
      }
    } else {
      const cleanAddr = bindUsdtAddress.trim();
      if (cleanAddr.length < 10) {
        setFormError(
          tr(
            profile,
            'Please enter a valid USDT (BEP-20) wallet address (e.g. starting with 0x...).',
            'කරුණාකර නිවැරදි USDT (BEP-20) ලිපිනයක් ඇතුළත් කරන්න (0x... ආරම්භ වන).'
          )
        );
        return;
      }
    }

    if (!bindSecPass.trim()) {
      setFormError(
        tr(
          profile,
          'Please enter your Security Password to bind this payout destination.',
          'ගිණුම සම්බන්ධ (Bind) කිරීමට කරුණාකර ඔබගේ ආරක්ෂක මුරපදය ඇතුළත් කරන්න.'
        )
      );
      return;
    }

    setBindingSubmitting(true);
    try {
      if (withdrawType === 'bank') {
        await onBindAccount({
          bankName: bindBankName.trim(),
          accountHolder: bindAccountHolder.trim(),
          accountNumber: bindAccountNumber.trim(),
          routingOrSwift: bindBranchCode.trim() || 'BANK-LKR',
          securityPassword: bindSecPass.trim(),
        });
        setBindAccountNumber('');
        setBindSecPass('');
        setShowBindForm(false);
        setBindSuccessMsg(
          tr(
            profile,
            'Bank Account bound! You can now confirm your Bank withdrawal.',
            'බැංකු ගිණුම සාර්ථකව සම්බන්ධ කරන ලදී! දැන් ඔබට මුදල් ආපසු ගැනීම තහවුරු කළ හැක.'
          )
        );
      } else {
        await onBindAccount({
          bankName: 'USDT (BEP-20) BNB Smart Chain',
          accountHolder: (bindUsdtLabel.trim() || profile.username || 'BEP20 Wallet').slice(0, 80),
          accountNumber: bindUsdtAddress.trim(),
          routingOrSwift: 'USDT-BEP20',
          securityPassword: bindSecPass.trim(),
        });
        setBindUsdtAddress('');
        setBindSecPass('');
        setShowBindForm(false);
        setBindSuccessMsg(
          tr(
            profile,
            'USDT (BEP-20) wallet address bound! You can now confirm your USDT withdrawal.',
            'USDT (BEP-20) ලිපිනය සාර්ථකව සම්බන්ධ කරන ලදී! දැන් ඔබට USDT ආපසු ගැනීම තහවුරු කළ හැක.'
          )
        );
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to bind account/address.');
    } finally {
      setBindingSubmitting(false);
    }
  };

  // Handle Confirm Withdrawal -> Loading -> Pending Admin Approve
  const handleConfirmWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setBindSuccessMsg(null);

    // 0a. Mandatory Zentro Team KYC Verification Gate (Unverified users cannot withdraw)
    if (!isKycVerified) {
      setFormError(
        tr(
          profile,
          kycStatusLabel === 'pending'
            ? 'Withdrawal Locked: Your KYC application is currently Processing (awaiting Zentro Team verification). Unverified users cannot make withdrawals.'
            : 'Withdrawal Locked: Unverified users cannot make withdrawals. Please upload your ID document in the My -> KYC tab and wait for Zentro Team verification.',
          kycStatusLabel === 'pending'
            ? 'මුදල් ආපසු ගැනීම අගුළු දමා ඇත: ඔබගේ KYC අයදුම්පත දැනට Zentro Team පරීක්ෂාවේ (Processing) පවතී. Zentro Team තහවුරු කරන තෙක් මුදල් ආපසු ගත නොහැක.'
            : 'මුදල් ආපසු ගැනීම අගුළු දමා ඇත: KYC තහවුරු නොකළ පරිශීලකයින්ට මුදල් ආපසු ගත නොහැක. කරුණාකර My -> KYC වෙත ගොස් ඔබගේ හැඳුනුම්පත යොමු කර Zentro Team අනුමැතිය ලබාගන්න.'
        )
      );
      return;
    }

    // 0b. Check Admin "Upgrade Want Enable" (mustUpgradeNextVip) restriction
    if (isUpgradeRequired) {
      setFormError(
        tr(
          profile,
          `Withdrawal Locked: You must upgrade to the next VIP level (${nextRequiredVipTier.name} — ${formatSiteAmount(
            nextRequiredVipTier.unlockAmount,
            activeCurrency
          )}) while not mining before you can withdraw funds.`,
          `මුදල් ආපසු ගැනීම අගුළු දමා ඇත: මුදල් ආපසු ගැනීමට පෙර ඔබ මීළඟ VIP මට්ටම (${nextRequiredVipTier.name}) වෙත උත්ශ්‍රේණි (Upgrade) කළ යුතුය.`
        )
      );
      return;
    }

    // 1. Mandatory Bind Bank / Address check BEFORE confirm
    if (withdrawType === 'bank' && !activeBoundBank) {
      setShowBindForm(true);
      setFormError(
        tr(
          profile,
          'You MUST bind your Bank Account first before confirming a Bank withdrawal.',
          'මුදල් ආපසු ගැනීම තහවුරු කිරීමට පෙර ඔබ අනිවාර්යයෙන්ම බැංකු ගිණුම සම්බන්ධ (Bind) කළ යුතුය.'
        )
      );
      return;
    }

    if (withdrawType === 'usdt_bep20' && !activeBoundUsdt) {
      setShowBindForm(true);
      setFormError(
        tr(
          profile,
          'You MUST bind your USDT (BEP-20) wallet address first before confirming a USDT withdrawal.',
          'USDT ආපසු ගැනීම තහවුරු කිරීමට පෙර ඔබ අනිවාර්යයෙන්ම USDT (BEP-20) ලිපිනය සම්බන්ධ (Bind) කළ යුතුය.'
        )
      );
      return;
    }

    // 2. Minimum Amount & Balance Validation
    if (withdrawType === 'bank') {
      if (Number.isNaN(parsedBankLkr) || parsedBankLkr < BANK_MIN_WITHDRAW_LKR) {
        setFormError(
          tr(
            profile,
            `Minimum Bank withdrawal amount is ${BANK_MIN_WITHDRAW_LKR} LKR (with ${BANK_WITHDRAW_FEE_LKR} LKR bank fee).`,
            `බැංකු මගින් ආපසු ගත හැකි අවම මුදල රු. ${BANK_MIN_WITHDRAW_LKR} LKR වේ (බැංකු ගාස්තුව රු. ${BANK_WITHDRAW_FEE_LKR} LKR).`
          )
        );
        return;
      }
      if (parsedBankLkr > availableBalanceLkr + 0.05) {
        setFormError(
          tr(
            profile,
            `Insufficient withdrawal balance. Available: ${formatCurrencyValue(availableBalanceLkr, 'LKR')} LKR (${formatSiteAmount(availableBalanceLkr, activeCurrency)}).`,
            `ගිණුමේ ශේෂය ප්‍රමාණවත් නොවේ. පවතින ශේෂය: ${formatCurrencyValue(availableBalanceLkr, 'LKR')} LKR.`
          )
        );
        return;
      }
    } else {
      if (Number.isNaN(parsedUsdt) || parsedUsdt < USDT_BEP20_MIN_WITHDRAW_USDT) {
        setFormError(
          tr(
            profile,
            `Minimum USDT (BEP-20) withdrawal amount is ${USDT_BEP20_MIN_WITHDRAW_USDT} USDT (with ${USDT_BEP20_WITHDRAW_FEE_USDT} USDT fee).`,
            `USDT (BEP-20) මගින් ආපසු ගත හැකි අවම මුදල ${USDT_BEP20_MIN_WITHDRAW_USDT} USDT වේ (ගාස්තුව ${USDT_BEP20_WITHDRAW_FEE_USDT} USDT).`
          )
        );
        return;
      }
      if (usdtAmountInLkr > availableBalanceLkr + 0.05) {
        setFormError(
          tr(
            profile,
            `Insufficient withdrawal balance. Available: ${formatCurrencyValue(availableBalanceLkr, 'USDT')} USDT (${formatCurrencyValue(availableBalanceLkr, 'LKR')} LKR).`,
            `ගිණුමේ USDT ශේෂය ප්‍රමාණවත් නොවේ. පවතින ශේෂය: ${formatCurrencyValue(availableBalanceLkr, 'USDT')} USDT.`
          )
        );
        return;
      }
    }

    // 3. Security Password Check
    if (securityPassword.trim() !== profile.securityPasswordHash) {
      setFormError(
        tr(
          profile,
          'Invalid Security Password. Please enter your valid 6-digit Security Password.',
          'ආරක්ෂක මුරපදය වැරදියි. කරුණාකර නිවැරදි ආරක්ෂක මුරපදය ඇතුළත් කරන්න.'
        )
      );
      return;
    }

    const genRef = `ZNT-WDR-${Math.floor(100000 + Math.random() * 900000)}`;

    // Transition to Loading step first
    setStep('loading');

    setTimeout(async () => {
      try {
        const isBank = withdrawType === 'bank';
        const targetAcc = isBank ? activeBoundBank! : activeBoundUsdt!;

        const payload = {
          withdrawType,
          networkOrBankName: isBank ? targetAcc.bankName : 'USDT (BEP-20 · BNB Smart Chain)',
          accountHolderOrLabel: targetAcc.accountHolder,
          accountNumberOrAddress: targetAcc.accountNumber,
          branchOrStandard: isBank ? targetAcc.routingOrSwift : 'USDT-BEP20',
          amountInLkr: isBank ? parsedBankLkr : usdtAmountInLkr,
          feeInLkr: isBank ? bankFeeLkr : usdtFeeInLkr,
          netAmountInLkr: isBank ? bankNetLkr : usdtNetInLkr,
          amountInDisplayUnit: isBank ? parsedBankLkr : parsedUsdt,
          feeInDisplayUnit: isBank ? bankFeeLkr : usdtFee,
          netAmountInDisplayUnit: isBank ? bankNetLkr : usdtNet,
          displayUnit: (isBank ? 'LKR' : 'USDT') as 'LKR' | 'USDT',
          referenceCode: genRef,
        };

        await onSubmitWithdrawalRequest(payload);

        const newRecord: WithdrawalRequestRecord = {
          id: `wdr_${Date.now()}`,
          referenceCode: genRef,
          userId: profile.uid,
          username: profile.username,
          withdrawType: payload.withdrawType,
          networkOrBankName: payload.networkOrBankName,
          accountHolderOrLabel: payload.accountHolderOrLabel,
          accountNumberOrAddress: payload.accountNumberOrAddress,
          branchOrStandard: payload.branchOrStandard,
          amountInLkr: payload.amountInLkr,
          feeInLkr: payload.feeInLkr,
          netAmountInLkr: payload.netAmountInLkr,
          amountInDisplayUnit: payload.amountInDisplayUnit,
          feeInDisplayUnit: payload.feeInDisplayUnit,
          netAmountInDisplayUnit: payload.netAmountInDisplayUnit,
          displayUnit: payload.displayUnit,
          activeCurrency,
          status: 'pending_admin',
          createdAt: new Date().toISOString(),
        };

        const updatedHistory = saveLocalWithdrawalRequest(profile.uid, newRecord);
        setRecentWithdrawals(updatedHistory);
        setSubmittedRecord(newRecord);
        setSecurityPassword('');
        setStep('pending_admin');
      } catch (err: any) {
        setStep('configure');
        setFormError(err?.message || 'Failed to submit withdrawal request.');
      }
    }, 1250);
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
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25">
              <ArrowUpFromLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/20 font-bold">
                  {tr(profile, 'OFFICIAL WITHDRAW AREA', 'නිල මුදල් ආපසු ගැනීමේ අංශය')}
                </span>
                <span className="text-[11px] font-mono text-white/90">
                  BANK (LKR) · USDT (BEP-20)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold font-display tracking-tight">
                {step === 'configure' &&
                  tr(
                    profile,
                    'Select Type, Amount & Confirm Withdrawal',
                    'මුදල් ආපසු ගැනීමේ ක්‍රමය සහ මුදල තෝරා තහවුරු කරන්න'
                  )}
                {step === 'loading' &&
                  tr(
                    profile,
                    'Processing Withdrawal Request...',
                    'මුදල් ආපසු ගැනීමේ ඉල්ලීම සකසමින් පවතී...'
                  )}
                {step === 'pending_admin' &&
                  tr(
                    profile,
                    'Withdrawal Submitted — Pending Admin Approve',
                    'මුදල් ආපසු ගැනීම යොමු කරන ලදී — Admin අනුමැතිය සඳහා රැඳී සිටී'
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

        {/* 3-Step Progress Bar */}
        <div
          className={`px-6 py-3 border-b grid grid-cols-3 gap-2 text-[11px] font-bold ${
            isDark ? 'bg-[#131c31] border-white/10' : 'bg-slate-50 border-pink-100'
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              step === 'configure' ? 'text-pink-400' : 'text-emerald-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono bg-pink-500/20 border border-pink-500/40">
              1
            </span>
            <span className="truncate">
              {tr(profile, '1. Bind & Select Amount', '1. ගිණුම සහ මුදල තෝරන්න')}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 ${
              step === 'loading'
                ? 'text-pink-400'
                : step === 'pending_admin'
                  ? 'text-emerald-400'
                  : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono bg-blue-500/20 border border-blue-500/40">
              2
            </span>
            <span className="truncate">
              {tr(profile, '2. Confirm & Loading', '2. තහවුරු කිරීම')}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 ${
              step === 'pending_admin' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono bg-amber-500/20 border border-amber-500/40">
              3
            </span>
            <span className="truncate">
              {tr(profile, '3. Pending Admin Approve', '3. Admin අනුමැතිය')}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {bindSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bindSuccessMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: CONFIGURE WITHDRAWAL ================= */}
          {step === 'configure' && (
            <div className="space-y-5">
              {!isKycVerified && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                        <span>
                          {kycStatusLabel === 'pending'
                            ? tr(
                                profile,
                                'Withdrawal Locked — KYC Processing (Zentro Team Review)',
                                'මුදල් ආපසු ගැනීම අගුළු දමා ඇත — KYC Zentro Team පරීක්ෂාවේ පවතී'
                              )
                            : tr(
                                profile,
                                'Withdrawal Locked — Zentro Team KYC Verification Required',
                                'මුදල් ආපසු ගැනීම අගුළු දමා ඇත — Zentro Team KYC සත්‍යාපනය අනිවාර්යයි'
                              )}
                        </span>
                      </div>
                      <p className="mt-1 text-rose-200/90 leading-relaxed">
                        {kycStatusLabel === 'pending'
                          ? tr(
                              profile,
                              'Your KYC application and uploaded ID document have been submitted and are awaiting review by Zentro Team. Withdrawals unlock automatically once Zentro Team verifies your KYC.',
                              'ඔබගේ KYC ලේඛන යොමු කර ඇති අතර දැනට Zentro Team පරීක්ෂාවේ පවතී. Zentro Team එක විසින් තහවුරු කළ වහාම මුදල් ආපසු ගැනීම් සක්‍රිය වේ.'
                            )
                          : tr(
                              profile,
                              'Unverified users cannot make withdrawals. Please upload your ID document in the My -> KYC tab so Zentro Team can verify your identity.',
                              'තහවුරු නොකළ (Unverified) පරිශීලකයින්ට මුදල් ආපසු ගත නොහැක. කරුණාකර My -> KYC වෙත ගොස් ඔබගේ හැඳුනුම්පත Upload කර Zentro Team අනුමැතිය ලබාගන්න.'
                            )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToKyc || onNavigateToMyBank}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-pink-500 text-white font-extrabold text-xs shrink-0 cursor-pointer shadow-md"
                  >
                    {kycStatusLabel === 'pending'
                      ? tr(profile, 'View KYC Progress', 'KYC ප්‍රගතිය බලන්න')
                      : tr(profile, 'Verify KYC Now', 'දැන්ම KYC තහවුරු කරන්න')}
                  </button>
                </div>
              )}

              {isUpgradeRequired && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-rose-400 uppercase tracking-wide">
                        {tr(
                          profile,
                          `Withdrawal Locked — Must Upgrade to ${nextRequiredVipTier.name}`,
                          `මුදල් ආපසු ගැනීම අගුළු දමා ඇත — ${nextRequiredVipTier.name} වෙත Upgrade කළ යුතුය`
                        )}
                      </div>
                      <p className="mt-0.5 text-rose-200/90">
                        {tr(
                          profile,
                          `Your account is currently not mining and requires upgrading to the next VIP tier (${nextRequiredVipTier.name}) before withdrawals can be processed.`,
                          `ඔබගේ ගිණුම දැනට Mining නොවන බැවින් මුදල් ආපසු ගැනීම සඳහා මීළඟ VIP මට්ටම (${nextRequiredVipTier.name}) වෙත උත්ශ්‍රේණි කළ යුතුය.`
                        )}
                      </p>
                    </div>
                  </div>
                  {onNavigateToVip && (
                    <button
                      type="button"
                      onClick={onNavigateToVip}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md"
                    >
                      {tr(
                        profile,
                        `Upgrade to ${nextRequiredVipTier.name}`,
                        `${nextRequiredVipTier.name} වෙත Upgrade කරන්න`
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* 1. WITHDRAWAL BALANCE DISPLAY */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-gradient-to-r from-[#15203b] via-[#1c1a38] to-[#271530] border-pink-500/30'
                    : 'bg-gradient-to-r from-blue-50 via-pink-50 to-rose-50 border-pink-200'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-pink-400 font-bold flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>{tr(profile, 'WITHDRAWAL BALANCE', 'ආපසු ගත හැකි ගිණුම් ශේෂය')}</span>
                  </div>
                  <div className="text-2xl font-mono font-extrabold tabular-nums">
                    {formatSiteAmount(availableBalanceLkr, activeCurrency)}
                  </div>
                </div>
                <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 sm:gap-0.5 text-xs font-mono">
                  <div className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold">
                    LKR Balance: {formatCurrencyValue(availableBalanceLkr, 'LKR')} LKR
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                    USDT (BEP-20) Balance: {formatCurrencyValue(availableBalanceLkr, 'USDT')} USDT
                  </div>
                </div>
              </div>

              {/* 2. SELECT TYPE (BANK / USDT BEP-20) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {tr(
                    profile,
                    '1. Select Withdraw Type (Bank / USDT BEP-20)',
                    '1. මුදල් ආපසු ගැනීමේ ක්‍රමය තෝරන්න (Bank / USDT BEP-20)'
                  )}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawType('bank')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      withdrawType === 'bank'
                        ? 'border-pink-500 bg-gradient-to-r from-blue-500/15 via-pink-500/15 to-rose-500/15 shadow-sm'
                        : isDark
                          ? 'border-white/10 bg-[#151f36] hover:border-white/25'
                          : 'border-slate-200 bg-slate-50 hover:border-pink-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                        <span>{tr(profile, 'Bank Withdrawal', 'බැංකු ගිණුමට (Bank)')}</span>
                      </div>
                      <div className="text-[11px] font-mono text-pink-400 font-semibold mt-0.5">
                        Min {BANK_MIN_WITHDRAW_LKR} LKR · Fee {BANK_WITHDRAW_FEE_LKR} LKR
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawType('usdt_bep20')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      withdrawType === 'usdt_bep20'
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-sky-500/15 shadow-sm'
                        : isDark
                          ? 'border-white/10 bg-[#151f36] hover:border-white/25'
                          : 'border-slate-200 bg-slate-50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                        <span>{tr(profile, 'USDT (BEP-20 Only)', 'USDT (BEP-20 පමණි)')}</span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 font-semibold mt-0.5">
                        Min {USDT_BEP20_MIN_WITHDRAW_USDT} USDT · Fee {USDT_BEP20_WITHDRAW_FEE_USDT}{' '}
                        USDT
                      </div>
                    </div>
                  </button>
                </div>

                {/* Rule Notice Banner */}
                {withdrawType === 'bank' ? (
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sky-300 font-medium">
                      {tr(
                        profile,
                        'Bank Withdrawal Rule: Minimum withdraw amount 500 LKR with 25 LKR bank fee.',
                        'බැංකු නීතිය: අවම ආපසු ගැනීමේ මුදල රු. 500 LKR වන අතර බැංකු ගාස්තුව රු. 25 LKR වේ.'
                      )}
                    </span>
                    <span className="font-mono font-bold text-pink-400">
                      Min: 500 LKR | Fee: 25 LKR
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-emerald-300 font-medium">
                      {tr(
                        profile,
                        'USDT Rule: Only can withdraw USDT BEP-20 (BNB Smart Chain). Minimum withdraw 5 USDT with 0.5 USDT fee.',
                        'USDT නීතිය: ආපසු ගත හැක්කේ USDT BEP-20 ජාලයෙන් පමණි. අවම මුදල 5 USDT සහ ගාස්තුව 0.5 USDT වේ.'
                      )}
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      BEP-20 ONLY | Min: 5 USDT | Fee: 0.5 USDT
                    </span>
                  </div>
                )}
              </div>

              {/* 3. MANDATORY BIND BANK / USDT BEP-20 ADDRESS SECTION */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isCurrentTypeBound
                    ? isDark
                      ? 'bg-[#141f36] border-emerald-500/35'
                      : 'bg-emerald-50/40 border-emerald-300'
                    : isDark
                      ? 'bg-rose-950/25 border-rose-500/50'
                      : 'bg-rose-50 border-rose-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link2
                      className={`w-4 h-4 ${
                        isCurrentTypeBound ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    />
                    <span className="text-xs font-extrabold uppercase tracking-wider">
                      {withdrawType === 'bank'
                        ? tr(
                            profile,
                            '2. Bound Bank Account (Mandatory Before Confirm)',
                            '2. සම්බන්ධ කළ බැංකු ගිණුම (තහවුරු කිරීමට පෙර අනිවාර්යයි)'
                          )
                        : tr(
                            profile,
                            '2. Bound USDT (BEP-20) Address (Mandatory Before Confirm)',
                            '2. සම්බන්ධ කළ USDT (BEP-20) ලිපිනය (තහවුරු කිරීමට පෙර අනිවාර්යයි)'
                          )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrentTypeBound ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                        BOUND & VERIFIED
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold">
                        MUST BIND BEFORE CONFIRM
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowBindForm(!showBindForm)}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>
                        {showBindForm
                          ? tr(profile, 'Hide Bind Form', 'පෝරමය සඟවන්න')
                          : withdrawType === 'bank'
                            ? tr(profile, 'Bind Bank Account', 'බැංකු ගිණුම Bind කරන්න')
                            : tr(profile, 'Bind BEP-20 Address', 'BEP-20 ලිපිනය Bind කරන්න')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Display Bound Account/Address Selector or Warning */}
                {withdrawType === 'bank' ? (
                  boundBankAccounts.length > 0 ? (
                    <div>
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border ${
                          isDark
                            ? 'bg-[#0e1526] border-white/15 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {boundBankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} — {b.accountNumber} ({b.accountHolder})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-400 font-semibold flex items-center justify-between gap-2">
                      <span>
                        {tr(
                          profile,
                          'No Bank Account bound yet! You must bind a Bank Account below before you can confirm withdrawal.',
                          'තවම බැංකු ගිණුමක් සම්බන්ධ කර නැත! මුදල් ආපසු ගැනීම තහවුරු කිරීමට පෙර පහතින් ඔබගේ බැංකු ගිණුම Bind කරන්න.'
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={onNavigateToMyBank}
                        className="underline text-pink-400 shrink-0 cursor-pointer"
                      >
                        {tr(profile, 'My Bank Tab', 'My Bank වෙත')}
                      </button>
                    </div>
                  )
                ) : boundUsdtAddresses.length > 0 ? (
                  <div>
                    <select
                      value={selectedUsdtId}
                      onChange={(e) => setSelectedUsdtId(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border ${
                        isDark
                          ? 'bg-[#0e1526] border-white/15 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {boundUsdtAddresses.map((b) => (
                        <option key={b.id} value={b.id}>
                          [USDT BEP-20] {b.accountNumber} ({b.accountHolder})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-xs text-rose-400 font-semibold flex items-center justify-between gap-2">
                    <span>
                      {tr(
                        profile,
                        'No USDT (BEP-20) Wallet Address bound yet! You must bind your BEP-20 address below before confirming.',
                        'තවම USDT (BEP-20) ලිපිනයක් සම්බන්ධ කර නැත! තහවුරු කිරීමට පෙර පහතින් ඔබගේ BEP-20 ලිපිනය Bind කරන්න.'
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={onNavigateToMyBank}
                      className="underline text-pink-400 shrink-0 cursor-pointer"
                    >
                      {tr(profile, 'My Bank Tab', 'My Bank වෙත')}
                    </button>
                  </div>
                )}

                {/* Inline Bind Form for Bank or USDT BEP-20 */}
                {showBindForm && (
                  <form
                    onSubmit={handleInlineBindSubmit}
                    className={`p-4 rounded-xl border space-y-3 ${
                      isDark
                        ? 'bg-[#0e1526]/90 border-pink-500/35'
                        : 'bg-white border-pink-200 shadow-sm'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-pink-400 uppercase font-mono">
                      {withdrawType === 'bank'
                        ? tr(
                            profile,
                            'Bind Withdrawal Bank Account Now',
                            'බැංකු ගිණුම දැන් සම්බන්ධ (Bind) කරන්න'
                          )
                        : tr(
                            profile,
                            'Bind USDT (BEP-20) Wallet Address Now',
                            'USDT (BEP-20) ලිපිනය දැන් සම්බන්ධ (Bind) කරන්න'
                          )}
                    </div>

                    {withdrawType === 'bank' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            {tr(profile, 'Bank Name', 'බැංකුවේ නම')}
                          </label>
                          <input
                            type="text"
                            required
                            value={bindBankName}
                            onChange={(e) => setBindBankName(e.target.value)}
                            placeholder="e.g. Bank of Ceylon / Commercial Bank"
                            className={`w-full px-3 py-2 text-xs rounded-lg border ${
                              isDark
                                ? 'bg-[#162038] border-white/15 text-white'
                                : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            {tr(profile, 'Account Holder Name', 'ගිණුම් හිමියාගේ නම')}
                          </label>
                          <input
                            type="text"
                            required
                            value={bindAccountHolder}
                            onChange={(e) => setBindAccountHolder(e.target.value)}
                            placeholder="Full Legal Name"
                            className={`w-full px-3 py-2 text-xs rounded-lg border ${
                              isDark
                                ? 'bg-[#162038] border-white/15 text-white'
                                : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            {tr(profile, 'Bank Account Number', 'බැංකු ගිණුම් අංකය')}
                          </label>
                          <input
                            type="text"
                            required
                            value={bindAccountNumber}
                            onChange={(e) => setBindAccountNumber(e.target.value)}
                            placeholder="Enter Account Number"
                            className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${
                              isDark
                                ? 'bg-[#162038] border-white/15 text-white'
                                : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            {tr(profile, 'Branch / Code', 'ශාඛාව / කේතය')}
                          </label>
                          <input
                            type="text"
                            required
                            value={bindBranchCode}
                            onChange={(e) => setBindBranchCode(e.target.value)}
                            placeholder="Branch Name or Code"
                            className={`w-full px-3 py-2 text-xs rounded-lg border ${
                              isDark
                                ? 'bg-[#162038] border-white/15 text-white'
                                : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold mb-1">
                            {tr(
                              profile,
                              'USDT (BEP-20 / BNB Smart Chain) Wallet Address',
                              'USDT (BEP-20 / BNB Smart Chain) ලිපිනය'
                            )}
                          </label>
                          <input
                            type="text"
                            required
                            value={bindUsdtAddress}
                            onChange={(e) => setBindUsdtAddress(e.target.value)}
                            placeholder="0x... (BNB Smart Chain BEP-20 Address Only)"
                            className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${
                              isDark
                                ? 'bg-[#162038] border-white/15 text-white'
                                : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold mb-1">
                            {tr(profile, 'Wallet Remark / Holder Name', 'Wallet නාමය / ඔබගේ නම')}
                          </label>
                          <input
                            type="text"
                            required
                            value={bindUsdtLabel}
                            onChange={(e) => setBindUsdtLabel(e.target.value)}
                            placeholder="e.g. My Binance BEP-20 Wallet"
                            className={`w-full px-3 py-2 text-xs rounded-lg border ${
                              isDark
                                ? 'bg-[#162038] border-white/15 text-white'
                                : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold mb-1">
                          {tr(profile, 'Security Password (to Bind)', 'ආරක්ෂක මුරපදය (Security Password)')}
                        </label>
                        <input
                          type="password"
                          required
                          value={bindSecPass}
                          onChange={(e) => setBindSecPass(e.target.value)}
                          placeholder="Enter Security Password"
                          className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${
                            isDark
                              ? 'bg-[#162038] border-white/15 text-white'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={bindingSubmitting}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-rose-500 text-white font-bold text-xs cursor-pointer shadow-md shrink-0"
                      >
                        {bindingSubmitting
                          ? tr(profile, 'Binding...', 'සම්බන්ධ වෙමින්...')
                          : withdrawType === 'bank'
                            ? tr(profile, 'Save & Bind Bank', 'බැංකුව Bind කරන්න')
                            : tr(profile, 'Save & Bind BEP-20 Address', 'BEP-20 ලිපිනය Bind කරන්න')}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 4. SELECT AMOUNT & FEE BREAKDOWN FORM */}
              <form onSubmit={handleConfirmWithdrawal} className="space-y-4">
                {withdrawType === 'bank' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {tr(
                          profile,
                          '3. Select Bank Withdrawal Amount (Min 500 LKR · Fee 25 LKR)',
                          '3. ආපසු ගන්නා මුදල තෝරන්න (අවමය රු. 500 LKR · ගාස්තුව රු. 25 LKR)'
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setBankAmountLkr(
                            String(Math.max(BANK_MIN_WITHDRAW_LKR, Math.floor(availableBalanceLkr)))
                          )
                        }
                        className="text-[11px] font-mono font-bold text-pink-400 hover:underline cursor-pointer"
                      >
                        MAX ({formatCurrencyValue(availableBalanceLkr, 'LKR')} LKR)
                      </button>
                    </div>

                    {/* Preset LKR Amount Buttons */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {BANK_WITHDRAW_PRESETS_LKR.map((preset) => {
                        const isSelected = Number(bankAmountLkr) === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setBankAmountLkr(String(preset));
                              setFormError(null);
                            }}
                            className={`py-2.5 px-2 rounded-xl border text-center font-mono text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-pink-500 bg-gradient-to-br from-sky-500/20 via-pink-500/20 to-rose-500/20 text-pink-400 shadow-sm'
                                : isDark
                                  ? 'border-white/10 bg-[#151f36] text-slate-200 hover:border-pink-500/40'
                                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-pink-300'
                            }`}
                          >
                            <div>{preset.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">LKR</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom LKR Input */}
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        {tr(
                          profile,
                          'Or Enter Withdrawal Amount (LKR)',
                          'නැතහොත් මුදල ඇතුළත් කරන්න (LKR)'
                        )}
                      </label>
                      <input
                        type="number"
                        step="1"
                        min={BANK_MIN_WITHDRAW_LKR}
                        required
                        value={bankAmountLkr}
                        onChange={(e) => {
                          setBankAmountLkr(e.target.value);
                          setFormError(null);
                        }}
                        className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold tabular-nums rounded-xl border ${
                          isDark
                            ? 'bg-[#162038] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    {/* Bank Fee & Net Payout Summary Card */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2 text-xs font-mono ${
                        isDark
                          ? 'bg-[#131c31] border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          {tr(profile, 'Selected Withdrawal Amount:', 'තෝරාගත් ආපසු ගැනීමේ මුදල:')}
                        </span>
                        <span className="font-bold">
                          {formatCurrencyValue(parsedBankLkr, 'LKR')} LKR
                          {activeCurrency !== 'LKR' &&
                            ` (≈ ${formatSiteAmount(parsedBankLkr, activeCurrency)})`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          {tr(profile, 'Fixed Bank Withdrawal Fee:', 'ස්ථාවර බැංකු ගාස්තුව:')}
                        </span>
                        <span className="font-bold text-amber-400">
                          - {BANK_WITHDRAW_FEE_LKR} LKR
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                        <span className="font-bold text-emerald-400">
                          {tr(profile, 'Net Amount Received in Bank:', 'බැංකුවට ලැබෙන ශුද්ධ මුදල:')}
                        </span>
                        <span className="font-extrabold text-emerald-400">
                          {formatCurrencyValue(bankNetLkr, 'LKR')} LKR
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {tr(
                          profile,
                          '3. Select USDT BEP-20 Amount (Min 5 USDT · Fee 0.5 USDT)',
                          '3. USDT BEP-20 මුදල තෝරන්න (අවමය 5 USDT · ගාස්තුව 0.5 USDT)'
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setUsdtAmount(
                            String(
                              Math.max(
                                USDT_BEP20_MIN_WITHDRAW_USDT,
                                Number(availableBalanceUsdt.toFixed(2))
                              )
                            )
                          )
                        }
                        className="text-[11px] font-mono font-bold text-emerald-400 hover:underline cursor-pointer"
                      >
                        MAX ({formatCurrencyValue(availableBalanceLkr, 'USDT')} USDT)
                      </button>
                    </div>

                    {/* Preset USDT Amount Buttons */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {USDT_BEP20_WITHDRAW_PRESETS_USDT.map((preset) => {
                        const isSelected = Number(usdtAmount) === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setUsdtAmount(String(preset));
                              setFormError(null);
                            }}
                            className={`py-2.5 px-2 rounded-xl border text-center font-mono text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-sky-500/20 text-emerald-400 shadow-sm'
                                : isDark
                                  ? 'border-white/10 bg-[#151f36] text-slate-200 hover:border-emerald-500/40'
                                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-300'
                            }`}
                          >
                            <div>{preset}</div>
                            <div className="text-[10px] text-slate-400">USDT</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom USDT Input */}
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        {tr(
                          profile,
                          'Or Enter Withdrawal Amount (USDT BEP-20)',
                          'නැතහොත් මුදල ඇතුළත් කරන්න (USDT BEP-20)'
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={USDT_BEP20_MIN_WITHDRAW_USDT}
                        required
                        value={usdtAmount}
                        onChange={(e) => {
                          setUsdtAmount(e.target.value);
                          setFormError(null);
                        }}
                        className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold tabular-nums rounded-xl border ${
                          isDark
                            ? 'bg-[#162038] border-white/15 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    {/* USDT BEP-20 Fee & Net Payout Summary Card */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2 text-xs font-mono ${
                        isDark
                          ? 'bg-[#131c31] border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          {tr(profile, 'Payout Network (Locked):', 'ගෙවීම් ජාලය (ස්ථාවර):')}
                        </span>
                        <span className="font-bold text-emerald-400">
                          USDT BEP-20 (BNB Smart Chain Only)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          {tr(profile, 'Selected Withdrawal Amount:', 'තෝරාගත් ආපසු ගැනීමේ මුදල:')}
                        </span>
                        <span className="font-bold">
                          {parsedUsdt.toFixed(2)} USDT (≈ {formatCurrencyValue(usdtAmountInLkr, 'LKR')}{' '}
                          LKR)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          {tr(profile, 'USDT BEP-20 Network Fee:', 'USDT BEP-20 ජාල ගාස්තුව:')}
                        </span>
                        <span className="font-bold text-amber-400">
                          - {USDT_BEP20_WITHDRAW_FEE_USDT} USDT
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                        <span className="font-bold text-emerald-400">
                          {tr(
                            profile,
                            'Net USDT Received in BEP-20 Wallet:',
                            'BEP-20 ලිපිනයට ලැබෙන ශුද්ධ USDT:'
                          )}
                        </span>
                        <span className="font-extrabold text-emerald-400">
                          {usdtNet.toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Password */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-pink-400" />
                    <span>
                      {tr(
                        profile,
                        '4. Enter Security Password to Confirm',
                        '4. තහවුරු කිරීම සඳහා ආරක්ෂක මුරපදය ඇතුළත් කරන්න'
                      )}
                    </span>
                  </label>
                  <input
                    type="password"
                    required
                    value={securityPassword}
                    onChange={(e) => {
                      setSecurityPassword(e.target.value);
                      setFormError(null);
                    }}
                    placeholder={tr(
                      profile,
                      'Enter your account Security Password',
                      'ඔබගේ ආරක්ෂක මුරපදය ඇතුළත් කරන්න'
                    )}
                    className={`w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border ${
                      isDark
                        ? 'bg-[#162038] border-white/15 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* CONFIRM BUTTON (Enforces KYC Verification & Bound Bank/Address Before Confirm) */}
                <button
                  type="submit"
                  className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all ${
                    isKycVerified && isCurrentTypeBound
                      ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-blue-600 hover:opacity-95 text-white'
                      : 'bg-slate-700/80 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {isKycVerified ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4 text-rose-400" />
                  )}
                  <span>
                    {!isKycVerified
                      ? kycStatusLabel === 'pending'
                        ? tr(
                            profile,
                            'Withdrawal Locked — KYC Processing (Awaiting Admin Verification)',
                            'මුදල් ගැනීම අගුළු දමා ඇත — KYC Admin පරීක්ෂාවේ පවතී'
                          )
                        : tr(
                            profile,
                            'Withdrawal Locked — Admin KYC Verification Required First',
                            'මුදල් ගැනීම අගුළු දමා ඇත — පළමුව Admin KYC සත්‍යාපනය කරන්න'
                          )
                      : !isCurrentTypeBound
                        ? withdrawType === 'bank'
                          ? tr(
                              profile,
                              'Must Bind Bank Account Above Before Confirming',
                              'තහවුරු කිරීමට පෙර ඉහතින් බැංකු ගිණුම Bind කරන්න'
                            )
                          : tr(
                              profile,
                              'Must Bind USDT (BEP-20) Address Above Before Confirming',
                              'තහවුරු කිරීමට පෙර ඉහතින් USDT (BEP-20) ලිපිනය Bind කරන්න'
                            )
                        : withdrawType === 'bank'
                          ? tr(
                              profile,
                              `Confirm Bank Withdrawal (${formatCurrencyValue(parsedBankLkr, 'LKR')} LKR · Fee 25 LKR)`,
                              `බැංකු ආපසු ගැනීම තහවුරු කරන්න (${formatCurrencyValue(parsedBankLkr, 'LKR')} LKR · ගාස්තුව 25 LKR)`
                            )
                          : tr(
                              profile,
                              `Confirm USDT BEP-20 Withdrawal (${parsedUsdt} USDT · Fee 0.5 USDT)`,
                              `USDT BEP-20 ආපසු ගැනීම තහවුරු කරන්න (${parsedUsdt} USDT · ගාස්තුව 0.5 USDT)`
                            )}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 2: LOADING / PROCESSING ================= */}
          {step === 'loading' && (
            <div className="py-14 px-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl mx-auto bg-gradient-to-br from-rose-500 via-pink-500 to-blue-600 flex items-center justify-center text-white shadow-xl">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-mono uppercase tracking-widest text-pink-400 font-bold">
                  {tr(profile, 'VERIFYING & SUBMITTING WITHDRAWAL', 'මුදල් ආපසු ගැනීම පරීක්ෂා කරමින්...')}
                </div>
                <h4 className="text-lg font-extrabold font-display">
                  {withdrawType === 'bank'
                    ? tr(
                        profile,
                        `Submitting ${formatCurrencyValue(parsedBankLkr, 'LKR')} LKR Bank Withdrawal (Fee: 25 LKR)...`,
                        `රු. ${formatCurrencyValue(parsedBankLkr, 'LKR')} LKR බැංකු ආපසු ගැනීම යොමු කරමින් (ගාස්තුව: 25 LKR)...`
                      )
                    : tr(
                        profile,
                        `Submitting ${parsedUsdt} USDT (BEP-20) Withdrawal (Fee: 0.5 USDT)...`,
                        `${parsedUsdt} USDT (BEP-20) ආපසු ගැනීම යොමු කරමින් (ගාස්තුව: 0.5 USDT)...`
                      )}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {tr(
                    profile,
                    'Validating bound payout destination, locking withdrawal balance, and routing request for Admin Approval...',
                    'සම්බන්ධ කළ ගිණුම් විස්තර තහවුරු කර පරිපාලක (Admin) අනුමැතිය සඳහා යොමු කරමින් පවතී...'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PENDING ADMIN APPROVE ================= */}
          {step === 'pending_admin' && submittedRecord && (
            <div className="space-y-5">
              <div
                className={`p-6 rounded-3xl border text-center space-y-4 ${
                  isDark
                    ? 'bg-gradient-to-b from-amber-500/10 via-[#141f36] to-[#121829] border-amber-500/40'
                    : 'bg-gradient-to-b from-amber-50 via-white to-pink-50 border-amber-300'
                }`}
              >
                <div className="w-16 h-16 rounded-3xl mx-auto bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-extrabold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {tr(
                        profile,
                        'STATUS: PENDING ADMIN APPROVE',
                        'තත්ත්වය: PENDING ADMIN APPROVE (පරිපාලක අනුමැතිය බලාපොරොත්තුවෙන්)'
                      )}
                    </span>
                  </span>
                  <h4 className="text-xl font-extrabold font-display pt-1">
                    {tr(
                      profile,
                      'Withdrawal Request Submitted Successfully!',
                      'මුදල් ආපසු ගැනීමේ ඉල්ලීම සාර්ථකව යොමු කරන ලදී!'
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                    {tr(
                      profile,
                      'Your withdrawal request is now Pending Admin Approval. Once the administrator verifies and approves your request, the net payout will be released to your bound destination.',
                      'ඔබගේ මුදල් ආපසු ගැනීමේ ඉල්ලීම දැන් පරිපාලක අනුමැතිය (Pending Admin Approve) සඳහා යොමු කර ඇත. අනුමත වූ වහාම ඔබගේ ගිණුමට මුදල් බැර කෙරේ.'
                    )}
                  </p>
                </div>

                {/* Summary Receipt */}
                <div
                  className={`p-4 rounded-2xl border text-left grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${
                    isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Reference ID
                    </div>
                    <div className="font-mono font-bold text-pink-400 mt-0.5">
                      {submittedRecord.referenceCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Withdrawal Type
                    </div>
                    <div className="font-bold mt-0.5">
                      {submittedRecord.withdrawType === 'bank'
                        ? 'Bank Transfer (LKR)'
                        : 'USDT BEP-20 (BNB Smart Chain)'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Withdrawal Amount & Fee
                    </div>
                    <div className="font-mono font-bold mt-0.5">
                      {submittedRecord.amountInDisplayUnit} {submittedRecord.displayUnit} (Fee:{' '}
                      {submittedRecord.feeInDisplayUnit} {submittedRecord.displayUnit})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Net Payout Amount
                    </div>
                    <div className="font-mono font-extrabold text-emerald-400 mt-0.5">
                      {submittedRecord.netAmountInDisplayUnit} {submittedRecord.displayUnit}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Bound Destination ({submittedRecord.networkOrBankName})
                    </div>
                    <div className="font-mono font-bold text-sky-400 break-all mt-0.5">
                      {submittedRecord.accountNumberOrAddress} ({submittedRecord.accountHolderOrLabel})
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRecord(null);
                      setStep('configure');
                    }}
                    className="px-5 py-2.5 rounded-xl border border-pink-500/40 text-pink-400 hover:bg-pink-500/10 text-xs font-bold cursor-pointer"
                  >
                    {tr(profile, 'New Withdrawal Request', 'තවත් ආපසු ගැනීමක්')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-rose-500 text-white text-xs font-extrabold cursor-pointer shadow-md"
                  >
                    {tr(profile, 'Done & Return', 'අවසන් කර ආපසු යන්න')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= RECENT WITHDRAWAL REQUESTS (PENDING ADMIN APPROVE) ================= */}
          {recentWithdrawals.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {tr(
                    profile,
                    `Recent Withdrawal Requests (${recentWithdrawals.length})`,
                    `මෑත මුදල් ආපසු ගැනීමේ ඉල්ලීම් (${recentWithdrawals.length})`
                  )}
                </span>
                <span className="text-[11px] font-mono text-amber-400">
                  {tr(profile, 'Admin Verification Queue', 'Admin අනුමැතිය සඳහා')}
                </span>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {recentWithdrawals.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                      isDark
                        ? 'bg-[#131c31] border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-pink-400">
                          {item.referenceCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono font-bold">
                          {item.withdrawType === 'bank' ? 'BANK (LKR)' : 'USDT (BEP-20)'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                        {item.networkOrBankName} · {item.accountNumberOrAddress}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-extrabold text-emerald-400">
                        Net: {item.netAmountInDisplayUnit} {item.displayUnit}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Fee {item.feeInDisplayUnit} {item.displayUnit})
                        </span>
                      </div>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.status === 'approved'
                            ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                            : item.status === 'rejected'
                              ? 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                              : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                        }`}
                      >
                        {item.status === 'approved'
                          ? 'APPROVED BY ADMIN'
                          : item.status === 'rejected'
                            ? 'REJECTED (REFUNDED)'
                            : 'PENDING ADMIN APPROVE'}
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
