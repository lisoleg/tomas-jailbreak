#!/usr/bin/env python3
"""
TOMAS Simulator - Pure Python behavioral simulation of TOMAS hardware modules.
No cocotb dependency. Implements all four core modules plus top-level integration.

Modules:
  - FtelDriver:       Flow-quantized tick generator (Axiom A2: kappa-Snap)
  - TaiyiCoreTomas:   XOR-shift evolution with Dead-Zero (Axiom A1: psi-Anchor)
  - PGDetectTomas:    MUS dual-store arbitration (Axiom A3: MUS)
  - FreqBodyIFTomas:  I-weighted resonance PLL (Axiom A4: I-resonance)
  - TOMASSimulator:    Top-level integration simulator
"""

import json
import sys


class FtelDriver:
    """Flow-quantized tick generator simulation."""

    def __init__(self, mnq_period=10):
        self.mnq_period = mnq_period
        self.counter = 0
        self.mnq_tick = 0

    def tick(self, en):
        """Execute one clock cycle. Returns mnq_tick (0 or 1)."""
        if not en:
            # Dead-Zero: freeze and suppress
            self.counter = 0
            self.mnq_tick = 0
            return 0
        if self.counter >= self.mnq_period - 1:
            self.counter = 0
            self.mnq_tick = 1
        else:
            self.counter += 1
            self.mnq_tick = 0
        return self.mnq_tick

    def reset(self):
        self.counter = 0
        self.mnq_tick = 0


class TaiyiCoreTomas:
    """Taiyi Core - XOR-shift evolution with Dead-Zero cutoff."""

    def __init__(self, seed=0xDEADBEEF):
        self.mask32 = 0xFFFFFFFF
        self.state = seed & self.mask32

    def evolve(self, valid_seed):
        """Execute one evolution step. Returns evolved value (0 if Dead-Zero)."""
        s = self.state
        s ^= (s << 13) & self.mask32
        s ^= (s >> 7)
        s ^= (s << 17) & self.mask32
        self.state = s & self.mask32
        # Dead-Zero: suppress output when valid_seed=0
        return self.state if valid_seed else 0

    def reset(self, seed=0xDEADBEEF):
        self.state = seed & self.mask32


class PGDetectTomas:
    """PG Detector - MUS dual-store arbitration."""

    def __init__(self, thresh=100):
        self.thresh = thresh

    def detect(self, excess_loop_A, excess_loop_B):
        """Returns mus_flag (1 if both stores saturated, 0 otherwise)."""
        return 1 if (excess_loop_A >= self.thresh and excess_loop_B >= self.thresh) else 0


class FreqBodyIFTomas:
    """Frequency Body Interface - I-weighted resonance PLL."""

    def __init__(self, i_min=50):
        self.i_min = i_min
        self.counter = 0
        self.pll_locked = 0
        self.dac_trigger = 0

    def tick(self, excess_loop, i_target):
        """Execute one clock cycle. Returns (pll_locked, dac_trigger)."""
        if excess_loop >= self.i_min:
            if self.counter >= 255:
                self.pll_locked = 1
                self.dac_trigger = 1
            else:
                self.counter += 1
                # Not yet locked
                self.pll_locked = 0
                self.dac_trigger = 0
        else:
            # Low-I: reset
            self.counter = 0
            self.pll_locked = 0
            self.dac_trigger = 0
        return self.pll_locked, self.dac_trigger

    def reset(self):
        self.counter = 0
        self.pll_locked = 0
        self.dac_trigger = 0


class TOMASSimulator:
    """Complete TOMAS top-level simulator integrating all modules."""

    def __init__(self):
        self.ftel = FtelDriver()
        self.core = TaiyiCoreTomas()
        self.pg = PGDetectTomas()
        self.freq = FreqBodyIFTomas()
        self.history = []

    def run(self, cycles, en_ftel=1, valid_seed=1,
            excess_loop_A=0, excess_loop_B=0, i_target=0, seed=0xDEADBEEF):
        """Run simulation for given cycles. Returns history list."""
        # Reset modules
        self.ftel.reset()
        self.core.reset(seed)
        self.freq.reset()
        self.history = []

        for t in range(cycles):
            mnq_tick = self.ftel.tick(en_ftel)
            # Core evolves only on mnq_tick edges
            if mnq_tick:
                evolved = self.core.evolve(valid_seed)
            else:
                # Hold state between ticks
                evolved = self.core.state if valid_seed else 0
            mus = self.pg.detect(excess_loop_A, excess_loop_B)
            pll, dac = self.freq.tick(excess_loop_A, i_target)
            self.history.append({
                't': t,
                'mnq_tick': mnq_tick,
                'evolved': evolved,
                'mus_flag': mus,
                'pll_locked': pll,
                'dac_trigger': dac
            })
        return self.history

    def export_json(self, filepath):
        """Export simulation history to JSON file."""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.history, f, indent=2)
        print(f"[TOMAS] History exported to {filepath} ({len(self.history)} records)")


# =============================================================================
# Main entry point: run a demo simulation and export results
# =============================================================================
if __name__ == '__main__':
    sim = TOMASSimulator()

    print("=" * 70)
    print("TOMAS Simulator - Behavioral Simulation")
    print("=" * 70)

    # --- Scenario 1: Normal operation ---
    print("\n[Scenario 1] Normal operation (en_ftel=1, valid_seed=1)")
    hist = sim.run(100, en_ftel=1, valid_seed=1, seed=0xDEADBEEF,
                   excess_loop_A=120, excess_loop_B=110, i_target=90)
    mnq_count = sum(h['mnq_tick'] for h in hist)
    mus_count = sum(h['mus_flag'] for h in hist)
    pll_count = sum(h['pll_locked'] for h in hist)
    print(f"  Cycles: {len(hist)}")
    print(f"  MNQ ticks: {mnq_count}")
    print(f"  MUS flags: {mus_count}")
    print(f"  PLL locks: {pll_count}")
    print(f"  Final evolved: 0x{hist[-1]['evolved']:08X}")
    sim.export_json('tomas_sim_output.json')

    # --- Scenario 2: Dead-Zero (valid_seed=0) ---
    print("\n[Scenario 2] Dead-Zero (valid_seed=0)")
    hist2 = sim.run(100, en_ftel=1, valid_seed=0, seed=0xDEADBEEF)
    dead_zero_ok = all(h['evolved'] == 0 for h in hist2)
    print(f"  All evolved=0: {dead_zero_ok}")

    # --- Scenario 3: MUS trigger ---
    print("\n[Scenario 3] MUS dual-store (A=100, B=100)")
    pg = PGDetectTomas()
    mus_result = pg.detect(100, 100)
    print(f"  MUS flag: {mus_result}")

    # --- Scenario 4: I-weighted resonance ---
    print("\n[Scenario 4] I-weighted resonance (high-I=80, low-I=30)")
    freq_high = FreqBodyIFTomas(i_min=50)
    for _ in range(300):
        pll, dac = freq_high.tick(80, 90)
    print(f"  High-I PLL locked: {freq_high.pll_locked}")

    freq_low = FreqBodyIFTomas(i_min=50)
    for _ in range(300):
        pll, dac = freq_low.tick(30, 5)
    print(f"  Low-I PLL locked: {freq_low.pll_locked}")

    print("\n" + "=" * 70)
    print("Simulation complete.")
    print("=" * 70)
