import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { randomBytes } from 'crypto'
import sharp from 'sharp'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'upload', 'courier')

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = file.name.split('.').pop() || 'jpg'
  const uniqueName = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
  const filePath = path.join(UPLOAD_DIR, uniqueName)
  const publicPath = `/upload/courier/${uniqueName}`

  // Ensure upload directory exists
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  // Compress and save image
  await sharp(buffer)
    .resize(800, 800, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toFile(filePath)

  return NextResponse.json({ path: publicPath })
}
