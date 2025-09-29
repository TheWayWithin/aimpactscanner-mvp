// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'

// Enhanced plugin to prevent ALL vendor preloads for maximum performance
function preventLargeChunkPreload() {
  return {
    name: 'prevent-large-chunk-preload',
    transformIndexHtml(html) {
      // Count how many preloads we're removing for logging
      const vendorMatches = html.match(/<link rel="modulepreload"[^>]*vendor[^>]*>/g) || [];
      const pdfMatches = html.match(/<link rel="modulepreload"[^>]*(pdf|PDF)[^>]*>/g) || [];
      const lazyMatches = html.match(/<link rel="modulepreload"[^>]*(Lazy|lazy)[^>]*>/g) || [];
      
      console.log(`🚀 Removing ${vendorMatches.length} vendor preloads for performance`);
      console.log(`📄 Removing ${pdfMatches.length} PDF-related preloads`);
      console.log(`💤 Removing ${lazyMatches.length} lazy component preloads`);
      
      // Remove ALL vendor preloads - they'll be loaded on-demand
      let optimizedHtml = html
        // Remove all vendor-* preloads (jspdf, misc, react, supabase, etc.)
        .replace(/<link rel="modulepreload"[^>]*vendor[^>]*>/g, 
                '<!-- vendor preload removed for performance -->')
        // Remove PDF-related preloads
        .replace(/<link rel="modulepreload"[^>]*(pdf|PDF)[^>]*>/g,
                '<!-- PDF preload removed - loads on-demand -->')
        // Remove html2canvas preloads
        .replace(/<link rel="modulepreload"[^>]*html2canvas[^>]*>/g,
                '<!-- html2canvas preload removed -->')
        // Remove lazy-loaded component preloads (defeats the purpose of lazy loading!)
        .replace(/<link rel="modulepreload"[^>]*(Lazy|lazy)[^>]*>/g,
                '<!-- lazy component preload removed -->')
        // Remove any analysis/results component preloads (loaded after analysis)
        .replace(/<link rel="modulepreload"[^>]*(Analysis|Results|Dashboard)[^>]*>/g,
                '<!-- component preload deferred -->')
        // Remove auth-related preloads (only needed on login)
        .replace(/<link rel="modulepreload"[^>]*(Auth|Login|Registration)[^>]*>/g,
                '<!-- auth component preload deferred -->');
      
      // Keep only critical app preloads: index.js, App.jsx, Landing.jsx
      // These are essential for initial render
      
      return optimizedHtml;
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize React-specific performance
      fastRefresh: true
    }),
    preventLargeChunkPreload(), // CRITICAL FIX: Remove large chunk preloads
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
          
          // PDF generation libraries (split for better loading and lazy load only when needed)
          if (id.includes('jspdf')) {
            return 'vendor-jspdf'
          }
          if (id.includes('html2canvas')) {
            return 'vendor-html2canvas'
          }
          
          // Additional performance optimization for large dependencies
          if (id.includes('dompurify') || id.includes('purify')) {
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
      },
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
  
  // CRITICAL: Performance optimization for production builds
  define: {
    // Remove development code in production
    __DEV__: JSON.stringify(false),
    'process.env.NODE_ENV': JSON.stringify('production'),
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
