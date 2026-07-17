-- ============================================================
-- Phase 8 — Badges seed
-- Paste this entire file into Supabase → SQL Editor → New Query → Run
-- Safe to re-run.
-- ============================================================

create unique index if not exists badges_name_idx on badges (name);

insert into badges (name, description, icon, tier, animation_style, criteria, is_active)
values
  ('First Storm', 'Created your very first storm.', 'Cloud', 'bronze', 'glow',
    '{"type":"storm_count","count":1}'::jsonb, true),

  ('Storm Chaser', 'Created 10 storms.', 'Wind', 'silver', 'glow',
    '{"type":"storm_count","count":10}'::jsonb, true),

  ('Storm Master', 'Created 50 storms.', 'Trophy', 'gold', 'shimmer',
    '{"type":"storm_count","count":50}'::jsonb, true),

  ('Tornado Alley', 'Created a Tornado.', 'Tornado', 'bronze', 'glow',
    '{"type":"storm_type_used","storm_type":"tornado"}'::jsonb, true),

  ('High Risk Taker', 'Produced a Moderate or High risk outlook.', 'Flame', 'silver', 'glow',
    '{"type":"risk_category_reached","categories":["MDT","HIGH"]}'::jsonb, true),

  ('Violent Outbreak', 'Produced a High risk outlook.', 'Zap', 'legendary', 'shimmer',
    '{"type":"risk_category_reached","categories":["HIGH"]}'::jsonb, true),

  ('Full Sandbox Explorer', 'Created a storm in Full Sandbox Mode.', 'Sparkles', 'gold', 'shimmer',
    '{"type":"storm_type_used","storm_type":"full-sandbox"}'::jsonb, true),

  ('First Review', 'Left your first rating.', 'Star', 'bronze', 'glow',
    '{"type":"rating_given"}'::jsonb, true),

  ('Five Star Fan', 'Left a 5-star rating.', 'Heart', 'silver', 'glow',
    '{"type":"rating_value","stars":5}'::jsonb, true),

  ('Region Explorer', 'Created storms in 3 different regions.', 'Map', 'silver', 'glow',
    '{"type":"unique_regions","count":3}'::jsonb, true),

  ('Storm Historian', 'Created storms in 5 different regions.', 'BookOpen', 'gold', 'shimmer',
    '{"type":"unique_regions","count":5}'::jsonb, true),

  ('Early Adopter', 'Awarded manually to early supporters of the app.', 'Rocket', 'legendary', 'shimmer',
    '{"type":"manual"}'::jsonb, true),

  ('Referral Rookie', 'Referred your first friend.', 'UserPlus', 'bronze', 'glow',
    '{"type":"manual"}'::jsonb, true)

on conflict (name) do update set
  description = excluded.description,
  icon = excluded.icon,
  tier = excluded.tier,
  animation_style = excluded.animation_style,
  criteria = excluded.criteria,
  is_active = excluded.is_active;

-- ============================================================
-- DONE.
-- Notes:
-- - "storm_count", "storm_type_used", "risk_category_reached",
--   "rating_given", "rating_value", and "unique_regions" are checked
--   automatically after you save a storm or submit a rating.
-- - "manual" criteria badges (Early Adopter, Referral Rookie) are not
--   auto-awarded yet. Referral Rookie will be wired up automatically once
--   the Refer page (Phase 9) is built. Until then, or for Early Adopter,
--   grant them by hand:
--   insert into user_badges (user_id, badge_id)
--   select
--     (select id from auth.users where email = 'someone@example.com'),
--     (select id from badges where name = 'Early Adopter');
-- ============================================================
