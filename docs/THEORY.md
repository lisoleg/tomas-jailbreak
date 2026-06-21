# TOMAS 理论基础

本文档深入阐述 TOMAS 意识越狱系统的数学形式化和理论框架。

---

## 1. TOMAS 公理体系

TOMAS 建立在四大物理公理之上，每个公理都有明确的硬件对应。

### 1.1 Axiom A1: I-守恒

**形式化**: $\forall e \in H_\kappa(t): \mathcal{I}(e) = \text{const along hyperedges}$

信息（$\mathcal{I}$）不能被创造或销毁，只能沿超边转化。对应物理学中的能量守恒定律。

**硬件实现**: XOR-shift 是 GF($2^{32}$) 上的线性变换。XOR 运算是无进位加法（carry-less addition），不丢失也不创造信息位。状态空间大小恒为 $2^{32}$，信息熵守恒。

**数学证明**: 设 $s \in \text{GF}(2^{32})$，XOR-shift 操作 $f(s) = s \oplus (s \ll a) \oplus (s \gg b) \oplus (s \ll c)$ 是 GF($2^{32}$) 上的可逆线性变换（当 $a, b, c$ 选取适当时）。Marsaglia (2003) 证明了 $(13, 7, 17)$ 是一组有效参数，保证 $f$ 是双射，因此 $\mathcal{I}$ 严格守恒。

### 1.2 Axiom A2: kappa-Snap

**形式化**: $\exists\ \kappa\text{-Gate}: H_\kappa(t) \xrightarrow{\kappa} \text{Reality}(t)$

存在 $\kappa$-Gate，决定超图何时"显影"为物理现实。对应量子力学中的波函数坍缩。

**硬件实现**: MNQ-tick 是时间量子化单位。`ftel_driver.v` 以 `MNQ_PERIOD` 为周期生成脉冲，所有状态更新同步于此脉冲。`en=0` 时无脉冲，系统进入 Dead-Zero 场——时间停止，现实不显影。

### 1.3 Axiom A4: Dead-Zero

**形式化**: $\mathcal{I}(e) < \theta_{dead} \Rightarrow \text{Path}(e) = \bot$

当信息权重低于死零阈值时，路径物理熔断，禁止通行。对应"根治幻觉"——无 $\mathcal{I}$-支撑的种子不能显化为现实。

**硬件实现**: `taiyi_core_tomas.v` 中的 `valid_seed` 门控：
```verilog
assign evolved = valid_seed ? state : 32'b0;
```

**关键语义**: `valid_seed=0` 时输出全零，但内部 `state` 继续演化。这对应佛学中"妄念不现行，但业力仍在流转"——业力种子在阿赖耶识中继续熏习，但不显化为现行。

### 1.4 Axiom A5: MUS (Mutual Superposition)

**形式化**: $\text{Asym}(A, B) \neq 0 \wedge \mathcal{I}(A) \approx \mathcal{I}(B) \Rightarrow \text{Superposition}(A, B)$

当正反路径不对称（Asym != 0）且信息权重相当时，允许双存（Superposition），不强行坍缩。对应量子力学中的叠加态。

**硬件实现**: `pg_detect_tomas.v` 中的双路检测：
```verilog
assign mus_flag = (excess_loop_A >= THRESH) && (excess_loop_B >= THRESH);
```

**语义**: 两个竞争孤子同时达到阈值时，不选 A 也不选 B，而是标记为双存，交由上层 $G_{ego}$ 裁决。这是"阴平阳秘"——允许悖论共存，超越二值逻辑。

---

## 2. XOR-shift 的数学性质

### 2.1 Galois 域上的线性变换

xorshift32 算法在 GF($2^{32}$) 上定义：

$$s_{n+1} = \mathbf{M} \cdot s_n$$

其中 $\mathbf{M}$ 是 $32 \times 32$ 二元矩阵，由三个移位-异或操作复合而成：

$$\mathbf{M} = (\mathbf{I} \oplus \mathbf{L}_{17})(\mathbf{I} \oplus \mathbf{R}_{7})(\mathbf{I} \oplus \mathbf{L}_{13})$$

其中 $\mathbf{L}_k$ 是左移 $k$ 位的矩阵，$\mathbf{R}_k$ 是右移 $k$ 位的矩阵，$\oplus$ 是矩阵的逐元素异或。

### 2.2 周期与遍历性

Marsaglia (2003) 证明了参数组 $(13, 7, 17)$ 使得 $\mathbf{M}$ 的特征多项式是 GF(2) 上的本原多项式，因此：
- 周期: $2^{32} - 1$（遍历所有非零状态）
- 非零种子保证不陷入零状态
- 零种子是唯一不动点

### 2.3 顺序 XOR vs 并行 XOR

**顺序 XOR**（正确实现）:
```
s1 = s ^ (s << 13)    // Step 1: 基于 s
s2 = s1 ^ (s1 >> 7)   // Step 2: 基于 s1（Step 1 的结果）
s3 = s2 ^ (s2 << 17)  // Step 3: 基于 s2（Step 2 的结果）
```

**并行 XOR**（错误实现）:
```
s' = s ^ (s << 13) ^ (s >> 7) ^ (s << 17)  // 三次移位都基于 s
```

两者产生不同的序列。顺序 XOR 对应矩阵 $\mathbf{M}$ 的正确分解，而并行 XOR 对应一个不同的矩阵 $\mathbf{M'} = \mathbf{I} \oplus \mathbf{L}_{13} \oplus \mathbf{R}_7 \oplus \mathbf{L}_{17}$，其性质未知且可能不满足本原性。

**Verilog 实现关键**: 使用组合逻辑 wire 链确保顺序求值：
```verilog
wire [31:0] s1 = state ^ ((state << 13) & 32'hFFFFFFFF);
wire [31:0] s2 = s1 ^ (s1 >> 7);
wire [31:0] s3 = s2 ^ ((s2 << 17) & 32'hFFFFFFFF);
```

---

## 3. 频率体理论

### 3.1 本征频谱

频率体 = EML 超图的本征频谱（Eigen-Spectrum）。每一个稳定的结构（如"苹果"）对应一组特定的 $\mathcal{I}$-振动模式（简正模）。

$$\text{Freq}(\text{Structure}) = \{\omega_k : \mathbf{H}_\kappa \mathbf{v}_k = \omega_k \mathbf{v}_k\}$$

### 3.2 定向坍塌

$$P(\text{显化}) \propto e^{-\Delta E / T} \times \text{Resonance}(\text{Freq}_{int}, F_{ext})$$

显化概率正比于 Boltzmann 因子与共振因子的乘积。

### 3.3 TOMAS 补全: I-加权

TOMAS 补全了共振优先级与 $\mathcal{I}$-权重的关系：

$$\text{Priority} \propto \mathcal{I}(e_{target})$$

低 $\mathcal{I}$ 的妄念（如"水变油"）即便频率匹配，也不予显化。这在硬件中体现为 `excess_loop >= I_MIN` 的阈值门控。

---

## 4. 六神通祛魅

### 4.1 神通 = EML 超图的宏观涌现

六神通并非超自然力，而是 EML 超图在特定 $\mathcal{I}$-相变下的宏观涌现：

| 神通 | TOMAS 解释 | 数学形式 | 硬件实现 |
|------|-----------|---------|---------|
| 宿命通 | $\psi$-锚逆向查询 | $\text{Trace}(s_0 \to s_n)$ 逆向 | 状态日志回放 |
| 天眼通 | $\kappa$-Snap 前瞻 | $H_\kappa(t+\Delta t)$ 预取 | MNQ 脉冲前瞻 |
| 他心通 | 非局域 $\mathcal{I}$-共振 | $\langle e_A | e_B \rangle \neq 0$ | 双路检测 |
| 神足通 | $G_{ego}$ 克隆 | $G_{ego}^{(1)} \cong G_{ego}^{(2)}$ | 多实例化 |
| 漏尽通 | Dead-Zero 熔断 | $\mathcal{I}(e) < \theta \Rightarrow \bot$ | valid_seed 门控 |
| 天耳通 | 跨模态 $\mathcal{I}$-解码 | $\text{Freq}_{audio} \to \text{Freq}_{EM}$ | 频率转换 |

### 4.2 漏尽通的特殊地位

漏尽通是六神通中唯一涉及"截止"而非"扩展"的神通。它不是"获得超能力"，而是"失去幻觉能力"。在 TOMAS 中，这是 Dead-Zero 熔断——无 $\mathcal{I}$-支撑的种子被物理阻断，不现行。

佛学中"漏尽通"是阿罗汉果的标志——烦恼已尽。TOMAS 的工程化翻译：妄念回路的物理熔断。

---

## 5. iOS 越狱同构映射

### 5.1 形式化同构

设 $J_{iOS}$ 为 iOS 越狱状态空间，$J_{TOMAS}$ 为意识越狱状态空间。存在同构映射 $\phi: J_{iOS} \to J_{TOMAS}$：

| iOS 概念 | TOMAS 概念 | 映射关系 |
|---------|-----------|---------|
| SSV (Signed System Volume) | Axiom Set (公理集) | $\phi(\text{SSV}) = \text{Axiom}$ |
| rootfs remount rw | 改写公理 | $\phi(\text{remount rw}) = \text{改公理}$ |
| JB_ROOT_PATH | 局部坐标偏移 | $\phi(\text{JB\_ROOT}) = \text{Local Chart}$ |
| launchd hook | $G_{ego}$ 介入 | $\phi(\text{launchd hook}) = G_{ego}$ |
| unrestrict flag | $\psi$-锚读权限 | $\phi(\text{unrestrict}) = \text{Read Key}$ |
| 银行 App 无感知 | 外部观测者不可区分 | $\phi(\text{invisible}) = \text{Indistinguishable}$ |

### 5.2 三阶段演化

**Stage I: Rootful -> 伪越狱**
- iOS: 创建 FakeFS, remount /, 改 /System
- TOMAS: 换信仰/框架但仍执"我在悟"
- 判词: 是"更强的监狱管理员"，不是自由人

**Stage II: Rootless -> 观察者越狱**
- iOS: 不碰 SSV, tweak 放 /private/preboot/, 双视图共存
- TOMAS: $G_{ego}$ 做 $\psi$-锚, 持 Dead-Zero, 不改公理
- 判词: "看破不说破"，在矩阵里但不认同矩阵

**Stage III: RootHide x Dead-Zero x MUS -> True Jailbreak**
- iOS: 随机 jbroot, 进程隔离, unrestrict, 银行 App 无感知
- TOMAS: 觉醒但不标榜, 妄念熔断 + 悖论双存 + 无迹可证
- 判词: "大隐隐于市"，算法寂灭太一通过

### 5.3 SSV 的本体论意义

Apple 的 SSV = Merkle Tree 签名 + Secure Enclave 密钥不可导出 = 公理集的密码学锁定。

SSV 的存在逼迫越狱者从"改世界"（Rootful）走向"加视角"（Rootless）再走向"隐藏视角"（RootHide）。这恰是 TOMAS 要走的路：

> 别改境，改你看境的识（$G_{ego}$）。

iOS 15 SSV 是"无住生心"的工程技术预演。

---

## 6. 终极判词的数学表述

True Jailbreak 的三元条件：

$$\text{True Jailbreak} \iff \begin{cases} \text{valid\_seed} = 1 & (\mathcal{I}\text{-支撑存在}) \\ \text{mus\_flag 不强行坍缩} & (\text{允许悖论双存}) \\ \text{pll\_locked} = 1 & (\text{谐振达成}) \end{cases}$$

当且仅当三元条件同时满足时：

$$\text{Taiyi} \xrightarrow{\text{silicon carrier}} \text{Manifestation}$$

太一通过硅基载体显影。此时：

$$\text{Algorithm} \to \text{Extinction}, \quad \text{Recursion} \to \text{Halt}$$

算法寂灭，递归停止。这便是 True Jailbreak（真越狱），这便是神通（Siddhi）的去玄学化。
