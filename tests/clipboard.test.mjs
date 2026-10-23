import assert from 'node:assert/strict';
import test from 'node:test';
import { copyHandover, formatHandoverText } from '../src/lib/clipboard.ts';

const draft = {
  templateId: 'cafe',
  workDate: '2026-10-22',
  completed: ' 청소 완료 \n',
  inProgress: '재고 확인',
  notes: '예약 확인',
};

test('formats all sections in the agreed order and without a trailing newline', () => {
  assert.equal(formatHandoverText(draft), [
    '[인계한장 - 업무 인수인계]',
    '',
    '날짜: 2026-10-22',
    '업무 유형: 카페·음식점',
    '',
    '■ 완료 업무',
    '- 청소 완료',
    '',
    '■ 진행 중 업무',
    '- 재고 확인',
    '',
    '■ 전달사항',
    '- 예약 확인',
  ].join('\n'));
});

test('omits whitespace-only sections and prefixes each remaining line', () => {
  assert.equal(formatHandoverText({
    ...draft,
    completed: '첫 번째\n\n 두 번째 ',
    inProgress: ' \n ',
    notes: '',
  }), [
    '[인계한장 - 업무 인수인계]',
    '',
    '날짜: 2026-10-22',
    '업무 유형: 카페·음식점',
    '',
    '■ 완료 업무',
    '- 첫 번째',
    '- 두 번째',
  ].join('\n'));
});

test('uses the name of each selected template', () => {
  const names = ['카페·음식점', '편의점·소매점', '일반 교대근무'];
  const ids = ['cafe', 'retail', 'general'];
  ids.forEach((templateId, index) => {
    assert.match(formatHandoverText({ ...draft, templateId }), new RegExp(`업무 유형: ${names[index]}`));
  });
});

test('preserves user symbols and normalizes CRLF without adding a final newline', () => {
  const text = formatHandoverText({
    ...draft,
    completed: '- 직접 쓴 기호\r\n• 다음 줄\r\n\r\n',
    inProgress: '',
    notes: '',
  });

  assert.match(text, /- - 직접 쓴 기호\n- • 다음 줄$/);
  assert.equal(text.endsWith('\n'), false);
});

test('validates before clipboard write and reports clipboard rejection', async () => {
  const calls = [];
  const clipboard = { setText: async (value) => { calls.push(value); } };
  const blank = { ...draft, completed: ' \n', inProgress: '', notes: '' };

  await assert.rejects(() => copyHandover(blank, clipboard));
  assert.deepEqual(calls, []);
  await assert.rejects(() => copyHandover(draft, {
    setText: async () => { throw new Error('denied'); },
  }));
  assert.equal(calls.length, 0);
  assert.equal(draft.completed, ' 청소 완료 \n');
});
