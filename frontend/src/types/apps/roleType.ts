import { PermissionType } from './permissionTypes'

export type RolesType = {
  id: string
  roleEnum?: string
  permissionList?: PermissionType[]
}
