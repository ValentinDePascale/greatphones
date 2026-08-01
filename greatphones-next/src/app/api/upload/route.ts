import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { requireSession } from '@/lib/auth-guard'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIM = 2000 // max 2000px en cualquier lado



export async function POST(request: Request) {
  try {
    await requireSession(request)
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se recibio archivo' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo JPG, PNG, GIF o WebP' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo es muy grande. Maximo 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(base64, {
        folder: 'greatphones',
        resource_type: 'auto',
        width: MAX_DIM, height: MAX_DIM, crop: 'limit', quality: 'auto', fetch_format: 'auto',
      }, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
    })

    return NextResponse.json({
      url: (uploadResult as any).secure_url,
      publicId: (uploadResult as any).public_id,
    }, {
      headers: { 'Access-Control-Allow-Origin': 'https://greatphones.onrender.com' }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error subiendo imagen' }, { status: 500 })
  }
}
