// ============================================================
// Tornado Outlook Engine
// A rule-based parametric approximation modeled on public, well-documented
// severe-weather composite formulas (Thompson et al. STP/SCP, standard EHI
// and Bulk Richardson Number definitions). This is NOT a numerical weather
// prediction model - it's a physically-informed approximation tuned so that
// realistic parameter combinations produce realistic-looking outcomes.
// ============================================================

export type TornadoParameters = {
  sbcape: number;
  mlcape: number;
  mucape: number;
  cape_0_3km: number;
  dcape: number;
  sbcin: number; // stored as a positive magnitude
  mlcin: number; // stored as a positive magnitude
  surface_dewpoint: number;
  pwat: number;
  td_depression_700mb: number;
  shear_0_1km: number; // knots
  shear_0_3km: number; // knots
  shear_0_6km: number; // knots
  srh_0_1km: number;
  srh_0_3km: number;
  srh_effective: number;
  llj_speed_850mb: number;
  wind_speed_500mb: number;
  lcl_height: number; // meters
  lfc_height: number; // meters
  el_height: number; // meters
  lapse_rate_700_500mb: number;
  lapse_rate_0_3km: number;
  freezing_level_height: number;
  wet_bulb_zero_height: number;
  cap_strength: number;
  boundary_strength: number; // 0-10 scale
  storm_motion_deviation: number; // knots
  mixing_depth: number; // meters
};

export type RiskCategory = "TSTM" | "MRGL" | "SLGT" | "ENH" | "MDT" | "HIGH";

export type OutlookResult = {
  category: RiskCategory;
  categoryLabel: string;
  categoryColor: string;
  headline: string;
  explanation: string;
  diagnostics: {
    stp: number;
    scp: number;
    ehi1: number;
    ehi3: number;
    brn: number;
  };
};

const CATEGORY_META: Record<
  RiskCategory,
  { label: string; color: string }
> = {
  TSTM: { label: "General Thunderstorm Risk", color: "#8fbc8f" },
  MRGL: { label: "Marginal Risk", color: "#2e7d32" },
  SLGT: { label: "Slight Risk", color: "#fdd835" },
  ENH: { label: "Enhanced Risk", color: "#fb8c00" },
  MDT: { label: "Moderate Risk", color: "#e53935" },
  HIGH: { label: "High Risk", color: "#d500f9" },
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Linear ramp from 0 (at badAt) to 1 (at goodAt), clamped outside that range.
// Works whether badAt < goodAt or badAt > goodAt.
function ramp(value: number, badAt: number, goodAt: number): number {
  if (badAt === goodAt) return value >= goodAt ? 1 : 0;
  const t = (value - badAt) / (goodAt - badAt);
  return clamp(t, 0, 1);
}

const KT_TO_MS = 0.514444;

export function calculateTornadoOutlook(
  p: TornadoParameters
): OutlookResult {
  const shear06_ms = p.shear_0_6km * KT_TO_MS;

  // --- Significant Tornado Parameter (fixed-layer approximation) ---
  const lclTerm = ramp(p.lcl_height, 2000, 1000);
  const shearTerm = ramp(shear06_ms, 12.5, 30) * 1.5;
  const cinTerm = ramp(p.sbcin, 200, 50);
  const stp =
    (p.sbcape / 1500) * lclTerm * (p.srh_0_1km / 150) * shearTerm * cinTerm;

  // --- Supercell Composite Parameter (approximation) ---
  const ebwdTerm = ramp(shear06_ms, 10, 20);
  const scp = (p.mucape / 1000) * (p.srh_effective / 50) * ebwdTerm;

  // --- Energy-Helicity Index ---
  const ehi1 = (p.sbcape * p.srh_0_1km) / 160000;
  const ehi3 = (p.sbcape * p.srh_0_3km) / 160000;

  // --- Bulk Richardson Number (supercell-mode plausibility check) ---
  const brn = shear06_ms > 0 ? p.sbcape / (0.5 * shear06_ms * shear06_ms) : 999;

  const supercellLikely = brn >= 10 && brn <= 45 && scp >= 0.5;

  let category: RiskCategory;
  if (!supercellLikely) {
    category = stp > 0.5 ? "MRGL" : "TSTM";
  } else if (stp >= 4) {
    category = "HIGH";
  } else if (stp >= 2) {
    category = "MDT";
  } else if (stp >= 1) {
    category = "ENH";
  } else if (stp >= 0.5) {
    category = "SLGT";
  } else if (stp > 0.1) {
    category = "MRGL";
  } else {
    category = "TSTM";
  }

  const meta = CATEGORY_META[category];

  // --- Build a plain-English explanation from the driving factors ---
  const notes: string[] = [];

  if (!supercellLikely) {
    if (brn < 10) {
      notes.push(
        "deep-layer shear is strong relative to instability, favoring high-shear/low-CAPE or messy multicell modes over discrete supercells"
      );
    } else if (brn > 45) {
      notes.push(
        "shear is weak relative to instability, favoring pulse or unorganized multicell storms rather than sustained rotation"
      );
    } else {
      notes.push(
        "effective shear and helicity are too weak to support organized supercells"
      );
    }
  } else {
    if (p.lcl_height <= 1000) {
      notes.push("low LCL heights favor efficient tornadogenesis");
    } else if (p.lcl_height >= 1800) {
      notes.push(
        "elevated LCL heights work against tornado formation despite other supportive fields"
      );
    }

    if (p.srh_0_1km >= 250) {
      notes.push("very strong low-level helicity supports rapid low-level rotation");
    } else if (p.srh_0_1km <= 100) {
      notes.push("low-level helicity is on the weak side, limiting low-level rotation");
    }

    if (shear06_ms >= 20) {
      notes.push("ample deep-layer shear supports a well-organized, longer-lived storm");
    }

    if (p.sbcin >= 150) {
      notes.push(
        "strong capping may limit or delay storm initiation despite favorable parameters aloft"
      );
    }

    if (p.boundary_strength >= 6) {
      notes.push(
        "a well-defined surface boundary is enhancing low-level vorticity and focusing storm initiation"
      );
    }
  }

  const explanation =
    notes.length > 0
      ? `This setup shows ${notes.join("; ")}.`
      : "Parameters are relatively balanced with no single dominant factor.";

  const headline = supercellLikely
    ? `${meta.label}: ${
        category === "HIGH" || category === "MDT"
          ? "strong, potentially long-track tornadoes are possible"
          : category === "ENH" || category === "SLGT"
          ? "a few tornadoes are possible, mainly weak to moderate"
          : "isolated tornado risk with primarily non-tornadic supercell hazards"
      }`
    : `${meta.label}: organized tornado-producing supercells are not well supported by this combination`;

  return {
    category,
    categoryLabel: meta.label,
    categoryColor: meta.color,
    headline,
    explanation,
    diagnostics: { stp, scp, ehi1, ehi3, brn },
  };
}
