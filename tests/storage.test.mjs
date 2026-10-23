import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deleteHandover,
  loadRecords,
  parseRecordsEnvelope,
  saveHandover,
} from '../src/lib/storage.ts';

const record = {
  id: 'record-1',
  templateId: 'cafe',
  workDate: '2026-10-23',
  completed: '마감 청소 완료',
  inProgress: '',
  notes: '',
  createdAt: '2026-10-23T10:00:00.000Z',
  updatedAt: '2026-10-23T10:00:00.000Z',
};

const envelope = (records = [record], schemaVersion = 1) =>
  JSON.stringify({ schemaVersion, records });

function createStorage(raw = null) {
  const calls = { get: 0, set: [] };
  return {
    calls,
    getItem: async () => {
      calls.get += 1;
      return raw;
    },
    setItem: async (key, value) => {
      calls.set.push({ key, value });
    },
  };
}

test('treats a missing storage value as a ready empty list', () => {
  assert.deepEqual(parseRecordsEnvelope(null), { status: 'ready', records: [] });
});

test('loads a valid envelope without changing its records', () => {
  assert.deepEqual(parseRecordsEnvelope(envelope()), { status: 'ready', records: [record] });
});

test('keeps malformed and unsupported data in an error state', () => {
  const malformed = '{broken';
  const unsupported = envelope([record], 2);

  assert.deepEqual(parseRecordsEnvelope(malformed), {
    status: 'error', reason: 'invalid-json', raw: malformed,
  });
  assert.deepEqual(parseRecordsEnvelope(unsupported), {
    status: 'error', reason: 'unsupported-version', raw: unsupported,
  });
});

test('rejects invalid fields and duplicate IDs without accepting partial records', () => {
  const invalidRecord = { ...record, workDate: '2026-02-30' };
  const duplicateRecords = [record, { ...record, notes: '중복' }];

  assert.equal(parseRecordsEnvelope(envelope([invalidRecord])).status, 'error');
  assert.equal(parseRecordsEnvelope(envelope(duplicateRecords)).status, 'error');
});

test('a rejected read enters an error state and blocks writes', async () => {
  const calls = { set: 0 };
  const storage = {
    getItem: async () => { throw new Error('denied'); },
    setItem: async () => { calls.set += 1; },
  };
  const state = await loadRecords(storage);

  assert.deepEqual(state, { status: 'error', reason: 'read-failed', raw: null });
  await assert.rejects(() => saveHandover(state, {
    templateId: 'cafe', workDate: '2026-10-23', completed: '작업', inProgress: '', notes: '',
  }, storage));
  assert.equal(calls.set, 0);
});

test('a corrupted value is preserved and never overwritten by a save attempt', async () => {
  const raw = envelope([{ ...record, templateId: 'unknown' }]);
  const storage = createStorage(raw);
  const state = await loadRecords(storage);

  assert.equal(state.status, 'error');
  if (state.status === 'error') assert.equal(state.raw, raw);
  await assert.rejects(() => saveHandover(state, {
    templateId: 'cafe', workDate: '2026-10-23', completed: '새 기록', inProgress: '', notes: '',
  }, storage));
  assert.deepEqual(storage.calls.set, []);
});

test('commits a new record only after storage accepts the envelope', async () => {
  const storage = createStorage(null);
  const state = { status: 'ready', records: [] };
  const saved = await saveHandover(state, {
    templateId: 'cafe', workDate: '2026-10-23', completed: '마감 청소 완료', inProgress: '', notes: '',
  }, storage, { now: new Date('2026-10-23T12:00:00.000Z'), createId: () => 'new-id' });

  assert.equal(saved.status, 'ready');
  assert.equal(saved.records[0].id, 'new-id');
  assert.equal(saved.records[0].createdAt, '2026-10-23T12:00:00.000Z');
  assert.equal(storage.calls.set.length, 1);
  assert.deepEqual(JSON.parse(storage.calls.set[0].value), {
    schemaVersion: 1,
    records: saved.records,
  });
});

test('updates a record while preserving its ID and creation time', async () => {
  const storage = createStorage(null);
  const state = { status: 'ready', records: [record] };
  const saved = await saveHandover(state, {
    templateId: 'retail', workDate: '2026-10-24', completed: '', inProgress: '검수 중', notes: '',
  }, storage, { id: record.id, now: new Date('2026-10-24T12:00:00.000Z') });

  assert.equal(saved.records[0].id, record.id);
  assert.equal(saved.records[0].createdAt, record.createdAt);
  assert.equal(saved.records[0].updatedAt, '2026-10-24T12:00:00.000Z');
  assert.equal(saved.records[0].templateId, 'retail');
});

test('keeps the previous state when a write fails', async () => {
  const storage = {
    setItem: async () => { throw new Error('quota'); },
  };
  const state = { status: 'ready', records: [record] };
  const before = structuredClone(state);

  await assert.rejects(() => saveHandover(state, {
    templateId: 'cafe', workDate: '2026-10-24', completed: '새 업무', inProgress: '', notes: '',
  }, storage, { now: new Date('2026-10-24T12:00:00.000Z'), createId: () => 'new-id' }));
  assert.deepEqual(state, before);
});

test('uses the state returned from each successful save for consecutive writes', async () => {
  const storage = createStorage(null);
  const first = await saveHandover({ status: 'ready', records: [] }, {
    templateId: 'cafe', workDate: '2026-10-23', completed: '첫 기록', inProgress: '', notes: '',
  }, storage, { now: new Date('2026-10-23T12:00:00.000Z'), createId: () => 'first' });
  const second = await saveHandover(first, {
    templateId: 'retail', workDate: '2026-10-23', completed: '', inProgress: '둘째 기록', notes: '',
  }, storage, { now: new Date('2026-10-23T12:01:00.000Z'), createId: () => 'second' });

  assert.deepEqual(second.records.map(({ id }) => id), ['first', 'second']);
  assert.equal(storage.calls.set.length, 2);
});

test('deletes only the selected record after storage succeeds', async () => {
  const other = { ...record, id: 'record-2', workDate: '2026-10-22' };
  const storage = createStorage(null);
  const state = { status: 'ready', records: [record, other] };
  const deleted = await deleteHandover(state, record.id, storage);

  assert.deepEqual(deleted.records, [other]);
  assert.deepEqual(state.records, [record, other]);
  assert.equal(storage.calls.set.length, 1);
});

test('keeps the previous records when delete storage fails', async () => {
  const storage = { setItem: async () => { throw new Error('unavailable'); } };
  const state = { status: 'ready', records: [record] };
  const before = structuredClone(state);

  await assert.rejects(() => deleteHandover(state, record.id, storage));
  assert.deepEqual(state, before);
});
