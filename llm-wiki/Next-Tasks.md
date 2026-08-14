# quote-calculator — 다음 과제

> **형식 계약 (훅이 파싱한다)**: 열린 과제는 `## 열린 과제` 아래 `### N. 제목`.
> 코드 repo의 SessionStart 훅이 `###` 제목들만 추출해 세션에 주입한다.
> 새 과제는 `무엇 → 왜 → 완료 기준`으로 추가하고, 종료되면 아래 종료 기록 표로 옮긴 뒤 지운다.

## 열린 과제

### 2. API 인증 도입 — 공개 URL에서 견적 데이터 무방비 노출 해소
**무엇** — `/api/quotations` 전 엔드포인트와 견적 목록·인쇄 페이지에 접근 제어를 붙인다.
후보: (a) 단일 사용자용 간단 비밀번호/세션, (b) Vercel Deployment Protection(코드 무변경, 단 Vercel 계정 로그인 필요),
(c) Clerk 등 인증 서비스. 규모상 (a) 또는 (b)부터 검토.
**왜** — 2026-08-14 보안 점검에서 확인: 프로덕션 URL(quote-calculator-eight.vercel.app)을 아는 누구나
견적서를 조회·생성·수정·삭제 가능. 실제 고객 데이터가 들어가기 전에 막아야 한다.
**완료 기준** — 비인증 상태에서 API 호출(curl)과 페이지 접근이 401/로그인 화면으로 차단되고,
인증 후에는 기존 흐름(작성→저장→목록→인쇄)이 그대로 동작. 방식 선택은 ADR로 남긴다.
이번에 하지 않는 것: 멀티유저/권한 분리.

### 3. TURSO_AUTH_TOKEN을 Vercel Sensitive 타입으로 전환
**무엇** — Vercel 환경 변수 `TURSO_AUTH_TOKEN`(현재 Non-sensitive)을 Sensitive 타입으로 재등록.
`vercel env rm` 후 `vercel env add --sensitive`로 재등록하거나 대시보드에서 변경.
**왜** — 2026-08-14 보안 점검에서 확인: Non-sensitive 타입이라 대시보드에서 값이 그대로 노출된다.
토큰은 프로덕션 DB 읽기/쓰기 권한(rw)이라 노출 면적을 줄여야 한다.
**완료 기준** — `vercel env ls`에서 타입이 Sensitive(Encrypted)로 표시되고, 재배포 후 프로덕션 API 스모크 통과.

## 종료 기록

| # | 과제 | 결과 | 정본·근거 |
|---|---|---|---|
| 1 | 온라인 배포 (Vercel+Turso) | 2026-08-14 완료 — https://quote-calculator-eight.vercel.app 프로덕션 가동. Turso `database-citrine-cushion` 프로비저닝, GitHub 연결(push 자동 배포). 프로덕션 URL에서 생성/조회/수정/인쇄/삭제 + 영속성 스모크 전부 통과 | [[0001-deploy-vercel-turso]] |
