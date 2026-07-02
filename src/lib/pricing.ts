import type { GlobalInputs, PricingRule } from "./types"

/** 항목별 사용자 입력값 */
export interface ItemInputs {
  quantity?: number
  manualPrice?: number
}

/**
 * 규칙 기반 가격 계산 엔진.
 * 카탈로그의 PricingRule을 해석해 금액을 돌려준다.
 */
export function calculateRulePrice(
  rule: PricingRule,
  globals: GlobalInputs,
  inputs: ItemInputs = {}
): number {
  switch (rule.kind) {
    case "fixed":
      return rule.price

    case "perUnit":
      return (inputs.quantity ?? 0) * rule.unitPrice

    case "perUnitPerDay": {
      const quantity = inputs.quantity ?? 0
      const days = Math.max(globals.days, 0)
      let total = quantity * days * rule.unitPrice
      if (rule.longRunDiscounts?.length) {
        const applicable = [...rule.longRunDiscounts]
          .sort((a, b) => b.minDays - a.minDays)
          .find((d) => days >= d.minDays)
        if (applicable) total *= 1 - applicable.rate
      }
      return Math.round(total)
    }

    case "attendeeTiered": {
      const attendees = globals.attendees
      if (attendees <= 0) return 0
      const tiers = [...rule.tiers].sort((a, b) => a.upTo - b.upTo)
      const matched = tiers.find((t) => attendees <= t.upTo)
      let price: number
      if (matched) {
        price = matched.price
      } else {
        const last = tiers[tiers.length - 1]
        if (rule.overflow) {
          const over = attendees - last.upTo
          price =
            last.price + Math.ceil(over / rule.overflow.per) * rule.overflow.price
        } else {
          price = last.price
        }
      }
      return rule.cap != null ? Math.min(price, rule.cap) : price
    }

    case "manual":
      return inputs.manualPrice ?? 0
  }
}

/** 규칙이 수량 입력을 필요로 하는지 */
export function ruleNeedsQuantity(rule: PricingRule): boolean {
  return rule.kind === "perUnit" || rule.kind === "perUnitPerDay"
}

/** 규칙이 직접 금액 입력을 필요로 하는지 */
export function ruleNeedsManualPrice(rule: PricingRule): boolean {
  return rule.kind === "manual"
}
