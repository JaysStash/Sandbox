-- ============================================================
-- Derechoes — parameter seed (genuinely distinct parameter set, not reused
-- tornado/supercell parameters, since a derecho's wind is driven by
-- different physics: a fast-moving bowing line, not a rotating cell)
-- Paste into Supabase → SQL Editor → New Query → Run. Safe to re-run.
-- ============================================================

alter table storm_parameter_definitions add column if not exists param_key text;

insert into storm_parameter_definitions
  (storm_type, category, param_key, name, description, min_value, max_value, default_value, unit, sort_order)
values
  ('derecho','Instability & Downdraft','mucape','Most-Unstable CAPE','Fuels new convection along the leading edge of the line as it advances.',0,5500,2000,'J/kg',1),
  ('derecho','Instability & Downdraft','dcape','Downdraft CAPE','The primary engine of derecho wind — stronger downdrafts mean harder-hitting gusts reaching the surface.',0,1800,1000,'J/kg',2),
  ('derecho','Instability & Downdraft','cape_0_3km','0-3km CAPE','Low-level instability that helps sustain the cold pool and gust front.',0,300,80,'J/kg',3),
  ('derecho','Instability & Downdraft','pwat','Precipitable Water','Total column moisture — more rain means a stronger evaporatively-cooled downdraft.',0.8,2.5,1.6,'in',4),

  ('derecho','Kinematics','shear_0_6km','0-6km Bulk Shear','Deep-layer shear needed to organize and maintain a bowing line rather than a disorganized cluster.',15,90,50,'kt',1),
  ('derecho','Kinematics','mean_wind_0_6km','0-6km Mean Wind Speed','Overall steering flow — drives how fast the system translates and how far the wind swath can extend.',10,80,40,'kt',2),
  ('derecho','Kinematics','rear_inflow_jet_ms','Rear-Inflow Jet Strength','A mid-level jet feeding into the back of the bow echo — the defining feature that brings the strongest winds down to the surface.',0,45,15,'m/s',3),
  ('derecho','Kinematics','line_perpendicular_shear','Line-Perpendicular Shear','Shear oriented across the convective line — key to whether the line bows outward or stays straight.',0,60,25,'kt',4),
  ('derecho','Kinematics','surface_wind_speed','Ambient Surface Wind Speed','Pre-storm surface wind — adds directly to the eventual peak gust when combined with outflow.',0,40,10,'kt',5),

  ('derecho','Thermodynamic Structure','lapse_rate_0_3km','Low-Level Lapse Rate (0-3km)','Steeper low-level cooling accelerates downdraft air more forcefully toward the surface.',5,10,7.5,'°C/km',1),
  ('derecho','Thermodynamic Structure','lapse_rate_700_500mb','700-500mb Lapse Rate','Mid-level instability contributing to overall convective intensity along the line.',5,9,7,'°C/km',2),
  ('derecho','Thermodynamic Structure','td_depression_700mb','700mb Dewpoint Depression','Dry air aloft sharply enhances evaporative cooling, intensifying the downdraft.',0,28,12,'°C',3),
  ('derecho','Thermodynamic Structure','freezing_level_height','Freezing Level Height','Contributes melting-driven cooling to the descending air.',1500,5000,3400,'m',4),

  ('derecho','System Factors','cold_pool_strength','Cold Pool Strength','The density current at the leading edge that continuously triggers new development — the engine that keeps the line alive.',0,10,5,'index (0-10)',1),
  ('derecho','System Factors','initial_organization','Initial Convective Organization','How organized the storms are at genesis — an isolated cluster of cells versus an already-established squall line.',0,10,4,'index (0-10)',2),
  ('derecho','System Factors','boundary_strength','Surface Boundary Strength','A nearby front or outflow boundary that helps focus and organize new development along the line.',0,10,3,'index (0-10)',3),
  ('derecho','System Factors','storm_motion_speed','System Motion Speed','How fast the whole line translates — faster-moving systems can cover much greater distances.',15,70,35,'kt',4),
  ('derecho','System Factors','system_length_km','Initial System Length','The length of the convective line at genesis — directly shapes how widespread the eventual wind damage swath becomes.',50,500,200,'km',5)

on conflict (storm_type, param_key) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  min_value = excluded.min_value,
  max_value = excluded.max_value,
  default_value = excluded.default_value,
  unit = excluded.unit,
  sort_order = excluded.sort_order;

-- ============================================================
-- DONE.
-- ============================================================
