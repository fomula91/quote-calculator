# quote-calculator — Context

Claude Code가 우선 읽는 구현 컨텍스트. "지금 무엇을 만드는가"를 한 장으로 유지한다.
낡으면 고친다 — 이 문서는 이력이 아니라 현재 상태다 (이력은 [[log]]).

## 무엇을 만드는가
- 항목 선택형 실시간 견적 계산 · 견적서 관리 웹앱. 카탈로그에서 항목을 토글/입력하면
  가격 규칙 엔진이 실시간 합계를 내고, 견적서를 저장·수정·목록·A4 인쇄까지 지원한다.
- congkong 프로젝트의 `CongkongPriceCalculator.vue`를 본따 독립 프로젝트로 재구성한 것.
  원본의 거대한 switch문 대신 항목별 `PricingRule` 선언 + `pricing.ts` 해석 엔진 구조.

## 스택 / 구조
- Next.js 16 (App Router, Turbopack) + TypeScript + React 19 + Tailwind CSS 4. 상태 관리 라이브러리 없음.
- libSQL (`@libsql/client`) — `TURSO_DATABASE_URL` 있으면 원격 Turso, 없으면 로컬 파일 `data/quotations.db`. db.ts CRUD는 전부 async.
- `src/lib/` 도메인 코어(types·catalog·pricing·db·format) / `src/app/` 페이지·API / `src/components/` 계산기·목록 UI.
- 상세 구조·컨벤션·검증 절차는 코드 repo의 `CLAUDE.md`가 정본.

## 핵심 판단 (요약)
- 가격 계산은 하드코딩 대신 선언적 `PricingRule` 5종(fixed/perUnit/perUnitPerDay/attendeeTiered/manual)을 엔진이 해석 — 도메인 교체 시 `catalog.ts`만 바꾼다.
- 카탈로그는 도메인 미정 상태의 예시 데이터(행사/이벤트 성격) — 업종 확정 시 교체 예정.
- 배포는 Vercel+Turso ([[0001-deploy-vercel-turso]]). **프로덕션 가동 중**: https://quote-calculator-eight.vercel.app (Vercel 프로젝트 `fomula91s-projects/quote-calculator`, Turso DB `database-citrine-cushion`, GitHub push 자동 배포).
- 로컬 개발은 파일 DB(`data/quotations.db`) — `.env.local`의 TURSO_* 는 의도적으로 주석 처리됨(해제 시 로컬이 프로덕션 DB에 붙으니 주의).

## 지금 단계
- 계산기·견적서 CRUD·인쇄까지 핵심 기능 구현 완료, GitHub(fomula91/quote-calculator)에 푸시된 상태.
- 온라인 배포 완료 (2026-08-14). 열린 과제: API 인증 도입([[Next-Tasks]] 2번 — 현재 프로덕션 API가 무인증 공개 상태), 토큰 Sensitive 전환(3번). 그 외 후보: 도메인(업종) 확정 후 카탈로그 교체, 로컬 기존 견적 데이터의 Turso 이관(필요 시).
