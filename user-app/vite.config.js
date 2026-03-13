import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.CAPACITOR === '1' ? './' : process.env.NODE_ENV === 'production' ? '/app/' : '/',
});
