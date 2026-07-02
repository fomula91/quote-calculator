import Calculator from "@/components/Calculator"

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const quotationId = id && Number.isInteger(Number(id)) ? Number(id) : undefined
  return <Calculator key={quotationId ?? "new"} quotationId={quotationId} />
}
