import { useRef, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import type { Drawing, Stroke, Point } from '../lib/types'

interface Props {
  drawing: Drawing
  onChange: (drawing: Drawing) => void
  drawLabel?: string
}

export function DrawingCanvas({ drawing, onChange, drawLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const currentStroke = useRef<Point[]>([])

  // Stable refs so native event listeners always see current values
  const onChangeRef = useRef(onChange)
  const drawingRef = useRef(drawing)
  useEffect(() => {
    onChangeRef.current = onChange
    drawingRef.current = drawing
  })

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

  const getPosFromTouch = useCallback((e: TouchEvent): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0] ?? e.changedTouches[0]
    if (!touch) return null
    return {
      x: (touch.clientX - rect.left) / rect.width,
      y: (touch.clientY - rect.top) / rect.height
    }
  }, [])

  const drawLiveSegment = useCallback((points: Point[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || points.length < 2) return

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
  }, [])

  // Register non-passive native touch listeners so preventDefault actually
  // blocks iOS text-selection / scroll gestures. React's synthetic touch
  // events are registered as passive in modern browsers, which means
  // calling e.preventDefault() inside them is ignored on iOS Safari.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const pos = getPosFromTouch(e)
      if (!pos) return
      isDrawing.current = true
      currentStroke.current = [pos]
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!isDrawing.current) return
      const pos = getPosFromTouch(e)
      if (!pos) return
      currentStroke.current.push(pos)
      drawLiveSegment(currentStroke.current)
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      if (!isDrawing.current) return
      isDrawing.current = false
      if (currentStroke.current.length >= 2) {
        onChangeRef.current([
          ...drawingRef.current,
          { points: currentStroke.current }
        ])
      }
      currentStroke.current = []
    }

    const opts: AddEventListenerOptions = { passive: false }
    canvas.addEventListener('touchstart', onTouchStart, opts)
    canvas.addEventListener('touchmove', onTouchMove, opts)
    canvas.addEventListener('touchend', onTouchEnd, opts)
    canvas.addEventListener('touchcancel', onTouchEnd, opts)

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [getPosFromTouch, drawLiveSegment])

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pos: Point = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    }
    isDrawing.current = true
    currentStroke.current = [pos]
  }

  const handleMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pos: Point = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    }
    currentStroke.current.push(pos)
    drawLiveSegment(currentStroke.current)
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
        <span className='text-sm font-medium text-accent'>
          {drawLabel ?? 'Draw for Partner'}
        </span>
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
        style={
          {
            aspectRatio: '2.2 / 1',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          } as React.CSSProperties
        }
      >
        <canvas
          ref={canvasRef}
          className='w-full h-full cursor-crosshair'
          style={
            {
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            } as React.CSSProperties
          }
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        />
      </div>
    </div>
  )
}
