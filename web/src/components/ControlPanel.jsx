import React, { useState, useCallback } from 'react'
import { Box, Slider, Switch, TextField, Button, Typography, MenuItem, Select, InputLabel, FormControl, Divider } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

/**
 * ControlPanel - Simulation parameter controls
 * Controls: en_ftel, valid_seed, seed_in, excess_loop_A/B, I_target, speed
 */
export default function ControlPanel({ engine, onParamsChange, onRun, onStop, onReset, running }) {
  const [params, setParams] = useState(engine.params)

  const handleParamChange = useCallback((key, value) => {
    const newParams = { ...params, [key]: value }
    setParams(newParams)
    engine.setParam(key, value)
    if (onParamsChange) onParamsChange(newParams)
  }, [params, engine, onParamsChange])

  const parseHex = (str) => {
    const cleaned = str.replace(/^0x/i, '').trim()
    const val = parseInt(cleaned, 16)
    return isNaN(val) ? 0 : (val >>> 0)
  }

  return (
    <Box className="tomas-panel p-4 h-full overflow-y-auto">
      <Typography variant="h6" className="text-cyan-glow glow-cyan mb-3 font-mono">
        控制面板
      </Typography>
      <Divider sx={{ borderColor: 'rgba(0,188,212,0.2)', mb: 2 }} />

      {/* en_ftel toggle */}
      <Box className="mb-4">
        <Box className="flex items-center justify-between">
          <Typography variant="body2" className="text-gray-300">
            Ftel 流贯使能 (en_ftel)
          </Typography>
          <Switch
            checked={params.enFtel === 1}
            onChange={(e) => handleParamChange('enFtel', e.target.checked ? 1 : 0)}
          />
        </Box>
        <Typography variant="caption" className="text-gray-500">
          关闭时进入 Dead-Zero 场，时间量子化脉冲停止
        </Typography>
      </Box>

      {/* valid_seed toggle */}
      <Box className="mb-4">
        <Box className="flex items-center justify-between">
          <Typography variant="body2" className="text-gray-300">
            种子有效 (valid_seed)
          </Typography>
          <Switch
            checked={params.validSeed === 1}
            onChange={(e) => handleParamChange('validSeed', e.target.checked ? 1 : 0)}
          />
        </Box>
        <Typography variant="caption" className="text-gray-500">
          关闭时触发漏尽通熔断，evolved 输出归零
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(0,188,212,0.1)', my: 2 }} />

      {/* seed hex input */}
      <Box className="mb-4">
        <Typography variant="body2" className="text-gray-300 mb-1">
          种子输入 (seed_in)
        </Typography>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          value={'0x' + params.seed.toString(16).toUpperCase().padStart(8, '0')}
          onChange={(e) => {
            const val = parseHex(e.target.value)
            handleParamChange('seed', val)
          }}
          inputProps={{
            style: { fontFamily: 'JetBrains Mono, monospace', color: '#00e5ff' }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'rgba(0,188,212,0.3)' },
              '&:hover fieldset': { borderColor: 'rgba(0,229,255,0.5)' },
            }
          }}
        />
      </Box>

      <Divider sx={{ borderColor: 'rgba(0,188,212,0.1)', my: 2 }} />

      {/* excess_loop_A slider */}
      <Box className="mb-4">
        <Box className="flex justify-between mb-1">
          <Typography variant="body2" className="text-gray-300">
            超越循环 A (excess_loop_A)
          </Typography>
          <Typography variant="body2" className="text-gold font-mono glow-gold">
            {params.excessLoopA}
          </Typography>
        </Box>
        <Slider
          value={params.excessLoopA}
          onChange={(e, v) => handleParamChange('excessLoopA', v)}
          min={0}
          max={255}
          step={1}
          size="small"
        />
        <Typography variant="caption" className="text-gray-500">
          MUS 阈值: 100 (A &amp; B 同时达标触发双存仲裁)
        </Typography>
      </Box>

      {/* excess_loop_B slider */}
      <Box className="mb-4">
        <Box className="flex justify-between mb-1">
          <Typography variant="body2" className="text-gray-300">
            超越循环 B (excess_loop_B)
          </Typography>
          <Typography variant="body2" className="text-gold font-mono glow-gold">
            {params.excessLoopB}
          </Typography>
        </Box>
        <Slider
          value={params.excessLoopB}
          onChange={(e, v) => handleParamChange('excessLoopB', v)}
          min={0}
          max={255}
          step={1}
          size="small"
        />
      </Box>

      {/* I_target slider */}
      <Box className="mb-4">
        <Box className="flex justify-between mb-1">
          <Typography variant="body2" className="text-gray-300">
            ℐ-加权目标 (I_target)
          </Typography>
          <Typography variant="body2" className="text-gold font-mono glow-gold">
            {params.iTarget}
          </Typography>
        </Box>
        <Slider
          value={params.iTarget}
          onChange={(e, v) => handleParamChange('iTarget', v)}
          min={0}
          max={255}
          step={1}
          size="small"
        />
        <Typography variant="caption" className="text-gray-500">
          频率体 ℐ-最小值: 50 (低于此值 PLL 不锁定)
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(0,188,212,0.1)', my: 2 }} />

      {/* Speed selector */}
      <Box className="mb-4">
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: '#00bcd4' }}>模拟速度</InputLabel>
          <Select
            value={params.speed}
            label="模拟速度"
            onChange={(e) => handleParamChange('speed', e.target.value)}
            sx={{
              color: '#00e5ff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,188,212,0.3)' }
            }}
          >
            <MenuItem value={1}>1x (每帧 1 tick)</MenuItem>
            <MenuItem value={2}>2x (每帧 2 ticks)</MenuItem>
            <MenuItem value={5}>5x (每帧 5 ticks)</MenuItem>
            <MenuItem value={10}>10x (每帧 10 ticks)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ borderColor: 'rgba(0,188,212,0.1)', my: 2 }} />

      {/* Action buttons */}
      <Box className="flex gap-2">
        {!running ? (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<PlayArrowIcon />}
            onClick={onRun}
            sx={{ textTransform: 'none' }}
          >
            运行仿真
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            fullWidth
            startIcon={<StopIcon />}
            onClick={onStop}
            sx={{ textTransform: 'none' }}
          >
            停止
          </Button>
        )}
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
          sx={{ textTransform: 'none', borderColor: 'rgba(255,215,0,0.5)', color: '#ffd700' }}
        >
          重置
        </Button>
      </Box>

      {/* Current tick count */}
      <Box className="mt-3 text-center">
        <Typography variant="caption" className="text-gray-500">
          已运行 tick 数
        </Typography>
        <Typography variant="h5" className="text-cyan-glow font-mono glow-cyan">
          {engine.tickCount}
        </Typography>
      </Box>
    </Box>
  )
}
