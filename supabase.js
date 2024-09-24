import { createClient } from '@supabase/supabase-js';
import { SUPABASE_API_KEY } from '@env';

const supabaseUrl = 'https://wikzppkesqexudegjske.supabase.co';
const supabaseAnonKey = SUPABASE_API_KEY;  

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
