# ⚡ Quick Reference Card

## 🚀 Essential Commands

### Initial Setup (New Computer)
```bash
# Clone repository
git clone https://github.com/alucerne/al_v3_localdev.git
cd al_v3_localdev

# Install dependencies
pnpm install

# Start Docker Desktop (manually from Applications)
# Then start Supabase
supabase start

# Apply database migrations
pnpm run supabase:web:reset

# Start development server
pnpm dev
```

### Daily Development
```bash
# Start everything
./start.sh

# Reset database (if needed)
./reset.sh

# Generate database types
pnpm run supabase:web:typegen
```

### Access Points
- **App**: http://localhost:3000
- **Supabase**: http://localhost:54323
- **Login**: test@audiencelab.io / testingpassword

### Test Features
- **Magic Signup**: http://localhost:3000/home/[account]/white-label/signup-links
- **Credit Purchase**: http://localhost:3000/home/[account]/usage
- **Standalone Test**: http://localhost:3000/test-credits

### Troubleshooting
```bash
# Docker issues
pkill -f "Docker Desktop"
open -a "Docker Desktop"

# Supabase issues
supabase stop && supabase start

# Cache issues
rm -rf apps/web/.next && pnpm dev
```

## 📁 Key Files
- `SETUP_GUIDE.md` - Complete setup instructions
- `apps/web/.env.local` - Environment variables
- `apps/web/supabase/migrations/` - Database migrations
- `setup.sh`, `start.sh`, `reset.sh` - Automation scripts 