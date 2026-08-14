# 견적계산기 (Quote Calculator)

항목 선택형 실시간 견적 계산 · 견적서 관리 웹앱. Next.js 풀스택 + libSQL(Turso).

**프로덕션**: https://quote-calculator-eight.vercel.app (Vercel, main 브랜치 push 시 자동 배포)

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

로컬 개발은 환경 변수 없이 동작합니다 — 첫 실행 시 로컬 파일 DB `data/quotations.db`가
자동 생성됩니다. `TURSO_DATABASE_URL`을 설정하면 원격 Turso DB에 연결됩니다
(`.env.example` 참조 — 프로덕션은 Vercel Marketplace의 Turso 연동이 자동 주입).

## 페이지

| 경로 | 설명 |
|------|------|
| `/` | 견적 계산기 (신규 작성 / `?id=N`으로 수정) |
| `/quotations` | 견적서 목록 (검색 · 상태 필터 · 상태 변경 · 삭제) |
| `/quotations/[id]/print` | 견적서 인쇄 (A4) |

## API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/quotations?q=&status=` | 목록 조회 |
| POST | `/api/quotations` | 저장 |
| GET | `/api/quotations/[id]` | 단건 조회 |
| PATCH | `/api/quotations/[id]` | 수정 (상태 변경 포함) |
| DELETE | `/api/quotations/[id]` | 삭제 |

## 도메인 커스터마이징

견적 항목과 가격 규칙은 전부 `src/lib/catalog.ts` 한 파일에 있습니다.
업종이 정해지면 이 파일의 `CATEGORIES` / `CATALOG`만 교체하면 됩니다.

지원하는 가격 규칙 (`src/lib/pricing.ts` 엔진이 해석):

- `fixed` — 고정가
- `perUnit` — 수량 × 단가
- `perUnitPerDay` — 수량 × 일수 × 단가 (+ 장기 할인)
- `attendeeTiered` — 참여 인원 구간별 가격 (+ 초과 과금, 상한)
- `manual` — 금액 직접 입력

새 규칙이 필요하면 `src/lib/types.ts`의 `PricingRule`에 variant를 추가하고
`src/lib/pricing.ts`의 `calculateRulePrice`에서 해석하면 됩니다.
