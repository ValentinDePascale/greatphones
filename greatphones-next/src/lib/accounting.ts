import { prisma } from '@/lib/prisma'
import type { AccountingType, PaymentMeans } from '@prisma/client'

/**
 * Núcleo contable (Fase 1 ERP).
 * Registra un asiento en el Libro Diario y actualiza el saldo de caja por
 * medio de pago. Los pesos y dólares NUNCA se mezclan: el monto en pesos va
 * en `amount` y, si el medio es USD, la cantidad real de dólares va en
 * `amountUsd`.
 *
 * Reglas del ERP que se preservan:
 *  - Un asiento independiente por cada medio de pago con monto > 0.
 *  - INGRESO suma, EGRESO resta, NEUTRO no modifica.
 *  - USD se conservan como dólares reales.
 */
export async function registerEntry(opts: {
  source: string
  operationId?: string | null
  description: string
  category?: string | null
  type: AccountingType
  means: PaymentMeans
  amount: number
  amountUsd?: number | null
  opDate?: Date
  operator?: string | null
  createdById?: string | null
  metadata?: Record<string, unknown>
}) {
  const amount = Math.round(opts.amount || 0)
  const entry = await prisma.accountingEntry.create({
    data: {
      source: opts.source,
      operationId: opts.operationId || null,
      description: opts.description,
      category: opts.category || null,
      type: opts.type,
      means: opts.means,
      amount,
      amountUsd: opts.means === 'USD' ? (opts.amountUsd ?? null) : null,
      opDate: opts.opDate || new Date(),
      operator: opts.operator || null,
      createdById: opts.createdById || null,
      metadata: (opts.metadata as any) || undefined,
    },
  })

  await updateCashBalance(opts.means, opts.type, amount, opts.means === 'USD' ? (opts.amountUsd ?? null) : null)
  return entry
}

/** Aplica un asiento sobre el saldo de caja del medio correspondiente. */
async function updateCashBalance(means: PaymentMeans, type: AccountingType, amount: number, amountUsd: number | null) {
  const reg = await prisma.cashRegister.upsert({
    where: { means },
    update: {},
    create: { means, balance: 0, balanceUsd: means === 'USD' ? 0 : null },
  })
  const delta = type === 'INGRESO' ? amount : type === 'EGRESO' ? -amount : 0
  const deltaUsd =
    means === 'USD' && amountUsd != null ? (type === 'INGRESO' ? amountUsd : type === 'EGRESO' ? -amountUsd : 0) : null

  await prisma.cashRegister.update({
    where: { id: reg.id },
    data: {
      balance: reg.balance + delta,
      ...(means === 'USD' ? { balanceUsd: (reg.balanceUsd || 0) + (deltaUsd || 0) } : {}),
    },
  })
}

/** Saldo de caja actual por medio de pago. */
export async function getCashBalances() {
  const regs = await prisma.cashRegister.findMany({ orderBy: { means: 'asc' } })
  return regs.map((r) => ({
    means: r.means,
    balance: r.balance,
    balanceUsd: r.balanceUsd,
  }))
}

/** Libro diario: últimas entradas con filtros. */
export async function listEntries(opts: {
  page?: number
  limit?: number
  means?: PaymentMeans | string | null
  type?: AccountingType | string | null
  search?: string | null
}) {
  const page = Math.max(1, opts.page || 1)
  const limit = Math.min(100, opts.limit || 40)
  const where: any = {}
  if (opts.means) where.means = opts.means
  if (opts.type) where.type = opts.type
  if (opts.search) {
    where.OR = [
      { description: { contains: opts.search, mode: 'insensitive' } },
      { operationId: { contains: opts.search, mode: 'insensitive' } },
      { source: { contains: opts.search, mode: 'insensitive' } },
    ]
  }
  const [data, total] = await Promise.all([
    prisma.accountingEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accountingEntry.count({ where }),
  ])
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) }
}