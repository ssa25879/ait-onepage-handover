import { templates } from '../data/templates.ts';
import { validateHandoverDraft } from './handover.ts';
import type { HandoverDraft } from '../types/handover.ts';

export interface ClipboardAdapter {
  setText(value: string): Promise<void>;
}

const platformClipboard: ClipboardAdapter = {
  async setText(value) {
    const { Clipboard } = await import('@apps-in-toss/web-framework');
    await Clipboard.setText(value);
  },
};

const sections: { field: 'completed' | 'inProgress' | 'notes'; title: string }[] = [
  { field: 'completed', title: '완료 업무' },
  { field: 'inProgress', title: '진행 중 업무' },
  { field: 'notes', title: '전달사항' },
];

export function formatHandoverText(draft: HandoverDraft): string {
  if (!validateHandoverDraft(draft).valid) {
    throw new Error('날짜와 본문을 확인해 주세요.');
  }

  const template = templates.find(({ id }) => id === draft.templateId);
  if (!template) throw new Error('업무 유형을 확인해 주세요.');

  const lines = [
    '[인계한장 - 업무 인수인계]',
    '',
    `날짜: ${draft.workDate}`,
    `업무 유형: ${template.title}`,
  ];

  for (const { field, title } of sections) {
    const bodyLines = draft[field]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (bodyLines.length === 0) continue;

    lines.push('', `■ ${title}`, ...bodyLines.map((line) => `- ${line}`));
  }

  return lines.join('\n');
}

export async function copyHandover(
  draft: HandoverDraft,
  clipboard: ClipboardAdapter = platformClipboard,
): Promise<void> {
  await clipboard.setText(formatHandoverText(draft));
}
