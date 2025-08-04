# Local Development Troubleshooting Guide

This document outlines common issues encountered when setting up and running the AudienceLab V3 local development environment, along with their solutions.

## 🚨 Critical Issues & Fixes

### 1. Pgsodium Schema Error

**Error:**
```
ERROR: schema "pgsodium" does not exist (SQLSTATE 3F000)
```

**Root Cause:** The `seed.sql` file contains references to the `pgsodium` schema, but the pgsodium extension isn't being created in migrations.

**Solution:**
1. Remove pgsodium references from `apps/web/supabase/seed.sql`:
   ```bash
   # Remove these lines from seed.sql:
   # -- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
   # -- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
   # SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);
   ```

2. Optional: Create a backup migration file for future pgsodium needs:
   ```sql
   -- apps/web/supabase/migrations/20250101000000_add_pgsodium_extension.sql
   -- Add pgsodium extension for encryption features
   -- Uncomment the line below if you need pgsodium functionality
   -- create extension if not exists pgsodium;
   ```

### 2. Supabase Connection Error

**Error:**
```
Error: {message: ..., details: ..., hint: "", code: ...}
```

**Root Cause:** Mismatch between Supabase URL in `.env.local` and actual running Supabase instance.

**Solution:**
1. Update `apps/web/.env.local`:
   ```bash
   # Change from:
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:9999
   
   # To:
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   ```

2. Verify Supabase is running:
   ```bash
   cd apps/web
   supabase status
   ```

### 3. Missing Environment Variables (ZodError)

**Error:**
```
ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": ["audienceApiUrl"],
    "message": "Audience API URL is required. Please set the `AUDIENCE_API_URL` environment variable."
  },
  // ... more missing variables
]
```

**Root Cause:** Required environment variables are missing from `.env.local`.

**Solution:**
Add the following variables to `apps/web/.env.local`:

```bash
# TYPESENSE
TYPESENSE_API_KEY=bfheF5a4sq0CeptYS6g9DLI8ABcNn9zX

# GOOGLE CLOUD
GOOGLE_CLOUD_PROJECT_ID=pro-equinox-423505-i3
GOOGLE_CLOUD_CLIENT_EMAIL=audiencelabv3-service-account@pro-equinox-423505-i3.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC/xT9y3ecqnTX1\n+48TsoD/crbWVeDX375Rx52sTs14n7lGDfwLFF/X3cPXLZT1EvVvfPQk1W7wxsUy\nHSxkVzke7NrFnh52TyxwHi2QI3iEAZgI9Ik66FtI4h5Aom3rPUE2wREfnTZwEfWU\n4EOYBvVpt+u/0WZ+34VgOozzp898iLlzYIGmufEdAQR+woM6JyZ5hwyc32IQ0W92\nhemaLmIckgca9nfPljuTpOgUPQx8rmTfK39RZd4zYeWVSXjDdgg1U3OcG6iFeQ3p\nZd/+LNFClYgG0/8+ipnfYt4nDlYMKYyQgjauASL/ini2mr6kmP4it39c1AdRDizn\nzai588hrAgMBAAECggEAA/68RIyj54R3Hp50shpA/rfC+fJRdbdwpxJ+0eg7kC/Z\nQI2p1DwPhrDVIIZcePVbc8zWGm69DQeopwa3KVX518LJofez0CiN4/FBzYo3ogRi\nFVmtNcyoAWIyJov1UnYoH1eXuQfIHdiTiNwmySPn+LsldNo/bBUEmc2BqNFnpkMu\nD6AlcHmdb/zIuQ+XjA5GjzI+HrOe+NJc4IUvOf+iG3qfFN0HiSbCnUDJwTeu3sit\n1coboW4Gr9A5aMJtwMj5Taw/w5M15L0drAQhmlD3LdD8pqvZjGkn3OmAzc3nR13d\ntrgBGYw3gCkzNigZfQaHbXRtmOGOAGiAxmDUBOK9UQKBgQDuDRi8ZDpQSxfPJhWe\nBFkGiWsZwzzdnW8zK4jEoKhMw63rhVh85I8Oq6ALYjET/R2RIEdCFt0dgFD+hEoD\nGTPlmYshvxnQPcmleiMfjzKvhn7+nEDMvoxrkrLibv9G1dl9321ipGu0i6nVDBMZ\nTAWcKi/5ZZR3beXBGREAiWUXOwKBgQDOOtWMoR82BFOwt0mSmv9EUa+pZXMHBVl6\nspejsYeQRd9optP2fx6x5py9RMffD2Qo9CKBdFmXnB0HqGHI4IRh+e/9JOuE2Zl3\nyQTCVk6yfdyV0XVmKjVxgdnxnHAiOxEicFUoWTa7ijpYv1c+FSCGtLxtZqdeKwcM\naKPekDrgkQKBgF6ZncbgHbxi2yda/yQ4nhhW69TlHX8EXXh8SHG7VqaK7Ma3yx52\nxdMSqRtc/hvvbpyJs0e0RlK+93DtqWvpzBHmHsBebSewJj44d1THV2Ehlb4g4i97\nWdo2Bhit+4xu12uKKrIUnSi2h9s+XSikaWZR7Zayo3mCltdR2svXzfCZAoGAA0kE\npdzbNm0TODlzPpahgmEav0QSdQYsyruVltH5Kt8yE+S0c7TKtGLMFGfIF1GTcuOQ\nuSc1VijyfXC9Pgn1ken9XLb92Xvt6e6V2NKvJkDDBs/zYtFBULGU2zh2wNTYDQhl\nEuN477vf+hHyPdbwUbUHW2bLO8DLt/LiyWTay0ECgYAriBxA/JZd+ouHG2LO1nMO\nt6LvCqTvU53P+LeWfMm3AoVeHS17WS8wSmmDIPsivRfiY6qB4TP3fmUUicvuCgDM\nJRAi9qEs9Z/jDdSjHB/uUXoHFqf2th8xs0KiLCWsogzV9/U3tVQ9NbqB0pyQll4Y\nbxJDed1U/KbWztE6CMyKXA==\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_ENRICHMENT_BUCKET=v3-audiencelab-enrichment-upload

# INTERESTS API
INTERESTS_API_URL=https://audiencelab-data-staging-xg0q5da.ue.gateway.dev/audience/availability/
INTERESTS_API_KEY=AIzaSyDwJTOFm1FIuRyDabf0694_5c7is_wfrA8

# GOOGLE OAUTH
GOOGLE_OAUTH_CLIENT_ID=7100313470-o6c1qr0vsduj647e3r16vc1g18dt5gjk.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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

# AUDIENCE APIs
AUDIENCE_API_URL=https://v3-stg-audience-job-72802495918.us-east1.run.app
ENRICH_API_URL=https://v3-stg-enrich-job-72802495918.us-east1.run.app
SYNC_API_URL=https://v3-stg-facebook-job-72802495918.us-east1.run.app
PIXEL_API_URL=https://v3-stg-pixel-job-72802495918.us-east1.run.app

# DELIVR PIXEL
DELIVR_PIXEL_API_URL=https://api.delivr.ai
DELIVR_PIXEL_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YzEwMjZhMS0wODExLTRiOWQtYjdlYS1kMTViMDBkMWFjZjEiLCJleHAiOjE3NzgwNzc1MTEsImlhdCI6MTc0NjU0MTUxMX0.9hRdNbA4dSeP0ZtUnL0rNHGZS8k-eh3PuSPGgfJITHI
DELIVR_PIXEL_APP_CLIENT_ID=client_a4BzK5puZqA-OtoL8Mg4gFLGC
DELIVR_PIXEL_APP_CLIENT_SECRET=secret_v9zvfwj8s7_c5gVD226tjQn2R_59ib0Yajo60JtKq
DELIVR_PIXEL_ENTERPRISE_ID=937f5b49-2f1c-480c-b90b-de1991a214f1

# AUDIENCE SYNC
FACEBOOK_SYNC_API_URL=https://v3-stg-facebook-job-72802495918.us-east1.run.app
GOOGLE_SHEETS_SYNC_API_URL=https://v3-stg-facebook-job-72802495918.us-east1.run.app

# VERCEL
VERCEL_API_TOKEN=kXwgeHc3gXmmqDKy8pggeDWU
```

### 4. Wrong Directory Error

**Error:**
```
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "with-env" not found
```

**Root Cause:** Running commands from the wrong directory.

**Solution:**
Always run commands from the `apps/web` directory:
```bash
cd apps/web
pnpm run with-env next dev --turbo
```

## 🔧 Setup Commands

### Initial Setup
```bash
# 1. Navigate to web app directory
cd apps/web

# 2. Start Supabase
supabase start

# 3. Start Next.js development server
pnpm run with-env next dev --turbo
```

### Verification Commands
```bash
# Check Supabase status
supabase status

# Check if Next.js is running
curl -s http://localhost:3000 > /dev/null && echo "✅ Next.js running" || echo "❌ Next.js not responding"

# Count environment variables
grep -c "=" .env.local
```

## 📋 Pre-Launch Checklist

Before starting development, ensure:

- [ ] Supabase is running (`supabase status`)
- [ ] `.env.local` contains all required variables (34+ variables)
- [ ] Supabase URL is correct (`http://127.0.0.1:54321`)
- [ ] You're in the correct directory (`apps/web`)
- [ ] No pgsodium references in `seed.sql`

## 🚀 Quick Fix Commands

### Fix All Issues at Once
```bash
# Navigate to web directory
cd apps/web

# Fix Supabase URL
sed -i '' 's|http://localhost:9999|http://127.0.0.1:54321|g' .env.local

# Restart Supabase
supabase stop
supabase start

# Start Next.js
pnpm run with-env next dev --turbo
```

## ⚠️ Known Warnings

### Prettier Version Mismatch
```
Package prettier can't be external
The package resolves to a different version when requested from the project directory (3.5.2) compared to the package requested from the importing module (3.4.2).
```

**Status:** Non-critical warning, doesn't affect functionality.

### Supabase Service Role Warning
```
[Dev Only] This is a simple warning to let you know you are using the Supabase Service Role. Make sure it's the right call.
```

**Status:** Expected in development, safe to ignore.

## 🔍 Troubleshooting Steps

1. **Check Supabase Status**
   ```bash
   supabase status
   ```

2. **Verify Environment Variables**
   ```bash
   grep -E "(AUDIENCE_API_URL|ENRICH_API_URL|PIXEL_API_URL|TYPESENSE_API_KEY)" .env.local
   ```

3. **Check Application Logs**
   ```bash
   # Look for ZodError or connection errors in Next.js logs
   ```

4. **Restart Services**
   ```bash
   supabase stop && supabase start
   # Then restart Next.js
   ```

## 📞 Support

If issues persist after following this guide:
1. Check the Supabase logs: `supabase logs`
2. Verify all environment variables are set correctly
3. Ensure you're running from the correct directory (`apps/web`)
4. Check for any recent changes to migrations or configuration files

---

**Last Updated:** January 2025
**Tested Environment:** macOS 24.3.0, Supabase CLI, Next.js 15.1.7 