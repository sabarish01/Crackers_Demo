import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), { status: 400 });
    }
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'upload', 'product');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(filepath);
    const publicPath = `/upload/product/${filename}`;
    return new Response(JSON.stringify({ success: true, path: publicPath }), { status: 201 });
  } catch (error: any) {
    console.error('Product image upload error:', error);
    return new Response(JSON.stringify({ error: error?.message || String(error) }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const image = url.searchParams.get('image');
    if (!image || !image.startsWith('/upload/product/')) {
      return new Response(JSON.stringify({ error: 'Invalid image path' }), { status: 400 });
    }
    const filePath = path.join(process.cwd(), 'public', image);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('Product image delete error:', error);
    return new Response(JSON.stringify({ error: error?.message || String(error) }), { status: 500 });
  }
}
