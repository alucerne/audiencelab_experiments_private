#!/bin/bash

# Test Webhook Script for Studio
# This script demonstrates sending data to webhook endpoints

echo "🧪 Testing Studio Webhook Functionality"
echo "========================================"

# Get webhook ID from user
read -p "Enter your webhook ID (e.g., abc123def): " WEBHOOK_ID

if [ -z "$WEBHOOK_ID" ]; then
    echo "❌ No webhook ID provided. Exiting."
    exit 1
fi

# Base URL (change this to your deployment URL)
BASE_URL="http://localhost:3000"
WEBHOOK_URL="$BASE_URL/api/webhook/$WEBHOOK_ID"

echo "📡 Webhook URL: $WEBHOOK_URL"
echo ""

# Test data samples
echo "📊 Sending test data samples..."

# Sample 1: Contact data
echo "1️⃣ Sending contact data..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "John Doe",
    "company": "Tech Corp",
    "job_title": "Software Engineer",
    "phone": "+1-555-0123",
    "source": "website_form"
  }'

echo ""
echo ""

# Sample 2: Lead data
echo "2️⃣ Sending lead data..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@startup.io",
    "name": "Jane Smith",
    "company": "Startup Inc",
    "job_title": "Product Manager",
    "industry": "SaaS",
    "company_size": "10-50",
    "source": "linkedin_ads"
  }'

echo ""
echo ""

# Sample 3: Event data
echo "3️⃣ Sending event data..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mike.wilson@enterprise.com",
    "name": "Mike Wilson",
    "company": "Enterprise Solutions",
    "job_title": "CTO",
    "event": "demo_requested",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "source": "salesforce"
  }'

echo ""
echo ""

# Sample 4: Survey response
echo "4️⃣ Sending survey response..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.jones@consulting.com",
    "name": "Sarah Jones",
    "company": "Consulting Group",
    "job_title": "Director of Marketing",
    "survey_response": "very_interested",
    "budget_range": "50000-100000",
    "timeline": "3_months",
    "source": "survey_form"
  }'

echo ""
echo ""

# Sample 5: CRM sync data
echo "5️⃣ Sending CRM sync data..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.chen@scaleup.com",
    "name": "Alex Chen",
    "company": "ScaleUp Ventures",
    "job_title": "VP of Sales",
    "lead_score": 85,
    "stage": "qualified",
    "last_activity": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "source": "hubspot_sync"
  }'

echo ""
echo ""
echo "✅ Test data sent successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Studio webhook view"
echo "2. You should see 5 new records appear"
echo "3. Add custom fields and enrichments"
echo "4. Save as a new segment"
echo ""
echo "🔍 To view current webhook data:"
echo "curl $WEBHOOK_URL" 