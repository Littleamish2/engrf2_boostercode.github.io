// Constants from the optimization code
const specific_impulse = 250;  // seconds
const g = 9.80665;  // m/s^2
const v_eq = g * specific_impulse;  // exhaust velocity in m/s
const meters_to_inches = 39.3700787402;  // conversion factor
const kg_to_lbs = 2.20462;  // kg to lbs conversion factor

const payload = 250 * kg_to_lbs;  // in lbs

// Mass fractions for each stage (with appropriate ranges)
const mass_frac_first = 1 / np.linspace(1 / 10, 0.1200, 100);  // Mass fractions for first stage
const mass_frac_second = 1 / np.linspace(1 / 10, 0.1700, 100);  // Mass fractions for second stage
const mass_frac_third = 1 / np.linspace(1 / 10, 0.1010, 100);  // Mass fractions for third stage

// Calculate delta-v for each stage using the formula Δv = v_eq * ln(m0/mf)
const deltav_first = np.log(mass_frac_first) * v_eq - g * 10;  // First stage includes gravity loss
const deltav_second = np.log(mass_frac_second) * v_eq;
const deltav_third = np.log(mass_frac_third) * v_eq;

// Calculate mass fractions: m0/mf
// Mass fractions are calculated using the launch weight (m0) and final mass (mf) for each stage
const launch_weights_first = 0.04 * (10 * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload;  // lbs
const final_masses_first = launch_weights_first * 0.22 + payload;  // after losing the propellant

const launch_weights_second = 0.04 * (10 * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload;  // lbs
const final_masses_second = launch_weights_second * 0.22 + payload;  // after losing the propellant

const launch_weights_third = 0.04 * (10 * meters_to_inches) * (1 * meters_to_inches) * (1 * meters_to_inches) + payload;  // lbs
const final_masses_third = launch_weights_third * 0.22 + payload;  // after losing the propellant

// Calculate the mass fractions for each stage
const stage_1_mf = launch_weights_first / final_masses_first;
const stage_2_mf = launch_weights_second / final_masses_second;
const stage_3_mf = launch_weights_third / final_masses_third;

// Calculate total delta-v
const total_delta_v = deltav_first + deltav_second + deltav_third;

console.log("Max Mass Fraction");
console.log("First: ", stage_1_mf);
console.log("Second: ", stage_2_mf);
console.log("Third: ", stage_3_mf);

console.log("\nMax Delta V (in meters per second):");
console.log("First: ", np.max(deltav_first));
console.log("Second: ", np.max(deltav_second));
console.log("Third: ", np.max(deltav_third));

console.log("\nTotal Delta V: ", total_delta_v);
