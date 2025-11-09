import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ADHD Planner',
        short_name: 'ADHDplanner',
        description: 'A task management and planning app designed for ADHD users',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  base: '/',

  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize build performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Chunk splitting for better caching
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          'vendor-utils': ['date-fns', 'uuid'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
        // Ensure MIME types are correctly set
        assetFileNames: (assetInfo) => {
          let extType = (assetInfo.name ?? '').split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType ?? '')) {
            extType = 'img';
          } else if (/woff|woff2/.test(extType ?? '')) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    },
    headers: {
      // Add CORS headers for development
      'Access-Control-Allow-Origin': '*'
    },
    host: true, // Allow Vite to be accessed from the network
    port: 9002,
    hmr: {
      clientPort: 9000,
      host: '9000-firebase-adhd-planner-2-1762409067582.cluster-kyqou4molzblquus3qunag6q3w.cloudworkstations.dev'
    }
  },
});