// Constants from the optimization code
const specific_impulse = 250;  // seconds
const g = 9.80665;             // m/s^2
const v_eq = g * specific_impulse;
const meters_to_inches = 39.3700787402;
const kg_to_lbs = 2.20462;
const payload = 250 * kg_to_lbs;  // in lbs
const diameter = 1 * meters_to_inches;

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

    // 2) launch weights (no payload baked in)
    const launch_weights = lengths.map(l =>
        0.04 * (l * meters_to_inches)
             * (diameter**2)
    );

    // 3) structure masses (22% of launch weight)
    const struct_masses = launch_weights.map(w => w * 0.22);

    // 4) build mass‐fractions around the payload
    // Stage 1: all three tanks + payload
    const m0_1 = launch_weights[0] + launch_weights[1] + launch_weights[2] + payload;
    const mf_1 = struct_masses[0]  + launch_weights[1] + launch_weights[2] + payload;
    const stage_1_mf = m0_1 / mf_1;

    // Stage 2: tanks 2&3 + payload
    const m0_2 = launch_weights[1] + launch_weights[2] + payload;
    const mf_2 = struct_masses[1]  + launch_weights[2] + payload;
    const stage_2_mf = m0_2 / mf_2;

    // Stage 3: tank 3 + payload
    const m0_3 = launch_weights[2] + payload;
    const mf_3 = struct_masses[2] + payload;
    const stage_3_mf = m0_3 / mf_3;

    // 5) ΔV‑vector
    const delta_v = [
      Math.log(stage_1_mf) * v_eq,
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
    let popout_delta_v, popout_stage_delta_vs, popout_stage_mass_fractions;

    const { length4, length5, length6 } = data;
    const subset = { length4, length5, length6 }; //calculates with only popout lengths
     
    three_stage_data = calculate_three_stage(subset);
    ({popout_delta_v, popout_stage_delta_vs, popout_stage_mass_fractions} = three_stage_data);
    popout_delta_v -= g*10; //difference here! - g_0 * 10 seconds
    popout_stage_delta_vs[0] -= g*10;
    return { delta_v:popout_delta_v, stage_delta_vs:popout_stage_delta_vs, mass_fractions:popout_stage_mass_fractions};
}
// Expose globally
window.calculate_three_stage = calculate_three_stage;
window.calculate_pop_out   = calculate_pop_out;

console.log('calculations.js loaded with corrected three-stage logic');
