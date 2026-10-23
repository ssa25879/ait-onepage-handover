import type { Handover, HandoverDraft } from '../types/handover.ts';

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function createEmptyHandoverDraft(
  templateId: HandoverDraft['templateId'],
  now = new Date(),
): HandoverDraft {
  return {
    templateId,
    workDate: getLocalDate(now),
    completed: '',
    inProgress: '',
    notes: '',
  };
}

export function areHandoverDraftsEqual(
  left: HandoverDraft | null,
  right: HandoverDraft | null,
): boolean {
  return left !== null && right !== null
    && left.templateId === right.templateId
    && left.workDate === right.workDate
    && left.completed === right.completed
    && left.inProgress === right.inProgress
    && left.notes === right.notes;
}

export function getLocalDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isValidWorkDate(workDate: string): boolean {
  const match = datePattern.exec(workDate);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return false;

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day >= 1 && day <= daysInMonth;
}

export function validateHandoverDraft(draft: HandoverDraft) {
  const dateValid = isValidWorkDate(draft.workDate);
  const hasContent = [draft.completed, draft.inProgress, draft.notes]
    .some((value) => value.trim().length > 0);

  return {
    valid: dateValid && hasContent,
    dateValid,
    hasContent,
  };
}

export function sortHandovers(records: readonly Handover[]): Handover[] {
  return [...records].sort((left, right) =>
    right.workDate.localeCompare(left.workDate)
      || Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

export function getRecentHandovers(records: readonly Handover[], limit = 3): Handover[] {
  return sortHandovers(records).slice(0, limit);
}

export function sortPinnedHandovers(records: readonly Handover[]): Handover[] {
  return sortHandovers(records).sort((left, right) =>
    Number(right.isPinned === true) - Number(left.isPinned === true));
}
