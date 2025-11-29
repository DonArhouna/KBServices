# Docker Deployment Notes

This project includes Docker configuration for running the frontend and backend inside containers. The `docker-compose.yml` file in `docker/` defines the following services:

- postgres (optional): Postgres DB 16 container (Data volume: db_data)
- backend: Node/Express service built from `docker/Dockerfile.backend`
- frontend: Built via `docker/Dockerfile.frontend` and served with nginx

Important notes:
- By default this docker-compose exposes the backend on port 3001 and the frontend on port 80 on the host.
- If you already have a Postgres instance (for example local host), comment out the `postgres` service and adjust the `backend` service to not depend on it.
- Ensure `.env` exists at repo root with `DATABASE_URL` updated to point to the database the backend should use (DB host in .env must be reachable by the backend container - e.g. `postgres` service when using containerized DB or a host IP).

Example to start containers (from docker folder):

```bash
# build and start
docker compose up --build -d

# check service logs
docker compose logs -f backend

# stop services
docker compose down
```

Security:
- Do not store production secrets in `.env` in the repo; inject them from a safe place.
- For production, consider using a managed Postgres service and configure CI/CD to deploy.
