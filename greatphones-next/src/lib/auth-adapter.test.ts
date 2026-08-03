import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from './prisma'

vi.mock('./prisma', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    session: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const { authAdapter } = await import('./auth-adapter')

const DB_USER = {
  id: 'user-1',
  email: 'depavalen9@gmail.com',
  name: 'Test User',
  avatar: 'https://lh3.googleusercontent.com/avatar',
  verified: true,
  password: null,
  phone: null,
  dni: null,
  role: 'CLIENT',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('authAdapter Google OAuth mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createUser maps image->avatar and emailVerified->verified', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue(DB_USER as never)

    const created = await authAdapter.createUser!({
      id: 'ignored',
      name: 'Test User',
      email: 'depavalen9@gmail.com',
      image: 'https://lh3.googleusercontent.com/avatar',
      emailVerified: new Date('2026-01-01'),
    } as never)

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        email: 'depavalen9@gmail.com',
        avatar: 'https://lh3.googleusercontent.com/avatar',
        verified: true,
      },
    })
    expect(created.image).toBe('https://lh3.googleusercontent.com/avatar')
    expect(created.emailVerified).toBeInstanceOf(Date)
  })

  it('createUser sets verified=false when emailVerified is null', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({ ...DB_USER, verified: false } as never)

    await authAdapter.createUser!({
      id: 'ignored',
      name: 'Test User',
      email: 'a@b.com',
      image: null,
      emailVerified: null,
    } as never)

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        email: 'a@b.com',
        avatar: null,
        verified: false,
      },
    })
  })

  it('getUserByEmail returns adapter-shaped user (avatar->image)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(DB_USER as never)

    const user = await authAdapter.getUserByEmail!('depavalen9@gmail.com')
    expect(user?.image).toBe('https://lh3.googleusercontent.com/avatar')
    expect(user?.emailVerified).toBeInstanceOf(Date)
  })

  it('linkAccount passes providerAccountId composite key', async () => {
    vi.mocked(prisma.account.create).mockResolvedValue({} as never)

    await authAdapter.linkAccount!({
      userId: 'user-1',
      provider: 'google',
      providerAccountId: '12345',
      type: 'oauth',
      access_token: 'tok',
    } as never)

    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        provider: 'google',
        providerAccountId: '12345',
        type: 'oauth',
        access_token: 'tok',
      },
    })
  })

  it('getUserByAccount uses provider_providerAccountId where', async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 'acc-1',
      userId: 'user-1',
      provider: 'google',
      providerAccountId: '12345',
      type: 'oauth',
      user: DB_USER,
    } as never)

    const user = await authAdapter.getUserByAccount!({
      provider: 'google',
      providerAccountId: '12345',
    })
    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: '12345' } },
      include: { user: true },
    })
    expect(user?.email).toBe('depavalen9@gmail.com')
  })
})

