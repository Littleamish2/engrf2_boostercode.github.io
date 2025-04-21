// Constants
const specific_impulse = 250;  // seconds
const g = 9.80665;  // m/s^2
const v_eq = g * specific_impulse;  // m/s
const meters_to_inches = 39.3700787402;
const kg_to_lbs = 2.20462;
const payload_kg = 250; // in kg (standard payload)

// Define the functions first
function calculate_three_stage(data) {
    console.log('Calculating three stage with data:', data);
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
    
    // Ensure consistent handling of payload and stage weights
    let launch_weights;
    if (data.mode === 'mass') {
        // Mass-based calculation
        launch_weights = masses.map(m => m * kg_to_lbs + payload_kg * kg_to_lbs);  // Ensure mass-to-lbs consistency
    } else {
        // Length-based calculation (volume method)
        launch_weights = lengths.map(l => 0.04 * (l * meters_to_inches) ** 3 + payload_kg * kg_to_lbs);  // Consistent length-based calculation
    }
    
    // Calculate final masses
    const final_masses = launch_weights.map(w => w * 0.22 + payload_kg * kg_to_lbs);  // Standardize final masses

    // Calculate mass fractions for each stage (consistency in stages)
    const stage_1_mf = (launch_weights[0] + launch_weights[1] + launch_weights[2]) / 
                       (launch_weights[1] + launch_weights[2] + final_masses[0]);
    const stage_2_mf = (launch_weights[1] + launch_weights[2]) / 
                       (launch_weights[2] + final_masses[1]);
    const stage_3_mf = launch_weights[2] / final_masses[2];
    
    // Calculate delta V
    const delta_v = [stage_1_mf, stage_2_mf, stage_3_mf].map(mf => Math.log(mf) * v_eq);
    delta_v[0] = delta_v[0] - g * 10;  // First stage burns for 10 seconds
    const total_delta_v = delta_v.reduce((a, b) => a + b);
    
    console.log('Three stage calculation result:', { delta_v: total_delta_v, stage_delta_vs: delta_v });
    return {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [stage_1_mf, stage_2_mf, stage_3_mf]
    };
}

function calculate_pop_out(data) {
    console.log('Calculating pop out with data:', data);
    // Extract parameters from request
    const core_mass = parseFloat(data.mass4);
    const booster1_mass = parseFloat(data.mass5);
    const booster2_mass = parseFloat(data.mass6);
    
    const core_length = parseFloat(data.length4);
    const booster1_length = parseFloat(data.length5);
    const booster2_length = parseFloat(data.length6);
    
    // Ensure consistent handling of payload and stage weights
    let core_weight, booster1_weight, booster2_weight;
    if (data.mode === 'mass') {
        // Mass-based calculation
        core_weight = core_mass * kg_to_lbs + payload_kg * kg_to_lbs;
        booster1_weight = booster1_mass * kg_to_lbs;
        booster2_weight = booster2_mass * kg_to_lbs;
    } else {
        // Length-based calculation (volume method)
        core_weight = 0.04 * (core_length * meters_to_inches) ** 3 + payload_kg * kg_to_lbs;
        booster1_weight = 0.04 * (booster1_length * meters_to_inches) ** 3;
        booster2_weight = 0.04 * (booster2_length * meters_to_inches) ** 3;
    }
    
    // Calculate final masses
    const core_final = core_weight * 0.22 + payload_kg * kg_to_lbs;
    const booster1_final = booster1_weight * 0.22;
    const booster2_final = booster2_weight * 0.22;
    
    // Calculate mass fractions for each stage (consistency in stages)
    const core_mf = (core_weight + booster1_weight + booster2_weight) / 
                    (core_final + booster1_final + booster2_final);
    const booster1_mf = (core_weight + booster1_weight) / 
                        (core_final + booster1_final);
    const booster2_mf = core_weight / core_final;
    
    // Calculate delta V
    const delta_v = [core_mf, booster1_mf, booster2_mf].map(mf => Math.log(mf) * v_eq);
    delta_v[0] = delta_v[0] - g * 10;  // First stage burns for 10 seconds
    const total_delta_v = delta_v.reduce((a, b) => a + b);
    
    console.log('Pop out calculation result:', { delta_v: total_delta_v, stage_delta_vs: delta_v });
    return {
        delta_v: total_delta_v,
        stage_delta_vs: delta_v,
        mass_fractions: [core_mf, booster1_mf, booster2_mf]
    };
}

// Function to switch modes (mass/length)
function updateCalculationMode() {
    console.log('Updating calculation mode');
    const mode = document.getElementById('calculationMode').value;
    const massInputs = document.querySelectorAll('input[id*="mass"]');
    const lengthInputs = document.querySelectorAll('input[id*="length"]');
    
    if (mode === 'mass') {
        // Mass-based mode enabled, disable length inputs
        massInputs.forEach(input => input.parentElement.classList.remove('disabled'));
        lengthInputs.forEach(input => input.parentElement.classList.add('disabled'));
    } else {
        // Length-based mode enabled, disable mass inputs
        lengthInputs.forEach(input => input.parentElement.classList.remove('disabled'));
        massInputs.forEach(input => input.parentElement.classList.add('disabled'));
    }
    
    // Trigger optimization for both modes
    optimize('threeStage');
    optimize('popOut');
}

// General optimization trigger (both modes)
function optimize(type) {
    console.log('Optimizing:', type);
    const mode = document.getElementById('calculationMode').value;
    const data = {
        mass1: document.getElementById('mass1_val').value,
        mass2: document.getElementById('mass2_val').value,
        mass3: document.getElementById('mass3_val').value,
        length1: document.getElementById('length1_val').value,
        length2: document.getElementById('length2_val').value,
        length3: document.getElementById('length3_val').value,
        mass4: document.getElementById('mass4_val').value,
        mass5: document.getElementById('mass5_val').value,
        mass6: document.getElementById('mass6_val').value,
        length4: document.getElementById('length4_val').value,
        length5: document.getElementById('length5_val').value,
        length6: document.getElementById('length6_val').value,
        mode: mode
    };

    console.log('Optimization data:', data);
    let result;
    if (type === 'threeStage') {
        result = calculate_three_stage(data);
        // Update results for three-stage booster
    } else {
        result = calculate_pop_out(data);
        // Update results for pop-out booster
    }

    updateResults(result);
}

// Update results
function updateResults(result) {
    console.log('Updating results:', result);
    document.getElementById('totalDeltaV3').textContent = result.delta_v.toFixed(2);
    document.getElementById('stage1DeltaV').textContent = result.stage_delta_vs[0].toFixed(2);
    document.getElementById('stage2DeltaV').textContent = result.stage_delta_vs[1].toFixed(2);
    document.getElementById('stage3DeltaV').textContent = result.stage_delta_vs[2].toFixed(2);
    updateComparison(result.delta_v, result.delta_v);  // Comparison update
}
