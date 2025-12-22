/**
 * RBAC Types - Role-Based Access Control
 */

// Menu item structure from backend
export interface MenuItem {
    label: string
    href?: string
    icon?: string
    prefix?: string
    suffix?: string
    disabled?: boolean
    exactMatch?: boolean
    activeUrl?: string
    excludeLang?: boolean
    children?: MenuItem[]
    isSection?: boolean
    sectionTitle?: string
}

// Action permission
export interface ActionPermission {
    actionId: number
    code: string
    name: string
    granted: boolean
}

// Module with permissions
export interface ModulePermission {
    moduleId: number
    moduleCode: string
    moduleName: string
    icon?: string
    actions: ActionPermission[]
}

// Role with all permissions
export interface Role {
    id: number
    code: string
    name: string
    description?: string
    isSystem: boolean
    tenantId?: number
    isActive: boolean
    modulePermissions: ModulePermission[]
}

// User permissions response
export interface UserPermissions {
    userId?: number
    username: string
    roles: string[]
    permissions: string[] // Format: "module.action" e.g., "pos.read"
    modules: string[]    // Modules the user has access to
    menu: MenuItem[]     // Full menu structure
}

// Request to create/update a role
export interface RoleRequest {
    code: string
    name: string
    description?: string
    tenantId?: number
    permissions: PermissionGrant[]
}

// Permission grant for role creation/update
export interface PermissionGrant {
    moduleActionId?: number
    moduleCode?: string
    actionCode?: string
    granted: boolean
}

// Available roles enum (for type safety)
export type RoleCode =
    | 'SUPERADMIN'
    | 'ADMIN'
    | 'MANAGER'
    | 'VENDEDOR'
    | 'CONTABILIDAD'
    | 'NOMINA'
    | 'MARKETING'

// Module codes enum
export type ModuleCode =
    | 'dashboard'
    | 'pos'
    | 'products'
    | 'customers'
    | 'contacts'
    | 'quotes'
    | 'invoices'
    | 'accounting'
    | 'hr'
    | 'payroll'
    | 'marketing'
    | 'chatbot'
    | 'settings'
    | 'users'
    | 'roles'
    | 'reports'

// Action codes enum
export type ActionCode =
    | 'read'
    | 'create'
    | 'update'
    | 'delete'
    | 'approve'
    | 'void'
    | 'liquidate'
    | 'pay'
    | 'send'
    | 'cancel'
    | 'export'
    | 'process'
