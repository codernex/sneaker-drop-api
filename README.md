# Sneaker Drop API — Real-Time High-Traffic Inventory System

Backend for the **Limited Edition Sneaker Drop** technical assessment.
Built with **Node.js + Express**, **PostgreSQL**, **Prisma ORM**, and **Socket.io**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Architecture Decisions](#architecture-decisions)
  - [60-Second Expiration Logic](#60-second-expiration-logic)
  - [Concurrency & Race-Condition Handling](#concurrency--race-condition-handling)
- [Running Locally](#running-locally)

---

## Tech Stack

| Layer        | Technology                    |
|--------------|-------------------------------|
| Runtime      | Node.js (CommonJS)            |
| Framework    | Express 5                     |
| Database     | PostgreSQL                    |
| ORM          | Prisma 7                      |
| Real-time    | Socket.io 4                   |
| Validation   | Zod                           |
| Language     | TypeScript 5                  |
| Dev server   | Nodemon + ts-node             |

---

## Database Constraints

| Table / Column(s)                  | Type    | Purpose                                                           |
|------------------------------------|---------|-------------------------------------------------------------------|
| `reservations(user_id, drop_id)`   | Index   | Fast lookup of a user's reservations for a specific drop          |
| `reservations(expires_at, status)` | Index   | Efficient expiry-sweep queries run every 5 s by the job           |
| `reservations(drop_id)`            | Index   | Joins from drops to reservations                                  |
| `purchases(reservation_id)`        | Unique  | Ensures exactly one purchase record per reservation               |

> **Why no unique constraint on `(user_id, drop_id, status)`?**
> An earlier version had `@@unique([userId, dropId, status])`, intended to prevent duplicate *active* reservations. However it incorrectly applied to **all** statuses: once a user's reservation expired (creating an `EXPIRED` row), re-reserving the same drop would eventually try to create a second `EXPIRED` row and hit a unique-constraint violation. Duplicate `PENDING` reservations are prevented at the application layer instead — a `findFirst` check combined with a `pg_try_advisory_xact_lock` inside the reservation transaction.

---



### Health

| Method | Endpoint  | Description        |
|--------|-----------|--------------------|
| GET    | `/health` | Liveness check     |

## API Reference

All routes are prefixed with `/api/v1`.

### Users

| Method | Endpoint              | Body                          | Description              |
|--------|-----------------------|-------------------------------|--------------------------|
| POST   | `/users`              | `{ username, email }`         | Register / upsert user   |
| GET    | `/users/:id`          | —                             | Get user by ID           |

### Drops

| Method | Endpoint      | Body / Params                                                                | Description                                |
|--------|---------------|------------------------------------------------------------------------------|--------------------------------------------|
| GET    | `/drops`      | —                                                                            | List all active drops + top-3 purchasers   |
| GET    | `/drops/:id`  | —                                                                            | Get single drop + top-3 purchasers         |
| POST   | `/drops`      | `{ name, description?, imageUrl?, totalStock, price, startsAt, endsAt? }`   | Initialize a new merch drop (admin)        |

**Example — Create Drop:**
```json
POST /api/v1/drops
{
  "name": "Air Jordan 1 Retro High OG",
  "description": "Chicago colorway, limited to 100 pairs.",
  "totalStock": 100,
  "price": 180.00,
  "startsAt": "2025-07-01T10:00:00Z"
}
```

**Example — Drop response (with activity feed):**
```json
{
  "id": "clx...",
  "name": "Air Jordan 1 Retro High OG",
  "availableStock": 97,
  "price": "180.00",
  "recentPurchasers": [
    { "username": "sneakerhead99", "purchasedAt": "2025-07-01T10:02:15Z" },
    { "username": "kickz_lord",    "purchasedAt": "2025-07-01T10:01:44Z" },
    { "username": "aj1_collector", "purchasedAt": "2025-07-01T10:01:09Z" }
  ]
}
```

### Reservations

| Method | Endpoint            | Body                        | Description                              |
|--------|---------------------|-----------------------------|------------------------------------------|
| POST   | `/reservations`     | `{ userId, dropId }`        | Atomically reserve one unit (60s TTL)    |
| GET    | `/reservations/:id` | —                           | Get reservation status                   |
| DELETE | `/reservations/:id` | `{ userId }`                | Cancel a pending reservation             |

### Purchases

| Method | Endpoint                       | Body                          | Description                       |
|--------|--------------------------------|-------------------------------|-----------------------------------|
| POST   | `/purchases`                   | `{ reservationId, userId }`   | Complete purchase (requires PENDING reservation) |
| GET    | `/purchases/drop/:dropId`      | —                             | All purchases for a drop           |
| GET    | `/purchases/user/:userId`      | —                             | All purchases by a user            |

---

## WebSocket Events

The server uses **Socket.io** with drop-scoped rooms for targeted messaging. Both client and server-emitted events are listed below.

### Client → Server

| Event        | Payload          | Description                                |
|--------------|------------------|--------------------------------------------|
| `drop:join`  | `dropId: string` | Subscribe to real-time events for a drop   |
| `drop:leave` | `dropId: string` | Unsubscribe from a drop room               |

### Server → Client

| Event                 | Payload                                                         | Broadcast scope | Description                                  |
|-----------------------|-----------------------------------------------------------------|-----------------|----------------------------------------------|
| `stock:update`        | `{ dropId, availableStock, event, recoveredUnits? }`           | Global          | Fired on reserve, cancel, or expiry          |
| `reservation:created` | `{ reservationId, expiresAt }`                                 | Drop room only  | Confirms reservation to the reserving client |
| `purchase:completed`  | `{ dropId, username, dropName, purchasedAt }`                  | Global          | Updates activity feed on all clients         |
| `drop:new`            | `{ drop }`                                                     | Global          | New drop was initialized                     |
| `drop:deactivated`    | `{ dropId }`                                                   | Global          | Drop was soft-deleted                        |

---

## Architecture Decisions

### 60-Second Expiration Logic

**Choice: Database-polling background job (`setInterval` @ 5s)**

When a reservation is created, `expiresAt` is stored as `NOW() + 60s` in the database. A background job (`src/jobs/expiryJob.ts`) polls every **5 seconds** for any `PENDING` reservations whose `expiresAt ≤ NOW()`.

**Why polling instead of `setTimeout` per reservation?**

| Approach                          | Pros                                  | Cons                                               |
|-----------------------------------|---------------------------------------|----------------------------------------------------|
| `setTimeout` per reservation      | Fires exactly on time                 | Lost on server restart; memory leak at high volume |
| DB polling (chosen)               | Restart-safe, no in-memory state      | ±5s accuracy (acceptable for 60s TTL)              |
| BullMQ + Redis (production ideal) | Accurate, distributed, durable        | Adds infrastructure complexity                     |

When expired reservations are found, the job:
1. Marks them `EXPIRED` in a single `updateMany`.
2. Increments `availableStock` on the parent drop (batched per drop within a Prisma transaction).
3. Emits a `stock:update` WebSocket event so all connected clients instantly see the restored stock.

The `intervalHandle.unref()` call ensures the interval does not prevent Node.js from exiting cleanly during tests or graceful shutdown.

---

### Concurrency & Race-Condition Handling

**Problem:** 100 users clicking "Reserve" at the same millisecond for the last 1 item — only 1 should succeed.

**Solution: Dual-layer locking inside a Prisma `$transaction`**

```
┌─────────────────────────────────────────────────────────────┐
│  BEGIN TRANSACTION                                          │
│                                                             │
│  1. pg_try_advisory_xact_lock(hashtext(dropId))            │
│     → Transaction-scoped advisory lock, unique per drop     │
│     → Non-blocking (pg_try_*): returns false if busy        │
│     → Competing request gets 409 CONFLICT immediately       │
│                                                             │
│  2. SELECT … FROM drops WHERE id = $1 FOR UPDATE           │
│     → Row-level write lock on the specific drop row         │
│     → Prevents phantom reads — stock value is committed     │
│                                                             │
│  3. Check available_stock >= 1                              │
│                                                             │
│  4. UPDATE drops SET available_stock = available_stock - 1  │
│     (atomic decrement, no race between read and write)      │
│                                                             │
│  5. INSERT INTO reservations …                              │
│                                                             │
│  COMMIT — both locks released                               │
└─────────────────────────────────────────────────────────────┘
```

**Why two locks?**

- The **advisory lock** prevents multiple transactions from even reaching the stock check concurrently for the same drop, giving a fast-fail to competing requests.
- The **`FOR UPDATE` row lock** is a defense-in-depth guarantee: even if two transactions somehow passed the advisory lock, only one can hold the row lock and perform the decrement — the other will wait and then read the updated (0) stock.

This guarantees that **exactly one** user can reserve the last item, regardless of concurrent load. All other simultaneous requests receive a `409 Conflict` with a user-friendly "High demand!" message.

---

## Running Locally

### Prerequisites

- Node.js ≥ 20
- pnpm (`npm install -g pnpm`)
- A running PostgreSQL instance (local or [Neon](https://neon.tech))

### 1. Clone & Install

```bash
git clone git@github.com:codernex/sneaker-drop-api.git
cd sneaker-drop-api
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
RESERVATION_TTL_SECONDS=60
```

### 3. Apply Database Schema

```bash
# Run migrations (creates tables & indexes)
pnpm prisma:migrate

# Generate the Prisma client
pnpm prisma:generate
```

> For a fresh database without migration history, you can use `pnpm prisma:push` instead.

### 4. Start Development Server

```bash
pnpm dev
```

The server starts at:
- **HTTP API:** `http://localhost:4000`
- **WebSocket:** `ws://localhost:4000`
- **Health check:** `http://localhost:4000/health`

### 5. Production Build

```bash
pnpm build    # Compiles TypeScript → dist/
pnpm start    # Runs dist/server.js
```
