import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock userMethods
vi.mock('@/utils/userMethods', () => ({
    userMethods: {
        getUserLogin: vi.fn().mockReturnValue({
            activeTenantId: 'tenant-123',
            activeCompanyId: 'company-456'
        })
    }
}))

// Mock useMediaQuery
vi.mock('@mui/material/useMediaQuery', () => ({
    default: vi.fn().mockReturnValue(false)
}))

// Mock useTheme
vi.mock('@mui/material/styles/useTheme', () => ({
    default: vi.fn().mockReturnValue({
        palette: { mode: 'dark' },
        breakpoints: { down: vi.fn().mockReturnValue('md') }
    })
}))

// Mock SocketContext
vi.mock('@/contexts/SocketContext', () => ({
    useSocket: vi.fn().mockReturnValue({
        socket: null,
        subscribeDashboard: vi.fn(),
        unsubscribeDashboard: vi.fn()
    })
}))

// Mock Redux
vi.mock('@/redux/hooks', () => ({
    useAppSelector: vi.fn().mockReturnValue({
        stats: null,
        loading: false,
        error: null
    }),
    useAppDispatch: vi.fn().mockReturnValue(vi.fn())
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
    usePathname: vi.fn().mockReturnValue('/hola-mundo')
}))

describe('HolaMundo Page', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    it('should export a default component', async () => {
        const mod = await import('@/app/(dashboard)/hola-mundo/page')
        expect(mod.default).toBeDefined()
        expect(typeof mod.default).toBe('function')
    })

    it('should render the main heading', async () => {
        const HolaMundoPage = (await import('@/app/(dashboard)/hola-mundo/page')).default

        // Advance timers to trigger useEffect/setMounted
        vi.advanceTimersByTime(100)

        render(<HolaMundoPage />)

        // The heading "Hola Mundo" should be present
        const heading = screen.getByText('Hola Mundo')
        expect(heading).toBeDefined()
    })

    it('should display the CloudFly AI badge', async () => {
        const HolaMundoPage = (await import('@/app/(dashboard)/hola-mundo/page')).default

        vi.advanceTimersByTime(100)

        render(<HolaMundoPage />)

        const badge = screen.getByText('CloudFly AI — CLOUD-191')
        expect(badge).toBeDefined()
    })

    it('should display the code snippet print("hola mundo")', async () => {
        const HolaMundoPage = (await import('@/app/(dashboard)/hola-mundo/page')).default

        vi.advanceTimersByTime(100)

        render(<HolaMundoPage />)

        const codeSnippet = screen.getByText('hola mundo')
        expect(codeSnippet).toBeDefined()
    })

    it('should display tenant and company info', async () => {
        const HolaMundoPage = (await import('@/app/(dashboard)/hola-mundo/page')).default

        vi.advanceTimersByTime(100)

        render(<HolaMundoPage />)

        expect(screen.getByText('tenant-123')).toBeDefined()
        expect(screen.getByText('company-456')).toBeDefined()
    })

    it('should display the CLOUD-191 ticket reference', async () => {
        const HolaMundoPage = (await import('@/app/(dashboard)/hola-mundo/page')).default

        vi.advanceTimersByTime(100)

        render(<HolaMundoPage />)

        // Should appear in the badge and footer
        const ticketRefs = screen.getAllByText((content, element) => {
            return element?.textContent?.includes('CLOUD-191') ?? false
        })
        expect(ticketRefs.length).toBeGreaterThan(0)
    })

    it('should display feature cards', async () => {
        const HolaMundoPage = (await import('@/app/(dashboard)/hola-mundo/page')).default

        vi.advanceTimersByTime(100)

        render(<HolaMundoPage />)

        expect(screen.getByText('Python Backend')).toBeDefined()
        expect(screen.getByText('CloudFly Platform')).toBeDefined()
        expect(screen.getByText('Next.js 14 Frontend')).toBeDefined()
        expect(screen.getByText('Multi-Tenant')).toBeDefined()
        expect(screen.getByText('Evolution API')).toBeDefined()
        expect(screen.getByText('Kafka Messaging')).toBeDefined()
    })

    it('should display tech stack chips', async () => {
        const HolaMundoPage = (await import('@/app/(dashboard)/hola-mundo/page')).default

        vi.advanceTimersByTime(100)

        render(<HolaMundoPage />)

        expect(screen.getByText('Next.js 14')).toBeDefined()
        expect(screen.getByText('React 18')).toBeDefined()
        expect(screen.getByText('TypeScript')).toBeDefined()
        expect(screen.getByText('Python')).toBeDefined()
        expect(screen.getByText('Docker')).toBeDefined()
    })

    it('should display the Completado chip', async () => {
        const HolaMundoPage = (await import('@/app/(dashboard)/hola-mundo/page')).default

        vi.advanceTimersByTime(100)

        render(<HolaMundoPage />)

        expect(screen.getByText('Completado')).toBeDefined()
    })
})
