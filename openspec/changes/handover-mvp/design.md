# 인계한장 MVP 기술 설계

## Context

2026-10-22 기준 브랜치는 main, HEAD는 9374d3c다. 업무 코드는 없는 React 스타터이며 SDK 3.8.1이 package.json에 고정 선언되어 있다. 기존 토큰·아이콘·디자인 가이드와 OpenSpec spec-driven 설정을 재사용한다. 동기는 [proposal.md](proposal.md), 원문은 [source-plan.md](source-plan.md)를 참조한다.

이 문서는 superpowers의 요구사항·대안·위험 검토, codex-skills의 요구사항→작업→검증 연결, opsx propose의 산출물 구조를 통합한 검토안이다. 별도 superpowers 설계·계획 문서를 중복 생성하지 않는다. 구현 시작·커밋·푸시·공개는 이번 요청에 포함하지 않는다.

## Goals / Non-Goals

**Goals:** 입력 상태와 영속 상태 분리, 저장 성공 후 화면 반영, 손상 데이터 비파괴 처리, SDK 실패 격리, Android 실기기 검증 가능성 확보.

**Non-Goals:** 범용 Repository·DI·전역 상태 라이브러리·서버·자동 임시 저장·카메라·OCR 도입. 외부 콘솔 변경·번들 업로드·심사 제출도 이번 문서 작업 범위 밖이다.

## Decisions

### 1. 기존 스타터와 단순 화면 상태 사용

추천안은 App에서 홈/템플릿/작성/목록/상세의 화면 상태와 선택 기록 ID, 로드한 기록을 관리하는 방식이다. 편집 입력은 작성 화면의 별도 상태로 둔다. 새 라우터·전역 store보다 의존성과 초기 설정이 적다. 브라우저 URL 기반 deep link는 요구사항이 없어 도입하지 않는다. 플랫폼 뒤로가기·Android 백버튼은 동일한 이동 처리로 연결하고, 홈에서는 정상 종료를 허용한다. SDK 이벤트의 정확한 등록·해제는 설치 패키지 타입과 공식 이벤트 문서를 확인하여 구현한다. 보장할 수 없는 강제 종료·OS 프로세스 제거에는 임시 저장이나 확인을 약속하지 않는다.

대안은 라우터 도입 또는 서버 중심 앱이다. 라우터는 deep link 요구가 생길 때, 서버는 동기화 요구가 생길 때 재검토한다. 현재 5개 화면과 로컬 기록에는 설정·운영 비용이 이점보다 크다.

TDS WebView는 기획서의 채택 예정 사항이지만 아직 설치되지 않았다. 현재 토큰과 기본 HTML 컨트롤로 명세를 만족하는 안을 기본으로 한다. 화면 구현 시 ait:design을 사용하고 TDS 필요성이 확인될 때만 의존성 도입을 검토한다. TDS 사용을 이미 구현된 사실로 취급하지 않는다.

### 2. 데이터 모델과 변경 트랜잭션

```ts
type TemplateId = 'cafe' | 'retail' | 'general';
type Handover = {
  id: string;
  templateId: TemplateId;
  workDate: string; // 유효한 현지 달력 날짜 YYYY-MM-DD
  completed: string;
  inProgress: string;
  notes: string;
  createdAt: string; // ISO 8601 UTC 시각
  updatedAt: string;
};
type RecordsEnvelope = { schemaVersion: 1; records: Handover[] };
```

날짜 기본값은 현지 날짜 구성 요소로 만들고 UTC 변환으로 하루 어긋나지 않게 한다. ID는 신규 생성 시에만 만들고 수정 시 유지한다. 정렬은 workDate 내림차순 → updatedAt 시각 내림차순이며 완전 동률은 기존 순서를 유지하는 안을 사용한다.

`ingye-hanjang:records:v1`에 envelope 하나를 JSON으로 저장한다. 빈 기록도 정상 envelope로 유지하고 마지막 한 건 삭제를 전체 저장소 초기화로 처리하지 않는다. 이 설계에서 일반 삭제는 배열에서 대상만 제거한 뒤 setItem으로 저장한다. removeItem을 이용한 전체 초기화 UI는 제공하지 않는다.

흐름: 정상 로드 완료 → 입력 검증 → 최신 메모리 목록에서 후보 배열 생성 → 쓰기 await → 성공 시 목록·dirty 기준·화면 갱신. 쓰기 중 저장·삭제 중복 요청을 막는다. 실패 시 후보 배열을 확정하지 않고 입력·기존 목록을 보존한다. 단일 앱 인스턴스의 순차 변경을 기본으로 하며 여러 WebView 동시 쓰기의 원자성은 보장하지 않는다.

조회 상태는 loading / ready / error로 구분한다. null만 정상 빈 상태로 해석한다. 파싱 실패·schemaVersion 불일치·필수 필드/날짜/템플릿/시각 오류·중복 ID는 손상 상태로 보고 변경 동작을 차단한다. 원본 문자열을 유지하고 재시도만 제공하며 일부 정상 행만 읽어 나머지를 조용히 유실시키지 않는다. 사용자 승인 없는 초기화·자동 마이그레이션은 없다.

단일 키의 이점은 구현 단순성이다. 매번 전체 직렬화하고 SDK 저장 한도에 제한되는 비용이 있다. 길이 제한 숫자는 근거 없이 만들지 않는다. 긴 한국어·여러 줄·기록 누적을 측정하고 한도 오류 시 실패로 처리한다. 제한 도입이 필요하면 명세 수정으로 결정한다.

### 3. 최소 책임 경계

| 예정 위치 | 책임 | 검증 |
|---|---|---|
| src/data/templates.ts | 세 유형의 안내·예시 | T-01 |
| src/types/handover.ts | 모델 | 타입 검사 |
| src/lib/handover.ts | 입력 검증·정렬·수정 규칙 | 순수 로직 테스트 |
| src/lib/storage.ts | SDK 읽기/쓰기·envelope 검증 | SDK mock 오류 주입 + Android 재실행 |
| src/lib/clipboard.ts | 텍스트 생성·SDK 쓰기 | 정확한 문자열 테스트 + 외부 앱 붙여넣기 |
| src/pages/*Page.tsx | 5개 화면과 사용자 조작 | 브라우저 흐름 + Android |
| src/components/BannerAd.tsx | 조건부 광고와 정리 | 크기·콜백 테스트 + Android |

예정 경로는 실제 구현에서 단순성을 유지하며 조정할 수 있다. 함수와 React Hooks로 시작하며 패턴용 계층은 만들지 않는다. 저장·복사 SDK 호출을 작은 모듈로 묶는 이유는 오류를 재현하고 본문 로그를 차단하기 위해서다. 화면에서 직접 SDK를 호출하는 대안보다 테스트 경계가 분명해지지만 모듈 이동 비용이 조금 생긴다. 테스트용 mock은 운영 저장소 대체 수단이 아니다. 브라우저 localStorage 성공을 토스 Storage 성공으로 오인하지 않는다.

### 4. 화면 흐름과 상태

홈 → 템플릿 → 신규 작성 → 저장 성공 후 상세. 홈 최근 최대 3건/기록 목록 → 상세 → 수정 → 저장 후 동일 상세. 삭제 성공 후 목록. 복사는 화면을 이동하지 않는다. 검증·저장·복사 실패는 화면·입력을 보존한다.

초기 폼/최근 저장 성공 스냅샷과 실제 값을 비교해 dirty를 계산한다. 입력을 되돌리면 dirty가 해제된다. 미저장 복사 성공은 dirty를 유지하고 “복사했어요. 저장은 별도로 해 주세요”처럼 차이를 안내한다. 저장 실패 뒤 dirty는 유지한다. 상세의 없는 ID는 오류 안내와 목록 이동을 제공한다.

안내 문구는 세 템플릿마다 다르게 제공하되 completed/inProgress/notes 라벨은 유지한다. 한글 keep-all, 본문 15px 이상, 전체 글자 11px 초과, 44px 터치, 하단 safe area 34px, 굵기 400~700과 SVG 아이콘 규칙을 적용한다. 플랫폼 상단 내비게이션을 중복 생성하지 않는다.

### 5. 복사 정규화의 검토 기본안

원문이 명시하지 않은 세부 규칙으로, 줄 양끝 공백과 빈 줄은 복사 결과에서 제거하고 나머지 줄은 내용·순서를 보존하여 `- `를 붙인다. 사용자가 이미 쓴 기호는 임의 제거하지 않는다. 출력은 LF 줄바꿈, 섹션 사이 빈 줄 하나, 끝에 추가 줄바꿈 없음으로 고정한다. 편집 중 원문 자체는 변경하지 않는다. 빈 본문·잘못된 날짜는 복사도 차단하는 기본안을 [COPY-02](specs/handover-copy/spec.md)에 명시했다. 이는 원문에서 확정된 사실이 아닌 검토할 설계 결정이다.

### 6. SDK와 광고 수명

공식 문서 기준 import는 `@apps-in-toss/web-framework`의 Storage, Clipboard, TossAds다. 문자열 저장/조회는 Storage.getItem/setItem, 복사는 Clipboard.setText를 await한다. 실제 설치 3.8.1의 타입과 지원 여부를 구현 시작 시 대조한다.

배너는 앱 수준 초기화 상태를 공유해 initialize 한 번 → `callbacks.onInitialized` → attachBanner → 반환 인스턴스 destroy 순으로 다룬다. initialize는 Promise가 아닌 콜백 방식이다. initialize/attachBanner 각각 isSupported를 확인하고 초기화 실패·onNoFill·렌더 실패를 격리한다. 앱 수준 중복 초기화 방지와 화면 수준 mount/cleanup을 구별하며 늦은 콜백은 해제된 화면에 부착하지 않는다. SDK 자동 갱신 외에 타이머 갱신을 추가하지 않는다.

광고를 제외한 기록 콘텐츠의 scrollHeight와 가용 clientHeight를 비교한다. 높이와 기록 수 변경 시 재측정하며 광고 자체 높이로 조건이 바뀌는 순환을 방지한다. 하단 인라인 전체 너비 슬롯을 사용하고 내부 SDK 광고 UI·라벨은 수정하지 않는다. 실패 또는 미노출이면 슬롯 공간도 없앤다. 개발 ID는 `ait-ad-test-banner-id`, 운영 그룹은 UI와 분리된 설정값이다. 운영 ID 미확정이면 광고를 숨기며 운영 확인을 통과 처리하지 않는다.

### 7. 우선순위와 일정

Day 1 작성·템플릿, Day 2 기록·복사, Day 3 이탈 방지·광고·통합 검증 순이다. F-10은 P1 분류지만 최종 MVP 합격 조건이므로 제외하지 않는다. P0 오류가 남으면 Day 4는 안정화에 쓴다. F-11/F-12는 CAM/OCR 검증 항목까지 이번 구현에서 제외하고 선택 조사로만 남긴다. 도입 결정이 생기면 새 명세에서 권한·로컬 OCR·결과 확인 후 삽입·성능 기준을 먼저 확정한다.

## Risks / Trade-offs

- 저장 용량·원자성 미측정 → 누적 기록과 쓰기 실패 주입, 실기기 재실행 확인. 사진 저장 제외.
- 기기 삭제·교체 시 복원 불가 → 로컬 보존 한계와 복사 별도 보관 안내. 서버 백업으로 표현하지 않는다.
- 플랫폼 뒤로가기 구현 차이 → 설치 SDK 이벤트 타입 확인과 Android 시스템·상단 버튼 별도 테스트. 강제 종료 복구는 범위 밖.
- SDK mock의 제한 → mock은 제어 흐름만 검증한다. 실제 SDK·클립보드·광고·키보드 완료 판정은 Android 토스 앱에서 한다.
- iOS 기기 없음 → iOS 미검증 명시, Android 결과로 대체하지 않는다.
- 정산·사업자 적용 조건 미확정 → 원문 수익·유예 숫자를 확정 요건으로 전재하지 않고 출시 시 최신 공식 안내·콘솔을 확인한다.

## Migration Plan

현재 도메인 데이터가 없으므로 v1 신규 생성만 지원한다. 스타터 소스를 보존하며 문서 승인 후 tasks 순서로 구현한다. 알 수 없는 저장 버전은 차단하고 추후 별도 마이그레이션을 설계한다. 롤백하더라도 SDK 저장 키를 자동 삭제하지 않는다. 심사 제출·공개는 별도 승인 및 절차로 진행한다.

## 근거와 확인 상태

2026-10-22 공식 문서 조회 기준이며 SDK 실행 검증은 아니다.

- [Storage](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/storage), [Clipboard.setText](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/clipboard/clipboard.settext): 저장/복사 API 참조. 설치 타입·Android 동작은 구현 단계에서 확인.
- [WebView 배너](https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/web-banner): callbacks 형태 초기화, isSupported, destroy, 테스트 ID, 토스 앱 5.241.0 이상, 샌드박스 광고 미지원 확인. 실제 토스 앱 콘솔 QR 테스트 필요.
- [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame): 스크롤 가능한 화면만 배너, 플랫폼 내비게이션·시스템 뒤로가기·라이트 모드 조건 확인. 스크롤 조건은 광고 API 문서만으로 판단하지 않았다.
- SDK 지원 버전과 npm 패키지 3.8.1은 서로 다른 버전이다. 운영 그룹·콘솔 식별자·정산 조건·실기기 결과는 아직 확인하지 않았다.

## 후속 확인

명세 구조를 바꾸지 않는 구현 전 확인은 설치 SDK 이벤트·지원 API의 정확한 타입, 누적 기록 용량 측정, 실제 콘솔 appName 일치 여부다. 운영 광고 그룹과 사업자·정산 요건은 공개 준비 단계에서 확인한다. 불일치가 요구사항 변경으로 이어지면 조용히 대체하지 않고 명세를 갱신한다.
