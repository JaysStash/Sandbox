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
  supercellLikely: boolean;
  diagnostics: {
    stp: number;
    scp: number;
    ehi1: number;
    ehi3: number;
    brn: number;
    hailInches?: number;
    gustMph?: number;
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
    supercellLikely,
    diagnostics: { stp, scp, ehi1, ehi3, brn },
  };
}

// ============================================================
// Supercell Outlook Engine
// Uses the same atmospheric parameters as the Tornado engine, but weights
// them toward general supercell organization, large hail, and damaging
// wind - not tornado-specific genesis ingredients. Driven primarily by the
// Supercell Composite Parameter rather than STP.
// ============================================================

export type SupercellOutlookResult = {
  category: RiskCategory;
  categoryLabel: string;
  categoryColor: string;
  headline: string;
  explanation: string;
  organizedModeLikely: boolean;
  diagnostics: {
    scp: number;
    brn: number;
    estimatedHailInches: number;
    estimatedGustMph: number;
  };
};

function estimateHailInches(p: TornadoParameters): number {
  const capeTerm = clamp(p.mucape / 4000, 0, 1.3);
  const lapseTerm = clamp((p.lapse_rate_700_500mb - 6) / 3, 0, 1);
  const meltTerm = clamp((3500 - p.wet_bulb_zero_height) / 2000, 0, 1);
  const shearTerm = clamp(p.shear_0_6km / 50, 0.3, 1);
  const growthScore = capeTerm * 0.5 + lapseTerm * 0.2 + meltTerm * 0.2 + shearTerm * 0.1;
  return clamp(growthScore * 4.5, 0, 4.5);
}

function estimateGustMph(p: TornadoParameters): number {
  const dcapeTerm = clamp(p.dcape / 1200, 0, 1.2);
  const dryTerm = clamp(p.td_depression_700mb / 20, 0.3, 1);
  const shearTerm = clamp(p.shear_0_6km / 50, 0.3, 1);
  const gustScore = dcapeTerm * 0.55 + dryTerm * 0.25 + shearTerm * 0.2;
  return 25 + clamp(gustScore, 0, 1.3) * 70; // roughly 25-115 mph range
}

export function calculateSupercellOutlook(
  p: TornadoParameters
): SupercellOutlookResult {
  const shear06_ms = p.shear_0_6km * KT_TO_MS;
  const ebwdTerm = ramp(shear06_ms, 10, 20);
  const scp = (p.mucape / 1000) * (p.srh_effective / 50) * ebwdTerm;
  const brn = shear06_ms > 0 ? p.sbcape / (0.5 * shear06_ms * shear06_ms) : 999;
  const organizedModeLikely = brn >= 8 && brn <= 55 && scp >= 0.4;

  const estimatedHailInches = estimateHailInches(p);
  const estimatedGustMph = estimateGustMph(p);
  const hazardScore = Math.max(estimatedHailInches / 2.5, (estimatedGustMph - 25) / 65);

  let category: RiskCategory;
  if (!organizedModeLikely) {
    category = hazardScore > 0.3 ? "MRGL" : "TSTM";
  } else if (scp >= 6 || hazardScore >= 1.1) {
    category = "HIGH";
  } else if (scp >= 3 || hazardScore >= 0.85) {
    category = "MDT";
  } else if (scp >= 1.5 || hazardScore >= 0.6) {
    category = "ENH";
  } else if (scp >= 0.5 || hazardScore >= 0.35) {
    category = "SLGT";
  } else if (scp > 0.1) {
    category = "MRGL";
  } else {
    category = "TSTM";
  }

  const meta = CATEGORY_META[category];
  const notes: string[] = [];

  if (!organizedModeLikely) {
    notes.push(
      brn < 8
        ? "shear is overwhelming relative to instability, favoring high-shear/low-CAPE messy convection over a discrete supercell"
        : brn > 55
        ? "instability is high relative to shear, favoring pulse or multicell storms over a sustained supercell"
        : "effective shear is too weak to organize and maintain a supercell updraft"
    );
  } else {
    if (estimatedHailInches >= 1.5) {
      notes.push("strong instability and mid-level lapse rates support significant large hail");
    } else if (estimatedHailInches >= 1) {
      notes.push("conditions support hail at or above the severe threshold");
    }
    if (estimatedGustMph >= 70) {
      notes.push("strong downdraft potential and dry mid-level air support damaging wind gusts");
    }
    if (p.shear_0_6km >= 45) {
      notes.push("ample deep-layer shear supports a well-organized, longer-lived storm");
    }
  }

  const explanation =
    notes.length > 0
      ? `This setup shows ${notes.join("; ")}.`
      : "Parameters are relatively balanced with no single dominant hazard.";

  const headline = organizedModeLikely
    ? `${meta.label}: expect up to ${estimatedHailInches.toFixed(1)}" hail and gusts near ${Math.round(
        estimatedGustMph
      )} mph from an organized supercell`
    : `${meta.label}: a sustained, well-organized supercell is not well supported by this combination`;

  return {
    category,
    categoryLabel: meta.label,
    categoryColor: meta.color,
    headline,
    explanation,
    organizedModeLikely,
    diagnostics: { scp, brn, estimatedHailInches, estimatedGustMph },
  };
}

// ============================================================
// Hail Storm Outlook Engine
// Same underlying parameters, weighted specifically toward hail growth
// physics: updraft strength, mid-level lapse rates, and melting layer depth.
// ============================================================

export type HailOutlookResult = {
  category: RiskCategory;
  categoryLabel: string;
  categoryColor: string;
  headline: string;
  explanation: string;
  organizedModeLikely: boolean;
  diagnostics: {
    estimatedHailInches: number;
    brn: number;
  };
};

export function calculateHailOutlook(p: TornadoParameters): HailOutlookResult {
  const shear06_ms = p.shear_0_6km * KT_TO_MS;
  const brn = shear06_ms > 0 ? p.sbcape / (0.5 * shear06_ms * shear06_ms) : 999;
  const organizedModeLikely = brn >= 6 && brn <= 60 && p.shear_0_6km >= 20;

  const estimatedHailInches = estimateHailInches(p);

  let category: RiskCategory;
  if (!organizedModeLikely) {
    category = estimatedHailInches > 0.5 ? "MRGL" : "TSTM";
  } else if (estimatedHailInches >= 2.75) {
    category = "HIGH";
  } else if (estimatedHailInches >= 2.0) {
    category = "MDT";
  } else if (estimatedHailInches >= 1.5) {
    category = "ENH";
  } else if (estimatedHailInches >= 1.0) {
    category = "SLGT";
  } else if (estimatedHailInches >= 0.75) {
    category = "MRGL";
  } else {
    category = "TSTM";
  }

  const meta = CATEGORY_META[category];
  const notes: string[] = [];

  if (!organizedModeLikely) {
    notes.push(
      "deep-layer shear is too weak to organize and sustain a hail-producing updraft"
    );
  } else {
    if (p.mucape >= 3000) {
      notes.push("very strong instability supports a powerful, sustained hail-growth updraft");
    }
    if (p.lapse_rate_700_500mb >= 7.5) {
      notes.push("steep mid-level lapse rates enhance the hail-growth zone");
    }
    if (p.wet_bulb_zero_height <= 2600) {
      notes.push("a low wet-bulb zero height limits melting on the way down, favoring larger stones reaching the ground");
    } else if (p.wet_bulb_zero_height >= 3800) {
      notes.push("a high wet-bulb zero height means more melting time, limiting hail size at the surface despite other favorable factors");
    }
  }

  const explanation =
    notes.length > 0
      ? `This setup shows ${notes.join("; ")}.`
      : "Parameters are relatively balanced with no single dominant factor.";

  const headline = organizedModeLikely
    ? `${meta.label}: hail up to ${estimatedHailInches.toFixed(1)}" in diameter is possible`
    : `${meta.label}: a sustained hail-producing updraft is not well supported by this combination`;

  return {
    category,
    categoryLabel: meta.label,
    categoryColor: meta.color,
    headline,
    explanation,
    organizedModeLikely,
    diagnostics: { estimatedHailInches, brn },
  };
}

// ============================================================
// Adapters + dispatcher so the shared Sandbox/Radar UI can work with any
// storm type's specialized outlook engine without needing to know its
// internal shape. The radar physics engine and storm track generator only
// ever read `category` and `supercellLikely` from this common shape.
// ============================================================

export function supercellToOutlookResult(
  r: SupercellOutlookResult
): OutlookResult {
  return {
    category: r.category,
    categoryLabel: r.categoryLabel,
    categoryColor: r.categoryColor,
    headline: r.headline,
    explanation: r.explanation,
    supercellLikely: r.organizedModeLikely,
    diagnostics: {
      stp: 0,
      scp: r.diagnostics.scp,
      ehi1: 0,
      ehi3: 0,
      brn: r.diagnostics.brn,
      hailInches: r.diagnostics.estimatedHailInches,
      gustMph: r.diagnostics.estimatedGustMph,
    },
  };
}

export function hailToOutlookResult(r: HailOutlookResult): OutlookResult {
  return {
    category: r.category,
    categoryLabel: r.categoryLabel,
    categoryColor: r.categoryColor,
    headline: r.headline,
    explanation: r.explanation,
    supercellLikely: r.organizedModeLikely,
    diagnostics: {
      stp: 0,
      scp: 0,
      ehi1: 0,
      ehi3: 0,
      brn: r.diagnostics.brn,
      hailInches: r.diagnostics.estimatedHailInches,
    },
  };
}

export function calculateOutlookForType(
  stormType: string,
  parameters: TornadoParameters
): OutlookResult {
  if (stormType === "supercell") {
    return supercellToOutlookResult(calculateSupercellOutlook(parameters));
  }
  if (stormType === "hail") {
    return hailToOutlookResult(calculateHailOutlook(parameters));
  }
  return calculateTornadoOutlook(parameters);
}
