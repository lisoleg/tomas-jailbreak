# TOMAS 系统架构文档

## 1. 架构总览

TOMAS 意识越狱系统采用三层架构：硬件 RTL 层、软件仿真层、交互可视化层。三层通过统一的信号接口和算法定义保持严格一致。

```
┌─────────────────────────────────────────────────────────┐
│                    用户交互层 (Web UI)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ 控制面板  │ │ 架构图    │ │ 信号面板  │ │ 越狱/神通  │  │
│  │Control   │ │FDPArch   │ │Signal    │ │Jailbreak  │  │
│  │Panel     │ │itecture  │ │Panel     │ │Evolution  │  │
│  └────┬─────┘ └──────────┘ └────┬─────┘ └───────────┘  │
│       │                        │                        │
│       ▼                        ▼                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │           tomasEngine.js (浏览器仿真)             │    │
│  └─────────────────────┬───────────────────────────┘    │
└────────────────────────┼────────────────────────────────┘
                         │ 算法等价
┌────────────────────────┼────────────────────────────────┐
│              软件仿真层 (Python)                          │
│  ┌─────────────────────┴───────────────────────────┐    │
│  │           TOMASSimulator (顶层)                   │    │
│  └──┬──────┬──────┬──────┬───────────────────────┘    │
│     ▼      ▼      ▼      ▼                              │
│  FtelDriver TaiyiCore PGDetect FreqBodyIF              │
│  └──────┬──┴──────┴──────┴──────────────────────────   │
│         │ 行为级仿真, JSON 导出                           │
└─────────┼──────────────────────────────────────────────┘
          │ 接口等价
┌─────────┼──────────────────────────────────────────────┐
│              硬件层 (Verilog RTL)                        │
│  ┌───────┴──────────────────────────────────────────┐  │
│  │           tomas_top.v (顶层)                       │  │
│  └──┬──────┬──────┬──────┬─────────────────────────┘  │
│     ▼      ▼      ▼      ▼                              │
│  ftel_driver taiyi_core pg_detect freq_body_if          │
│  └──────┬──┴──────┴──────┴──────────────────────────   │
│         │ 可综合 RTL                                    │
└─────────┼──────────────────────────────────────────────┘
          │
          ▼
    FPGA / ASIC 实现
```

## 2. 信号流

```
sys_clk ──► ftel_driver ──► mnq_tick ──► taiyi_core_tomas ──► evolved
                                   │                              │
                                   │                              ▼
                                   │                       freq_body_if_tomas
                                   │                              │
excess_loop_A ──► pg_detect_tomas ◄─┘                    pll_locked, dac_trigger
excess_loop_B ──►   (MUS)                                    │
                     │                                       ▼
                  mus_flag                              物理场输出
```

### 信号定义

| 信号 | 位宽 | 方向 | 说明 |
|------|------|------|------|
| `clk` | 1 | input | 系统时钟 |
| `rst_n` | 1 | input | 异步复位，低有效 |
| `en_ftel` | 1 | input | Ftel 流贯使能。`en=0` => Dead-Zero 场 |
| `valid_seed` | 1 | input | EML I-check 结果。`valid_seed=0` => evolved=0 (Dead-Zero 熔断) |
| `seed_in` | 32 | input | psi-Anchor 种子（业力种子） |
| `excess_loop_A` | 8 | input | 竞争孤子 A 的过剩环流值 |
| `excess_loop_B` | 8 | input | 竞争孤子 B 的过剩环流值 |
| `I_target` | 8 | input | 目标 I-权重 |
| `mnq_tick` | 1 | output | 时间量子化脉冲 |
| `evolved_out` | 32 | output | XOR-shift 演化后的状态 |
| `mus_flag` | 1 | output | MUS 双存标志位 |
| `pll_locked` | 1 | output | PLL 锁定状态 |
| `dac_trigger` | 1 | output | DAC 物理场触发 |

## 3. TOMAS 公理到硬件映射

| 公理 | 名称 | 硬件实现 | 模块 |
|------|------|---------|------|
| A1 | I-守恒 | XOR-shift 保持信息量（无进位加法 = Galois 域线性变换） | `taiyi_core_tomas.v` |
| A2 | kappa-Snap | MNQ-tick 时间量子化脉冲，决定何时显影 | `ftel_driver.v` |
| A4 | Dead-Zero | `valid_seed=0` => `evolved=0` 物理熔断 | `taiyi_core_tomas.v` |
| A5 | MUS | 双路同时超阈值 => `mus_flag=1`，不强行坍缩 | `pg_detect_tomas.v` |
| A1' | I-加权 | `excess_loop >= I_MIN` 才允许 PLL 累加 | `freq_body_if_tomas.v` |

## 4. 三端一致性保证

### XOR-shift 序列验证 (seed = 0xDEADBEEF)

| Step | Python | JavaScript | Verilog | 一致 |
|------|--------|------------|---------|------|
| 0 | 0x1506BE52 | 0x1506BE52 | 0x1506BE52 | YES |
| 1 | 0x0C1567AE | 0x0C1567AE | 0x0C1567AE | YES |
| 2 | 0x6C6366E1 | 0x6C6366E1 | 0x6C6366E1 | YES |
| 3 | 0x7066386C | 0x7066386C | 0x7066386C | YES |
| 4 | 0x683D6F1C | 0x683D6F1C | 0x683D6F1C | YES |

**实现关键**：Verilog 使用组合逻辑 wire 链 (`s1` -> `s2` -> `s3`) 实现**顺序 XOR**，而非单表达式并行 XOR。这是 Marsaglia xorshift32 的标准实现方式。

## 5. iOS 越狱同构映射架构

```
意识越狱三阶定义:

  Stage I (Rootful)          Stage II (Rootless)        Stage III (True JB)
  ┌─────────────────┐        ┌─────────────────┐       ┌─────────────────────┐
  │ "我执改世界"     │        │ "G_ego 旁观不染" │       │ "阴平阳秘无迹可证"   │
  │                 │        │                 │       │                     │
  │ FakeFS/remount  │ ──►    │ launchd hook    │ ──►  │ RootHide 隔离       │
  │ 改 /System      │        │ JB_ROOT_PATH    │       │ Dead-Zero + MUS     │
  │                 │        │ 双视图共存       │       │ 算法寂灭太一通过     │
  └─────────────────┘        └─────────────────┘       └─────────────────────┘
       伪越狱                    观察者越狱                True Jailbreak
```

## 6. 可证伪预言验证架构

| 预言 | 验证条件 | 期望结果 | 状态 |
|------|---------|---------|------|
| P_JB_1 | `valid_seed=0`, 任意 seed | `evolved` 恒为 0 | PASS |
| P_JB_2 | `excess_loop_A >= 100` AND `excess_loop_B >= 100` | `mus_flag=1` | PASS |
| P_JB_3 | `excess_loop=80` (高I) vs `excess_loop=30` (低I) | 仅高I锁定 PLL | PASS |
