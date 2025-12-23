export enum BillingCycle {
    MONTHLY = 'MONTHLY',
    QUARTERLY = 'QUARTERLY',
    SEMI_ANNUAL = 'SEMI_ANNUAL',
    ANNUAL = 'ANNUAL',
    CUSTOM = 'CUSTOM'
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    SUSPENDED = 'SUSPENDED',
    PENDING = 'PENDING'
}

export interface SubscriptionResponse {
    id: number
    tenantId: number
    tenantName: string
    planId: number
    planName: string
    billingCycle: BillingCycle
    startDate: string
    endDate: string
    status: SubscriptionStatus
    isAutoRenew: boolean

    // Modules
    moduleIds: number[]
    moduleNames: string[]

    // Effective Limits
    effectiveAiTokensLimit: number | null
    effectiveElectronicDocsLimit: number | null
    effectiveUsersLimit: number | null

    // Overage Configuration
    effectiveAllowOverage: boolean | null
    effectiveAiOveragePricePer1k: number | null
    effectiveDocOveragePriceUnit: number | null

    // Pricing
    monthlyPrice: number | null
    discountPercent: number | null

    notes: string | null
    createdAt: string
    updatedAt: string
}

export interface SubscriptionCreateRequest {
    planId: number
    tenantId: number
    billingCycle?: BillingCycle
    isAutoRenew?: boolean

    // Custom modules (optional)
    customModuleIds?: number[]

    // Custom limits (optional)
    customAiTokensLimit?: number
    customElectronicDocsLimit?: number
    customUsersLimit?: number

    // Custom pricing (optional)
    customMonthlyPrice?: number
    discountPercent?: number

    notes?: string
}

export interface SubscriptionModulesUpdateRequest {
    moduleIds: number[]
}

export interface SubscriptionLimitsUpdateRequest {
    aiTokensLimit: number | null
    electronicDocsLimit: number | null
    usersLimit: number | null
}
