# AudienceLab V3 - Quick Start Guide

This guide provides a quick way to get the AudienceLab V3 local development environment up and running.

## 🚀 Quick Start (Recommended)

### Option 1: Automated Setup
```bash
# From the project root
./scripts/start-local-dev.sh
```

This script will:
- ✅ Fix common configuration issues automatically
- ✅ Check and start Supabase
- ✅ Start Next.js development server
- ✅ Verify all services are running

### Option 2: Manual Setup
```bash
# 1. Navigate to web app
cd apps/web

# 2. Start Supabase
supabase start

# 3. Start Next.js
pnpm run with-env next dev --turbo
```

## 📋 Prerequisites

- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] Supabase CLI installed
- [ ] Docker running
- [ ] `.env.local` file created in `apps/web/`

## 🔧 Environment Setup

### 1. Create Environment File
```bash
cd apps/web
cp .env.example .env.local  # if .env.example exists
```

### 2. Required Environment Variables
Your `.env.local` should contain at least 34 environment variables including:

**Critical Variables:**
- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `AUDIENCE_API_URL`
- `ENRICH_API_URL`
- `PIXEL_API_URL`
- `TYPESENSE_API_KEY`
- `GOOGLE_CLOUD_PROJECT_ID`
- And 28+ more...

**See:** `LOCAL_DEVELOPMENT_TROUBLESHOOTING.md` for the complete list.

## 🌐 Access Points

Once running, you can access:

- **Main App:** http://localhost:3000
- **Supabase API:** http://127.0.0.1:54321
- **Supabase Studio:** http://127.0.0.1:54323
- **Email Testing:** http://127.0.0.1:54324

## 🛠️ Common Issues

### Issue 1: Pgsodium Schema Error
```
ERROR: schema "pgsodium" does not exist
```
**Fix:** Remove pgsodium references from `supabase/seed.sql`

### Issue 2: Supabase Connection Error
```
Error: {message: ..., details: ..., hint: "", code: ...}
```
**Fix:** Update `NEXT_PUBLIC_SUPABASE_URL` to `http://127.0.0.1:54321`

### Issue 3: Missing Environment Variables
```
ZodError: Audience API URL is required
```
**Fix:** Add all required environment variables to `.env.local`

### Issue 4: Wrong Directory
```
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "with-env" not found
```
**Fix:** Run commands from `apps/web` directory

## 📖 Detailed Documentation

- **Troubleshooting Guide:** `LOCAL_DEVELOPMENT_TROUBLESHOOTING.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Quick Reference:** `QUICK_REFERENCE.md`

## 🔍 Verification Commands

```bash
# Check if everything is working
supabase status
curl -s http://localhost:3000 > /dev/null && echo "✅ Next.js running" || echo "❌ Next.js not responding"
grep -c "=" .env.local  # Should show 34+ variables
```

## 🚨 Emergency Reset

If everything is broken:
```bash
# Stop all services
supabase stop
pkill -f "next dev"

# Clear Next.js cache
rm -rf .next

# Restart everything
./scripts/start-local-dev.sh
```

## 📞 Support

1. Check `LOCAL_DEVELOPMENT_TROUBLESHOOTING.md`
2. Run the automated startup script
3. Check Supabase logs: `supabase logs`
4. Verify environment variables are set correctly

---

**Last Updated:** January 2025  
**Tested Environment:** macOS 24.3.0, Supabase CLI, Next.js 15.1.7 