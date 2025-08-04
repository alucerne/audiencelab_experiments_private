# Deploy Studio to Vercel Staging

## 🚀 Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Staging
```bash
vercel --prod
```

## 📋 Pre-Deployment Checklist

### Environment Variables Needed
You'll need to set these in Vercel dashboard:

#### Required for Build
- `NEXT_PUBLIC_SITE_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

#### Supabase (Production)
- `NEXT_PUBLIC_SUPABASE_URL` - Your production Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

#### Google Cloud Storage
- `GOOGLE_CLOUD_PROJECT_ID` - Your GCS project ID
- `GOOGLE_CLOUD_CLIENT_EMAIL` - Service account email
- `GOOGLE_CLOUD_PRIVATE_KEY` - Service account private key
- `GOOGLE_CLOUD_ENRICHMENT_BUCKET` - GCS bucket name

#### Authentication
- `NEXTAUTH_SECRET` - For authentication (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your Vercel deployment URL

#### Other Required
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key

### 4. Set Environment Variables in Vercel
```bash
# Required for build
vercel env add NEXT_PUBLIC_SITE_URL

# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Google Cloud Storage
vercel env add GOOGLE_CLOUD_PROJECT_ID
vercel env add GOOGLE_CLOUD_CLIENT_EMAIL
vercel env add GOOGLE_CLOUD_PRIVATE_KEY
vercel env add GOOGLE_CLOUD_ENRICHMENT_BUCKET

# Authentication
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Stripe
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY
```

## 🎯 Testing with Real Data

### 1. Access Studio
- Navigate to: `https://your-vercel-url.vercel.app/home/[account]/studio`
- Replace `[account]` with a real account slug

### 2. Test Features
- ✅ **Audience Selection**: Choose from real audiences
- ✅ **Filter System**: Apply filters to real data
- ✅ **Custom Fields**: Add and delete fields
- ✅ **Code Transforms**: Test with real data
- ✅ **GCS Integration**: Access real audience data

### 3. Expected URLs
- **Studio**: `https://your-vercel-url.vercel.app/home/[account]/studio`
- **API Endpoints**: 
  - `/api/audiences?accountId=[id]`
  - `/api/preview-subsegment`

## 🔧 Troubleshooting

### Build Issues
```bash
# Test build locally first
pnpm build

# Check for TypeScript errors
pnpm typecheck
```

### Environment Issues
```bash
# Validate environment variables
pnpm env:validate
```

### Common Build Errors
1. **NEXT_PUBLIC_SITE_URL missing**: Set to your Vercel deployment URL
2. **TypeScript errors**: Some warnings may not prevent deployment
3. **Environment validation**: Ensure all required vars are set

### Database Issues
- Ensure production Supabase is running
- Check RLS policies are configured
- Verify service role key has proper permissions

## 📊 Monitoring

### Vercel Dashboard
- Check deployment status
- Monitor function execution times
- View error logs

### Supabase Dashboard
- Monitor database queries
- Check RLS policy effectiveness
- View real-time logs

## 🎉 Success Criteria

- [ ] Studio loads without errors
- [ ] Can select real audiences
- [ ] Filters work with real data
- [ ] Custom fields can be added/deleted
- [ ] Code transforms execute successfully
- [ ] GCS data loads correctly
- [ ] All API endpoints respond properly

## 🚨 Important Notes

### TypeScript Warnings
The build may show TypeScript warnings for unrelated code (white-label, credits, middleware). These are **not blocking** for Studio functionality.

### Environment Variables
- `NEXT_PUBLIC_SITE_URL` is **required** for build success
- Set this to your actual Vercel deployment URL
- Example: `https://audiencelab-studio.vercel.app`

### Deployment Strategy
1. Deploy to preview first: `vercel`
2. Test functionality
3. Deploy to production: `vercel --prod` 