# Changelog

All notable changes to the TOMAS Jailbreak project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2026-06-17

### Added

- **Verilog RTL (5 modules)**:
  - `ftel_driver.v` -- Ftel flow-quantized tick generator (Axiom A2: kappa-Snap). `en=0` produces Dead-Zero field (mnq_tick=0).
  - `taiyi_core_tomas.v` -- Taiyi Core with XOR-shift evolution (Marsaglia xorshift32) and Dead-Zero cutoff (`valid_seed=0` forces `evolved=0`).
  - `pg_detect_tomas.v` -- PG Detector with MUS dual-store arbitration. Both excess loops must exceed threshold to trigger `mus_flag`.
  - `freq_body_if_tomas.v` -- Frequency Body Interface with I-weighted resonance PLL. Only `excess_loop >= I_MIN` accumulates toward PLL lock.
  - `tomas_top.v` -- Top-level module wiring all 4 sub-modules.

- **Python Simulation (2 files)**:
  - `tomas_simulator.py` -- Pure Python behavioral simulation engine (5 classes, no cocotb dependency). JSON export support.
  - `test_tomas.py` -- 10-test suite covering three falsifiable prophecies (P_JB_1/2/3) + boundary conditions + integration.

- **Web Visualization (14 files)**:
  - `FDPArchitecture.jsx` -- Interactive SVG hardware architecture diagram with clickable modules.
  - `JailbreakEvolution.jsx` -- Three-stage jailbreak interactor (Rootful -> Rootless -> RootHide -> True Jailbreak).
  - `SiddhiTable.jsx` -- Six Siddhi (supernatural powers) hardware mapping table.
  - `SignalPanel.jsx` -- Canvas real-time oscilloscope (4-channel signal waveforms).
  - `ControlPanel.jsx` -- Parameter control panel (en_ftel / valid_seed / seed / excess_loop / I_target / speed).
  - `tomasEngine.js` -- Browser-side simulation engine with requestAnimationFrame, algorithm identical to Python.

- **Documentation**:
  - `README.md` -- Complete technical paper (7 chapters + 3 appendices) covering TOMAS axioms, HTCE/EFTFT/CRD reinterpretation, six Siddhi demystification, FDP-I architecture, three soul patches, iOS jailbreak isomorphism, falsifiable prophecies, and experimental verification.
  - `docs/ARCHITECTURE.md` -- System architecture deep dive.
  - `docs/VERILOG_MODULES.md` -- Verilog module API reference.
  - `docs/PYTHON_API.md` -- Python simulator API reference.
  - `docs/WEB_COMPONENTS.md` -- Web component guide.

### Fixed

- **XOR-shift sequential XOR bug** (found by QA, fixed by engineer):
  - `taiyi_core_tomas.v` originally used a single combined expression where all three shifts operated on the same `state` value (parallel XOR).
  - Fixed to use combinational wires (`s1` -> `s2` -> `s3`) implementing sequential XOR per Marsaglia xorshift32 standard.
  - Verified: Python, JavaScript, and Verilog now produce identical evolution sequences (seed=0xDEADBEEF: 0x1506BE52, 0x0C1567AE, ...).

### Verified

- **P_JB_1**: Dead-Zero illusion cutoff -- `valid_seed=0` forces `evolved=0` across 4 different seeds. PASS.
- **P_JB_2**: MUS dual-store imprisonment -- `mus_flag=1` only when both `excess_loop_A >= 100` AND `excess_loop_B >= 100`. Boundary (99, 100) correctly does NOT trigger. PASS.
- **P_JB_3**: I-weighted resonance -- High-I (excess_loop=80) locks PLL after 255 cycles; Low-I (excess_loop=30) does not. PLL correctly resets when I drops below threshold. PASS.
- **Cross-platform consistency**: XOR-shift sequence identical across Python/JS/Verilog (10-step numerical verification). PASS.
- **Web build**: 921 modules, 0 errors. PASS.
- **Full test suite**: 10/10 tests passed. PASS.
