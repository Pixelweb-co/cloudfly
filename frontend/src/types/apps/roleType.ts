// Role Types for RBAC

export type RoleAction = {
  id: number
  code: string
  name: string
  description: string
  granted: boolean
}

export type RoleModulePermissions = {
  moduleId: number
  moduleCode: string
  moduleName: string
  actions: RoleAction[]
}

export type RoleFormData = {
  id?: number
  name: string
  code?: string
  description?: string
  modules: RoleModulePermissions[]
}

export type RolesType = {
  id: number | string
  name: string
  description?: string
  permissions?: any[] // Legacy support if needed
}
