import React, { useRef, useEffect } from 'react'
import { Box, Typography } from '@mui/material'

/**
 * SignalPanel - Real-time oscilloscope-style waveform display
 * Renders 4 signal channels on a Canvas:
 *   - evolved (low 8 bits) - cyan
 *   - mus_flag - gold
 *   - pll_locked - green
 *   - dac_trigger - red
 */
export default function SignalPanel({ history }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height

    // Clear background
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, W, H)

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 188, 212, 0.08)'
    ctx.lineWidth = 1
    const gridCols = 10
    const gridRows = 8
    for (let i = 0; i <= gridCols; i++) {
      const x = (W / gridCols) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let i = 0; i <= gridRows; i++) {
      const y = (H / gridRows) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    if (!history || history.length === 0) {
      ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'
      ctx.font = '14px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('等待信号数据...', W / 2, H / 2)
      return
    }

    // Signal definitions: name, color, getY(value)
    const signals = [
      { key: 'evolved', label: 'evolved[7:0]', color: '#00e5ff', max: 255, getY: (v) => v & 0xFF },
      { key: 'musFlag', label: 'mus_flag', color: '#ffd700', max: 1, getY: (v) => v },
      { key: 'pllLocked', label: 'pll_locked', color: '#00ff88', max: 1, getY: (v) => v },
      { key: 'dacTrigger', label: 'dac_trigger', color: '#ff4444', max: 1, getY: (v) => v },
    ]

    const dataLen = history.length
    const xStep = W / Math.max(dataLen - 1, 1)
    const labelAreaH = 24
    const plotH = H - labelAreaH
    const channelH = plotH / signals.length

    // Draw each signal channel
    signals.forEach((sig, idx) => {
      const yBase = labelAreaH + channelH * idx + channelH * 0.5
      const amplitude = channelH * 0.4

      // Channel background
      ctx.fillStyle = 'rgba(10, 10, 26, 0.5)'
      ctx.fillRect(0, channelH * idx + labelAreaH, W, channelH)

      // Channel separator
      ctx.strokeStyle = 'rgba(0, 188, 212, 0.1)'
      ctx.beginPath()
      ctx.moveTo(0, channelH * idx + labelAreaH)
      ctx.lineTo(W, channelH * idx + labelAreaH)
      ctx.stroke()

      // Mid line for binary signals
      if (sig.max === 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.beginPath()
        ctx.moveTo(0, yBase)
        ctx.lineTo(W, yBase)
        ctx.stroke()
      }

      // Draw waveform
      ctx.strokeStyle = sig.color
      ctx.lineWidth = 1.5
      ctx.shadowColor = sig.color
      ctx.shadowBlur = 6
      ctx.beginPath()

      for (let i = 0; i < dataLen; i++) {
        const x = i * xStep
        const rawVal = history[i][sig.key] || 0
        const val = sig.getY(rawVal)
        const normalized = sig.max === 1 ? val : val / sig.max
        const y = yBase - normalized * amplitude + amplitude * 0.5
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Fill area under curve for binary signals
      if (sig.max === 1) {
        ctx.fillStyle = sig.color + '15'
        ctx.beginPath()
        ctx.moveTo(0, yBase)
        for (let i = 0; i < dataLen; i++) {
          const x = i * xStep
          const rawVal = history[i][sig.key] || 0
          const val = sig.getY(rawVal)
          const y = yBase - val * amplitude + amplitude * 0.5
          ctx.lineTo(x, y)
        }
        ctx.lineTo(W, yBase)
        ctx.closePath()
        ctx.fill()
      }
    })

    // Draw legend
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    let legendX = 8
    signals.forEach((sig) => {
      ctx.fillStyle = sig.color
      ctx.shadowColor = sig.color
      ctx.shadowBlur = 4
      ctx.fillRect(legendX, 6, 10, 10)
      ctx.shadowBlur = 0
      ctx.fillStyle = '#e0e0e0'
      ctx.fillText(sig.label, legendX + 14, 14)
      legendX += ctx.measureText(sig.label).width + 40
    })

    // Draw time axis label
    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)'
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`t=${history.length}`, W - 8, H - 4)

  }, [history])

  return (
    <Box className="tomas-panel p-3 h-full flex flex-col">
      <Typography variant="subtitle2" className="text-cyan-glow glow-cyan mb-2 font-mono">
        实时信号面板 — 示波器模式
      </Typography>
      <Box className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ minHeight: '200px' }}
        />
      </Box>
    </Box>
  )
}
