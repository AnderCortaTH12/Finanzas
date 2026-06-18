import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Aviso en consola si faltan las variables de entorno (.env).
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en tu archivo .env',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('[supabase] VITE_SUPABASE_URL:', supabaseUrl ? 'definida' : 'UNDEFINED');
console.log('[supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'definida' : 'UNDEFINED');
