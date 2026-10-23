import { useEffect, useRef, useState } from 'react';
import BannerAd from '../components/BannerAd.tsx';
import { isHistoryBannerNeeded } from '../lib/bannerAds.ts';
import type { Handover } from '../types/handover.ts';
import PageHeader from '../components/PageHeader.tsx';

interface RecordListPageProps {
  records: Handover[];
  onCreate: () => void;
  onOpen: (id: string) => void;
}

function displayDate(workDate: string): string {
  const [year, month, day] = workDate.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function RecordListPage({ records, onCreate, onOpen }: RecordListPageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  useEffect(() => {
    function measureOverflow() {
      const content = contentRef.current;
      const screen = content?.parentElement;
      if (!content || !screen || records.length === 0) {
        setShouldShowBanner(false);
        return;
      }

      const style = getComputedStyle(screen);
      const surroundingHeight = Number.parseFloat(style.paddingTop)
        + Number.parseFloat(style.paddingBottom)
        + Number.parseFloat(style.rowGap);
      setShouldShowBanner(isHistoryBannerNeeded(
        records.length,
        content.scrollHeight,
        document.documentElement.clientHeight,
        surroundingHeight,
      ));
    }

    measureOverflow();
    const content = contentRef.current;
    const observer = content ? new ResizeObserver(measureOverflow) : undefined;
    if (content) observer?.observe(content);
    window.addEventListener('resize', measureOverflow);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measureOverflow);
    };
  }, [records]);

  return (
    <main className="screen">
      <div className="record-list-content" ref={contentRef}>
        <PageHeader title="모든 기록" description="저장한 인수인계를 날짜순으로 모았어요." />
        {records.length === 0 ? (
          <section className="empty-card list-empty">
            <p className="empty-title">아직 기록이 없어요</p>
            <p className="empty-description">첫 인수인계를 작성해 보세요.</p>
            <button className="primary-button" type="button" onClick={onCreate}>새 인수인계 작성</button>
          </section>
        ) : (
          <>
            <button className="secondary-button list-create" type="button" onClick={onCreate}>새 기록 작성</button>
            <section className="record-list" aria-label="저장된 인수인계 기록">
              {records.map((record) => (
                <button className="record-card" key={record.id} type="button" onClick={() => onOpen(record.id)}>
                  <span className="record-card-copy">
                    <span className="record-date">{displayDate(record.workDate)}</span>
                    <span className="record-summary">
                      {record.completed.trim() || record.inProgress.trim() || record.notes.trim()}
                    </span>
                  </span>
                  <span className="record-type">{record.templateId === 'cafe' ? '카페·음식점' : record.templateId === 'retail' ? '편의점·소매점' : '일반 교대근무'}</span>
                </button>
              ))}
            </section>
          </>
        )}
      </div>
      {shouldShowBanner && records.length > 0 && <BannerAd />}
    </main>
  );
}

export default RecordListPage;
