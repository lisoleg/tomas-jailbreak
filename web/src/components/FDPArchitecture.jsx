import React, { useState } from 'react'
import { Box, Typography, Collapse, IconButton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

/**
 * FDPArchitecture - Interactive FDP-I hardware architecture diagram
 * SVG-based four-layer architecture with clickable modules
 * Signal flow: ftel_driver -> taiyi_core -> pg_detect -> freq_body
 */

const MODULES = [
  {
    id: 'ftel_driver',
    name: 'ftel_driver',
    label: '流贯驱动',
    desc: 'Ftel 流贯驱动器，将连续时间量子化为 MNQ 脉冲序列。当 en=0 时进入 Dead-Zero 场，所有时间量子化停止。',
    axiom: 'Axiom A2: kappa-Snap (时间量子化)',
    code: `module ftel_driver (
  input  wire clk, rst_n, en,
  output reg  mnq_tick
);
  parameter MNQ_PERIOD = 8'd10;
  reg [7:0] counter;
  always @(posedge clk or negedge rst_n)
    if (!rst_n || !en) begin
      counter <= 0; mnq_tick <= 0;
    end else if (counter >= MNQ_PERIOD-1) begin
      counter <= 0; mnq_tick <= 1;
    end else begin
      counter <= counter + 1;
      mnq_tick <= 0;
    end
endmodule`,
    layer: 1,
    x: 50, y: 40, w: 200, h: 60,
    color: '#00e5ff',
  },
  {
    id: 'taiyi_core',
    name: 'taiyi_core_tomas',
    label: '太一核心',
    desc: 'XOR-shift 演化引擎，以种子为锚进行无进位状态演化。valid_seed=0 时触发 Dead-Zero 熔断，输出强制归零。',
    axiom: 'Axiom A1: psi-Anchor (种子锚定)',
    code: `module taiyi_core_tomas (
  input  wire        clk, rst_n,
  input  wire [31:0] seed,
  input  wire        valid_seed,
  output wire [31:0] evolved
);
  reg [31:0] state;
  always @(posedge clk or negedge rst_n)
    if (!rst_n) state <= seed;
    else state <= state ^ (state << 13)
                      ^ (state >> 7)
                      ^ (state << 17);
  assign evolved = valid_seed ? state : 32'b0;
endmodule`,
    layer: 2,
    x: 50, y: 140, w: 200, h: 60,
    color: '#ffd700',
  },
  {
    id: 'pg_detect',
    name: 'pg_detect_tomas',
    label: 'PG 检测',
    desc: '悖论间隙检测器，监控双存超越循环。当 A 和 B 同时超过阈值时触发 MUS（互不可用封印），将矛盾拓扑囚禁。',
    axiom: 'Axiom A3: MUS (双存仲裁)',
    code: `module pg_detect_tomas (
  input  wire [7:0] excess_loop_A,
  input  wire [7:0] excess_loop_B,
  output wire       mus_flag
);
  parameter THRESH = 8'd100;
  assign mus_flag = (excess_loop_A >= THRESH)
                  && (excess_loop_B >= THRESH);
endmodule`,
    layer: 3,
    x: 50, y: 240, w: 200, h: 60,
    color: '#ff4444',
  },
  {
    id: 'freq_body',
    name: 'freq_body_if_tomas',
    label: '频率体接口',
    desc: 'ℐ-加权谐振接口，只有高 ℐ 信号（excess_loop >= I_MIN）才能积累计数并锁定 PLL，触发 DAC 输出。低 ℐ 信号被谐振过滤。',
    axiom: 'Axiom A4: ℐ-加权谐振',
    code: `module freq_body_if_tomas (
  input  wire        clk, rst_n,
  input  wire [31:0] state,
  input  wire [7:0]  excess_loop,
  input  wire [7:0]  I_target,
  output reg         pll_locked,
  output reg         dac_trigger
);
  parameter I_MIN = 8'd50;
  reg [7:0] counter;
  always @(posedge clk or negedge rst_n)
    if (!rst_n) begin
      counter <= 0; pll_locked <= 0;
      dac_trigger <= 0;
    end else if (excess_loop >= I_MIN)
      if (counter == 8'hFF) begin
        pll_locked <= 1; dac_trigger <= 1;
      end else counter <= counter + 1;
    else begin
      counter <= 0; pll_locked <= 0;
      dac_trigger <= 0;
    end
endmodule`,
    layer: 4,
    x: 50, y: 340, w: 200, h: 60,
    color: '#00ff88',
  },
]

// Signal flow connections (from -> to)
const CONNECTIONS = [
  { from: 'ftel_driver', to: 'taiyi_core', label: 'mnq_tick' },
  { from: 'taiyi_core', to: 'pg_detect', label: 'evolved' },
  { from: 'taiyi_core', to: 'freq_body', label: 'state' },
  { from: 'pg_detect', to: 'freq_body', label: 'mus_flag' },
]

export default function FDPArchitecture() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  const moduleById = (id) => MODULES.find(m => m.id === id)

  const getConnectionPath = (conn) => {
    const from = moduleById(conn.from)
    const to = moduleById(conn.to)
    const x1 = from.x + from.w / 2
    const y1 = from.y + from.h
    const x2 = to.x + to.w / 2
    const y2 = to.y
    const midY = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  }

  return (
    <Box className="tomas-panel p-3 h-full flex flex-col">
      <Typography variant="subtitle2" className="text-cyan-glow glow-cyan mb-2 font-mono">
        FDP-I 硬件架构图
      </Typography>
      <Box className="flex flex-1 gap-3">
        {/* SVG diagram */}
        <Box className="flex-1 relative">
          <svg viewBox="0 0 300 420" className="w-full h-full" style={{ maxHeight: '420px' }}>
            {/* Layer labels */}
            {[1, 2, 3, 4].map(layer => (
              <text
                key={layer}
                x={5}
                y={40 + (layer - 1) * 100 + 35}
                fill="rgba(0,188,212,0.3)"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                L{layer}
              </text>
            ))}

            {/* Connections */}
            {CONNECTIONS.map((conn, idx) => {
              const fromMod = moduleById(conn.from)
              const toMod = moduleById(conn.to)
              const path = getConnectionPath(conn)
              const midX = (fromMod.x + fromMod.w / 2 + toMod.x + toMod.w / 2) / 2
              const midY = (fromMod.y + fromMod.h + toMod.y) / 2
              return (
                <g key={idx}>
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(0,229,255,0.3)"
                    strokeWidth="1.5"
                    className="signal-flow-line"
                  />
                  <text
                    x={midX + 15}
                    y={midY}
                    fill="rgba(0,229,255,0.5)"
                    fontSize="8"
                    fontFamily="JetBrains Mono"
                  >
                    {conn.label}
                  </text>
                  {/* Arrow head */}
                  <circle
                    cx={toMod.x + toMod.w / 2}
                    cy={toMod.y}
                    r="2"
                    fill="#00e5ff"
                  />
                </g>
              )
            })}

            {/* Modules */}
            {MODULES.map(mod => {
              const isSelected = selected === mod.id
              const isHovered = hovered === mod.id
              return (
                <g
                  key={mod.id}
                  onClick={() => setSelected(isSelected ? null : mod.id)}
                  onMouseEnter={() => setHovered(mod.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={mod.x}
                    y={mod.y}
                    width={mod.w}
                    height={mod.h}
                    rx="6"
                    fill={isSelected ? `${mod.color}30` : isHovered ? `${mod.color}20` : '#12122a'}
                    stroke={mod.color}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{
                      filter: isSelected || isHovered ? `drop-shadow(0 0 8px ${mod.color})` : 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                  <text
                    x={mod.x + mod.w / 2}
                    y={mod.y + 25}
                    textAnchor="middle"
                    fill={mod.color}
                    fontSize="11"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    {mod.name}
                  </text>
                  <text
                    x={mod.x + mod.w / 2}
                    y={mod.y + 45}
                    textAnchor="middle"
                    fill="rgba(224,224,224,0.6)"
                    fontSize="10"
                    fontFamily="Noto Sans SC"
                  >
                    {mod.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </Box>

        {/* Detail panel */}
        {selected && (
          <Box
            className="w-2/5 overflow-y-auto p-3"
            sx={{
              background: 'rgba(10,10,26,0.8)',
              border: '1px solid rgba(0,188,212,0.3)',
              borderRadius: '6px',
            }}
          >
            {(() => {
              const mod = moduleById(selected)
              return (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: mod.color }} className="font-mono mb-1">
                    {mod.name}
                  </Typography>
                  <Typography variant="caption" className="text-gray-400 block mb-2">
                    Layer {mod.layer} — {mod.label}
                  </Typography>
                  <Typography variant="body2" className="text-gray-300 mb-2">
                    {mod.desc}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#ffd700' }}
                    className="block mb-2 font-mono"
                  >
                    {mod.axiom}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 block mb-1">
                    Verilog 实现:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      background: '#050510',
                      border: '1px solid rgba(0,188,212,0.15)',
                      borderRadius: '4px',
                      padding: '8px',
                      overflow: 'auto',
                      fontSize: '9px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: mod.color,
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {mod.code}
                  </Box>
                </Box>
              )
            })()}
          </Box>
        )}
        {!selected && (
          <Box
            className="w-2/5 flex items-center justify-center"
            sx={{ color: 'rgba(128,128,128,0.3)' }}
          >
            <Typography variant="caption">
              点击模块查看详情
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
