-- 20261123000000_add_auto_support.sql
-- Allow clip_duration = 0 (Auto duration: AI chooses optimal natural length)
-- and requested_clips = 0 (Auto clips: AI scales number of clips to video length)

COMMENT ON COLUMN public.jobs.clip_duration IS 'Target duration in seconds: 0 for Auto, or 15, 30, 45, 60';
COMMENT ON COLUMN public.jobs.requested_clips IS 'Number of clips: 0 for Auto, or 1, 3, 5, 10';
