import type { HandoverDraft, TemplateId } from '../types/handover.ts';
import { createEmptyHandoverDraft } from '../lib/handover.ts';

export interface HandoverPreset {
  id: string;
  title: string;
  description: string;
  body: Pick<HandoverDraft, 'completed' | 'inProgress' | 'notes'>;
}

const presets: Record<TemplateId, HandoverPreset[]> = {
  cafe: [
    {
      id: 'cafe-shift', title: '근무 교대', description: '청소·재료 보충·남은 준비를 전달해요.',
      body: {
        completed: '• 홀 테이블과 바닥 청소: [완료 여부]\n• 컵·뚜껑·냅킨 보충: [완료 여부]',
        inProgress: '• 부족한 재료: [품목 / 남은 수량]\n• 다음 근무자가 할 일: [작업 / 완료할 시간]',
        notes: '• 재료 보관 위치: [위치]\n• 고객 요청·특이사항: [내용 / 없으면 없음]',
      },
    },
    {
      id: 'cafe-close', title: '마감·오픈 준비', description: '세척·정산·다음 날 준비를 정리해요.',
      body: {
        completed: '• 머신·조리도구 세척: [완료 여부]\n• 쓰레기 배출·매장 청소: [완료 여부]\n• 매출 정산: [확인 결과]',
        inProgress: '• 다음 날 준비할 재료: [품목 / 수량]\n• 발주 확인이 필요한 품목: [품목 / 담당자]',
        notes: '• 냉장·냉동 보관 확인: [결과]\n• 전원·문단속 확인: [결과]\n• 오픈 근무자 전달사항: [내용]',
      },
    },
    {
      id: 'cafe-order', title: '주문·예약 전달', description: '예약 시간·준비 상태·요청사항을 넘겨요.',
      body: {
        completed: '• 주문·예약 접수: [주문 내용 / 수량]\n• 결제 확인: [선결제 / 현장 결제]\n• 준비 완료한 항목: [내용]',
        inProgress: '• 방문·픽업 시간: [시간]\n• 남은 준비: [메뉴 / 수량 / 준비 시작 시간]',
        notes: '• 주문서 위치: [위치]\n• 고객 요청사항: [내용]\n• 변경 시 확인할 담당자: [담당자]',
      },
    },
  ],
  retail: [
    {
      id: 'retail-shift', title: '근무 교대', description: '시재·매대·택배 전달사항을 정리해요.',
      body: {
        completed: '• 교대 시재 확인: [차액 없음 / 차액 및 보고 여부]\n• 음료·상품 매대 보충: [완료 여부]',
        inProgress: '• 보충할 상품: [품목 / 수량 / 위치]\n• 처리 중인 택배·고객 요청: [내용 / 없으면 없음]',
        notes: '• 소비기한 확인이 필요한 상품: [품목 / 표시 시간]\n• 점주·다음 근무자 전달사항: [내용]',
      },
    },
    {
      id: 'retail-stock', title: '입고·재고 정리', description: '입고 검수·수량 차이·진열 위치를 넘겨요.',
      body: {
        completed: '• 입고 검수 완료: [품목 / 수량]\n• 진열·창고 정리 완료: [품목 / 위치]',
        inProgress: '• 미검수 상품: [품목 / 수량 / 보관 위치]\n• 수량 차이·파손 확인: [내용 / 담당자 확인 상태]',
        notes: '• 거래명세서 위치: [위치]\n• 먼저 진열할 상품: [품목 / 소비기한]\n• 발주 요청: [품목 / 수량]',
      },
    },
    {
      id: 'retail-close', title: '마감·시설 전달', description: '정산·청소·설비 확인 사항을 남겨요.',
      body: {
        completed: '• 마감 정산: [확인 결과]\n• 매장·계산대 청소: [완료 여부]\n• 판매 종료 상품 처리: [품목 / 매장 기준에 따른 처리 결과]',
        inProgress: '• 남은 마감 작업: [내용 / 담당자]\n• 시설 점검·수리 요청: [설비 / 증상 / 접수 상태]',
        notes: '• 냉장·냉동 설비 확인: [결과]\n• 출입문·보안 확인: [결과]\n• 다음 근무자가 확인할 사항: [내용]',
      },
    },
  ],
  general: [],
};

export function getHandoverPresets(templateId: TemplateId): readonly HandoverPreset[] {
  return presets[templateId];
}

export function createPresetDraft(templateId: TemplateId, presetId?: string, now = new Date()): HandoverDraft {
  const preset = presets[templateId].find(({ id }) => id === presetId);
  return { ...createEmptyHandoverDraft(templateId, now), ...preset?.body };
}
