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
    // Extract stage lengths from input
    const lengths = [
        parseFloat(data.length1) || 0,
        parseFloat(data.length2) || 0,
        parseFloat(data.length3) || 0
    ];

    // --- FIX: compute propellant-only masses, without payload ---
    const prop_weights = lengths.map(l =>
        0.04 * (l * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches)
    );

    // Structural mass is 22% of propellant mass
    const struct_masses = prop_weights.map(w => w * 0.22);

    // Stage 1 mass fraction: burns all three tanks together
    const m0_stage1 = prop_weights[0] + prop_weights[1] + prop_weights[2] + payload;
    const mf_stage1 = prop_weights[1] + prop_weights[2] + struct_masses[0] + payload;
    const stage_1_mf = m0_stage1 / mf_stage1;

    // Stage 2 mass fraction: burns tanks 1 & 2
    const m0_stage2 = prop_weights[1] + prop_weights[2] + payload;
    const mf_stage2 = prop_weights[2] + struct_masses[1] + payload;
    const stage_2_mf = m0_stage2 / mf_stage2;

    // Stage 3 mass fraction: burns only tank 3
    const m0_stage3 = prop_weights[2] + payload;
    const mf_stage3 = struct_masses[2] + payload;
    const stage_3_mf = m0_stage3 / mf_stage3;

    // Compute ΔV for each stage (first stage includes gravity loss)
    const delta_v = [
        Math.log(stage_1_mf) * v_eq - g * 10,  // 10s gravity loss
        Math.log(stage_2_mf) * v_eq,
        Math.log(stage_3_mf) * v_eq
    ];

    // If any stage has non-positive mass-fraction, ΔV is zero
    if (stage_1_mf <= 1 || stage_2_mf <= 1 || stage_3_mf <= 1) {
        return {
            delta_v: 0,
            stage_delta_vs: [0, 0, 0],
            mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf]
        };
    }

    const total_delta_v = delta_v.reduce((sum, dv) => sum + dv, 0);

    console.log('Three stage result:', {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf],
        propellant_masses: prop_weights,
        struct_masses: struct_masses
    });

    return {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf]
    };
}

/**
 * calculate_pop_out(data): computes ΔV for a pop‑out booster
 * unchanged logic
 */
function calculate_pop_out(data) {
    console.log('Calculating pop out with data:', data);
    const core_length     = parseFloat(data.length4) || 0;
    const booster1_length = parseFloat(data.length5) || 0;
    const booster2_length = parseFloat(data.length6) || 0;

    // Propellant masses
    const core_weight     = 0.04 * (core_length     * meters_to_inches) * meters_to_inches * meters_to_inches;
    const booster1_weight = 0.04 * (booster1_length * meters_to_inches) * meters_to_inches * meters_to_inches;
    const booster2_weight = 0.04 * (booster2_length * meters_to_inches) * meters_to_inches * meters_to_inches;

    // Add payload only to core for stage computations
    const total_core_weight = core_weight + payload;

    // Structural / final masses
    const core_final     = total_core_weight * 0.22 + payload;
    const booster1_final = booster1_weight  * 0.22;
    const booster2_final = booster2_weight  * 0.22;

    // Mass fractions
    const stage1_mf = (total_core_weight + booster1_weight + booster2_weight) /
                      (core_final + booster1_final + booster2_final);
    const stage2_mf = (total_core_weight + booster1_weight)                /
                      (core_final + booster1_final);
    const stage3_mf = total_core_weight                                     /
                      (core_final);

    // ΔV each stage
    const delta_v = [
        Math.log(stage1_mf) * v_eq - g * 10,
        Math.log(stage2_mf) * v_eq,
        Math.log(stage3_mf) * v_eq
    ];

    if (stage1_mf <= 1 || stage2_mf <= 1 || stage3_mf <= 1) {
        return { delta_v: 0, stage_delta_vs: [0,0,0], mass_fractions: [stage1_mf,stage2_mf,stage3_mf] };
    }

    const total_delta_v = delta_v.reduce((sum, dv) => sum + dv, 0);
    console.log('Pop out result:', { delta_v: total_delta_v, stage_delta_vs: delta_v });
    return { delta_v: total_delta_v, stage_delta_vs: delta_v, mass_fractions: [stage1_mf,stage2_mf,stage3_mf] };
}

// Expose globally
window.calculate_three_stage = calculate_three_stage;
window.calculate_pop_out   = calculate_pop_out;

console.log('calculations.js loaded with corrected three-stage logic');
