import PinButton from '../components/PinButton.tsx';
import type { Handover } from '../types/handover.ts';
import PrivacyNotice from '../components/PrivacyNotice.tsx';

interface HomePageProps {
  recentRecords: Handover[];
  busy: boolean;
  onPin: (id: string) => void;
  onCreate: () => void;
  onOpenRecords: () => void;
  onOpenRecord: (id: string) => void;
}

function displayDate(workDate: string): string {
  const [year, month, day] = workDate.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function HomePage({ recentRecords, busy, onPin, onCreate, onOpenRecords, onOpenRecord }: HomePageProps) {
  return (
    <main className="screen home-screen">
      <header className="home-heading">
        <p className="home-kicker">퇴근 전, 차분하게</p>
        <h1 className="home-title">인수인계를<br />한 장으로 정리해요</h1>
        <p className="home-description">
          완료한 일과 다음 근무자에게 전할 내용을<br className="desktop-break" /> 간단히 기록해 두세요.
        </p>
      </header>

      <button className="primary-button home-create" type="button" onClick={onCreate}>
        새 인수인계 작성
      </button>

      <section className="recent-section" aria-labelledby="recent-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">다시 찾기</p>
            <h2 id="recent-title" className="section-title">최근 기록</h2>
          </div>
          <button className="text-button" type="button" onClick={onOpenRecords}>
            전체 보기
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="empty-card">
            <p className="empty-title">아직 작성한 기록이 없어요</p>
            <p className="empty-description">첫 기록을 남기면 이곳에서 바로 확인할 수 있어요.</p>
          </div>
        ) : (
          <div className="record-list compact-list">
            {recentRecords.map((record) => (
              <div className="record-row" key={record.id}>
              <button
                className="record-card"
                disabled={busy}
                type="button"
                onClick={() => onOpenRecord(record.id)}
              >
                <span className="record-card-copy">
                  <span className="record-date">{displayDate(record.workDate)}</span>
                  <span className="record-summary">
                    {record.completed.trim() || record.inProgress.trim() || record.notes.trim()}
                  </span>
                </span>
                <span className="record-type">{record.templateId === 'cafe' ? '카페·음식점' : record.templateId === 'retail' ? '편의점·소매점' : '일반 교대근무'}</span>
              </button>
              <PinButton pinned={record.isPinned === true} disabled={busy} onClick={() => onPin(record.id)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <PrivacyNotice />
    </main>
  );
}

export default HomePage;
