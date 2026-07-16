-- ============================================================
-- Phase 5 & 6 — Tornado parameter seed + Education glossary
-- Paste this entire file into Supabase → SQL Editor → New Query → Run
-- Safe to re-run.
-- ============================================================

-- Add a stable machine-readable key per parameter (the human-readable
-- "name" column can be edited freely later without breaking the app).
alter table storm_parameter_definitions add column if not exists param_key text;

create unique index if not exists storm_parameter_definitions_type_key_idx
  on storm_parameter_definitions (storm_type, param_key);

-- ------------------------------------------------------------
-- TORNADO PARAMETERS (29 total, across 5 categories)
-- ------------------------------------------------------------
insert into storm_parameter_definitions
  (storm_type, category, param_key, name, description, min_value, max_value, default_value, unit, sort_order)
values
  ('tornado','Instability','sbcape','Surface-Based CAPE','Buoyant energy available to a parcel lifted from the surface. Higher values mean stronger potential updrafts, but extreme values without adequate shear often produce disorganized pulse storms rather than tornadic supercells.',0,6000,1500,'J/kg',1),
  ('tornado','Instability','mlcape','Mixed-Layer CAPE','CAPE using an averaged near-surface layer instead of a single surface parcel — often a more representative measure of real-world instability than surface-based CAPE alone.',0,5500,1200,'J/kg',2),
  ('tornado','Instability','mucape','Most-Unstable CAPE','CAPE from the single most unstable parcel in the lowest levels, regardless of height. Useful when instability is elevated above a cooler surface layer.',0,6500,1800,'J/kg',3),
  ('tornado','Instability','cape_0_3km','0-3km CAPE','Low-level CAPE concentrated in the lowest 3km. Even small values here are meaningful for tornado potential since they measure buoyancy right where a developing tornado would need it.',0,300,50,'J/kg',4),
  ('tornado','Instability','dcape','Downdraft CAPE','Energy available to a descending parcel, driving downdraft and outflow strength. Very high values can produce outflow-dominant storms that struggle to sustain rotation.',0,1500,700,'J/kg',5),
  ('tornado','Instability','sbcin','Surface-Based CIN','The energy barrier (cap) a surface parcel must overcome to reach free convection. Shown as a magnitude — higher numbers mean a stronger cap suppressing storm initiation.',0,500,25,'J/kg',6),
  ('tornado','Instability','mlcin','Mixed-Layer CIN','Same concept as Surface-Based CIN, but using the mixed-layer parcel — often a more reliable suppression indicator during the heat of the day.',0,400,40,'J/kg',7),

  ('tornado','Moisture','surface_dewpoint','Surface Dewpoint','Near-surface moisture content. Higher dewpoints support greater instability and lower cloud bases (LCL) — both favorable for tornadoes.',40,80,65,'°F',1),
  ('tornado','Moisture','pwat','Precipitable Water','Total atmospheric moisture in a column. Very high values favor heavy rain and flash flooding; moderate values with strong shear favor classic supercells over high-precipitation storms.',0.5,2.5,1.3,'in',2),
  ('tornado','Moisture','td_depression_700mb','700mb Dewpoint Depression','A measure of dry air at mid-levels. Larger depressions (drier mid-levels) can enhance downdrafts and cell severity, but excessive dry air aloft can also erode storms.',0,25,8,'°C',3),

  ('tornado','Kinematics & Shear','shear_0_1km','0-1km Bulk Shear','Wind change through the lowest 1km. The single most important shear layer for tornado potential — strong low-level shear supports low-level rotation.',0,60,25,'kt',1),
  ('tornado','Kinematics & Shear','shear_0_3km','0-3km Bulk Shear','Wind change through the lowest 3km, bridging low-level and deep-layer shear influences on storm organization.',0,70,35,'kt',2),
  ('tornado','Kinematics & Shear','shear_0_6km','0-6km Bulk Shear','Deep-layer shear — the classic supercell discriminator. Values above roughly 35-40kt strongly favor sustained, organized rotating storms.',0,90,45,'kt',3),
  ('tornado','Kinematics & Shear','srh_0_1km','0-1km Storm-Relative Helicity','Measures streamwise vorticity available to a storm''s inflow in the lowest 1km — the single strongest statistical discriminator for tornado potential, especially significant/violent tornadoes.',-100,600,150,'m²/s²',4),
  ('tornado','Kinematics & Shear','srh_0_3km','0-3km Storm-Relative Helicity','Same concept over a deeper layer, useful for assessing the broader mesocyclone''s rotational potential.',-100,700,250,'m²/s²',5),
  ('tornado','Kinematics & Shear','srh_effective','Effective Storm-Relative Helicity','Storm-relative helicity calculated only within the effective inflow layer — accounts for elevated or capped scenarios where the classic 0-1km/0-3km layers aren''t representative.',-100,600,200,'m²/s²',6),
  ('tornado','Kinematics & Shear','llj_speed_850mb','850mb Low-Level Jet Speed','A strong nocturnal low-level jet enhances low-level shear and moisture transport — a classic ingredient in Plains nocturnal tornado outbreaks.',0,80,30,'kt',7),
  ('tornado','Kinematics & Shear','wind_speed_500mb','500mb Wind Speed','Mid-level wind speed. Strong mid-level flow supports storm organization and can indicate a favorable upper-level trough/jet streak setup.',10,100,45,'kt',8),

  ('tornado','Thermodynamic Structure','lcl_height','Lifted Condensation Level Height','Height of the cloud base. Lower LCL heights (under ~1000m) are one of the strongest indicators of tornado potential — they shorten the distance a developing funnel needs to reach the ground.',300,2500,1000,'m',1),
  ('tornado','Thermodynamic Structure','lfc_height','Level of Free Convection','Height at which a lifted parcel becomes buoyant on its own. Lower values mean storms initiate more easily once triggered.',500,4000,1500,'m',2),
  ('tornado','Thermodynamic Structure','el_height','Equilibrium Level Height','Height where a rising parcel loses buoyancy — roughly marks the storm top / anvil level. Higher EL heights often mean stronger, taller updrafts.',5000,16000,11000,'m',3),
  ('tornado','Thermodynamic Structure','lapse_rate_700_500mb','700-500mb Lapse Rate','Mid-level cooling rate with height. Steeper lapse rates increase instability and are a classic ingredient in significant severe weather setups.',5,9,7,'°C/km',4),
  ('tornado','Thermodynamic Structure','lapse_rate_0_3km','Low-Level Lapse Rate (0-3km)','Low-level cooling rate with height, influencing low-level buoyancy and how quickly parcels accelerate near the surface.',4,10,7.5,'°C/km',5),
  ('tornado','Thermodynamic Structure','freezing_level_height','Freezing Level Height','Height where temperature crosses 0°C. Lower freezing levels generally support larger hail since less melting occurs on the way down.',1000,5500,3500,'m',6),
  ('tornado','Thermodynamic Structure','wet_bulb_zero_height','Wet-Bulb Zero Height','Similar to freezing level but accounting for evaporative cooling — a refined hail-size predictor and general thermal profile indicator.',1500,4500,2800,'m',7),
  ('tornado','Thermodynamic Structure','cap_strength','Cap Strength (700mb inversion)','Strength of the warm layer aloft suppressing convection. A moderate cap can allow instability to build through the day; too strong a cap can prevent storms from firing at all, while a cap that breaks explosively can produce more intense, longer-lived storms.',0,10,2,'°C',8),

  ('tornado','Mesoscale Factors','boundary_strength','Surface Boundary Strength','Strength of a front, outflow boundary, or dryline in the storm''s environment. Stronger boundaries enhance and focus low-level vorticity, a key ingredient in many tornado events.',0,10,3,'index (0-10)',1),
  ('tornado','Mesoscale Factors','storm_motion_deviation','Storm Motion Deviation','How far a storm''s actual motion deviates from the mean wind (right-moving supercells classically deviate to the right). Greater deviation typically means better sustained inflow and longer-lived rotation.',0,30,15,'kt',2),
  ('tornado','Mesoscale Factors','mixing_depth','Boundary Layer Mixing Depth','Depth of the daytime mixed layer. Influences how surface-based instability and moisture are realized through the lower atmosphere.',500,3500,1500,'m',3)

on conflict (storm_type, param_key) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  min_value = excluded.min_value,
  max_value = excluded.max_value,
  default_value = excluded.default_value,
  unit = excluded.unit,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- GLOSSARY (Education page general terms — only seeded if missing)
-- ------------------------------------------------------------
insert into site_content (key, content) values (
  'glossary',
  '[
    {"question":"dBZ","answer":"A unit measuring radar reflectivity — essentially how much energy bounces back to the radar off precipitation or debris. Higher dBZ generally means heavier precipitation or larger hail."},
    {"question":"Mesocyclone","answer":"A rotating column of air within a supercell thunderstorm, typically several miles wide, that can sometimes tighten into a tornado."},
    {"question":"Wall Cloud","answer":"A lowered, often rotating cloud beneath a storm''s main base, marking the area of strongest inflow and rotation — frequently the area to watch for tornado development."},
    {"question":"Hook Echo","answer":"A hook-shaped appendage on radar reflectivity, associated with a supercell''s rear-flank downdraft wrapping around the mesocyclone — a classic tornado-warning signature."},
    {"question":"Rear-Flank Downdraft (RFD)","answer":"A downdraft that wraps around the back side of a mesocyclone, often playing a key role in tornado formation and intensification."},
    {"question":"Bow Echo","answer":"A bow-shaped line of thunderstorms on radar, associated with damaging straight-line winds and sometimes embedded rotation."},
    {"question":"Derecho","answer":"A widespread, long-lived windstorm associated with a fast-moving band of severe thunderstorms, capable of producing damage similar to a hurricane over a large area."},
    {"question":"Haboob","answer":"A wall of dust or sand kicked up by a thunderstorm''s outflow, common in arid regions, that can dramatically reduce visibility in minutes."},
    {"question":"Squall Line","answer":"A line of thunderstorms, often producing damaging straight-line winds along its leading edge."},
    {"question":"Microburst","answer":"A concentrated, intense downdraft affecting a small area, capable of producing winds as strong as a tornado but without rotation."},
    {"question":"Downburst","answer":"A broader version of a microburst — a strong, damaging downdraft covering a wider area."},
    {"question":"Eyewall","answer":"The ring of intense thunderstorms surrounding the calm eye of a hurricane, typically home to the storm''s strongest winds."},
    {"question":"Storm Surge","answer":"Abnormal rise in sea level during a storm, caused primarily by wind pushing water onshore — often a hurricane''s deadliest hazard."},
    {"question":"Virga","answer":"Precipitation that evaporates before reaching the ground, often visible as streaks beneath a cloud base."},
    {"question":"Overshooting Top","answer":"A dome-like bulge above a thunderstorm''s anvil, indicating a particularly strong updraft."},
    {"question":"Anvil","answer":"The flat, spread-out top of a mature thunderstorm, formed where the updraft hits the stable stratosphere and spreads horizontally."},
    {"question":"Updraft / Downdraft","answer":"The rising and sinking currents of air within a thunderstorm that drive its growth, precipitation, and eventual decay."},
    {"question":"Vorticity","answer":"A measure of local spin in the atmosphere — the underlying ingredient that, under the right conditions, can be stretched and tightened into a tornado."}
  ]'::jsonb
) on conflict (key) do nothing;

-- ============================================================
-- DONE.
-- ============================================================
