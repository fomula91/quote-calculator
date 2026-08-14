# quote-calculator — Log

이 프로젝트의 시간순 기억. 최신이 위로.

> **형식 계약 (훅이 파싱한다)**: 날짜 섹션은 `## YYYY-MM-DD`, 항목은 `- **제목**: 내용`.
> 코드 repo의 SessionStart 훅이 최신 섹션의 **제목**들만 추출해 세션에 주입한다.
> 제목은 주입만 보고도 무슨 일이 있었는지 알 수 있게 쓴다.

## 2026-08-14
- **배포·운영 정본 문서 작성**: Reference/Deployment.md 신설 — 프로덕션 URL·Vercel/Turso 리소스·배포/롤백 방법·로컬 vs 프로덕션 DB 구분·스모크 절차를 한 곳에 정리. index에 링크.
- **보안 점검 및 과제 등록**: env/DB 파일 커밋 여부 전수 점검 — 유출 없음(.env.local·data/·.vercel 전부 ignore, 히스토리에도 토큰 0건, 커밋된 건 빈 템플릿 .env.example뿐). 발견된 문제 2건을 과제로 등록: ① API 무인증 공개(Next-Tasks 2번) ② TURSO_AUTH_TOKEN Non-sensitive 타입(3번).
- **프로덕션 첫 배포 완료**: https://quote-calculator-eight.vercel.app 가동. `vercel link`(GitHub 자동 연결) → Turso 마켓플레이스 연동(`database-citrine-cushion`, env 자동 주입) → 첫 배포(자동 프로덕션 할당) → 프로덕션 스모크 전부 통과. `.env.local`의 TURSO_* 는 로컬이 프로덕션 DB에 붙지 않게 주석 처리. Next-Tasks 1번 종료.
- **Vercel+Turso 채택 및 DB 계층 전환 완료**: ADR 0001로 플랫폼 결정(Next.js 16 네이티브 + SQLite 방언 호환). db.ts를 better-sqlite3 → `@libsql/client` async로 전환, 호출부(API 라우트 2개·인쇄 페이지) await 전파, `.env.example` 추가. `npm run build` 통과 + 프로덕션 서버 curl 스모크(목록/생성/단건/수정/검색/인쇄/삭제) 전부 통과. 남은 것: Turso 프로비저닝 + Vercel 첫 배포.
- **다음 과제를 배포로 확정**: 도메인(업종) 확정보다 온라인 배포를 먼저 하기로 결정. Next-Tasks 1번 과제로 등록(플랫폼 확정 → db.ts 비동기 외부 DB 전환 → 첫 배포), 플랫폼 선택(Cloudflare Workers+D1 vs Vercel+Turso)은 OpenQuestions에 등록.
- **하네스 설치**: LLM-WIKI 하네스 보일러플레이트로 프로젝트 위키 초기화 (repo 내장 모드). CLAUDE.md에 연동 규칙·검증 단계 표 병합, Context.md 초안 작성.
- **배포 상태 확인**: 온라인 배포 안 된 상태 확인 (.vercel 없음, GitHub Deployments 기록 없음). 무료 배포 후보는 Cloudflare Workers+D1 또는 Vercel+Turso — 어느 쪽이든 better-sqlite3 → 비동기 외부 DB 전환 선행 필요.
