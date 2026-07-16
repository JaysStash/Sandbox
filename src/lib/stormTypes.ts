export type StormType = {
  slug: string;
  name: string;
  description: string;
  available: boolean;
};

// The full launch list. "available: true" means the exhaustive parameter set
// and outlook engine exist for it already. Everything else is queued next,
// each getting the same full treatment before it's marked available.
export const STORM_TYPES: StormType[] = [
  {
    slug: "tornado",
    name: "Tornadoes",
    description:
      "Tune low-level shear, helicity, and boundary interactions to control tornado likelihood, intensity, and track.",
    available: true,
  },
  {
    slug: "supercell",
    name: "Supercells",
    description:
      "Build the parent thunderstorm structure — mesocyclone strength, hail potential, and wind threat.",
    available: false,
  },
  {
    slug: "haboob",
    name: "Haboobs",
    description:
      "Control outflow strength, dust source dryness, and gust front dynamics.",
    available: false,
  },
  {
    slug: "hurricane",
    name: "Hurricanes",
    description:
      "Sea surface temps, wind shear, and moisture drive intensity and storm surge potential.",
    available: false,
  },
  {
    slug: "derecho",
    name: "Derechoes",
    description:
      "Long-lived bow echoes and widespread wind damage from a fast-moving MCS.",
    available: false,
  },
  {
    slug: "lightning",
    name: "Lightning Storms",
    description: "Electrification potential and strike frequency and density.",
    available: false,
  },
  {
    slug: "hail",
    name: "Hail Storms",
    description:
      "Updraft strength and freezing-level height drive maximum hail size.",
    available: false,
  },
  {
    slug: "flash-flood",
    name: "Flash Floods",
    description:
      "Training storms, rainfall rates, and terrain-driven runoff potential.",
    available: false,
  },
  {
    slug: "blizzard",
    name: "Blizzards",
    description:
      "Cold air depth, moisture, and wind combine for snowfall rate and visibility.",
    available: false,
  },
  {
    slug: "full-sandbox",
    name: "Full Sandbox Mode",
    description:
      "Every parameter from every storm type, fully unlocked. No guardrails.",
    available: false,
  },
];

export function getStormType(slug: string): StormType | undefined {
  return STORM_TYPES.find((s) => s.slug === slug);
}

// Practical launch region list - plain-text labels for now (real terrain +
// population-weighted modeling comes with Phase 6.4 / the stats page).
export const REGIONS = [
  "Southern Plains (TX/OK/KS)",
  "Central Plains (NE/IA/eastern CO)",
  "Northern Plains (ND/SD/MN)",
  "Upper Midwest (WI/MI/northern IL)",
  "Ohio Valley (OH/IN/KY)",
  "Mid-South / Dixie Alley (AR/MS/AL/TN)",
  "Southeast (GA/SC/FL panhandle)",
  "Mid-Atlantic (VA/NC/MD)",
  "Northeast (PA/NY/New England)",
  "Gulf Coast (LA/coastal MS-AL)",
  "Florida Peninsula",
  "Rocky Mountain Front Range (CO/WY)",
  "Desert Southwest (AZ/NM)",
  "California",
  "Pacific Northwest (WA/OR)",
];
