export const templateIds = ['cafe', 'retail', 'general'] as const;

export type TemplateId = (typeof templateIds)[number];

export type HandoverBodyField = 'completed' | 'inProgress' | 'notes';

export interface HandoverDraft {
  templateId: TemplateId;
  workDate: string;
  completed: string;
  inProgress: string;
  notes: string;
}

export interface Handover extends HandoverDraft {
  id: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HandoverEnvelope {
  schemaVersion: 1;
  records: Handover[];
}
