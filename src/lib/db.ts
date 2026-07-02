import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"
import type { Quotation, QuotationItem, QuotationPayload, QuotationStatus } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")

// Next.js dev 모드의 모듈 재평가로 커넥션이 중복 생성되지 않도록 globalThis에 보관
const globalForDb = globalThis as unknown as { __quoteDb?: Database.Database }

function createDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const db = new Database(path.join(DATA_DIR, "quotations.db"))
  db.pragma("journal_mode = WAL")
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT NOT NULL DEFAULT '',
      client_name TEXT NOT NULL,
      event_name TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      start_date TEXT,
      end_date TEXT,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      attendees INTEGER NOT NULL DEFAULT 0,
      days INTEGER NOT NULL DEFAULT 1,
      use_suggested_price INTEGER NOT NULL DEFAULT 0,
      suggested_price INTEGER NOT NULL DEFAULT 0,
      total_price INTEGER NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)
  return db
}

export function getDb(): Database.Database {
  if (!globalForDb.__quoteDb) globalForDb.__quoteDb = createDb()
  return globalForDb.__quoteDb
}

interface QuotationRow {
  id: number
  quotation_number: string
  client_name: string
  event_name: string
  location: string
  start_date: string | null
  end_date: string | null
  description: string
  status: string
  attendees: number
  days: number
  use_suggested_price: number
  suggested_price: number
  total_price: number
  items_json: string
  created_at: string
  updated_at: string
}

function rowToQuotation(row: QuotationRow): Quotation {
  return {
    id: row.id,
    quotationNumber: row.quotation_number,
    clientName: row.client_name,
    eventName: row.event_name,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
    status: row.status as QuotationStatus,
    attendees: row.attendees,
    days: row.days,
    useSuggestedPrice: row.use_suggested_price === 1,
    suggestedPrice: row.suggested_price,
    totalPrice: row.total_price,
    items: JSON.parse(row.items_json) as QuotationItem[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listQuotations(filter?: {
  q?: string
  status?: string
}): Quotation[] {
  const db = getDb()
  const clauses: string[] = []
  const params: Record<string, string> = {}
  if (filter?.q) {
    clauses.push(
      "(client_name LIKE :q OR event_name LIKE :q OR quotation_number LIKE :q)"
    )
    params.q = `%${filter.q}%`
  }
  if (filter?.status) {
    clauses.push("status = :status")
    params.status = filter.status
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""
  const rows = db
    .prepare(`SELECT * FROM quotations ${where} ORDER BY id DESC`)
    .all(params) as QuotationRow[]
  return rows.map(rowToQuotation)
}

export function getQuotation(id: number): Quotation | null {
  const row = getDb()
    .prepare("SELECT * FROM quotations WHERE id = ?")
    .get(id) as QuotationRow | undefined
  return row ? rowToQuotation(row) : null
}

export function createQuotation(payload: QuotationPayload): Quotation {
  const db = getDb()
  const insert = db.prepare(`
    INSERT INTO quotations (
      client_name, event_name, location, start_date, end_date,
      description, status, attendees, days,
      use_suggested_price, suggested_price, total_price, items_json
    ) VALUES (
      :clientName, :eventName, :location, :startDate, :endDate,
      :description, :status, :attendees, :days,
      :useSuggestedPrice, :suggestedPrice, :totalPrice, :itemsJson
    )
  `)
  const result = insert.run({
    clientName: payload.clientName,
    eventName: payload.eventName,
    location: payload.location,
    startDate: payload.startDate,
    endDate: payload.endDate,
    description: payload.description,
    status: payload.status,
    attendees: payload.attendees,
    days: payload.days,
    useSuggestedPrice: payload.useSuggestedPrice ? 1 : 0,
    suggestedPrice: payload.suggestedPrice,
    totalPrice: payload.totalPrice,
    itemsJson: JSON.stringify(payload.items),
  })
  const id = Number(result.lastInsertRowid)
  const number = `Q-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(id).padStart(4, "0")}`
  db.prepare("UPDATE quotations SET quotation_number = ? WHERE id = ?").run(
    number,
    id
  )
  return getQuotation(id)!
}

export function updateQuotation(
  id: number,
  patch: Partial<QuotationPayload>
): Quotation | null {
  const existing = getQuotation(id)
  if (!existing) return null
  const merged: QuotationPayload = { ...existing, ...patch }
  getDb()
    .prepare(
      `UPDATE quotations SET
        client_name = :clientName, event_name = :eventName, location = :location,
        start_date = :startDate, end_date = :endDate, description = :description,
        status = :status, attendees = :attendees, days = :days,
        use_suggested_price = :useSuggestedPrice, suggested_price = :suggestedPrice,
        total_price = :totalPrice, items_json = :itemsJson,
        updated_at = datetime('now', 'localtime')
      WHERE id = :id`
    )
    .run({
      id,
      clientName: merged.clientName,
      eventName: merged.eventName,
      location: merged.location,
      startDate: merged.startDate,
      endDate: merged.endDate,
      description: merged.description,
      status: merged.status,
      attendees: merged.attendees,
      days: merged.days,
      useSuggestedPrice: merged.useSuggestedPrice ? 1 : 0,
      suggestedPrice: merged.suggestedPrice,
      totalPrice: merged.totalPrice,
      itemsJson: JSON.stringify(merged.items),
    })
  return getQuotation(id)
}

export function deleteQuotation(id: number): boolean {
  const result = getDb().prepare("DELETE FROM quotations WHERE id = ?").run(id)
  return result.changes > 0
}
