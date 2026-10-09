import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Serve an uploaded image out of the database. Assets are immutable — the
 * id changes whenever the bytes change — so they are safe to cache hard.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const asset = await db.mediaAsset.findUnique({
      where: { id },
      select: { data: true, mimeType: true, byteSize: true },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Rasm topilmadi' }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(asset.data), {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Length': String(asset.byteSize),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        // Uploaded files are never executed as documents.
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    console.error('media fetch failed', error)
    return NextResponse.json({ error: 'Rasmni olishda xatolik' }, { status: 500 })
  }
}
