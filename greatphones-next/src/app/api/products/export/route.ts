import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import ExcelJS from 'exceljs'
import { requireAdmin } from '@/lib/auth-guard'

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return corsOptions(origin)
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const logs = await prisma.productLog.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'GreatPhones'
    wb.created = new Date()

    const ws = wb.addWorksheet('Productos')

    ws.columns = [
      { header: '#', key: 'index', width: 6 },
      { header: 'Fecha', key: 'fecha', width: 18 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Marca', key: 'marca', width: 14 },
      { header: 'Precio', key: 'precio', width: 12 },
      { header: 'Costo', key: 'costo', width: 12 },
      { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Dto.%', key: 'descuento', width: 8 },
      { header: 'Condición', key: 'condicion', width: 14 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Color', key: 'color', width: 14 },
      { header: 'Almacenamiento', key: 'almacenamiento', width: 16 },
      { header: 'RAM', key: 'ram', width: 10 },
      { header: 'Batería', key: 'bateria', width: 10 },
      { header: 'IMEI', key: 'imei', width: 18 },
      { header: 'Origen', key: 'origen', width: 14 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.height = 22
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3D2B' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
    })

    logs.forEach((log, i) => {
      const d = new Date(log.createdAt)
      const fecha = d.toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      ws.addRow({
        index: i + 1,
        fecha,
        nombre: log.name,
        marca: log.brand,
        precio: log.price,
        costo: log.cost,
        stock: log.stock,
        descuento: log.discount > 0 ? log.discount + '%' : '',
        condicion: log.condition,
        tipo: log.type,
        color: log.color || '',
        almacenamiento: log.storage || '',
        ram: log.ram || '',
        bateria: log.battery != null ? log.battery + '%' : '',
        imei: log.imei || '',
        origen: log.source === 'inventory' ? 'Inventario' : log.source === 'duplicate' ? 'Duplicado' : 'Manual',
      })
    })

    const dataRows = ws.getRows(2, logs.length)
    if (dataRows) {
      dataRows.forEach((row) => {
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            right: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          }
        })
      })
    }

    const buf = await wb.xlsx.writeBuffer()

    const dateStr = new Date().toISOString().split('T')[0]
    return new NextResponse(buf, {
      status: 200,
      headers: {
        ...corsHeaders as Record<string, string>,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="productos_log_${dateStr}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting products:', error)
    return NextResponse.json({ error: 'Error al exportar productos' }, { status: 500, headers: corsHeaders })
  }
}
