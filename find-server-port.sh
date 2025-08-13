#!/bin/bash

echo "🔍 Finding Next.js Server Port"
echo "=============================="
echo ""

echo "📋 Checking common ports..."
for port in {3000..3020}; do
    echo -n "Port $port: "
    if curl -s --connect-timeout 1 "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ Server found!"
        echo "   URL: http://localhost:$port"
        
        # Test our API endpoint
        echo "   Testing API endpoint..."
        API_RESPONSE=$(curl -s --connect-timeout 2 "http://localhost:$port/api/studio/test-basic" 2>/dev/null || echo "API not responding")
        if echo "$API_RESPONSE" | grep -q '"status":"ok"'; then
            echo "   ✅ API endpoint working!"
            echo ""
            echo "🎉 Server found and working on port $port!"
            echo "   Base URL: http://localhost:$port"
            echo ""
            echo "To test the unified fields system, run:"
            echo "   sed -i '' 's/BASE_URL=.*/BASE_URL=\"http:\/\/localhost:$port\"/' test-unified-fields-final.sh"
            echo "   ./test-unified-fields-final.sh"
            exit 0
        else
            echo "   ⚠️  Server found but API not responding"
        fi
    else
        echo "❌ No server"
    fi
done

echo ""
echo "❌ No server found on common ports (3000-3020)"
echo ""
echo "Possible reasons:"
echo "1. Server is still starting up"
echo "2. Server is running on a different port"
echo "3. Server failed to start"
echo ""
echo "Please check your terminal where you ran 'pnpm dev' for:"
echo "- Port number in the startup message"
echo "- Any error messages"
echo "- Server status" 