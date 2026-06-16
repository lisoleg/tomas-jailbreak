#!/usr/bin/env python3
"""
TOMAS Test Suite - Three falsifiable prophecy tests.

P_JB_1: Dead-Zero illusion cutoff (valid_seed=0 => evolved=0)
P_JB_2: MUS dual-store topology imprisonment (both stores must saturate)
P_JB_3: I-weighted frequency resonance (high-I locks PLL, low-I does not)
"""

import sys
import os

# Add parent directory to path for import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tomas_simulator import (
    TOMASSimulator,
    TaiyiCoreTomas,
    PGDetectTomas,
    FreqBodyIFTomas,
    FtelDriver,
)


# =============================================================================
# P_JB_1: Dead-Zero - Illusion Cutoff
# When valid_seed=0, evolved output must be 0 regardless of internal state.
# =============================================================================
def test_dead_zero():
    """P_JB_1: Dead-Zero melts illusion - valid_seed=0 forces evolved=0."""
    sim = TOMASSimulator()
    sim.run(100, en_ftel=1, valid_seed=0, seed=0xDEADBEEF)
    assert all(h['evolved'] == 0 for h in sim.history), \
        "P_JB_1 FAILED: Dead-Zero did not suppress evolved output"
    print("[PASS] P_JB_1: Dead-Zero illusion cutoff verified")


def test_dead_zero_partial():
    """Dead-Zero activates mid-stream: valid_seed drops to 0 at t=50."""
    sim = TOMASSimulator()
    # First 50 cycles with valid_seed=1
    sim.run(50, en_ftel=1, valid_seed=1, seed=0xDEADBEEF)
    # Next 50 cycles with valid_seed=0
    hist2 = sim.run(50, en_ftel=1, valid_seed=0, seed=0xDEADBEEF)
    assert all(h['evolved'] == 0 for h in hist2), \
        "P_JB_1 FAILED: Dead-Zero did not activate when valid_seed dropped"
    print("[PASS] P_JB_1b: Dead-Zero mid-stream activation verified")


# =============================================================================
# P_JB_2: MUS - Dual-Store Topology Imprisonment
# Both excess loops must exceed threshold; single-store saturation is insufficient.
# =============================================================================
def test_mus():
    """P_JB_2: MUS requires both stores to saturate."""
    pg = PGDetectTomas()
    # Both above threshold
    assert pg.detect(100, 100) == 1, "P_JB_2 FAILED: MUS should trigger at (100,100)"
    # Only A above
    assert pg.detect(100, 50) == 0, "P_JB_2 FAILED: MUS false positive at (100,50)"
    # Only B above
    assert pg.detect(50, 100) == 0, "P_JB_2 FAILED: MUS false positive at (50,100)"
    # Both below
    assert pg.detect(50, 50) == 0, "P_JB_2 FAILED: MUS false positive at (50,50)"
    print("[PASS] P_JB_2: MUS dual-store imprisonment verified")


def test_mus_boundary():
    """P_JB_2b: MUS boundary - exactly at threshold."""
    pg = PGDetectTomas(thresh=100)
    assert pg.detect(100, 100) == 1, "P_JB_2 FAILED: boundary (100,100) should trigger"
    assert pg.detect(99, 100) == 0, "P_JB_2 FAILED: boundary (99,100) should NOT trigger"
    print("[PASS] P_JB_2b: MUS boundary condition verified")


# =============================================================================
# P_JB_3: I-Weighted Frequency Resonance
# High-I signals lock PLL; low-I signals do not.
# =============================================================================
def test_i_weighted_resonance():
    """P_JB_3: High-I locks PLL, low-I does not."""
    # High-I signal: excess_loop=80 >= I_MIN=50
    freq_high = FreqBodyIFTomas(i_min=50)
    for _ in range(300):
        pll, dac = freq_high.tick(80, 90)
    assert freq_high.pll_locked == 1, \
        "P_JB_3 FAILED: High-I should trigger PLL lock"
    assert freq_high.dac_trigger == 1, \
        "P_JB_3 FAILED: High-I should trigger DAC"

    # Low-I signal: excess_loop=30 < I_MIN=50
    freq_low = FreqBodyIFTomas(i_min=50)
    for _ in range(300):
        pll, dac = freq_low.tick(30, 5)
    assert freq_low.pll_locked == 0, \
        "P_JB_3 FAILED: Low-I should NOT trigger PLL lock"
    assert freq_low.dac_trigger == 0, \
        "P_JB_3 FAILED: Low-I should NOT trigger DAC"
    print("[PASS] P_JB_3: I-weighted resonance verified")


def test_i_weighted_reset():
    """P_JB_3b: PLL resets when I drops below threshold."""
    freq = FreqBodyIFTomas(i_min=50)
    # Lock PLL with high-I
    for _ in range(300):
        freq.tick(80, 90)
    assert freq.pll_locked == 1, "Setup failed: PLL should be locked"
    # Drop I below threshold
    for _ in range(10):
        freq.tick(30, 5)
    assert freq.pll_locked == 0, \
        "P_JB_3b FAILED: PLL should reset when I drops"
    print("[PASS] P_JB_3b: I-weighted PLL reset verified")


# =============================================================================
# Additional tests
# =============================================================================
def test_ftel_dead_zero():
    """FtelDriver: en=0 produces no ticks (Dead-Zero field)."""
    driver = FtelDriver(mnq_period=10)
    ticks = [driver.tick(0) for _ in range(100)]
    assert all(t == 0 for t in ticks), "FtelDriver should produce no ticks when en=0"
    print("[PASS] Ftel Dead-Zero: en=0 suppresses all ticks")


def test_ftel_period():
    """FtelDriver: en=1 produces periodic ticks at MNQ_PERIOD."""
    driver = FtelDriver(mnq_period=10)
    ticks = [driver.tick(1) for _ in range(30)]
    tick_positions = [i for i, t in enumerate(ticks) if t == 1]
    # Ticks should occur at positions 9, 19, 29 (0-indexed, period=10)
    assert tick_positions == [9, 19, 29], \
        f"FtelDriver period wrong: got {tick_positions}, expected [9, 19, 29]"
    print("[PASS] Ftel period: MNQ ticks at correct intervals")


def test_core_evolution_deterministic():
    """TaiyiCore: same seed produces same evolution sequence."""
    core1 = TaiyiCoreTomas(seed=0x12345678)
    core2 = TaiyiCoreTomas(seed=0x12345678)
    seq1 = [core1.evolve(1) for _ in range(20)]
    seq2 = [core2.evolve(1) for _ in range(20)]
    assert seq1 == seq2, "TaiyiCore evolution should be deterministic for same seed"
    print("[PASS] TaiyiCore: deterministic evolution for same seed")


def test_full_integration():
    """Full integration: all modules work together in TOMASSimulator."""
    sim = TOMASSimulator()
    hist = sim.run(300, en_ftel=1, valid_seed=1, seed=0xCAFEF00D,
                  excess_loop_A=150, excess_loop_B=150, i_target=100)
    assert len(hist) == 300, "Should have 300 history records"
    # With high excess loops, MUS should fire
    assert any(h['mus_flag'] == 1 for h in hist), "MUS should fire with high excess loops"
    # With high excess loops, PLL should eventually lock
    assert any(h['pll_locked'] == 1 for h in hist), "PLL should lock with high-I signal"
    print("[PASS] Full integration: all modules coordinated correctly")


# =============================================================================
# Test runner
# =============================================================================
if __name__ == '__main__':
    tests = [
        test_ftel_dead_zero,
        test_ftel_period,
        test_dead_zero,
        test_dead_zero_partial,
        test_core_evolution_deterministic,
        test_mus,
        test_mus_boundary,
        test_i_weighted_resonance,
        test_i_weighted_reset,
        test_full_integration,
    ]

    passed = 0
    failed = 0
    print("=" * 70)
    print("TOMAS Test Suite - Three Falsifiable Prophecies + Integration")
    print("=" * 70)

    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"[FAIL] {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"[ERROR] {test.__name__}: {e}")
            failed += 1

    print("\n" + "=" * 70)
    print(f"Results: {passed} passed, {failed} failed, {len(tests)} total")
    print("=" * 70)

    sys.exit(0 if failed == 0 else 1)
