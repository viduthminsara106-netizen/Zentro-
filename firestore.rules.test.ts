/**
 * Firestore Security Rules Test Suite for Zentro ("Dirty Dozen" Verification)
 */

export interface DirtyPayloadTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyPayloadTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on User Creation',
    collection: 'users',
    docId: 'user_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      username: 'alice',
      email: 'u1@example.com',
      countryCode: '+1',
      mobile: '5551234',
      securityPasswordHash: 'hash123',
      referralCode: 'ZENTRO-111',
      referredBy: 'ZENTRO-VIP888',
      vipLevel: 0,
      balance: 0,
      totalEarnings: 0,
      tasksCompletedToday: 0,
      kycStatus: 'unverified',
      isAdmin: true, // Shadow field
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    collection: 'users',
    docId: 'user_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: false },
    payload: { uid: 'user_1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'PII Cross-User Read',
    collection: 'users',
    docId: 'user_2',
    operation: 'get',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Immutable Referral Code Tampering',
    collection: 'users',
    docId: 'user_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: { referredBy: 'HACKED-REF' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Client Timestamp Forgery',
    collection: 'transactions',
    docId: 'tx_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      userId: 'user_1',
      type: 'deposit',
      amount: 100,
      status: 'completed',
      description: 'Deposit',
      createdAt: '1999-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'ID Poisoning Attack',
    collection: 'transactions',
    docId: 'invalid$id#with!bad*chars',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphaned Transaction Creation',
    collection: 'transactions',
    docId: 'tx_orphan',
    operation: 'create',
    auth: { uid: 'non_existent_user', email: 'ghost@example.com', email_verified: true },
    payload: {
      userId: 'non_existent_user',
      type: 'deposit',
      amount: 50,
      status: 'completed',
      description: 'Orphan deposit',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Cross-User Transaction Spoofing',
    collection: 'transactions',
    docId: 'tx_spoof',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      userId: 'user_2',
      type: 'withdrawal',
      amount: 500,
      status: 'completed',
      description: 'Steal funds',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Ledger Mutation Attempt',
    collection: 'transactions',
    docId: 'tx_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: { amount: 999999 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Terminal KYC State Unlock',
    collection: 'kyc_records',
    docId: 'user_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: { documentNumber: 'NEW-FAKE-ID' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unbounded String Denial-of-Wallet',
    collection: 'bank_accounts',
    docId: 'bank_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      userId: 'user_1',
      bankName: 'A'.repeat(1000),
      accountHolder: 'Alice',
      accountNumber: '12345678',
      routingOrSwift: 'SWIFT1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Blanket List Scraping on Users',
    collection: 'users',
    docId: '*',
    operation: 'list',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
