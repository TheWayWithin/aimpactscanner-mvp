#!/bin/bash

# Post-build script to fix production issues
echo "🔧 Fixing production build issues..."

# Remove base64-encoded modules that cause MIME type errors
sed -i '' 's|<link rel="modulepreload" href="data:text/[^"]*"[^>]*>|<!-- base64 module removed -->|g' dist/index.html

# Remove .jsx modulepreloads and prefetches
sed -i '' 's|<link rel="modulepreload" href="[^"]*\.jsx"[^>]*>|<!-- jsx modulepreload removed -->|g' dist/index.html
sed -i '' 's|<link rel="prefetch" href="[^"]*\.jsx"[^>]*>|<!-- jsx prefetch removed -->|g' dist/index.html

# Fix any remaining .jsx references
sed -i '' 's|/src/components/\([^.]*\)\.jsx|/assets/\1.js|g' dist/index.html

# Remove .jsx files from dist (they shouldn't be there)
rm -f dist/assets/*.jsx

# Count fixes
BASE64_COUNT=$(grep -c "base64 module removed" dist/index.html)
JSX_COUNT=$(grep -c "jsx.*removed" dist/index.html)

echo "✅ Removed $BASE64_COUNT base64 modules"
echo "✅ Removed $JSX_COUNT .jsx references"
echo "✅ Production build fixed!"