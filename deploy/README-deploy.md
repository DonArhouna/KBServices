# Déploiement KBServices — Fichiers et guide rapide

Ce dossier contient des exemples de fichiers utiles pour le déploiement sur un VPS Ubuntu.

Fichiers disponibles:
- `kbs-api.service.example` – systemd service example for the Node/Express backend.
- `nginx.kbservice.conf` – nginx site config to serve the SPA and proxy /api to Node.
- `deploy.sh` – simple deployment script (placed in `scripts/`).
- `.env.example` – env template to copy to `.env` and fill in production values.

Important notes:
- Do not commit secrets (.env with credentials) to git. Use `.env` or a secret manager.
- Edit `kbs-api.service.example` and `nginx.kbservice.conf` with the correct usernames and paths for your server.
- Replace the placeholder passwords and values in `.env` with secrets created in your environment.

How to use:
1. Place the `kbs-api.service` in `/etc/systemd/system/`:
   ```bash
   sudo cp deploy/kbs-api.service.example /etc/systemd/system/kbs-api.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now kbs-api.service
   sudo systemctl status kbs-api.service
   ```

2. Install and enable nginx, copy nginx config to `sites-available` and enable it:
   ```bash
   sudo cp deploy/nginx.kbservice.conf /etc/nginx/sites-available/kbservice
   sudo ln -s /etc/nginx/sites-available/kbservice /etc/nginx/sites-enabled/kbservice
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. Use the `scripts/deploy.sh` script to update, run migrations, and build the frontend (review the script before running):
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

4. If you’re using a domain, install certbot and set up HTTPS:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

5. Monitor app logs:
   ```bash
   sudo journalctl -u kbs-api.service -f
   sudo tail -f /var/log/nginx/error.log
   ```

6. Backup the database prior to running migrations or large changes:
   ```bash
   PGPASSWORD='YourPassword' pg_dump -h 127.0.0.1 -U kbs_user -Fc kbs_prod > /home/rhone/backups/kbs_prod_`date +%F`.dump
   ```

If you want, I can commit the helper files and push them to your `dev` branch.
