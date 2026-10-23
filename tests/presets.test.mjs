import assert from 'node:assert/strict';
import test from 'node:test';
import * as presets from '../src/data/presets.ts';

test('cafe and retail each offer three distinct presets; general stays blank', () => {
  for (const type of ['cafe', 'retail']) {
    const options = presets.getHandoverPresets(type);
    assert.equal(options.length, 3);
    assert.equal(new Set(options.map(({ id }) => id)).size, 3);
    for (const option of options) {
      const draft = presets.createPresetDraft(type, option.id, new Date(2026, 9, 23));
      assert.equal(draft.workDate, '2026-10-23');
      assert.equal(draft.templateId, type);
      for (const field of ['completed', 'inProgress', 'notes']) {
        assert.ok(draft[field].trim());
      }
    }
  }
  assert.deepEqual(presets.getHandoverPresets('general'), []);
});

test('blank writing remains available and editing a draft does not change presets', () => {
  const blank = presets.createPresetDraft('retail', undefined, new Date(2026, 9, 23));
  assert.equal(blank.completed + blank.inProgress + blank.notes, '');
  const option = presets.getHandoverPresets('cafe')[0];
  const draft = presets.createPresetDraft('cafe', option.id);
  const original = draft.completed;
  draft.completed = '사용자 수정';
  assert.equal(presets.createPresetDraft('cafe', option.id).completed, original);
  assert.equal(presets.createPresetDraft('retail', option.id).completed, '');
});
