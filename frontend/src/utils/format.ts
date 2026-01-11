/**
 * Format utilities for dashboard and reports
 */

/**
 * Format number as currency (Colombian Pesos)
 */
export const formatCurrency = (amount: number, locale: string = 'es-CO', currency: string = 'COP'): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

/**
 * Format number with thousands separator
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value)
}

/**
 * Format percentage
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`
}

/**
 * Format date
 */
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    const options: Intl.DateTimeFormatOptions =
        format === 'short'
            ? { year: 'numeric', month: 'short', day: 'numeric' }
            : format === 'long'
                ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }

    return new Intl.DateTimeFormat('es-CO', options).format(dateObj)
}

/**
 * Format relative time (e.g., "hace 5 minutos")
 */
export const formatRelativeTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'hace unos segundos'
    if (diffMin < 60) return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`
    if (diffHour < 24) return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`
    if (diffDay < 7) return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`

    return formatDate(dateObj, 'short')
}

/**
 * Abbreviate large numbers (e.g., 1500 -> 1.5K)
 */
export const abbreviateNumber = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
}

const formatUtils = {
    formatCurrency,
    formatNumber,
    formatPercent,
    formatDate,
    formatRelativeTime,
    abbreviateNumber
}

export default formatUtils
