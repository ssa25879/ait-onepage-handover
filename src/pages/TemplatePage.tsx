import { templates } from '../data/templates.ts';
import type { TemplateId } from '../types/handover.ts';
import PageHeader from '../components/PageHeader.tsx';

interface TemplatePageProps {
  onSelect: (templateId: TemplateId) => void;
}

function TemplatePage({ onSelect }: TemplatePageProps) {
  return (
    <main className="screen">
      <PageHeader
        title="어떤 일을 인계하나요?"
        description="카페·음식점과 편의점·소매점은 상황별 프리셋을 고를 수 있어요."
      />
      <section className="template-list" aria-label="업무 유형 선택">
        {templates.map((template, index) => (
          <button
            className="template-card"
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
          >
            <span className={`template-mark template-mark-${index + 1}`} aria-hidden="true">0{index + 1}</span>
            <span className="template-card-content">
              <span className="template-title">{template.title}</span>
              <span className="template-description">{template.description}</span>
            </span>
            <span className="template-select-label">선택</span>
          </button>
        ))}
      </section>
      <aside className="helper-card">
        <p className="helper-card-title">모든 유형은 같은 항목으로 정리해요</p>
        <p className="helper-card-copy">완료 업무 · 진행 중 업무 · 전달사항</p>
      </aside>
    </main>
  );
}

export default TemplatePage;
