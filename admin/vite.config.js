import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * base has to match the nginx location. Every asset URL is baked in at build
 * time, so a build with the default '/' serves an index.html from /admin/ that
 * asks for /assets/*, which nginx hands to the CRA app's root and answers with
 * that app's index.html - a blank page and a MIME-type error in the console
 * rather than a 404.
 */
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: { port: 5173 },
});
