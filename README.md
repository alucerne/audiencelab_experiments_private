# AudienceLab V3 - Studio Backend

This is the AudienceLab V3 application with a focus on the Studio backend for data ingestion and audience management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm
- Supabase CLI (optional)

### Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.template .env.local
   # Edit .env.local with your local values
   ```

3. **Start Supabase (local):**
   ```bash
   supabase start
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

## 🏗️ Project Structure

```
al_v3_localdev/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── lib/              # Utility libraries
│   │   └── supabase/         # Database schemas
│   └── dev-tool/             # Development tools
├── packages/                  # Shared packages
│   ├── @kit/shared/          # Shared utilities
│   └── @kit/scraping-agent/  # Web scraping agent
└── supabase/                 # Database migrations & config
```

## 🎯 Key Features

### Studio Backend
- **Data Ingestion**: Load CSV/Parquet files from Google Cloud Storage
- **DuckDB Integration**: In-memory SQL database for data processing
- **Filter Builder**: Boolean logic for audience segmentation
- **Column Picker**: Field visibility and projection
- **Preview System**: Real-time data preview with pagination
- **Segment Management**: Save and manage audience segments

### API Endpoints
- `/api/studio/filters/fields` - Get available fields
- `/api/studio/preview` - Preview filtered data
- `/api/studio/segments/*` - Segment management
- `/api/studio/audiences/*` - Audience management

## 🚀 Deployment to Vercel

### 1. Set up Supabase Cloud

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys
3. Import the database schema:
   ```bash
   # Use the complete_schema.sql file
   # Copy and paste into Supabase SQL Editor
   ```

### 2. Deploy to Vercel

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables in Vercel:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   # ... (see .env.template for all required variables)
   ```

3. **Deploy:**
   - Vercel will automatically build and deploy from your GitHub repository
   - The production build will use Webpack instead of Turbopack, avoiding the development API route issues

### 3. Environment Variables Required

Copy these from your local `.env.local` and update with production values:

```bash
# Supabase (Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_ENRICHMENT_BUCKET=your-bucket-name

# Other APIs
AUDIENCE_API_URL=https://your-audience-api.com
ENRICH_API_URL=https://your-enrich-api.com
# ... (see .env.template for complete list)
```

## 🔧 Development Notes

### Current Issues
- **Next.js 15 + Turbopack Bug**: API routes return HTML instead of JSON in development
- **Solution**: Deploy to Vercel (uses Webpack in production)

### Database Schema
- Complete schema available in `complete_schema.sql` (297KB)
- Includes all tables, functions, RLS policies, and seed data
- Import directly into Supabase cloud project

### Studio Features
- ✅ Boolean Filter Editor
- ✅ Column Picker (Field Visibility)
- ✅ Dataset Switcher
- ✅ Pagination & Row Selection
- ✅ Extract Values Action
- ✅ Segment Saving & Management
- ❌ Preview API (works in production, broken in development)

## 📝 API Documentation

### Preview Data
```bash
POST /api/studio/preview
{
  "audience": {
    "url": "https://storage.googleapis.com/...",
    "format": "csv"
  },
  "filterTree": {
    "combinator": "and",
    "rules": [...]
  },
  "select": ["FIRST_NAME", "LAST_NAME"],
  "limit": 50,
  "offset": 0
}
```

### Get Fields
```bash
GET /api/studio/filters/fields
# Returns available fields for the current dataset
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software.
