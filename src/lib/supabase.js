import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yvtzzhcjwoppcskprmee.supabase.co';
const supabasePublishableKey = 'sb_publishable_m7K7O_vvZ67RhHC_8cDfZA_8AuecxxV';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);