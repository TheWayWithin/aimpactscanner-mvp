#!/bin/bash

# AImpactScanner Deployment Script
echo "🚀 Starting AImpactScanner deployment..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check for errors."
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Built files are in the 'dist' directory"

echo ""
echo "🌐 Manual Deployment Steps:"
echo "1. Go to https://app.netlify.com/sites"
echo "2. Find your 'aimpactscanner' site"
echo "3. Go to the 'Deploys' tab"
echo "4. Drag and drop the 'dist' folder onto the deploy area"
echo "5. Wait for deployment to complete"

echo ""
echo "📋 Required Environment Variables (set in Netlify Dashboard):"
echo "   VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=[your-anon-key]"
echo "   VITE_STRIPE_PUBLISHABLE_KEY=[your-stripe-key]"
echo "   VITE_STRIPE_COFFEE_PRICE_ID=[your-price-id]"

echo ""
echo "🔗 After deployment, test:"
echo "   https://aimpactscanner.com"
echo "   https://www.aimpactscanner.com"

ls -la dist/