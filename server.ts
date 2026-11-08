import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Server-side 1-Account-Per-Device Registry (tracks deviceId, macAddress, ipAddress, clientIp, location, and hardwareSummary across all browsers & Incognito tabs)
interface RegisteredDeviceEntry {
  uid: string;
  username: string;
  email?: string;
  deviceId: string;
  macAddress: string;
  ipAddress: string;
  clientIp: string;
  location: string;
  hardwareSummary: string;
  registeredAt: string;
}

const DEVICE_LOCKS_FILE = path.join(__dirname, '.zentro_device_locks.json');
const serverDeviceRegistry = new Map<string, RegisteredDeviceEntry>();

function loadDeviceRegistryFromDisk(): void {
  try {
    if (fs.existsSync(DEVICE_LOCKS_FILE)) {
      const raw = fs.readFileSync(DEVICE_LOCKS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.uid) {
            serverDeviceRegistry.set(item.uid, item);
          }
        }
      }
    }
  } catch {
    // ignore read errors
  }
}

function saveDeviceRegistryToDisk(): void {
  try {
    const list = Array.from(serverDeviceRegistry.values());
    fs.writeFileSync(DEVICE_LOCKS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch {
    // ignore write errors
  }
}

loadDeviceRegistryFromDisk();

function extractClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim().length > 0) {
    return realIp.trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function getServerNetworkMac(): string | null {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          return net.mac.toUpperCase();
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function isMeaningfulIp(ip?: string): boolean {
  if (!ip) return false;
  const clean = ip.trim();
  return (
    clean.length > 0 &&
    clean !== 'Detecting IP...' &&
    clean !== 'Tracked IP'
  );
}

function findMatchingDeviceLock(params: {
  deviceId?: string;
  macAddress?: string;
  ipAddress?: string;
  clientIp?: string;
  location?: string;
  hardwareSummary?: string;
}): RegisteredDeviceEntry | null {
  const { deviceId, macAddress, ipAddress, clientIp, location, hardwareSummary } = params;
  for (const entry of serverDeviceRegistry.values()) {
    const sameDeviceId = Boolean(deviceId && entry.deviceId && entry.deviceId === deviceId);
    const sameMac = Boolean(macAddress && entry.macAddress && entry.macAddress === macAddress);
    const samePublicIp = Boolean(
      isMeaningfulIp(ipAddress) &&
        isMeaningfulIp(entry.ipAddress) &&
        entry.ipAddress === ipAddress!.trim()
    );
    const sameClientIp = Boolean(
      isMeaningfulIp(clientIp) &&
        isMeaningfulIp(entry.clientIp) &&
        entry.clientIp === clientIp!.trim()
    );
    const sameLocationAndHardware = Boolean(
      location &&
        entry.location &&
        entry.location === location &&
        hardwareSummary &&
        entry.hardwareSummary &&
        entry.hardwareSummary === hardwareSummary
    );

    if (
      sameDeviceId ||
      sameMac ||
      samePublicIp ||
      sameClientIp ||
      sameLocationAndHardware
    ) {
      return entry;
    }
  }
  return null;
}

app.get('/api/security/device-telemetry', (req, res) => {
  const ipAddress = extractClientIp(req);
  const acceptLanguage = req.headers['accept-language'] || 'en-US';
  const serverMac = getServerNetworkMac();
  res.json({
    ipAddress,
    acceptLanguage,
    serverMac,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/security/check-device', (req, res) => {
  const { deviceId, macAddress, ipAddress, location, hardwareSummary } = req.body || {};
  const clientIp = extractClientIp(req);
  const matched = findMatchingDeviceLock({
    deviceId,
    macAddress,
    ipAddress,
    clientIp,
    location,
    hardwareSummary,
  });
  if (matched) {
    res.json({
      locked: true,
      existingUsername: matched.username,
      existingUid: matched.uid,
      entry: matched,
    });
    return;
  }
  res.json({ locked: false });
});

app.post('/api/security/register-device', (req, res) => {
  const {
    uid,
    username,
    email,
    deviceId,
    macAddress,
    ipAddress,
    locationTracked,
    location,
    hardwareSummary,
  } = req.body || {};
  const clientIp = extractClientIp(req);
  const effectiveIp = isMeaningfulIp(ipAddress) ? String(ipAddress).trim() : clientIp;
  const effectiveLocation = String(locationTracked || location || 'Tracked Region');

  const matched = findMatchingDeviceLock({
    deviceId,
    macAddress,
    ipAddress: effectiveIp,
    clientIp,
    location: effectiveLocation,
    hardwareSummary,
  });

  if (matched && matched.uid !== uid && matched.username?.toLowerCase() !== String(username || '').toLowerCase()) {
    res.status(409).json({
      locked: true,
      existingUsername: matched.username,
      existingAccount: matched,
      entry: matched,
      error: `Only 1 account is permitted per device, IP, MAC, and location (Cross-Browser & Incognito Protected). This device (Device: ${matched.deviceId} · MAC: ${matched.macAddress} · IP: ${matched.ipAddress} · Location: ${matched.location}) is already registered to "${matched.username}".`,
    });
    return;
  }

  const record: RegisteredDeviceEntry = {
    uid: String(uid || matched?.uid || 'unknown'),
    username: String(username || matched?.username || 'member'),
    email: String(email || matched?.email || ''),
    deviceId: String(deviceId || matched?.deviceId || 'ZNT-DEV-DEFAULT'),
    macAddress: String(macAddress || matched?.macAddress || '00:1A:2B:3C:4D:5E'),
    ipAddress: String(effectiveIp),
    clientIp: String(clientIp),
    location: effectiveLocation,
    hardwareSummary: String(hardwareSummary || matched?.hardwareSummary || ''),
    registeredAt: matched?.registeredAt || new Date().toISOString(),
  };

  serverDeviceRegistry.set(record.uid, record);
  saveDeviceRegistryToDisk();
  res.json({ ok: true, record });
});

app.post('/api/security/delete-device', (req, res) => {
  const { uid, username } = req.body || {};
  let removedCount = 0;
  for (const [key, entry] of serverDeviceRegistry.entries()) {
    const matchUid = Boolean(uid && (key === uid || entry.uid === uid));
    const matchUsername = Boolean(
      username &&
        entry.username &&
        entry.username.toLowerCase() === String(username).trim().toLowerCase()
    );
    if (matchUid || matchUsername) {
      serverDeviceRegistry.delete(key);
      removedCount++;
    }
  }
  if (removedCount > 0) {
    saveDeviceRegistryToDisk();
  }
  res.json({ ok: true, removedCount });
});

// ============================================================================
// CENTRAL PERSISTENT DATABASE ENGINE (Cross-Device Login, 5-Level Referrals, Admin Sync)
// ============================================================================
interface CentralDatabaseSchema {
  accounts: Record<string, { profile: any; password: string }>;
  transactions: Record<string, any[]>;
  bankAccounts: Record<string, any[]>;
  kycRecords: Record<string, any>;
  referrals: Record<string, any[]>;
  depositRequests: Record<string, any[]>;
  withdrawalRequests: Record<string, any[]>;
  notifications: Record<string, any[]>;
  globalBroadcasts: any[];
  catalogs: {
    sponsorCountries?: any[];
    sponsorGlobalStats?: {
      totalMembersCount: number;
      totalInvestingLkr: number;
      totalPayoutLkr: number;
      updatedAt?: string;
    };
    vipTiers?: any[];
    platformTasks?: any[];
    vipDayChallenges?: any[];
    officialDepositBanks?: any[];
    officialUsdtAddresses?: any[];
  };
  deletedUids: string[];
  updatedAt: string;
}

const CENTRAL_DB_FILE = path.join(__dirname, 'zentro_central_database.json');

let centralDb: CentralDatabaseSchema = {
  accounts: {},
  transactions: {},
  bankAccounts: {},
  kycRecords: {},
  referrals: {},
  depositRequests: {},
  withdrawalRequests: {},
  notifications: {},
  globalBroadcasts: [],
  catalogs: {},
  deletedUids: [],
  updatedAt: new Date().toISOString(),
};

function loadCentralDbFromDisk(): void {
  try {
    if (fs.existsSync(CENTRAL_DB_FILE)) {
      const raw = fs.readFileSync(CENTRAL_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        centralDb = {
          accounts: parsed.accounts || {},
          transactions: parsed.transactions || {},
          bankAccounts: parsed.bankAccounts || {},
          kycRecords: parsed.kycRecords || {},
          referrals: parsed.referrals || {},
          depositRequests: parsed.depositRequests || {},
          withdrawalRequests: parsed.withdrawalRequests || {},
          notifications: parsed.notifications || {},
          globalBroadcasts: Array.isArray(parsed.globalBroadcasts) ? parsed.globalBroadcasts : [],
          catalogs: parsed.catalogs || {},
          deletedUids: Array.isArray(parsed.deletedUids) ? parsed.deletedUids : [],
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    // ignore read error
  }
}

function saveCentralDbToDisk(): void {
  try {
    centralDb.updatedAt = new Date().toISOString();
    fs.writeFileSync(CENTRAL_DB_FILE, JSON.stringify(centralDb, null, 2), 'utf-8');
  } catch {
    // ignore write error
  }
}

loadCentralDbFromDisk();

function mergeRecordArraysById(existing: any[] = [], incoming: any[] = []): any[] {
  const map = new Map<string, any>();
  for (const item of existing) {
    if (item && item.id) {
      map.set(String(item.id), item);
    }
  }
  for (const item of incoming) {
    if (item && item.id) {
      const prev = map.get(String(item.id));
      map.set(String(item.id), prev ? { ...prev, ...item } : item);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const tA = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const tB = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return tB - tA;
  });
}

function normalizeReferralCodeKey(raw: unknown): string {
  const str = String(raw || '').trim();
  if (!str) return '';
  try {
    if (str.includes('?') || str.includes('ref=') || str.includes('invite=') || str.includes('code=')) {
      const m = str.match(/[?&](?:ref|invite|code)=([A-Za-z0-9_-]+)/i);
      if (m && m[1]) return m[1].trim().toUpperCase();
    }
  } catch {
    // ignore
  }
  return str.toUpperCase();
}

function normalizePhoneCore(rawMobile: unknown, rawCountryCode?: unknown): string {
  let digits = String(rawMobile || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  const ccDigits = String(rawCountryCode || '').replace(/[^0-9]/g, '');
  if (ccDigits && digits.startsWith(ccDigits) && digits.length > ccDigits.length + 5) {
    digits = digits.slice(ccDigits.length);
  }
  digits = digits.replace(/^0+/, '');
  return digits;
}

function getServerFriendRegBonusForVip(vipLevel: number): number {
  const lvl = Number(vipLevel) || 0;
  if (lvl === 1) return 10;
  if (lvl === 2) return 30;
  if (lvl === 3) return 50;
  if (lvl >= 4) return 100;
  return 0;
}

function getServerCommissionRatesForVip(
  vipLevel: number
): { level: number; ratePercent: number; rate: number }[] {
  const lvl = Number(vipLevel) || 0;
  if (lvl === 1) {
    return [
      { level: 1, ratePercent: 10, rate: 0.1 },
      { level: 2, ratePercent: 6, rate: 0.06 },
      { level: 3, ratePercent: 2, rate: 0.02 },
      { level: 4, ratePercent: 1, rate: 0.01 },
      { level: 5, ratePercent: 1, rate: 0.01 },
    ];
  }
  if (lvl === 2) {
    return [
      { level: 1, ratePercent: 15, rate: 0.15 },
      { level: 2, ratePercent: 10, rate: 0.1 },
      { level: 3, ratePercent: 6, rate: 0.06 },
      { level: 4, ratePercent: 2, rate: 0.02 },
      { level: 5, ratePercent: 1, rate: 0.01 },
    ];
  }
  if (lvl === 3) {
    return [
      { level: 1, ratePercent: 20, rate: 0.2 },
      { level: 2, ratePercent: 12, rate: 0.12 },
      { level: 3, ratePercent: 8, rate: 0.08 },
      { level: 4, ratePercent: 3, rate: 0.03 },
      { level: 5, ratePercent: 1, rate: 0.01 },
    ];
  }
  if (lvl >= 4) {
    return [
      { level: 1, ratePercent: 25, rate: 0.25 },
      { level: 2, ratePercent: 16, rate: 0.16 },
      { level: 3, ratePercent: 12, rate: 0.12 },
      { level: 4, ratePercent: 5, rate: 0.05 },
      { level: 5, ratePercent: 3, rate: 0.03 },
    ];
  }
  return [
    { level: 1, ratePercent: 0, rate: 0 },
    { level: 2, ratePercent: 0, rate: 0 },
    { level: 3, ratePercent: 0, rate: 0 },
    { level: 4, ratePercent: 0, rate: 0 },
    { level: 5, ratePercent: 0, rate: 0 },
  ];
}

// Automatically reconcile 5-level referral downlines across all accounts in centralDb
function reconcileCentralFiveLevelReferrals(): void {
  const deletedSet = new Set(centralDb.deletedUids || []);
  const allEntries = Object.values(centralDb.accounts).filter(
    (entry) => entry && entry.profile && entry.profile.uid && !deletedSet.has(entry.profile.uid)
  );

  const byRefCode = new Map<string, { profile: any; password: string }>();
  for (const entry of allEntries) {
    const code = normalizeReferralCodeKey(entry.profile.referralCode);
    if (code) {
      byRefCode.set(code, entry);
      if (code.startsWith('ZENTRO-')) {
        byRefCode.set(code.slice(7), entry);
      } else {
        byRefCode.set(`ZENTRO-${code}`, entry);
      }
    }
  }

  for (const memberEntry of allEntries) {
    const member = memberEntry.profile;
    let currentCode = normalizeReferralCodeKey(member.referredBy);
    const visitedUids = new Set<string>([member.uid]);

    for (let level = 1; level <= 5; level++) {
      if (!currentCode) break;
      const uplineEntry = byRefCode.get(currentCode);
      if (!uplineEntry || !uplineEntry.profile) break;
      const upline = uplineEntry.profile;
      if (visitedUids.has(upline.uid)) break;
      visitedUids.add(upline.uid);

      const uplineRefs: any[] = Array.isArray(centralDb.referrals[upline.uid])
        ? [...centralDb.referrals[upline.uid]]
        : [];
      const uplineTx: any[] = Array.isArray(centralDb.transactions[upline.uid])
        ? [...centralDb.transactions[upline.uid]]
        : [];
      const uplineNotifs: any[] = Array.isArray(centralDb.notifications[upline.uid])
        ? [...centralDb.notifications[upline.uid]]
        : [];

      // Check if L1 registration bonus should be credited to upline
      const regBonusTxId = `tx_reg_bonus_${member.uid}_L1`;
      const alreadyHasRegBonusTx = uplineTx.some((tx) => tx && tx.id === regBonusTxId);
      let l1BonusToCredit = 0;

      if (level === 1 && Number(upline.vipLevel || 0) >= 1 && !alreadyHasRegBonusTx) {
        l1BonusToCredit = getServerFriendRegBonusForVip(Number(upline.vipLevel || 0));
        if (l1BonusToCredit > 0) {
          upline.balance = Number((Number(upline.balance || 0) + l1BonusToCredit).toFixed(2));
          upline.totalEarnings = Number(
            (Number(upline.totalEarnings || 0) + l1BonusToCredit).toFixed(2)
          );
          upline.updatedAt = new Date().toISOString();

          uplineTx.unshift({
            id: regBonusTxId,
            userId: upline.uid,
            type: 'referral_bonus',
            amount: l1BonusToCredit,
            status: 'completed',
            description: `L1 Friend Registration Bonus (+${l1BonusToCredit} LKR — ${member.username})`,
            createdAt: member.createdAt || new Date().toISOString(),
          });
          centralDb.transactions[upline.uid] = uplineTx;

          const notifId = `notif_reg_${upline.uid}_${member.uid}_L1`;
          if (!uplineNotifs.some((n) => n && n.id === notifId)) {
            uplineNotifs.unshift({
              id: notifId,
              userId: upline.uid,
              title: `New L1 Friend Registered: +${l1BonusToCredit} LKR Bonus!`,
              titleSi: `නව L1 මිතුරෙකු ලියාපදිංචි විය: +${l1BonusToCredit} LKR ප්‍රසාද දීමනාව!`,
              message: `${member.username} registered using your referral code (${upline.referralCode}). +${l1BonusToCredit} LKR has been credited to your wallet.`,
              messageSi: `${member.username} ඔබගේ යොමු කේතය (${upline.referralCode}) භාවිතා කර ලියාපදිංචි විය. +${l1BonusToCredit} LKR ඔබගේ ගිණුමට එක් කරන ලදී.`,
              category: 'referral',
              priority: 'high',
              read: false,
              actionTab: 'team',
              actionLabel: 'View Team',
              actionLabelSi: 'කණ්ඩායම බලන්න',
              createdAt: member.createdAt || new Date().toISOString(),
            });
            centralDb.notifications[upline.uid] = uplineNotifs;
          }
        }
      } else if (level > 1) {
        const notifId = `notif_reg_${upline.uid}_${member.uid}_L${level}`;
        if (!uplineNotifs.some((n) => n && n.id === notifId)) {
          uplineNotifs.unshift({
            id: notifId,
            userId: upline.uid,
            title: `New Level ${level} Team Member Joined: ${member.username}`,
            titleSi: `නව මට්ටම ${level} (L${level}) සාමාජිකයෙකු එක් විය: ${member.username}`,
            message: `${member.username} joined your Level ${level} referral network. You will earn L${level} commissions when they activate VIP or deposit!`,
            messageSi: `${member.username} ඔබගේ L${level} කණ්ඩායමට එක් විය. ඔවුන් VIP සක්‍රිය කරන විට හෝ තැන්පත් කරන විට ඔබට L${level} කොමිස් හිමිවේ!`,
            category: 'referral',
            priority: 'normal',
            read: false,
            actionTab: 'team',
            actionLabel: 'Open Team Tree',
            actionLabelSi: 'කණ්ඩායම බලන්න',
            createdAt: member.createdAt || new Date().toISOString(),
          });
          centralDb.notifications[upline.uid] = uplineNotifs;
        }
      }

      // Check if this downline member already has entries at this tierLevel
      let foundEntryAtLevel = false;
      for (let i = 0; i < uplineRefs.length; i++) {
        const r = uplineRefs[i];
        if (
          r &&
          String(r.referredUsername || '').toLowerCase() ===
            String(member.username || '').toLowerCase() &&
          Number(r.tierLevel) === level
        ) {
          foundEntryAtLevel = true;
          const updatedVip = Math.max(Number(r.vipLevel || 0), Number(member.vipLevel || 0));
          const updatedComm =
            r.id === `ref_tree_${upline.uid}_${member.uid}_L1` && l1BonusToCredit > 0
              ? Math.max(Number(r.commissionEarned || 0), l1BonusToCredit)
              : Number(r.commissionEarned || 0);
          uplineRefs[i] = {
            ...r,
            vipLevel: updatedVip,
            commissionEarned: updatedComm,
          };
        }
      }

      if (!foundEntryAtLevel) {
        const regTx = uplineTx.find((tx) => tx && tx.id === regBonusTxId);
        uplineRefs.unshift({
          id: `ref_tree_${upline.uid}_${member.uid}_L${level}`,
          referrerUid: upline.uid,
          referredUsername: member.username,
          referralCodeUsed: upline.referralCode,
          tierLevel: level,
          vipLevel: Number(member.vipLevel || 0),
          commissionEarned: level === 1 ? Number(regTx?.amount || l1BonusToCredit || 0) : 0,
          createdAt: member.createdAt || new Date().toISOString(),
        });
      }

      centralDb.referrals[upline.uid] = uplineRefs;
      currentCode = normalizeReferralCodeKey(upline.referredBy);
    }
  }
}

app.get('/api/db/state', (_req, res) => {
  reconcileCentralFiveLevelReferrals();
  res.json({
    ok: true,
    db: centralDb,
  });
});

app.post('/api/db/register', (req, res) => {
  try {
    const { profile, password, welcomeTx } = req.body || {};
    if (!profile || !profile.uid || !profile.username) {
      res.status(400).json({ error: 'Invalid registration profile payload.' });
      return;
    }

    reconcileCentralFiveLevelReferrals();
    const deletedSet = new Set<string>(centralDb.deletedUids || []);

    const cleanUsername = String(profile.username || '').trim().toLowerCase();
    const cleanEmail = String(profile.email || '').trim().toLowerCase();

    const duplicate = Object.values(centralDb.accounts).find(
      (acc) =>
        acc &&
        acc.profile &&
        !deletedSet.has(acc.profile.uid) &&
        acc.profile.uid !== profile.uid &&
        (String(acc.profile.username || '').trim().toLowerCase() === cleanUsername ||
          String(acc.profile.email || '').trim().toLowerCase() === cleanEmail)
    );
    if (duplicate) {
      res.status(409).json({
        error: 'An account with this user name or email already exists. Please Sign in.',
      });
      return;
    }

    const normalizedReferredBy = normalizeReferralCodeKey(profile.referredBy);
    const savedProfile = {
      ...profile,
      referredBy: normalizedReferredBy || profile.referredBy,
      updatedAt: new Date().toISOString(),
    };

    centralDb.accounts[profile.uid] = {
      profile: savedProfile,
      password: String(password || 'zentro123'),
    };

    if (welcomeTx && welcomeTx.id) {
      centralDb.transactions[profile.uid] = mergeRecordArraysById(
        centralDb.transactions[profile.uid] || [],
        [welcomeTx]
      );
    } else if (!centralDb.transactions[profile.uid]) {
      centralDb.transactions[profile.uid] = [];
    }

    if (!centralDb.bankAccounts[profile.uid]) centralDb.bankAccounts[profile.uid] = [];
    if (!centralDb.referrals[profile.uid]) centralDb.referrals[profile.uid] = [];
    if (!centralDb.notifications[profile.uid]) centralDb.notifications[profile.uid] = [];

    reconcileCentralFiveLevelReferrals();
    saveCentralDbToDisk();

    res.json({
      ok: true,
      uid: profile.uid,
      account: centralDb.accounts[profile.uid],
      db: centralDb,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to register user in central database.' });
  }
});

app.post('/api/db/distribute-commissions', (req, res) => {
  try {
    const {
      eventId,
      memberProfile,
      amountLkr = 0,
      sourceLabel = 'Deposit / VIP Activation',
      payCommissions = true,
    } = req.body || {};

    if (!memberProfile || !memberProfile.uid) {
      res.status(400).json({ error: 'Missing memberProfile.' });
      return;
    }

    const existingMemberEntry = centralDb.accounts[memberProfile.uid];
    if (existingMemberEntry) {
      centralDb.accounts[memberProfile.uid] = {
        ...existingMemberEntry,
        profile: {
          ...existingMemberEntry.profile,
          ...memberProfile,
          highestVipLevel: Math.max(
            Number(existingMemberEntry.profile?.highestVipLevel || 0),
            Number(memberProfile.highestVipLevel || 0),
            Number(memberProfile.vipLevel || 0)
          ),
          updatedAt: new Date().toISOString(),
        },
      };
    }

    const deletedSet = new Set<string>(centralDb.deletedUids || []);
    const allEntries = Object.values(centralDb.accounts).filter(
      (entry) => entry && entry.profile && entry.profile.uid && !deletedSet.has(entry.profile.uid)
    );
    const byRefCode = new Map<string, { profile: any; password: string }>();
    for (const entry of allEntries) {
      const code = normalizeReferralCodeKey(entry.profile.referralCode);
      if (code) {
        byRefCode.set(code, entry);
        if (code.startsWith('ZENTRO-')) {
          byRefCode.set(code.slice(7), entry);
        } else {
          byRefCode.set(`ZENTRO-${code}`, entry);
        }
      }
    }

    const cleanEventKey = String(eventId || `${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');
    let currentCode = normalizeReferralCodeKey(memberProfile.referredBy);
    const visitedUids = new Set<string>([memberProfile.uid]);

    for (let tierLevel = 1; tierLevel <= 5; tierLevel++) {
      if (!currentCode) break;
      const uplineEntry = byRefCode.get(currentCode);
      if (!uplineEntry || !uplineEntry.profile) break;
      const uplineProfile = uplineEntry.profile;
      if (visitedUids.has(uplineProfile.uid)) break;
      visitedUids.add(uplineProfile.uid);

      const uplineRefs: any[] = Array.isArray(centralDb.referrals[uplineProfile.uid])
        ? [...centralDb.referrals[uplineProfile.uid]]
        : [];

      let foundMemberInRefs = false;
      const updatedUplineRefs = uplineRefs.map((r) => {
        if (
          r &&
          String(r.referredUsername || '').toLowerCase() ===
            String(memberProfile.username || '').toLowerCase() &&
          Number(r.tierLevel) === tierLevel
        ) {
          foundMemberInRefs = true;
          return {
            ...r,
            vipLevel: Math.max(Number(r.vipLevel || 0), Number(memberProfile.vipLevel || 0)),
          };
        }
        return r;
      });

      let commissionLkr = 0;
      let ratePercent = 0;
      if (payCommissions && Number(amountLkr) > 0 && Number(uplineProfile.vipLevel || 0) >= 1) {
        const commLevels = getServerCommissionRatesForVip(Number(uplineProfile.vipLevel || 0));
        const rateObj = commLevels.find((l) => l.level === tierLevel);
        if (rateObj && rateObj.rate > 0) {
          ratePercent = rateObj.ratePercent;
          commissionLkr = Number((Number(amountLkr) * rateObj.rate).toFixed(2));
        }
      }

      const commTxId = `tx_ref_comm_${cleanEventKey}_${memberProfile.uid}_L${tierLevel}`;
      const commRefId = `ref_comm_${cleanEventKey}_${memberProfile.uid}_L${tierLevel}`;
      const uplineTxList: any[] = Array.isArray(centralDb.transactions[uplineProfile.uid])
        ? [...centralDb.transactions[uplineProfile.uid]]
        : [];
      const alreadyCredited = uplineTxList.some((tx) => tx && tx.id === commTxId);

      if (commissionLkr > 0 && !alreadyCredited) {
        uplineProfile.balance = Number(
          (Number(uplineProfile.balance || 0) + commissionLkr).toFixed(2)
        );
        uplineProfile.totalEarnings = Number(
          (Number(uplineProfile.totalEarnings || 0) + commissionLkr).toFixed(2)
        );
        uplineProfile.updatedAt = new Date().toISOString();

        uplineTxList.unshift({
          id: commTxId,
          userId: uplineProfile.uid,
          type: 'referral_bonus',
          amount: commissionLkr,
          status: 'completed',
          description: `L${tierLevel} (${ratePercent}%) ${sourceLabel} Bonus from ${memberProfile.username}`,
          createdAt: new Date().toISOString(),
        });
        centralDb.transactions[uplineProfile.uid] = uplineTxList;

        if (!updatedUplineRefs.some((r) => r && r.id === commRefId)) {
          updatedUplineRefs.unshift({
            id: commRefId,
            referrerUid: uplineProfile.uid,
            referredUsername: memberProfile.username,
            referralCodeUsed: uplineProfile.referralCode,
            tierLevel,
            vipLevel: Number(memberProfile.vipLevel || 0),
            commissionEarned: commissionLkr,
            createdAt: new Date().toISOString(),
          });
        }

        const uplineNotifs: any[] = Array.isArray(centralDb.notifications[uplineProfile.uid])
          ? [...centralDb.notifications[uplineProfile.uid]]
          : [];
        uplineNotifs.unshift({
          id: `notif_comm_${cleanEventKey}_${memberProfile.uid}_L${tierLevel}`,
          userId: uplineProfile.uid,
          title: `Level ${tierLevel} Commission Earned: +${commissionLkr} LKR`,
          titleSi: `මට්ටම ${tierLevel} කොමිස් මුදලක් ලැබුණි: +${commissionLkr} LKR`,
          message: `You earned a ${ratePercent}% Level ${tierLevel} commission (+${commissionLkr} LKR) from ${memberProfile.username} (${sourceLabel}).`,
          messageSi: `ඔබගේ කණ්ඩායම් සාමාජික ${memberProfile.username} ගෙන් ${ratePercent}% (මට්ටම ${tierLevel}) කොමිස් මුදලක් (+${commissionLkr} LKR) ඔබගේ ගිණුමට එක් විය.`,
          category: 'referral',
          priority: 'high',
          read: false,
          actionTab: 'team',
          actionLabel: 'View Team Earnings',
          actionLabelSi: 'කණ්ඩායම් ආදායම බලන්න',
          createdAt: new Date().toISOString(),
        });
        centralDb.notifications[uplineProfile.uid] = uplineNotifs;
      } else if (!foundMemberInRefs) {
        updatedUplineRefs.unshift({
          id: `ref_tree_${uplineProfile.uid}_${memberProfile.uid}_L${tierLevel}`,
          referrerUid: uplineProfile.uid,
          referredUsername: memberProfile.username,
          referralCodeUsed: uplineProfile.referralCode,
          tierLevel,
          vipLevel: Number(memberProfile.vipLevel || 0),
          commissionEarned: 0,
          createdAt: new Date().toISOString(),
        });
      }

      centralDb.referrals[uplineProfile.uid] = updatedUplineRefs;
      currentCode = normalizeReferralCodeKey(uplineProfile.referredBy);
    }

    reconcileCentralFiveLevelReferrals();
    saveCentralDbToDisk();

    res.json({
      ok: true,
      db: centralDb,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to distribute commissions.' });
  }
});

app.post('/api/db/sync', (req, res) => {
  try {
    const payload = req.body || {};
    const deletedSet = new Set<string>(centralDb.deletedUids || []);

    if (Array.isArray(payload.deletedUids)) {
      for (const dUid of payload.deletedUids) {
        if (dUid) deletedSet.add(String(dUid));
      }
      centralDb.deletedUids = Array.from(deletedSet);
    }

    // 1. Merge accounts
    if (payload.accounts && typeof payload.accounts === 'object') {
      for (const [uid, incomingAcc] of Object.entries<any>(payload.accounts)) {
        if (!uid || deletedSet.has(uid) || !incomingAcc?.profile) continue;
        const existingAcc = centralDb.accounts[uid];
        if (!existingAcc) {
          centralDb.accounts[uid] = {
            profile: incomingAcc.profile,
            password: incomingAcc.password || 'zentro123',
          };
        } else {
          const existingTime = new Date(
            existingAcc.profile?.updatedAt || existingAcc.profile?.createdAt || 0
          ).getTime();
          const incomingTime = new Date(
            incomingAcc.profile?.updatedAt || incomingAcc.profile?.createdAt || 0
          ).getTime();

          // Take newer profile or force-overwrite if explicitly newer/requested
          if (incomingTime >= existingTime || (payload.forceOverwrite && incomingTime >= existingTime - 2000)) {
            centralDb.accounts[uid] = {
              profile: {
                ...existingAcc.profile,
                ...incomingAcc.profile,
                highestVipLevel: Math.max(
                  Number(existingAcc.profile?.highestVipLevel || 0),
                  Number(incomingAcc.profile?.highestVipLevel || 0),
                  Number(incomingAcc.profile?.vipLevel || 0)
                ),
              },
              password: incomingAcc.password || existingAcc.password || 'zentro123',
            };
          }
        }
      }
    }

    // Remove any deleted accounts
    for (const delUid of deletedSet) {
      delete centralDb.accounts[delUid];
      delete centralDb.transactions[delUid];
      delete centralDb.bankAccounts[delUid];
      delete centralDb.kycRecords[delUid];
      delete centralDb.referrals[delUid];
      delete centralDb.depositRequests[delUid];
      delete centralDb.withdrawalRequests[delUid];
      delete centralDb.notifications[delUid];
    }

    // 2. Merge per-user arrays
    const mergeMapList = (
      targetMap: Record<string, any[]>,
      incomingMap?: Record<string, any[]>
    ) => {
      if (!incomingMap || typeof incomingMap !== 'object') return;
      for (const [uid, list] of Object.entries(incomingMap)) {
        if (!uid || deletedSet.has(uid) || !Array.isArray(list)) continue;
        targetMap[uid] = mergeRecordArraysById(targetMap[uid] || [], list);
      }
    };

    mergeMapList(centralDb.transactions, payload.transactions);
    mergeMapList(centralDb.bankAccounts, payload.bankAccounts);
    mergeMapList(centralDb.referrals, payload.referrals);
    mergeMapList(centralDb.depositRequests, payload.depositRequests);
    mergeMapList(centralDb.withdrawalRequests, payload.withdrawalRequests);
    mergeMapList(centralDb.notifications, payload.notifications);

    // 3. Merge KYC records
    if (payload.kycRecords && typeof payload.kycRecords === 'object') {
      for (const [uid, kyc] of Object.entries<any>(payload.kycRecords)) {
        if (!uid || deletedSet.has(uid) || !kyc) continue;
        const prev = centralDb.kycRecords[uid];
        if (!prev) {
          centralDb.kycRecords[uid] = kyc;
        } else {
          const prevTime = new Date(prev.updatedAt || prev.createdAt || 0).getTime();
          const nextTime = new Date(kyc.updatedAt || kyc.createdAt || 0).getTime();
          if (payload.forceOverwrite || nextTime >= prevTime) {
            centralDb.kycRecords[uid] = { ...prev, ...kyc };
          }
        }
      }
    }

    // 4. Merge Global Broadcasts
    if (Array.isArray(payload.globalBroadcasts)) {
      if (payload.forceOverwrite) {
        centralDb.globalBroadcasts = payload.globalBroadcasts;
      } else {
        centralDb.globalBroadcasts = mergeRecordArraysById(
          centralDb.globalBroadcasts || [],
          payload.globalBroadcasts
        );
      }
    }

    // 5. Merge Catalogs (Sponsor Countries, Global Stats, VIP Tiers, Tasks, Banks, USDT)
    if (payload.catalogs && typeof payload.catalogs === 'object') {
      centralDb.catalogs = {
        ...centralDb.catalogs,
        ...payload.catalogs,
      };
    }

    reconcileCentralFiveLevelReferrals();
    saveCentralDbToDisk();

    res.json({
      ok: true,
      db: centralDb,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to sync central database.' });
  }
});

app.post('/api/db/delete-user', (req, res) => {
  try {
    const { uid, username } = req.body || {};
    if (!uid) {
      res.status(400).json({ error: 'Missing uid to delete.' });
      return;
    }

    if (!centralDb.deletedUids.includes(uid)) {
      centralDb.deletedUids.push(uid);
    }

    delete centralDb.accounts[uid];
    delete centralDb.transactions[uid];
    delete centralDb.bankAccounts[uid];
    delete centralDb.kycRecords[uid];
    delete centralDb.referrals[uid];
    delete centralDb.depositRequests[uid];
    delete centralDb.withdrawalRequests[uid];
    delete centralDb.notifications[uid];

    // Also remove from server device lock registry so the device is unlocked if needed
    for (const [key, entry] of serverDeviceRegistry.entries()) {
      const matchUid = key === uid || entry.uid === uid;
      const matchUsername = Boolean(
        username &&
          entry.username &&
          entry.username.toLowerCase() === String(username).trim().toLowerCase()
      );
      if (matchUid || matchUsername) {
        serverDeviceRegistry.delete(key);
      }
    }
    saveDeviceRegistryToDisk();
    saveCentralDbToDisk();

    res.json({
      ok: true,
      deletedUid: uid,
      db: centralDb,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete user.' });
  }
});

app.post('/api/db/login', (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    const queryStr = String(identifier || '')
      .trim()
      .toLowerCase();
    const queryDigits = queryStr.replace(/[^0-9]/g, '');
    const queryPhoneCore = normalizePhoneCore(queryStr);

    if (!queryStr) {
      res.status(400).json({ error: 'Please enter your username, email, or mobile number.' });
      return;
    }

    reconcileCentralFiveLevelReferrals();
    const deletedSet = new Set(centralDb.deletedUids || []);

    const matched = Object.values(centralDb.accounts).find((acc) => {
      if (!acc || !acc.profile || deletedSet.has(acc.profile.uid)) return false;
      const uMobileDigits = String(acc.profile.mobile || '').replace(/[^0-9]/g, '');
      const fullPhoneDigits = `${String(acc.profile.countryCode || '').replace(/[^0-9]/g, '')}${uMobileDigits}`;
      const uPhoneCore = normalizePhoneCore(acc.profile.mobile, acc.profile.countryCode);

      const usernameMatch = String(acc.profile.username || '').trim().toLowerCase() === queryStr;
      const emailMatch = String(acc.profile.email || '').trim().toLowerCase() === queryStr;
      const phoneMatch =
        queryDigits.length >= 6 &&
        (uMobileDigits === queryDigits ||
          fullPhoneDigits === queryDigits ||
          (uPhoneCore.length >= 6 && queryPhoneCore.length >= 6 && (
            uPhoneCore === queryPhoneCore ||
            uPhoneCore.endsWith(queryPhoneCore) ||
            queryPhoneCore.endsWith(uPhoneCore)
          )) ||
          (uMobileDigits.length >= 7 &&
            queryDigits.length >= 7 &&
            uMobileDigits.slice(-7) === queryDigits.slice(-7)));

      return usernameMatch || emailMatch || phoneMatch;
    });

    if (!matched) {
      res.status(404).json({ error: 'Account not found in database.' });
      return;
    }

    const storedPass = String(matched.password || '');
    const inputPass = String(password || '');
    if (storedPass !== inputPass && storedPass.trim() !== inputPass.trim()) {
      res.status(401).json({ error: 'Incorrect password. Please check your password and try again.' });
      return;
    }

    const uid = matched.profile.uid;
    res.json({
      ok: true,
      uid,
      account: matched,
      transactions: centralDb.transactions[uid] || [],
      bankAccounts: centralDb.bankAccounts[uid] || [],
      kycRecord: centralDb.kycRecords[uid] || null,
      referrals: centralDb.referrals[uid] || [],
      depositRequests: centralDb.depositRequests[uid] || [],
      withdrawalRequests: centralDb.withdrawalRequests[uid] || [],
      notifications: centralDb.notifications[uid] || [],
      db: centralDb,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Database login failed.' });
  }
});

// ============================================================================
// REAL-TIME MULTI-USER & ADMIN LIVE CHAT ENGINE (Server-Authoritative + SSE)
// ============================================================================
interface ServerLiveChatMessage {
  id: string;
  senderUid: string;
  senderUsername: string;
  senderVipLevel: number;
  senderIsAdmin: boolean;
  recipientUid: string; // 'GLOBAL' | 'ADMIN' | specific user uid
  recipientUsername?: string;
  text: string;
  createdAt: string;
}

interface ServerLiveChatUserPresence {
  uid: string;
  username: string;
  vipLevel: number;
  isAdmin: boolean;
  country?: string;
  lastSeenAt: string;
}

interface ServerSupportLinksConfig {
  whatsappOfficialChannelUrl: string;
  telegramOfficialChannelUrl: string;
  whatsappSupportCareUrl: string;
  telegramSupportCareUrl: string;
  whatsappSupportCareLabel: string;
  telegramSupportCareLabel: string;
  channels?: any[];
}

let serverSupportConfig: ServerSupportLinksConfig = {
  whatsappOfficialChannelUrl: 'https://whatsapp.com/channel/0029VaZentroOfficial',
  telegramOfficialChannelUrl: 'https://t.me/ZentroOfficialChannel',
  whatsappSupportCareUrl: 'https://wa.me/94770090007?text=Hello%20Zentro%20Hiring%20Manager%20Support',
  telegramSupportCareUrl: 'https://t.me/ZentroHiringManagerCare',
  whatsappSupportCareLabel: 'Hiring Manager Care (WhatsApp)',
  telegramSupportCareLabel: 'Hiring Manager Care (Telegram)',
};

const serverLiveChatMessages: ServerLiveChatMessage[] = [
  {
    id: 'msg_welcome_global_1',
    senderUid: 'ADMIN',
    senderUsername: 'Zentro Official Admin',
    senderVipLevel: 4,
    senderIsAdmin: true,
    recipientUid: 'GLOBAL',
    recipientUsername: 'All Members',
    text: 'Welcome to Zentro 24/7 Live Community & Support Chat! You can message all members in Global Live Chat or send a Direct Message to Admin or any member anytime.',
    createdAt: new Date().toISOString(),
  },
];

const serverLivePresence = new Map<string, ServerLiveChatUserPresence>();
serverLivePresence.set('ADMIN', {
  uid: 'ADMIN',
  username: 'Zentro Official Admin',
  vipLevel: 4,
  isAdmin: true,
  country: 'Official HQ',
  lastSeenAt: new Date().toISOString(),
});

const sseClients = new Set<express.Response>();

function broadcastLiveChatEvent(eventType: string, payload: unknown) {
  const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(dataString);
    } catch {
      sseClients.delete(client);
    }
  }
}

app.get('/api/live-chat/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);
  res.write(
    `event: init\ndata: ${JSON.stringify({
      messages: serverLiveChatMessages.slice(-250),
      users: Array.from(serverLivePresence.values()),
      supportConfig: serverSupportConfig,
    })}\n\n`
  );

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/api/live-chat/state', (_req, res) => {
  res.json({
    messages: serverLiveChatMessages.slice(-250),
    users: Array.from(serverLivePresence.values()),
    supportConfig: serverSupportConfig,
  });
});

app.post('/api/live-chat/presence', (req, res) => {
  const { uid, username, vipLevel = 0, isAdmin = false, country = '' } = req.body || {};
  if (!uid || !username) {
    res.status(400).json({ error: 'uid and username required' });
    return;
  }
  const entry: ServerLiveChatUserPresence = {
    uid: String(uid),
    username: String(username).slice(0, 60),
    vipLevel: Number(vipLevel) || 0,
    isAdmin: Boolean(isAdmin),
    country: String(country || ''),
    lastSeenAt: new Date().toISOString(),
  };
  serverLivePresence.set(entry.uid, entry);
  // Also keep ADMIN online
  const adminEntry = serverLivePresence.get('ADMIN');
  if (adminEntry) {
    adminEntry.lastSeenAt = new Date().toISOString();
  }
  broadcastLiveChatEvent('presence:updated', {
    users: Array.from(serverLivePresence.values()),
  });
  res.json({ ok: true, users: Array.from(serverLivePresence.values()) });
});

app.post('/api/live-chat/send', (req, res) => {
  const {
    id,
    senderUid,
    senderUsername,
    senderVipLevel = 0,
    senderIsAdmin = false,
    recipientUid = 'GLOBAL',
    recipientUsername = '',
    text,
  } = req.body || {};

  if (!senderUid || !senderUsername || !text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Invalid chat message payload' });
    return;
  }

  const msgId = String(id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  // Idempotency check
  const existing = serverLiveChatMessages.find((m) => m.id === msgId);
  if (existing) {
    res.json({ ok: true, message: existing });
    return;
  }

  const newMsg: ServerLiveChatMessage = {
    id: msgId,
    senderUid: String(senderUid),
    senderUsername: String(senderUsername).slice(0, 60),
    senderVipLevel: Number(senderVipLevel) || 0,
    senderIsAdmin: Boolean(senderIsAdmin),
    recipientUid: String(recipientUid || 'GLOBAL'),
    recipientUsername: String(recipientUsername || '').slice(0, 60),
    text: text.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  serverLiveChatMessages.push(newMsg);
  if (serverLiveChatMessages.length > 400) {
    serverLiveChatMessages.shift();
  }

  // Update sender presence
  serverLivePresence.set(newMsg.senderUid, {
    uid: newMsg.senderUid,
    username: newMsg.senderUsername,
    vipLevel: newMsg.senderVipLevel,
    isAdmin: newMsg.senderIsAdmin,
    lastSeenAt: newMsg.createdAt,
  });

  broadcastLiveChatEvent('message:created', { message: newMsg });
  res.json({ ok: true, message: newMsg });
});

app.post('/api/live-chat/delete', (req, res) => {
  const { messageId } = req.body || {};
  if (!messageId) {
    res.status(400).json({ error: 'messageId required' });
    return;
  }
  const idx = serverLiveChatMessages.findIndex((m) => m.id === messageId);
  if (idx !== -1) {
    serverLiveChatMessages.splice(idx, 1);
    broadcastLiveChatEvent('message:deleted', { messageId });
  }
  res.json({ ok: true, messageId });
});

app.post('/api/live-chat/config', (req, res) => {
  const next = req.body || {};
  serverSupportConfig = {
    ...serverSupportConfig,
    whatsappOfficialChannelUrl:
      typeof next.whatsappOfficialChannelUrl === 'string' && next.whatsappOfficialChannelUrl.trim()
        ? next.whatsappOfficialChannelUrl.trim()
        : serverSupportConfig.whatsappOfficialChannelUrl,
    telegramOfficialChannelUrl:
      typeof next.telegramOfficialChannelUrl === 'string' && next.telegramOfficialChannelUrl.trim()
        ? next.telegramOfficialChannelUrl.trim()
        : serverSupportConfig.telegramOfficialChannelUrl,
    whatsappSupportCareUrl:
      typeof next.whatsappSupportCareUrl === 'string' && next.whatsappSupportCareUrl.trim()
        ? next.whatsappSupportCareUrl.trim()
        : serverSupportConfig.whatsappSupportCareUrl,
    telegramSupportCareUrl:
      typeof next.telegramSupportCareUrl === 'string' && next.telegramSupportCareUrl.trim()
        ? next.telegramSupportCareUrl.trim()
        : serverSupportConfig.telegramSupportCareUrl,
    whatsappSupportCareLabel:
      typeof next.whatsappSupportCareLabel === 'string' && next.whatsappSupportCareLabel.trim()
        ? next.whatsappSupportCareLabel.trim()
        : serverSupportConfig.whatsappSupportCareLabel,
    telegramSupportCareLabel:
      typeof next.telegramSupportCareLabel === 'string' && next.telegramSupportCareLabel.trim()
        ? next.telegramSupportCareLabel.trim()
        : serverSupportConfig.telegramSupportCareLabel,
    ...(Array.isArray(next.channels) ? { channels: next.channels } : {}),
  };
  broadcastLiveChatEvent('config:updated', { supportConfig: serverSupportConfig });
  res.json({ ok: true, supportConfig: serverSupportConfig });
});

function getAiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Multi-Mode Gemini Intelligence Endpoint:
// - 'fast': gemini-3.1-flash-lite (low-latency responses)
// - 'thinking': gemini-4-argon with ThinkingLevel.HIGH (deep complex reasoning, no maxOutputTokens)
// - 'search': gemini-3.8-flash with googleSearch tool (up-to-date web search grounding)
// - 'general': gemini-3.8-flash (general tasks)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, mode = 'general', systemInstruction } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getAiClient();

    if (mode === 'fast') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are the Zentro Instant Support & Financial Assistant. Provide clear, concise, helpful answers.',
        },
      });
      res.json({ text: response.text || '', modelUsed: 'gemini-3.1-flash-lite' });
      return;
    }

    if (mode === 'thinking') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are Zentro Deep Intelligence Advisor. Perform rigorous quantitative, financial, and bioscience analysis.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      res.json({ text: response.text || '', modelUsed: 'gemini-4-argon (ThinkingLevel.HIGH)' });
      return;
    }

    if (mode === 'search') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are Zentro Market & Bioscience Research Pulse. Provide accurate, up-to-date answers grounded in Google Search.',
          tools: [{ googleSearch: {} }],
        },
      });

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = rawChunks
        .map((chunk: any) => chunk?.web)
        .filter((web: any) => web && web.uri)
        .map((web: any) => ({
          uri: web.uri,
          title: web.title || web.uri,
        }));

      res.json({
        text: response.text || '',
        sources,
        modelUsed: 'gemini-3.8-flash + Google Search',
      });
      return;
    }

    // Default general mode: gemini-3.8-flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          systemInstruction || 'You are Zentro Intelligence. Help the user complete their task.',
      },
    });
    res.json({ text: response.text || '', modelUsed: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate response from Gemini.',
    });
  }
});

// 2. Analyze Images with gemini-4-argon (used for KYC ID document inspection & general image understanding)
app.post('/api/ai/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', prompt } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required.' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text:
              prompt ||
              'Analyze this image in detail. Describe key visual elements, text, structure, and verification indicators.',
          },
        ],
      },
    });

    res.json({
      text: response.text || '',
      modelUsed: 'gemini-4-argon',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-image:', error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze image with gemini-4-argon.',
    });
  }
});

// 3. Create & Edit High-Quality Images (supports gemini-nano-banana-2.1 and gemini-3-pro-image-preview)
// Supports image sizes (1K, 2K, 4K) and aspect ratios (1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9)
app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const {
      prompt,
      model = 'gemini-nano-banana-2.1',
      aspectRatio = '1:1',
      imageSize = '1K',
      referenceImageBase64,
      referenceMimeType = 'image/png',
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getAiClient();
    const parts: any[] = [];

    if (referenceImageBase64) {
      const cleanRef = referenceImageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanRef,
          mimeType: referenceMimeType,
        },
      });
    }

    parts.push({
      text: `${prompt} (Target aspect ratio: ${aspectRatio})`,
    });

    const selectedModel =
      model === 'gemini-3-pro-image-preview' || model === 'gemini-3-pro-image'
        ? model
        : 'gemini-nano-banana-2.1';

    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });
    } catch (innerErr: any) {
      // Fallback if a model alias or ratio requires standard ratio or gemini-nano-banana-2.1
      const fallbackRatio = ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)
        ? aspectRatio
        : '16:9';
      response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: fallbackRatio,
            imageSize,
          },
        },
      });
    }

    let imageUrl: string | null = null;
    let textNote = '';

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType ?? 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textNote += part.text;
      }
    }

    if (!imageUrl) {
      res.status(500).json({
        error: textNote || 'Model did not return an image part.',
      });
      return;
    }

    res.json({
      imageUrl,
      text: textNote,
      modelUsed: selectedModel,
      aspectRatio,
      imageSize,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-image:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate or edit image.',
    });
  }
});

// 4. Animate Uploaded Image into Video via Interactions API with gemini-omni-1.1-flash
// Aspect ratio: '16:9' (landscape) or '9:16' (portrait)
app.post('/api/ai/animate-video', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', prompt, aspectRatio = '16:9' } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Please upload a photo to animate.' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const ai = getAiClient();

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: [
          {
            type: 'image',
            mime_type: mimeType,
            data: cleanBase64,
          },
          {
            type: 'text',
            text:
              prompt ||
              'Subtle cinematic camera motion with realistic ambient lighting and smooth depth parallax.',
          },
        ],
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: validAspectRatio,
          duration: '5s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart?.data) {
      const videoMime = videoPart.mime_type || 'video/mp4';
      res.json({
        videoUrl: `data:${videoMime};base64,${videoPart.data}`,
        aspectRatio: validAspectRatio,
        modelUsed: 'gemini-omni-1.1-flash',
      });
      return;
    }

    if (videoPart?.uri) {
      res.json({
        videoUrl: videoPart.uri,
        aspectRatio: validAspectRatio,
        modelUsed: 'gemini-omni-1.1-flash',
      });
      return;
    }

    res.status(500).json({
      error: 'Video generation completed without a video payload.',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/animate-video:', error);
    res.status(500).json({
      error: error?.message || 'Failed to animate image into video with gemini-omni-1.1-flash.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zentro server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
