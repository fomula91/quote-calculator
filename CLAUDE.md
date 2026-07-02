@AGENTS.md

# 견적계산기 (Quote Calculator)

항목 선택형 실시간 견적 계산 · 견적서 관리 웹앱.
congkong 프로젝트의 견적계산기(`CongkongPriceCalculator.vue`)를 본따 독립 프로젝트로 재구성한 것.

## 스택

- Next.js 16 (App Router, Turbopack) + TypeScript + React 19
- Tailwind CSS 4 (`@theme inline` 방식, tailwind.config 없음)
- SQLite (better-sqlite3) — `data/quotations.db`, 첫 실행 시 자동 생성 (gitignore됨)
- 상태 관리 라이브러리 없음 — React useState/useMemo만 사용

## 명령어

```bash
npm run dev     # 개발 서버 (http://localhost:3000)
npm run build   # 프로덕션 빌드 (타입 체크 포함)
npm run start   # 프로덕션 서버
npm run lint    # ESLint
```

## 구조

```
src/
├── lib/
│   ├── types.ts      # 공용 타입 (PricingRule, Quotation, QuotationItem 등)
│   ├── catalog.ts    # ⭐ 견적 항목 카탈로그 — 도메인 바뀌면 이 파일만 교체
│   ├── pricing.ts    # 규칙 해석 엔진 calculateRulePrice()
│   ├── db.ts         # SQLite 커넥션 + quotations 테이블 CRUD
│   └── format.ts     # 원화/날짜 포맷
├── app/
│   ├── page.tsx                        # 계산기 (신규 / ?id=N 수정 모드)
│   ├── quotations/page.tsx             # 견적서 목록
│   ├── quotations/[id]/print/page.tsx  # A4 인쇄 (서버 컴포넌트, db 직접 조회)
│   └── api/quotations/                 # REST API (route.ts, [id]/route.ts)
└── components/
    ├── Calculator.tsx     # 메인 계산기 (client component)
    ├── QuotationList.tsx  # 목록 (client component)
    └── PrintButton.tsx    # window.print 버튼
```

## 핵심 설계: 선언적 가격 규칙 엔진

원본(congkong)은 항목별 계산이 거대한 switch문에 하드코딩되어 있었지만,
여기서는 카탈로그의 각 항목이 `PricingRule`을 선언하고 `pricing.ts` 엔진이 해석한다.

지원 규칙 (`src/lib/types.ts`의 `PricingRule`):

| kind | 계산 | 예시 |
|------|------|------|
| `fixed` | 고정가 | 설문 시스템 20만원 |
| `perUnit` | 수량 × 단가 | 노트북 대당 10만원 |
| `perUnitPerDay` | 수량 × 일수 × 단가 (+ `longRunDiscounts` 장기 할인) | 체크인 데스크 |
| `attendeeTiered` | 인원 구간별 가격 (+ `overflow` 초과 과금, `cap` 상한) | 기본 플랫폼 |
| `manual` | 금액 직접 입력 | 특별 요청 사항 |

전역 변수는 `attendees`(참여 인원), `days`(행사 일수) 두 개 (`GlobalInputs`).

**새 규칙 추가 절차**: `types.ts`의 `PricingRule`에 variant 추가 →
`pricing.ts`의 `calculateRulePrice` switch에 해석 로직 추가 →
필요 시 `ruleNeedsQuantity`/`ruleNeedsManualPrice`와 `Calculator.tsx`의 입력 UI 보강.

**도메인 교체**: 현재 카탈로그는 도메인 미정 상태의 예시 데이터(행사/이벤트 성격).
업종이 정해지면 `catalog.ts`의 `CATEGORIES`/`CATALOG`만 바꾸면 된다.

## 데이터 흐름

- 계산기: 항목 토글/입력 변경 → `priceOf()`가 규칙 엔진 호출 → 실시간 합계.
  사용자가 가격을 덮어쓰면 `override`(ItemState)가 계산가보다 우선.
  제안가(`suggestedPrice`)는 사용자가 손대기 전까지 합계를 자동 추종(`suggestedTouched` ref).
- 저장: POST(신규) / PATCH(수정) `/api/quotations` → 항목은 `items_json` 컬럼에 JSON으로 저장.
  견적번호 `Q-YYYYMMDD-0001`은 insert 후 id 기반으로 생성.
- 수정 모드: `/?id=N` → Calculator가 fetch 후 카탈로그 상태로 역매핑
  (커스텀 항목은 `itemId`가 `custom-` prefix로 구분됨).
- 인쇄 페이지만 서버 컴포넌트에서 db를 직접 읽고, 나머지는 API 경유.

## 컨벤션

- UI 문구는 한국어, 코드 식별자는 영어
- 가격 숫자는 `.num` 클래스 (JetBrains Mono + tabular-nums)
- 색/폰트 토큰은 `globals.css`의 CSS 변수 (`--accent`, `--bg-raised` 등) →
  `@theme inline`으로 Tailwind 클래스(`bg-bg-raised`, `text-accent`)로 노출
- 공통 스타일은 `globals.css`의 클래스 사용: `.panel` `.field` `.btn` `.btn-primary`
  `.btn-ghost` `.btn-danger` `.toggle` `.badge` `.micro-label`
- 다크 테마 고정 ("정밀 계기판" 콘셉트, amber 액센트). 인쇄 페이지만 밝은 지면
- Next.js 16 주의: `params`/`searchParams`는 Promise — 반드시 `await`
- better-sqlite3 커넥션은 dev 모듈 재평가 대비 `globalThis.__quoteDb`에 싱글턴 보관

## 검증

빌드(`npm run build`)가 타입 체크를 겸한다. API 스모크 테스트는 서버 띄운 뒤:

```bash
curl -s localhost:3000/api/quotations                      # 목록
curl -s -X POST localhost:3000/api/quotations -H 'Content-Type: application/json' -d '{...}'
```
