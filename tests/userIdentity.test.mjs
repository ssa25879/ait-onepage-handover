import assert from 'node:assert/strict';
import test from 'node:test';
import { createUserIdentityInitializer, USER_IDENTITY_STORAGE_KEY } from '../src/lib/userIdentity.ts';

test('concurrent startup stores the current identity once without touching records', async () => {
  const writes = [];
  let calls = 0;
  const initialize = createUserIdentityInitializer({
    getAnonymousKey: async () => { calls++; return { type: 'HASH', hash: 'current-user' }; },
    setItem: async (key, value) => { writes.push([key, value]); },
  });
  assert.deepEqual(await Promise.all([initialize(), initialize()]), [true, true]);
  assert.equal(calls, 1);
  assert.deepEqual(writes, [[USER_IDENTITY_STORAGE_KEY, 'current-user']]);
});

test('unsupported, rejected and invalid identity responses do not write or reject startup', async () => {
  for (const getAnonymousKey of [
    async () => { throw new Error('unsupported'); },
    async () => ({ type: 'HASH', hash: '' }),
    async () => ({ type: 'OTHER', hash: 'value' }),
  ]) {
    const initialize = createUserIdentityInitializer({
      getAnonymousKey,
      setItem: async () => assert.fail('must not write'),
    });
    assert.equal(await initialize(), false);
  }
});

test('identity storage failure resolves without blocking record startup', async () => {
  const initialize = createUserIdentityInitializer({
    getAnonymousKey: async () => ({ type: 'HASH', hash: 'user' }),
    setItem: async () => { throw new Error('storage failed'); },
  });
  assert.equal(await initialize(), false);
});
