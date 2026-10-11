import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_STORY_VIDEO_BYTES,
  MAX_UPLOAD_BYTES,
  formatBytes,
  isAllowedImageType,
  isAllowedVideoType,
  readImageSize,
} from '@/lib/media'
import { clientIp, minutes, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

/**
 * Image upload endpoint. Bytes are stored in MySQL (`MediaAsset.data`), so
 * the deployment needs no object storage and no S3 credentials. Served back
 * through `GET /api/media/[id]`.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Avval tizimga kiring' }, { status: 401 })
  }

  const ip = await clientIp()
  const limit = rateLimit(`upload:${user.id}:${ip}`, 20, minutes(10))
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: 'Juda ko‘p fayl yuklandi, keyinroq urinib ko‘ring' }, { status: 429 })
  }

  let file: File | null = null
  try {
    const form = await request.formData()
    const entry = form.get('file')
    if (entry instanceof File) file = entry
  } catch {
    return NextResponse.json({ ok: false, error: 'Faylni o‘qib bo‘lmadi' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ ok: false, error: 'Fayl tanlanmagan' }, { status: 400 })
  }

  const isImage = isAllowedImageType(file.type)
  const isVideo = isAllowedVideoType(file.type)
  if (!isImage && !isVideo) {
    return NextResponse.json(
      { ok: false, error: `Faqat ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(', ')} formatlari qabul qilinadi` },
      { status: 415 }
    )
  }

  const maxBytes = isVideo ? MAX_STORY_VIDEO_BYTES : MAX_UPLOAD_BYTES
  if (file.size > maxBytes) {
    return NextResponse.json(
      { ok: false, error: `Fayl juda katta. Maksimal hajm — ${formatBytes(maxBytes)}` },
      { status: 413 }
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    // Image dimensions come from the bytes. Browser video metadata is used by
    // the story player, so video dimensions stay unknown here.
    const { width, height } = isImage ? readImageSize(buffer) : { width: null, height: null }
    if (isImage && width === null && height === null) {
      return NextResponse.json({ ok: false, error: 'Bu fayl rasm emas yoki buzilgan' }, { status: 415 })
    }

    const asset = await db.mediaAsset.create({
      data: {
        mimeType: file.type,
        byteSize: buffer.byteLength,
        width,
        height,
        originalName: file.name.slice(0, 180),
        data: buffer,
        uploadedById: user.id,
      },
      select: { id: true, mimeType: true, width: true, height: true, byteSize: true },
    })

    return NextResponse.json({
      ok: true,
      data: { id: asset.id, url: `/api/media/${asset.id}`, mimeType: asset.mimeType, width: asset.width, height: asset.height, byteSize: asset.byteSize },
    })
  } catch (error) {
    console.error('upload failed', error)
    return NextResponse.json({ ok: false, error: 'Yuklashda server xatosi' }, { status: 500 })
  }
}
