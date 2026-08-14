# quote-calculator — Log

이 프로젝트의 시간순 기억. 최신이 위로.

> **형식 계약 (훅이 파싱한다)**: 날짜 섹션은 `## YYYY-MM-DD`, 항목은 `- **제목**: 내용`.
> 코드 repo의 SessionStart 훅이 최신 섹션의 **제목**들만 추출해 세션에 주입한다.
> 제목은 주입만 보고도 무슨 일이 있었는지 알 수 있게 쓴다.

## 2026-08-14
- **하네스 설치**: LLM-WIKI 하네스 보일러플레이트로 프로젝트 위키 초기화 (repo 내장 모드). CLAUDE.md에 연동 규칙·검증 단계 표 병합, Context.md 초안 작성.
- **배포 상태 확인**: 온라인 배포 안 된 상태 확인 (.vercel 없음, GitHub Deployments 기록 없음). 무료 배포 후보는 Cloudflare Workers+D1 또는 Vercel+Turso — 어느 쪽이든 better-sqlite3 → 비동기 외부 DB 전환 선행 필요.
