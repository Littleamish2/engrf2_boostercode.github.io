// Constants from the optimization code
const specific_impulse = 250;  // seconds
const g = 9.80665;  // m/s^2
const v_eq = g * specific_impulse;
const meters_to_inches = 39.3700787402;
const kg_to_lbs = 2.20462;
const payload = 250 * kg_to_lbs;  // in lbs

function calculate_three_stage(data) {
    console.log('Calculating three stage with data:', data);
    // Extract parameters from request
    const lengths = [
        parseFloat(data.length1) || 0,
        parseFloat(data.length2) || 0,
        parseFloat(data.length3) || 0
    ];

    // Calculate launch weights using length-based calculation
    const launch_weights = lengths.map(l => 0.04 * (l * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload);

    // Calculate final masses (22% of launch weight remains as structure, including payload)
    const final_masses = launch_weights.map(w => w * 0.22 + payload);

    // Calculate mass fractions for each stage
    const stage_1_mf = (launch_weights[0] + launch_weights[1] + launch_weights[2]) / 
                       (launch_weights[1] + launch_weights[2] + final_masses[0]);
    const stage_2_mf = (launch_weights[1] + launch_weights[2]) / 
                       (launch_weights[2] + final_masses[1]);
    const stage_3_mf = launch_weights[2] / final_masses[2];

    // Calculate delta V with gravity loss for first stage
    const delta_v = [
        Math.log(stage_1_mf) * v_eq - g * 10,  // First stage burns for 10 seconds
        Math.log(stage_2_mf) * v_eq,
        Math.log(stage_3_mf) * v_eq
    ];
    const total_delta_v = delta_v.reduce((a, b) => a + b);

    console.log('Three stage result:', { 
        delta_v: total_delta_v, 
        stage_delta_vs: delta_v,
        mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf]
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

    // Calculate launch weights using length-based calculation
    const core_weight = 0.04 * (core_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload;
    const booster1_weight = 0.04 * (booster1_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches);
    const booster2_weight = 0.04 * (booster2_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches);

    // Calculate final masses (22% of launch weight remains as structure, including payload)
    const core_final = core_weight * 0.22 + payload;
    const booster1_final = booster1_weight * 0.22;
    const booster2_final = booster2_weight * 0.22;

    // Calculate mass fractions for each stage
    const core_mf = (core_weight + booster1_weight + booster2_weight) / 
                    (core_final + booster1_final + booster2_final);
    const booster1_mf = (core_weight + booster1_weight) / 
                        (core_final + booster1_final);
    const booster2_mf = core_weight / core_final;

    // Calculate delta V with gravity loss for first stage
    const delta_v = [
        Math.log(core_mf) * v_eq - g * 10,  // First stage burns for 10 seconds
        Math.log(booster1_mf) * v_eq,
        Math.log(booster2_mf) * v_eq
    ];
    const total_delta_v = delta_v.reduce((a, b) => a + b);

    // If any mass fraction is less than 1, set delta-v to 0
    if (core_mf <= 1 || booster1_mf <= 1 || booster2_mf <= 1) {
        return {
            delta_v: 0,
            stage_delta_vs: [0, 0, 0],
            mass_fractions: [core_mf, booster1_mf, booster2_mf]
        };
    }

    console.log('Pop out result:', { 
        delta_v: total_delta_v, 
        stage_delta_vs: delta_v,
        mass_fractions: [core_mf, booster1_mf, booster2_mf]
    });

    return {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [core_mf, booster1_mf, booster2_mf]
    };
}
