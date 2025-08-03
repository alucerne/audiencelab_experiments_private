# 🚀 AudienceLab v3 Local Development Setup Guide

This guide will help you set up the complete development environment on your new computer.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Docker Desktop** (for Supabase)
- **Git**

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/alucerne/al_v3_localdev.git
cd al_v3_localdev
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create the environment file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

**Important**: The `.env.local` file is already configured with the correct values for local development.

### 4. Start Docker Desktop

**Manual Method (Recommended):**
1. Open Applications folder
2. Find "Docker Desktop"
3. Double-click to start
4. Wait for it to fully initialize (whale icon in menu bar)

**Terminal Method:**
```bash
open -a "Docker Desktop"
```

### 5. Start Supabase

```bash
# Start Supabase services
supabase start

# Verify Supabase is running
supabase status
```

### 6. Apply Database Migrations

```bash
# Reset database to apply all migrations
pnpm run supabase:web:reset

# Generate TypeScript types
pnpm run supabase:web:typegen
```

### 7. Start the Development Server

```bash
# Start Next.js development server
pnpm dev
```

## 🎯 Quick Start Scripts

We've created convenient scripts to automate the setup:

### Setup Script (First Time)
```bash
chmod +x setup.sh
./setup.sh
```

### Start Development Environment
```bash
chmod +x start.sh
./start.sh
```

### Reset Database
```bash
chmod +x reset.sh
./reset.sh
```

## 🌐 Access Points

Once everything is running:

- **Application**: http://localhost:3000
- **Supabase Dashboard**: http://localhost:54323
- **Database**: localhost:54322

## 🔑 Login Credentials

Use these credentials to access the application:
- **Email**: test@audiencelab.io
- **Password**: testingpassword

## 🧪 Testing Features

### 1. Magic Sign-Up Link Feature
- Navigate to: `http://localhost:3000/home/[account]/white-label/signup-links`
- Create a new signup link with resell pricing
- Test the generated magic link

### 2. Client Self-Serve Credit Purchase
- Navigate to: `http://localhost:3000/home/[account]/usage`
- Scroll down to "Buy Additional Credits" section
- Test purchasing additional credits

### 3. Standalone Test Page (No Auth Required)
- Navigate to: `http://localhost:3000/test-credits`
- Test the credit purchase UI without authentication

## 📁 Key Files and Directories

### New Features Implemented

#### Magic Sign-Up System
- `apps/web/app/signup-magic/` - Magic signup flow pages
- `apps/web/app/api/magic-signup/` - API routes for magic signup
- `apps/web/app/home/[account]/white-label/signup-links/_components/create-code-dialog.tsx` - Updated with resell pricing

#### Client Credit Purchase
- `apps/web/app/home/[account]/usage/_components/add-credits-panel.tsx` - Credit purchase UI
- `apps/web/app/home/[account]/usage/_actions/purchase-credits.ts` - Purchase logic

#### Database Migrations
- `apps/web/supabase/migrations/20250101000000_add_resell_prices_to_signup_codes.sql`
- `apps/web/supabase/migrations/20250101000001_add_credit_pricing_and_overage_tables.sql`

### Configuration Files
- `apps/web/.env.local` - Environment variables
- `apps/web/config/app.config.ts` - App configuration
- `setup.sh`, `start.sh`, `reset.sh` - Automation scripts

## 🔧 Troubleshooting

### Docker Issues
If Docker Desktop won't start:
```bash
# Kill any existing Docker processes
pkill -f "Docker Desktop"
sudo pkill -f docker

# Clean up Docker sockets
sudo rm -rf /Users/adamlucerne/.docker/run/docker.sock /Users/adamlucerne/Library/Containers/com.docker.docker/Data/backend.sock

# Start Docker Desktop manually from Applications
```

### Supabase Connection Issues
If you get `ECONNREFUSED` errors:
1. Ensure Docker Desktop is running
2. Restart Supabase: `supabase stop && supabase start`
3. Check ports: `lsof -ti:54322 | xargs kill -9`

### Environment Variable Issues
If you get theme color validation errors:
```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Restart the development server
pnpm dev
```

## 📚 Documentation

### Implementation Summaries
- `MILESTONE_3B_IMPLEMENTATION_SUMMARY.md` - Complete feature overview
- `magic-signup-implementation-summary.md` - Magic signup details
- `test-magic-signup.md` - Testing instructions

### API Testing
- `test-magic-signup-curl.md` - CURL commands for testing APIs
- `test-magic-signup-implementation.md` - Implementation testing guide

## 🚀 Development Workflow

### Making Changes
1. Create a feature branch: `git checkout -b feature-name`
2. Make your changes
3. Test thoroughly
4. Commit: `git commit -m "Description of changes"`
5. Push: `git push origin feature-name`

### Database Changes
1. Create new migration: `pnpm --filter web supabase:db:diff`
2. Apply changes: `pnpm run supabase:web:reset`
3. Update types: `pnpm run supabase:web:typegen`

## 🎉 Success!

Once you've completed these steps, you should have:
- ✅ Complete development environment running
- ✅ All features implemented and tested
- ✅ Database with all migrations applied
- ✅ Ready for continued development

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the implementation summaries
3. Check the terminal logs for specific error messages
4. Ensure all prerequisites are properly installed

---

**Happy Coding! 🚀** 