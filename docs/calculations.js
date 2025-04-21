// Constants
const specific_impulse = 250;  // seconds
const g = 9.80665;  // m/s^2
const v_eq = g * specific_impulse;
const kg_to_lbs = 2.20462;
const payload = 250 * kg_to_lbs;  // in lbs

function calculate_three_stage(data) {
  // convert propellant masses to lbs
  const p1 = (parseFloat(data.mass1) || 0) * kg_to_lbs;
  const p2 = (parseFloat(data.mass2) || 0) * kg_to_lbs;
  const p3 = (parseFloat(data.mass3) || 0) * kg_to_lbs;
  const PL = payload;

  // structure masses (22% of propellant)
  const s1 = p1 * 0.22;
  const s2 = p2 * 0.22;
  const s3 = p3 * 0.22;

  // cumulative masses
  const M0 = p1 + s1 + p2 + s2 + p3 + s3 + PL;
  const M1 = M0 - p1;
  const M2 = M1 - p2;
  const M3 = M2 - p3;

  // mass fractions
  const mf1 = M0 / M1;
  const mf2 = M1 / M2;
  const mf3 = M2 / M3;

  // delta-vs
  const dv1 = Math.log(mf1) * v_eq;
  const dv2 = Math.log(mf2) * v_eq;
  const dv3 = Math.log(mf3) * v_eq;

  return {
    delta_v: dv1 + dv2 + dv3,
    stage_delta_vs: [dv1, dv2, dv3],
    mass_fractions: [mf1, mf2, mf3]
  };
}

function calculate_pop_out(data) {
  // convert propellant masses to lbs
  const core = (parseFloat(data.mass4) || 0) * kg_to_lbs;
  const b1   = (parseFloat(data.mass5) || 0) * kg_to_lbs;
  const b2   = (parseFloat(data.mass6) || 0) * kg_to_lbs;
  const PL   = payload;

  // structure masses
  const sc = core * 0.22;
  const s1 = b1   * 0.22;
  const s2 = b2   * 0.22;

  // cumulative masses
  const M0 = core + sc + b1 + s1 + b2 + s2 + PL;
  const M1 = M0 - core;
  const M2 = M1 - b1;
  const M3 = M2 - b2;

  // mass fractions
  const mf1 = M0 / M1;
  const mf2 = M1 / M2;
  const mf3 = M2 / M3;

  // delta-vs
  const dv1 = Math.log(mf1) * v_eq;
  const dv2 = Math.log(mf2) * v_eq;
  const dv3 = Math.log(mf3) * v_eq;

  return {
    delta_v: dv1 + dv2 + dv3,
    stage_delta_vs: [dv1, dv2, dv3],
    mass_fractions: [mf1, mf2, mf3]
  };
}

// expose functions globally
window.calculate_three_stage = calculate_three_stage;
window.calculate_pop_out    = calculate_pop_out;
console.log('Updated calculations.js loaded');
