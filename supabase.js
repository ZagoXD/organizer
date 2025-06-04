import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';  

const supabaseUrl = 'https://wikzppkesqexudegjske.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpa3pwcGtlc3FleHVkZWdqc2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxMTAxMzYsImV4cCI6MjA0MjY4NjEzNn0._XW0DzNvE0UfKfVwgldyaMZuKBrfaiZQjYoYhZmjctw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, 
  },
});
