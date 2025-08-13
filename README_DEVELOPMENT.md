# AudienceLab V3 - Development Guide

## 🚀 Overview

AudienceLab V3 is a modern web application built with Next.js, TypeScript, and Supabase. It provides audience management, data enrichment, and team collaboration features for marketing and sales teams.

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.1.7** - React framework with App Router
- **TypeScript 5.3.3** - Type-safe JavaScript
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Component library built on Radix UI
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **React Query (TanStack Query)** - Data fetching and caching
- **React i18next** - Internationalization

### Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auth + Real-time)
- **PostgreSQL** - Primary database
- **Row Level Security (RLS)** - Database-level security
- **Supabase Auth** - Authentication and authorization

### Development Tools
- **pnpm** - Package manager
- **Turbo** - Monorepo build system
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Docker** - Containerization for local development

### External Services
- **Google Cloud Platform** - Cloud infrastructure
- **Vercel** - Deployment platform
- **Lemon Squeezy** - Payment processing
- **Stripe** - Payment processing (alternative)
- **Resend** - Email service
- **Nodemailer** - Email service (alternative)

## 📁 Project Structure

```
al_v3_localdev/
├── apps/
│   ├── web/                    # Main Next.js application
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # Shared UI components
│   │   ├── lib/              # Utility functions and configurations
│   │   ├── supabase/         # Database schemas and migrations
│   │   └── public/           # Static assets
│   ├── e2e/                  # End-to-end tests (Playwright)
│   └── dev-tool/             # Development tools
├── packages/                  # Shared packages (monorepo)
│   ├── ui/                   # UI component library
│   ├── supabase/             # Supabase client utilities
│   ├── shared/               # Shared utilities and types
│   ├── auth/                 # Authentication utilities
│   ├── billing/              # Billing system
│   ├── i18n/                 # Internationalization
│   └── ...                   # Other feature packages
├── scripts/                  # Development scripts
├── tooling/                  # Development tooling configuration
└── docs/                     # Documentation
```

## 🔧 Prerequisites

### Required Software
- **Node.js 18+** - JavaScript runtime
- **pnpm 8+** - Package manager
- **Docker Desktop** - Containerization
- **Git** - Version control
- **Supabase CLI** - Local development

### Optional Software
- **VS Code** - Recommended IDE
- **Postman** - API testing
- **TablePlus** - Database GUI

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd al_v3_localdev
pnpm install
```

### 2. Environment Configuration
```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local with your configuration
# Note: Development-friendly defaults are provided for immediate setup
```

### 3. Start Development Environment
```bash
# From project root
./scripts/start-local-dev.sh

# Or manually
cd apps/web
supabase start
pnpm run with-env next dev --turbo
```

### 4. Access Points
- **Application**: http://localhost:3000
- **Supabase Studio**: http://127.0.0.1:54323
- **Database**: localhost:54322

## 📚 Key Concepts

### Architecture Patterns

#### 1. Monorepo Structure
- **apps/**: Individual applications
- **packages/**: Shared libraries and utilities
- **Turbo**: Build system for efficient development

#### 2. Next.js App Router
- **app/**: File-based routing
- **Server Components**: Default rendering on server
- **Client Components**: Interactive components with 'use client'
- **Server Actions**: Form handling and mutations

#### 3. Database Design
- **Multi-tenancy**: Personal and team accounts
- **Row Level Security (RLS)**: Database-level access control
- **Permission System**: Role-based access control
- **Audit Trails**: User tracking and timestamps

### Code Organization

#### 1. Feature-Based Structure
```
app/home/[account]/studio/
├── components/          # UI components
├── utils/              # Utility functions
├── api/                # API routes
└── _lib/               # Feature-specific libraries
```

#### 2. Package Organization
```
packages/
├── ui/                 # Shared UI components
├── supabase/           # Database utilities
├── shared/             # Common utilities
└── features/           # Feature-specific packages
```

## 🔐 Security

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication
- **Row Level Security**: Database-level access control
- **Permission System**: Role-based permissions
- **Server Actions**: Server-side validation

### Data Protection
- **Environment Variables**: Sensitive data in .env files
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: React's built-in protection

## 🧪 Testing

### Test Types
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing (Playwright)
- **Database Tests**: Schema and migration testing

### Running Tests
```bash
# Unit tests
pnpm test

# E2E tests
cd apps/e2e
pnpm test

# Database tests
cd apps/web
pnpm run supabase:test
```

## 📦 Package Management

### Adding Dependencies
```bash
# Add to specific app
pnpm add <package> --filter web

# Add to shared package
pnpm add <package> --filter @kit/ui

# Add dev dependency
pnpm add -D <package> --filter web
```

### Package Scripts
```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript checks

# Database
pnpm supabase:start   # Start local Supabase
pnpm supabase:reset   # Reset database
pnpm supabase:typegen # Generate TypeScript types
```

## 🗄️ Database

### Schema Management
- **Migrations**: Version-controlled schema changes
- **Seed Data**: Initial data for development
- **Type Generation**: Automatic TypeScript types

### Key Tables
- **accounts**: User and team accounts
- **memberships**: Team member relationships
- **roles**: Role definitions and permissions
- **subscriptions**: Billing and subscription data
- **audiences**: Audience data and segments

### Database Commands
```bash
# Create migration
pnpm --filter web supabase:db:diff

# Apply migrations
pnpm run supabase:web:reset

# Generate types
pnpm run supabase:web:typegen
```

## 🌐 Internationalization (i18n)

### Translation Structure
```
public/locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   └── ...
└── es/
    ├── common.json
    └── ...
```

### Usage
```tsx
import { Trans } from '@kit/ui/trans';

<Trans i18nKey="common:welcomeMessage" defaults="Welcome!" />
```

## 🎨 UI Development

### Component Library
- **Shadcn UI**: Base components
- **Custom Components**: Feature-specific components
- **Design System**: Consistent styling with Tailwind

### Styling Guidelines
```tsx
import { cn } from '@kit/ui/utils';

// Use cn utility for conditional classes
<div className={cn('base-class', {
  'text-lg': isLarge,
  'bg-primary': isPrimary
})}>
```

### Form Development
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(MySchema),
  defaultValues: { ... }
});
```

## 🔄 State Management

### Server State
- **React Query**: Data fetching and caching
- **Server Components**: Server-side data loading
- **Server Actions**: Form mutations

### Client State
- **React useState**: Local component state
- **React Context**: Shared state across components
- **URL State**: Route-based state management

## 📡 API Development

### Route Handlers
```tsx
// app/api/example/route.ts
import { enhanceRouteHandler } from '@kit/next/routes';

export const POST = enhanceRouteHandler(
  async function({ body, user }) {
    // Your API logic here
  },
  {
    auth: true,
    schema: MySchema
  }
);
```

### Server Actions
```tsx
// app/example/_actions/server-actions.ts
'use server';

import { enhanceAction } from '@kit/next/actions';

export const myAction = enhanceAction(
  async function(data, user) {
    // Your action logic here
  },
  {
    auth: true,
    schema: MySchema
  }
);
```

## 🚀 Deployment

### Environment Setup
1. **Vercel**: Production deployment
2. **Environment Variables**: Configure in Vercel dashboard
3. **Database**: Supabase production instance
4. **Domain**: Custom domain configuration

### Deployment Commands
```bash
# Deploy to Vercel
./deploy-vercel.sh

# Deploy Studio features
./deploy-studio.sh
```

## 🐛 Debugging

### Common Issues
1. **Database Connection**: Check Supabase status
2. **Environment Variables**: Verify .env.local configuration
3. **Type Errors**: Run `pnpm type-check`
4. **Build Errors**: Clear cache with `rm -rf .next`
5. **Configuration Errors**: ZodError resolved with development-friendly defaults

### Debug Tools
- **Browser DevTools**: Client-side debugging
- **Supabase Studio**: Database inspection
- **Console Logging**: Server-side debugging
- **React DevTools**: Component debugging

## 📖 Documentation

### Key Documents
- **FLOWS_DOCUMENTATION.md**: Detailed flow documentation
- **QUICK_START_GUIDE.md**: Quick setup guide
- **SETUP_GUIDE.md**: Complete setup instructions
- **LOCAL_DEVELOPMENT_TROUBLESHOOTING.md**: Common issues and solutions

### Code Documentation
- **JSDoc**: Function and component documentation
- **TypeScript**: Type definitions and interfaces
- **README Files**: Package-specific documentation

## 🤝 Contributing

### Development Workflow
1. **Create Feature Branch**: `git checkout -b feature-name`
2. **Make Changes**: Follow coding standards
3. **Test Changes**: Run tests and verify functionality
4. **Submit PR**: Create pull request with description
5. **Code Review**: Address feedback and merge

### Coding Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Code Review Checklist
- [ ] TypeScript types are correct
- [ ] Tests pass
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact considered

## 🔗 Useful Links

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)

### Development Tools
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Documentation](https://react.dev)
- [Turbo Documentation](https://turbo.build/repo/docs)

### External Services
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)

## 📞 Support

### Getting Help
1. **Check Documentation**: Review relevant documentation
2. **Search Issues**: Look for similar problems
3. **Ask Team**: Reach out to team members
4. **Create Issue**: Document new problems

### Team Resources
- **Slack Channel**: #audiencelab-dev
- **Code Reviews**: GitHub pull requests
- **Standups**: Daily development sync
- **Sprint Planning**: Regular planning sessions

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: Development Team 