from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Constants from the optimization code
specific_impulse = 250  # seconds
g = 9.80665  # m/s^2
v_eq = g * specific_impulse
meters_to_inches = 39.3700787402
kg_to_lbs = 2.20462
payload = 250 * kg_to_lbs  # in lbs

def calculate_three_stage(data):
    # Extract parameters from request
    masses = np.array([
        float(data['mass1']),
        float(data['mass2']),
        float(data['mass3'])
    ])
    
    lengths = np.array([
        float(data['length1']),
        float(data['length2']),
        float(data['length3'])
    ])
    
    # Calculate launch weights based on mode
    if data.get('mode') == 'mass':
        # Mass-based calculation
        launch_weights = masses * kg_to_lbs + payload
    else:
        # Length-based calculation (default)
        launch_weights = 0.04 * (lengths * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload
    
    # Calculate final masses
    final_masses = launch_weights * 0.22 + payload
    
    # Calculate mass fractions
    stage_1_mf = np.sum(launch_weights) / (np.sum(launch_weights[1:]) + final_masses[0])
    stage_2_mf = np.sum(launch_weights[1:]) / (launch_weights[2] + final_masses[1])
    stage_3_mf = launch_weights[2] / final_masses[2]
    
    # Calculate delta V
    delta_v = np.log([stage_1_mf, stage_2_mf, stage_3_mf]) * v_eq
    delta_v[0] = delta_v[0] - g * 10  # First stage burns for 10 seconds
    total_delta_v = np.sum(delta_v)
    
    return {
        'delta_v': total_delta_v,
        'stage_delta_vs': delta_v.tolist(),
        'mass_fractions': [stage_1_mf, stage_2_mf, stage_3_mf]
    }

def calculate_pop_out(data):
    # Extract parameters from request
    core_mass = float(data['mass4'])
    booster1_mass = float(data['mass5'])
    booster2_mass = float(data['mass6'])
    
    core_length = float(data['length4'])
    booster1_length = float(data['length5'])
    booster2_length = float(data['length6'])
    
    # Calculate launch weights based on mode
    if data.get('mode') == 'mass':
        # Mass-based calculation
        core_weight = core_mass * kg_to_lbs + payload
        booster1_weight = booster1_mass * kg_to_lbs
        booster2_weight = booster2_mass * kg_to_lbs
    else:
        # Length-based calculation (default)
        core_weight = 0.04 * (core_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload
        booster1_weight = 0.04 * (booster1_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches)
        booster2_weight = 0.04 * (booster2_length * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches)
    
    # Calculate final masses
    core_final = core_weight * 0.22 + payload
    booster1_final = booster1_weight * 0.22
    booster2_final = booster2_weight * 0.22
    
    # Calculate mass fractions
    core_mf = (core_weight + booster1_weight + booster2_weight) / (core_final + booster1_final + booster2_final)
    booster1_mf = (core_weight + booster1_weight) / (core_final + booster1_final)
    booster2_mf = core_weight / core_final
    
    # Calculate delta V
    delta_v = np.log([core_mf, booster1_mf, booster2_mf]) * v_eq
    delta_v[0] = delta_v[0] - g * 10  # First stage burns for 10 seconds
    total_delta_v = np.sum(delta_v)
    
    return {
        'delta_v': total_delta_v,
        'stage_delta_vs': delta_v.tolist(),
        'mass_fractions': [core_mf, booster1_mf, booster2_mf]
    }

@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.json
    
    # Calculate both three-stage and pop-out results
    three_stage_result = calculate_three_stage(data)
    pop_out_result = calculate_pop_out(data)
    
    return jsonify({
        'three_stage': three_stage_result,
        'pop_out': pop_out_result
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 