import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Vite configuration for the SriCalendar single-page application. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          if (id.includes('node_modules/@neondatabase') || id.includes('node_modules/@supabase') || id.includes('node_modules/better-auth') || id.includes('node_modules/@better-auth')) return 'neon';
          if (id.includes('node_modules/@tanstack') || id.includes('node_modules/dexie') || id.includes('node_modules/zustand')) return 'data';
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion-dom') || id.includes('node_modules/@dnd-kit')) return 'interaction';
          if (id.includes('node_modules/date-fns')) return 'dates';
          return undefined;
        },
      },
    },
  },
});
