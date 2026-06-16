// =============================================================================
// freq_body_if_tomas.v
// Frequency Body Interface - I-weighted resonance (PLL + DAC trigger)
// Axiom A4: I-weighted resonance - only high-I signals lock PLL
// When excess_loop >= I_MIN, counter accumulates; at full count => PLL lock
// =============================================================================
module freq_body_if_tomas (
    input  wire        clk,
    input  wire        rst_n,
    input  wire [31:0] state,
    input  wire [7:0]  excess_loop,
    input  wire [7:0] I_target,
    output reg         pll_locked,
    output reg         dac_trigger
);
    // Minimum I (excess loop) threshold for resonance
    parameter I_MIN = 8'd50;

    reg [7:0] counter;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            counter    <= 8'h00;
            pll_locked <= 1'b0;
            dac_trigger<= 1'b0;
        end else begin
            if (excess_loop >= I_MIN) begin
                // High-I signal: accumulate toward PLL lock
                if (counter == 8'hFF) begin
                    pll_locked  <= 1'b1;
                    dac_trigger <= 1'b1;
                end else begin
                    counter <= counter + 8'd1;
                end
            end else begin
                // Low-I signal: reset, no resonance
                counter     <= 8'h00;
                pll_locked  <= 1'b0;
                dac_trigger <= 1'b0;
            end
        end
    end

endmodule
