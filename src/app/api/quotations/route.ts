import { NextRequest, NextResponse } from "next/server"
import { createQuotation, listQuotations } from "@/lib/db"
import type { QuotationPayload } from "@/lib/types"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const quotations = await listQuotations({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  })
  return NextResponse.json({ quotations })
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as QuotationPayload
  if (!payload.clientName?.trim() || !payload.eventName?.trim()) {
    return NextResponse.json(
      { error: "고객명과 행사명은 필수입니다." },
      { status: 400 }
    )
  }
  const quotation = await createQuotation(payload)
  return NextResponse.json({ quotation }, { status: 201 })
}
