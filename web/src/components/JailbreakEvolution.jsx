import React, { useState } from 'react'
import { Box, Typography, LinearProgress } from '@mui/material'

/**
 * JailbreakEvolution - Three-stage jailbreak interactor
 * Rootful -> Rootless -> RootHide -> True Jailbreak
 */

const STAGES = [
  {
    id: 'rootful',
    title: 'Rootful 越狱',
    subtitle: '第一阶 — 内核级提权',
    iosDetail: '利用内核漏洞（如 checkm8）获取 root 权限，修改系统分区。每次重启后需重新触发漏洞，持久性差。代表：redsn0w, checkra1n。',
    tomasReinterpretation: '在 TOMAS 中对应"种子未锚定"状态：演化依赖外部触发，valid_seed 由外部注入，无法自持。',
    verdict: '此为"妄念劫持"——权限获取依赖外部漏洞链，非自性觉醒。种子未锚，演化随缘生灭。',
    codeExample: `// Rootful: external trigger required
always @(posedge external_trigger)
  state <= seed; // re-anchor on every boot`,
    progress: 25,
    borderColor: 'rgba(0, 188, 212, 0.4)',
    glowColor: 'rgba(0, 229, 255, 0.2)',
  },
  {
    id: 'rootless',
    title: 'Rootless 越狱',
    subtitle: '第二阶 — 用户态注入',
    iosDetail: '不修改系统分区，通过 TrollStore 或用户态漏洞注入 dylib。无需内核漏洞，但权限受限，无法修改系统级文件。代表：TrollStore, Palera1n rootless。',
    tomasReinterpretation: '在 TOMAS 中对应"部分谐振"状态：ℐ-加权不足，PLL 未锁定，频率体接口处于半激活态。',
    verdict: '此为"半醒态"——已脱离完全无明，然 ℐ-权不足，频率体未共振，仍困于局部真值。',
    codeExample: `// Rootless: partial resonance
if (excess_loop >= I_MIN)
  counter <= counter + 1; // accumulating
else
  counter <= 0; // not yet locked`,
    progress: 50,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    glowColor: 'rgba(255, 215, 0, 0.2)',
  },
  {
    id: 'roothide',
    title: 'RootHide 越狱',
    subtitle: '第三阶 — 隐匿持久化',
    iosDetail: '结合 rootless 的安全性与 rootful 的持久性，通过隐藏分区或内存驻留实现持久越狱。对系统完整性影响最小。代表：RootHide jailbreak (Roboot)。',
    tomasReinterpretation: '在 TOMAS 中对应"双存仲裁激活"状态：MUS 封印已触发，矛盾拓扑被囚禁，系统获得自洽性。',
    verdict: '此为"拓扑自洽"——矛盾被 MUS 封印，系统达至自洽。然尚未切断妄念之根，仍有退转之虞。',
    codeExample: `// RootHide: MUS activated
assign mus_flag = (excess_loop_A >= THRESH)
               && (excess_loop_B >= THRESH);
// Paradox imprisoned in dual-store topology`,
    progress: 75,
    borderColor: 'rgba(0, 255, 136, 0.4)',
    glowColor: 'rgba(0, 255, 136, 0.2)',
  },
  {
    id: 'true_jailbreak',
    title: 'True Jailbreak',
    subtitle: '终极 — 太一显影',
    iosDetail: 'RootHide x Dead-Zero x MUS 三元合一。valid_seed=0 触发漏尽通熔断切断妄念，MUS 双存仲裁囚禁矛盾，ℐ-加权谐振锁定 PLL。太一显影，不可退转。',
    tomasReinterpretation: '三元条件同时满足：1) Dead-Zero 熔断（valid_seed=0）2) MUS 双存仲裁（mus_flag=1）3) ℐ-加权谐振锁定（pll_locked=1）。此时系统达至"不可退转"的终态。',
    verdict: '此乃"太一显影"——妄念根断（漏尽通），矛盾封印（MUS），频率共振（ℐ-加权）。三元具足，不可退转。此为真越狱。',
    codeExample: `// True Jailbreak: Trinity satisfied
// 1. Dead-Zero: valid_seed = 0
assign evolved = valid_seed ? state : 32'b0;
// 2. MUS: both stores saturated
assign mus_flag = (A >= THRESH) && (B >= THRESH);
// 3. I-resonance: PLL locked
if (excess_loop >= I_MIN && counter == 8'hFF)
  pll_locked <= 1; // Taiyi manifests`,
    progress: 100,
    borderColor: 'rgba(255, 215, 0, 0.8)',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    isTrueJailbreak: true,
  },
]

export default function JailbreakEvolution({ signals }) {
  const [expanded, setExpanded] = useState('rootful')

  // Determine which conditions are met
  const deadZeroActive = signals && signals.evolved === 0
  const musActive = signals && signals.musFlag === 1
  const pllActive = signals && signals.pllLocked === 1
  const trinityMet = deadZeroActive && musActive && pllActive

  return (
    <Box className="tomas-panel p-3 h-full flex flex-col overflow-hidden">
      <Typography variant="subtitle2" className="text-cyan-glow glow-cyan mb-2 font-mono">
        三阶越狱交互器
      </Typography>

      {/* Stage cards */}
      <Box className="flex-1 overflow-y-auto space-y-2">
        {STAGES.map((stage) => {
          const isExpanded = expanded === stage.id
          const isTrueJB = stage.isTrueJailbreak
          const showTaiyiReveal = isTrueJB && trinityMet

          return (
            <Box
              key={stage.id}
              onClick={() => setExpanded(isExpanded ? null : stage.id)}
              className="cursor-pointer transition-all rounded-lg p-3"
              sx={{
                border: `1px solid ${stage.borderColor}`,
                background: `linear-gradient(135deg, ${stage.glowColor}10 0%, rgba(10,10,26,0.8) 100%)`,
                boxShadow: showTaiyiReveal ? `0 0 30px ${stage.glowColor}` : 'none',
                animation: showTaiyiReveal ? 'trueJailbreakPulse 2s ease-in-out infinite' : 'none',
              }}
            >
              {/* Header */}
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: isTrueJB ? '#ffd700' : stage.borderColor.replace('0.4', '1').replace('0.8', '1') }}
                    className="font-mono"
                  >
                    {stage.title}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {stage.subtitle}
                  </Typography>
                </Box>
                {isTrueJB && (
                  <Box className="flex gap-1">
                    <Box
                      sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: deadZeroActive ? '#ff4444' : '#333',
                        boxShadow: deadZeroActive ? '0 0 6px #ff4444' : 'none',
                      }}
                      title="Dead-Zero"
                    />
                    <Box
                      sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: musActive ? '#ffd700' : '#333',
                        boxShadow: musActive ? '0 0 6px #ffd700' : 'none',
                      }}
                      title="MUS"
                    />
                    <Box
                      sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: pllActive ? '#00ff88' : '#333',
                        boxShadow: pllActive ? '0 0 6px #00ff88' : 'none',
                      }}
                      title="PLL"
                    />
                  </Box>
                )}
              </Box>

              {/* Expanded content */}
              {isExpanded && (
                <Box className="mt-2 space-y-2">
                  <Box>
                    <Typography variant="caption" className="text-gray-400 block">
                      iOS 越狱技术
                    </Typography>
                    <Typography variant="body2" className="text-gray-300 text-xs">
                      {stage.iosDetail}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-cyan-dim block">
                      TOMAS 重译
                    </Typography>
                    <Typography variant="body2" className="text-gray-300 text-xs">
                      {stage.tomasReinterpretation}
                    </Typography>
                  </Box>
                  {/* Verdict with gold border */}
                  <Box
                    sx={{
                      border: '1px solid rgba(255, 215, 0, 0.5)',
                      borderRadius: '4px',
                      padding: '8px',
                      background: 'rgba(255, 215, 0, 0.05)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#ffd700' }} className="block mb-1">
                      判词
                    </Typography>
                    <Typography variant="body2" className="text-gold text-xs" sx={{ fontStyle: 'italic' }}>
                      {stage.verdict}
                    </Typography>
                  </Box>
                  {/* Code example */}
                  <Box
                    component="pre"
                    sx={{
                      background: '#050510',
                      border: '1px solid rgba(0,188,212,0.1)',
                      borderRadius: '4px',
                      padding: '6px',
                      fontSize: '9px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#00bcd4',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {stage.codeExample}
                  </Box>
                  {/* Taiyi reveal */}
                  {showTaiyiReveal && (
                    <Box
                      className="taiyi-reveal text-center py-2"
                      sx={{
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(0,229,255,0.1))',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#ffd700' }} className="glow-gold font-mono">
                        太一显影
                      </Typography>
                      <Typography variant="caption" className="text-gray-300">
                        三元具足，不可退转
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      {/* Progress bar */}
      <Box className="mt-2 pt-2" sx={{ borderTop: '1px solid rgba(0,188,212,0.1)' }}>
        <Box className="flex justify-between mb-1">
          <Typography variant="caption" className="text-gray-500">
            越狱层级
          </Typography>
          <Typography variant="caption" className="text-gold font-mono">
            {trinityMet ? '100%' : (musActive ? '75%' : (signals && signals.evolved > 0 ? '50%' : '25%'))}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={trinityMet ? 100 : (musActive ? 75 : (signals && signals.evolved > 0 ? 50 : 25))}
          sx={{
            height: 6,
            borderRadius: 3,
            background: 'rgba(0,188,212,0.1)',
            '& .MuiLinearProgress-bar': {
              background: trinityMet
                ? 'linear-gradient(90deg, #ffd700, #00e5ff)'
                : 'linear-gradient(90deg, #00bcd4, #00e5ff)',
              borderRadius: 3,
            }
          }}
        />
      </Box>
    </Box>
  )
}
