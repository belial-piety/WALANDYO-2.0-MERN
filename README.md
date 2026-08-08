# Walandyo Tapsilogan — Integrated POS System

A multi-branch Point-of-Sale, inventory, and reporting web app built for
**Walandyo Tapsilogan** (4 branches + 1 food truck).

This is a **MERN** (MongoDB + Express + React) application:

- **Backend / API:** Node.js + Express (`server/`)
- **Database:** MongoDB via Mongoose (`server/models/`)
- **Frontend:** React + Vite SPA (`client/`)

The app comes with **auto-seeding** and an **embedded in-memory database**, so
you can install and run it with almost no configuration.

---

## 🧑‍🍳 Beginner's Guide — Installing & Running This (No Coding Experience Needed)

### Part 1 — Install the one program you need (one-time only)

**Node.js** is the only required program.

1. Go to **https://nodejs.org**
2. Click the big green button labeled **LTS** (stable version).
3. Open the downloaded file and click Next/Continue through the installer,
   accepting the defaults, until it finishes.
4. To verify, open a terminal (see Part 2) and type:
   ```
   node -v
   ```
   Press **Enter**. You should see something like `v18.x.x` or newer.

> **Optional builders:** The app uses an embedded in-memory database by
> default, so **you do not need to install MongoDB or MySQL**. If you prefer
> to use your own MongoDB server, see the "Custom MongoDB server" heading
> further down.

### Part 2 — Open a terminal (command prompt)

- **Windows:** Click the Start menu, type `cmd`, and open **Command Prompt**
  (or use PowerShell / the terminal built into VS Code).
- **Mac:** Open **Finder → Applications → Utilities → Terminal**.

### Part 3 — Go into the project folder

Type `cd ` (with a space after it), then drag the `WALANDYO-2.0-MERN` folder
from your file explorer into the terminal window (this auto-fills the path),
then press **Enter**. It should look something like:

```
cd C:\Users\YourName\Desktop\Coding Projects\WALANDYO-2.0-MERN
```

### Part 4 — Install the app's building blocks

In the same terminal window, type:

```
npm install
```

Press **Enter** and wait. This downloads everything the app needs to run and
can take a minute or two. You'll know it's done when your cursor returns to a
new line with no more text scrolling. (Yellow "warnings" are normal; only
worry if you see the word `Error` in red.)

### Part 5 — Start the app

Type:

```
npm start
```

Press **Enter**. You should see messages that include:

```
[DB] Starting embedded MongoMemoryReplSet ...
[Server] Walandyo POS server running on http://0.0.0.0:3000
```

**Leave this terminal window open** — closing it stops the app.

Now open your web browser (Chrome, Edge, Safari — any of them) and go to:

**http://localhost:3000**

You should land on a login page. 🎉

### Part 6 — Log in

Use one of these demo accounts to explore (full list under **Demo logins**):

| Role | Username | Password |
|---|---|---|
| Owner/Admin (sees everything) | `admin` | `admin123` |
| Cashier (rings up orders) | `cashier1` | `cashier123` |

When you're done, close the browser tab any time. To stop the app, click into
the terminal window and press **Ctrl+C**. To run it again later, just repeat
**Part 5** (`npm start`) — Parts 1–4 are one-time setup.

---

## 📖 How to Use the Program

Once logged in, here's what each part of the sidebar does.

- **POS Counter** (Cashier, Manager, Admin) — The main ordering screen. The
  left side shows food/drink cards filtered by category and searchable. Click
  a card to add it to the cart on the right. Use `+`/`−` to adjust quantity
  or `✕` to remove an item. Choose a payment method (Cash, GCash, Card),
  then click the big red **Charge** button to complete the sale. A receipt
  opens automatically — print it or close it.
- **Menu Items** (Manager, Admin) — Add, edit, or archive what's for sale.
  Use **+ Add Menu Item**, fill in name, category, and price. In the
  **"Product Image"** section you can **assign a bundled static image** by
  clicking one of the thumbnail tiles (or choose **No Image** with the 🚫
  tile, or paste an external URL). Toggling "Available for sale on POS" off
  hides the item from the Counter. Every row also shows a small image
  thumbnail for quick reference.
- **Orders** (Cashier, Manager, Admin) — A list of past transactions with
  view/print/void actions.
- **Inventory** (Inventory Clerk, Manager, Admin) — Current stock per item
  per branch with status badges (green = OK, amber = low, red = out of
  stock), plus restock actions.
- **Reports** (Manager, Admin) — Daily sales overview, order count, and
  low-stock alerts; plus per-branch performance.
- **Branches** (Admin only) — Add or edit store locations / food trucks.
- **Staff** (Admin only) — Create employee logins and assign roles/branches.
- **Notifications** (Inventory Clerk, Manager, Admin) — A running list of
  low-stock alerts.

### If something goes wrong

- **`npm` isn't recognized / command not found:** Node.js didn't install
  correctly, or you opened the terminal before (re)installing it. Close the
  terminal, reopen a new one, and try again.
- **"Port 3000 is already in use":** another app is using that address.
  Close other running copies, or set `PORT` to a different value (see the
  **Custom MongoDB server** example below for where to put variables).
- **The browser says it can't connect:** make sure the terminal window from
  Part 5 is still open and running — if you closed it, the app stopped.
- **The database appears empty after an update:** the embedded database is
  in memory and resets on restart. Run the seeder again to reload demo data
  (see below).

---

## Demo logins

| Role | Username | Password | Scope |
|---|---|---|---|
| Owner/Admin | `admin` | `admin123` | Everything, all branches |
| Branch Manager | `manager1` | `manager123` | Marikina branch only |
| Cashier | `cashier1` | `cashier123` | Marikina branch only |
| Inventory Clerk | `inventory1` | `inventory123` | Marikina branch only |

(Passwords are bcrypt-hashed in the database — never stored in plaintext.)

---

## Setup & Configuration

### Default (zero-config) run

Just install and start:

```bash
npm install
npm start
```

The first time it starts, the app:
1. Connects to an **embedded in-memory MongoDB** (no external install needed).
2. **Auto-seeds** the database (branches, categories, menu items with
   images, per-branch inventory, demo users, and a sample order).

Access the app at **http://localhost:3000**.

### Environment variables (`.env`)

Copy `.env.example` to `.env` and edit if you want to customise the setup:

```bash
cp .env.example .env
```

Key variables (without a value, the app uses sensible defaults):

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `MONGODB_URI` | Connection string for your own MongoDB | `embedded` (in-memory) |
| `NODE_ENV` | `development` or `production` | `development` |

### Custom MongoDB server

If you want to use a real/remote MongoDB instead of the in-memory one, set
`MONGODB_URI` in `.env`, e.g.:

```
MONGODB_URI=mongodb://127.0.0.1:27017/walandyo_pos
```

Then run `npm start` as usual. The app will connect to that database instead.

### Re-seeding demo data

To wipe and reload the demo data manually:

```bash
npm run seed
```

### Production build

The client is bundled by Vite. To build static assets for production:

```bash
npm run build
```

In production mode (`NODE_ENV=production`) the server serves the built files
from `dist/public`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Runs the server (default `node server.js`) |
| `npm run dev` | Same as start (also serves the Vite dev client) |
| `npm run seed` | Wipes and re-seeds the demo database |
| `npm run build` | Builds the React client into `dist/public` |

---

## Project structure

```
WALANDYO-2.0-MERN/
├── server.js               # App entry point (boots DB + API + Vite client)
├── package.json            # Dependencies + scripts
├── .env.example            # Example environment variables
├── client/                 # React + Vite frontend
│   └── src/
│       ├── pages/          # Counter, Menu, Orders, Inventory, Reports, etc.
│       ├── components/     # Shared UI (Modal, Sidebar, Topbar, ...)
│       ├── contexts/       # Auth + Notifications React contexts
│       └── api/            # Fetch wrapper (axiosClient)
└── server/                 # Express backend (MERN API)
    ├── app.js              # Express app + route mounting + static images
    ├── config/db.js        # Mongoose / embedded MongoDB connection
    ├── models/             # Mongoose schemas (MenuItem, Order, Branch, ...)
    ├── controllers/        # Request handlers
    ├── routes/             # API routes
    ├── middleware/         # Auth + error handling
    ├── scripts/seed.js     # Demo data seeder
    └── public/menu-images/ # Bundled static food images served at /images/*
```

---

## Role-based access

| Role | Can access |
|---|---|
| **Admin** | Everything: Counter, Orders, Menu, Inventory, Reports (all branches), Branches, Staff, Notifications |
| **Manager** | Counter, Orders, Menu, Inventory, Reports — scoped to their assigned branch |
| **Cashier** | Counter, Orders (their branch only) |
| **Inventory Clerk** | Inventory, Notifications (their branch only) |

Routes are guarded server-side in `server/middleware/authMiddleware.js` and
the `server/routes/*.js` files — the sidebar only *shows* links a role can
use, but the routes themselves are the actual enforcement.

---

## Menu item images

Food images are stored as static files in `server/public/menu-images/` and
served from the **`/images/*`** URL path (for example `/images/Tapsilog.jpg`).

On the **Menu Items** page, admin/managers can assign an image to each menu
item by picking from the bundled thumbnails in the add/edit form, choosing
**No Image**, or entering an external image URL. The selected image appears
both in the Menu Items table and on the POS Counter cards.

To add your own static image:

1. Place the file (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`) in
   `server/public/menu-images/`.
2. Restart the server, then open a menu item's edit form — the new file will
   appear in the image picker automatically.

---

## A note on testing

During development the app uses an **embedded in-memory MongoDB** (via
[`mongodb-memory-server`](https://github.com/nodkz/mongodb-memory-server)),
which downloads a MongoDB binary on first use and runs it locally with
transaction support. This keeps setup simple and lets the transactional
order/stock logic run exactly like it would on a real server. Once seeded,
data lives in memory for the lifetime of the process and is re-seeded on
the next start.

