import { useRef, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import type { Drawing, Stroke, Point } from '../lib/types'

interface Props {
  drawing: Drawing
  onChange: (drawing: Drawing) => void
}

export function DrawingCanvas({ drawing, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const currentStroke = useRef<Point[]>([])

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const clientX =
        'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
      const clientY =
        'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height
      }
    },
    []
  )

  const redraw = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent')
      .trim()

    ctx.strokeStyle = accent || '#fb7185'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const stroke of strokes) {
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
  }, [])

  // Resize canvas to match container and redraw
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      redraw(drawing)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [drawing, redraw])

  // Redraw when drawing data changes
  useEffect(() => {
    redraw(drawing)
  }, [drawing, redraw])

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPos(e)
    if (!pos) return
    isDrawing.current = true
    currentStroke.current = [pos]
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const pos = getPos(e)
    if (!pos) return
    currentStroke.current.push(pos)

    // Draw current stroke live
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const points = currentStroke.current
    if (points.length < 2) return

    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent')
      .trim()

    ctx.strokeStyle = accent || '#fb7185'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const prev = points[points.length - 2]
    const curr = points[points.length - 1]
    ctx.beginPath()
    ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height)
    ctx.lineTo(curr.x * canvas.width, curr.y * canvas.height)
    ctx.stroke()
  }

  const handleEnd = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (currentStroke.current.length >= 2) {
      onChange([...drawing, { points: currentStroke.current }])
    }
    currentStroke.current = []
  }

  return (
    <div className='bg-card-alt p-4 rounded-3xl border border-border-accent'>
      <div className='flex items-center justify-between mb-3'>
        <span className='text-sm font-medium text-accent'>Draw for Her</span>
        {drawing.length > 0 && (
          <button
            onClick={() => onChange([])}
            className='text-text-soft hover:text-accent transition-colors p-1'
            title='Clear drawing'
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className='w-full rounded-2xl overflow-hidden bg-card border border-border'
        style={{ height: 150, touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className='w-full h-full cursor-crosshair'
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>
    </div>
  )
}
