#!/bin/bash

# Make Node in PATH early (keeps your original env behavior)
export PATH="${NVM_DIR}/versions/node/v${NODE_VERSION_DEVELOP}/bin/:${PATH}"

# Helper: run the PETCON auto-build safely
petcon_autobuild() {
    echo "== PETCON: auto-building LMS assets =="

    # Find a site if any (first non-assets folder)
    site=$(ls -1 sites | grep -v assets | head -n1 || true)

    if [ -n "$site" ]; then
        # Ensure LMS app is installed
        if ! bench --site "$site" list-apps 2>/dev/null | grep -q '^lms$'; then
            echo "Installing LMS app on site: $site"
            bench --site "$site" install-app lms || true
        fi

        # Build LMS assets from the mounted LMS path
        echo "Building LMS assets from mounted folder..."
        bench --site "$site" build --app lms || true
        bench --site "$site" clear-cache || true
        bench --site "$site" clear-website-cache || true
    fi

    echo "== PETCON: auto-build done =="
}

# === Fast path: bench already present ===
if [ -d "/home/frappe/frappe-bench/apps/frappe" ]; then
    echo "Bench already exists, skipping init"
    cd /home/frappe/frappe-bench

    # Auto-build every container start so assets are always fresh
    petcon_autobuild

    # Hand control to bench (replace shell so script stops here)
    exec bench start
fi

# === Slow path: create a brand new bench ===
echo "Creating new bench..."

bench init --skip-redis-config-generation frappe-bench
cd /home/frappe/frappe-bench

# Use containers instead of localhost
bench set-mariadb-host mariadb
bench set-redis-cache-host redis://redis:6379
bench set-redis-queue-host redis://redis:6379
bench set-redis-socketio-host redis://redis:6379

# Remove redis, watch from Procfile
sed -i '/redis/d' ./Procfile
sed -i '/watch/d' ./Procfile

# Fetch LMS app (mounted folder will be used)
if [ ! -d "./apps/lms" ]; then
    bench get-app lms
fi

# Create site
bench new-site lms.localhost \
  --force \
  --mariadb-root-password 123 \
  --admin-password admin \
  --no-mariadb-socket

# Install & configure LMS on that site
bench --site lms.localhost install-app lms
bench --site lms.localhost set-config developer_mode 1
bench --site lms.localhost clear-cache
bench use lms.localhost

# Auto-build once on first boot too
petcon_autobuild

# Start bench
exec bench start
