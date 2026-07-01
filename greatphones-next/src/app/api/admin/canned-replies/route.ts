import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'canned-replies.json')

function getDefaultReplies() {
  return [
    { label: 'Confirmado', text: 'Tu pedido ha sido confirmado y estamos preparandolo. Te avisaremos cuando este listo para envio.' },
    { label: 'Enviado', text: 'Tu pedido fue enviado! Te compartiremos el numero de tracking para que puedas seguirlo.' },
    { label: 'Garantía', text: 'Tu compra tiene garantia de 90 dias segun Ley 24.240. Si tenes algun problema, contactanos.' },
    { label: 'Retiro', text: 'Tu pedido esta listo para retiro en nuestro local: Zelarrayan 179, Bahia Blanca. Horario: Lun a Vie 10-19hs.' },
    { label: 'Demora', text: 'Estamos teniendo una leve demora en tu pedido. Te agradecemos la paciencia y te avisaremos apenas este listo.' },
    { label: 'Gracias', text: 'Gracias por tu compra! Si tenes alguna consulta no dudes en escribirnos. Estamos para ayudarte.' },
  ]
}

function readReplies() {
  try {
    if (!fs.existsSync(DATA_FILE)) return null
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeReplies(replies: any[]) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(replies, null, 2), 'utf-8')
}

export async function GET() {
  try {
    const replies = readReplies()
    if (!replies) {
      return NextResponse.json({ replies: getDefaultReplies() })
    }
    return NextResponse.json({ replies })
  } catch (error) {
    console.error('Error reading canned replies:', error)
    return NextResponse.json({ replies: getDefaultReplies() })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { replies } = body
    if (!Array.isArray(replies)) {
      return NextResponse.json({ error: 'replies must be an array' }, { status: 400 })
    }
    writeReplies(replies)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving canned replies:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
