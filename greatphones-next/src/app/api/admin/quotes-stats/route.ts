import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

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
      monthlyApproved,
      mostQuoted,
      monthlyBreakdown,
    ] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.quote.count({ where: { status: 'APPROVED' } }),
      prisma.quote.count({ where: { status: 'REJECTED' } }),
      prisma.quote.count({ where: { status: 'REVIEWING' } }),
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
    ]);

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const totalApprovedRevenue = await prisma.quote.aggregate({
      where: { status: 'APPROVED' },
      _sum: { finalPrice: true },
    });

    type MonthlyRow = { month: string; total: number; approved: number; rejected: number; revenue: number };

    return NextResponse.json({
      total,
      pending,
      approved,
      rejected,
      reviewing,
      approvalRate,
      monthlyRevenue: monthlyApproved._sum.finalPrice || 0,
      totalRevenue: totalApprovedRevenue._sum.finalPrice || 0,
      mostQuotedDevice: mostQuoted.length > 0 ? mostQuoted[0].device : null,
      mostQuotedCount: mostQuoted.length > 0 ? mostQuoted[0]._count.device : 0,
      monthlyBreakdown: (monthlyBreakdown as MonthlyRow[]) || [],
    });
  } catch (error) {
    console.error('Error fetching quotes stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
