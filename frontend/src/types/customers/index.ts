export interface Customer {
    id: number
    name: string
    nit: string | null
    phone: string | null
    email: string | null
    address: string | null
    contact: string | null
    position: string | null
    type: string | null
    status: boolean | null
    logoUrl: string | null
    dateRegister: string | null
    businessType: 'VENTAS' | 'AGENDAMIENTO' | 'SUSCRIPCION' | 'MIXTO' | null
    businessDescription: string | null
}
