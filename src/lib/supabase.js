import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.https://yvtzzhcjwoppcskprmee.supabase.co/rest/v1/;
const supabasePublishableKey = import.meta.env.sb_publishable_m7K7O_vvZ67RhHC_8cDfZA_8AuecxxV;

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);