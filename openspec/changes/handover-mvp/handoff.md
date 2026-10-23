# 인계한장 MVP 작업 인계

**기준일:** 2026-10-23 (KST)\
**상태:** 클립보드 권한 수정과 새 `.ait` 빌드·콘솔 테스트 배포 완료. 사용자가 수정본 확인 완료라고 보고했으나 구체 결과와 기기 환경은 기록되지 않았다. 전체 Android 검증, 최초 앱 정보·번들 검토 제출, 공개 준비는 미완료.

## 완료한 구현과 로컬 검증

- OpenSpec 작업 1.1~5.2를 구현하고 체크리스트에 완료 표시했다.
- 홈·템플릿 3종·작성·기록 목록·상세·수정·삭제 화면, 로컬 Storage, 날짜/본문 검증, 복사 형식, dirty 이탈 확인, 조건부 배너를 연결했다.
- `npm test`: 35개 통과. Storage·Clipboard·광고 SDK 경계는 주입한 mock으로 검증했다.
- 첫 Android 토스 앱 확인에서 복사 버튼의 권한 창에서 `허용` 또는 `한 번만 허용`을 눌러도 복사되지 않는 현상을 사용자가 보고했다. 설정의 `permissions`가 비어 있었고 SDK 문서상 `Clipboard.setText`에는 `clipboard` 쓰기 권한 선언이 필요해 이를 추가했다.
- 권한 수정 뒤 `npm run build`가 통과했다. 새 번들 `20261023-2` (`01a16670-9f71-7d9d-9ce9-9f29abef93af`)은 콘솔 컴파일 `CREATED`까지 확인했고 테스트 푸시를 보냈다. 사용자가 수정본 확인 완료라고 보고했지만 복사 성공 여부의 구체 내용과 기기·OS·토스 앱 버전은 기록되지 않았다. 이 설정 수정 후 별도 단위 테스트는 실행하지 않았다.
- 테스트용 워크스페이스는 `YWS_WorkSpace`(ID `96603`), 앱 초안은 `miniAppId=90479`, appName은 `onepage-handover`다. 기획서의 표시 이름은 `인계한장`이다. SDK 요구사항으로 `titleEn`은 `One Page Handover`로 입력했다.
- `openspec validate handover-mvp --strict`: 유효.
- Chrome 헤드리스에서 홈→템플릿→작성 및 저장·수정·삭제 흐름을 확인했다. 390px 너비에서 템플릿 안내와 날짜 기본값, 320×470px 뷰포트의 긴 본문 입력·버튼 접근을 확인했다. 실제 토스 앱 WebView 검증으로 간주하지 않는다.

## 아직 확인해야 하는 외부·실기기 조건

- 사용자가 수정본 확인 완료라고 보고했다. 구체 결과와 기기·OS·토스 앱 버전은 제공되지 않았다. T-01~T-14, AD-01~AD-08, 손상 데이터 보호의 전체 Android 검증은 남아 있다.
- 수정본 테스트 링크는 이 대화에서 전달했고 사용자가 확인 완료라고 응답했다. 다만 복사 성공 여부의 구체 내용과 기기·OS·토스 앱 버전은 제공되지 않았다. 전체 Android 검증은 계속 미완료다.
- 최초 `miniapp_create` 응답은 4103으로 앱 정보 검토 제출을 거절했다. 응답에 따르면 앱은 생성됐지만 appName 외 앱 정보는 저장되지 않았으며, 최초 등록은 앱 정보와 번들을 함께 내야 한다. 세션에 `initial_review_submit` MCP 도구가 없으므로 실제 최초 제출은 콘솔 웹에서 처리해야 한다. 기존 앱 ID `90479`를 재사용하고 앱을 다시 만들지 않는다.
- 개발 환경은 테스트 그룹 ID를 사용한다. 운영용 `VITE_TOSS_AD_GROUP_ID`는 이 작업공간 환경과 `.env*` 파일에 설정되어 있지 않아 운영 빌드에서는 광고가 숨겨진다. 실제 그룹 생성·노출 결과도 확인하지 않았다.
- 공식 광고 안내의 사업자 정보·정산 정보·광고 그룹 설정은 콘솔에서 확인해야 한다. 정산 조건은 변경될 수 있으므로 실제 운영 전 최신 안내와 파트너 계정 상태를 다시 대조한다.
- 등록용 600×600 PNG `public/onepage-handover-icon.png`를 만들었고 콘솔 임시 업로드를 시도했으나 앱 정보는 저장되지 않았다. 최초 제출 전에 로고와 앱 설명·카테고리·키워드 저장 여부를 콘솔에서 확인하고 필요하면 다시 올린다. 등록 스크린샷은 준비되지 않았다.
- 첫 사용의 템플릿 선택→복사 성공 2분 목표는 실제 Android 사용자 흐름에서 측정하지 않았다. iOS는 미검증이며 카메라(F-11)·OCR(F-12)는 이번 MVP 구현에서 제외했다. 검토 승인·출시는 진행하지 않았다.

## 다음 작업

1. 수정본 확인의 구체 결과와 기기·OS·토스 앱 버전을 기록한다. 예시 입력은 카페·음식점 / 완료 `홀 테이블과 메뉴판 정리 완료` / 진행 `유제품 재고 수량 확인 중` / 전달 `다음 근무에서 오전 입고 품목 검수`다. 복사 결과는 메모 앱 등에 붙여넣어 세 섹션과 줄 순서를 확인한다.
2. Android 토스 앱에서 저장 재실행, 외부 앱 붙여넣기, 플랫폼·시스템 뒤로가기, 키보드, 광고 실패·복귀, 누적 기록과 손상 데이터 보호를 확인하고 6.1에 기기·OS·토스 앱 버전 및 결과를 적는다.
3. 앱 정보와 번들을 콘솔 웹에서 함께 최초 검토 제출한다. `miniAppId=90479`를 재사용하고, 앱 이름·설명·로고·카테고리·키워드가 올바르게 저장됐는지 제출 전에 확인한다.
4. 파트너 계정의 사업자/정산 정보와 운영 광고 그룹을 확인하고 `VITE_TOSS_AD_GROUP_ID`를 설정해 운영 광고 노출을 검증한다.
5. 최신 비게임 출시 가이드와 검토 절차를 다시 대조한 뒤 6.1~6.3 체크리스트를 갱신한다.

## 공식 안내

- [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame)
- [미니앱 테스트하기](https://developers-apps-in-toss.toss.im/guide/operation/toss)
- [미니앱 등록하기](https://developers-apps-in-toss.toss.im/guide/operation/console-workspace)
- [Clipboard.setText](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/clipboard/clipboard.settext)
- [앱 권한](https://developers-apps-in-toss.toss.im/documentation/common/permission)
- [인앱 광고](https://developers-apps-in-toss.toss.im/guide/monetization/in-app-ad)
- [정산](https://developers-apps-in-toss.toss.im/guide/settlement)
