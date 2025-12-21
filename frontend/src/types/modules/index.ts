export interface MenuItem {
    name: string
    path: string
}

export interface ModuleDTO {
    id: number
    code: string
    name: string
    description: string
    icon: string
    menuPath: string
    displayOrder: number
    isActive: boolean
    menuItems: string | null  // JSON string
    createdAt: string
    updatedAt: string
}

export interface ModuleCreateRequest {
    code: string
    name: string
    description?: string
    icon?: string
    menuPath?: string
    displayOrder?: number
    menuItems?: string  // JSON string: [{"name":"...", "path":"..."}]
}
