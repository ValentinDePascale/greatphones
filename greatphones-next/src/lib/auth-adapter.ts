import type { Adapter, AdapterUser, AdapterAccount } from 'next-auth/adapters'
import { prisma } from '@/lib/prisma'

function toAdapterUser(user: {
  id: string
  email: string
  name: string | null
  avatar: string | null
  verified: boolean
}): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.avatar,
    emailVerified: user.verified ? new Date() : null,
  }
}

function fromAdapterUser(data: Record<string, unknown>) {
  const { image, emailVerified, ...rest } = data
  return {
    ...rest,
    avatar: image ?? null,
    verified: emailVerified ? true : false,
  }
}

export const authAdapter: Adapter = {
  async createUser(data: AdapterUser) {
    const { id: _id, ...rest } = data
    const user = await prisma.user.create({
      data: fromAdapterUser(rest) as never,
    })
    return toAdapterUser(user as never)
  },

  async getUser(id) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return null
    return toAdapterUser(user as never)
  },

  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return toAdapterUser(user as never)
  },

  async getUserByAccount({ provider, providerAccountId }) {
    const account = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    })
    if (!account?.user) return null
    return toAdapterUser(account.user as never)
  },

  async updateUser(data) {
    const { id, ...rest } = data
    const user = await prisma.user.update({
      where: { id },
      data: fromAdapterUser(rest) as never,
    })
    return toAdapterUser(user as never)
  },

  async deleteUser(id) {
    await prisma.user.delete({ where: { id } })
    return null
  },

  async linkAccount(data: AdapterAccount) {
    await prisma.account.create({ data: data as never })
    return null
  },

  async unlinkAccount({ provider, providerAccountId }) {
    await prisma.account.delete({
      where: { provider_providerAccountId: { provider, providerAccountId } },
    })
  },

  async getSessionAndUser(sessionToken) {
    const userAndSession = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    })
    if (!userAndSession) return null
    const { user, ...session } = userAndSession
    return { user: toAdapterUser(user as never), session }
  },

  async createSession(data) {
    return prisma.session.create({ data: data as never })
  },

  async updateSession(data) {
    return prisma.session.update({
      where: { sessionToken: data.sessionToken },
      data: data as never,
    })
  },

  async deleteSession(sessionToken) {
    await prisma.session.delete({ where: { sessionToken } })
    return null
  },

  async createVerificationToken(data) {
    return prisma.verificationToken.create({ data: data as never })
  },

  async useVerificationToken({ identifier, token }) {
    try {
      return await prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      })
    } catch {
      return null
    }
  },
}
