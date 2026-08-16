import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleRouteError } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      total,
      pending,
      approved,
      rejected,
      reviewing,
      completed,
      monthlyApproved,
      mostQuoted,
      topDevices,
      byCondition,
      monthlyBreakdown,
      recent,
    ] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.quote.count({ where: { status: 'APPROVED' } }),
      prisma.quote.count({ where: { status: 'REJECTED' } }),
      prisma.quote.count({ where: { status: 'REVIEWING' } }),
      prisma.quote.count({ where: { status: 'COMPLETED' } }),
      prisma.quote.aggregate({
        where: { status: 'APPROVED', createdAt: { gte: startOfMonth } },
        _sum: { finalPrice: true },
      }),
      prisma.quote.groupBy({
        by: ['device'],
        _count: { device: true },
        orderBy: { _count: { device: 'desc' } },
        take: 1,
      }),
      prisma.quote.groupBy({
        by: ['device'],
        _count: { device: true },
        _avg: { finalPrice: true },
        orderBy: { _count: { device: 'desc' } },
        take: 5,
      }),
      prisma.quote.groupBy({
        by: ['condition'],
        _count: { condition: true },
      }),
      prisma.$queryRaw`
        SELECT
          to_char("createdAt", 'YYYY-MM') AS month,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
          COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN "finalPrice" ELSE 0 END), 0)::int AS revenue
        FROM "Quote"
        WHERE "createdAt" >= ${startOfYear}
        GROUP BY month
        ORDER BY month ASC
      `,
      prisma.quote.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          code: true,
          device: true,
          clientName: true,
          finalPrice: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const avgFinalPrice =
      approved > 0
        ? Math.round(
            (await prisma.quote.aggregate({
              where: { status: 'APPROVED' },
              _avg: { finalPrice: true },
            }))._avg.finalPrice || 0
          )
        : 0;

    const totalApprovedRevenue = await prisma.quote.aggregate({
      where: { status: 'APPROVED' },
      _sum: { finalPrice: true },
    });

    type MonthlyRow = { month: string; total: number; approved: number; rejected: number; revenue: number };

    return NextResponse.json({
      totals: {
        total,
        pending,
        approved,
        rejected,
        reviewing,
        completed,
        approvalRate,
        avgFinalPrice,
        totalApprovedValue: totalApprovedRevenue._sum.finalPrice || 0,
        monthlyApprovedValue: monthlyApproved._sum.finalPrice || 0,
      },
      funnel: {
        received: total,
        approved,
        completed,
        conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      topDevices: topDevices.map(d => ({
        device: d.device,
        count: d._count.device,
        avgPrice: Math.round(d._avg.finalPrice || 0),
      })),
      byCondition: byCondition.map(c => ({
        condition: c.condition,
        count: c._count.condition,
      })),
      monthlyBreakdown: (monthlyBreakdown as MonthlyRow[]) || [],
      recent: recent.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      mostQuotedDevice: mostQuoted.length > 0 ? mostQuoted[0].device : null,
      mostQuotedCount: mostQuoted.length > 0 ? mostQuoted[0]._count.device : 0,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
