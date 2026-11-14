import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

export async function GET(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { applicationId } = await params
  const application = await db.organizationApplication.findUnique({
    where: { id: applicationId },
    select: { proofData: true, proofFileName: true, proofMimeType: true },
  })
  if (!application?.proofData || !application.proofFileName || !application.proofMimeType) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const filename = application.proofFileName.replace(/[\r\n"]/g, '_')
  return new NextResponse(new Uint8Array(application.proofData), {
    headers: {
      'Content-Type': application.proofMimeType,
      'Content-Length': String(application.proofData.byteLength),
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
