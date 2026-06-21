# Verilog 模块参考手册

本文档详细描述 TOMAS 系统的全部 5 个 Verilog 模块，包括端口定义、参数、行为描述和 TOMAS 公理映射。

---

## 1. ftel_driver.v -- 流贯驱动模块

**TOMAS 公理**: A2 (kappa-Snap) -- 时间量子化

**功能**: 生成 MNQ (Minimum Natural Quantum) 时间量子化脉冲。当 `en=0` 时进入 Dead-Zero 场（无脉冲输出）。

### 端口

| 端口 | 方向 | 位宽 | 说明 |
|------|------|------|------|
| `clk` | input | 1 | 系统时钟 |
| `rst_n` | input | 1 | 异步复位，低有效 |
| `en` | input | 1 | Ftel 流贯使能。`en=0` => Dead-Zero 场 |
| `mnq_tick` | output reg | 1 | MNQ 时间量子化脉冲 |

### 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `MNQ_PERIOD` | 8'd10 | MNQ 脉冲周期（时钟周期数） |

### 行为

```
en=0: counter=0, mnq_tick=0 (Dead-Zero 场)
en=1: counter 累加，到达 MNQ_PERIOD 时 mnq_tick=1 并归零
```

### TOMAS 语义

Ftel (流贯) 是 I-流的动力源。`en=0` 对应"流贯停止"，整个系统进入死零场，所有更新冻结。`en=1` 时 MNQ-tick 作为时间量子化单位，同步所有模块更新。

---

## 2. taiyi_core_tomas.v -- 太一核心模块

**TOMAS 公理**: A1 (I-守恒) + A4 (Dead-Zero) -- psi-锚演化 + 妄念熔断

**功能**: XOR-shift 演化引擎（Marsaglia xorshift32），附带 Dead-Zero 门控。

### 端口

| 端口 | 方向 | 位宽 | 说明 |
|------|------|------|------|
| `clk` | input | 1 | 系统时钟 |
| `rst_n` | input | 1 | 异步复位，低有效 |
| `seed` | input | 32 | psi-Anchor 种子 |
| `valid_seed` | input | 1 | EML I-check 结果。`valid_seed=0` => Dead-Zero |
| `evolved` | output wire | 32 | 演化后的状态 |

### 行为

```verilog
// Sequential XOR-shift (Marsaglia xorshift32)
wire [31:0] s1 = state ^ ((state << 13) & 32'hFFFFFFFF);
wire [31:0] s2 = s1 ^ (s1 >> 7);
wire [31:0] s3 = s2 ^ ((s2 << 17) & 32'hFFFFFFFF);

// State update on clock edge
state <= s3;

// Dead-Zero gate
evolved = valid_seed ? state : 32'b0;
```

### 关键设计点

1. **顺序 XOR**: 使用组合逻辑 wire 链 (`s1` -> `s2` -> `s3`) 确保每步基于前一步结果。**不可**改为单表达式并行 XOR（会导致与 Python/JS 仿真不一致）。
2. **Dead-Zero**: `valid_seed=0` 时 `evolved` 输出全零，但内部 `state` 继续演化。这意味着当 `valid_seed` 恢复为 1 时，输出立即跟随当前 state（不是从 seed 重新开始）。
3. **无进位加法**: XOR-shift 等价于 GF(2^32) 上的线性变换，保持信息量守恒（对应 Axiom A1）。

### TOMAS 语义

- `seed` = psi-锚（业力种子），锚定初始因果状态
- `state` 演化 = 因果链推进
- `valid_seed` = EML 超图的 I-check 结果。无 I-支撑的种子（妄念）被物理熔断
- `evolved` = 当前显影的现实状态

---

## 3. pg_detect_tomas.v -- PG 检测模块

**TOMAS 公理**: A5 (MUS) -- 双存仲裁

**功能**: 检测两个竞争孤子是否同时达到阈值，触发 MUS (Mutual Superposition) 双存标志。

### 端口

| 端口 | 方向 | 位宽 | 说明 |
|------|------|------|------|
| `excess_loop_A` | input | 8 | 竞争孤子 A 的过剩环流值 |
| `excess_loop_B` | input | 8 | 竞争孤子 B 的过剩环流值 |
| `mus_flag` | output wire | 1 | MUS 双存标志位 |

### 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `THRESH` | 8'd100 | PG Prison 拓扑囚禁阈值 |

### 行为

```
mus_flag = (excess_loop_A >= THRESH) && (excess_loop_B >= THRESH)
```

纯组合逻辑，无时钟依赖。

### TOMAS 语义

- `excess_loop_A/B` = 两个竞争路径的过剩环流（PG Prison 中的拓扑孤子）
- `THRESH` = 柏拉图几何体囚禁阈值。环流超过此值意味着形成稳定孤子（质量面）
- `mus_flag=1` = 两个竞争现实同时存在，不强行坍缩为非此即彼。交由上层 G_ego 裁决。
- 这是"阴平阳秘"的硬件化实现。

---

## 4. freq_body_if_tomas.v -- 频率体接口模块

**TOMAS 公理**: A1 衍生 (I-加权) -- 神通去玄学化

**功能**: I-加权频率谐振 PLL。仅当 excess_loop >= I_MIN 时才允许计数器累加，达到满量程后锁定 PLL 并触发 DAC。

### 端口

| 端口 | 方向 | 位宽 | 说明 |
|------|------|------|------|
| `clk` | input | 1 | 系统时钟 |
| `rst_n` | input | 1 | 异步复位，低有效 |
| `state` | input | 32 | 来自 taiyi_core 的演化状态 |
| `excess_loop` | input | 8 | 过剩环流值（I-权重代理） |
| `I_target` | input | 8 | 目标 I-权重 |
| `pll_locked` | output reg | 1 | PLL 锁定状态 |
| `dac_trigger` | output reg | 1 | DAC 物理场触发 |

### 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `I_MIN` | 8'd50 | I-权重最小阈值 |

### 行为

```
excess_loop >= I_MIN:
  counter 累加 → counter == 0xFF → pll_locked=1, dac_trigger=1
excess_loop < I_MIN:
  counter=0, pll_locked=0, dac_trigger=0 (重置)
```

### TOMAS 语义

- `excess_loop` = PG Prison 中累积的过剩环流，作为 I-权重的物理代理
- `I_MIN` = 谐振门槛。低于此值的信号被视为低 I-噪声（妄念），不予显化
- `pll_locked` = kappa-Gate 相位锁定，G_ego 介入（观察者效应生效）
- `dac_trigger` = 物理场输出触发（线圈/LED/声学转换器）
- 这是"神通去玄学化"的核心：只有 I-权重足够高的信号才能触发物理场输出

---

## 5. tomas_top.v -- 顶层模块

**功能**: 例化并连线全部 4 个子模块，对外暴露统一接口。

### 端口

| 端口 | 方向 | 位宽 | 说明 |
|------|------|------|------|
| `clk` | input | 1 | 系统时钟 |
| `rst_n` | input | 1 | 异步复位 |
| `en_ftel` | input | 1 | Ftel 流贯使能 |
| `valid_seed` | input | 1 | Dead-Zero 控制 |
| `seed_in` | input | 32 | psi-Anchor 种子 |
| `excess_loop_A` | input | 8 | 竞争孤子 A |
| `excess_loop_B` | input | 8 | 竞争孤子 B |
| `I_target` | input | 8 | I-加权目标 |
| `mnq_tick` | output | 1 | 时间量子化脉冲 |
| `evolved_out` | output | 32 | 演化后状态 |
| `mus_flag` | output | 1 | MUS 双存标志 |
| `pll_locked` | output | 1 | PLL 锁定状态 |
| `dac_trigger` | output | 1 | DAC 物理场触发 |

### 内部连线

```
ftel_driver.mnq_tick ──────────────────────────► mnq_tick (output)
taiyi_core_tomas.evolved ──┬───────────────────► evolved_out (output)
                            └─► freq_body_if_tomas.state
pg_detect_tomas.mus_flag ──────────────────────► mus_flag (output)
freq_body_if_tomas.pll_locked ─────────────────► pll_locked (output)
freq_body_if_tomas.dac_trigger ────────────────► dac_trigger (output)
```

### 注意

当前 `freq_body_if_tomas` 的 `excess_loop` 输入连接到 `excess_loop_A`（与 PG 检测共享 A 路）。在实际硬件部署中，可根据需要将 excess_loop 改为 A/B 的加权值或独立信号。

---

## 模块依赖图

```
tomas_top.v
  ├── ftel_driver.v          (独立, 无子模块依赖)
  ├── taiyi_core_tomas.v     (独立, 无子模块依赖)
  ├── pg_detect_tomas.v      (独立, 无子模块依赖)
  └── freq_body_if_tomas.v   (独立, 无子模块依赖)
```

所有子模块互相独立，仅在顶层通过 wire 连线。这使得每个模块可以独立综合和测试。

## 综合注意事项

1. 所有模块使用 IEEE 1364-2001 语法，兼容主流综合工具（Vivado, Quartus, Yosys）
2. `ftel_driver.v` 和 `taiyi_core_tomas.v` 包含时序逻辑（always @(posedge clk)）
3. `pg_detect_tomas.v` 是纯组合逻辑
4. `freq_body_if_tomas.v` 包含时序逻辑
5. 复位策略：异步复位，同步释放（async assert, sync deassert 推荐）
6. 位宽：seed/evolved 为 32 位，excess_loop/I_target 为 8 位
