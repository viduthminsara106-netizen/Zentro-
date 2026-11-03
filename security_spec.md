# Zentro Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **PII & Profile Isolation (`/users/{userId}`)**:
   - A `UserProfile` contains PII (`email`, `mobile`, `countryCode`).
   - Only the authenticated owner (`request.auth.uid == userId`) or a verified admin can `get`, `create`, or `update` `/users/{userId}`.
   - `list` is completely disabled on `/users` to prevent user enumeration and PII scraping.
   - `uid`, `referredBy`, `referralCode`, and `createdAt` are strictly immutable after creation.
   - All write operations require `request.auth.token.email_verified == true`.
2. **Transactions Ledger (`/transactions/{transactionId}`)**:
   - Every transaction must belong to an existing user (`exists(/databases/$(database)/documents/users/$(incoming().userId))`) and `incoming().userId == request.auth.uid`.
   - `list` and `get` are strictly limited to `resource.data.userId == request.auth.uid`.
   - Transactions are immutable ledger entries once created (`allow update, delete: if false;`).
3. **Bank Accounts (`/bank_accounts/{bankId}`)**:
   - Every bank account must reference an existing `/users/$(incoming().userId)` where `incoming().userId == request.auth.uid`.
   - Only the owner can `get`, `list` (`resource.data.userId == request.auth.uid`), `create`, or `delete` their bank account.
4. **KYC Records (`/kyc_records/{userId}`)**:
   - Keyed by `{userId}` matching `request.auth.uid`.
   - Once `status == 'verified'`, terminal state locking prevents further client modifications unless admin.
5. **Referral Records (`/referrals/{referralId}`)**:
   - Must reference an existing `/users/$(incoming().referrerUid)` where `incoming().referrerUid == request.auth.uid`.
   - `list` and `get` strictly enforce `resource.data.referrerUid == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection on User Creation**: `{ ..., "isAdmin": true }` -> Rejected by `hasOnly()`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` creating `/users/{uid}` -> Rejected by `isVerifiedUser()`.
3. **PII Cross-User Read**: User A attempting `get(/users/userB)` -> Rejected by `isOwner(userId)`.
4. **Immutable Referral Code Tampering**: User updating `referredBy` or `referralCode` on `/users/{uid}` -> Rejected by action-based `affectedKeys().hasOnly()` and immutability gate.
5. **Client Timestamp Forgery**: User sending past/future `createdAt` instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
6. **ID Poisoning Attack**: Document ID with 500 characters or special characters `$@#` -> Rejected by `isValidId()`.
7. **Orphaned Transaction Creation**: Creating a transaction when `/users/{uid}` does not exist -> Rejected by `exists(/databases/$(database)/documents/users/$(incoming().userId))`.
8. **Cross-User Transaction Spoofing**: Creating `/transactions/tx1` with `userId: "otherUser"` -> Rejected by `incoming().userId == request.auth.uid`.
9. **Ledger Rewrite / Mutation**: Attempting `update` or `delete` on `/transactions/tx1` -> Rejected (`allow update, delete: if false`).
10. **Terminal KYC State Unlock**: Updating `/kyc_records/{uid}` after `existing().status == 'verified'` -> Rejected by terminal state lock `existing().status != 'verified'`.
11. **Unbounded String Denial-of-Wallet**: Sending a 50,000-char string in `description` -> Rejected by `.size() <= 200`.
12. **Blanket List Scraping on Bank Accounts**: Querying `/bank_accounts` without `where('userId', '==', uid)` -> Rejected by `resource.data.userId == request.auth.uid`.
