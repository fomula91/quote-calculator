export function formatKRW(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-"
  return value.slice(0, 10)
}
