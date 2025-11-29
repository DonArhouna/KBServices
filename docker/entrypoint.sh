#!/bin/sh
set -e

# Wait for the database if using the postgres service
if [ -n "$POSTGRES_HOST" ]; then
  # Simple wait loop
  echo "Waiting for database at ${POSTGRES_HOST:-127.0.0.1}:${POSTGRES_PORT:-5432}..."
  for i in 1 2 3 4 5 6 7 8 9 10; do
    nc -z ${POSTGRES_HOST:-127.0.0.1} ${POSTGRES_PORT:-5432} >/dev/null 2>&1 && break
    echo "Waiting for postgres... ($i/10)"
    sleep 2
  done
fi

# Run Prisma migrations (non-destructive in production if prepared)
echo "Applying Prisma migrations (if any)"
if command -v npx >/dev/null 2>&1; then
  npx prisma migrate deploy || true
else
  npm run db:migrate || true
fi

# Start the app
exec "$@"
