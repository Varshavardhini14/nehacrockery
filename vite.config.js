import { defineConfig } from 'vite';

export default defineConfig({
  // Serve from project root — frontend/ and admin/ are sub-directories
  root: '.',
  server: {
    port: 3000,
    open: '/frontend/index.html',
    // ── Dev proxy: forward API & upload requests to the backend server ──────
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // ── Root redirect ──────────────────────────────────────
        root:       'index.html',

        // ── Frontend (customer-facing) pages ──────────────────
        home:       'frontend/index.html',
        about:      'frontend/about.html',
        products:   'frontend/products.html',
        brands:     'frontend/brands.html',
        taroba:     'frontend/taroba.html',
        catalogue:  'frontend/catalogue.html',
        contact:    'frontend/contact.html',
        privacy:    'frontend/privacy.html',
        terms:      'frontend/terms.html',

        // ── Admin (internal staff) ────────────────────────────
        admin:      'admin/index.html'
      }
    }
  }
});

