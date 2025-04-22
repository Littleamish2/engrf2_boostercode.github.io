// Constants
const specific_impulse = 250;    // seconds
const g                = 9.80665; // m/s^2
const v_eq             = g * specific_impulse;
const meters_to_inches = 39.3700787402;
const kg_to_lbs        = 2.20462;
const payload          = 250 * kg_to_lbs;  // in lbs
const STRUCT_FRAC      = 0.22;

/**
 * calculate_three_stage(data): computes ΔV for a three-stage booster
 */
function calculate_three_stage(data) {
  // Parse propellant lengths (m)
  const lengths = [
    parseFloat(data.length1) || 0,
    parseFloat(data.length2) || 0,
    parseFloat(data.length3) || 0
  ];

  // Convert to propellant weights (lb)
  const prop_weights = lengths.map(l =>
    0.04 * (l * meters_to_inches)
         * meters_to_inches
         * meters_to_inches
  );

  // Structural masses = STRUCT_FRAC * propellant
  const struct_masses = prop_weights.map(w => w * STRUCT_FRAC);

  // Compute m0/mf for each stage
  const m0_1 = prop_weights[0] + prop_weights[1] + prop_weights[2] + payload;
  const mf_1 = prop_weights[1] + prop_weights[2] + struct_masses[0] + payload;
  const mf1  = m0_1 / mf_1;

  const m0_2 = prop_weights[1] + prop_weights[2] + payload;
  const mf_2 = prop_weights[2] + struct_masses[1] + payload;
  const mf2  = m0_2 / mf_2;

  const m0_3 = prop_weights[2] + payload;
  const mf_3 = struct_masses[2] + payload;
  const mf3  = m0_3 / mf_3;

  // If any stage can't burn, zero out
  if (mf1 <= 1 || mf2 <= 1 || mf3 <= 1) {
    return { delta_v: 0, stage_delta_vs: [0, 0, 0], mass_fractions: [mf1, mf2, mf3] };
  }

  // ΔV with gravity loss only on first stage
  const dv1 = Math.log(mf1) * v_eq - g * 10;
  const dv2 = Math.log(mf2) * v_eq;
  const dv3 = Math.log(mf3) * v_eq;
  const total_delta_v = dv1 + dv2 + dv3;

  return {
    delta_v: total_delta_v,
    stage_delta_vs: [dv1, dv2, dv3],
    mass_fractions: [mf1, mf2, mf3]
  };
}

/**
 * calculate_pop_out(data): computes ΔV for a pop-out booster,
 * skipping stages when side boosters are missing
 */
function calculate_pop_out(data) {
  // Parse lengths
  const core_len    = parseFloat(data.length4) || 0;
  const b1_len      = parseFloat(data.length5) || 0;
  const b2_len      = parseFloat(data.length6) || 0;

  // Compute weights & struct masses
  const core_prop    = 0.04 * (core_len * meters_to_inches) * meters_to_inches * meters_to_inches;
  const b1_prop      = 0.04 * (b1_len   * meters_to_inches) * meters_to_inches * meters_to_inches;
  const b2_prop      = 0.04 * (b2_len   * meters_to_inches) * meters_to_inches * meters_to_inches;

  const core_wt      = core_prop    + payload;
  const b1_wt        = b1_prop;
  const b2_wt        = b2_prop;

  const core_struct  = core_wt      * STRUCT_FRAC;
  const b1_struct    = b1_wt        * STRUCT_FRAC;
  const b2_struct    = b2_wt        * STRUCT_FRAC;

  // Helper to compute a single ΔV burn
  function burn(m0, mf, gravityLoss = false) {
    const dv = Math.log(m0 / mf) * v_eq - (gravityLoss ? g * 10 : 0);
    return (m0 / mf) <= 1 ? 0 : dv;
  }

  // 0 boosters → single-stage core burn
  if (b1_len === 0 && b2_len === 0) {
    const m0 = core_wt;
    const mf = core_struct + payload;
    const dv = burn(m0, mf, true);
    return { delta_v: dv, stage_delta_vs: [dv], mass_fractions: [m0 / mf] };
  }

  // 1 booster → two-stage: core+booster, then core alone
  if (b1_len === 0 || b2_len === 0) {
    const side_wt     = b1_len === 0 ? b2_wt : b1_wt;
    const side_struct = b1_len === 0 ? b2_struct : b1_struct;

    // Stage 1: core + one booster
    const m0_1 = core_wt + side_wt;
    const mf_1 = core_struct + side_struct + payload;
    const dv1  = burn(m0_1, mf_1, true);

    // Stage 2: core only
    const m0_2 = core_wt;
    const mf_2 = core_struct + payload;
    const dv2  = burn(m0_2, mf_2, false);

    if ((m0_1 / mf_1) <= 1 || (m0_2 / mf_2) <= 1) {
      return { delta_v: 0, stage_delta_vs: [0, 0], mass_fractions: [m0_1 / mf_1, m0_2 / mf_2] };
    }

    return { delta_v: dv1 + dv2, stage_delta_vs: [dv1, dv2], mass_fractions: [m0_1 / mf_1, m0_2 / mf_2] };
  }

  // 2 boosters → full three-burn pop-out as originally defined
  // Stage 1: all three
  const m0_1 = core_wt + b1_wt + b2_wt;
  const mf_1 = core_struct + b1_struct + b2_struct + payload;
  const dv1  = burn(m0_1, mf_1, true);

  // Stage 2: core + booster1
  const m0_2 = core_wt + b1_wt;
  const mf_2 = core_struct + b1_struct + payload;
  const dv2  = burn(m0_2, mf_2, false);

  // Stage 3: core only
  const m0_3 = core_wt;
  const mf_3 = core_struct + payload;
  const dv3  = burn(m0_3, mf_3, false);

  if ((m0_1 / mf_1) <= 1 || (m0_2 / mf_2) <= 1 || (m0_3 / mf_3) <= 1) {
    return { delta_v: 0, stage_delta_vs: [0, 0, 0], mass_fractions: [m0_1 / mf_1, m0_2 / mf_2, m0_3 / mf_3] };
  }

  return {
    delta_v: dv1 + dv2 + dv3,
    stage_delta_vs: [dv1, dv2, dv3],
    mass_fractions: [m0_1 / mf_1, m0_2 / mf_2, m0_3 / mf_3]
  };
}

// Expose globally
window.calculate_three_stage = calculate_three_stage;
window.calculate_pop_out   = calculate_pop_out;

console.log('calculations.js loaded with updated pop-out logic');
