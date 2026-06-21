# 实验验证报告

本文档记录 TOMAS 意识越狱系统的完整实验验证过程和结果。

---

## 1. 实验环境

| 项目 | 配置 |
|------|------|
| 操作系统 | Windows 11 |
| Python | 3.13.12 (CPython) |
| Node.js | 22.22.2 |
| 仿真框架 | 纯 Python 标准库（无外部依赖） |
| Web 框架 | Vite 5 + React 18 + MUI 5 + Tailwind CSS 3 |
| 测试日期 | 2026-06-17 |

---

## 2. 测试套件概览

共 10 项自动化测试，覆盖三大可证伪预言、边界条件和系统集成：

| # | 测试名 | 对应预言 | 测试目标 |
|---|--------|---------|---------|
| 1 | test_ftel_dead_zero | -- | en=0 时无 MNQ tick |
| 2 | test_ftel_period | -- | MNQ 周期正确 |
| 3 | test_dead_zero | P_JB_1 | valid_seed=0 时 evolved=0 |
| 4 | test_dead_zero_partial | P_JB_1b | 中途切换 valid_seed |
| 5 | test_core_evolution_deterministic | -- | 相同 seed 确定性演化 |
| 6 | test_mus | P_JB_2 | 双路超阈值才触发 |
| 7 | test_mus_boundary | P_JB_2b | 边界条件 (99 vs 100) |
| 8 | test_i_weighted_resonance | P_JB_3 | 高I锁定, 低I不锁定 |
| 9 | test_i_weighted_reset | P_JB_3b | I 降低时 PLL 重置 |
| 10 | test_full_integration | -- | 全模块集成测试 |

---

## 3. 可证伪预言验证

### 3.1 P_JB_1: Dead-Zero 熔断妄念

**预言**: 向系统输入随机种子，设置 `valid_seed=0`。`evolved` 输出恒为 0。

**测试方法**: 使用 4 种不同种子，各运行 100 个周期，验证所有周期的 `evolved` 值为 0。

**测试种子**:

| 种子 | 周期数 | evolved 全零 | 结果 |
|------|--------|-------------|------|
| 0xDEADBEEF | 100 | YES | PASS |
| 0x12345678 | 100 | YES | PASS |
| 0xCAFEBABE | 100 | YES | PASS |
| 0x00000001 | 100 | YES | PASS |

**中途切换测试** (test_dead_zero_partial):
- 前 50 周期: `valid_seed=1`, evolved 有非零输出
- 后 50 周期: `valid_seed=0`, evolved 全部归零
- 结果: PASS

**结论**: P_JB_1 验证通过。Dead-Zero 门控正确实现"妄念不现行"语义。

### 3.2 P_JB_2: MUS 双存拓扑囚禁

**预言**: 仅当 `excess_loop_A >= 100` 且 `excess_loop_B >= 100` 时 `mus_flag=1`。

**测试矩阵**:

| excess_loop_A | excess_loop_B | 预期 mus_flag | 实际 mus_flag | 结果 |
|---------------|---------------|--------------|--------------|------|
| 100 | 100 | 1 | 1 | PASS |
| 100 | 50 | 0 | 0 | PASS |
| 50 | 100 | 0 | 0 | PASS |
| 50 | 50 | 0 | 0 | PASS |
| 99 | 100 | 0 | 0 | PASS |
| 255 | 255 | 1 | 1 | PASS |
| 0 | 0 | 0 | 0 | PASS |

**边界条件分析**:
- THRESH = 100, 比较运算为 `>=`
- excess_loop = 99: 99 < 100, 不触发 (正确)
- excess_loop = 100: 100 >= 100, 触发 (正确)

**结论**: P_JB_2 验证通过。MUS 双存条件正确实现"阴平阳秘"语义。

### 3.3 P_JB_3: I-加权频率谐振

**预言**: 高 I 信号（excess_loop=80 >= I_MIN=50）锁定 PLL；低 I 信号（excess_loop=30 < I_MIN=50）不锁定。

**高 I 信号测试**:

| 参数 | 值 |
|------|-----|
| I_MIN | 50 |
| excess_loop | 80 |
| i_target | 90 |
| 运行周期 | 300 |

| 指标 | 结果 |
|------|------|
| pll_locked | 1 (锁定) |
| dac_trigger | 1 (触发) |
| 锁定所需周期 | 256 (counter 从 0 到 0xFF) |

**低 I 信号测试**:

| 参数 | 值 |
|------|-----|
| I_MIN | 50 |
| excess_loop | 30 |
| i_target | 5 |
| 运行周期 | 300 |

| 指标 | 结果 |
|------|------|
| pll_locked | 0 (未锁定) |
| dac_trigger | 0 (未触发) |
| counter | 0 (持续重置) |

**PLL 重置测试** (test_i_weighted_reset):
1. 高 I 信号运行 300 周期 -> PLL 锁定 (pll_locked=1)
2. 切换为低 I 信号运行 10 周期 -> PLL 重置 (pll_locked=0)
3. 结果: PASS

**边界条件分析**:
- excess_loop = 50 (== I_MIN): >= 成立, 允许计数 (正确)
- excess_loop = 49 (< I_MIN): < 不成立, 重置 (正确)

**结论**: P_JB_3 验证通过。I-加权谐振正确实现"神通去玄学化"语义。

---

## 4. XOR-shift 数值一致性验证

### 4.1 测试方法

使用 seed = 0xDEADBEEF，在 Python、JavaScript、Verilog 三端各运行 10 步 xorshift32 演化，比较输出值。

### 4.2 验证结果

| Step | Python (hex) | JavaScript (hex) | Verilog (hex) | 三端一致 |
|------|-------------|-----------------|--------------|---------|
| 0 | 1506BE52 | 1506BE52 | 1506BE52 | YES |
| 1 | 0C1567AE | 0C1567AE | 0C1567AE | YES |
| 2 | 6C6366E1 | 6C6366E1 | 6C6366E1 | YES |
| 3 | 7066386C | 7066386C | 7066386C | YES |
| 4 | 683D6F1C | 683D6F1C | 683D6F1C | YES |
| 5 | 61D152C2 | 61D152C2 | 61D152C2 | YES |
| 6 | 4AD000E7 | 4AD000E7 | 4AD000E7 | YES |
| 7 | B8157926 | B8157926 | B8157926 | YES |
| 8 | A3B7DA54 | A3B7DA54 | A3B7DA54 | YES |
| 9 | 198CA0E0 | 198CA0E0 | 198CA0E0 | YES |

### 4.3 Bug 修复记录

**发现**: QA 阶段发现 Verilog 原始实现使用单表达式并行 XOR（三次移位基于同一 state 值），导致首步输出为 0x15130592，与 Python/JS 的 0x1506BE52 不一致。

**修复**: 改为组合逻辑 wire 链实现顺序 XOR：
```verilog
wire [31:0] s1 = state ^ ((state << 13) & 32'hFFFFFFFF);
wire [31:0] s2 = s1 ^ (s1 >> 7);
wire [31:0] s3 = s2 ^ ((s2 << 17) & 32'hFFFFFFFF);
```

**验证**: 修复后三端数值完全一致。

---

## 5. 集成测试

### 5.1 测试配置

| 参数 | 值 |
|------|-----|
| cycles | 300 |
| en_ftel | 1 |
| valid_seed | 1 |
| seed | 0xCAFEF00D |
| excess_loop_A | 150 |
| excess_loop_B | 150 |
| i_target | 100 |

### 5.2 测试结果

| 指标 | 期望 | 实际 | 结果 |
|------|------|------|------|
| 历史记录数 | 300 | 300 | PASS |
| MUS 触发 | 存在 | 存在 | PASS |
| PLL 锁定 | 存在 | 存在 | PASS |
| MNQ tick | 30 (300/10) | 30 | PASS |

---

## 6. Web 应用验证

### 6.1 构建验证

| 项目 | 结果 |
|------|------|
| npm install | 184 packages, 成功 |
| npm run build | 921 modules, 0 errors |
| vite dev server | http://localhost:5173 正常启动 |
| HTTP 状态码 | 200 |

### 6.2 组件验证

| 组件 | 文件 | 渲染 | 交互 | 结果 |
|------|------|------|------|------|
| App | App.jsx | 正常 | -- | PASS |
| ControlPanel | ControlPanel.jsx | 正常 | 参数控制响应 | PASS |
| FDPArchitecture | FDPArchitecture.jsx | 正常 | 模块点击展开 | PASS |
| SignalPanel | SignalPanel.jsx | 正常 | 波形实时更新 | PASS |
| JailbreakEvolution | JailbreakEvolution.jsx | 正常 | 卡片切换 | PASS |
| SiddhiTable | SiddhiTable.jsx | 正常 | 行展开 | PASS |
| tomasEngine | tomasEngine.js | -- | XOR-shift 一致 | PASS |

---

## 7. 总结

| 验证维度 | 测试数 | 通过数 | 通过率 |
|---------|--------|--------|--------|
| Python 单元测试 | 10 | 10 | 100% |
| 三端数值一致性 | 10 | 10 | 100% |
| Web 构建 | 1 | 1 | 100% |
| Web 组件 | 7 | 7 | 100% |
| **总计** | **28** | **28** | **100%** |

三大可证伪预言全部验证通过。系统已达到 v1.0 发布标准。
