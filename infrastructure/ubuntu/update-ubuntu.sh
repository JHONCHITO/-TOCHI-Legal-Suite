#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-tochi}"
APP_DIR="${APP_DIR:-/opt/tochi/TOCHI_LEGAL_SUITE}"

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "Run this script with sudo or as root."
    exit 1
  fi
}

update_repo_and_build() {
  runuser -u "$APP_USER" -- bash -lc "cd '$APP_DIR' && git pull --ff-only origin main && set -a && source backend.env && set +a && npm ci && npm run build"
  runuser -u "$APP_USER" -- bash -lc "cd '$APP_DIR/frontend' && set -a && source .env.local && set +a && npm ci && npm run build"
}

restart_services() {
  systemctl restart tochi-backend
  systemctl restart tochi-frontend
}

main() {
  require_root
  update_repo_and_build
  restart_services
  echo "TOCHI updated and restarted."
}

main "$@"
