# 0001. 배포 플랫폼: Vercel + Turso

- 날짜: 2026-08-14
- 상태: 채택됨

## 맥락

핵심 기능은 완성됐지만 로컬에서만 동작. 무료 온라인 배포가 다음 과제로 확정됨([[Next-Tasks]] 1번).
후보는 Cloudflare Workers+D1 vs Vercel+Turso — 어느 쪽이든 better-sqlite3(동기·로컬 파일)를
비동기 외부 DB로 전환해야 한다는 점은 같았다.

## 결정

**Vercel + Turso(libSQL)** 를 채택한다.

- Vercel은 Next.js 16을 어댑터 없이 네이티브 배포 — Cloudflare는 OpenNext 어댑터 경유라
  프레임워크 쪽 변수가 하나 더 생긴다.
- Turso는 SQLite 방언이라 기존 스키마·쿼리를 그대로 옮길 수 있어 전환 비용이 최소.
  Vercel Marketplace 공식 연동(`vercel integration add turso`)으로 env 자동 주입 가능.
- 클라이언트는 `@libsql/client` 하나로 원격(Turso)과 로컬 파일을 모두 커버 —
  로컬 개발은 Turso 계정 없이 `file:data/quotations.db`로 그대로 동작한다.

## 구현 (2026-08-14 완료)

- `src/lib/db.ts`: better-sqlite3 → `@libsql/client` 전환, 전 함수 async화.
  `TURSO_DATABASE_URL` 있으면 원격, 없으면 로컬 파일. 빌드 타임 env 부재에도 안전하도록 lazy 초기화.
- 호출부 async 전파: `app/api/quotations/`(route.ts 2개), `app/quotations/[id]/print/page.tsx`.
- `.env.example` 추가 (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
- 검증: `npm run build` 통과 + 프로덕션 서버에서 목록/생성/단건/수정/검색/인쇄/삭제 curl 스모크 전부 통과.

## 결과

- 코드는 배포 준비 완료. 남은 것은 Turso DB 프로비저닝 + Vercel 프로젝트 연결 + 첫 배포 (사용자 계정 필요).
- 트레이드오프: 동기 API의 단순함을 잃음. 로컬 파일 모드가 남아 있어 개발 경험은 동일.
