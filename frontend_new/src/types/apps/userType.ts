import type { CustomersType } from './customerType'
import type { RolesType } from './roleType'

export interface UsersType {
  id?: number // Cambiar a opcional
  nombres?: string
  apellidos?: string
  username?: string
  password?: string
  confirmPassword?: string
  email?: string
  accountNoExpired?: boolean
  accountNoLocked?: boolean
  credentialNoExpired?: boolean
  enabled?: boolean
  roles?: RolesType[]
  customer?: CustomersType
  avatar:string
}
