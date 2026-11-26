# HeroVerse

HeroVerse is a full-stack superhero and comics platform built as a small **microservices** project. The React single-page application lets visitors explore films and comics, read comics, browse the shop, chat in real time, and manage a personal dashboard.

The backend is split into three independent services:

| Service | Responsibility | Stack | Database |
|---|---|---|---|
| **auth-service** | Accounts, sessions, JWT, dashboard data | Node.js, Express, Prisma | PostgreSQL |
| **chat-service** | Rooms, messages, presence, typing indicators | Node.js, Express, Socket.IO | MongoDB |
| **shop-service** | Orders | Node.js, Express, Mongoose | MongoDB |

Authentication is centralised in `auth-service`. It issues **RS256** access tokens that `chat-service` and `shop-service` verify with the public key — user accounts are never duplicated in MongoDB.

---

## Table of contents

- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick start with Docker](#quick-start-with-docker)
- [Local development without Docker](#local-development-without-docker)
- [Environment variables](#environment-variables)
- [Database access](#database-access)
- [API reference](#api-reference)
- [Frontend](#frontend)
- [Docker reference](#docker-reference)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)

---

## Architecture

```mermaid
flowchart LR
  subgraph Client
    SPA["React SPA (Vite)<br/>http://localhost:5173"]
  end

  subgraph Services
    AUTH["auth-service<br/>Express · :3001"]
    CHAT["chat-service<br/>Express + Socket.IO · :3002"]
    SHOP["shop-service<br/>Express · :3003"]
  end

  subgraph Data
    PG[("PostgreSQL<br/>heroverse_auth")]
    MCHAT[("MongoDB<br/>heroverse_chat")]
    MSHOP[("MongoDB<br/>heroverse_shop")]
  end

  SPA -->|"REST /api/auth<br/>/api/dashboard"| AUTH
  SPA -->|"REST /api/rooms<br/>WebSocket"| CHAT
  SPA -->|"REST /api/orders"| SHOP

  AUTH --> PG
  CHAT --> MCHAT
  SHOP --> MSHOP

  AUTH -. "RS256 public key" .-> CHAT
  AUTH -. "RS256 public key" .-> SHOP
```

### Authentication flow

1. The user registers or logs in through `auth-service`.
2. `auth-service` returns:
   - an **access token** (JWT RS256, 15 minutes by default);
   - a **refresh token** stored in an `httpOnly` cookie (7 days by default).
3. The frontend sends the access token as `Authorization: Bearer <token>` to every protected endpoint.
4. `chat-service` and `shop-service` verify the token with `auth-service/keys/public.pem` and check:
   - algorithm: `RS256`;
   - issuer: `heroverse-auth`;
   - audience: `heroverse-services`.
5. `POST /api/auth/refresh` rotates the refresh token and issues a new access token.

### Ports

| Component | Default port | URL |
|---|---|---|
| Frontend (Vite) | `5173` | http://localhost:5173 |
| auth-service | `3001` | http://localhost:3001 |
| chat-service | `3002` | http://localhost:3002 |
| shop-service | `3003` | http://localhost:3003 |
| PostgreSQL | `5432` | `localhost:5432` |
| MongoDB (shop, Docker) | `27017` | `localhost:27017` |
| MongoDB (chat, Docker) | — | internal only (use `docker exec`) |

> `auth-service` falls back to port `4000` when `PORT` is not set (see `auth-service/src/server.js`). The frontend defaults to `3001`. For local development, either set `PORT=3001` in `auth-service/.env`, or set `VITE_AUTH_API_URL=http://localhost:4000` in the root `.env`.

---

## Project structure

```text
herogalary-master/
├─ src/                       # React application (Vanguard, Films, Comics, Shop, Chat, Dashboard)
│  ├─ api/                    # authApi.js, chatApi.js, shopApi.js
│  ├─ components/             # UI components, including ChatRooms and ShopSection
│  ├─ dashboard/              # Dashboard application
│  ├─ pages/                  # Comic pages
│  └─ main.jsx
├─ auth-service/
│  ├─ prisma/
│  │  ├─ schema.prisma        # User, RefreshToken, UserFavorite, UserWatchlist, UserComic
│  │  └─ migrations/
│  ├─ scripts/generate-keys.js
│  ├─ src/
│  │  ├─ app.js               # /health, /api/auth, /api/dashboard
│  │  ├─ server.js
│  │  ├─ controllers/
│  │  ├─ middlewares/
│  │  ├─ routes/
│  │  ├─ services/
│  │  └─ utils/token.js       # RS256 signing and verification
│  ├─ docker-compose.yml      # PostgreSQL + migrations + auth-service
│  ├─ Dockerfile
│  └─ .env.example
├─ chat-service/
│  ├─ src/
│  │  ├─ app.js               # /health, /api/rooms
│  │  ├─ server.js            # HTTP + Socket.IO
│  │  ├─ models/              # Room, Message
│  │  ├─ sockets/             # Handshake auth, chat events
│  │  └─ services/            # Room, message, presence
│  ├─ docker-compose.yml      # MongoDB + chat-service
│  ├─ Dockerfile
│  ├─ README.md               # Detailed chat documentation
│  └─ .env.example
├─ shop-service/
│  ├─ src/
│  │  ├─ app.js               # /health, /api/orders
│  │  ├─ models/order.model.js
│  │  └─ controllers/order.controller.js
│  ├─ docker-compose.yml      # MongoDB + shop-service
│  ├─ Dockerfile
│  ├─ README.md
│  └─ .env.example
├─ docker-compose.yml         # Frontend only
├─ docker-compose.global.yml  # Frontend, APIs and databases
├─ Dockerfile                 # Frontend build (Vite → Nginx)
├─ nginx.conf
├─ .env.example               # VITE_* API URLs
└─ package.json
```

> The existing Compose files remain available for running services individually. The root `docker-compose.yml` still builds only the frontend; use `docker-compose.global.yml` to start the full stack.

---

## Prerequisites

- **Node.js 20.19+ or 22.12+** (Node 22 LTS recommended)
- **npm**
- **Docker** and **Docker Compose v2** (`docker compose`)
- **Git**
- Optional for local database access:
  - `psql` (PostgreSQL client)
  - `mongosh` (MongoDB Shell)

Verify your installation:

```bash
node --version    # v20.19+ or v22.12+
npm --version
docker --version
docker compose version
```

---

## Quick start with Docker

### 1. Clone the repository

```bash
git clone <repository-url>
cd herogalary-master
```

### 2. Generate the JWT key pair (once)

`auth-service` signs tokens with a private key. `chat-service` and `shop-service` verify them with the matching public key.

```bash
cd auth-service
npm install
npm run generate:keys
```

This creates:

```text
auth-service/keys/private.pem
auth-service/keys/public.pem
```

> `keys/` is ignored by Git. The Dockerfile copies it, and the chat/shop containers mount `public.pem` at runtime, so **generate the keys before building the images**.

### Démarrer toute la stack

Depuis la racine du dépôt, démarrez le frontend, les trois APIs et leurs bases de données avec :

```bash
docker compose -f docker-compose.global.yml up -d --build
```

PostgreSQL et les deux MongoDB utilisent des volumes persistants. Pour arrêter les conteneurs sans supprimer les données :

```bash
docker compose -f docker-compose.global.yml down
```

Les étapes suivantes décrivent l'option existante pour démarrer chaque service séparément.

### 3. Start the auth service and PostgreSQL

```bash
# Still in auth-service/ from the previous step
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD and keep DATABASE_URL consistent.
docker compose up -d --build
```

This starts:

| Container | Role |
|---|---|
| `heroverse-postgres` | PostgreSQL 17 |
| `heroverse-auth-migrate` | One-shot `prisma migrate deploy` |
| `heroverse-auth` | auth-service on port 3001 |

Check the logs:

```bash
docker compose logs -f auth-service
curl http://localhost:3001/health
# {"status":"ok"}
```

### 4. Start the shop service and its MongoDB

```bash
cd ../shop-service
docker compose up -d --build
curl http://localhost:3003/health
# {"status":"ok"}
```

### 5. Start the chat service and its MongoDB

```bash
cd ../chat-service
docker compose up -d --build
curl http://localhost:3002/health
# {"status":"ok","db":"connected"}
```

### 6. Start the frontend

```bash
cd ..
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

To test the authentication screens directly:

```text
http://localhost:5173/auth-preview.html?mode=login
http://localhost:5173/auth-preview.html?mode=signup
```

### Stop everything

Each service is stopped from its own directory:

```bash
cd auth-service && docker compose down
cd ../shop-service && docker compose down
cd ../chat-service && docker compose down
```

Add `-v` to also delete the database volumes (destructive).

---

## Local development without Docker

You can run the services with `npm run dev` and use local (or containerised) databases.

### 1. Start PostgreSQL and MongoDB

Using Docker for the databases only:

```bash
# PostgreSQL for auth-service
docker run -d --name heroverse-postgres-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=heroverse_auth \
  -p 5432:5432 \
  postgres:17

# MongoDB shared by chat-service and shop-service
# (two separate databases on the same server)
docker run -d --name heroverse-mongo-dev \
  -p 27017:27017 \
  mongo:7
```

Or use locally installed PostgreSQL and MongoDB listening on the default ports.

> Do not run these development containers at the same time as the Compose stacks: the ports (`5432`, `27017`) would conflict.

### 2. auth-service

```bash
cd auth-service
cp .env.example .env
```

Edit `.env`:

```dotenv
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/heroverse_auth"
```

Then:

```bash
npm install
npm run generate:keys      # if keys/ does not exist yet
npx prisma migrate dev     # apply the migrations
npm run dev
```

The API listens on http://localhost:3001.

Useful Prisma scripts:

```bash
npm run prisma:generate    # regenerate the Prisma client
npm run prisma:migrate     # prisma migrate dev
npx prisma studio          # visual database browser on http://localhost:5555
```

### 3. shop-service

```bash
cd ../shop-service
cp .env.example .env
npm install
npm run dev
```

Default `.env`:

```dotenv
PORT=3003
MONGO_URI=mongodb://127.0.0.1:27017/heroverse_shop
CORS_ORIGIN=http://localhost:5173
JWT_ISSUER=heroverse-auth
JWT_AUDIENCE=heroverse-services
JWT_PUBLIC_KEY_PATH=../auth-service/keys/public.pem
```

### 4. chat-service

```bash
cd ../chat-service
cp .env.example .env
npm install
npm run dev
```

Default `.env`:

```dotenv
PORT=3002
MONGO_URI=mongodb://localhost:27017/heroverse_chat
CORS_ORIGIN=http://localhost:5173
JWT_ISSUER=heroverse-auth
JWT_AUDIENCE=heroverse-services
JWT_PUBLIC_KEY_PATH=../auth-service/keys/public.pem
MESSAGE_HISTORY_LIMIT=100
```

> `JWT_PUBLIC_KEY_PATH` is resolved from the `chat-service/` directory. Start the command from that folder, or use an absolute path.

### 5. Frontend

At the repository root:

```bash
cp .env.example .env
npm install
npm run dev
```

Root `.env`:

```dotenv
VITE_AUTH_API_URL=http://localhost:3001
VITE_CHAT_API_URL=http://localhost:3002
VITE_SHOP_API_URL=http://localhost:3003
```

---

## Environment variables

### Frontend (root `.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_AUTH_API_URL` | `http://localhost:3001` | auth-service base URL |
| `VITE_CHAT_API_URL` | `http://localhost:3002` | chat-service base URL (REST + Socket.IO) |
| `VITE_SHOP_API_URL` | `http://localhost:3003` | shop-service base URL |
| `FRONTEND_PORT` | `5173` | Host port used by the root Docker Compose file |

> Vite variables are **baked at build time**. In Docker they are build arguments: change them and rebuild the frontend image. In development, restart `npm run dev` after editing `.env`.

### auth-service

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` (local) / `3001` (Docker) | HTTP port |
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_ISSUER` | `heroverse-auth` | Token issuer |
| `JWT_AUDIENCE` | `heroverse-services` | Token audience |
| `JWT_PRIVATE_KEY_PATH` | `./keys/private.pem` | Private RSA key |
| `JWT_PUBLIC_KEY_PATH` | `./keys/public.pem` | Public RSA key |
| `ACCESS_TOKEN_TTL_SECONDS` | `900` | Access token lifetime (15 min) |
| `REFRESH_TOKEN_TTL_SECONDS` | `604800` | Refresh token lifetime (7 days) |
| `REFRESH_COOKIE_NAME` | `heroverse_refresh` | Refresh cookie name |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `POSTGRES_USER` | `postgres` | Docker PostgreSQL user |
| `POSTGRES_PASSWORD` | `admin123` (Compose fallback) | Docker PostgreSQL password |
| `POSTGRES_DB` | `heroverse_auth` | Docker PostgreSQL database |
| `POSTGRES_PORT` | `5432` | Host port for PostgreSQL |
| `AUTH_PORT` | `3001` | Host port for auth-service |

> **Keep `DATABASE_URL` and `POSTGRES_PASSWORD` consistent.** The Compose stack builds `DATABASE_URL` from `POSTGRES_*`, but Prisma Studio and local tools read `DATABASE_URL` directly.

### chat-service

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3002` in `.env.example` (`3003` code fallback) | HTTP port |
| `MONGO_URI` | `mongodb://localhost:27017/heroverse_chat` | MongoDB connection string |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origins (comma-separated) |
| `JWT_ISSUER` | `heroverse-auth` | Expected issuer |
| `JWT_AUDIENCE` | `heroverse-services` | Expected audience |
| `JWT_PUBLIC_KEY_PATH` | `../auth-service/keys/public.pem` | Public RSA key |
| `JWT_PUBLIC_KEY` | — | Inline PEM key (takes precedence) |
| `MESSAGE_HISTORY_LIMIT` | `100` | Default history size |
| `CHAT_PORT` | `3002` | Host port for chat-service |
| `MONGO_DB` | `heroverse_chat` | MongoDB database name in Docker |

### shop-service

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3003` | HTTP port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/heroverse_shop` | MongoDB connection string |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `JWT_ISSUER` | `heroverse-auth` | Expected issuer |
| `JWT_AUDIENCE` | `heroverse-services` | Expected audience |
| `JWT_PUBLIC_KEY_PATH` | `../auth-service/keys/public.pem` | Public RSA key |
| `MONGO_PORT` | `27017` | Host port for MongoDB |
| `SHOP_PORT` | `3003` | Host port for shop-service |

> `POSTGRES_*`, `AUTH_PORT`, `CHAT_PORT`, `MONGO_DB`, `MONGO_PORT`, `SHOP_PORT`, and `FRONTEND_PORT` are read by Docker Compose. The Node services read the variables listed in their own sections.

---

## Database access

### PostgreSQL — auth-service

The database is named `heroverse_auth` by default and stores the Prisma models:
`User`, `RefreshToken`, `UserFavorite`, `UserWatchlist`, `UserComic`.

#### With Docker (recommended)

Open an interactive `psql` session inside the container:

```bash
docker exec -it heroverse-postgres psql -U postgres -d heroverse_auth
```

If you changed `POSTGRES_USER` or `POSTGRES_DB` in `auth-service/.env`, replace the values:

```bash
docker exec -it heroverse-postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB>
```

Useful `psql` commands:

```sql
\dt                                  -- list tables
\d "User"                            -- describe the User table
SELECT id, username, email, role FROM "User";
SELECT id, "userId", "expiresAt", "revokedAt" FROM "RefreshToken";
\q                                   -- quit
```

> Prisma table names are case-sensitive and must be quoted: `"User"`, `"RefreshToken"`, etc.

Run a single query without opening a session:

```bash
docker exec -it heroverse-postgres \
  psql -U postgres -d heroverse_auth \
  -c 'SELECT id, username, email, role FROM "User";'
```

#### With a local PostgreSQL server

```bash
psql -h localhost -p 5432 -U postgres -d heroverse_auth
```

Or with a full connection URL:

```bash
psql "postgresql://postgres:password@localhost:5432/heroverse_auth"
```

#### Prisma Studio

A visual browser for the PostgreSQL data (from the repository root):

```bash
cd auth-service
npx prisma studio
```

Open http://localhost:5555. `DATABASE_URL` must point to a reachable database (for example `postgresql://postgres:password@localhost:5432/heroverse_auth`).

#### Backup and restore

```bash
# Dump
docker exec -t heroverse-postgres \
  pg_dump -U postgres heroverse_auth > heroverse_auth_backup.sql

# Restore
cat heroverse_auth_backup.sql | \
  docker exec -i heroverse-postgres psql -U postgres -d heroverse_auth
```

### MongoDB — shop-service

The shop database is `heroverse_shop`; orders are stored in the `orders` collection.

#### With Docker

The shop Compose file publishes MongoDB on `27017`, so both commands work:

```bash
# From inside the container
docker exec -it heroverse-mongo mongosh heroverse_shop

# From the host, if mongosh is installed
mongosh "mongodb://localhost:27017/heroverse_shop"
```

Useful commands:

```js
show collections
db.orders.countDocuments()
db.orders.find().pretty()
db.orders.findOne()
db.orders.find({ userId: "<user-uuid>" }).sort({ createdAt: -1 }).pretty()
```

#### With a local MongoDB server

```bash
mongosh "mongodb://localhost:27017/heroverse_shop"
```

### MongoDB — chat-service

The chat database is `heroverse_chat`; data lives in the `rooms` and `messages` collections.

#### With Docker

The chat Compose file does **not** publish MongoDB on the host. Use `docker exec`:

```bash
docker exec -it heroverse-chat-mongo mongosh heroverse_chat
```

Useful commands:

```js
show collections
db.rooms.find().pretty()
db.messages.countDocuments()
db.messages.find().sort({ createdAt: -1 }).limit(20).pretty()
db.messages.find({ roomId: "captain-meteor" }).sort({ createdAt: 1 }).pretty()
```

If you need host access, add a port mapping to `chat-service/docker-compose.yml`:

```yaml
services:
  mongo:
    ports:
      - "27018:27017"
```

Then reconnect with:

```bash
mongosh "mongodb://localhost:27018/heroverse_chat"
```

> Use `27018` to avoid conflicting with the shop MongoDB, which already uses `27017`.

#### With a local MongoDB server

```bash
mongosh "mongodb://localhost:27017/heroverse_chat"
```

### Reset the databases

> These commands delete data permanently.

```bash
# PostgreSQL (auth)
cd auth-service
docker compose down -v
docker compose up -d --build

# MongoDB (shop)
cd ../shop-service
docker compose down -v
docker compose up -d --build

# MongoDB (chat)
cd ../chat-service
docker compose down -v
docker compose up -d --build
```

For a local Prisma database (from the repository root):

```bash
cd auth-service
npx prisma migrate reset
```

---

## API reference

All protected endpoints expect:

```http
Authorization: Bearer <accessToken>
```

Errors use a consistent shape:

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Access token is invalid or expired"
  }
}
```

### auth-service — `http://localhost:3001`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Create an account |
| `POST` | `/api/auth/login` | No | Log in, return access token, set refresh cookie |
| `POST` | `/api/auth/refresh` | Refresh cookie | Rotate the session |
| `POST` | `/api/auth/logout` | Refresh cookie | Revoke the refresh token |
| `GET` | `/api/auth/me` | Bearer | Current user profile |
| `PATCH` | `/api/auth/me` | Bearer | Update username and bio |
| `PATCH` | `/api/auth/me/password` | Bearer | Change the password |

**Password rules:** at least 8 characters, one uppercase letter and one digit.

Register:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "NovaFan",
    "email": "nova@example.com",
    "password": "Hero1234"
  }'
```

Login and store the token in a shell variable (requires `jq`):

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nova@example.com","password":"Hero1234"}' \
  | jq -r '.accessToken')

echo "$TOKEN"
```

Login response:

```json
{
  "user": {
    "id": "<uuid>",
    "username": "NovaFan",
    "email": "nova@example.com",
    "role": "USER"
  },
  "accessToken": "<jwt>",
  "expiresIn": 900
}
```

Authenticated request:

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

> With `curl`, the refresh cookie must be kept in a cookie jar: add `-c cookies.txt` to the login request and `-b cookies.txt` to `/api/auth/refresh` and `/api/auth/logout`.

### Dashboard — `http://localhost:3001/api/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/user` | Dashboard profile |
| `PATCH` | `/profile` | Update name and bio |
| `GET` | `/stats` | Favorites, comics read, games played, XP |
| `GET` | `/continue-reading` | Current comic to resume |
| `GET` | `/favorites` | User favourites |
| `GET` | `/watchlist` | Watchlist |
| `PATCH` | `/watchlist/:id` | Update a watch status (`to-watch`, `watching`, `watched`) |
| `GET` | `/comics` | User comics |

Example:

```bash
curl http://localhost:3001/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

### chat-service — `http://localhost:3002`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Service and MongoDB status |
| `GET` | `/api/rooms` | Bearer | Rooms with `messageCount`, `lastMessage`, `onlineCount` |
| `POST` | `/api/rooms` | Bearer | Create a room |
| `GET` | `/api/rooms/:id/messages?limit=100` | Bearer | Latest messages (max 200) |

Create a room:

```bash
curl -X POST http://localhost:3002/api/rooms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Captain Meteor",
    "universe": "Vault Comics",
    "description": "Theories and origins"
  }'
```

Allowed universes: `Vault Comics`, `Nova Press`, `Starlight`, `Marble Studios`, `Zenith`, `Neon House`, `Autre`.

Socket.IO connection:

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3002", {
  auth: { token: accessToken },
});
```

| Direction | Event | Payload |
|---|---|---|
| Client → server | `room:join` | `{ roomId }` |
| Client → server | `room:leave` | `{ roomId }` |
| Client → server | `message:send` | `{ roomId, text }` |
| Client → server | `typing:start` / `typing:stop` | `{ roomId }` |
| Server → client | `message:new` | `{ message }` |
| Server → client | `presence:update` | `{ roomId, users, count }` |
| Server → client | `typing:update` | `{ roomId, user, isTyping }` |
| Server → client | `room:created` | `{ room }` |

The chat service applies a simple rate limit of **10 messages per 10 seconds per socket**. See [`chat-service/README.md`](chat-service/README.md) for the full protocol and error codes.

### shop-service — `http://localhost:3003`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/orders` | Bearer | Create an order |
| `GET` | `/api/orders/me` | Bearer | Current user's orders |
| `GET` | `/api/orders/user/:userId` | Bearer | Orders for a given user |

Create an order:

```bash
curl -X POST http://localhost:3003/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "comic-001",
        "name": "Crimson Falcon #1",
        "price": 4.99,
        "quantity": 2
      }
    ]
  }'
```

The server computes the total and stores the order with:

```json
{
  "payment": { "status": "unpaid", "amount": 9.98, "currency": "EUR" },
  "status": "pending"
}
```

> No payment provider is integrated. Orders are recorded as **unpaid**; no card data is collected.

---

## Frontend

The React application is organised into six sections: **Vanguard**, **Films**, **Comics**, **Shop**, **Chat**, and **Dashboard**.

| Script | Description |
|---|---|
| `npm run dev` | Start Vite on http://localhost:5173 |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

The API clients are:

- `src/api/authApi.js` — login, register, logout, token storage;
- `src/api/chatApi.js` — rooms, messages, Socket.IO connection;
- `src/api/shopApi.js` — order creation and order history.

The access token is stored in `sessionStorage` or `localStorage` depending on the “remember me” option. The refresh token stays in an `httpOnly` cookie managed by the browser.

The Chat and Shop sections require the user to be logged in.

---

## Docker reference

### Containers

| Container | Started by | Image / build | Port |
|---|---|---|---|
| `heroverse-frontend` | root `docker-compose.yml` | Vite build + Nginx | `5173` → `80` |
| `heroverse-postgres` | `auth-service/docker-compose.yml` | `postgres:17` | `5432` |
| `heroverse-auth-migrate` | `auth-service/docker-compose.yml` | auth-service image | — |
| `heroverse-auth` | `auth-service/docker-compose.yml` | auth-service image | `3001` |
| `heroverse-mongo` | `shop-service/docker-compose.yml` | `mongo:8` | `27017` |
| `heroverse-shop` | `shop-service/docker-compose.yml` | shop-service image | `3003` |
| `heroverse-chat-mongo` | `chat-service/docker-compose.yml` | `mongo:7` | internal |
| `heroverse-chat` | `chat-service/docker-compose.yml` | chat-service image | `3002` |

### Volumes

| Volume | Used by | Content |
|---|---|---|
| `postgres_data` | auth Compose | PostgreSQL data |
| `mongo_data` | shop Compose | Shop orders |
| `chat_mongo_data` | chat Compose | Rooms and messages |

### Common commands

```bash
# Build and start a service
cd auth-service && docker compose up -d --build

# Follow logs
docker compose logs -f auth-service

# List containers
docker compose ps

# Stop without deleting data
docker compose down

# Stop and delete the database volume
docker compose down -v
```

### Frontend image

```bash
# At the repository root
docker compose up -d --build
```

The frontend image uses build arguments for the API URLs:

```bash
VITE_AUTH_API_URL=http://localhost:3001 \
VITE_CHAT_API_URL=http://localhost:3002 \
VITE_SHOP_API_URL=http://localhost:3003 \
docker compose up -d --build
```

Because these values are compiled into the JavaScript bundle, changing them requires a rebuild.

---

## Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| `P1001: Can't reach database server` | PostgreSQL is not running, or `DATABASE_URL` is wrong. Check `docker compose ps` and the port. |
| `P1000: Authentication failed` | `DATABASE_URL` password does not match `POSTGRES_PASSWORD`. Align both values. |
| `ENOENT ... public.pem` | The JWT keys are missing. Run `cd auth-service && npm run generate:keys`, or fix `JWT_PUBLIC_KEY_PATH`. |
| `401 MISSING_TOKEN` | Add `Authorization: Bearer <accessToken>`. |
| `401 INVALID_TOKEN` | Token expired, or issuer/audience/public key mismatch between auth, chat and shop. |
| `401 TOKEN_EXPIRED` | The access token lasts 15 minutes. Call `/api/auth/refresh` or log in again. |
| CORS error in the browser | Add the frontend origin to `CORS_ORIGIN` in the affected service, then restart it. |
| `db: "degraded"` from chat `/health` | MongoDB is unreachable. Check `MONGO_URI` and that the Mongo container is healthy. |
| Chat service starts on port `3003` unexpectedly | `PORT` is unset and `chat-service` falls back to `3003`. Copy `.env.example` (`PORT=3002`) or set `PORT` explicitly. |
| `EADDRINUSE` / port already in use | Another process or container uses the port. Change `*_PORT` variables or stop the conflicting process. |
| Auth Docker build fails with `keys: not found` | Generate the keys before building: `npm run generate:keys`. |
| `auth-migrate` container exits with an error | PostgreSQL was not ready or `DATABASE_URL` is invalid. Run `docker compose logs auth-migrate`. |
| Frontend still calls an old API URL | Vite variables are build-time. Restart `npm run dev` or rebuild the Docker image. |
| Chat connects but no messages appear | The socket must join the room first (`room:join`), and `message:send` requires a valid token and a joined room. |
| MongoDB data disappeared | `docker compose down -v` was used. The `-v` flag deletes the volume. |

### Health checks

```bash
curl http://localhost:3001/health
# {"status":"ok"}

curl http://localhost:3002/health
# {"status":"ok","db":"connected"}

curl http://localhost:3003/health
# {"status":"ok"}
```

---

K8S
HeroVerse/
│
├── k8s/
│   │
│   ├── namespace.yaml
│   │
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   ├── auth/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   ├── chat/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   ├── shop/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   ├── databases/
│   │   ├── postgres-deployment.yaml
│   │   ├── postgres-service.yaml
│   │   ├── postgres-pvc.yaml
│   │   ├── chat-mongo-deployment.yaml
│   │   ├── chat-mongo-service.yaml
│   │   ├── chat-mongo-pvc.yaml
│   │   ├── shop-mongo-deployment.yaml
│   │   ├── shop-mongo-service.yaml
│   │   └── shop-mongo-pvc.yaml
│   │
│   ├── configmap.yaml
│   └── secrets.yaml cree fichie que n'exite pas sans ajoute aucun code [k8s](directory;file:///c%3A/Users/ahmed/OneDrive/Bureau/HeroVerse/k8s) 


## Known limitations

- **Separate Compose files remain supported.** Each service has its own `docker-compose.yml`; use `docker-compose.global.yml` for a single full-stack startup.
- **Local auth port differs from Docker.** `auth-service` defaults to `4000` locally and `3001` in Docker. Set `PORT=3001` or adjust `VITE_AUTH_API_URL`.
- **Chat MongoDB is not exposed** by its individual Compose file. The global Compose file publishes it on port `27018` by default.
- **Presence is stored in memory.** The chat service assumes a single instance; a multi-instance deployment would need a Redis adapter.
- **Socket.IO authenticates at handshake only.** After the 15-minute access token expires, the client must reconnect with a fresh token.
- **Vite environment variables are build-time constants**, not runtime configuration.
- **`GET /api/orders/user/:userId`** is protected by authentication but does not enforce ownership or an admin role yet.
- **No automated tests** are configured (the `test` scripts are placeholders where present).
- **Payments are not implemented.** Orders remain `unpaid` and `pending`.

---

## License

This project was built as an academic project. No license file is included; add one if you plan to distribute or reuse the code.
