import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getI18n } from '@/lib/i18n/server'

export const runtime = 'nodejs'

/**
 * Serve an uploaded image out of the database. Assets are immutable — the
 * id changes whenever the bytes change — so they are safe to cache hard.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const asset = await db.mediaAsset.findUnique({
      where: { id },
      select: { data: true, mimeType: true, byteSize: true },
    })

    if (!asset) {
      return NextResponse.json({ error: (await getI18n()).dict.errors.media_not_found }, { status: 404 })
    }

    const bytes = new Uint8Array(asset.data)
    const total = bytes.byteLength
    const headers: Record<string, string> = {
      'Content-Type': asset.mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      // Uploaded files are never executed as documents.
      'Content-Disposition': 'inline',
    }

    // Safari/iOS refuse to play <video> unless the server answers byte-range
    // requests with 206, and every browser needs ranges to seek.
    const range = parseRange(request.headers.get('range'), total)
    if (range === 'invalid') {
      return new NextResponse(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${total}` } })
    }
    if (range) {
      const [start, end] = range
      return new NextResponse(bytes.subarray(start, end + 1), {
        status: 206,
        headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(end - start + 1) },
      })
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: { ...headers, 'Content-Length': String(total) },
    })
  } catch (error) {
    console.error('media fetch failed', error)
    return NextResponse.json({ error: (await getI18n()).dict.errors.media_fetch_failed }, { status: 500 })
  }
}

/**
 * Parse a single `bytes=start-end` range (multi-range is not needed for media
 * playback). Returns null when there is no usable Range header.
 */
function parseRange(header: string | null, total: number): [number, number] | 'invalid' | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/)
  if (!match || (match[1] === '' && match[2] === '')) return null

  let start: number
  let end: number
  if (match[1] === '') {
    // Suffix range: the last N bytes.
    start = Math.max(total - Number(match[2]), 0)
    end = total - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? total - 1 : Math.min(Number(match[2]), total - 1)
  }

  if (start >= total || start > end) return 'invalid'
  return [start, end]
}
