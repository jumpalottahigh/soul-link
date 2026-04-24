import { useRef, useEffect, useCallback } from 'react'
import type { Drawing } from '../lib/types'

interface Props {
  drawing: Drawing
}

export function DrawingPreview({ drawing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent')
      .trim()

    ctx.strokeStyle = accent || '#fb7185'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 0.4

    for (const stroke of drawing) {
      if (stroke.points.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(
        stroke.points[0].x * canvas.width,
        stroke.points[0].y * canvas.height
      )
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(
          stroke.points[i].x * canvas.width,
          stroke.points[i].y * canvas.height
        )
      }
      ctx.stroke()
    }
  }, [drawing])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      redraw()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [redraw])

  useEffect(() => {
    redraw()
  }, [redraw])

  if (drawing.length === 0) return null

  return (
    <div
      ref={containerRef}
      className='w-full mt-2 rounded-2xl overflow-hidden'
      style={{ height: 80 }}
    >
      <canvas ref={canvasRef} className='w-full h-full' />
    </div>
  )
}
