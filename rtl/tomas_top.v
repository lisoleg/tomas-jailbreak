// =============================================================================
// tomas_top.v
// TOMAS Top-Level Module - instantiates and wires all sub-modules
// Signal flow: ftel_driver -> taiyi_core -> pg_detect -> freq_body_if
// =============================================================================
module tomas_top (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        en_ftel,        // Ftel flow enable
    input  wire        valid_seed,     // Dead-Zero control
    input  wire [31:0] seed_in,        // psi-Anchor seed
    input  wire [7:0]  excess_loop_A,  // Store A excess loop
    input  wire [7:0]  excess_loop_B,  // Store B excess loop
    input  wire [7:0]  I_target,       // I-weighted target
    output wire        mnq_tick,       // Time-quantized pulse
    output wire [31:0] evolved_out,    // Evolved state
    output wire        mus_flag,       // MUS dual-store flag
    output wire        pll_locked,     // PLL lock status
    output wire        dac_trigger     // DAC trigger
);

    // -------------------------------------------------------------------------
    // Internal wires
    // -------------------------------------------------------------------------
    wire        mnq_tick_w;
    wire [31:0] evolved_w;
    wire        mus_flag_w;
    wire        pll_locked_w;
    wire        dac_trigger_w;

    // -------------------------------------------------------------------------
    // Module instantiations
    // -----------------------------------------------------------------

    // Ftel Driver: generates MNQ ticks from clock + enable
    ftel_driver u_ftel (
        .clk      (clk),
        .rst_n    (rst_n),
        .en       (en_ftel),
        .mnq_tick (mnq_tick_w)
    );

    // Taiyi Core: XOR-shift evolution with Dead-Zero
    taiyi_core_tomas u_core (
        .clk        (clk),
        .rst_n      (rst_n),
        .seed       (seed_in),
        .valid_seed (valid_seed),
        .evolved    (evolved_w)
    );

    // PG Detector: MUS dual-store arbitration
    pg_detect_tomas u_pg (
        .excess_loop_A (excess_loop_A),
        .excess_loop_B (excess_loop_B),
        .mus_flag      (mus_flag_w)
    );

    // Frequency Body Interface: I-weighted resonance
    freq_body_if_tomas u_freq (
        .clk         (clk),
        .rst_n       (rst_n),
        .state       (evolved_w),
        .excess_loop (excess_loop_A),
        .I_target    (I_target),
        .pll_locked  (pll_locked_w),
        .dac_trigger (dac_trigger_w)
    );

    // -------------------------------------------------------------------------
    // Output assignments
    // -------------------------------------------------------------------------
    assign mnq_tick   = mnq_tick_w;
    assign evolved_out = evolved_w;
    assign mus_flag   = mus_flag_w;
    assign pll_locked = pll_locked_w;
    assign dac_trigger= dac_trigger_w;

endmodule
