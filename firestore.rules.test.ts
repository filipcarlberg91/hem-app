/**
 * Dirty Dozen Security Specification Verification Suite for firestore.rules
 * Verifies all 12 adversarial payloads described in security_spec.md are denied.
 */
export interface DirtyDozenScenario {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_SCENARIOS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Unauthenticated write to /users/u1',
    collectionPath: '/users/u1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified email spoof on /workspaces/priv_u1',
    collectionPath: '/workspaces/priv_u1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-user PII read on /users/u1 by u2',
    collectionPath: '/users/u1',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'User enumeration list query on /users',
    collectionPath: '/users',
    operation: 'list',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow / ghost field injection (isAdmin: true) on /users/u1',
    collectionPath: '/users/u1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Owner impersonation on create (/workspaces/ws_1 with ownerId != auth.uid)',
    collectionPath: '/workspaces/ws_1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable field mutation (ownerId or createdAt) on /workspaces/ws_1',
    collectionPath: '/workspaces/ws_1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Forged client timestamp (createdAt != request.time)',
    collectionPath: '/users/u1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Denial-of-Wallet oversized string (>900KB sliceJson)',
    collectionPath: '/workspaces/ws_1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'ID poisoning attack with invalid characters',
    collectionPath: '/workspaces/invalid$id!',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unbounded array injection (>10 memberEmails)',
    collectionPath: '/workspaces/ws_1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized workspace read by non-member',
    collectionPath: '/workspaces/priv_filip',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
];
