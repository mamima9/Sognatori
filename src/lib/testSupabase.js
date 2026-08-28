import { supabase } from './supabase';

supabase
  .from('test_connection')
  .select('*')
  .then(({ data, error }) => {
    console.log('SUPABASE TEST:', { data, error });
  });