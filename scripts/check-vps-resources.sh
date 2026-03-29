#!/bin/bash

# CA Exam Portal - VPS Resource Diagnostic Script
# This script checks for common resource issues on a 2GB RAM VPS that cause Docker build failures.

echo "================================================"
echo "🚀 [Diagnostic] Checking VPS Resources..."
echo "================================================"

# 1. Check RAM and Swap
echo -e "\n📊 Memory Status:"
free -h

# 2. Check for Swap
SWAP_TOTAL=$(free | grep -i swap | awk '{print $2}')
if [ "$SWAP_TOTAL" -eq 0 ]; then
    echo -e "\n❌ WARNING: NO SWAP SPACE DETECTED!"
    echo "This is the most common cause of 'rpc error... EOF' during Docker builds."
    echo "On a 2GB VPS, you MUST have at least 2GB of Swap."
    echo -e "\n💡 How to add 2GB Swap (Run these as root):"
    echo "  1. fallocate -l 2G /swapfile"
    echo "  2. chmod 600 /swapfile"
    echo "  3. mkswap /swapfile"
    echo "  4. swapon /swapfile"
    echo "  5. echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab"
else
    echo -e "\n✅ Swap space is enabled."
fi

# 3. Check Disk Space
echo -e "\n💾 Disk Space Status:"
df -h | grep '^/dev/'

# 4. Check Docker Builder Cache
echo -e "\n🛠 Docker Status:"
docker system df

echo -e "\n💡 TIP: If builds still fail, run: docker builder prune -a"
echo "================================================"
