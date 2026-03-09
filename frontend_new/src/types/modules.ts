export interface MenuItem {
    name: string
    path: string
}

export interface ModuleDTO {
    id: number
    name: string
    code: string
    description?: string
    icon?: string
    menuPath?: string
    displayOrder: number
    isActive: boolean
    menuItems?: string // JSON string
    createdAt: string
    updatedAt: string
}

export interface ModuleCreateRequest {
    name: string
    code: string
    description?: string
    icon?: string
    menuPath?: string
    displayOrder: number
    menuItems?: string // JSON string
}
