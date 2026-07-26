-- ============================================================
-- Hail Storms — parameter seed (third storm type, same rigor as Tornadoes)
-- Paste into Supabase → SQL Editor → New Query → Run
-- Safe to re-run.
-- ============================================================

insert into storm_parameter_definitions
  (storm_type, category, param_key, name, description, min_value, max_value, default_value, unit, sort_order)
values
  ('hail','Instability','sbcape','Surface-Based CAPE','Fuel for the updraft that carries hailstones through the growth zone. Stronger updrafts support larger, heavier stones before they fall out.',0,6000,1500,'J/kg',1),
  ('hail','Instability','mlcape','Mixed-Layer CAPE','A more representative measure of real-world instability using an averaged near-surface layer.',0,5500,1200,'J/kg',2),
  ('hail','Instability','mucape','Most-Unstable CAPE','Instability from the most unstable available parcel — often the best measure of true updraft potential for hail growth.',0,6500,1800,'J/kg',3),
  ('hail','Instability','cape_0_3km','0-3km CAPE','Low-level buoyancy contributing to a well-organized updraft base.',0,300,50,'J/kg',4),
  ('hail','Instability','dcape','Downdraft CAPE','Downdraft strength — influences how quickly precipitation, including hail, is evacuated from the storm.',0,1500,700,'J/kg',5),
  ('hail','Instability','sbcin','Surface-Based CIN','Suppression at the surface. Some cap allows more instability to build before storms fire, often supporting a stronger eventual updraft.',0,500,25,'J/kg',6),
  ('hail','Instability','mlcin','Mixed-Layer CIN','Mixed-layer suppression — similar role to surface CIN.',0,400,40,'J/kg',7),

  ('hail','Moisture','surface_dewpoint','Surface Dewpoint','Low-level moisture feeding instability.',40,80,65,'°F',1),
  ('hail','Moisture','pwat','Precipitable Water','Total column moisture — very high values can produce a wetter, less efficient hail-growth environment.',0.5,2.5,1.3,'in',2),
  ('hail','Moisture','td_depression_700mb','700mb Dewpoint Depression','Dry air aloft, which can enhance evaporative cooling and downdraft strength.',0,25,8,'°C',3),

  ('hail','Kinematics & Shear','shear_0_1km','0-1km Bulk Shear','Low-level wind change, supporting a tilted, organized updraft.',0,60,25,'kt',1),
  ('hail','Kinematics & Shear','shear_0_3km','0-3km Bulk Shear','Bridges low-level and deep-layer shear influences.',0,70,35,'kt',2),
  ('hail','Kinematics & Shear','shear_0_6km','0-6km Bulk Shear','Deep-layer shear — tilts the updraft so growing hailstones spend more time in the growth zone instead of falling straight through it.',0,90,45,'kt',3),
  ('hail','Kinematics & Shear','srh_0_1km','0-1km Storm-Relative Helicity','Low-level rotation — relevant to how organized and long-lived the parent storm is.',-100,600,150,'m²/s²',4),
  ('hail','Kinematics & Shear','srh_0_3km','0-3km Storm-Relative Helicity','Rotation over a deeper layer.',-100,700,250,'m²/s²',5),
  ('hail','Kinematics & Shear','srh_effective','Effective Storm-Relative Helicity','Storm-relative helicity within the effective inflow layer.',-100,600,200,'m²/s²',6),
  ('hail','Kinematics & Shear','llj_speed_850mb','850mb Low-Level Jet Speed','A strong low-level jet can enhance low-level shear and keep inflow moisture-rich.',0,80,30,'kt',7),
  ('hail','Kinematics & Shear','wind_speed_500mb','500mb Wind Speed','Mid-level wind speed — supports storm organization and translation speed.',10,100,45,'kt',8),

  ('hail','Thermodynamic Structure','lcl_height','Lifted Condensation Level Height','Cloud base height.',300,2500,1000,'m',1),
  ('hail','Thermodynamic Structure','lfc_height','Level of Free Convection','Height where a lifted parcel becomes buoyant on its own.',500,4000,1500,'m',2),
  ('hail','Thermodynamic Structure','el_height','Equilibrium Level Height','Storm top potential — a taller updraft generally supports larger hail.',5000,16000,11000,'m',3),
  ('hail','Thermodynamic Structure','lapse_rate_700_500mb','700-500mb Lapse Rate','Mid-level cooling rate — the single most important lapse rate for hail growth; steeper rates mean a more favorable growth zone.',5,9,7,'°C/km',4),
  ('hail','Thermodynamic Structure','lapse_rate_0_3km','Low-Level Lapse Rate (0-3km)','Low-level cooling rate, influencing near-surface buoyancy.',4,10,7.5,'°C/km',5),
  ('hail','Thermodynamic Structure','freezing_level_height','Freezing Level Height','Height where temperature crosses 0°C — lower freezing levels mean less time melting on the way down.',1000,5500,3500,'m',6),
  ('hail','Thermodynamic Structure','wet_bulb_zero_height','Wet-Bulb Zero Height','The single best predictor of surface hail size — lower values strongly favor larger stones reaching the ground intact.',1500,4500,2800,'m',7),
  ('hail','Thermodynamic Structure','cap_strength','Cap Strength (700mb inversion)','Strength of the warm layer aloft. Breaking a moderate cap explosively often produces the most intense, hail-favorable updrafts.',0,10,2,'°C',8),

  ('hail','Mesoscale Factors','boundary_strength','Surface Boundary Strength','A nearby front, outflow boundary, or dryline can help focus and intensify storm development.',0,10,3,'index (0-10)',1),
  ('hail','Mesoscale Factors','storm_motion_deviation','Storm Motion Deviation','How far the storm''s motion deviates from the mean wind — relates to how long an individual cell persists over one area.',0,30,15,'kt',2),
  ('hail','Mesoscale Factors','mixing_depth','Boundary Layer Mixing Depth','Depth of the daytime mixed layer.',500,3500,1500,'m',3)

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
