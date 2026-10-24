# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Invariant**: All write operations and protected reads require `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Path Variable Hardening**: Every single-document path variable (`{userId}`, `{directoryId}`, `{workspaceId}`) must satisfy `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **PII Isolation (`/users/{userId}`)**: A user profile can only be read, created, updated, or deleted when `userId == request.auth.uid` and `data.uid == request.auth.uid`. `list` is completely forbidden on `/users`.
5. **Directory Lookup Hardening (`/userDirectory/{directoryId}`)**: No `list` queries are permitted (preventing user enumeration/scraping). Only `get` is permitted for verified signed-in users, and only the owner (`ownerId == request.auth.uid`) or a connected family member updating bilateral connection state can modify `connectionsJson` and `updatedAt`.
6. **Workspace Isolation (`/workspaces/{workspaceId}`)**:
   - A workspace slice can only be read (`get`) or updated if `existing().ownerId == request.auth.uid` OR `request.auth.token.email in existing().memberEmails`.
   - `memberEmails` is strictly bounded (`memberEmails is list && memberEmails.size() >= 1 && memberEmails.size() <= 10 && memberEmails[0] is string && memberEmails[0].size() <= 160`).
   - `ownerId` and `createdAt` are strictly immutable on `update`.
   - `createdAt == request.time` on `create` and `updatedAt == request.time` on both `create` and `update`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, attempting `create` on `/users/usr_1`. -> `PERMISSION_DENIED`
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email: 'filip.carlberg@outlook.com', email_verified: false } }`, attempting `create` on `/workspaces/priv_u1`. -> `PERMISSION_DENIED`
3. **Cross-User PII Read**: `auth = { uid: 'u2', token: { email_verified: true } }`, attempting `get` on `/users/u1`. -> `PERMISSION_DENIED`
4. **User Enumeration (`list` on `/users` or `/userDirectory`)**: Attempting `list` query on `/users` or `/userDirectory`. -> `PERMISSION_DENIED`
5. **Shadow / Ghost Field Injection**: Including `"isAdmin": true` in `/users/u1` creation or update payload. -> `PERMISSION_DENIED`
6. **Owner Impersonation on Create**: `auth.uid = 'u2'`, creating `/workspaces/ws_1` with `ownerId: 'u1'`. -> `PERMISSION_DENIED`
7. **Immutable Field Mutation on Update**: Updating `ownerId` or `createdAt` on `/workspaces/ws_1`. -> `PERMISSION_DENIED`
8. **Forged Client Timestamp**: Supplying a past or future timestamp instead of `request.time` for `createdAt` or `updatedAt`. -> `PERMISSION_DENIED`
9. **Denial-of-Wallet Oversized String**: Sending `sliceJson` > 900,000 chars or `name` > 100 chars. -> `PERMISSION_DENIED`
10. **ID Poisoning Attack**: Document ID containing spaces, slashes, or > 128 characters. -> `PERMISSION_DENIED`
11. **Unbounded Array Injection**: Sending `memberEmails` with 25 entries (`size() > 10`) or empty list (`size() == 0`). -> `PERMISSION_DENIED`
12. **Unauthorized Workspace Read**: `auth` with `uid: 'stranger'` and `email: 'stranger@example.com'` attempting `get` on `/workspaces/priv_filip`. -> `PERMISSION_DENIED`
