# Omniva SaaS Platform - Production Deployment Guide

This guide details how to deploy the Omniva Multi-Tenant SaaS platform to production. Omniva includes a Node.js/Express backend API, a React 19 SPA frontend with Tailwind CSS, MongoDB database integration, and Meta Ads Webhooks/Conversion API (CAPI).

---

## 1. Quick Overview & Architecture

- **Unified Single-Port Deployment**: The Node.js Express server is configured to serve both the REST API (`/api/*`) and the compiled static frontend SPA (`/`) with client-side route fallback.
- **Node Environment**: Node.js 18+ or 20+ LTS.
- **Database**: MongoDB 6.0+ (MongoDB Atlas or self-hosted).

---

## 2. Environment Variables Checklist

Copy [.env.example](file:///home/mahesh/meta%20ads/.env.example) to `.env` or set these in your cloud provider's environment variables dashboard:

Production startup rejects missing, example, or weak values for the required secrets.

| Variable | Description | Required |
| :--- | :--- | :--- |
| `PORT` | Listening port for the application | Yes |
| `NODE_ENV` | Must be `production` in production | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Random signing secret, at least 32 characters (`openssl rand -hex 32`) | Yes |
| `JWT_EXPIRES_IN` | Token validity duration, e.g. `7d` | Yes |
| `CLIENT_URL` | Allowed origin for CORS and links | Yes |
| `MASTER_SETUP_KEY` | Random key required to create the first Super Admin (`openssl rand -hex 32`) | Yes |
| `TOKEN_ENCRYPTION_KEY` | 32-character or 64-character hex key for encrypting integration tokens | Yes |
| `META_WEBHOOK_VERIFY_TOKEN` | Random private token configured in the Meta app webhook settings | Yes |
| `META_APP_ID` | Meta app ID | For Meta integration |
| `META_APP_SECRET` | Meta app secret | For Meta integration |
| `META_REDIRECT_URI` | Meta OAuth callback URL | For Meta integration |
| `META_ACCESS_TOKEN` | Optional global fallback System User token | Optional |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | For online payments |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | For online payments |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret | Yes for payment webhooks |
| `TRUST_PROXY` | Set `true` only behind a trusted reverse proxy | Optional |

---

## 3. Deployment Options

### Option A: Render (Recommended for 1-Click Git Deploy)

Render configuration is pre-configured via [render.yaml](file:///home/mahesh/meta%20ads/render.yaml).

1. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. Log in to [Render.com](https://render.com) and click **New +** $\rightarrow$ **Blueprint**.
3. Select your repository. Render will automatically detect `render.yaml`.
4. Enter your `MONGODB_URI` (from MongoDB Atlas) and other secrets in the Render dashboard.
5. Click **Apply**. Render will run:
   - Build Command: `npm run install:all && npm run build`
   - Start Command: `npm start`

---

### Option B: Docker / Docker Compose

A production-ready [Dockerfile](file:///home/mahesh/meta%20ads/Dockerfile) and [docker-compose.yml](file:///home/mahesh/meta%20ads/docker-compose.yml) are included in the repository.

1. Ensure Docker and Docker Compose are installed on your server.
2. Clone repository and configure `.env`:
   ```bash
   cp .env.example .env
   # Edit .env with your production credentials
   ```
3. Run with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
4. Check running containers:
   ```bash
   docker compose ps
   ```
   The application will be accessible on `http://<your-server-ip>:5000`.

---

### Option C: Linux VPS (Ubuntu / Debian with PM2 & Nginx)

1. **Install Prerequisites**:
   ```bash
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx

   # Install PM2 process manager
   sudo npm install -g pm2
   ```

2. **Clone & Build the Project**:
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git /var/www/omniva
   cd /var/www/omniva
   cp .env.example backend/.env
   nano backend/.env # Fill in every required secret from the checklist above

   # Install dependencies and build
   npm run install:all
   npm run build

   # Create the indexes used by idempotent checkout and other models
   cd backend && npm run db:sync-indexes

   # Run the full regression suite before serving production traffic
   npm test

   # Create a type-preserving EJSON backup (never commit snapshots)
   npm run db:backup
   ```

   To restore a backup into an empty database, pass the snapshot directory
   explicitly. The restore command refuses to run without `--yes`, and refuses
   to overwrite non-empty collections unless `--drop` is supplied:

   ```bash
   cd backend
   npm run db:restore -- \
     --snapshot backups/snapshot-2026-10-21T05-57-33-847Z \
     --uri "$MONGODB_URI" \
     --yes
   # Recreate indexes after a restore
   npm run db:sync-indexes
   ```

   Snapshots are written as EJSON v2 so `ObjectId`, `Date`, and encrypted
   integration-token strings survive a restore. Legacy plain-JSON snapshots are
   accepted on a best-effort basis, but new backups should always be EJSON.

3. **Start Application with PM2**:
   ```bash
   pm2 start backend/src/server.js --name "omniva-saas"
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx Reverse Proxy**:
   Create `/etc/nginx/sites-available/omniva`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/omniva /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Enable Free SSL Certificate via Let's Encrypt**:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

---

### Option D: Railway

1. Install Railway CLI or connect via [Railway.app](https://railway.app).
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Add environment variables from `.env.example` under the **Variables** tab.
4. Set Build Command: `npm run install:all && npm run build`
5. Set Start Command: `npm start`

---

## 4. Verifying Deployment

Once deployed, verify the following health checks:

1. **System Health Check**:
   `GET https://your-domain.com/api/health`
   Should return: `{"status":"healthy","platform":"Omniva SaaS Engine","database":{"status":"Connected"}}`

2. **Public Storefront**:
   `GET https://your-domain.com/store/<merchant-slug>`
   Renders the real products and checkout for an active merchant.

3. **Merchant Portal**:
   `GET https://your-domain.com/merchant/overview`
   Redirects to login if unauthenticated, or renders merchant dashboard.

4. **Super Admin Portal**:
   `GET https://your-domain.com/admin/login`
   Allows platform owners to manage all merchant stores and billing.


---

## 5. Production Security Checklist

Before exposing the platform publicly:

1. Rotate every secret that has ever appeared in a local `.env`, commit, log, screenshot, or chat. Generate new Meta and MongoDB credentials instead of reusing exposed ones.
2. Remove secrets from Git history before publishing the repository (for example with `git filter-repo --path .env --invert-paths`). Rotating the credential is still required even after history cleanup.
3. Confirm `.env` files are ignored and only `.env.example` is tracked.
4. Set unique production values for `JWT_SECRET`, `MASTER_SETUP_KEY`, `TOKEN_ENCRYPTION_KEY`, `RAZORPAY_WEBHOOK_SECRET`, and `META_WEBHOOK_VERIFY_TOKEN`.
5. Remove demo tenants, test merchants, and seeded accounts before production. Seeded test accounts use weak shared passwords and must never remain accessible.
6. Run `cd backend && npm run db:sync-indexes` against the production database. Confirm the `BookingCapacity` unique index exists before accepting bookings.
7. Verify `/api/health` and `/api/health/deep`, then test login, storefront checkout, order tracking, Razorpay webhook delivery, and Meta webhook verification with real credentials.
8. Keep `backend/backups/` private. Snapshots contain tenant and customer data and must be encrypted and access-controlled. Never commit a snapshot, and remove any snapshot files already tracked in Git.
9. Test a backup-to-disposable-database restore. Verify tenant/user `ObjectId` references, `Date` fields, and encrypted Meta token values survive, then delete the test database and snapshot.
10. WhatsApp automation rules are business-initiated messages. Each `SEND_WHATSAPP` rule must specify an approved `whatsappTemplateName`, its language, and body-variable order. Rules without a template are deliberately skipped and logged; free-form text is not sent.
11. Set `TRUST_PROXY=true` only when the app is behind a trusted reverse proxy. Leaving it unset prevents clients from spoofing `X-Forwarded-For` rate-limit buckets.
