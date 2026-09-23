import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.SUPABASE_URL': JSON.stringify(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tnvrsfezqkrfnhorarkb.supabase.co'
      ),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(
        process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudnJzZmV6cWtyZm5ob3JhcmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjcxNjIsImV4cCI6MjEwNTc0MzE2Mn0.niPqQxtMYGsQYd0-zjVIyHyld4hILJu9hWsIT48EW_Y'
      ),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
