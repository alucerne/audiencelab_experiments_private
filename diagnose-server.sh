#!/bin/bash

echo "🔍 Server Diagnosis"
echo "=================="
echo ""

echo "📋 1. Checking for running processes..."
echo "----------------------------------------"
echo "Turbo processes:"
ps aux | grep turbo | grep -v grep | head -5

echo ""
echo "Node.js processes:"
ps aux | grep "node.*dev" | grep -v grep | head -5

echo ""
echo "Next.js processes:"
ps aux | grep next | grep -v grep | head -5

echo ""
echo "📋 2. Checking listening ports..."
echo "--------------------------------"
echo "All listening ports:"
lsof -i -P | grep LISTEN | head -10

echo ""
echo "📋 3. Checking environment files..."
echo "-----------------------------------"
if [ -f "apps/web/.env.local" ]; then
    echo "✅ .env.local exists"
    echo "   Size: $(ls -lh apps/web/.env.local | awk '{print $5}')"
else
    echo "❌ .env.local missing"
fi

if [ -f "apps/web/.env" ]; then
    echo "✅ .env exists"
else
    echo "❌ .env missing"
fi

echo ""
echo "📋 4. Checking package.json scripts..."
echo "--------------------------------------"
echo "Root dev script:"
grep '"dev"' package.json

echo ""
echo "Web app dev script:"
grep '"dev"' apps/web/package.json

echo ""
echo "📋 5. Testing common ports..."
echo "-----------------------------"
for port in 3000 3001 3002 3003 3004 3005; do
    echo -n "Port $port: "
    if curl -s --connect-timeout 1 "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ Server responding"
        echo "   Testing API endpoint..."
        API_RESPONSE=$(curl -s --connect-timeout 2 "http://localhost:$port/api/studio/test-basic" 2>/dev/null || echo "API not responding")
        if echo "$API_RESPONSE" | grep -q '"status":"ok"'; then
            echo "   ✅ API working!"
            echo ""
            echo "🎉 Found working server on port $port!"
            exit 0
        else
            echo "   ⚠️  Server found but API not working"
        fi
    else
        echo "❌ No response"
    fi
done

echo ""
echo "📋 6. Recommendations..."
echo "------------------------"
echo "If no server is found:"
echo "1. Check the terminal where you ran 'pnpm dev'"
echo "2. Look for error messages or startup logs"
echo "3. Try running 'pnpm dev' in a new terminal"
echo "4. Check if all dependencies are installed: 'pnpm install'"
echo ""
echo "If you see the server running in your terminal but this script doesn't find it:"
echo "1. Note the port number from your terminal"
echo "2. Update the test scripts with that port"
echo "3. Run: ./test-unified-fields-final.sh" 