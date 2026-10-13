'use client'

import { useCallback, useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'

const MIN_SCALE = 1
const MAX_SCALE = 5
const DOUBLE_TAP_ZOOM = 2.5

type View = { scale: number; x: number; y: number }
const RESET: View = { scale: 1, x: 0, y: 0 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Full-screen image viewer. Zoom with the wheel, double-click/double-tap,
 * pinch or the toolbar; drag to pan while zoomed. Esc or ✕ closes it.
 */
export function ImageViewer({ src, alt, open, onOpenChange }: { src: string; alt: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { dict } = useLanguage()
  const t = dict.chat.thread
  const [view, setView] = useState<View>(RESET)
  const [dragging, setDragging] = useState(false)
  const stage = useRef<HTMLDivElement | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ distance: number; scale: number } | null>(null)
  const lastTap = useRef(0)
  const moved = useRef(false)

  /** Zoom to `next`, keeping the point (px, py) — relative to the stage centre — fixed. */
  const zoomAt = useCallback((next: number, px = 0, py = 0) => {
    setView((v) => {
      const scale = clamp(next, MIN_SCALE, MAX_SCALE)
      if (scale === MIN_SCALE) return RESET
      const ratio = scale / v.scale
      return { scale, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }
    })
  }, [])

  const fromCentre = (clientX: number, clientY: number) => {
    const rect = stage.current?.getBoundingClientRect()
    if (!rect) return { px: 0, py: 0 }
    return { px: clientX - rect.left - rect.width / 2, py: clientY - rect.top - rect.height / 2 }
  }

  // React registers wheel listeners as passive, so preventDefault needs a native one.
  const stageRef = useCallback(
    (node: HTMLDivElement | null) => {
      stage.current = node
      if (!node) return
      node.addEventListener(
        'wheel',
        (event) => {
          event.preventDefault()
          const rect = node.getBoundingClientRect()
          const px = event.clientX - rect.left - rect.width / 2
          const py = event.clientY - rect.top - rect.height / 2
          setView((v) => {
            const scale = clamp(v.scale * Math.exp(-event.deltaY * 0.002), MIN_SCALE, MAX_SCALE)
            if (scale === MIN_SCALE) return RESET
            const ratio = scale / v.scale
            return { scale, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }
          })
        },
        { passive: false }
      )
    },
    []
  )

  const toggleZoom = (clientX: number, clientY: number) => {
    const { px, py } = fromCentre(clientX, clientY)
    if (view.scale > MIN_SCALE) setView(RESET)
    else zoomAt(DOUBLE_TAP_ZOOM, px, py)
  }

  const onPointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    moved.current = false
    setDragging(true)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale }
    }
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const current = { x: event.clientX, y: event.clientY }
    pointers.current.set(event.pointerId, current)
    if (Math.hypot(current.x - previous.x, current.y - previous.y) > 2) moved.current = true

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const { px, py } = fromCentre((a.x + b.x) / 2, (a.y + b.y) / 2)
      zoomAt(pinch.current.scale * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.distance), px, py)
    } else if (pointers.current.size === 1 && view.scale > MIN_SCALE) {
      setView((v) => ({ ...v, x: v.x + current.x - previous.x, y: v.y + current.y - previous.y }))
    }
  }

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) setDragging(false)
    // Mouse double-clicks go through onDoubleClick; detect double-taps here.
    if (event.pointerType !== 'mouse' && !moved.current && pointers.current.size === 0) {
      const now = Date.now()
      if (now - lastTap.current < 300) {
        toggleZoom(event.clientX, event.clientY)
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setView(RESET)
    onOpenChange(next)
  }

  const button = 'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40'

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col outline-none" aria-describedby={undefined}>
          <DialogPrimitive.Title className="sr-only">{alt}</DialogPrimitive.Title>
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button type="button" className={button} aria-label={t.zoom_out} disabled={view.scale <= MIN_SCALE} onClick={() => zoomAt(view.scale / 1.5)}>
              <Minus className="h-5 w-5" />
            </button>
            <button type="button" className={button} aria-label={t.zoom_in} disabled={view.scale >= MAX_SCALE} onClick={() => zoomAt(view.scale * 1.5)}>
              <Plus className="h-5 w-5" />
            </button>
            <button type="button" className={button} aria-label={t.zoom_reset} disabled={view.scale === MIN_SCALE} onClick={() => setView(RESET)}>
              <RotateCcw className="h-5 w-5" />
            </button>
            <DialogPrimitive.Close className={button} aria-label={t.close_viewer}>
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <div
            ref={stageRef}
            className="flex flex-1 touch-none select-none items-center justify-center overflow-hidden"
            style={{ cursor: view.scale > MIN_SCALE ? 'grab' : 'zoom-in' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={(event) => toggleZoom(event.clientX, event.clientY)}
            onClick={(event) => {
              // A plain click on the dark backdrop (not the image) closes the viewer.
              if (event.target === event.currentTarget && view.scale === MIN_SCALE && !moved.current) handleOpenChange(false)
            }}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="max-h-full max-w-full object-contain"
              style={{
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                transition: dragging ? 'none' : 'transform 150ms ease-out',
              }}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
