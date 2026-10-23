import type { TemplateId } from '../types/handover.ts';

export interface HandoverTemplate {
  id: TemplateId;
  title: string;
  description: string;
  guidance: {
    completed: string;
    inProgress: string;
    notes: string;
  };
  examples: {
    completed: string;
    inProgress: string;
    notes: string;
  };
}

export const templates: HandoverTemplate[] = [
  {
    id: 'cafe',
    title: '카페·음식점',
    description: '매장 운영과 마감 업무를 정리해요.',
    guidance: {
      completed: '청소, 마감, 재고 정리처럼 완료한 업무를 적어 주세요.',
      inProgress: '준비 중인 주문이나 아직 마치지 못한 작업을 적어 주세요.',
      notes: '예약, 고객 요청, 다음 근무자가 알아야 할 내용을 적어 주세요.',
    },
    examples: {
      completed: '홀 바닥 청소와 커피머신 세척 완료',
      inProgress: '내일 사용할 원두 재고 확인 중',
      notes: '오후 6시 단체 예약, 창가 자리 요청',
    },
  },
  {
    id: 'retail',
    title: '편의점·소매점',
    description: '진열, 보충, 검수 내용을 정리해요.',
    guidance: {
      completed: '상품 진열, 매대 보충처럼 마친 업무를 적어 주세요.',
      inProgress: '남은 재고 확인이나 검수할 품목을 적어 주세요.',
      notes: '시설 상태나 고객 관련 특이사항을 적어 주세요.',
    },
    examples: {
      completed: '음료 매대와 냉장고 상품 보충 완료',
      inProgress: '입고 상품 수량 대조 중',
      notes: '계산대 옆 냉장고 문이 잘 닫히지 않아요',
    },
  },
  {
    id: 'general',
    title: '일반 교대근무',
    description: '다음 근무자에게 필요한 내용을 정리해요.',
    guidance: {
      completed: '이번 근무에서 완료한 업무를 적어 주세요.',
      inProgress: '진행 중인 업무와 다음에 할 일을 적어 주세요.',
      notes: '다음 근무자가 알아야 할 전달사항을 적어 주세요.',
    },
    examples: {
      completed: '오전 점검표 작성 완료',
      inProgress: '설비 점검 결과 확인 대기 중',
      notes: '점검 결과가 도착하면 담당자에게 공유해 주세요',
    },
  },
];
