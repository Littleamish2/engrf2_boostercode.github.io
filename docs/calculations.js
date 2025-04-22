// Constants from the optimization code
const specific_impulse = 250;  // seconds
const g = 9.80665;             // m/s^2
const v_eq = g * specific_impulse;
const meters_to_inches = 39.3700787402;
const kg_to_lbs = 2.20462;
const payload = 250 * kg_to_lbs;  // in lbs

/**
 * calculate_three_stage(data): computes ΔV for a three-stage booster
 */
function calculate_three_stage(data) {
    console.log('Calculating three stage with data:', data);
    // 1) parse lengths
    const lengths = [
        parseFloat(data.length1) || 0,
        parseFloat(data.length2) || 0,
        parseFloat(data.length3) || 0
    ];

    // 2) pure propellant masses (no payload baked in)
    const prop_weights = lengths.map(l =>
        0.04 * (l * meters_to_inches)
             * (1     * meters_to_inches)
             * (1     * meters_to_inches)
    );

    // 3) structure masses (22% of propellant)
    const struct_masses = prop_weights.map(w => w * 0.22);

    // 4) build mass‐fractions around the payload
    // Stage 1: all three tanks + payload
    const m0_1 = prop_weights[0] + prop_weights[1] + prop_weights[2] + payload;
    const mf_1 = prop_weights[1] + prop_weights[2] + struct_masses[0] + payload;
    const stage_1_mf = m0_1 / mf_1;

    // Stage 2: tanks 2&3 + payload
    const m0_2 = prop_weights[1] + prop_weights[2] + payload;
    const mf_2 = prop_weights[2] + struct_masses[1] + payload;
    const stage_2_mf = m0_2 / mf_2;

    // Stage 3: tank 3 + payload
    const m0_3 = prop_weights[2] + payload;
    const mf_3 = struct_masses[2] + payload;
    const stage_3_mf = m0_3 / mf_3;

    // 5) ΔV‑vector (gravity loss only on first burn)
    const delta_v = [
      Math.log(stage_1_mf) * v_eq - g * 10,
      Math.log(stage_2_mf) * v_eq,
      Math.log(stage_3_mf) * v_eq
    ];

    // zero if any mf ≤1
    if (stage_1_mf <= 1 || stage_2_mf <= 1 || stage_3_mf <= 1) {
        return { delta_v: 0, stage_delta_vs: [0,0,0], mass_fractions:[stage_1_mf,stage_2_mf,stage_3_mf] };
    }

    const total_delta_v = delta_v.reduce((a,b)=>a+b, 0);
    console.log('Three stage result:', { total_delta_v, delta_v, mass_fractions:[stage_1_mf,stage_2_mf,stage_3_mf] });
    return { delta_v: total_delta_v, stage_delta_vs: delta_v, mass_fractions:[stage_1_mf,stage_2_mf,stage_3_mf] };
}
function calculate_pop_out(data) {
    console.log('Calculating pop out with data:', data);
    const core_length     = parseFloat(data.length4) || 0;
    const booster1_length = parseFloat(data.length5) || 0;
    const booster2_length = parseFloat(data.length6) || 0;

    // propellant masses
    const core_weight     = 0.04 * (core_length     * meters_to_inches) * meters_to_inches * meters_to_inches;
    const booster1_weight = 0.04 * (booster1_length * meters_to_inches) * meters_to_inches * meters_to_inches;
    const booster2_weight = 0.04 * (booster2_length * meters_to_inches) * meters_to_inches * meters_to_inches;

    const core_struct     = core_weight     * 0.22;
    const booster1_struct = booster1_weight * 0.22;
    const booster2_struct = booster2_weight * 0.22;

    // Stage 1 (all three burn)
    const m0_1 = core_weight + booster1_weight + booster2_weight + payload;
    const mf_1 = core_struct + booster1_struct + booster2_struct + payload;
    const stage1_mf = m0_1 / mf_1;

    // Stage 2 (core+booster1)
    const m0_2 = core_weight + booster1_weight + payload;
    const mf_2 = core_struct + booster1_struct + payload;
    const stage2_mf = m0_2 / mf_2;

    // Stage 3 (core only)
    const m0_3 = core_weight + payload;
    const mf_3 = core_struct + payload;
    const stage3_mf = m0_3 / mf_3;

    const delta_v = [
      Math.log(stage1_mf) * v_eq - g * 10,
      Math.log(stage2_mf) * v_eq,
      Math.log(stage3_mf) * v_eq
    ];
    if (stage1_mf<=1||stage2_mf<=1||stage3_mf<=1) {
        return { delta_v:0, stage_delta_vs:[0,0,0], mass_fractions:[stage1_mf,stage2_mf,stage3_mf] };
    }
    const total_delta_v = delta_v.reduce((a,b)=>a+b,0);
    console.log('Pop out result:',{total_delta_v,delta_v,mass_fractions:[stage1_mf,stage2_mf,stage3_mf]});
    return { delta_v:total_delta_v, stage_delta_vs:delta_v, mass_fractions:[stage1_mf,stage2_mf,stage3_mf] };
}
// Expose globally
window.calculate_three_stage = calculate_three_stage;
window.calculate_pop_out   = calculate_pop_out;

console.log('calculations.js loaded with corrected three-stage logic');
