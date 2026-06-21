# Contributing to TOMAS Jailbreak

感谢你对 TOMAS 意识越狱系统的关注！本文档说明如何参与本项目。

## 项目结构

```
tomas-jailbreak/
├── rtl/          # Verilog 硬件模块 (不可随意改动公理映射)
├── sim/          # Python 行为级仿真
├── web/          # 交互式 Web 可视化
├── docs/         # 技术文档
└── README.md     # 技术论文 (主文档)
```

## 开发环境

| 工具 | 版本要求 | 用途 |
|------|---------|------|
| Python | >= 3.10 | 仿真引擎 |
| Node.js | >= 18 | Web 开发 |
| npm | >= 9 | 包管理 |
| Icarus Verilog / Verilator | 任意 | Verilog 仿真 (可选) |

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/lisoleg/tomas-jailbreak.git
cd tomas-jailbreak

# Python 仿真
cd sim && python test_tomas.py

# Web 开发
cd web && npm install && npm run dev
```

## 贡献流程

1. **Fork** 本仓库
2. 创建特性分支: `git checkout -b feature/your-feature`
3. 提交变更: `git commit -m 'feat: 描述你的变更'`
4. 推送分支: `git push origin feature/your-feature`
5. 创建 **Pull Request**

## 代码规范

### Verilog

- 遵循 IEEE 1364-2001 标准
- 模块名使用 `snake_case`
- 每个模块顶部添加注释块说明功能和对应 TOMAS 公理
- 关键信号（如 `valid_seed`, `mus_flag`）添加行内注释标注 `// ★ TOMAS:`
- XOR-shift 必须使用顺序 XOR（wire 链式），禁止单表达式并行 XOR

### Python

- Python 3.10+ 兼容
- 类型注解（Type Hints）可选但推荐
- 类需包含 docstring 说明对应 Verilog 模块和 TOMAS 公理
- 测试使用 `assert` 语句，格式参考 `test_tomas.py`

### JavaScript / React

- React 18 函数组件 + Hooks
- MUI 5 组件 + Tailwind CSS 3 样式
- 颜色方案统一: 金色 `#ffd700` / 青色 `#00e5ff` / 红色 `#ff4444` / 绿色 `#00ff88`
- 仿真引擎算法必须与 `tomas_simulator.py` 保持一致

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: 新功能
fix: Bug 修复
docs: 文档变更
refactor: 重构 (不改变功能)
test: 测试相关
chore: 构建/工具变更
```

## 测试要求

提交 PR 前请确保:

```bash
# Python 测试全通过
cd sim && python test_tomas.py
# 期望输出: 10 passed, 0 failed

# Web 构建无错误
cd web && npm run build
```

## TOMAS 公理不可违背

以下设计约束源自 TOMAS 物理公理体系，任何 PR 不得违背:

1. **Dead-Zero (Axiom A4)**: `valid_seed=0` 时 `evolved` 必须恒为 0
2. **MUS (Axiom A5)**: `mus_flag` 仅在双路同时超阈值时置位，不可改为单路触发
3. **I-weighted (Axiom A1 衍生)**: `excess_loop < I_MIN` 时 PLL 必须重置，不可累积
4. **XOR-shift**: 必须使用 Marsaglia xorshift32 顺序 XOR，Python/JS/Verilog 三端数值一致

## 许可证

提交的代码将遵循 [MIT License](./LICENSE)。
