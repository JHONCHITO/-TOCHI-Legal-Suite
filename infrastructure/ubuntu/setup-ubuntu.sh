#!/usr/bin/env bash
set -euo pipefail

APP_NAME="tochi"
APP_USER="${APP_USER:-tochi}"
APP_BASE_DIR="${APP_BASE_DIR:-/opt/tochi}"
APP_DIR="${APP_DIR:-/opt/tochi/TOCHI_LEGAL_SUITE}"
REPO_URL="${REPO_URL:-https://github.com/JHONCHITO/-TOCHI-Legal-Suite.git}"
NODE_MAJOR="${NODE_MAJOR:-20}"

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "Run this script with sudo or as root."
    exit 1
  fi
}

install_packages() {
  apt-get update
  apt-get upgrade -y
  apt-get install -y curl ca-certificates build-essential git nginx

  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
  fi

  if ! command -v npm >/dev/null 2>&1; then
    apt-get install -y npm
  fi
}

ensure_user() {
  if ! id -u "$APP_USER" >/dev/null 2>&1; then
    useradd --system --create-home --shell /bin/bash "$APP_USER"
  fi
  mkdir -p "$APP_BASE_DIR"
  chown -R "$APP_USER:$APP_USER" "$APP_BASE_DIR"
}

clone_or_update_repo() {
  if [[ ! -d "$APP_DIR/.git" ]]; then
    runuser -u "$APP_USER" -- git clone "$REPO_URL" "$APP_DIR"
  else
    runuser -u "$APP_USER" -- bash -lc "cd '$APP_DIR' && git pull --ff-only origin main"
  fi
}

sync_env_files() {
  if [[ ! -f "$APP_DIR/backend.env" && -f "$APP_DIR/infrastructure/ubuntu/env/backend.env.example" ]]; then
    cp "$APP_DIR/infrastructure/ubuntu/env/backend.env.example" "$APP_DIR/backend.env"
    chown "$APP_USER:$APP_USER" "$APP_DIR/backend.env"
  fi

  if [[ ! -f "$APP_DIR/frontend/.env.local" && -f "$APP_DIR/infrastructure/ubuntu/env/frontend.env.example" ]]; then
    cp "$APP_DIR/infrastructure/ubuntu/env/frontend.env.example" "$APP_DIR/frontend/.env.local"
    chown "$APP_USER:$APP_USER" "$APP_DIR/frontend/.env.local"
  fi
}

build_apps() {
  runuser -u "$APP_USER" -- bash -lc "cd '$APP_DIR' && set -a && source backend.env && set +a && npm ci && npm run build"
  runuser -u "$APP_USER" -- bash -lc "cd '$APP_DIR/frontend' && set -a && source .env.local && set +a && npm ci && npm run build"
}

install_systemd_units() {
  cp "$APP_DIR/infrastructure/ubuntu/systemd/tochi-backend.service" /etc/systemd/system/tochi-backend.service
  cp "$APP_DIR/infrastructure/ubuntu/systemd/tochi-frontend.service" /etc/systemd/system/tochi-frontend.service
  systemctl daemon-reload
  systemctl enable tochi-backend
  systemctl enable tochi-frontend
}

install_nginx() {
  cp "$APP_DIR/infrastructure/ubuntu/nginx/tochi.conf" /etc/nginx/sites-available/tochi
  ln -sf /etc/nginx/sites-available/tochi /etc/nginx/sites-enabled/tochi
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
}

restart_services() {
  systemctl restart nginx
  systemctl restart tochi-backend
  systemctl restart tochi-frontend
}

main() {
  require_root
  install_packages
  ensure_user
  clone_or_update_repo
  sync_env_files
  build_apps
  install_systemd_units
  install_nginx
  restart_services

  cat <<EOF
Ubuntu VM ready.

Next checks:
  systemctl status tochi-backend
  systemctl status tochi-frontend
  systemctl status nginx

Public URLs expected:
  https://www.tochilegalsuite.online
  https://api.tochilegalsuite.online
EOF
}

main "$@"
