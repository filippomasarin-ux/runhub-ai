-- Add Strava OAuth token fields to profiles
alter table profiles
  add column if not exists strava_athlete_id bigint,
  add column if not exists strava_access_token text,
  add column if not exists strava_refresh_token text,
  add column if not exists strava_token_expires_at bigint;
