import type { CatalogItem } from "./types"

/**
 * 견적 항목 카탈로그.
 *
 * ⚠️ 도메인 확정 전 뼈대용 예시 데이터입니다.
 * 업종이 정해지면 이 파일의 CATEGORIES / CATALOG만 교체하면 됩니다.
 * 각 항목은 pricing.ts의 규칙 엔진이 지원하는 규칙 유형을 하나씩 시연합니다.
 */

export const CATEGORIES = [
  "기본 서비스",
  "현장 운영",
  "장비 대여",
  "부가 옵션",
] as const

export const CATALOG: CatalogItem[] = [
  // ── 기본 서비스 ──────────────────────────────
  {
    id: "platform-basic",
    category: "기본 서비스",
    name: "기본 플랫폼",
    description: "참여 인원 구간별 기본 요금 (인원 초과 시 1,000명당 추가 과금)",
    rule: {
      kind: "attendeeTiered",
      tiers: [
        { upTo: 100, price: 1_300_000 },
        { upTo: 300, price: 2_000_000 },
        { upTo: 500, price: 2_500_000 },
      ],
      overflow: { per: 1000, price: 1_000_000 },
    },
  },
  {
    id: "pre-registration",
    category: "기본 서비스",
    name: "사전 등록 시스템",
    description: "인원 구간별 요금, 최대 300만원 상한",
    rule: {
      kind: "attendeeTiered",
      tiers: [
        { upTo: 500, price: 600_000 },
        { upTo: 1000, price: 900_000 },
      ],
      overflow: { per: 1000, price: 300_000 },
      cap: 3_000_000,
    },
  },
  {
    id: "survey-system",
    category: "기본 서비스",
    name: "설문 시스템",
    description: "고정가 항목 예시",
    rule: { kind: "fixed", price: 200_000 },
  },

  // ── 현장 운영 ──────────────────────────────
  {
    id: "checkin-desk",
    category: "현장 운영",
    name: "체크인 데스크",
    description: "세트 × 일수 × 30만원 (2일 10%, 3일 이상 20% 장기 할인)",
    rule: {
      kind: "perUnitPerDay",
      unitPrice: 300_000,
      unitLabel: "세트",
      longRunDiscounts: [
        { minDays: 2, rate: 0.1 },
        { minDays: 3, rate: 0.2 },
      ],
    },
  },
  {
    id: "ops-staff",
    category: "현장 운영",
    name: "운영 인력",
    description: "명 × 일수 × 40만원",
    rule: { kind: "perUnitPerDay", unitPrice: 400_000, unitLabel: "명" },
  },

  // ── 장비 대여 ──────────────────────────────
  {
    id: "laptop-rental",
    category: "장비 대여",
    name: "노트북 대여",
    description: "대당 10만원 (일수 무관)",
    rule: { kind: "perUnit", unitPrice: 100_000, unitLabel: "대" },
  },
  {
    id: "tablet-rental",
    category: "장비 대여",
    name: "태블릿 대여",
    description: "대당 8만원 (일수 무관)",
    rule: { kind: "perUnit", unitPrice: 80_000, unitLabel: "대" },
  },

  // ── 부가 옵션 ──────────────────────────────
  {
    id: "custom-design",
    category: "부가 옵션",
    name: "커스텀 디자인",
    description: "고정가 항목 예시",
    rule: { kind: "fixed", price: 3_000_000 },
  },
  {
    id: "special-request",
    category: "부가 옵션",
    name: "특별 요청 사항",
    description: "금액을 직접 입력하는 항목 예시",
    rule: { kind: "manual" },
  },
]

export function catalogByCategory() {
  return CATEGORIES.map((category) => ({
    category,
    items: CATALOG.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0)
}
