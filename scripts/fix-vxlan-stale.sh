#!/bin/bash

# CA Exam Portal - Docker Swarm VXLAN Cleanup Script
# This script identifies and deletes stale VXLAN interfaces that cause "file exists" errors in Docker Swarm.

echo "================================================"
echo "🚀 [NetworkFix] Cleaning up stale VXLAN interfaces..."
echo "================================================"

# 1. Identify interfaces starting with vx-
STALE_INTERFACES=$(ip -d link show | grep -oE 'vx-[a-zA-Z0-9-]+' | sort -u)

if [ -z "$STALE_INTERFACES" ]; then
    echo "✅ No stale 'vx-' interfaces found."
else
    echo "🔍 Found stale interfaces:"
    echo "$STALE_INTERFACES"
    
    for IFACE in $STALE_INTERFACES; do
        echo "🗑 Deleting $IFACE..."
        sudo ip link delete "$IFACE"
    done
    echo "✅ Cleanup complete."
fi

# 2. Recommended Docker Restart
echo -e "\n🛠 Final recommendation:"
echo "If your deployment still fails, please restart the Docker engine:"
echo "  sudo systemctl restart docker"

echo -e "\n💡 TIP: On 2GB RAM VPS, these errors are common if memory is low."
echo "Ensure you have Swap enabled by running scripts/check-vps-resources.sh"
echo "================================================"
