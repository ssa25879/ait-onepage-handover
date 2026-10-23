# 인계한장 MVP 작업 인계

**기준일:** 2026-10-23 (KST)\
**상태:** 로컬 구현과 `.ait` 빌드 완료. Android 토스 앱 검증과 콘솔 등록 전이므로 출시 검토 요청·공개 준비는 미완료.

## 완료한 구현과 로컬 검증

- OpenSpec 작업 1.1~5.2를 구현하고 체크리스트에 완료 표시했다.
- 홈·템플릿 3종·작성·기록 목록·상세·수정·삭제 화면, 로컬 Storage, 날짜/본문 검증, 복사 형식, dirty 이탈 확인, 조건부 배너를 연결했다.
- `npm test`: 35개 통과. Storage·Clipboard·광고 SDK 경계는 주입한 mock으로 검증했다.
- `npx tsc -b`, `npm run lint`, `npm run build`: 통과. 빌드가 프로젝트 루트에 `onepage-handover.ait`를 생성했다. 이 산출물은 Git에서 무시되며 콘솔에 업로드하지 않았다.
- `openspec validate handover-mvp --strict`: 유효.
- Chrome 헤드리스에서 홈→템플릿→작성 및 저장·수정·삭제 흐름을 확인했다. 390px 너비에서 템플릿 안내와 날짜 기본값, 320×470px 뷰포트의 긴 본문 입력·버튼 접근을 확인했다. 실제 토스 앱 WebView 검증으로 간주하지 않는다.

## 아직 확인해야 하는 외부·실기기 조건

- Android 실기기와 토스 앱에서 T-01~T-14, AD-01~AD-08, 손상 데이터 보호를 확인하지 않았다. 현재 작업 환경에는 `adb`와 연결된 Android 기기가 없다. 테스트용 앱 스킴도 생성되지 않았다.
- `npm run build` 산출물은 로컬에만 있다. 테스트용 앱 스킴을 받으려면 `.ait` 번들을 앱인토스 콘솔에 업로드해야 한다. 공식 안내는 번들 업로드 후 생성된 QR/테스트 스킴으로 토스 앱에서 테스트하도록 한다. 출시 검토 요청 전 최소 1회 테스트가 필요하다.
- 로컬 `apps-in-toss.config.ts`의 `appName`은 `onepage-handover`다. 실제 콘솔 등록값과 일치하는지 확인하지 않았다. 공식 등록 안내에서 `appName`은 등록 후 변경할 수 없다고 설명한다.
- 개발 환경은 테스트 그룹 ID를 사용한다. 운영용 `VITE_TOSS_AD_GROUP_ID`는 이 작업공간 환경과 `.env*` 파일에 설정되어 있지 않아 운영 빌드에서는 광고가 숨겨진다. 실제 그룹 생성·노출 결과도 확인하지 않았다.
- 공식 광고 안내의 사업자 정보·정산 정보·광고 그룹 설정은 콘솔에서 확인해야 한다. 정산 조건은 변경될 수 있으므로 실제 운영 전 최신 안내와 파트너 계정 상태를 다시 대조한다.
- 저장소에는 기본 `public/appsintoss-logo.png`와 파비콘만 확인했다. 콘솔용 브랜드 로고·앱 설명·등록 스크린샷은 준비 또는 등록 여부를 확인하지 않았다.
- 첫 사용의 템플릿 선택→복사 성공 2분 목표는 실제 Android 사용자 흐름에서 측정하지 않았다. iOS는 미검증이며 카메라(F-11)·OCR(F-12)는 이번 MVP 구현에서 제외했다. 검토 승인·출시는 진행하지 않았다.

## 다음 작업

1. `.ait`를 승인된 앱인토스 콘솔 앱에 업로드해 테스트용 QR/스킴을 만든다.
2. Android 토스 앱에서 저장 재실행, 외부 앱 붙여넣기, 플랫폼·시스템 뒤로가기, 키보드, 광고 실패·복귀, 누적 기록을 기록한다.
3. 파트너 계정의 사업자/정산 정보와 운영 광고 그룹을 확인하고 `VITE_TOSS_AD_GROUP_ID`를 설정해 운영 광고 노출을 검증한다.
4. 앱 이름·설명·브랜드 로고·스크린샷 준비 상태를 콘솔에서 확인하고, 실제 기기 조건과 함께 2분 UX 목표를 측정한다.
5. 최신 비게임 출시 가이드와 검토 절차를 다시 대조한 뒤 6.1~6.3 체크리스트를 갱신한다.

## 공식 안내

- [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame)
- [미니앱 테스트하기](https://developers-apps-in-toss.toss.im/guide/operation/toss)
- [미니앱 등록하기](https://developers-apps-in-toss.toss.im/guide/operation/console-workspace)
- [인앱 광고](https://developers-apps-in-toss.toss.im/guide/monetization/in-app-ad)
- [정산](https://developers-apps-in-toss.toss.im/guide/settlement)
