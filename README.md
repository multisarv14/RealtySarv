# RealtySarv Enterprise Console

**Stack:** React (Vite) · Node/Express · MongoDB. **Multi-tenant:** every client company gets its own address
(`acme.realtysarv.com`) and its own database (`rs_acme`).

## How it works
- The main site (`realtysarv.com`) has the landing page, the **Get started** install wizard and **Sign in → find your workspace**.
- The wizard creates a company: a row in the master registry (`realtysarv_master.tenants`), a new database `rs_<subdomain>`,
  the owner's Admin account and the starter master data. The owner is then sent to `https://<subdomain>.realtysarv.com`.
- Clients and their team sign in **only on their company address**. The owner adds the team in Admin → Users.
  Self-signup is off (`ALLOW_SELF_SIGNUP=false`).
- Plans are enforced by the API: **Growth Hub** = LeadSarv CRM only, up to 10 active users; **Ultimate Stack** = all three modules, unlimited users.
  Locked modules show a lock in the app and their API routes return 403. Limits live in `server/src/config/plans.ts` (and `plans.ts` for the website).
- Landing-page extras live in `landingContent.ts`: customer logos/quotes (the Customers section appears once you add some) and your contact details (shown in the footer and legal pages).
- The API picks the company from the `Host` header. A login token is bound to one company and is rejected on any other.

## Run locally
```bash
npm install && npm --prefix server install
npm run db:up                          # MongoDB in Docker (or set MONGODB_URI to Atlas)
cp server/.env.example server/.env     # set JWT_SECRET (openssl rand -hex 32)
npm run db:seed                        # creates the demo company "multisarv" (login ss / sss)
npm run server                         # API on :4000
npm run dev                            # frontend on :3000
```
Open **http://localhost:3000** (main site) or **http://multisarv.localhost:3000** (demo company).
`*.localhost` resolves to your machine automatically, so any new company works at `http://<subdomain>.localhost:3000`.
`npm --prefix server run seed:reset` rebuilds the demo company.

## Go live on your domain (GoDaddy)
1. Host the API + built frontend on a server with a public IP (VPS, Render, Fly, AWS...). `npm run build`, then serve `dist/`
   and proxy `/api` to the Node server.
2. In GoDaddy DNS add **two A records** pointing at that IP: `@` and `*` (the wildcard serves every client; you never create
   a record per client).
3. Get a **wildcard HTTPS certificate** for `*.realtysarv.com`. Caddy does this automatically (needs a DNS-01 provider plugin), or use
   Cloudflare in front, or certbot with a DNS challenge.
4. The proxy **must forward the original Host header** (the API reads it). nginx: `proxy_set_header Host $host;`
5. Set `BASE_DOMAIN=realtysarv.com`, `MONGODB_URI`, `JWT_SECRET` in `server/.env` and `VITE_BASE_DOMAIN=realtysarv.com` at build time.

`npm --prefix server run seed:reset` wipes and rebuilds only the demo company. The old IndexedDB (Dexie) and Firebase layers are gone.


English and Hindi instructions below to help you set up and run this full-stack application on your computer, and push it to GitHub!

---

## 🇮🇳 हिंदी में सेटअप गाइड (Hinglish Setup Guide)

Aapne jab ZIP file download ki hai, toh usme aapko `node_modules` folder nahi dikhega. Yeh bilkul **normal** hai! Kisi bhi professional code setup me files ka size chhota rakhne ke liye libraries (`node_modules`) ko ZIP me nahi bheja jata. Unhe hum ek command se download karte hain.

Yeh ek **Full-Stack Application** hai jisme do parts hain:
1. **Frontend (Vite + React):** Jo main folder `/` me hai.
2. **Backend Server (Express + TypeScript):** Jo `/server` folder ke andar hai.

Apne computer par ise chalane ke liye aur GitHub par push karne ke liye neeche diye gaye steps follow karein:

### Step 1: Frontend Dependencies Install aur Run Karein
1. Apne computer me terminal ya Command Prompt (CMD) kholein.
2. Project ke main folder (root directory) me jayein.
3. Yeh command chalayein:
   ```bash
   npm install
   ```
4. Frontend ko start karne ke liye yeh command chalayein:
   ```bash
   npm run dev
   ```
   *(Yeh aapka frontend port `3000` par start kar dega)*

### Step 2: Backend Server Dependencies Install aur Run Karein
1. Ek aur naya terminal/CMD tab kholein.
2. `/server` folder ke andar jayein:
   ```bash
   cd server
   ```
3. Backend dependencies install karne ke liye yeh command chalayein:
   ```bash
   npm install
   ```
4. `.env.example` file ko copy karke `.env` naam ki nayi file banayein, ya `.env.example` ke andar jo aapne Godaddy API keys dali hain unhe check karein.
5. Server ko start karne ke liye yeh command chalayein:
   ```bash
   npm run dev
   ```
   *(Yeh aapka server port `4000` par start kar dega jo GoDaddy API aur database dynamic integration handle karta hai)*

### Step 3: Project ko GitHub par kaise Push karein?
Apne code ko Git repository me push karne ke liye:
1. Apne GitHub account par ek nayi **Empty Repository** banayein.
2. Apne computer ke terminal me (main root directory par) ye commands chalayein:
   ```bash
   # Git initialize karein
   git init

   # Saari files ko add karein
   git add .

   # Commit message likhein
   git commit -m "Initial commit of RealtySarv Enterprise Console"

   # Apni branch ko main set karein
   git branch -M main

   # Apne GitHub repo ka URL yahan link karein (GitHub se copy karein)
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

   # Code ko push karein
   git push -u origin main
   ```

---

## 🇬🇧 English Setup & Run Guide

To keep the download size small and follow professional software standards, **dependency folders like `node_modules` are excluded from the ZIP file**. You generate them automatically using the setup commands below.

Since this is a full-stack application, you need to run both the **Frontend Client** and the **Backend Server**.

### Step 1: Setting up the Frontend (Vite + React)
1. Open a terminal in the root directory of the project.
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *This will run the user interface at `http://localhost:3000`.*

### Step 2: Setting up the Backend (Express + Node.js)
1. Open a second, separate terminal tab.
2. Navigate to the server folder:
   ```bash
   cd server
   ```
3. Install the server dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file from the `.env.example` template:
   ```bash
   cp .env.example .env
   ```
   *(Verify your `GODADDY_API_KEY` and `GODADDY_API_SECRET` are correctly configured inside this file).*
5. Start the backend server:
   ```bash
   npm run dev
   ```
   *The backend runs on port `4000` and handles domain routing integrations.*

### Step 3: Pushing the Code to GitHub
To store your code in a personal GitHub repository:
1. Create a new empty repository on your GitHub account.
2. Open your terminal in the root directory and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of RealtySarv Enterprise Console"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

Congratulations! Your dynamic multi-tenant workspace is fully set up and ready to deploy.
