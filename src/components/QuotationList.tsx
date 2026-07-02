"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { formatDate, formatKRW } from "@/lib/format"
import { STATUS_LABELS, type Quotation, type QuotationStatus } from "@/lib/types"

const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [QuotationStatus, string][]

export default function QuotationList() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (statusFilter) params.set("status", statusFilter)
    try {
      const res = await fetch(`/api/quotations?${params}`)
      const data = (await res.json()) as { quotations: Quotation[] }
      setQuotations(data.quotations)
    } finally {
      setLoading(false)
    }
  }, [query, statusFilter])

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0)
    return () => clearTimeout(timer)
  }, [load, query])

  async function changeStatus(id: number, status: QuotationStatus) {
    await fetch(`/api/quotations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    )
  }

  async function remove(id: number) {
    if (!window.confirm("이 견적서를 삭제할까요?")) return
    await fetch(`/api/quotations/${id}`, { method: "DELETE" })
    setQuotations((prev) => prev.filter((q) => q.id !== id))
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="rise-in mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="micro-label mb-1">QUOTATIONS</p>
          <h1 className="text-2xl font-bold tracking-tight">견적서 목록</h1>
        </div>
        <Link href="/" className="btn btn-primary">
          + 새 견적서
        </Link>
      </div>

      <div className="rise-in mb-4 flex flex-wrap gap-3">
        <input
          className="field max-w-xs"
          placeholder="고객명 · 행사명 · 견적번호 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="field w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">전체 상태</option>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="panel rise-in overflow-x-auto" style={{ animationDelay: "80ms" }}>
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line bg-bg-inset/60 text-left">
              <th className="micro-label px-5 py-3 font-semibold">견적번호</th>
              <th className="micro-label px-4 py-3 font-semibold">고객 / 행사</th>
              <th className="micro-label px-4 py-3 font-semibold">일정</th>
              <th className="micro-label px-4 py-3 text-right font-semibold">금액</th>
              <th className="micro-label px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line row-list">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-ink-faint">
                  불러오는 중…
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-ink-faint">
                  저장된 견적서가 없습니다.{" "}
                  <Link href="/" className="text-accent underline underline-offset-4">
                    첫 견적서를 작성해 보세요
                  </Link>
                </td>
              </tr>
            ) : (
              quotations.map((q) => (
                <tr key={q.id} className="row-item">
                  <td className="num px-5 py-3.5 text-ink-dim">{q.quotationNumber}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium">{q.clientName}</p>
                    <p className="text-xs text-ink-faint">{q.eventName}</p>
                  </td>
                  <td className="num px-4 py-3.5 text-xs text-ink-dim">
                    {formatDate(q.startDate)}
                    {q.endDate && q.endDate !== q.startDate
                      ? ` ~ ${formatDate(q.endDate)}`
                      : ""}
                    <span className="text-ink-faint"> · {q.days}일</span>
                  </td>
                  <td className="num px-4 py-3.5 text-right font-semibold text-accent">
                    {formatKRW(q.useSuggestedPrice ? q.suggestedPrice : q.totalPrice)}
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      aria-label="상태 변경"
                      className={`badge badge-${q.status} cursor-pointer appearance-none bg-transparent`}
                      value={q.status}
                      onChange={(e) =>
                        changeStatus(q.id, e.target.value as QuotationStatus)
                      }
                    >
                      {STATUS_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/?id=${q.id}`}
                        className="btn btn-ghost !px-2.5 !py-1 text-xs"
                      >
                        수정
                      </Link>
                      <Link
                        href={`/quotations/${q.id}/print`}
                        className="btn btn-ghost !px-2.5 !py-1 text-xs"
                      >
                        인쇄
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger !px-2.5 !py-1 text-xs"
                        onClick={() => remove(q.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
