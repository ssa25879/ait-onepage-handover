import { isValidWorkDate, validateHandoverDraft } from './handover.ts';
import { templateIds, type Handover, type HandoverDraft, type HandoverEnvelope } from '../types/handover.ts';

export const RECORDS_STORAGE_KEY = 'ingye-hanjang:records:v1';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export type RecordsState =
  | { status: 'ready'; records: Handover[] }
  | {
      status: 'error';
      reason: 'read-failed' | 'invalid-json' | 'unsupported-version' | 'invalid-data';
      raw: string | null;
    };

export interface SaveOptions {
  id?: string;
  now?: Date;
  createId?: () => string;
}

const platformStorage: StorageAdapter = {
  async getItem(key) {
    const { Storage } = await import('@apps-in-toss/web-framework');
    return Storage.getItem(key);
  },
  async setItem(key, value) {
    const { Storage } = await import('@apps-in-toss/web-framework');
    await Storage.setItem(key, value);
  },
};

function errorState(
  reason: Extract<RecordsState, { status: 'error' }>['reason'],
  raw: string | null,
): RecordsState {
  return { status: 'error', reason, raw };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/.exec(value);
  if (!match || !isValidWorkDate(match[1])) return false;

  const [, , hour, minute, second] = match;
  return Number(hour) <= 23
    && Number(minute) <= 59
    && Number(second) <= 59
    && Number.isFinite(Date.parse(value));
}

function isHandover(value: unknown): value is Handover {
  if (!isObject(value)) return false;
  return typeof value.id === 'string'
    && value.id.trim().length > 0
    && typeof value.templateId === 'string'
    && templateIds.includes(value.templateId as Handover['templateId'])
    && typeof value.workDate === 'string'
    && isValidWorkDate(value.workDate)
    && typeof value.completed === 'string'
    && typeof value.inProgress === 'string'
    && typeof value.notes === 'string'
    && (!('isPinned' in value) || typeof value.isPinned === 'boolean')
    && isIsoUtcTimestamp(value.createdAt)
    && isIsoUtcTimestamp(value.updatedAt);
}

export function parseRecordsEnvelope(raw: string | null): RecordsState {
  if (raw === null) return { status: 'ready', records: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return errorState('invalid-json', raw);
  }

  if (!isObject(parsed)) return errorState('invalid-data', raw);
  if (parsed.schemaVersion !== 1) return errorState('unsupported-version', raw);
  if (!Array.isArray(parsed.records) || !parsed.records.every(isHandover)) {
    return errorState('invalid-data', raw);
  }

  const records = parsed.records;
  const ids = new Set(records.map((record) => record.id));
  if (ids.size !== records.length) return errorState('invalid-data', raw);

  return { status: 'ready', records };
}

export async function loadRecords(storage: StorageAdapter = platformStorage): Promise<RecordsState> {
  try {
    return parseRecordsEnvelope(await storage.getItem(RECORDS_STORAGE_KEY));
  } catch {
    return errorState('read-failed', null);
  }
}

function requireWritableState(state: RecordsState): asserts state is Extract<RecordsState, { status: 'ready' }> {
  if (state.status !== 'ready') {
    throw new Error('기록 저장소를 확인할 수 없어 변경할 수 없습니다.');
  }
}

async function persistRecords(
  records: Handover[],
  storage: StorageAdapter,
): Promise<RecordsState> {
  const envelope: HandoverEnvelope = { schemaVersion: 1, records };
  await storage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(envelope));
  return { status: 'ready', records };
}

function createRecordId(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('기록 ID를 만들 수 없습니다.');
  }
  return globalThis.crypto.randomUUID();
}

export async function saveHandover(
  state: RecordsState,
  draft: HandoverDraft,
  storage: StorageAdapter = platformStorage,
  options: SaveOptions = {},
): Promise<RecordsState> {
  requireWritableState(state);

  if (!validateHandoverDraft(draft).valid) {
    throw new Error('날짜와 본문을 확인해 주세요.');
  }

  const existing = options.id
    ? state.records.find((record) => record.id === options.id)
    : undefined;
  if (options.id && !existing) throw new Error('수정할 기록을 찾을 수 없습니다.');

  const now = (options.now ?? new Date()).toISOString();
  const id = existing?.id ?? options.id ?? (options.createId ?? createRecordId)();
  if (!existing && state.records.some((record) => record.id === id)) {
    throw new Error('중복된 기록 ID입니다.');
  }

  const saved: Handover = {
    ...draft,
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...(existing?.isPinned !== undefined ? { isPinned: existing.isPinned } : {}),
  };
  const records = existing
    ? state.records.map((record) => record.id === existing.id ? saved : record)
    : [...state.records, saved];

  return persistRecords(records, storage);
}

export async function deleteHandover(
  state: RecordsState,
  id: string,
  storage: StorageAdapter = platformStorage,
): Promise<RecordsState> {
  requireWritableState(state);
  if (!state.records.some((record) => record.id === id)) {
    throw new Error('삭제할 기록을 찾을 수 없습니다.');
  }

  return persistRecords(state.records.filter((record) => record.id !== id), storage);
}

export async function setHandoverPinned(
  state: RecordsState,
  id: string,
  isPinned: boolean,
  storage: StorageAdapter = platformStorage,
): Promise<RecordsState> {
  requireWritableState(state);
  if (!state.records.some((record) => record.id === id)) {
    throw new Error('Record not found');
  }
  return persistRecords(
    state.records.map((record) => record.id === id ? { ...record, isPinned } : record),
    storage,
  );
}

export async function deleteUnpinnedHandovers(
  state: RecordsState,
  storage: StorageAdapter = platformStorage,
): Promise<RecordsState> {
  requireWritableState(state);
  const retained = state.records.filter((record) => record.isPinned === true);
  if (retained.length === state.records.length) return state;
  return persistRecords(retained, storage);
}
