import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to normalize Supabase project ID / domain into a valid HTTPS URL
export function normalizeSupabaseUrl(url?: string): string {
  const fallback = 'https://tnvrsfezqkrfnhorarkb.supabase.co';
  if (!url) return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return fallback;
    }
  }

  if (trimmed.includes('.')) {
    try {
      const withHttps = `https://${trimmed}`;
      new URL(withHttps);
      return withHttps;
    } catch {
      return fallback;
    }
  }

  // If provided as just the project ID/ref (e.g. "tnvrsfezqkrfnhorarkb")
  try {
    const constructed = `https://${trimmed}.supabase.co`;
    new URL(constructed);
    return constructed;
  } catch {
    return fallback;
  }
}

// Fallback anon key provided for the project
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudnJzZmV6cWtyZm5ob3JhcmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjcxNjIsImV4cCI6MjEwNTc0MzE2Mn0.niPqQxtMYGsQYd0-zjVIyHyld4hILJu9hWsIT48EW_Y';

// Resolve configuration from Vite import.meta.env, process.env define, or localStorage
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  let rawUrl: string | undefined;
  let rawKey: string | undefined;

  // Check localStorage (allows custom runtime configuration)
  if (typeof window !== 'undefined') {
    try {
      const customUrl = localStorage.getItem('smokebox_supabase_url');
      const customKey = localStorage.getItem('smokebox_supabase_anon_key');
      if (customUrl) rawUrl = customUrl;
      if (customKey) rawKey = customKey;
    } catch {
      // ignore localStorage errors
    }
  }

  // Check Vite client env
  if (!rawUrl && typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) {
    rawUrl = import.meta.env.VITE_SUPABASE_URL;
  }
  if (!rawKey && typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  // Check process.env (injected via vite define)
  if (!rawUrl && typeof process !== 'undefined' && process.env?.SUPABASE_URL) {
    rawUrl = process.env.SUPABASE_URL;
  }
  if (!rawKey && typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) {
    rawKey = process.env.SUPABASE_ANON_KEY;
  }

  return {
    url: normalizeSupabaseUrl(rawUrl),
    anonKey: rawKey?.trim() || DEFAULT_SUPABASE_ANON_KEY,
  };
}

const { url: initialUrl, anonKey: initialKey } = getSupabaseCredentials();

export const supabase: SupabaseClient = createClient(initialUrl, initialKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-application-name': 'smoke-box-darts',
    },
  },
});
