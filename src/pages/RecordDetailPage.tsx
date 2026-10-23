import { templates } from '../data/templates.ts';
import type { Handover } from '../types/handover.ts';
import PageHeader from '../components/PageHeader.tsx';

interface RecordDetailPageProps {
  record: Handover | undefined;
  error: string | null;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

const sections: { field: 'completed' | 'inProgress' | 'notes'; title: string }[] = [
  { field: 'completed', title: '완료 업무' },
  { field: 'inProgress', title: '진행 중 업무' },
  { field: 'notes', title: '전달사항' },
];

function displayDate(workDate: string): string {
  const [year, month, day] = workDate.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function RecordDetailPage({ record, error, onEdit, onCopy, onDelete }: RecordDetailPageProps) {
  if (!record) {
    return (
      <main className="screen">
        <PageHeader title="기록을 찾을 수 없어요" description="목록에서 다른 기록을 선택해 주세요." />
        {error && <p className="form-error" role="alert">{error}</p>}
      </main>
    );
  }

  const template = templates.find(({ id }) => id === record.templateId);

  return (
    <main className="screen detail-screen">
      <PageHeader title="인수인계 기록" description={`${displayDate(record.workDate)} · ${template?.title ?? '업무 유형'}`} />
      <section className="detail-content" aria-label="인수인계 내용">
        {sections.map(({ field, title }) => record[field].trim().length > 0 && (
          <article className="detail-section" key={field}>
            <h2 className="field-title">{title}</h2>
            <p className="detail-body">{record[field]}</p>
          </article>
        ))}
      </section>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="detail-actions">
        <button className="primary-button" type="button" onClick={onCopy}>내용 복사</button>
        <button className="secondary-button" type="button" onClick={onEdit}>수정하기</button>
        <button className="danger-button" type="button" onClick={onDelete}>기록 삭제</button>
      </div>
    </main>
  );
}

export default RecordDetailPage;
