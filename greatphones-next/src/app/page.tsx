export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--dk)] mb-2">Great Phones API</h1>
        <p className="text-[var(--gray)]">Backend funcionando</p>
        <div className="mt-4 text-sm text-[var(--gray)]">
          <p>Endpoints disponibles:</p>
          <ul className="mt-2 space-y-1">
            <li>GET /api/products</li>
            <li>POST /api/orders</li>
            <li>GET /api/quotes</li>
            <li>POST /api/quotes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
