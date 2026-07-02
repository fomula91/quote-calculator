import Link from "next/link"
import { notFound } from "next/navigation"
import PrintButton from "@/components/PrintButton"
import { getQuotation } from "@/lib/db"
import { formatDate, formatKRW } from "@/lib/format"
import { STATUS_LABELS } from "@/lib/types"

export const metadata = { title: "견적서 인쇄 | 견적계산기" }

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quotationId = Number(id)
  if (!Number.isInteger(quotationId) || quotationId <= 0) notFound()

  const quotation = getQuotation(quotationId)
  if (!quotation) notFound()

  const finalPrice = quotation.useSuggestedPrice
    ? quotation.suggestedPrice
    : quotation.totalPrice
  const vat = Math.round(finalPrice * 0.1)

  return (
    <div className="px-6 py-8">
      <div className="print:hidden mx-auto mb-6 flex w-full max-w-[210mm] items-center justify-between">
        <Link href="/quotations" className="btn btn-ghost">
          ← 목록으로
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet mx-auto w-full max-w-[210mm] rounded-sm border border-line p-12 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-start justify-between border-b-4 border-[#16181c] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-[0.3em]">견 적 서</h1>
            <p className="mt-2 text-sm text-neutral-500">QUOTATION</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-semibold">{quotation.quotationNumber}</p>
            <p className="mt-1 text-neutral-500">
              작성일: {formatDate(quotation.createdAt)}
            </p>
            <p className="text-neutral-500">
              상태: {STATUS_LABELS[quotation.status]}
            </p>
          </div>
        </div>

        {/* 기본 정보 */}
        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex gap-4">
            <dt className="w-20 shrink-0 font-semibold text-neutral-500">고객명</dt>
            <dd className="font-medium">{quotation.clientName}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-20 shrink-0 font-semibold text-neutral-500">행사명</dt>
            <dd className="font-medium">{quotation.eventName}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-20 shrink-0 font-semibold text-neutral-500">행사 장소</dt>
            <dd>{quotation.location || "-"}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-20 shrink-0 font-semibold text-neutral-500">행사 기간</dt>
            <dd>
              {formatDate(quotation.startDate)}
              {quotation.endDate && quotation.endDate !== quotation.startDate
                ? ` ~ ${formatDate(quotation.endDate)}`
                : ""}{" "}
              ({quotation.days}일)
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-20 shrink-0 font-semibold text-neutral-500">참여 인원</dt>
            <dd>{quotation.attendees.toLocaleString()}명</dd>
          </div>
        </dl>

        {/* 항목 테이블 */}
        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-y-2 border-[#16181c] text-left">
              <th className="py-2.5 pr-4 font-semibold">구분</th>
              <th className="py-2.5 pr-4 font-semibold">항목</th>
              <th className="py-2.5 pr-4 text-center font-semibold">수량</th>
              <th className="py-2.5 text-right font-semibold">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {quotation.items.map((item) => (
              <tr key={item.itemId}>
                <td className="py-3 pr-4 align-top text-neutral-500">
                  {item.category}
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {item.description}
                    </p>
                  )}
                </td>
                <td className="py-3 pr-4 text-center align-top">
                  {item.quantity ?? "-"}
                </td>
                <td className="num py-3 text-right align-top">
                  {formatKRW(item.finalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 합계 */}
        <div className="mt-6 ml-auto w-72 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">공급가액</span>
            <span className="num">{formatKRW(finalPrice)}</span>
          </div>
          {quotation.useSuggestedPrice &&
            quotation.suggestedPrice !== quotation.totalPrice && (
              <div className="flex justify-between text-xs text-neutral-400">
                <span>항목 합계 (참고)</span>
                <span className="num line-through">
                  {formatKRW(quotation.totalPrice)}
                </span>
              </div>
            )}
          <div className="flex justify-between">
            <span className="text-neutral-500">부가세 (10%)</span>
            <span className="num">{formatKRW(vat)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-[#16181c] pt-2 text-base font-bold">
            <span>합계 금액</span>
            <span className="num">{formatKRW(finalPrice + vat)}</span>
          </div>
        </div>

        {quotation.description && (
          <div className="mt-10 border-t border-neutral-200 pt-4 text-sm">
            <p className="mb-1 font-semibold text-neutral-500">비고</p>
            <p className="whitespace-pre-wrap">{quotation.description}</p>
          </div>
        )}

        <p className="mt-12 text-center text-xs text-neutral-400">
          본 견적서는 발행일로부터 30일간 유효합니다.
        </p>
      </div>
    </div>
  )
}
