import QuotesListTable from '@/views/ventas/cotizaciones/List/QuotesListTable'
import { axiosInstance } from '@/utils/axiosInstance'

const getQuotes = async () => {
  // En Next.js App Router (Server Components), axiosInstance podría necesitar configuración si usa cookies
  // Pero como QuotesListTable es 'use client', el fetch inicial lo haremos en el componente o aquí si es posible.
  // Para simplicidad y siguiendo el patrón del proyecto:
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/quotes/tenant/1`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch quotes')
    return res.json()
  } catch (error) {
    console.error(error)
    return []
  }
}

const QuotesPage = async () => {
    const quotes = await getQuotes()

    return <QuotesListTable tableData={quotes} onReload={() => {}} />
}

export default QuotesPage
