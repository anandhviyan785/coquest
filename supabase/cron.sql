-- Runs the reminder emails once a day. Fill in the two placeholders, then run this in the SQL editor.
-- Needs the pg_cron and pg_net extensions (Database → Extensions in the Supabase dashboard).
--   <PROJECT_REF>  your project ref, from the project URL https://<PROJECT_REF>.supabase.co
--   <CRON_SECRET>  the same value you set with `supabase secrets set CRON_SECRET=...`
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Keep the secret in Vault rather than in the job text.
select vault.create_secret('<CRON_SECRET>', 'pyquest_cron_secret');

select cron.schedule(
  'pyquest-reminders',
  '0 16 * * *', -- every day at 16:00 UTC
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'pyquest_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
