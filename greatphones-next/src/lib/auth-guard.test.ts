import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/session', () => ({
  getSessionFromCookies: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

const { prisma } = await import('@/lib/prisma')
const { getSessionFromCookies } = await import('@/lib/session')

describe('auth-guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSessionFromCookies).mockReturnValue(null)
  })

  it('ignores X-User-Id header and rejects with 401 (no session)', async () => {
    const { requireSession, AuthError } = await import('./auth-guard')

    const request = new Request('http://localhost/api/wallet/pay', {
      headers: { 'X-User-Id': 'victim-user-id' },
    })

    await expect(requireSession(request)).rejects.toThrow(AuthError)
    await expect(requireSession(request)).rejects.toMatchObject({ status: 401 })
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('authenticates a user via gp-session cookie', async () => {
    const { requireSession } = await import('./auth-guard')

    vi.mocked(getSessionFromCookies).mockReturnValue({ id: 'u1', role: 'CLIENT' })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: 'CLIENT',
    } as any)

    const request = new Request('http://localhost/api/wallet/pay', {
      headers: { cookie: 'gp-session=abc.def' },
    })

    const user = await requireSession(request)
    expect(user.id).toBe('u1')
  })

  it('requireAdmin rejects CLIENT role with 403', async () => {
    const { requireAdmin } = await import('./auth-guard')

    vi.mocked(getSessionFromCookies).mockReturnValue({ id: 'u2', role: 'CLIENT' })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u2',
      email: 'c@b.com',
      role: 'CLIENT',
    } as any)

    const request = new Request('http://localhost/api/admin/users', {
      headers: { cookie: 'gp-session=tok' },
    })

    await expect(requireAdmin(request)).rejects.toMatchObject({ status: 403 })
  })

  it('requireAdmin rejects X-User-Id header alone with 401', async () => {
    const { requireAdmin } = await import('./auth-guard')

    const request = new Request('http://localhost/api/admin/users', {
      headers: { 'X-User-Id': 'admin-id' },
    })

    await expect(requireAdmin(request)).rejects.toMatchObject({ status: 401 })
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('requireSelfOrAdmin allows the owner via cookie', async () => {
    const { requireSelfOrAdmin } = await import('./auth-guard')

    vi.mocked(getSessionFromCookies).mockReturnValue({ id: 'u3', role: 'CLIENT' })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u3',
      email: 's@b.com',
      role: 'CLIENT',
    } as any)

    const request = new Request('http://localhost/api/auth/update', {
      headers: { cookie: 'gp-session=tok' },
    })

    const user = await requireSelfOrAdmin('u3', request)
    expect(user.id).toBe('u3')
  })
})
