#!/bin/bash

# Post-build script to fix production issues
echo "🔧 Fixing production build issues..."

# Cross-platform sed approach: use .bak extension then remove backup files
# Works on both BSD sed (macOS) and GNU sed (Linux)

# Remove base64-encoded modules that cause MIME type errors
sed -i.bak 's|<link rel="modulepreload" href="data:text/[^"]*"[^>]*>|<!-- base64 module removed -->|g' dist/index.html

# Remove .jsx modulepreloads and prefetches
sed -i.bak 's|<link rel="modulepreload" href="[^"]*\.jsx"[^>]*>|<!-- jsx modulepreload removed -->|g' dist/index.html
sed -i.bak 's|<link rel="prefetch" href="[^"]*\.jsx"[^>]*>|<!-- jsx prefetch removed -->|g' dist/index.html

# Fix any remaining .jsx references in all HTML files
find dist -name "*.html" -exec sed -i.bak 's|/src/components/\([^.]*\)\.jsx|/assets/\1.js|g' {} \;
find dist -name "*.html" -exec sed -i.bak 's|\.jsx|.js|g' {} \;

# Remove .jsx files from dist (they shouldn't be there)
find dist -name "*.jsx" -delete

# Fix import statements in JS files that still reference .jsx
find dist/assets -name "*.js" -exec sed -i.bak 's|\.jsx|.js|g' {} \;

# Remove all backup files created by sed
find dist -name "*.bak" -delete

# Count fixes
BASE64_COUNT=$(grep -c "base64 module removed" dist/index.html || echo "0")
JSX_COUNT=$(grep -c "jsx.*removed" dist/index.html || echo "0")

echo "✅ Removed $BASE64_COUNT base64 modules"
echo "✅ Removed $JSX_COUNT .jsx references"
echo "✅ Production build fixed!"