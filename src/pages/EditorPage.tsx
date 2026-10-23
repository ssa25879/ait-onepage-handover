import type { FormEvent } from 'react';
import type { HandoverDraft, HandoverBodyField } from '../types/handover.ts';
import type { HandoverTemplate } from '../data/templates.ts';
import PageHeader from '../components/PageHeader.tsx';
import PrivacyNotice from '../components/PrivacyNotice.tsx';

interface EditorPageProps {
  draft: HandoverDraft;
  template: HandoverTemplate;
  error: string | null;
  saving: boolean;
  copying: boolean;
  onBack: () => void;
  onChange: (field: keyof HandoverDraft, value: string) => void;
  onSave: () => void;
  onCopy: () => void;
}

const sections: { field: HandoverBodyField; title: string }[] = [
  { field: 'completed', title: '완료 업무' },
  { field: 'inProgress', title: '진행 중 업무' },
  { field: 'notes', title: '전달사항' },
];

function EditorPage({ draft, template, error, saving, copying, onBack, onChange, onSave, onCopy }: EditorPageProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <main className="screen editor-screen">
      <PageHeader
        title={template.title}
        description="다음 근무자가 알아야 할 내용을 적어 주세요."
        onBack={onBack}
      />

      <form className="editor-form" onSubmit={handleSubmit}>
        <label className="field-card date-field">
          <span className="field-title">업무 날짜</span>
          <input
            className="date-input"
            type="date"
            value={draft.workDate}
            onChange={(event) => onChange('workDate', event.currentTarget.value)}
            required
          />
        </label>

        {sections.map(({ field, title }) => (
          <label className="field-card" key={field}>
            <span className="field-heading">
              <span className="field-title">{title}</span>
              <span className="field-guide">{template.guidance[field]}</span>
            </span>
            <textarea
              className="text-input"
              rows={3}
              value={draft[field]}
              placeholder={template.examples[field]}
              onChange={(event) => onChange(field, event.currentTarget.value)}
              aria-label={title}
            />
          </label>
        ))}

        {error && <p className="form-error" role="alert">{error}</p>}

        <PrivacyNotice />

        <div className="editor-footer">
          <p className="form-hint">세 항목 중 하나 이상 작성하면 저장할 수 있어요.</p>
          <div className="editor-actions">
            <button className="secondary-button" type="button" onClick={onCopy} disabled={copying}>
              {copying ? '복사 중…' : '내용 복사'}
            </button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default EditorPage;
