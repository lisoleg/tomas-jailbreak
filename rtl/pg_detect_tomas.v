// =============================================================================
// pg_detect_tomas.v
// PG (Paradox Gap) Detector - MUS (Mutual Unusability Seal) arbitration
// Axiom A3: MUS - dual-store topology imprisonment
// When both excess loops exceed threshold, mus_flag asserts
// =============================================================================
module pg_detect_tomas (
    input  wire [7:0] excess_loop_A,
    input  wire [7:0] excess_loop_B,
    output wire       mus_flag
);
    // Threshold for MUS trigger (excess loop count)
    parameter THRESH = 8'd100;

    // MUS: both stores must be simultaneously saturated
    assign mus_flag = (excess_loop_A >= THRESH) && (excess_loop_B >= THRESH);

endmodule
