-- ============================================================
-- Supercells — parameter seed (second storm type, same rigor as Tornadoes)
-- Paste into Supabase → SQL Editor → New Query → Run
-- Safe to re-run.
-- ============================================================

insert into storm_parameter_definitions
  (storm_type, category, param_key, name, description, min_value, max_value, default_value, unit, sort_order)
values
  ('supercell','Instability','sbcape','Surface-Based CAPE','Buoyant energy driving the storm''s main updraft. Higher values support taller, stronger updrafts capable of producing large hail and severe wind gusts.',0,6000,1500,'J/kg',1),
  ('supercell','Instability','mlcape','Mixed-Layer CAPE','A more representative measure of real-world instability using an averaged near-surface layer — drives overall storm intensity.',0,5500,1200,'J/kg',2),
  ('supercell','Instability','mucape','Most-Unstable CAPE','Instability from the most unstable available parcel, often elevated above a cooler surface layer — relevant when the best instability isn''t at the surface.',0,6500,1800,'J/kg',3),
  ('supercell','Instability','cape_0_3km','0-3km CAPE','Low-level buoyancy. Contributes to a well-organized low-level updraft and mesocyclone.',0,300,50,'J/kg',4),
  ('supercell','Instability','dcape','Downdraft CAPE','Downdraft strength — a major driver of damaging straight-line wind potential from the storm''s core and rear-flank downdraft.',0,1500,700,'J/kg',5),
  ('supercell','Instability','sbcin','Surface-Based CIN','Suppression at the surface. Some cap helps storms stay isolated and better organized rather than messy and clustered.',0,500,25,'J/kg',6),
  ('supercell','Instability','mlcin','Mixed-Layer CIN','Mixed-layer suppression — similar role to surface CIN, often the more reliable measure during peak heating.',0,400,40,'J/kg',7),

  ('supercell','Moisture','surface_dewpoint','Surface Dewpoint','Low-level moisture. Higher dewpoints support greater instability and richer inflow.',40,80,65,'°F',1),
  ('supercell','Moisture','pwat','Precipitable Water','Total column moisture. High values support heavy rain and an efficient hail-growth environment; very high values can also produce an outflow-dominant, less organized storm.',0.5,2.5,1.3,'in',2),
  ('supercell','Moisture','td_depression_700mb','700mb Dewpoint Depression','Dry air aloft. Enhances downdrafts and can sharpen a storm''s outflow and wind threat.',0,25,8,'°C',3),

  ('supercell','Kinematics & Shear','shear_0_1km','0-1km Bulk Shear','Low-level wind change. Supports a well-organized, rotating low-level updraft.',0,60,25,'kt',1),
  ('supercell','Kinematics & Shear','shear_0_3km','0-3km Bulk Shear','Bridges low-level and deep-layer shear influences on the storm''s overall structure.',0,70,35,'kt',2),
  ('supercell','Kinematics & Shear','shear_0_6km','0-6km Bulk Shear','Deep-layer shear — the classic discriminator between organized supercells and short-lived, disorganized storms.',0,90,45,'kt',3),
  ('supercell','Kinematics & Shear','srh_0_1km','0-1km Storm-Relative Helicity','Low-level rotation available to the storm — drives mesocyclone strength near the ground.',-100,600,150,'m²/s²',4),
  ('supercell','Kinematics & Shear','srh_0_3km','0-3km Storm-Relative Helicity','Rotation over a deeper layer — relates to the broader mesocyclone''s overall strength.',-100,700,250,'m²/s²',5),
  ('supercell','Kinematics & Shear','srh_effective','Effective Storm-Relative Helicity','Storm-relative helicity within the effective inflow layer — a more complete measure of the rotation the storm can actually use.',-100,600,200,'m²/s²',6),
  ('supercell','Kinematics & Shear','llj_speed_850mb','850mb Low-Level Jet Speed','A strong low-level jet enhances low-level shear and keeps inflow rich in moisture — often a nocturnal severe weather ingredient.',0,80,30,'kt',7),
  ('supercell','Kinematics & Shear','wind_speed_500mb','500mb Wind Speed','Mid-level wind speed. Strong mid-level flow supports better storm organization and precipitation efficiency.',10,100,45,'kt',8),

  ('supercell','Thermodynamic Structure','lcl_height','Lifted Condensation Level Height','Cloud base height. Lower values are generally more favorable for a well-organized low-level mesocyclone.',300,2500,1000,'m',1),
  ('supercell','Thermodynamic Structure','lfc_height','Level of Free Convection','Height where a lifted parcel becomes buoyant on its own. Lower values mean storms fire more readily once triggered.',500,4000,1500,'m',2),
  ('supercell','Thermodynamic Structure','el_height','Equilibrium Level Height','Storm top potential. Higher values generally mean a taller, stronger updraft capable of larger hail.',5000,16000,11000,'m',3),
  ('supercell','Thermodynamic Structure','lapse_rate_700_500mb','700-500mb Lapse Rate','Mid-level cooling rate — steeper lapse rates boost instability and updraft strength, a key ingredient for large hail.',5,9,7,'°C/km',4),
  ('supercell','Thermodynamic Structure','lapse_rate_0_3km','Low-Level Lapse Rate (0-3km)','Low-level cooling rate — influences how quickly parcels accelerate near the surface.',4,10,7.5,'°C/km',5),
  ('supercell','Thermodynamic Structure','freezing_level_height','Freezing Level Height','Height where temperature crosses 0°C. Lower freezing levels generally support larger hail, since stones spend less time melting on the way down.',1000,5500,3500,'m',6),
  ('supercell','Thermodynamic Structure','wet_bulb_zero_height','Wet-Bulb Zero Height','A refined hail-size predictor accounting for evaporative cooling — lower values favor larger hail reaching the ground.',1500,4500,2800,'m',7),
  ('supercell','Thermodynamic Structure','cap_strength','Cap Strength (700mb inversion)','Strength of the warm layer aloft. A moderate cap lets instability build through the day; breaking explosively can produce a sudden, intense updraft.',0,10,2,'°C',8),

  ('supercell','Mesoscale Factors','boundary_strength','Surface Boundary Strength','Strength of a nearby front, outflow boundary, or dryline — can help focus and organize storm development.',0,10,3,'index (0-10)',1),
  ('supercell','Mesoscale Factors','storm_motion_deviation','Storm Motion Deviation','How far the storm''s motion deviates from the mean wind. Greater deviation typically supports a longer-lived, better-organized updraft.',0,30,15,'kt',2),
  ('supercell','Mesoscale Factors','mixing_depth','Boundary Layer Mixing Depth','Depth of the daytime mixed layer — influences how surface instability and moisture translate into the storm''s environment.',500,3500,1500,'m',3)

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
