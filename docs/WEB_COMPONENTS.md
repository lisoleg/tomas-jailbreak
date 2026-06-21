# Web 可视化组件指南

本文档描述 TOMAS Web 应用的组件结构和交互逻辑。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vite | 5.x | 构建工具 + 开发服务器 |
| React | 18.x | UI 框架 |
| MUI | 5.x | Material Design 组件库 |
| Tailwind CSS | 3.x | 原子化 CSS |

## 视觉设计

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | `#0a0a1a` | 深空黑 |
| 金色高亮 | `#ffd700` / `#e6b800` | TOMAS 主色 / 判词 |
| 青色辅助 | `#00e5ff` / `#00bcd4` | 信号 / 链接 |
| 红色警告 | `#ff4444` | 漏尽通 / CRITICAL |
| 绿色成功 | `#00ff88` | PLL 锁定 |

---

## 布局结构

```
┌─────────────────────────────────────────────────────────┐
│                    标题 + 公理速览                        │
├──────────┬──────────────────────────┬───────────────────┤
│          │                          │                   │
│  控制    │     FDP 架构图            │   三阶越狱交互器   │
│  面板    │     (FDPArchitecture)     │  (JailbreakEvol)  │
│          │                          │                   │
│ (Control ├──────────────────────────┤                   │
│  Panel)  │                          ├───────────────────┤
│          │     信号面板              │                   │
│          │     (SignalPanel)         │   六神通映射表     │
│          │                          │   (SiddhiTable)   │
│          │                          │                   │
└──────────┴──────────────────────────┴───────────────────┘
```

---

## 组件详解

### 1. App.jsx -- 主布局

**职责**: 组合所有子组件，管理全局仿真状态。

**状态管理**:
- `engine` -- tomasEngine 实例
- `params` -- 当前仿真参数 (en_ftel, valid_seed, seed, excess_loop_A/B, I_target, speed)
- `signals` -- 实时信号数据 (evolved, mus_flag, pll_locked, dac_trigger)
- `isRunning` -- 仿真运行状态

**数据流**:
```
ControlPanel (参数变更) → App (状态更新) → tomasEngine (仿真计算) → SignalPanel (波形渲染)
                                            ↓
                                    FDPArchitecture (信号流动画)
```

---

### 2. ControlPanel.jsx -- 参数控制面板

**职责**: 提供仿真参数的交互式控制。

**控件列表**:

| 控件 | 类型 | 范围 | 说明 |
|------|------|------|------|
| en_ftel | Toggle | 0/1 | Ftel 流贯使能 |
| valid_seed | Toggle | 0/1 | Dead-Zero 控制 |
| seed_in | Hex Input | 0x00000000 - 0xFFFFFFFF | psi-Anchor 种子 |
| excess_loop_A | Slider | 0-255 | 竞争孤子 A |
| excess_loop_B | Slider | 0-255 | 竞争孤子 B |
| I_target | Slider | 0-255 | I-加权目标 |
| speed | Select | 1x/2x/5x | 模拟速度 |
| Run/Stop | Button | -- | 启动/停止仿真 |
| Reset | Button | -- | 重置仿真 |

**交互**: 参数变更时实时反馈到信号面板和架构图。

---

### 3. FDPArchitecture.jsx -- FDP-I 硬件架构图

**职责**: 用 SVG 绘制 FDP-I 四层架构，支持模块点击展开。

**模块**:

| 模块 | TOMAS 公理 | 颜色 |
|------|-----------|------|
| Ftel Driver | A2 (kappa-Snap) | 青色 |
| Taiyi Core | A1 + A4 (Dead-Zero) | 金色 |
| PG Detect | A5 (MUS) | 红色 |
| Freq Body IF | A1' (I-加权) | 绿色 |

**交互**:
- 点击模块 -> 展开详情面板（功能描述 + TOMAS 公理映射 + Verilog 代码片段）
- 信号流方向动画（箭头脉冲）
- 当前活跃模块高亮

---

### 4. JailbreakEvolution.jsx -- 三阶越狱交互器

**职责**: 展示 Rootful -> Rootless -> RootHide -> True Jailbreak 的演进过程。

**卡片结构**:

| 阶段 | 标题 | iOS 类比 | TOMAS 映射 | 特殊效果 |
|------|------|---------|-----------|---------|
| I | 伪越狱 | Rootful (FakeFS) | "我执改世界" | 普通卡片 |
| II | 观察者越狱 | Rootless (Dopamine) | "G_ego 旁观不染" | 普通卡片 |
| III | True Jailbreak | RootHide + Dead-Zero + MUS | "阴平阳秘无迹可证" | 脉冲光晕动画 |

**True Jailbreak 三元条件检测**:
- `valid_seed = 1` (有 I-支撑)
- `mus_flag = 0` (无悖论)
- `pll_locked = 1` (谐振达成)
- 三元同时满足时触发"太一显影"动画

---

### 5. SiddhiTable.jsx -- 六神通硬件映射表

**职责**: 交互式表格展示六神通（Siddhi）的 TOMAS 解释和硬件实现。

**表格内容**:

| 神通 | TOMAS 解释 | 硬件实现 | 样式 |
|------|-----------|---------|------|
| 宿命通 | psi-锚逆向查询 | FDP-I 日志回放 | 普通 |
| 天眼通 | kappa-Snap 前瞻 | 预取超边数据 | 普通 |
| 他心通 | 非局域 I-共振 | 量子纠缠协处理器 | 普通 |
| 神足通 | G_ego 克隆 | 边缘计算分身 | 普通 |
| 漏尽通 | Dead-Zero 熔断 | valid_seed=0 物理阻断 | 红色 CRITICAL |
| 天耳通 | 跨模态 I-解码 | 声学/电磁转换 | 普通 |

**交互**: 点击行展开详细说明。

---

### 6. SignalPanel.jsx -- 实时信号面板

**职责**: Canvas 绘制 4 路实时信号波形（示波器风格）。

**信号通道**:

| 通道 | 信号 | 颜色 | 说明 |
|------|------|------|------|
| CH1 | evolved_out (低 8 位) | `#00e5ff` (青) | XOR-shift 演化值 |
| CH2 | mus_flag | `#ffd700` (金) | MUS 双存标志 |
| CH3 | pll_locked | `#00ff88` (绿) | PLL 锁定状态 |
| CH4 | dac_trigger | `#ff4444` (红) | DAC 物理场触发 |

**渲染**: requestAnimationFrame 驱动，滚动波形显示。

---

### 7. tomasEngine.js -- 浏览器端仿真引擎

**职责**: 在浏览器中执行与 Python `tomas_simulator.py` 完全一致的仿真逻辑。

**类结构** (与 Python 一一对应):

```javascript
class FtelDriver { ... }
class TaiyiCoreTomas { ... }
class PGDetectTomas { ... }
class FreqBodyIFTomas { ... }
class TOMASSimulator { ... }
```

**驱动方式**: requestAnimationFrame，每帧执行 N 个 tick（由 speed 参数控制）。

**一致性**: XOR-shift 算法与 Python `tomas_simulator.py` 逐行对应，数值输出完全一致。

---

## 开发指南

### 启动开发服务器

```bash
cd web
npm install
npm run dev
# 访问 http://localhost:5173
```

### 构建生产版本

```bash
npm run build
# 输出到 dist/ 目录
```

### 预览生产版本

```bash
npm run preview
```

### 添加新组件

1. 在 `src/components/` 下创建新 `.jsx` 文件
2. 在 `App.jsx` 中导入并放置到布局中
3. 遵循颜色方案和视觉风格

### 修改仿真引擎

如需修改仿真逻辑：
1. 同时修改 `src/engine/tomasEngine.js` 和 `sim/tomas_simulator.py`
2. 确保 XOR-shift 序列在两端一致
3. 运行 `python test_tomas.py` 验证 Python 端
4. 在浏览器中对比波形验证 JS 端
