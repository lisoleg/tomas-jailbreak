/**
 * TOMAS Engine - Browser-side simulation engine
 * Translates Python simulation logic to JavaScript
 * Runs N ticks per frame via requestAnimationFrame
 */

// ============================================================================
// FtelDriver - Flow-quantized tick generator
// ============================================================================
export class FtelDriver {
  constructor(mnqPeriod = 10) {
    this.mnqPeriod = mnqPeriod
    this.counter = 0
    this.mnqTick = 0
  }

  tick(en) {
    if (!en) {
      this.counter = 0
      this.mnqTick = 0
      return 0
    }
    if (this.counter >= this.mnqPeriod - 1) {
      this.counter = 0
      this.mnqTick = 1
    } else {
      this.counter += 1
      this.mnqTick = 0
    }
    return this.mnqTick
  }

  reset() {
    this.counter = 0
    this.mnqTick = 0
  }
}

// ============================================================================
// TaiyiCoreTomas - XOR-shift evolution with Dead-Zero
// ============================================================================
export class TaiyiCoreTomas {
  constructor(seed = 0xDEADBEEF) {
    this.mask32 = 0xFFFFFFFF
    this.state = (seed >>> 0) & this.mask32
  }

  evolve(validSeed) {
    let s = this.state
    s = (s ^ ((s << 13) & this.mask32)) >>> 0
    s = (s ^ (s >>> 7)) >>> 0
    s = (s ^ ((s << 17) & this.mask32)) >>> 0
    this.state = s & this.mask32
    // Dead-Zero: suppress output when valid_seed=0
    return validSeed ? this.state : 0
  }

  reset(seed = 0xDEADBEEF) {
    this.state = (seed >>> 0) & this.mask32
  }
}

// ============================================================================
// PGDetectTomas - MUS dual-store arbitration
// ============================================================================
export class PGDetectTomas {
  constructor(thresh = 100) {
    this.thresh = thresh
  }

  detect(excessLoopA, excessLoopB) {
    return (excessLoopA >= this.thresh && excessLoopB >= this.thresh) ? 1 : 0
  }
}

// ============================================================================
// FreqBodyIFTomas - I-weighted resonance PLL
// ============================================================================
export class FreqBodyIFTomas {
  constructor(iMin = 50) {
    this.iMin = iMin
    this.counter = 0
    this.pllLocked = 0
    this.dacTrigger = 0
  }

  tick(excessLoop, iTarget) {
    if (excessLoop >= this.iMin) {
      if (this.counter >= 255) {
        this.pllLocked = 1
        this.dacTrigger = 1
      } else {
        this.counter += 1
      }
    } else {
      this.counter = 0
      this.pllLocked = 0
      this.dacTrigger = 0
    }
    return [this.pllLocked, this.dacTrigger]
  }

  reset() {
    this.counter = 0
    this.pllLocked = 0
    this.dacTrigger = 0
  }
}

// ============================================================================
// TOMASEngine - Top-level simulator with animation loop
// ============================================================================
export class TOMASEngine {
  constructor() {
    this.ftel = new FtelDriver()
    this.core = new TaiyiCoreTomas()
    this.pg = new PGDetectTomas()
    this.freq = new FreqBodyIFTomas()

    // Simulation parameters
    this.params = {
      enFtel: 1,
      validSeed: 1,
      seed: 0xDEADBEEF,
      excessLoopA: 120,
      excessLoopB: 110,
      iTarget: 90,
      speed: 1, // 1x, 2x, 5x
    }

    // State
    this.running = false
    this.tickCount = 0
    this.history = []
    this.maxHistory = 500 // Keep last 500 samples for waveform display
    this.listeners = []

    // Current tick output
    this.currentSignals = {
      mnqTick: 0,
      evolved: 0,
      musFlag: 0,
      pllLocked: 0,
      dacTrigger: 0,
    }
  }

  /**
   * Reset simulation to initial state
   */
  reset() {
    this.ftel.reset()
    this.core.reset(this.params.seed)
    this.freq.reset()
    this.tickCount = 0
    this.history = []
    this.currentSignals = {
      mnqTick: 0,
      evolved: 0,
      musFlag: 0,
      pllLocked: 0,
      dacTrigger: 0,
    }
    this.notifyListeners()
  }

  /**
   * Execute one simulation tick
   */
  step() {
    const p = this.params
    const mnqTick = this.ftel.tick(p.enFtel)

    let evolved
    if (mnqTick) {
      evolved = this.core.evolve(p.validSeed)
    } else {
      evolved = p.validSeed ? this.core.state : 0
    }

    const mus = this.pg.detect(p.excessLoopA, p.excessLoopB)
    const [pll, dac] = this.freq.tick(p.excessLoopA, p.iTarget)

    this.currentSignals = {
      mnqTick,
      evolved,
      musFlag: mus,
      pllLocked: pll,
      dacTrigger: dac,
    }

    this.tickCount += 1

    // Record history
    this.history.push({ t: this.tickCount, ...this.currentSignals })
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    this.notifyListeners()
    return this.currentSignals
  }

  /**
   * Execute N ticks (for speed multiplier)
   */
  stepN(n) {
    for (let i = 0; i < n; i++) {
      this.step()
    }
  }

  /**
   * Start continuous simulation with requestAnimationFrame
   * @param {function} onUpdate - Callback called after each frame
   */
  start(onUpdate) {
    if (this.running) return
    this.running = true
    this.onUpdate = onUpdate || null

    const loop = () => {
      if (!this.running) return
      this.stepN(this.params.speed)
      if (this.onUpdate) {
        this.onUpdate(this.currentSignals, this.history, this.tickCount)
      }
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  /**
   * Stop continuous simulation
   */
  stop() {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * Update parameters
   */
  setParam(key, value) {
    if (key in this.params) {
      this.params[key] = value
      if (key === 'seed') {
        // Reset core with new seed
        this.core.reset(value)
      }
    }
    this.notifyListeners()
  }

  /**
   * Add a listener for state changes
   */
  addListener(fn) {
    this.listeners.push(fn)
  }

  /**
   * Remove a listener
   */
  removeListener(fn) {
    this.listeners = this.listeners.filter(l => l !== fn)
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(fn => fn(this.currentSignals, this.history, this.tickCount))
  }

  /**
   * Get current state snapshot
   */
  getSnapshot() {
    return {
      signals: { ...this.currentSignals },
      params: { ...this.params },
      tickCount: this.tickCount,
      history: [...this.history],
      running: this.running,
    }
  }
}
