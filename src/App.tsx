import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { initializeBannerAds } from './lib/bannerAds.ts';
import { templates } from './data/templates.ts';
import { copyHandover } from './lib/clipboard.ts';
import {
  areHandoverDraftsEqual,
  createEmptyHandoverDraft,
  getRecentHandovers,
  sortHandovers,
  validateHandoverDraft,
} from './lib/handover.ts';
import { deleteHandover, loadRecords, saveHandover } from './lib/storage.ts';
import type { RecordsState } from './lib/storage.ts';
import type { Handover, HandoverDraft, TemplateId } from './types/handover.ts';
import EditorPage from './pages/EditorPage.tsx';
import HomePage from './pages/HomePage.tsx';
import RecordDetailPage from './pages/RecordDetailPage.tsx';
import RecordListPage from './pages/RecordListPage.tsx';
import TemplatePage from './pages/TemplatePage.tsx';

type Screen = 'home' | 'templates' | 'editor' | 'list' | 'detail';
type LoadState = RecordsState | { status: 'loading' };

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  busy = false,
  error,
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title" className="confirm-title">{title}</h2>
        <p className="confirm-copy">{description}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel} disabled={busy} autoFocus>
            취소
          </button>
          <button
            className={destructive ? 'danger-button' : 'primary-button'}
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function toDraft(record: Handover): HandoverDraft {
  return {
    templateId: record.templateId,
    workDate: record.workDate,
    completed: record.completed,
    inProgress: record.inProgress,
    notes: record.notes,
  };
}

function App() {
  const [recordsState, setRecordsState] = useState<LoadState>({ status: 'loading' });
  const [screen, setScreen] = useState<Screen>('home');
  const [draft, setDraft] = useState<HandoverDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<HandoverDraft | null>(null);
  const [editorOrigin, setEditorOrigin] = useState<Screen>('templates');
  const [recordId, setRecordId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Handover | null>(null);
  const [exitTarget, setExitTarget] = useState<Screen | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const mutationLock = useRef(false);
  const copyLock = useRef(false);
  const platformBackHandler = useRef<() => void>(() => {});

  useEffect(() => {
    let mounted = true;
    void loadRecords().then((state) => {
      if (mounted) setRecordsState(state);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    void initializeBannerAds();
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    void import('@apps-in-toss/web-framework').then(({ graniteEvent }) => {
      if (!mounted) return;
      unsubscribe = graniteEvent.addEventListener('backEvent', {
        onEvent: () => platformBackHandler.current(),
      });
    }).catch(() => {
      // 브라우저 미리보기에서는 앱인토스 뒤로가기 브리지가 없을 수 있어요.
    });
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  function announce(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  async function retryLoad() {
    setRecordsState({ status: 'loading' });
    setRecordsState(await loadRecords());
  }

  function startCreate() {
    setEditorError(null);
    setScreen('templates');
  }

  function selectTemplate(templateId: TemplateId) {
    const nextDraft = createEmptyHandoverDraft(templateId);
    setDraft(nextDraft);
    setSavedDraft(nextDraft);
    setRecordId(null);
    setEditorOrigin('templates');
    setEditorError(null);
    setScreen('editor');
  }

  function openRecord(id: string) {
    setRecordId(id);
    setDetailError(null);
    setScreen('detail');
  }

  function startEdit() {
    if (recordsState.status !== 'ready' || !recordId) return;
    const record = recordsState.records.find(({ id }) => id === recordId);
    if (!record) {
      setDetailError('기록을 찾을 수 없어요. 목록에서 다시 선택해 주세요.');
      return;
    }
    const editDraft = toDraft(record);
    setDraft(editDraft);
    setSavedDraft(editDraft);
    setEditorOrigin('detail');
    setEditorError(null);
    setScreen('editor');
  }

  function discardAndExit() {
    if (exitTarget) setScreen(exitTarget);
    setExitTarget(null);
    setDraft(null);
    setSavedDraft(null);
    setEditorError(null);
  }

  async function handleSave() {
    if (!draft || recordsState.status !== 'ready' || mutationLock.current) return;
    const validation = validateHandoverDraft(draft);
    if (!validation.dateValid) {
      setEditorError('업무 날짜를 확인해 주세요.');
      return;
    }
    if (!validation.hasContent) {
      setEditorError('완료 업무, 진행 중 업무, 전달사항 중 하나 이상 적어 주세요.');
      return;
    }

    mutationLock.current = true;
    setSaving(true);
    setEditorError(null);
    try {
      const nextState = await saveHandover(recordsState, draft, undefined, { id: recordId ?? undefined });
      setRecordsState(nextState);
      if (nextState.status === 'ready') {
        const saved = nextState.records.find((record) => record.id === (recordId ?? nextState.records.at(-1)?.id));
        if (saved) {
          setRecordId(saved.id);
          setDraft(toDraft(saved));
          setSavedDraft(toDraft(saved));
          setScreen('detail');
          announce('인수인계를 저장했어요.');
        }
      }
    } catch {
      setEditorError('저장하지 못했어요. 입력한 내용은 그대로 있어요. 다시 시도해 주세요.');
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  async function handleCopy(draftToCopy: HandoverDraft, editing = false) {
    if (copyLock.current) return;
    copyLock.current = true;
    setCopying(true);
    if (editing) setEditorError(null);
    else setDetailError(null);
    try {
      await copyHandover(draftToCopy);
      announce(editing && !areHandoverDraftsEqual(draft, savedDraft)
        ? '복사했어요. 저장은 별도로 해 주세요.'
        : '내용을 복사했어요.');
    } catch {
      const message = validateHandoverDraft(draftToCopy).valid
        ? '복사하지 못했어요. 클립보드 권한을 확인한 뒤 다시 시도해 주세요.'
        : '날짜와 본문을 확인해 주세요.';
      if (editing) setEditorError(message);
      else setDetailError(message);
    } finally {
      copyLock.current = false;
      setCopying(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || recordsState.status !== 'ready' || mutationLock.current) return;
    mutationLock.current = true;
    setDeleting(true);
    setDetailError(null);
    try {
      const nextState = await deleteHandover(recordsState, pendingDelete.id);
      setRecordsState(nextState);
      setPendingDelete(null);
      setScreen('list');
      announce('기록을 삭제했어요.');
    } catch {
      setDetailError('삭제하지 못했어요. 기록은 그대로 있어요. 다시 시도해 주세요.');
    } finally {
      mutationLock.current = false;
      setDeleting(false);
    }
  }

  useEffect(() => {
    platformBackHandler.current = () => {
      if (screen === 'home') {
        void import('@apps-in-toss/web-framework')
          .then(({ closeView }) => closeView())
          .catch(() => {});
      } else if (screen === 'templates') {
        setScreen('home');
      } else if (screen === 'editor') {
        if (!areHandoverDraftsEqual(draft, savedDraft)) setExitTarget(editorOrigin);
        else setScreen(editorOrigin);
      } else if (screen === 'list') {
        setScreen('home');
      } else {
        setScreen('list');
      }
    };
  }, [draft, editorOrigin, savedDraft, screen]);

  const records = useMemo(() => recordsState.status === 'ready'
    ? sortHandovers(recordsState.records)
    : [], [recordsState]);

  if (recordsState.status === 'loading') {
    return <main className="status-screen" aria-live="polite"><p className="eyebrow">인계한장</p><h1>기록을 불러오고 있어요</h1></main>;
  }

  if (recordsState.status === 'error') {
    return (
      <main className="status-screen">
        <p className="eyebrow">인계한장</p>
        <h1>기록을 안전하게 불러오지 못했어요</h1>
        <p className="page-description">저장된 내용을 보호하기 위해 새 기록 저장과 삭제를 잠시 막았어요. 다시 확인해 주세요.</p>
        <button className="primary-button" type="button" onClick={() => { void retryLoad(); }}>다시 불러오기</button>
      </main>
    );
  }

  const selectedRecord = records.find(({ id }) => id === recordId);
  const selectedTemplate = templates.find(({ id }) => id === draft?.templateId);

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <HomePage
          recentRecords={getRecentHandovers(records, 3)}
          onCreate={startCreate}
          onOpenRecords={() => setScreen('list')}
          onOpenRecord={openRecord}
        />
      )}
      {screen === 'templates' && (
        <TemplatePage onSelect={selectTemplate} />
      )}
      {screen === 'editor' && draft && selectedTemplate && (
        <EditorPage
          draft={draft}
          template={selectedTemplate}
          error={editorError}
          saving={saving}
          copying={copying}
          onChange={(field, value) => {
            setDraft((current) => current ? { ...current, [field]: value } : current);
            setEditorError(null);
          }}
          onSave={() => { void handleSave(); }}
          onCopy={() => { void handleCopy(draft, true); }}
        />
      )}
      {screen === 'list' && (
        <RecordListPage
          records={records}
          onCreate={startCreate}
          onOpen={openRecord}
        />
      )}
      {screen === 'detail' && (
        <RecordDetailPage
          record={selectedRecord}
          error={detailError}
          onEdit={startEdit}
          onCopy={() => selectedRecord && void handleCopy(toDraft(selectedRecord))}
          onDelete={() => selectedRecord && setPendingDelete(selectedRecord)}
        />
      )}

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}

      {exitTarget && (
        <ConfirmDialog
          title="작성 중인 내용이 있어요"
          description="저장하지 않고 나가면 지금 입력한 내용은 사라져요. 계속할까요?"
          confirmLabel="나가기"
          onCancel={() => setExitTarget(null)}
          onConfirm={discardAndExit}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="이 기록을 삭제할까요?"
          description={`${pendingDelete.workDate} 인수인계 기록이 이 기기에서 삭제돼요.`}
          confirmLabel="삭제하기"
          destructive
          busy={deleting}
          error={detailError}
          onCancel={() => { setPendingDelete(null); setDetailError(null); }}
          onConfirm={() => { void confirmDelete(); }}
        />
      )}
    </div>
  );
}

export default App;
