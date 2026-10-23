import PageHeader from '../components/PageHeader.tsx';
import PrivacyNotice from '../components/PrivacyNotice.tsx';

interface SettingsPageProps {
  total: number;
  pinned: number;
  busy: boolean;
  error: string | null;
  onCleanup: () => void;
}

export default function SettingsPage({ total, pinned, busy, error, onCleanup }: SettingsPageProps) {
  const removable = total - pinned;
  return (
    <main className="screen settings-screen">
      <PageHeader title="설정" description="고정한 기록은 남기고 나머지 기록을 정리해요." />
      <section className="settings-card" aria-labelledby="cleanup-title">
        <h2 id="cleanup-title" className="section-title">기록 정리</h2>
        <dl className="record-counts">
          <div><dt>전체 기록</dt><dd>{total}건</dd></div>
          <div><dt>보존할 고정 기록</dt><dd>{pinned}건</dd></div>
          <div><dt>삭제할 기록</dt><dd>{removable}건</dd></div>
        </dl>
        <p className="settings-copy">고정하지 않은 기록만 삭제해요. 삭제한 기록은 복구할 수 없어요.</p>
        <button className="danger-button" type="button" disabled={busy || removable === 0} onClick={onCleanup}>
          고정하지 않은 기록 삭제
        </button>
        {removable === 0 && <p className="settings-copy">삭제할 기록이 없어요.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
      <p className="settings-copy">고정한 기록도 상세 화면에서 개별 삭제할 수 있어요.</p>
      <PrivacyNotice />
    </main>
  );
}
