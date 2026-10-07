#!/usr/bin/env bash
# One-time host setup for Judge0 on an Ubuntu 22.04 EC2 instance.
# Judge0 1.13.x's isolate sandbox requires cgroup v1; Ubuntu 22.04 boots with
# cgroup v2, so this script switches the kernel back and asks for a reboot.
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
fi

if ! grep -q "systemd.unified_cgroup_hierarchy=0" /etc/default/grub; then
  sudo sed -i 's/^GRUB_CMDLINE_LINUX="\(.*\)"/GRUB_CMDLINE_LINUX="\1 systemd.unified_cgroup_hierarchy=0"/' /etc/default/grub
  sudo update-grub
  echo "cgroup v1 enabled. Reboot now (sudo reboot), then re-run this script."
  exit 0
fi

if [ "$(stat -fc %T /sys/fs/cgroup)" = "cgroup2fs" ]; then
  echo "Still on cgroup v2. Reboot the instance (sudo reboot) and re-run."
  exit 1
fi

sudo mkdir -p /opt/judge0
sudo chown "$USER":"$USER" /opt/judge0
echo "Host ready. Copy docker-compose.yml, judge0.conf, Caddyfile and .env to /opt/judge0, then:"
echo "  cd /opt/judge0 && docker compose up -d"
