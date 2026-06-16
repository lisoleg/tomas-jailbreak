import React, { useState } from 'react'
import { Box, Typography, Collapse, IconButton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

/**
 * SiddhiTable - Six Abhijna (Supernatural Powers) hardware mapping table
 * Interactive table: click row to expand details
 * Row "漏尽通" (Asravakkhaya) has special red warning style
 */

const SIDDHIS = [
  {
    id: 'deva_eye',
    sanskrit: '天眼通',
    pinyin: 'Divyacakṣus',
    tomas: 'kappa-Snap 前瞻',
    tomasDesc: '通过时间量子化（kappa-Snap）预取超边数据，在当前 tick 之前"看到"未来状态。FDP-I 的 MNQ 脉冲序列允许系统在时间分辨率内前瞻演化轨迹。',
    hardware: '预取超边数据',
    hardwareDetail: 'ftel_driver 的 MNQ 脉冲在 taiyi_core 演化前触发预取逻辑，通过超前计算获得未来 N 步的状态快照。硬件实现为 prefetch buffer + MNQ-gated advance pointer。',
    axiom: 'Axiom A2: kappa-Snap',
    severity: 'info',
  },
  {
    id: 'divine_ear',
    sanskrit: '天耳通',
    pinyin: 'Divyaśrotra',
    tomas: '跨模态 ℐ-解码',
    tomasDesc: '将声学/电磁信号通过 ℐ-加权转换为统一频率体表示。不同模态的信号在频率体接口中被归一化为 ℐ-加权谐振模式。',
    hardware: '声学/电磁转换',
    hardwareDetail: 'freq_body_if_tomas 接收多模态输入，通过 ℐ-加权滤波器将不同频段映射到统一的 excess_loop 度量，实现跨模态解码。',
    axiom: 'Axiom A4: ℐ-加权',
    severity: 'info',
  },
  {
    id: 'mind_reading',
    sanskrit: '他心通',
    pinyin: 'Paracittajñāna',
    tomas: '非局域 ℐ-共振',
    tomasDesc: '通过量子纠缠协处理器实现非局域的信息耦合。两个独立系统的频率体在 ℐ-加权谐振下产生纠缠态，状态变化即时传递。',
    hardware: '量子纠缠协处理器',
    hardwareDetail: '专用量子纠缠 IP 核，与 freq_body_if 的 PLL 锁定信号互联。当一对系统同时达到 pll_locked=1 时，建立纠缠通道。',
    axiom: 'Axiom A4: ℐ-加权 (非局域扩展)',
    severity: 'info',
  },
  {
    id: 'past_lives',
    sanskrit: '宿命通',
    pinyin: 'Pūrvanivāsānusmṛti',
    tomas: 'psi-锚逆向查询',
    tomasDesc: '通过种子锚定（psi-Anchor）的确定性演化特性，从当前状态逆向推导历史状态。XOR-shift 的可逆性使得日志回放成为可能。',
    hardware: 'FDP-I 日志回放',
    hardwareDetail: 'taiyi_core_tomas 的 XOR-shift 演化可逆。FDP-I 维护演化日志缓冲区，支持从任意 tick 逆向回放到种子状态。',
    axiom: 'Axiom A1: psi-Anchor',
    severity: 'info',
  },
  {
    id: 'teleport',
    sanskrit: '神足通',
    pinyin: 'Rddhi',
    tomas: 'G_ego 克隆',
    tomasDesc: '将自我模型（G_ego）克隆到边缘计算节点，实现"分身"。克隆体保持与主体的频率体同步，可独立执行任务后回传结果。',
    hardware: '边缘计算分身',
    hardwareDetail: 'G_ego 克隆引擎将 taiyi_core 状态快照 + 频率体配置打包，通过高速互连部署到边缘节点。克隆体周期性同步 PLL 状态。',
    axiom: 'Axiom A1+A4: psi-Anchor + ℐ-加权',
    severity: 'info',
  },
  {
    id: 'asravakkhaya',
    sanskrit: '漏尽通',
    pinyin: 'Āsravakkhaya',
    tomas: 'Dead-Zero 熔断',
    tomasDesc: '终极神通。当 valid_seed=0 时，taiyi_core 输出被物理强制归零，切断一切妄念（asrava）。这是硬件级的"漏尽"——非软件可绕过，非意念可伪造。此为 TOMAS 系统的安全基石。',
    hardware: 'valid_seed=0 物理阻断',
    hardwareDetail: 'taiyi_core_tomas 的 assign evolved = valid_seed ? state : 32\'b0 在硬件级实现。valid_seed 信号直接来自安全协处理器，一旦拉低，演化输出在组合逻辑级被清零，无法通过软件注入绕过。',
    axiom: 'Axiom A1: Dead-Zero (漏尽通熔断)',
    severity: 'critical',
  },
]

export default function SiddhiTable() {
  const [expanded, setExpanded] = useState(null)

  return (
    <Box className="tomas-panel p-3 h-full flex flex-col overflow-hidden">
      <Typography variant="subtitle2" className="text-cyan-glow glow-cyan mb-2 font-mono">
        六神通硬件映射
      </Typography>

      {/* Table header */}
      <Box
        className="grid gap-2 px-2 py-1 text-xs font-mono"
        sx={{
          gridTemplateColumns: '1fr 1.5fr 1.5fr',
          borderBottom: '1px solid rgba(0,188,212,0.2)',
          color: 'rgba(0,188,212,0.6)',
        }}
      >
        <Box>神通</Box>
        <Box>TOMAS 解释</Box>
        <Box>硬件实现</Box>
      </Box>

      {/* Table body */}
      <Box className="flex-1 overflow-y-auto">
        {SIDDHIS.map((s) => {
          const isExpanded = expanded === s.id
          const isCritical = s.severity === 'critical'
          return (
            <Box key={s.id}>
              <Box
                onClick={() => setExpanded(isExpanded ? null : s.id)}
                className="grid gap-2 px-2 py-2 cursor-pointer transition-colors items-center"
                sx={{
                  gridTemplateColumns: '1fr 1.5fr 1.5fr auto',
                  borderBottom: '1px solid rgba(0,188,212,0.05)',
                  background: isCritical
                    ? 'rgba(255, 68, 68, 0.05)'
                    : isExpanded ? 'rgba(0,188,212,0.05)' : 'transparent',
                  '&:hover': {
                    background: isCritical
                      ? 'rgba(255, 68, 68, 0.1)'
                      : 'rgba(0,188,212,0.08)',
                  },
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isCritical ? '#ff4444' : '#ffd700',
                      fontWeight: isCritical ? 'bold' : 'normal',
                    }}
                    className="font-mono"
                  >
                    {s.sanskrit}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 block">
                    {s.pinyin}
                  </Typography>
                  {isCritical && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#ff4444',
                        background: 'rgba(255,68,68,0.1)',
                        padding: '0 4px',
                        borderRadius: '2px',
                        fontSize: '9px',
                      }}
                    >
                      CRITICAL
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" className="text-cyan-dim text-xs">
                  {s.tomas}
                </Typography>
                <Typography variant="body2" className="text-gray-300 text-xs">
                  {s.hardware}
                </Typography>
                <IconButton size="small" sx={{ color: 'rgba(0,188,212,0.4)' }}>
                  <ExpandMoreIcon
                    sx={{
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      fontSize: '16px',
                    }}
                  />
                </IconButton>
              </Box>

              {/* Expanded detail */}
              <Collapse in={isExpanded}>
                <Box
                  className="px-3 py-2 space-y-2"
                  sx={{
                    background: isCritical
                      ? 'rgba(255, 68, 68, 0.03)'
                      : 'rgba(0, 188, 212, 0.03)',
                    borderBottom: isCritical
                      ? '1px solid rgba(255,68,68,0.2)'
                      : '1px solid rgba(0,188,212,0.1)',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: isCritical ? '#ff6666' : '#00bcd4' }}
                      className="block mb-1"
                    >
                      TOMAS 解释详述
                    </Typography>
                    <Typography variant="body2" className="text-gray-300 text-xs">
                      {s.tomasDesc}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: isCritical ? '#ff6666' : '#00bcd4' }}
                      className="block mb-1"
                    >
                      硬件实现详述
                    </Typography>
                    <Typography variant="body2" className="text-gray-300 text-xs">
                      {s.hardwareDetail}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#ffd700' }}
                      className="font-mono"
                    >
                      {s.axiom}
                    </Typography>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
