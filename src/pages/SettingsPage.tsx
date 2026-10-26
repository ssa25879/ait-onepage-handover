import { useEffect, useRef, useState } from 'react';
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
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const permissionRequest = useRef(0);

  function describePermission(status: string) {
    return status === 'allowed'
      ? 'SDK에서 복사 쓰기 권한을 허용으로 확인했어요. 토스 설정의 텍스트 붙여넣기 상태는 별도로 확인해 주세요.'
      : '복사 쓰기 권한이 허용되지 않았어요. 아래 버튼이나 토스의 미니앱 권한 설정에서 허용해 주세요.';
  }

  useEffect(() => {
    let active = true;
    async function refreshPermission() {
      if (document.visibilityState === 'hidden') return;
      const request = ++permissionRequest.current;
      try {
        const { Clipboard } = await import('@apps-in-toss/web-framework');
        const status = await Clipboard.setText.getPermission();
        if (active && request === permissionRequest.current) setPermissionMessage(describePermission(status));
      } catch {
        if (active && request === permissionRequest.current) setPermissionMessage('권한을 확인하지 못했어요. 토스의 미니앱 권한 설정을 확인해 주세요.');
      }
    }
    void refreshPermission();
    const refresh = () => { void refreshPermission(); };
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  async function requestCopyPermission() {
    if (requestingPermission) return;
    setRequestingPermission(true);
    const request = ++permissionRequest.current;
    try {
      const { Clipboard } = await import('@apps-in-toss/web-framework');
      const status = await Clipboard.setText.getPermission();
      if (status !== 'allowed') await Clipboard.setText.openPermissionDialog();
      const result = await Clipboard.setText.getPermission();
      if (request === permissionRequest.current) setPermissionMessage(describePermission(result));
    } catch {
      if (request === permissionRequest.current) setPermissionMessage('권한을 확인하지 못했어요. 토스의 미니앱 권한 설정을 확인해 주세요.');
    } finally {
      setRequestingPermission(false);
    }
  }
  return (
    <main className="screen settings-screen">
      <PageHeader title="설정" description="저장된 기록을 정리하고 복사 권한을 확인해요." />
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
      <section className="settings-card" aria-labelledby="clipboard-title">
        <h2 id="clipboard-title" className="section-title">복사·붙여넣기 권한</h2>
        <p className="settings-copy">작성한 내용을 복사하려면 클립보드 쓰기 권한이 필요해요. 아래 버튼으로 미리 허용할 수 있어요.</p>
        <button className="secondary-button" type="button" disabled={busy || requestingPermission} onClick={() => void requestCopyPermission()}>
          {requestingPermission ? '권한 확인 중…' : '복사 권한 확인·허용'}
        </button>
        {permissionMessage && <p className="settings-copy" role="status">{permissionMessage}</p>}
        <p className="settings-copy">토스의 미니앱 권한 설정에서 ‘텍스트 붙여넣기’가 꺼져 있고 복사·붙여넣기가 되지 않는다면, 해당 항목을 켠 뒤 다시 시도해 주세요. 권한은 직접 선택하며 앱에서 기본값을 강제로 켤 수는 없어요.</p>
        <p className="settings-copy">다른 곳에서 복사한 내용을 입력하려면 입력란을 길게 눌러 붙여넣기를 선택해 주세요. 이 앱은 클립보드 내용을 자동으로 읽지 않아요.</p>
      </section>
      <PrivacyNotice />
    </main>
  );
}
