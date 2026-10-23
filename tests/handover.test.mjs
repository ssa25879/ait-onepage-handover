import assert from 'node:assert/strict';
import test from 'node:test';
import { templates } from '../src/data/templates.ts';
import {
  areHandoverDraftsEqual,
  createEmptyHandoverDraft,
  getLocalDate,
  getRecentHandovers,
  sortHandovers,
  sortPinnedHandovers,
  validateHandoverDraft,
} from '../src/lib/handover.ts';

process.env.TZ = 'Asia/Seoul';

test('provides guidance for all three handover templates', () => {
  assert.deepEqual(
    templates.map(({ id, title }) => [id, title]),
    [
      ['cafe', '카페·음식점'],
      ['retail', '편의점·소매점'],
      ['general', '일반 교대근무'],
    ],
  );

  for (const template of templates) {
    assert.ok(template.guidance.completed.trim());
    assert.ok(template.guidance.inProgress.trim());
    assert.ok(template.guidance.notes.trim());
  }
});

const baseDraft = {
  templateId: 'cafe',
  workDate: '2026-10-23',
  completed: '',
  inProgress: '',
  notes: '',
};

test('accepts a valid draft when only one body has content', () => {
  assert.deepEqual(
    validateHandoverDraft({ ...baseDraft, completed: '마감 청소 완료' }),
    { valid: true, dateValid: true, hasContent: true },
  );
});

test('rejects an impossible calendar date', () => {
  assert.deepEqual(
    validateHandoverDraft({ ...baseDraft, workDate: '2026-02-30', notes: '전달 사항' }),
    { valid: false, dateValid: false, hasContent: true },
  );
});

test('rejects drafts when every body contains only whitespace', () => {
  assert.deepEqual(
    validateHandoverDraft({
      ...baseDraft,
      completed: '  ',
      inProgress: '\n\t',
      notes: ' \n ',
    }),
    { valid: false, dateValid: true, hasContent: false },
  );
});

test('formats the device-local date instead of the UTC date', () => {
  assert.equal(getLocalDate(new Date('2026-10-22T15:30:00.000Z')), '2026-10-23');
});

test('creates a common blank draft for the selected template using the local date', () => {
  assert.deepEqual(
    createEmptyHandoverDraft('retail', new Date('2026-10-22T15:30:00.000Z')),
    {
      templateId: 'retail',
      workDate: '2026-10-23',
      completed: '',
      inProgress: '',
      notes: '',
    },
  );
});

test('preserves the selected date and multiline input during validation', () => {
  const draft = {
    ...baseDraft,
    workDate: '2026-10-24',
    completed: '첫 번째 업무\n두 번째 업무',
  };

  assert.equal(validateHandoverDraft(draft).valid, true);
  assert.equal(draft.workDate, '2026-10-24');
  assert.equal(draft.completed, '첫 번째 업무\n두 번째 업무');
});

test('sorts by work date then update time and limits recent records', () => {
  const records = [
    { id: 'older', workDate: '2026-10-22', updatedAt: '2026-10-23T12:00:00.000Z' },
    { id: 'same-old', workDate: '2026-10-23', updatedAt: '2026-10-23T11:00:00.000Z' },
    { id: 'same-new', workDate: '2026-10-23', updatedAt: '2026-10-23T12:00:00.000Z' },
    { id: 'newest', workDate: '2026-10-24', updatedAt: '2026-10-22T12:00:00.000Z' },
  ];

  assert.deepEqual(sortHandovers(records).map(({ id }) => id), [
    'newest', 'same-new', 'same-old', 'older',
  ]);
  assert.deepEqual(getRecentHandovers(records, 3).map(({ id }) => id), [
    'newest', 'same-new', 'same-old',
  ]);
  assert.deepEqual(getRecentHandovers([], 3), []);
});

test('clears dirty state when values return to the saved snapshot', () => {
  const saved = { ...baseDraft, completed: '마감 업무' };
  const edited = { ...saved, workDate: '2026-10-24' };

  assert.equal(areHandoverDraftsEqual(saved, saved), true);
  assert.equal(areHandoverDraftsEqual(saved, edited), false);
  assert.equal(areHandoverDraftsEqual(saved, { ...edited, workDate: saved.workDate }), true);
});

test('list prioritizes pins by date while home remains chronological', () => {
  const items = [
    { id: 'new', workDate: '2026-10-23', updatedAt: '2026-10-23T10:00:00Z' },
    { id: 'old-pin', workDate: '2026-10-20', updatedAt: '2026-10-20T10:00:00Z', isPinned: true },
    { id: 'new-pin', workDate: '2026-10-21', updatedAt: '2026-10-21T11:00:00Z', isPinned: true },
    { id: 'same-date-pin', workDate: '2026-10-21', updatedAt: '2026-10-21T10:00:00Z', isPinned: true },
    { id: 'older', workDate: '2026-10-22', updatedAt: '2026-10-22T10:00:00Z', isPinned: false },
  ];
  const before = structuredClone(items);
  assert.deepEqual(sortPinnedHandovers(items).map(x => x.id), ['new-pin', 'same-date-pin', 'old-pin', 'new', 'older']);
  assert.deepEqual(getRecentHandovers(items).map(x => x.id), ['new', 'older', 'new-pin']);
  const unpinned = items.map(item => item.id === 'new-pin' ? { ...item, isPinned: false } : item);
  assert.deepEqual(sortPinnedHandovers(unpinned).map(x => x.id), ['same-date-pin', 'old-pin', 'new', 'older', 'new-pin']);
  assert.deepEqual(items, before);
});
