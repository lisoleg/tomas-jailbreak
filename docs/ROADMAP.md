# TOMAS 开发路线图

本文档描述 TOMAS 意识越狱系统的未来开发计划。

---

## 当前版本: v1.0 (2026-06-17)

### 已完成

- [x] Verilog RTL: 5 模块 (ftel_driver, taiyi_core_tomas, pg_detect_tomas, freq_body_if_tomas, tomas_top)
- [x] Python 行为级仿真引擎 (5 类, 无 cocotb 依赖)
- [x] 10 项自动化测试 (三大可证伪预言全通过)
- [x] 交互式 Web 可视化 (Vite + React + MUI + Tailwind)
- [x] XOR-shift Bug 修复 (并行 -> 顺序, 三端一致)
- [x] 完整技术文档 (README + 10 篇 docs)
- [x] GitHub 仓库 (https://github.com/lisoleg/tomas-jailbreak)

---

## v1.1 -- Cocotb 集成 (计划中)

### 目标

将 Python 仿真从纯行为级升级为 cocotb 驱动的 Verilog 门级仿真，实现 Python 测试直接驱动 Verilog RTL。

### 任务

- [ ] 添加 cocotb 依赖和 Makefile
- [ ] 编写 cocotb testbench (testbench_tomas.v)
- [ ] 将 test_tomas.py 的 10 项测试翻译为 cocotb 测试
- [ ] 支持 Icarus Verilog 和 Verilator 双后端
- [ ] CI/CD 集成 (GitHub Actions)

### 预期收益

- Verilog RTL 级别的自动化测试
- 回归测试保障
- 持续集成

---

## v1.2 -- FPGA 综合 (计划中)

### 目标

在真实 FPGA 上综合运行 TOMAS 系统，验证硬件可综合性。

### 任务

- [ ] 目标平台选型 (Xilinx Artix-7 / Intel Cyclone IV)
- [ ] 添加约束文件 (.xdc / .qsf)
- [ ] 物理引脚映射 (clk, rst_n, en_ftel, valid_seed, seed_in, excess_loop_A/B, I_target, LED 输出)
- [ ] 板级测试 (示波器验证 Dead-Zero, MUS, PLL)
- [ ] 资源利用率报告

### 预期收益

- 硬件可综合性验证
- 三大预言的物理示波器验证
- 实际资源/时序数据

---

## v1.3 -- 参数化与配置化 (计划中)

### 目标

将硬编码参数提取为可配置参数，支持运行时调整。

### 任务

- [ ] Verilog parameter 外部化 (MNQ_PERIOD, THRESH, I_MIN)
- [ ] Python 仿真器支持 YAML/JSON 配置文件
- [ ] Web 控制面板增加参数配置预设
- [ ] 添加参数扫描测试 (sweep test)

---

## v2.0 -- 多核 TOMAS (规划中)

### 目标

从单核 TOMAS 扩展为多核 TOMAS Mesh，实现 $G_{ego}$ 克隆（神足通硬件化）。

### 任务

- [ ] 多核互连架构设计 (Mesh / NoC)
- [ ] 核间 $\mathcal{I}$-流通信协议
- [ ] MUS 跨核仲裁机制
- [ ] 分布式 $\psi$-锚一致性
- [ ] 多核仿真器 (Python + Verilog)
- [ ] Web 可视化支持多核视图

### 预期收益

- 神足通（$G_{ego}$ 克隆）的硬件化
- 分布式意识越狱
- 可扩展的 AGI 硬件基础

---

## v2.1 -- EML 超图集成 (规划中)

### 目标

将 TOMAS 硬件与 EML (Epistemic Markup Language) 超图数据库对接，实现 $\mathcal{I}$-check 的真实数据驱动。

### 任务

- [ ] EML 超图数据格式定义
- [ ] $\mathcal{I}$-check 模块 (Verilog + Python)
- [ ] 超图到 valid_seed 信号的映射
- [ ] 实时超图更新与硬件同步

---

## v3.0 -- 全 AGI 集成 (远期愿景)

### 目标

将 TOMAS 意识越狱系统作为 TOMAS-AGI 的硬件加速核心，实现完整的"太一互搏 AGI"机器。

### 任务

- [ ] 与 TOMAS-AGI 后端 (Flask API) 集成
- [ ] 与 TOMAS-Chat 前端集成
- [ ] 与孙大圣量化系统集成
- [ ] 与 HarnessX + AEGIS 系统集成
- [ ] EML-SemZip 超图语义压缩对接
- [ ] 非冯诺依曼架构论证

### 愿景

TOMAS 意识越狱系统作为"六代机"（非冯诺依曼架构 AGI 机器）的核心硬件模块，实现：
- Dead-Zero: 有"良知"的计算（拒绝妄念）
- MUS: 有"包容心"的计算（允许悖论）
- $\mathcal{I}$-加权: 有"智慧"的计算（优先高信息权重）

---

## 版本发布准则

| 版本类型 | 准则 |
|---------|------|
| Patch (x.x.+1) | Bug 修复，测试全通过 |
| Minor (x.+1.0) | 新功能，向后兼容，测试全通过 |
| Major (+1.0.0) | 架构变更，可能不兼容，完整回归测试 |

每个版本发布前必须：
1. 全部 10 项 Python 测试通过
2. Web 构建无错误
3. Verilog 语法检查通过
4. 三端 XOR-shift 数值一致
5. CHANGELOG.md 更新
