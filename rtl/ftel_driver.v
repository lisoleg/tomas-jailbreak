// =============================================================================
// ftel_driver.v
// Ftel (Flow) Driver - Quantum tick generator for TOMAS
// Axiom A2: kappa-Snap - time quantization via MNQ ticks
// When en=0, output is Dead-Zero (no flow => no tick)
// =============================================================================
module ftel_driver (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       en,        // Ftel flow enable
    output reg        mnq_tick   // Time-quantized pulse
);
    // MNQ period: number of clock cycles per MNQ tick
    parameter MNQ_PERIOD = 8'd10;

    reg [7:0] counter;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            counter  <= 8'd0;
            mnq_tick <= 1'b0;
        end else if (!en) begin
            // Dead-Zero: when flow disabled, freeze and suppress ticks
            counter  <= 8'd0;
            mnq_tick <= 1'b0;
        end else begin
            if (counter >= MNQ_PERIOD - 1) begin
                counter  <= 8'd0;
                mnq_tick <= 1'b1;
            end else begin
                counter  <= counter + 8'd1;
                mnq_tick <= 1'b0;
            end
        end
    end
endmodule
