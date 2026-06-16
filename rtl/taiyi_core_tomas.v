// =============================================================================
// taiyi_core_tomas.v
// Taiyi Core - XOR-shift evolution engine with Dead-Zero cutoff
// Axiom A1: psi-Anchor (seed-anchored evolution)
// Dead-Zero: when valid_seed=0, evolved output forced to 0 (illusion cutoff)
// =============================================================================
module taiyi_core_tomas (
    input  wire        clk,
    input  wire        rst_n,
    input  wire [31:0] seed,
    input  wire        valid_seed,
    output wire [31:0] evolved
);
    reg [31:0] state;

    // XOR-shift PRNG (xorshift32 variant): sequential <<13, >>7, <<17
    // Each step must operate on the result of the previous step (Marsaglia).
    // Implemented with combinational wires to ensure correct sequential XOR.
    wire [31:0] s1 = state ^ ((state << 13) & 32'hFFFFFFFF);
    wire [31:0] s2 = s1 ^ (s1 >> 7);
    wire [31:0] s3 = s2 ^ ((s2 << 17) & 32'hFFFFFFFF);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            state <= seed;
        else
            state <= s3;
    end

    // Dead-Zero: suppress evolved output when valid_seed is deasserted
    assign evolved = valid_seed ? state : 32'b0;

endmodule
