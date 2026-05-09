#!/bin/bash

# Deploy updated frontend with fixed chat API configuration
# Run this script to update the server with the new build

echo "🚀 Deploying updated frontend to server..."

# Create archive of the build
cd retakt/frontend
tar -czf frontend-build.tar.gz -C dist .

# Upload to server
echo "📤 Uploading build to server..."
scp frontend-build.tar.gz root@157.173.127.84:/tmp/

# Extract on server and update
echo "📦 Extracting and updating on server..."
ssh root@157.173.127.84 << 'EOF'
cd /opt/retakt/frontend
rm -rf *
tar -xzf /tmp/frontend-build.tar.gz
rm /tmp/frontend-build.tar.gz
echo "✅ Frontend updated successfully!"
EOF

# Cleanup local archive
rm frontend-build.tar.gz

echo "🎉 Deployment complete! Chat API should now connect to https://chat-api.retakt.cc"
echo "🔗 Test the website: https://retakt.cc/chat"