export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // 4 MB
export const MAX_STORY_VIDEO_BYTES = 25 * 1024 * 1024 // 25 MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

export function isAllowedImageType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value)
}

export function isAllowedVideoType(value: string): value is (typeof ALLOWED_VIDEO_TYPES)[number] {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(value)
}

/** Public URL of a stored asset. Images live in the database, not on S3. */
export function mediaUrl(mediaId: string | null | undefined) {
  return mediaId ? `/api/media/${mediaId}` : null
}

/**
 * Resolve the best image for a tournament card: an uploaded asset first,
 * then any legacy `posterUrl` path, then the bundled placeholder.
 */
export function tournamentPoster(input: {
  posterMediaId?: string | null
  posterUrl?: string | null
}): string | null {
  if (input.posterMediaId) return mediaUrl(input.posterMediaId)
  if (input.posterUrl && input.posterUrl.trim()) return input.posterUrl
  return null
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Read intrinsic dimensions straight from the file header. Supports PNG,
 * JPEG, GIF and WebP (VP8/VP8L/VP8X) — enough for what the uploader accepts.
 * Returns nulls when the header is unfamiliar; callers treat that as unknown.
 */
export function readImageSize(buffer: Buffer): { width: number | null; height: number | null } {
  const unknown = { width: null, height: null }
  if (buffer.length < 24) return unknown

  // PNG: 8-byte signature, then IHDR with width/height as big-endian u32.
  if (buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }

  // GIF: logical screen descriptor, little-endian u16.
  if (buffer.toString('ascii', 0, 3) === 'GIF') {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) }
  }

  // WebP: RIFF container.
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const format = buffer.toString('ascii', 12, 16)
    if (format === 'VP8 ' && buffer.length >= 30) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
    }
    if (format === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
    if (format === 'VP8X' && buffer.length >= 30) {
      const w = buffer.readUIntLE(24, 3) + 1
      const h = buffer.readUIntLE(27, 3) + 1
      return { width: w, height: h }
    }
    return unknown
  }

  // JPEG: walk the segment markers until a Start-Of-Frame.
  if (buffer.readUInt16BE(0) === 0xffd8) {
    let offset = 2
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = buffer[offset + 1]
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
      if (isSof) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
      }
      const segmentLength = buffer.readUInt16BE(offset + 2)
      if (segmentLength <= 0) return unknown
      offset += 2 + segmentLength
    }
  }

  return unknown
}
