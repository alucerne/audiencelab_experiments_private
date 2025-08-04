#!/bin/bash

# AudienceLab V3 Local Development Startup Script
# This script automates the setup and fixes common issues

set -e

echo "🚀 Starting AudienceLab V3 Local Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to web directory
print_status "Navigating to web app directory..."
cd "$(dirname "$0")/../apps/web" || {
    print_error "Failed to navigate to apps/web directory"
    exit 1
}

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found. Please create it first."
    exit 1
fi

# Fix 1: Update Supabase URL if needed
print_status "Checking Supabase URL configuration..."
if grep -q "http://localhost:9999" .env.local; then
    print_warning "Fixing Supabase URL..."
    sed -i '' 's|http://localhost:9999|http://127.0.0.1:54321|g' .env.local
    print_success "Supabase URL updated to http://127.0.0.1:54321"
fi

# Fix 2: Check for required environment variables
print_status "Checking required environment variables..."
MISSING_VARS=()

# Check for critical variables
CRITICAL_VARS=(
    "AUDIENCE_API_URL"
    "ENRICH_API_URL"
    "PIXEL_API_URL"
    "TYPESENSE_API_KEY"
    "GOOGLE_CLOUD_PROJECT_ID"
    "INTERESTS_API_URL"
    "DELIVR_PIXEL_API_URL"
)

for var in "${CRITICAL_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.local; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_warning "Missing environment variables: ${MISSING_VARS[*]}"
    print_warning "Please add these to your .env.local file. See LOCAL_DEVELOPMENT_TROUBLESHOOTING.md for details."
fi

# Check Supabase status
print_status "Checking Supabase status..."
if ! supabase status > /dev/null 2>&1; then
    print_warning "Supabase not running. Starting Supabase..."
    supabase start
    print_success "Supabase started successfully"
else
    print_success "Supabase is already running"
fi

# Verify Supabase is accessible
print_status "Verifying Supabase connection..."
if curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
    print_success "Supabase is accessible"
else
    print_error "Supabase is not accessible. Please check the status with 'supabase status'"
    exit 1
fi

# Check if Next.js is already running
print_status "Checking if Next.js is already running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_warning "Next.js is already running on port 3000"
    read -p "Do you want to restart it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping existing Next.js process..."
        pkill -f "next dev" || true
        sleep 2
    else
        print_success "Using existing Next.js instance"
        exit 0
    fi
fi

# Start Next.js development server
print_status "Starting Next.js development server..."
print_status "This may take a moment..."

# Start the server in the background
pnpm run with-env next dev --turbo &
NEXT_PID=$!

# Wait for the server to start
print_status "Waiting for Next.js to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Next.js is running on http://localhost:3000"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Next.js failed to start within 30 seconds"
        kill $NEXT_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Final status check
echo
print_success "🎉 Local development environment is ready!"
echo
echo "📋 Services Status:"
echo "  • Supabase: http://127.0.0.1:54321"
echo "  • Supabase Studio: http://127.0.0.1:54323"
echo "  • Next.js App: http://localhost:3000"
echo "  • Email Testing: http://127.0.0.1:54324"
echo
echo "🔧 Useful Commands:"
echo "  • Stop all services: pkill -f 'next dev' && supabase stop"
echo "  • View Supabase logs: supabase logs"
echo "  • Check status: supabase status"
echo
echo "📖 For troubleshooting, see: LOCAL_DEVELOPMENT_TROUBLESHOOTING.md"

# Keep the script running to maintain the background process
wait $NEXT_PID 