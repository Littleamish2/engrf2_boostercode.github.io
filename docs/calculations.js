// Constants from the optimization code
const specific_impulse = 250;  // seconds
const g = 9.80665;  // m/s^2
const v_eq = g * specific_impulse;
const meters_to_inches = 39.3700787402;
const kg_to_lbs = 2.20462;
const payload = 250 * kg_to_lbs;  // in lbs

// Define the functions first
function calculate_three_stage(data) {
    console.log('Calculating three stage with data:', data);
    // Extract parameters from request
    const lengths = [
        parseFloat(data.length1) || 0,
        parseFloat(data.length2) || 0,
        parseFloat(data.length3) || 0
    ];
    
    // Calculate launch weights using length-based calculation (without payload)
    const launch_weights = lengths.map(l => 0.04 * (l * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches));
    
    // Calculate structural mass (22% of propellant mass)
    const struct_masses = launch_weights.map(w => w * 0.22);
    
    // Calculate mass fractions for each stage
    // Stage 1: m0 = total launch weight + payload, mf = remaining stages + struct + payload
    const stage_1_mf = (launch_weights[0] + launch_weights[1] + launch_weights[2] + payload) / 
                     (launch_weights[1] + launch_weights[2] + struct_masses[0] + payload);
    
    // Stage 2: m0 = remaining stages + payload, mf = final stage + struct + payload
    const stage_2_mf = (launch_weights[1] + launch_weights[2] + payload) / 
                     (launch_weights[2] + struct_masses[1] + payload);
    
    // Stage 3: m0 = final stage + payload, mf = struct + payload
    const stage_3_mf = (launch_weights[2] + payload) / (struct_masses[2] + payload);
    
    // Calculate delta V with gravity loss for first stage
    const delta_v = [
        Math.log(stage_1_mf) * v_eq - g * 10,  // First stage burns for 10 seconds
        Math.log(stage_2_mf) * v_eq,
        Math.log(stage_3_mf) * v_eq
    ];
    
    // If any mass fraction is less than 1, set delta-v to 0
    if (stage_1_mf <= 1 || stage_2_mf <= 1 || stage_3_mf <= 1) {
        return {
            delta_v: 0,
            stage_delta_vs: [0, 0, 0],
            mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf]
        };
    }
    
    const total_delta_v = delta_v.reduce((a, b) => a + b);
    
    console.log('Three stage result:', { 
        delta_v: total_delta_v, 
        stage_delta_vs: delta_v,
        mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf],
        launch_weights: launch_weights,
        struct_masses: struct_masses
    });
    return {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf]
    };
}

function calculate_pop_out(data) {
    console.log('Calculating pop out with data:', data);
    // Extract parameters from request
    const core_length = parseFloat(data.length4) || 0;
    const booster1_length = parseFloat(data.length5) || 0;
    const booster2_length = parseFloat(data.length6) || 0;
    
    // Calculate launch weights using length-based calculation (without payload)
    const core_weight = 0.04 * (core_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches);
    const booster1_weight = 0.04 * (booster1_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches);
    const booster2_weight = 0.04 * (booster2_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches);
    
    // Calculate structural mass (22% of propellant mass)
    const core_struct = core_weight * 0.22;
    const booster1_struct = booster1_weight * 0.22;
    const booster2_struct = booster2_weight * 0.22;
    
    // Calculate mass fractions for each stage
    // Stage 1: All boosters burn together
    const m0_stage1 = core_weight + booster1_weight + booster2_weight + payload;
    const mf_stage1 = core_struct + booster1_struct + booster2_struct + payload;
    const stage1_mf = m0_stage1 / mf_stage1;
    
    // Stage 2: Core and booster1 burn together
    const m0_stage2 = core_weight + booster1_weight + payload;
    const mf_stage2 = core_struct + booster1_struct + payload;
    const stage2_mf = m0_stage2 / mf_stage2;
    
    // Stage 3: Only core burns
    const m0_stage3 = core_weight + payload;
    const mf_stage3 = core_struct + payload;
    const stage3_mf = m0_stage3 / mf_stage3;
    
    // Calculate delta V with gravity loss for first stage
    const delta_v = [
        Math.log(stage1_mf) * v_eq - g * 10,  // First stage burns for 10 seconds
        Math.log(stage2_mf) * v_eq,
        Math.log(stage3_mf) * v_eq
    ];
    
    // If any mass fraction is less than 1, set delta-v to 0
    if (stage1_mf <= 1 || stage2_mf <= 1 || stage3_mf <= 1) {
        return {
            delta_v: 0,
            stage_delta_vs: [0, 0, 0],
            mass_fractions: [stage1_mf, stage2_mf, stage3_mf]
        };
    }
    
    const total_delta_v = delta_v.reduce((a, b) => a + b);
    
    console.log('Pop out result:', { 
        delta_v: total_delta_v, 
        stage_delta_vs: delta_v,
        mass_fractions: [stage1_mf, stage2_mf, stage3_mf],
        initial_masses: [m0_stage1, m0_stage2, m0_stage3],
        final_masses: [mf_stage1, mf_stage2, mf_stage3],
        weights: {
            core: core_weight,
            booster1: booster1_weight,
            booster2: booster2_weight
        },
        structures: {
            core: core_struct,
            booster1: booster1_struct,
            booster2: booster2_struct
        }
    });
    return {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [stage1_mf, stage2_mf, stage3_mf]
    };
}

// Make functions globally available
window.calculate_three_stage = calculate_three_stage;
window.calculate_pop_out = calculate_pop_out;

// Log when the script is loaded
console.log('Calculations.js loaded successfully'); 
