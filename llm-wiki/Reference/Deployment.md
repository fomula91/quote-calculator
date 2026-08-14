# 배포·운영 정본 (Deployment)

프로덕션 운영 정보의 정본. 배포 구조가 바뀌면 이 문서를 갱신한다. 결정 배경은 [[0001-deploy-vercel-turso]].

## 운영 정보 (2026-08-14 기준)

| 항목 | 값 |
|---|---|
| 프로덕션 URL | https://quote-calculator-eight.vercel.app |
| Vercel 프로젝트 | `fomula91s-projects/quote-calculator` (Hobby 플랜) |
| Git 연동 | GitHub `fomula91/quote-calculator` — **main에 push하면 자동 프로덕션 배포** |
| DB | Turso `database-citrine-cushion` (aws-us-east-1, Vercel Marketplace 연동) |
| 환경 변수 | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — Marketplace가 Production/Preview/Development에 자동 주입 |

## 배포 방법

1. **기본**: main에 `git push` → 자동 배포.
2. **수동**: `vercel deploy`(프리뷰) / `vercel deploy --prod`(프로덕션). CLI는 로그인 필요(`vercel whoami`로 확인).
3. **롤백**: `vercel rollback` 또는 대시보드에서 이전 배포로 promote.

## 로컬 vs 프로덕션 DB

- **로컬 개발 = 파일 DB** (`data/quotations.db`). `.env.local`의 `TURSO_*`는 의도적으로 주석 처리되어 있다.
  주석을 해제하면 로컬 dev 서버가 **프로덕션 DB에 직접 붙으므로** 프로덕션 데이터 확인이 필요할 때만 잠깐 해제할 것.
- 프로덕션은 원격 Turso. 로컬 파일 DB의 기존 데이터는 자동 이관되지 않았다 (필요 시 별도 이관).
- 프로덕션 타임스탬프는 UTC (`datetime('now','localtime')`이 서버 UTC로 동작).

## 배포 후 검증 (스모크)

```bash
U=https://quote-calculator-eight.vercel.app
curl -s $U/api/quotations                        # 목록
curl -s -o /dev/null -w '%{http_code}' $U/       # 홈 200
# 생성→조회→삭제로 영속성 확인 (자세한 payload는 CLAUDE.md 검증 섹션)
```

## 알려진 보안 제약

- API·페이지 전부 무인증 공개 — [[Next-Tasks]] 2번 과제.
- `TURSO_AUTH_TOKEN`이 Vercel에 Non-sensitive 타입으로 저장됨 — [[Next-Tasks]] 3번 과제.
