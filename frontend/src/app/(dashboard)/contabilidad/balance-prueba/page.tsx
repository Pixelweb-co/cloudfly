import BalancePruebaView from '@/views/apps/contabilidad/balance-prueba'

export const metadata = {
    title: 'Balance de Prueba - Contabilidad',
    description: 'Balance de Prueba con movimientos y saldos de todas las cuentas'
}

export default function BalancePruebaPage() {
    return <BalancePruebaView />
}
