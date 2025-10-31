export type CustomersType = {
  id?: string | null
  name?: string
  email?: string
  nit?: string
  phone?: string
  address?: string
  contact?: string
  position?: string
  type?: string
  status?: boolean
  dateRegister?: string

  contrato?: {
    id?: string
    fechaInicio: string
    fechaFinal: string
    descripcionContrato: string
    estado: number
  } | null
}
