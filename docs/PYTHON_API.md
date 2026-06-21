# Python 仿真 API 参考

本文档描述 `tomas_simulator.py` 中全部 5 个类的 API 接口。

---

## 模块概览

```python
from tomas_simulator import (
    FtelDriver,        # 流贯驱动仿真
    TaiyiCoreTomas,    # 太一核心仿真 (XOR-shift + Dead-Zero)
    PGDetectTomas,     # PG 检测仿真 (MUS 双存)
    FreqBodyIFTomas,   # 频率体接口仿真 (I-加权 PLL)
    TOMASSimulator,    # 顶层集成仿真器
)
```

---

## 1. FtelDriver

流贯驱动仿真。对应 Verilog 模块 `ftel_driver.v`。

**TOMAS 公理**: A2 (kappa-Snap)

### 构造函数

```python
FtelDriver(mnq_period=10)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mnq_period` | int | 10 | MNQ 脉冲周期 |

### 方法

#### `tick(en)`

执行一个时钟周期。

| 参数 | 类型 | 说明 |
|------|------|------|
| `en` | int (0/1) | Ftel 流贯使能 |

**返回**: `int` -- mnq_tick 值 (0 或 1)

**行为**:
- `en=0`: counter 归零，返回 0 (Dead-Zero 场)
- `en=1`: counter 累加，到达 `mnq_period - 1` 时返回 1 并归零

#### `reset()`

重置 counter 和 mnq_tick 到初始状态。

### 示例

```python
driver = FtelDriver(mnq_period=10)
ticks = [driver.tick(1) for _ in range(30)]
# ticks[9] == 1, ticks[19] == 1, ticks[29] == 1, 其余为 0
```

---

## 2. TaiyiCoreTomas

太一核心仿真。对应 Verilog 模块 `taiyi_core_tomas.v`。

**TOMAS 公理**: A1 (I-守恒) + A4 (Dead-Zero)

### 构造函数

```python
TaiyiCoreTomas(seed=0xDEADBEEF)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seed` | int | 0xDEADBEEF | psi-Anchor 种子 (32-bit) |

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `state` | int | 当前内部状态 (32-bit) |
| `mask32` | int | 32-bit 掩码 (0xFFFFFFFF) |

### 方法

#### `evolve(valid_seed)`

执行一步 XOR-shift 演化。

| 参数 | 类型 | 说明 |
|------|------|------|
| `valid_seed` | int (0/1) | EML I-check 结果 |

**返回**: `int` -- 演化后的值。`valid_seed=0` 时返回 0 (Dead-Zero)。

**算法** (Marsaglia xorshift32, 顺序 XOR):
```python
s = self.state
s ^= (s << 13) & 0xFFFFFFFF  # Step 1
s ^= (s >> 7)                 # Step 2
s ^= (s << 17) & 0xFFFFFFFF  # Step 3
self.state = s & 0xFFFFFFFF
return self.state if valid_seed else 0
```

#### `reset(seed=0xDEADBEEF)`

重置内部状态到指定种子。

### 示例

```python
core = TaiyiCoreTomas(seed=0xDEADBEEF)
vals = [core.evolve(1) for _ in range(5)]
# vals = [0x1506BE52, 0x0C1567AE, 0x6C6366E1, 0x7066386C, 0x683D6F1C]

# Dead-Zero test
core2 = TaiyiCoreTomas(seed=0xDEADBEEF)
val = core2.evolve(0)  # returns 0, but state still evolves internally
```

---

## 3. PGDetectTomas

PG 检测仿真。对应 Verilog 模块 `pg_detect_tomas.v`。

**TOMAS 公理**: A5 (MUS)

### 构造函数

```python
PGDetectTomas(thresh=100)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `thresh` | int | 100 | PG Prison 拓扑囚禁阈值 |

### 方法

#### `detect(excess_loop_A, excess_loop_B)`

检测 MUS 双存条件。

| 参数 | 类型 | 说明 |
|------|------|------|
| `excess_loop_A` | int | 竞争孤子 A 的过剩环流 (0-255) |
| `excess_loop_B` | int | 竞争孤子 B 的过剩环流 (0-255) |

**返回**: `int` -- mus_flag (1 if both >= thresh, 0 otherwise)

### 示例

```python
pg = PGDetectTomas(thresh=100)
assert pg.detect(100, 100) == 1  # 双存激活
assert pg.detect(100, 50)  == 0  # 单边不触发
assert pg.detect(99, 100)  == 0  # 边界: 99 < 100, 不触发
```

---

## 4. FreqBodyIFTomas

频率体接口仿真。对应 Verilog 模块 `freq_body_if_tomas.v`。

**TOMAS 公理**: A1 衍生 (I-加权)

### 构造函数

```python
FreqBodyIFTomas(i_min=50)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `i_min` | int | 50 | I-权重最小阈值 |

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `counter` | int | 内部计数器 (0-255) |
| `pll_locked` | int (0/1) | PLL 锁定状态 |
| `dac_trigger` | int (0/1) | DAC 触发状态 |

### 方法

#### `tick(excess_loop, i_target)`

执行一个时钟周期。

| 参数 | 类型 | 说明 |
|------|------|------|
| `excess_loop` | int | 过剩环流值 (I-权重代理, 0-255) |
| `i_target` | int | 目标 I-权重 (0-255) |

**返回**: `tuple(int, int)` -- (pll_locked, dac_trigger)

**行为**:
- `excess_loop >= i_min`: counter 累加，到达 255 时 pll_locked=1, dac_trigger=1
- `excess_loop < i_min`: counter 归零，pll_locked=0, dac_trigger=0 (重置)

#### `reset()`

重置 counter, pll_locked, dac_trigger 到初始状态。

### 示例

```python
freq = FreqBodyIFTomas(i_min=50)
# High-I signal: excess_loop=80 >= 50
for _ in range(256):
    pll, dac = freq.tick(80, 90)
assert freq.pll_locked == 1  # PLL locked
assert freq.dac_trigger == 1  # DAC triggered

# Low-I signal: excess_loop=30 < 50
freq_low = FreqBodyIFTomas(i_min=50)
for _ in range(300):
    pll, dac = freq_low.tick(30, 5)
assert freq_low.pll_locked == 0  # Not locked
```

---

## 5. TOMASSimulator

顶层集成仿真器。对应 Verilog 模块 `tomas_top.v`。

### 构造函数

```python
TOMASSimulator()
```

初始化全部 4 个子模块实例。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `ftel` | FtelDriver | 流贯驱动实例 |
| `core` | TaiyiCoreTomas | 太一核心实例 |
| `pg` | PGDetectTomas | PG 检测实例 |
| `freq` | FreqBodyIFTomas | 频率体接口实例 |
| `history` | list[dict] | 仿真历史记录 |

### 方法

#### `run(cycles, en_ftel=1, valid_seed=1, excess_loop_A=0, excess_loop_B=0, i_target=0, seed=0xDEADBEEF)`

运行指定周期的仿真。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cycles` | int | -- | 仿真周期数 |
| `en_ftel` | int | 1 | Ftel 流贯使能 |
| `valid_seed` | int | 1 | Dead-Zero 控制 |
| `excess_loop_A` | int | 0 | 竞争孤子 A |
| `excess_loop_B` | int | 0 | 竞争孤子 B |
| `i_target` | int | 0 | I-加权目标 |
| `seed` | int | 0xDEADBEEF | psi-Anchor 种子 |

**返回**: `list[dict]` -- 历史记录列表

每个历史记录的字典结构:

```python
{
    't': int,              # 时间步
    'mnq_tick': int,       # MNQ 脉冲 (0/1)
    'evolved': int,        # 演化状态 (32-bit)
    'mus_flag': int,       # MUS 双存标志 (0/1)
    'pll_locked': int,     # PLL 锁定 (0/1)
    'dac_trigger': int     # DAC 触发 (0/1)
}
```

#### `export_json(filepath)`

将历史记录导出为 JSON 文件。

| 参数 | 类型 | 说明 |
|------|------|------|
| `filepath` | str | 输出文件路径 |

### 示例

```python
sim = TOMASSimulator()

# 正常运行
hist = sim.run(100, en_ftel=1, valid_seed=1, seed=0xDEADBEEF,
               excess_loop_A=120, excess_loop_B=110, i_target=90)

# 统计
mnq_count = sum(h['mnq_tick'] for h in hist)
mus_count = sum(h['mus_flag'] for h in hist)
pll_count = sum(h['pll_locked'] for h in hist)

# 导出 JSON
sim.export_json('tomas_sim_output.json')
```

---

## 测试套件

运行测试:

```bash
cd sim
python test_tomas.py
```

### 测试列表

| # | 测试名 | 预言 | 说明 |
|---|--------|------|------|
| 1 | `test_ftel_dead_zero` | -- | en=0 时无 tick |
| 2 | `test_ftel_period` | -- | MNQ 周期正确 |
| 3 | `test_dead_zero` | P_JB_1 | valid_seed=0 时 evolved=0 |
| 4 | `test_dead_zero_partial` | P_JB_1b | 中途切换 valid_seed |
| 5 | `test_core_evolution_deterministic` | -- | 相同 seed 确定性演化 |
| 6 | `test_mus` | P_JB_2 | 双路超阈值才触发 |
| 7 | `test_mus_boundary` | P_JB_2b | 边界条件 (99 vs 100) |
| 8 | `test_i_weighted_resonance` | P_JB_3 | 高I锁定, 低I不锁定 |
| 9 | `test_i_weighted_reset` | P_JB_3b | I 降低时 PLL 重置 |
| 10 | `test_full_integration` | -- | 全模块集成测试 |

预期输出:
```
Results: 10 passed, 0 failed, 10 total
```
