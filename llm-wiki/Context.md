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
- SQLite (better-sqlite3) — `data/quotations.db` 로컬 파일, gitignore됨.
- `src/lib/` 도메인 코어(types·catalog·pricing·db·format) / `src/app/` 페이지·API / `src/components/` 계산기·목록 UI.
- 상세 구조·컨벤션·검증 절차는 코드 repo의 `CLAUDE.md`가 정본.

## 핵심 판단 (요약)
- 가격 계산은 하드코딩 대신 선언적 `PricingRule` 5종(fixed/perUnit/perUnitPerDay/attendeeTiered/manual)을 엔진이 해석 — 도메인 교체 시 `catalog.ts`만 바꾼다.
- 카탈로그는 도메인 미정 상태의 예시 데이터(행사/이벤트 성격) — 업종 확정 시 교체 예정.
- 온라인 배포는 아직 안 됨 (2026-08-14 확인). better-sqlite3 로컬 파일 DB라 서버리스 무료 배포(Cloudflare Workers+D1 또는 Vercel+Turso)를 하려면 db 계층의 비동기 외부 DB 전환이 선행 과제.

## 지금 단계
- 계산기·견적서 CRUD·인쇄까지 핵심 기능 구현 완료, GitHub(fomula91/quote-calculator)에 푸시된 상태.
- 다음 한 걸음 후보: 배포 방식 확정(Cloudflare vs Vercel) 및 DB 마이그레이션, 또는 도메인(업종) 확정 후 카탈로그 교체.
