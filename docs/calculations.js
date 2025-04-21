// Constants from the optimization code
const specific_impulse = 250;  // seconds
const g = 9.80665;  // m/s^2
const v_eq = g * specific_impulse;
const meters_to_inches = 39.3700787402;
const kg_to_lbs = 2.20462;
const payload = 250 * kg_to_lbs;  // in lbs

function calculate_three_stage(data) {
    // Extract parameters from request
    const masses = [
        parseFloat(data.mass1),
        parseFloat(data.mass2),
        parseFloat(data.mass3)
    ];
    
    const lengths = [
        parseFloat(data.length1),
        parseFloat(data.length2),
        parseFloat(data.length3)
    ];
    
    // Calculate launch weights based on mode
    let launch_weights;
    if (data.mode === 'mass') {
        // Mass-based calculation
        launch_weights = masses.map(m => m * kg_to_lbs + payload);
    } else {
        // Length-based calculation (default)
        launch_weights = lengths.map(l => 0.04 * (l * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload);
    }
    
    // Calculate final masses
    const final_masses = launch_weights.map(w => w * 0.22 + payload);
    
    // Calculate mass fractions
    const stage_1_mf = launch_weights.reduce((a, b) => a + b) / (launch_weights.slice(1).reduce((a, b) => a + b) + final_masses[0]);
    const stage_2_mf = launch_weights.slice(1).reduce((a, b) => a + b) / (launch_weights[2] + final_masses[1]);
    const stage_3_mf = launch_weights[2] / final_masses[2];
    
    // Calculate delta V
    const delta_v = [stage_1_mf, stage_2_mf, stage_3_mf].map(mf => Math.log(mf) * v_eq);
    delta_v[0] = delta_v[0] - g * 10;  // First stage burns for 10 seconds
    const total_delta_v = delta_v.reduce((a, b) => a + b);
    
    return {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf]
    };
}

function calculate_pop_out(data) {
    // Extract parameters from request
    const core_mass = parseFloat(data.mass4);
    const booster1_mass = parseFloat(data.mass5);
    const booster2_mass = parseFloat(data.mass6);
    
    const core_length = parseFloat(data.length4);
    const booster1_length = parseFloat(data.length5);
    const booster2_length = parseFloat(data.length6);
    
    // Calculate launch weights based on mode
    let core_weight, booster1_weight, booster2_weight;
    
    if (data.mode === 'mass') {
        // Mass-based calculation
        core_weight = core_mass * kg_to_lbs + payload;
        booster1_weight = booster1_mass * kg_to_lbs;
        booster2_weight = booster2_mass * kg_to_lbs;
    } else {
        // Length-based calculation (default)
        core_weight = 0.04 * (core_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload;
        booster1_weight = 0.04 * (booster1_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches);
        booster2_weight = 0.04 * (booster2_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches);
    }
    
    // Calculate final masses
    const core_final = core_weight * 0.22 + payload;
    const booster1_final = booster1_weight * 0.22;
    const booster2_final = booster2_weight * 0.22;
    
    // Calculate mass fractions
    const core_mf = (core_weight + booster1_weight + booster2_weight) / (core_final + booster1_final + booster2_final);
    const booster1_mf = (core_weight + booster1_weight) / (core_final + booster1_final);
    const booster2_mf = core_weight / core_final;
    
    // Calculate delta V
    const delta_v = [core_mf, booster1_mf, booster2_mf].map(mf => Math.log(mf) * v_eq);
    delta_v[0] = delta_v[0] - g * 10;  // First stage burns for 10 seconds
    const total_delta_v = delta_v.reduce((a, b) => a + b);
    
    return {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [core_mf, booster1_mf, booster2_mf]
    };
} 