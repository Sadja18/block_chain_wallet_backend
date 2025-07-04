# GoPay Backend

Backend API for GoPay wallet management using Node.js, Express, Prisma, and Ethers.js.

---

## Features

- User authentication with JWT
- Wallet creation and import
- Wallet balance retrieval (via Ethereum Sepolia testnet)
- Transaction sending
- Prisma ORM with PostgreSQL

---

## Prerequisites

- Node.js (v22+ recommended)
- PostgreSQL database
- An Ethereum Sepolia RPC URL (Infura, Alchemy, or any provider)
- npm or yarn

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Sadja18/block_chain_wallet_backend.git
cd bepay-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up the environment variables
- Copy `.env_copy` to `.env`:
```bash
cp .env_copy .env
```

- Edit `.env` and fill in your own values:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
SHADOW_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/SHADOW_DATABASE"
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
JWT_SECRET=your_jwt_secret_here
```

### 4. Run prisma migrations and generate client
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the server
```bash
npm run start
```

## API Endpoints
- `POST /api/auth/register` — Register a new user

- `POST /api/auth/login` — Login and receive JWT

- `POST /api/wallet/create` — Create a new wallet (auth required)

- `POST /api/wallet/import` — Import wallet by private key (auth required)

- `GET /api/wallet/my` — Get user's wallets (auth required)

- `GET /api/wallet/balance?address=<wallet_address>` — Get balance for a wallet (auth required)

- `POST /api/wallet/send` — Send transaction (auth required)

## Testing the API
- You can use tools like Thunder Client, Postman, or curl to test the routes.

- Make sure to include your JWT token in the Authorization header for protected routes:
```
Authorization: Bearer <your_jwt_token>
```

## Notes
- Tokens are JWT and validated without database storage.

- Use a reliable RPC provider for Sepolia (Infura, Alchemy recommended).

- Prisma schema and migrations are located in prisma/ directory.


---

### Why is `SHADOW_DATABASE_URL` needed?

Prisma uses a **shadow database** during migrations to safely apply schema changes before applying them to your actual database. This avoids corrupting your real data if something goes wrong. Prisma runs introspection and migration commands against this isolated shadow database.

---

### How to configure `SHADOW_DATABASE_URL`

In your `.env` file, you should add a URL for the shadow database. Usually, it can be a separate empty database or a copy of your main one:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/maindb
SHADOW_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/shadowdb
```

---

### Common issues with migrations & access

1. **Schema access but not public access on PostgreSQL:**

   * When Prisma complains about access issues during migration, it often means your database user has permission on the schema you created (e.g., `public`) but **not on the shadow database or its schema**.
   * Prisma needs the user to have the **same permissions on the shadow database** as on the main database.

2. **Resolving permission issues:**

   * Create the shadow database if it does not exist.
   * Grant the user full privileges on the shadow database and its schema:

   ```sql
   CREATE DATABASE shadowdb;
   GRANT ALL PRIVILEGES ON DATABASE shadowdb TO your_user;

   -- Connect to shadowdb
   \c shadowdb;
   GRANT ALL PRIVILEGES ON SCHEMA public TO your_user;
   ```

   * Ensure that your user can create tables, run migrations, and introspect schema on both databases.

3. **Matching database versions:**

   * The shadow database should be the **same PostgreSQL version** as the main one to avoid subtle incompatibilities during migrations.

---

### Example `.env` snippet including shadow database

```env
DATABASE_URL=postgresql://user:password@localhost:5432/bepaydb
SHADOW_DATABASE_URL=postgresql://user:password@localhost:5432/bepay_shadowdb
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
JWT_SECRET=your_jwt_secret
```
