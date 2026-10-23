import { getHandoverPresets } from '../data/presets.ts';
import type { HandoverTemplate } from '../data/templates.ts';
import PageHeader from '../components/PageHeader.tsx';

interface PresetPageProps {
  template: HandoverTemplate;
  onSelect: (presetId?: string) => void;
}

function PresetPage({ template, onSelect }: PresetPageProps) {
  return (
    <main className="screen">
      <PageHeader title={`${template.title} 프리셋`} description="상황에 맞는 프리셋으로 빠르게 작성해요." />
      <section className="template-list" aria-label={`${template.title} 프리셋 선택`}>
        {getHandoverPresets(template.id).map((preset, index) => (
          <button className="template-card" key={preset.id} type="button" onClick={() => onSelect(preset.id)}>
            <span className={`template-mark template-mark-${index + 1}`} aria-hidden="true">0{index + 1}</span>
            <span className="template-card-content">
              <span className="template-title">{preset.title}</span>
              <span className="template-description">{preset.description}</span>
            </span>
            <span className="template-select-label">선택</span>
          </button>
        ))}
      </section>
      <aside className="helper-card">
        <p className="helper-card-title">내 근무 내용에 맞게 수정해 주세요</p>
        <p className="helper-card-copy">세 항목에 문구가 채워져요. [괄호] 안을 실제 내용으로 바꾸고 저장해 주세요.</p>
      </aside>
      <button className="secondary-button" type="button" onClick={() => onSelect()}>빈 양식으로 작성</button>
    </main>
  );
}

export default PresetPage;
