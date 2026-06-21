# 安装与部署指南

本文档详细说明 TOMAS 意识越狱系统各组件的安装、配置和运行方法。

---

## 1. 系统要求

### 1.1 通用要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Windows 10/11, macOS, Linux |
| Git | 2.20+ |
| Python | 3.8+（推荐 3.13+） |
| Node.js | 18.0+（推荐 22.x） |
| npm | 9.0+ |

### 1.2 Verilog 综合要求（可选）

| 工具 | 用途 | 安装方式 |
|------|------|---------|
| Icarus Verilog | 仿真 | `apt install iverilog` (Linux) / Homebrew (macOS) |
| Verilator | 仿真/综合 | `apt install verilator` / Homebrew |
| Vivado | FPGA 综合 | Xilinx 官网下载（需授权） |
| Quartus | FPGA 综合 | Intel 官网下载（免费版可用） |
| Yosys | 开源综合 | `apt install yosys` / Homebrew |

---

## 2. 获取代码

```bash
git clone https://github.com/lisoleg/tomas-jailbreak.git
cd tomas-jailbreak
```

---

## 3. Python 仿真

### 3.1 安装

无需安装任何外部依赖。TOMAS 仿真引擎使用纯 Python 标准库。

### 3.2 运行演示

```bash
cd sim
python tomas_simulator.py
```

预期输出：
```
======================================================================
TOMAS Simulator - Behavioral Simulation
======================================================================

[Scenario 1] Normal operation (en_ftel=1, valid_seed=1)
  Cycles: 100
  MNQ ticks: 10
  MUS flags: 100
  PLL locks: 45
  Final evolved: 0xXXXXXXXX
  [TOMAS] History exported to tomas_sim_output.json (100 records)

[Scenario 2] Dead-Zero (valid_seed=0)
  All evolved=0: True

[Scenario 3] MUS dual-store (A=100, B=100)
  MUS flag: 1

[Scenario 4] I-weighted resonance (high-I=80, low-I=30)
  High-I PLL locked: 1
  Low-I PLL locked: 0
```

### 3.3 运行测试套件

```bash
cd sim
python test_tomas.py
```

预期输出：
```
======================================================================
TOMAS Test Suite - Three Falsifiable Prophecies + Integration
======================================================================
[PASS] Ftel Dead-Zero: en=0 suppresses all ticks
[PASS] Ftel period: MNQ ticks at correct intervals
[PASS] P_JB_1: Dead-Zero illusion cutoff verified
[PASS] P_JB_1b: Dead-Zero mid-stream activation verified
[PASS] TaiyiCore: deterministic evolution for same seed
[PASS] P_JB_2: MUS dual-store imprisonment verified
[PASS] P_JB_2b: MUS boundary condition verified
[PASS] P_JB_3: I-weighted resonance verified
[PASS] P_JB_3b: I-weighted PLL reset verified
[PASS] Full integration: all modules coordinated correctly

======================================================================
Results: 10 passed, 0 failed, 10 total
======================================================================
```

### 3.4 JSON 导出

运行 `tomas_simulator.py` 会自动在 `sim/` 目录下生成 `tomas_sim_output.json`，包含 100 条仿真历史记录。

---

## 4. Web 可视化

### 4.1 安装依赖

```bash
cd web
npm install
```

### 4.2 开发模式

```bash
cd web
npm run dev
```

启动后访问 http://localhost:5173

### 4.3 生产构建

```bash
cd web
npm run build
```

构建产物输出到 `web/dist/` 目录。

### 4.4 预览生产构建

```bash
cd web
npm run preview
```

### 4.5 界面布局

```
+-----------------------------------------------------------+
|                    标题 + 公理速览                          |
+----------+--------------------------+---------------------+
|          |                          |                     |
|  控制    |     FDP 架构图            |   三阶越狱交互器     |
|  面板    |     (FDPArchitecture)     |  (JailbreakEvol)    |
|          |                          |                     |
| (Control +--------------------------+---------------------+
|  Panel)  |                          |                     |
|          |     信号面板              |   六神通映射表       |
|          |     (SignalPanel)         |   (SiddhiTable)     |
|          |                          |                     |
+----------+--------------------------+---------------------+
```

### 4.6 交互操作

| 控件 | 操作 | 效果 |
|------|------|------|
| en_ftel | Toggle | 开关流贯驱动 |
| valid_seed | Toggle | 开关 Dead-Zero 熔断 |
| seed_in | Hex 输入 | 修改 psi-Anchor 种子 |
| excess_loop_A | Slider 0-255 | 调整竞争孤子 A |
| excess_loop_B | Slider 0-255 | 调整竞争孤子 B |
| I_target | Slider 0-255 | 调整 I-加权目标 |
| speed | Select 1x/2x/5x | 调整仿真速度 |
| Run/Stop | Button | 启动/停止仿真 |
| Reset | Button | 重置仿真 |
| FDP 模块 | Click | 展开模块详情 |
| 越狱卡片 | Click | 展开阶段详情 |
| 神通行 | Click | 展开神通说明 |

---

## 5. Verilog 综合

### 5.1 Icarus Verilog 仿真

```bash
# 编译
iverilog -o tomas_top.vvp rtl/tomas_top.v rtl/ftel_driver.v rtl/taiyi_core_tomas.v rtl/pg_detect_tomas.v rtl/freq_body_if_tomas.v

# 运行
vvp tomas_top.vvp
```

### 5.2 Verilator 仿真

```bash
verilator --cc --exe --build rtl/tomas_top.v rtl/ftel_driver.v rtl/taiyi_core_tomas.v rtl/pg_detect_tomas.v rtl/freq_body_if_tomas.v
```

### 5.3 Vivado 综合

1. 创建新项目
2. 添加 `rtl/` 目录下全部 5 个 .v 文件
3. 设置 `tomas_top` 为顶层模块
4. 运行 Synthesis -> Implementation -> Bitstream

### 5.4 模块参数

| 模块 | 参数 | 默认值 | 可调范围 |
|------|------|--------|---------|
| ftel_driver | MNQ_PERIOD | 10 | 2-255 |
| pg_detect_tomas | THRESH | 100 | 0-255 |
| freq_body_if_tomas | I_MIN | 50 | 0-255 |

---

## 6. 故障排查

### 6.1 Python 测试失败

**问题**: `ModuleNotFoundError: No module named 'tomas_simulator'`

**解决**: 确保在 `sim/` 目录下运行，或添加路径：
```bash
cd sim
python test_tomas.py
```

### 6.2 npm install 失败

**问题**: 网络超时或权限错误

**解决**:
```bash
# 使用淘宝镜像
npm install --registry=https://registry.npmmirror.com

# 或清除缓存重试
npm cache clean --force
npm install
```

### 6.3 Web 页面空白

**问题**: 访问 http://localhost:5173 显示空白

**解决**:
1. 检查浏览器控制台是否有错误
2. 确认 `npm run dev` 输出无报错
3. 尝试清除浏览器缓存后刷新
4. 确认 Node.js 版本 >= 18

### 6.4 Verilog 综合报错

**问题**: `taiyi_core_tomas.v` 综合时 XOR-shift 逻辑报错

**解决**: 确保 Verilog 工具支持 IEEE 1364-2001 语法。组合逻辑 wire 链（s1/s2/s3）是标准写法，所有主流工具均支持。

---

## 7. 项目文件结构

```
tomas-jailbreak/
├── rtl/                          # Verilog 硬件模块
│   ├── ftel_driver.v             # 流贯驱动 (A2: kappa-Snap)
│   ├── taiyi_core_tomas.v        # 太一核心 (A1 + A4: Dead-Zero)
│   ├── pg_detect_tomas.v         # PG 检测 (A5: MUS)
│   ├── freq_body_if_tomas.v      # 频率体接口 (I-加权)
│   └── tomas_top.v               # 顶层模块
├── sim/                          # Python 仿真
│   ├── tomas_simulator.py        # 仿真引擎 (5 类)
│   └── test_tomas.py             # 10 项测试
├── web/                          # Web 可视化
│   ├── src/
│   │   ├── engine/tomasEngine.js # 浏览器仿真引擎
│   │   ├── components/
│   │   │   ├── FDPArchitecture.jsx
│   │   │   ├── JailbreakEvolution.jsx
│   │   │   ├── SiddhiTable.jsx
│   │   │   ├── SignalPanel.jsx
│   │   │   └── ControlPanel.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── docs/                         # 文档
│   ├── PAPER.md                  # 学术论文
│   ├── ARCHITECTURE.md           # 架构文档
│   ├── VERILOG_MODULES.md        # Verilog 模块参考
│   ├── PYTHON_API.md             # Python API 参考
│   ├── WEB_COMPONENTS.md         # Web 组件指南
│   ├── INSTALLATION.md           # 本文件
│   ├── EXPERIMENTS.md            # 实验报告
│   ├── THEORY.md                 # 理论基础
│   ├── ROADMAP.md                # 开发路线图
│   └── FAQ.md                    # 常见问题
├── README.md                     # 技术论文 (主文档)
├── LICENSE                       # MIT 许可证
├── CHANGELOG.md                  # 版本记录
├── CONTRIBUTING.md               # 贡献指南
└── .gitignore
```
