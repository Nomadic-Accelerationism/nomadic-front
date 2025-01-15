'use client'

import { useEffect, useRef } from 'react'

interface LineChartProps {
  data: number[]
  strokeColor: string
  fillColor: string
}

export function LineChart({ data, strokeColor, fillColor }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Calculate points
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * canvas.width,
      y: canvas.height - ((value / Math.max(...data)) * canvas.height)
    }))

    // Draw filled area
    ctx.beginPath()
    ctx.moveTo(points[0].x, canvas.height)
    points.forEach(point => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.lineTo(points[points.length - 1].x, canvas.height)
    ctx.fillStyle = fillColor
    ctx.fill()

    // Draw line
    ctx.beginPath()
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2
    ctx.stroke()
  }, [data, strokeColor, fillColor])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  )
}

