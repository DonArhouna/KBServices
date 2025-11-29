#!/usr/bin/env bash
set -euo pipefail

# attach-existing-postgres.sh
# Usage: ./attach-existing-postgres.sh CONTAINER_NAME [NETWORK_NAME]
# Connects an existing postgres container (started outside the app compose) to the 'kbnet' network (or specified).

CONTAINER_NAME=${1:-}
NETWORK_NAME=${2:-kbnet}

if [ -z "$CONTAINER_NAME" ]; then
  echo "Usage: $0 <container_name> [network_name]"
  exit 1
fi

echo "Creating network $NETWORK_NAME (if it doesn't exist)"

docker network create $NETWORK_NAME || true

echo "Connecting container $CONTAINER_NAME to network $NETWORK_NAME"
docker network connect $NETWORK_NAME $CONTAINER_NAME || true

echo "Done. $CONTAINER_NAME is connected to $NETWORK_NAME"
