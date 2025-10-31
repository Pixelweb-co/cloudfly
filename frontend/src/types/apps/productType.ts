export type ProductType = {
  id?: number
  typeDevice?: string
  productCode?: string
  productName?: string
  brand?: string
  model?: string
  licensePlate?: string
  productClass?: string
  classification?: string
  client?: number | null // Se usa 'null' para representar la posibilidad de que no haya cliente asociado
  status?: string
  dateAdded?: string | null // Usamos 'string' para representar la fecha en formato ISO 8601
  invimaRegister?: string
  origin?: string
  voltage?: string
  power?: string
  frequency?: string
  amperage?: string
  purchaseDate?: string
  bookValue?: number
  supplier?: string
  warranty?: string
  warrantyStartDate?: string
  warrantyEndDate?: string
  manual?: string
  periodicity?: string
  location?: string
  placement?: string
  schedules?: []
}
