export type CategoryType = {
  id?: number
  nombreCategoria?: string
  tenantId?: number | null // Se usa 'null' para representar la posibilidad de que no haya cliente asociado
  status?: string
  dateAdded?: string | null // Usamos 'string' para representar la fecha en formato ISO 8601
  description?: string | null
  parentCategory?: number | null
}
