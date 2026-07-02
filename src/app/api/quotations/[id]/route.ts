import { NextRequest, NextResponse } from "next/server"
import { deleteQuotation, getQuotation, updateQuotation } from "@/lib/db"
import type { QuotationPayload } from "@/lib/types"

type Context = { params: Promise<{ id: string }> }

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function GET(_request: NextRequest, { params }: Context) {
  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: "잘못된 ID" }, { status: 400 })
  const quotation = getQuotation(id)
  if (!quotation) {
    return NextResponse.json({ error: "견적서를 찾을 수 없습니다." }, { status: 404 })
  }
  return NextResponse.json({ quotation })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: "잘못된 ID" }, { status: 400 })
  const patch = (await request.json()) as Partial<QuotationPayload>
  const quotation = updateQuotation(id, patch)
  if (!quotation) {
    return NextResponse.json({ error: "견적서를 찾을 수 없습니다." }, { status: 404 })
  }
  return NextResponse.json({ quotation })
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: "잘못된 ID" }, { status: 400 })
  const deleted = deleteQuotation(id)
  if (!deleted) {
    return NextResponse.json({ error: "견적서를 찾을 수 없습니다." }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
