"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CATALOG, catalogByCategory } from "@/lib/catalog"
import {
  calculateRulePrice,
  ruleNeedsManualPrice,
  ruleNeedsQuantity,
} from "@/lib/pricing"
import { formatKRW } from "@/lib/format"
import type { Quotation, QuotationItem } from "@/lib/types"

interface ItemState {
  enabled: boolean
  quantity: number
  manualPrice: number
  /** null이면 계산가 사용, 값이 있으면 사용자가 덮어쓴 가격 */
  override: number | null
}

interface CustomItem {
  id: string
  name: string
  description: string
  price: number
}

function initialItemStates(): Record<string, ItemState> {
  return Object.fromEntries(
    CATALOG.map((item) => [
      item.id,
      { enabled: false, quantity: 1, manualPrice: 0, override: null },
    ])
  )
}

export default function Calculator({ quotationId }: { quotationId?: number }) {
  const router = useRouter()
  const isEditing = quotationId != null

  // ── 고객/행사 정보 ────────────────────────
  const [clientName, setClientName] = useState("")
  const [eventName, setEventName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // ── 전역 입력 ────────────────────────────
  const [attendees, setAttendees] = useState(0)
  const [days, setDays] = useState(1)
  const [daysMode, setDaysMode] = useState<"direct" | "dates">("direct")

  // ── 항목 상태 ────────────────────────────
  const [itemStates, setItemStates] =
    useState<Record<string, ItemState>>(initialItemStates)
  const [customItems, setCustomItems] = useState<CustomItem[]>([])
  const customSeq = useRef(0)

  // ── 제안가 ──────────────────────────────
  const [useSuggested, setUseSuggested] = useState(false)
  const [suggestedPrice, setSuggestedPrice] = useState(0)
  const suggestedTouched = useRef(false)

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null)

  // 날짜 범위 → 일수 자동 계산
  useEffect(() => {
    if (daysMode !== "dates" || !startDate || !endDate) return
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end >= start) {
      const diff = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1
      setDays(diff)
    } else {
      setDays(1)
    }
  }, [daysMode, startDate, endDate])

  // 수정 모드: 기존 견적서 로드
  useEffect(() => {
    if (!isEditing) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotationId}`)
        if (!res.ok) throw new Error()
        const { quotation } = (await res.json()) as { quotation: Quotation }
        if (cancelled) return
        setClientName(quotation.clientName)
        setEventName(quotation.eventName)
        setLocation(quotation.location)
        setDescription(quotation.description)
        setStartDate(quotation.startDate ?? "")
        setEndDate(quotation.endDate ?? "")
        setAttendees(quotation.attendees)
        setDays(quotation.days)
        setUseSuggested(quotation.useSuggestedPrice)
        setSuggestedPrice(quotation.suggestedPrice)
        suggestedTouched.current = quotation.useSuggestedPrice

        const nextStates = initialItemStates()
        const loadedCustom: CustomItem[] = []
        for (const item of quotation.items) {
          if (item.itemId.startsWith("custom-")) {
            loadedCustom.push({
              id: item.itemId,
              name: item.name,
              description: item.description,
              price: item.finalPrice,
            })
            continue
          }
          const catalogItem = CATALOG.find((c) => c.id === item.itemId)
          if (!catalogItem) continue
          nextStates[item.itemId] = {
            enabled: true,
            quantity: item.quantity ?? 1,
            manualPrice:
              catalogItem.rule.kind === "manual" ? item.finalPrice : 0,
            override:
              item.isCustomPrice && catalogItem.rule.kind !== "manual"
                ? item.finalPrice
                : null,
          }
        }
        customSeq.current = loadedCustom.length
        setItemStates(nextStates)
        setCustomItems(loadedCustom)
      } catch {
        setMessage({ type: "error", text: "견적서를 불러오지 못했습니다." })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEditing, quotationId])

  // ── 가격 계산 ────────────────────────────
  const priceOf = useCallback(
    (itemId: string): number => {
      const catalogItem = CATALOG.find((c) => c.id === itemId)
      const state = itemStates[itemId]
      if (!catalogItem || !state?.enabled) return 0
      if (state.override != null) return state.override
      return calculateRulePrice(
        catalogItem.rule,
        { attendees, days },
        { quantity: state.quantity, manualPrice: state.manualPrice }
      )
    },
    [itemStates, attendees, days]
  )

  const enabledCatalogItems = useMemo(
    () => CATALOG.filter((item) => itemStates[item.id]?.enabled),
    [itemStates]
  )

  const totalPrice = useMemo(() => {
    const catalogTotal = enabledCatalogItems.reduce(
      (sum, item) => sum + priceOf(item.id),
      0
    )
    const customTotal = customItems.reduce((sum, item) => sum + item.price, 0)
    return catalogTotal + customTotal
  }, [enabledCatalogItems, priceOf, customItems])

  // 제안가를 손대기 전까지는 합계를 따라간다
  useEffect(() => {
    if (!suggestedTouched.current) setSuggestedPrice(totalPrice)
  }, [totalPrice])

  const finalPrice = useSuggested ? suggestedPrice : totalPrice

  // ── 상태 업데이트 헬퍼 ────────────────────
  function patchItem(itemId: string, patch: Partial<ItemState>) {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }))
  }

  function addCustomItem() {
    customSeq.current += 1
    setCustomItems((prev) => [
      ...prev,
      {
        id: `custom-${customSeq.current}-${prev.length}`,
        name: "",
        description: "",
        price: 0,
      },
    ])
  }

  function patchCustomItem(id: string, patch: Partial<CustomItem>) {
    setCustomItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  // ── 저장 ────────────────────────────────
  async function save() {
    if (!clientName.trim() || !eventName.trim()) {
      setMessage({ type: "error", text: "고객명과 행사명을 입력해 주세요." })
      return
    }
    const items: QuotationItem[] = [
      ...enabledCatalogItems.map((item) => {
        const state = itemStates[item.id]
        return {
          itemId: item.id,
          category: item.category,
          name: item.name,
          description: item.description,
          quantity: ruleNeedsQuantity(item.rule) ? state.quantity : undefined,
          isCustomPrice: state.override != null || item.rule.kind === "manual",
          finalPrice: priceOf(item.id),
        }
      }),
      ...customItems.map((item) => ({
        itemId: item.id,
        category: "커스텀",
        name: item.name || "커스텀 항목",
        description: item.description,
        isCustomPrice: true,
        finalPrice: item.price,
      })),
    ]
    const payload = {
      clientName: clientName.trim(),
      eventName: eventName.trim(),
      location,
      startDate: startDate || null,
      endDate: endDate || null,
      description,
      status: "draft" as const,
      attendees,
      days,
      useSuggestedPrice: useSuggested,
      suggestedPrice,
      totalPrice,
      items,
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(
        isEditing ? `/api/quotations/${quotationId}` : "/api/quotations",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEditing ? { ...payload, status: undefined } : payload),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "저장에 실패했습니다.")
      }
      router.push("/quotations")
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "저장에 실패했습니다.",
      })
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-faint">
        견적서를 불러오는 중…
      </div>
    )
  }

  const groups = catalogByCategory()
  const selectedCount = enabledCatalogItems.length + customItems.length

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="rise-in mb-8 flex items-end justify-between">
        <div>
          <p className="micro-label mb-1">
            {isEditing ? "EDIT QUOTATION" : "NEW QUOTATION"}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "견적서 수정" : "새 견적서 작성"}
          </h1>
        </div>
        {message && (
          <p
            className={`text-sm ${message.type === "error" ? "text-danger" : "text-ok"}`}
            role="alert"
          >
            {message.text}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── 좌측: 입력 영역 ─────────────────── */}
        <div className="space-y-6">
          {/* 고객 / 행사 정보 */}
          <section className="panel rise-in p-6">
            <p className="micro-label mb-4">CLIENT / EVENT</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-dim">
                  고객명 <span className="text-accent">*</span>
                </span>
                <input
                  className="field"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="주식회사 OOO"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-dim">
                  행사명 <span className="text-accent">*</span>
                </span>
                <input
                  className="field"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="2026 컨퍼런스"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-dim">행사 장소</span>
                <input
                  className="field"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="코엑스 그랜드볼룸"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-dim">시작일</span>
                  <input
                    type="date"
                    className="field"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-dim">종료일</span>
                  <input
                    type="date"
                    className="field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </div>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm text-ink-dim">비고</span>
                <textarea
                  className="field min-h-20 resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="견적 관련 부가 설명"
                />
              </label>
            </div>
          </section>

          {/* 전역 변수 */}
          <section className="panel rise-in p-6" style={{ animationDelay: "60ms" }}>
            <p className="micro-label mb-4">GLOBAL VARIABLES</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-dim">참여 인원</span>
                <input
                  type="number"
                  min={0}
                  className="field"
                  value={attendees}
                  onChange={(e) => setAttendees(Math.max(0, Number(e.target.value)))}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-dim">행사 일수</span>
                <input
                  type="number"
                  min={1}
                  className="field disabled:opacity-50"
                  value={days}
                  disabled={daysMode === "dates"}
                  onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                />
              </label>
              <div className="block">
                <span className="mb-1.5 block text-sm text-ink-dim">일수 계산 방식</span>
                <div className="flex overflow-hidden rounded-md border border-line">
                  {(
                    [
                      ["direct", "직접 입력"],
                      ["dates", "날짜로 계산"],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDaysMode(mode)}
                      className={`flex-1 px-3 py-2 text-sm transition-colors ${
                        daysMode === mode
                          ? "bg-accent font-semibold text-accent-ink"
                          : "bg-bg-inset text-ink-dim hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 항목 카탈로그 */}
          {groups.map((group, groupIndex) => (
            <section
              key={group.category}
              className="panel rise-in overflow-hidden"
              style={{ animationDelay: `${120 + groupIndex * 60}ms` }}
            >
              <div className="border-b border-line bg-bg-inset/60 px-6 py-3">
                <p className="micro-label">{group.category}</p>
              </div>
              <ul className="divide-y divide-line">
                {group.items.map((item) => {
                  const state = itemStates[item.id]
                  const price = priceOf(item.id)
                  return (
                    <li key={item.id} className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={state.enabled}
                          aria-label={`${item.name} 선택`}
                          className="toggle mt-1"
                          data-on={state.enabled}
                          onClick={() =>
                            patchItem(item.id, { enabled: !state.enabled })
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-0.5 text-sm text-ink-faint">
                            {item.description}
                          </p>
                          {state.enabled && (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              {ruleNeedsQuantity(item.rule) && (
                                <label className="flex items-center gap-2 text-sm text-ink-dim">
                                  {"unitLabel" in item.rule
                                    ? (item.rule.unitLabel ?? "수량")
                                    : "수량"}
                                  <input
                                    type="number"
                                    min={0}
                                    className="field w-24"
                                    value={state.quantity}
                                    onChange={(e) =>
                                      patchItem(item.id, {
                                        quantity: Math.max(0, Number(e.target.value)),
                                      })
                                    }
                                  />
                                </label>
                              )}
                              {ruleNeedsManualPrice(item.rule) && (
                                <label className="flex items-center gap-2 text-sm text-ink-dim">
                                  금액
                                  <input
                                    type="number"
                                    min={0}
                                    step={10000}
                                    className="field w-36"
                                    value={state.manualPrice}
                                    onChange={(e) =>
                                      patchItem(item.id, {
                                        manualPrice: Math.max(0, Number(e.target.value)),
                                      })
                                    }
                                  />
                                </label>
                              )}
                              {!ruleNeedsManualPrice(item.rule) && (
                                <label className="flex items-center gap-2 text-sm text-ink-dim">
                                  <input
                                    type="checkbox"
                                    className="accent-[var(--accent)]"
                                    checked={state.override != null}
                                    onChange={(e) =>
                                      patchItem(item.id, {
                                        override: e.target.checked ? price : null,
                                      })
                                    }
                                  />
                                  가격 직접 수정
                                </label>
                              )}
                              {state.override != null && (
                                <input
                                  type="number"
                                  min={0}
                                  step={10000}
                                  className="field w-36"
                                  value={state.override}
                                  onChange={(e) =>
                                    patchItem(item.id, {
                                      override: Math.max(0, Number(e.target.value)),
                                    })
                                  }
                                />
                              )}
                            </div>
                          )}
                        </div>
                        <p
                          className={`num text-right text-sm font-semibold ${
                            state.enabled ? "text-accent" : "text-ink-faint"
                          }`}
                        >
                          {state.enabled ? formatKRW(price) : "—"}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          {/* 커스텀 항목 */}
          <section className="panel rise-in overflow-hidden" style={{ animationDelay: "360ms" }}>
            <div className="flex items-center justify-between border-b border-line bg-bg-inset/60 px-6 py-3">
              <p className="micro-label">커스텀 항목</p>
              <button type="button" className="btn btn-ghost !py-1 text-xs" onClick={addCustomItem}>
                + 항목 추가
              </button>
            </div>
            {customItems.length === 0 ? (
              <p className="px-6 py-5 text-sm text-ink-faint">
                카탈로그에 없는 항목은 직접 추가할 수 있습니다.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {customItems.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                    <input
                      className="field w-44 flex-1"
                      placeholder="항목명"
                      value={item.name}
                      onChange={(e) => patchCustomItem(item.id, { name: e.target.value })}
                    />
                    <input
                      className="field w-52 flex-[2]"
                      placeholder="설명 (선택)"
                      value={item.description}
                      onChange={(e) =>
                        patchCustomItem(item.id, { description: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      className="field w-36"
                      placeholder="금액"
                      value={item.price}
                      onChange={(e) =>
                        patchCustomItem(item.id, {
                          price: Math.max(0, Number(e.target.value)),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-danger !px-2.5 !py-1.5 text-xs"
                      onClick={() =>
                        setCustomItems((prev) => prev.filter((c) => c.id !== item.id))
                      }
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── 우측: 요약 패널 ─────────────────── */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="panel rise-in overflow-hidden" style={{ animationDelay: "150ms" }}>
            <div className="border-b border-line bg-bg-inset/60 px-5 py-3">
              <p className="micro-label">SUMMARY · {selectedCount}개 항목</p>
            </div>

            <div className="max-h-72 overflow-y-auto px-5 py-3">
              {selectedCount === 0 ? (
                <p className="py-6 text-center text-sm text-ink-faint">
                  선택된 항목이 없습니다
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {enabledCatalogItems.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span className="truncate text-ink-dim">{item.name}</span>
                      <span className="num shrink-0">{formatKRW(priceOf(item.id))}</span>
                    </li>
                  ))}
                  {customItems.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span className="truncate text-ink-dim">
                        {item.name || "커스텀 항목"}
                      </span>
                      <span className="num shrink-0">{formatKRW(item.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3 border-t border-line px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-dim">합계</span>
                <span className="num font-semibold">{formatKRW(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-ink-dim">
                  <input
                    type="checkbox"
                    className="accent-[var(--accent)]"
                    checked={useSuggested}
                    onChange={(e) => setUseSuggested(e.target.checked)}
                  />
                  제안가 적용
                </label>
                {useSuggested && (
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    className="field w-36 text-right"
                    value={suggestedPrice}
                    onChange={(e) => {
                      suggestedTouched.current = true
                      setSuggestedPrice(Math.max(0, Number(e.target.value)))
                    }}
                  />
                )}
              </div>
              <div className="flex items-baseline justify-between border-t border-dashed border-line-strong pt-3">
                <span className="micro-label">TOTAL</span>
                <span className="num text-xl font-bold text-accent">
                  {formatKRW(finalPrice)}
                </span>
              </div>
              <p className="text-right text-xs text-ink-faint">
                부가세 별도 · {attendees.toLocaleString()}명 / {days}일
              </p>
            </div>

            <div className="border-t border-line px-5 py-4">
              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={saving}
                onClick={save}
              >
                {saving ? "저장 중…" : isEditing ? "수정 내용 저장" : "견적서 저장"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
