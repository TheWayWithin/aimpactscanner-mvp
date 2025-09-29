// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize React-specific performance
      fastRefresh: true
    }),
    visualizer({
      filename: 'bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    target: 'es2020', // Updated for better modern browser support
    minify: 'terser',
    cssMinify: true,
    cssCodeSplit: true, // Enable CSS code splitting
    chunkSizeWarningLimit: 250, // Stricter chunk size limits for better performance
    reportCompressedSize: true,
    // Enable gzip and brotli compression hints
    assetsInlineLimit: 4096, // Inline small assets as base64
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react'
          }
          
          // Supabase and auth related
          if (id.includes('@supabase') || id.includes('auth')) {
            return 'vendor-supabase'
          }
          
          // PDF generation libraries (split for better loading)
          if (id.includes('jspdf')) {
            return 'vendor-jspdf'
          }
          if (id.includes('html2canvas')) {
            return 'vendor-html2canvas'
          }
          
          // Large third-party libraries that should be separate
          if (id.includes('dompurify')) {
            return 'vendor-dompurify'
          }
          
          // Core-js polyfills (often large)
          if (id.includes('core-js')) {
            return 'vendor-polyfills'
          }
          
          // General vendor chunks for other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc'
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const fileName = facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, '')
            return `assets/${fileName}-[hash].js`
          }
          return 'assets/[name]-[hash].js'
        }
      }
    },
    // Terser configuration for better minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      mangle: {
        safari10: true
      }
    }
  },
  // Optimize dependencies and development server
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: ['jspdf', 'html2canvas'] // These are large and should be code-split
  },
  // Additional performance optimizations
  server: {
    // Preload module imports for faster development
    preTransformRequests: true,
    // Optimize HMR
    hmr: {
      overlay: false // Reduce visual interruptions during development
    }
  },
  // CSS optimization
  css: {
    // Enable CSS source maps for development
    devSourcemap: true,
    // Optimize CSS processing
    preprocessorOptions: {
      // Add any preprocessor optimizations if needed
    }
  },
  // Worker optimization for build tools
  worker: {
    format: 'es'
  }
})
