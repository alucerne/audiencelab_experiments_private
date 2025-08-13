#!/bin/bash

# Build the project locally
echo "Building the project..."
pnpm install
pnpm run build --filter=web

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod 