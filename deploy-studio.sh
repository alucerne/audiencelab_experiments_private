#!/bin/bash

# Deploy Studio to Vercel Staging
# This script helps deploy the Studio to Vercel for testing with real data

set -e

echo "🚀 Deploying Studio to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI ready"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "1. Ensure you have set up environment variables in Vercel dashboard"
echo "2. Make sure NEXT_PUBLIC_SITE_URL is set to your deployment URL"
echo "3. Verify all Supabase and GCS credentials are configured"

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🔨 Building project..."
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Check the errors above."
    exit 1
fi

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Test the Studio at: https://your-app.vercel.app/home/[account]/studio"
echo "3. Verify all features work with real data"
echo ""
echo "📚 See DEPLOY_TO_VERCEL.md for detailed instructions" 