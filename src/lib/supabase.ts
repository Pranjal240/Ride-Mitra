import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Show a visible error in the DOM instead of crashing the entire app silently
  const msg = 'Ride Mitra: Missing Supabase configuration. Please check environment variables.';
  console.error(msg);
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.getElementById('root');
      if (el) {
        el.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F8F6F1;font-family:'Inter',sans-serif;padding:24px"><div style="text-align:center;max-width:400px"><h1 style="font-size:24px;font-weight:700;color:#2B2D42;margin-bottom:12px">Configuration Error</h1><p style="color:#6C6E7E;font-size:14px;line-height:1.6">Unable to connect to the server. Please try refreshing the page or contact support.</p><button onclick="location.reload()" style="margin-top:20px;padding:12px 28px;border-radius:12px;border:none;background:linear-gradient(135deg,#1B2B4B,#2C4A7C);color:white;font-weight:600;cursor:pointer;font-size:14px">Retry</button></div></div>`;
      }
    });
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
