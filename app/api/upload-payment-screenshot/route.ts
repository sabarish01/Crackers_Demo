import { NextRequest, NextResponse } from 'next/server';


export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded or invalid file type' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExt = file.name.split('.').pop();
    const fileName = `payment_${Date.now()}.${fileExt}`;
    // Use Netlify Blobs in production, fallback to local in dev only
  if (process.env.NETLIFY || process.env.NODE_ENV === 'production') {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('payment-screenshots');
      // Convert Buffer to ArrayBuffer for Netlify Blobs
      const arrayBufferData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      await store.set(`payment/${fileName}`, arrayBufferData, { metadata: { contentType: file.type || 'application/octet-stream' } });
      // Netlify Blobs public URL format: /.netlify/blobs/payment-screenshots/payment/filename
      const url = `/.netlify/blobs/payment-screenshots/payment/${fileName}`;
      return NextResponse.json({ url });
    } else if (process.env.NODE_ENV === 'development') {
      // Local fallback for dev only
      const path = await import('path');
      const fs = await import('fs/promises');
      const uploadDir = path.join(process.cwd(), 'public', 'upload', 'payment');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      const url = `/upload/payment/${fileName}`;
      return NextResponse.json({ url });
    } else {
      // Not supported in production if not on Netlify
      return NextResponse.json({ error: 'File upload not supported in this environment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Netlify Blobs upload error:', error);
    return NextResponse.json({ error: 'File upload failed', details: String(error) }, { status: 500 });
  }
}
