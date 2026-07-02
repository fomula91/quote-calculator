// 견적계산기 공용 타입 정의

/** 모든 항목 계산에 공통으로 쓰이는 전역 변수 */
export interface GlobalInputs {
  /** 참여 인원 */
  attendees: number
  /** 행사 일수 */
  days: number
}

/**
 * 가격 계산 규칙 — 도메인이 바뀌어도 이 규칙 조합으로 대부분의 항목을 표현할 수 있다.
 * 새로운 규칙이 필요하면 여기에 variant를 추가하고 pricing.ts에서 해석하면 된다.
 */
export type PricingRule =
  /** 고정가 */
  | { kind: "fixed"; price: number }
  /** 수량 × 단가 */
  | { kind: "perUnit"; unitPrice: number; unitLabel?: string }
  /** 수량 × 일수 × 단가 (+ 장기 할인) */
  | {
      kind: "perUnitPerDay"
      unitPrice: number
      unitLabel?: string
      /** minDays 이상이면 rate(0~1)만큼 할인. 큰 minDays부터 검사한다. */
      longRunDiscounts?: { minDays: number; rate: number }[]
    }
  /** 참여 인원 구간별 가격 (+ 초과분 과금, 상한) */
  | {
      kind: "attendeeTiered"
      tiers: { upTo: number; price: number }[]
      /** 마지막 구간 초과 시 per명당 price 추가 */
      overflow?: { per: number; price: number }
      /** 최종 금액 상한 */
      cap?: number
    }
  /** 규칙 없이 직접 금액 입력 */
  | { kind: "manual" }

/** 카탈로그(사전 정의 항목) 정의 */
export interface CatalogItem {
  id: string
  category: string
  name: string
  description: string
  rule: PricingRule
}

/** 견적서에 담기는 선택된 항목 (커스텀 항목 포함) */
export interface QuotationItem {
  itemId: string
  category: string
  name: string
  description: string
  quantity?: number
  /** 사용자가 계산가를 덮어쓴 경우 */
  isCustomPrice: boolean
  finalPrice: number
}

export type QuotationStatus = "draft" | "sent" | "confirmed" | "cancelled"

export const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "작성중",
  sent: "발송됨",
  confirmed: "확정",
  cancelled: "취소",
}

/** 저장/수정 요청 페이로드 */
export interface QuotationPayload {
  clientName: string
  eventName: string
  location: string
  startDate: string | null
  endDate: string | null
  description: string
  status: QuotationStatus
  attendees: number
  days: number
  useSuggestedPrice: boolean
  suggestedPrice: number
  totalPrice: number
  items: QuotationItem[]
}

/** DB에 저장된 견적서 */
export interface Quotation extends QuotationPayload {
  id: number
  quotationNumber: string
  createdAt: string
  updatedAt: string
}
