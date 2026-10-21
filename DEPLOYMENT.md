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
| `META_WEBHOOK_VERIFY_TOKEN` | Platform-only secret configured in the Meta app webhook settings; never returned to merchant browsers | Yes |
| `META_APP_ID` | Meta app ID | For Meta integration |
| `META_APP_SECRET` | Meta app secret | For Meta integration |
| `META_REDIRECT_URI` | Meta OAuth callback URL | For Meta integration |
| `META_GRAPH_API_VERSION` | Graph API version used for Meta calls (default `v21.0`) | Optional |
| `META_GRAPH_API_BASE_URL` | Graph API base URL; override only for Meta sandbox or tests (default `https://graph.facebook.com`) | Optional |
| `META_GRAPH_TIMEOUT_MS` | Hard timeout for a single Meta Graph API request in ms (default `10000`) | Optional |
| `R2_ACCOUNT_ID` | Cloudflare account id that owns the media bucket | For image uploads |
| `R2_ACCESS_KEY_ID` | R2 API token id (Object Read & Write) | For image uploads |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | For image uploads |
| `R2_BUCKET_NAME` | Bucket that stores product media | For image uploads |
| `R2_PUBLIC_URL` | Public bucket URL used to serve product images | For image uploads |
| `STORAGE_DRIVER` | `r2` for production, `local` for development (default: `r2` when R2 is configured) | Optional |
| `STORAGE_LOCAL_DIR` | Local disk folder for the development storage driver | Optional |
| `UPLOAD_MAX_PER_HOUR` | Image uploads allowed per tenant per hour (default `20`) | Optional |
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

   # Optional: lint the frontend sources (catches use-before-declaration bugs
   # that blank the dashboard at runtime but never fail the build)
   cd frontend && npm run lint && cd ..

   # Encrypt any legacy plaintext tenant integration credentials.
   # The first command is a dry run; review the count, then apply.
   npm run db:encrypt-secrets
   npm run db:encrypt-secrets -- --apply

   # Create a type-preserving EJSON backup (never commit snapshots)
   npm run db:backup
   ```

   `TOKEN_ENCRYPTION_KEY` must be set before the migration runs. Back it up in a
   secrets manager: encrypted tenant credentials and Meta OAuth tokens cannot be
   recovered if the key is lost. Rotating the key requires decrypting with the
   old key and re-encrypting with the new one during a maintenance window.

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

### 4.1 WhatsApp Template Setup (required before any WhatsApp automation fires)

Meta only permits business-initiated WhatsApp messages through **templates that the
merchant has approved in their own WhatsApp Business Account**. Omniva never
sends free-form text for order or lead messages, and it never uses a
platform-level WhatsApp number.

1. A Super Admin provisions the merchant's WhatsApp Business credentials
   (WABA ID, phone number ID, permanent access token) under
   **Admin → Merchant API Provisioning**. These credentials are encrypted at rest.
2. The merchant creates each template in Meta Business Manager using the exact
   placeholder order Omniva expects:

   | Omniva key | Placeholders | Suggested body |
   | :--- | :--- | :--- |
   | `order_confirmation` | `{{1}}=name`, `{{2}}=order_number`, `{{3}}=amount`, `{{4}}=track_url` | Order received confirmation |
   | `order_shipped` | `{{1}}=name`, `{{2}}=order_number`, `{{3}}=courier`, `{{4}}=awb` | Dispatched with AWB |
   | `order_delivered` | `{{1}}=name`, `{{2}}=order_number`, `{{3}}=feedback_link` | Delivered, ask for feedback |
   | `order_cancelled` | `{{1}}=name`, `{{2}}=order_number`, `{{3}}=refund_info` | Cancelled and refund status |
   | `cod_verification` | `{{1}}=name`, `{{2}}=order_number`, `{{3}}=amount` + Yes/No quick-reply buttons | Confirm the COD order |
   | `cart_recovery` | `{{1}}=name`, `{{2}}=product_name`, `{{3}}=checkout_link` | Left cart reminder |

3. The merchant maps each key to the approved Meta template name under
   **Merchant → Integrations → WhatsApp Templates**. An unmapped template is
   never sent; the automation is logged as `SKIPPED` with the reason.
4. The merchant creates the automation rules under **Merchant → Automations**
   and picks the Omniva template key. The rule editor shows a warning while a
   template is unmapped.

Delivery rules that are enforced server-side: body parameters always match the
approved template count and order, `5xx`/`429` responses are retried three
times with backoff, `4xx` responses are never retried, and every send is
recorded in the automation log with the Meta message id.

### 4.2 Product Image Storage (Cloudflare R2)

Merchants must be able to upload a photo from their phone. Images are stored in
Cloudflare R2 (10GB free tier) and served from the bucket's public domain.

1. Create a bucket, e.g. `omniva-media`, and an R2 API token with
   **Object Read & Write** access.
2. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET_NAME` and `R2_PUBLIC_URL` in the production environment. The
   public URL is the `https://pub-….r2.dev` domain of the bucket.
3. Keep `STORAGE_DRIVER=r2`. If it is missing, the app falls back to the local
   disk driver and logs a loud warning in production, because images would be
   lost on the next container replacement.
4. Every upload is resized server-side with `sharp` into 200x200 (thumb),
   600x600 (card) and 1200x1200 (full) WebP images. EXIF data, including GPS
   coordinates, is stripped. The untouched original is kept alongside.
5. Uploads are limited to 5MB, to jpeg/png/webp, and to 20 per tenant per hour
   (`UPLOAD_MAX_PER_HOUR`).

Existing products that still store a plain image URL keep working. To convert
them to the size-aware format run the migration (dry run first):

```bash
cd backend
npm run db:migrate-product-images
npm run db:migrate-product-images -- --apply
```


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
9. Test a backup-to-disposable-database restore. Verify tenant/user `ObjectId` references, `Date` fields, and encrypted Meta token values survive, then delete the test database and snapshot. Restoring encrypted credentials requires the same `TOKEN_ENCRYPTION_KEY`; store that key securely and separately from the database backup.
10. WhatsApp automation rules are business-initiated messages. Each `SEND_WHATSAPP` rule must specify an approved `whatsappTemplateName`, its language, and body-variable order. Rules without a template are deliberately skipped and logged; free-form text is not sent.
11. Set `TRUST_PROXY=true` only when the app is behind a trusted reverse proxy. Leaving it unset prevents clients from spoofing `X-Forwarded-For` rate-limit buckets.
12. Run `cd backend && npm run db:encrypt-secrets -- --apply` after setting `TOKEN_ENCRYPTION_KEY`. Verify a raw tenant document stores integration credentials as `enc:gcm:` values, while `GET /api/auth/me` and the Super Admin integration endpoint only return masked strings.
13. Confirm `GET /api/meta/settings` and `GET /api/meta/integration` never return `verifyToken`. The platform webhook verify token belongs only in the Meta app dashboard and server environment, not in a merchant browser.
