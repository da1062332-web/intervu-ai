#!/usr/bin/env bash
# Live colored logs for Judge0 on AWS EC2
# Usage:
#   ./view-logs.sh          (tails server logs by default)
#   ./view-logs.sh workers  (tails workers logs)
#   ./view-logs.sh caddy    (tails caddy proxy logs)
#   ./view-logs.sh all      (tails all containers)

SERVICE="${1:-server}"

if [ "$SERVICE" = "all" ]; then
  TARGET=""
else
  TARGET="$SERVICE"
fi

echo "======================================================"
echo " 📡 Tailing colored Judge0 logs for: ${SERVICE}"
echo " 🟢 200/201 OK | 🟡 4xx Warning | 🔴 5xx Error"
echo " Press Ctrl+C to exit"
echo "======================================================"

if command -v ccze >/dev/null 2>&1; then
  echo " 🎨 Using ccze colorizer engine..."
  docker compose logs -f $TARGET | ccze -A
else
  docker compose logs -f $TARGET | awk '
    /Completed (200|201|204)/ {
      # Bold Green for success
      print "\033[1;32m" $0 "\033[0m"
      next
    }
    /Completed (400|401|403|404|422)/ {
      # Bold Yellow for client warnings
      print "\033[1;33m" $0 "\033[0m"
      next
    }
    /Completed (500|502|503|504)|Error|FATAL|Exception/ {
      # Bold Red for server errors
      print "\033[1;31m" $0 "\033[0m"
      next
    }
    /Started (POST|GET|PUT|DELETE)/ {
      # Cyan for incoming requests
      print "\033[1;36m" $0 "\033[0m"
      next
    }
    {
      # Default uncolored
      print $0
    }
  '
fi
