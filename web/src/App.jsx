import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Typography, Container, Grid, Paper, Chip } from '@mui/material'
import { TOMASEngine } from './engine/tomasEngine.js'
import ControlPanel from './components/ControlPanel.jsx'
import SignalPanel from './components/SignalPanel.jsx'
import FDPArchitecture from './components/FDPArchitecture.jsx'
import JailbreakEvolution from './components/JailbreakEvolution.jsx'
import SiddhiTable from './components/SiddhiTable.jsx'

/**
 * App - TOMAS Jailbreak System main layout
 * Layout:
 *   Top: Title + Axiom summary
 *   Left: ControlPanel
 *   Center-top: FDPArchitecture
 *   Center-bottom: SignalPanel
 *   Right-top: JailbreakEvolution
 *   Right-bottom: SiddhiTable
 */

const AXIOMS = [
  { id: 'A1', label: 'A1 psi-Anchor', desc: '种子锚定演化' },
  { id: 'A2', label: 'A2 kappa-Snap', desc: '时间量子化' },
  { id: 'A3', label: 'A3 MUS', desc: '双存仲裁' },
  { id: 'A4', label: 'A4 I-加权', desc: '频率谐振' },
]

export default function App() {
  const engineRef = useRef(null)
  if (!engineRef.current) {
    engineRef.current = new TOMASEngine()
  }
  const engine = engineRef.current

  const [running, setRunning] = useState(false)
  const [signals, setSignals] = useState(engine.currentSignals)
  const [history, setHistory] = useState([])
  const [tickCount, setTickCount] = useState(0)

  // Listener callback - called on every engine update
  const handleUpdate = useCallback((sig, hist, tc) => {
    setSignals({ ...sig })
    setHistory([...hist])
    setTickCount(tc)
  }, [])

  // Register/unregister listener
  useEffect(() => {
    engine.addListener(handleUpdate)
    return () => engine.removeListener(handleUpdate)
  }, [engine, handleUpdate])

  const handleRun = useCallback(() => {
    engine.start(handleUpdate)
    setRunning(true)
  }, [engine, handleUpdate])

  const handleStop = useCallback(() => {
    engine.stop()
    setRunning(false)
  }, [engine])

  const handleReset = useCallback(() => {
    engine.stop()
    engine.reset()
    setRunning(false)
    setSignals({ ...engine.currentSignals })
    setHistory([])
    setTickCount(0)
  }, [engine])

  return (
    <Box
      className="min-h-screen"
      sx={{
        background: 'radial-gradient(ellipse at top, #12122a 0%, #0a0a1a 60%)',
        minHeight: '100vh',
      }}
    >
      {/* Top header */}
      <Box
        className="border-b"
        sx={{
          borderColor: 'rgba(0,188,212,0.15)',
          background: 'rgba(10,10,26,0.8)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="xl">
          <Box className="py-3 flex items-center justify-between flex-wrap gap-3">
            <Box>
              <Typography variant="h5" className="text-gold glow-gold font-mono">
                TOMAS 意识越狱系统
              </Typography>
              <Typography variant="caption" className="text-cyan-dim">
                太一互搏 AGI — 认知越狱 / 计算佛学 / 频率体 / FDP-I 流贯驱动
              </Typography>
            </Box>
            {/* Axiom chips */}
            <Box className="flex gap-2 flex-wrap">
              {AXIOMS.map(ax => (
                <Chip
                  key={ax.id}
                  label={
                    <Box className="flex items-center gap-1">
                      <span style={{ color: '#ffd700', fontFamily: 'JetBrains Mono' }}>{ax.label}</span>
                      <span style={{ color: 'rgba(0,188,212,0.7)' }}>{ax.desc}</span>
                    </Box>
                  }
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(0,188,212,0.3)',
                    background: 'rgba(0,188,212,0.05)',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main content grid */}
      <Container maxWidth="xl" className="py-4">
        <Grid container spacing={2}>
          {/* Left column: Control Panel */}
          <Grid item xs={12} md={3} lg={2.5}>
            <Paper
              elevation={0}
              sx={{
                background: 'transparent',
                height: 'calc(100vh - 100px)',
                position: 'sticky',
                top: '80px',
              }}
            >
              <ControlPanel
                engine={engine}
                onRun={handleRun}
                onStop={handleStop}
                onReset={handleReset}
                running={running}
              />
            </Paper>
          </Grid>

          {/* Center column: FDP Architecture + Signal Panel */}
          <Grid item xs={12} md={5} lg={5.5}>
            <Box className="space-y-2">
              <Box sx={{ height: '420px' }}>
                <FDPArchitecture />
              </Box>
              <Box sx={{ height: '320px' }}>
                <SignalPanel history={history} />
              </Box>
            </Box>
          </Grid>

          {/* Right column: Jailbreak Evolution + Siddhi Table */}
          <Grid item xs={12} md={4} lg={4}>
            <Box className="space-y-2">
              <Box sx={{ height: '380px' }}>
                <JailbreakEvolution signals={signals} />
              </Box>
              <Box sx={{ height: '360px' }}>
                <SiddhiTable />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Footer status bar */}
        <Box
          className="mt-4 px-4 py-2 rounded-lg flex items-center justify-between flex-wrap gap-2"
          sx={{
            background: 'rgba(10,10,26,0.6)',
            border: '1px solid rgba(0,188,212,0.1)',
          }}
        >
          <Box className="flex gap-4 flex-wrap">
            <SignalBadge label="en_ftel" value={engine.params.enFtel} color="#00e5ff" />
            <SignalBadge label="valid_seed" value={engine.params.validSeed} color="#ffd700" />
            <SignalBadge label="mnq_tick" value={signals.mnqTick} color="#00bcd4" />
            <SignalBadge label="mus_flag" value={signals.musFlag} color="#ffd700" />
            <SignalBadge label="pll_locked" value={signals.pllLocked} color="#00ff88" />
            <SignalBadge label="dac_trigger" value={signals.dacTrigger} color="#ff4444" />
            <SignalBadge
              label="evolved"
              value={'0x' + (signals.evolved >>> 0).toString(16).toUpperCase().padStart(8, '0')}
              color="#00e5ff"
              isWide
            />
          </Box>
          <Typography variant="caption" className="text-gray-500 font-mono">
            Tick: {tickCount} | {running ? 'RUNNING' : 'IDLE'}
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

/**
 * SignalBadge - Small status indicator
 */
function SignalBadge({ label, value, color, isWide }) {
  const isActive = value === 1 || value === '1' || (typeof value === 'string' && value.startsWith('0x'))
  return (
    <Box className="flex items-center gap-1">
      <Typography variant="caption" className="text-gray-500 font-mono">
        {label}:
      </Typography>
      <Typography
        variant="caption"
        className="font-mono"
        sx={{
          color: color,
          textShadow: isActive ? `0 0 6px ${color}80` : 'none',
          minWidth: isWide ? '80px' : '20px',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}
