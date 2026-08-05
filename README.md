# Walandyo Tapsilogan — Integrated POS System

A multi-branch Point-of-Sale, inventory, and reporting web app built for
Walandyo Tapsilogan (4 branches + 1 food truck), following the MVC pattern
with **Node.js + Express + Handlebars + MySQL**.

Built from the project requirements paper (ISANDE1) and the Figma mockups
supplied alongside it — screens, copy, and the red/cream color scheme follow
the mockups directly.

---

## 🧑‍🍳 Beginner's Guide — Installing & Running This (No Coding Experience Needed)

This section walks through everything from a completely empty computer to a
working app in your browser, one click/command at a time. If you've never
used a "terminal" or "command prompt" before, start here. (If you're
comfortable with the command line already, the shorter **Setup** section
further down covers the same ground faster.)

### Part 1 — Install the two programs you need (one-time only)

You need two free programs installed before anything else will work:
**Node.js** (runs the app) and **MySQL** (stores the data).

**1a. Install Node.js**

1. Go to **https://nodejs.org**
2. Click the big green button that says **LTS** (this means "Long Term
   Support" — the stable version).
3. Open the downloaded file and click Next/Continue through the installer,
   accepting the defaults, until it finishes.
4. To check it worked, open a terminal (see Part 2 below) and type:
   ```
   node -v
   ```
   Press Enter. If you see something like `v22.x.x` printed back, it worked.

**1b. Install MySQL**

1. Go to **https://dev.mysql.com/downloads/installer/** (Windows) or
   **https://dev.mysql.com/downloads/mysql/** (Mac).
2. Download and run the installer. Choose the default **"Developer Default"**
   setup if asked — this also installs **MySQL Workbench**, a visual tool
   we'll use later so you don't have to type database commands by hand.
3. At some point the installer will ask you to **set a root password**.
   Pick something you'll remember and **write it down** — you'll need it
   twice more later in this guide.
4. Finish the installer with the defaults.

### Part 2 — Open a terminal (command prompt)

You'll use this a handful of times. It's just a window where you type
commands instead of clicking icons.

- **Windows:** Click the Start menu, type `cmd`, and open **Command Prompt**.
- **Mac:** Open **Finder → Applications → Utilities → Terminal**.

Keep this window open for the rest of the guide.

### Part 3 — Unzip the project

1. Find the `walandyo-pos.zip` file you downloaded and **unzip it** (on
   Windows, right-click → "Extract All"; on Mac, just double-click it).
2. Put the resulting `walandyo-pos` folder somewhere easy to find, like your
   Desktop.
3. In your terminal, navigate into that folder. Type `cd ` (with a space
   after it), then drag the `walandyo-pos` folder from your file explorer
   straight into the terminal window — it will auto-fill the path — then
   press Enter. It should look something like:
   ```
   cd C:\Users\YourName\Desktop\walandyo-pos
   ```
   or on Mac:
   ```
   cd /Users/YourName/Desktop/walandyo-pos
   ```

### Part 4 — Install the app's building blocks

In the same terminal window, type:
```
npm install
```
Press Enter and wait — this downloads everything the app needs to run. It
can take a minute or two. You'll know it's done when you see your cursor
blinking on a new line with no more text scrolling. (Some yellow "warnings"
are normal and fine to ignore; only worry if you see the word `Error` in red.)

### Part 5 — Create the database

We'll use **MySQL Workbench** (installed in Part 1b) so you don't have to
type SQL commands manually.

1. Open **MySQL Workbench** from your Start menu / Applications folder.
2. Click on the connection tile that says something like **"Local instance
   MySQL"**. Enter the root password you set in Part 1b when prompted.
3. Once connected, go to the menu **File → Open SQL Script...** and select
   the `schema.sql` file inside the `walandyo-pos/db/` folder.
4. The script will appear in a text editor tab. Click the **⚡ lightning
   bolt icon** (or press Ctrl+Shift+Enter / Cmd+Shift+Enter) to run it.
5. On the left sidebar, under "Schemas", you should now see a new database
   called **`walandyo_pos`** with several tables inside it. That means it
   worked.

### Part 6 — Tell the app your database password

1. Inside the `walandyo-pos` folder, find the file called **`.env.example`**.
2. Make a copy of it and rename the copy to **`.env`** (just `.env`, nothing
   else — if your computer hides file extensions, you may need to enable
   "show file extensions" in your file explorer settings to do this correctly).
3. Open `.env` with any plain text editor (Notepad on Windows, TextEdit on
   Mac — right-click the file → "Open with").
4. Find the line `DB_PASSWORD=your_mysql_password` and replace
   `your_mysql_password` with the root password you set in Part 1b.
5. Save the file and close it.

### Part 7 — Add sample data

Back in your terminal (same window as before), type:
```
npm run seed
```
Press Enter. This fills the database with example branches, menu items, and
one login for each staff role, so you have something to look at right away.

### Part 8 — Start the app

Type:
```
npm start
```
Press Enter. You should see a message like:
```
Walandyo Tapsilogan POS running at http://localhost:3000
```
**Leave this terminal window open** — closing it stops the app. Now open
your web browser (Chrome, Edge, Safari — any of them) and go to:

**http://localhost:3000**

You should land on a login page. 🎉

### Part 9 — Log in

Use one of these to explore (also listed below in **Demo logins**):

| Role | Username | Password |
|---|---|---|
| Owner/Admin (sees everything) | `admin` | `admin123` |
| Cashier (rings up orders) | `cashier1` | `cashier123` |

When you're done, you can close the browser tab any time. To stop the app
completely, click into the terminal window and press **Ctrl+C**. To run it
again later, you only need to repeat **Part 8** (`npm start`) — Parts 1–7
are one-time setup.

---

## 📖 How to Use the Program

Once you're logged in, here's what each part of the sidebar does.

**POS Counter** (Cashier, Manager, Admin) — This is the main ordering
screen. Click a menu item to add it to the cart on the right. Click the `+`
and `−` buttons to adjust quantity, or the `✕` to remove an item. Choose a
payment method (Cash, GCash, or Card), then click the big red **Charge**
button at the bottom to complete the sale. A receipt opens automatically —
you can print it or close it.

**Orders** (Cashier, Manager, Admin) — A list of past transactions. Click
**View** on any row to see the full receipt, reprint it, or **void** it
(cancels the sale and puts the stock back).

**Menu Items** (Manager, Admin) — Add, edit, or remove what's for sale.
Click **+ Add Item** to create a new dish, fill in its name, price, and
category, then **Save Item**. Toggling "Available for sale" off hides it
from the Counter screen without deleting it.

**Inventory** (Inventory Clerk, Manager, Admin) — Shows current stock for
every item at every branch, with a status badge (green = OK, amber = low,
red = out of stock). When a delivery comes in, find the item and use the
restock action to add to its count.

**Reports** (Manager, Admin) — Today's total sales, order count, and
low-stock alerts at a glance. Switch to the "Branch Performance" tab and
pick a branch to see its best-selling items.

**Branches** (Admin only) — Add a new store location or food truck, or edit
an existing one's name/address.

**Staff** (Admin only) — Create logins for new employees. Pick their role
(this controls what they can see) and, unless they're an Admin, which
branch they're assigned to.

**Notifications** (Inventory Clerk, Manager, Admin) — A running list of
low-stock alerts so nothing runs out unnoticed.

### If something goes wrong

- **`npm` isn't recognized / command not found:** Node.js didn't install
  correctly, or you opened the terminal before installing it — close the
  terminal, reopen a new one, and try again.
- **"Access denied for user 'root'"** when starting the app: the password
  in your `.env` file doesn't match your actual MySQL root password —
  double check Part 6.
- **"Port 3000 is already in use":** something else on your computer is
  already using that address. Close other running copies of the app, or
  open `.env` and change `PORT=3000` to `PORT=3001`, then visit
  `http://localhost:3001` instead.
- **The browser says it can't connect:** make sure the terminal window from
  Part 8 is still open and still running — if you closed it, the app stopped.

---

## Tech stack

- **Backend:** Node.js, Express (Controllers)
- **Views:** express-handlebars (Views) — server-rendered HTML, no build step
- **Database:** MySQL via `mysql2` (Models)
- **Auth:** `express-session` + `bcryptjs` password hashing, role-based middleware
- **Frontend interactivity:** vanilla JS (POS cart, modals) — no framework, no bundler

## Project structure (MVC)

```
walandyo-pos/
├── server.js              # App entry point: Handlebars/session/route setup
├── config/db.js           # MySQL connection pool
├── db/
│   ├── schema.sql         # Full DDL — run this first
│   └── seed.js            # Demo data + one login per role
├── models/                 # M — one file per entity, all SQL lives here
├── controllers/             # C — request handling, calls models, renders views
├── routes/                  # Maps URLs to controllers + role middleware
├── middleware/auth.js       # requireAuth / requireRole / view locals
├── views/                   # V — Handlebars templates
│   ├── layouts/main.handlebars
│   ├── partials/           # sidebar, topbar
│   └── <module>/index.handlebars
└── public/                  # Static CSS/JS served as-is
```

## Setup

*(This is the condensed, command-line version. If you'd rather follow along
click-by-click, see the "Beginner's Guide" section above instead.)*

**1. Install dependencies** (requires internet access on your machine):

```bash
cd walandyo-pos
npm install
```

**2. Create the database:**

```bash
mysql -u root -p < db/schema.sql
```

This creates the `walandyo_pos` database and all tables.

**3. Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and fill in your MySQL credentials (`DB_USER`, `DB_PASSWORD`, etc.)
and a random `SESSION_SECRET`.

**4. Seed demo data** (branches, menu items, per-branch stock, one login per role):

```bash
npm run seed
```

**5. Run it:**

```bash
npm start
```

Visit **http://localhost:3000** — you'll be redirected to `/login`.

For auto-restart on file changes during development:

```bash
npm run dev
```

## Demo logins

| Role | Username | Password | Scope |
|---|---|---|---|
| Owner/Admin | `admin` | `admin123` | Everything, all branches |
| Branch Manager | `manager1` | `manager123` | Marikina branch only |
| Cashier | `cashier1` | `cashier123` | Marikina branch only |
| Inventory Clerk | `inventory1` | `inventory123` | Marikina branch only |

(Passwords are bcrypt-hashed in the database — never stored in plaintext.)

## Role-based access (from the requirements paper, section 4.1)

| Role | Can access |
|---|---|
| **Admin** | Everything: Counter, Orders, Menu, Inventory, Reports (all branches), Branches, Staff, Notifications |
| **Manager** | Counter, Orders, Menu, Inventory, Reports — scoped to their assigned branch |
| **Cashier** | Counter, Orders (their branch only) |
| **Inventory Clerk** | Inventory, Notifications (their branch only) |

Routes are guarded server-side in `middleware/auth.js` + each `routes/*.js`
file — the sidebar only *shows* links a role can use, but the routes
themselves are the actual enforcement.

## How the core POS flow works

1. **Counter** (`/counter`): cashier picks items → cart total calculated
   client-side (`public/js/counter.js`) → "Charge" POSTs to `/counter/charge`.
2. **Order.create()** (`models/Order.js`) runs as a single MySQL transaction:
   inserts the order + line items, deducts stock per line
   (`Inventory.deductForSale`, row-locked with `FOR UPDATE` to prevent
   double-selling the last item), logs every stock change to
   `stock_movements`, and — if any item's stock drops to or below its
   `min_level` — fires a low-stock alert into `notifications`.
3. If any line can't be fulfilled (not enough stock), the **whole order is
   rolled back** — nothing is partially saved.
4. **Voiding an order** (`Order.voidOrder`) restores the stock it deducted
   and writes an audit entry to `order_audit_log`, satisfying the paper's
   change-order / audit-trail requirement.
5. **Reports** (`/reports`) reads directly from `orders`/`order_items` for
   the daily overview and per-branch top-seller breakdown.

## A note on testing

This was built and validated without a live MySQL server available in the
build environment (no outbound network access there). Every model's SQL was
exercised end-to-end — including the transactional order/stock-deduction
logic, oversell rejection + rollback, and void/restore — against Node's
built-in SQLite engine standing in for MySQL, using the exact same model
code shipped here. The schema and queries use standard MySQL syntax
throughout, so this should run against MySQL 5.7+/8.0 without changes.
Still, run through the flows below once after your first `npm install` to
confirm on your machine:

1. Log in as `cashier1`, ring up an order at the Counter, confirm the
   receipt opens.
2. Log in as `inventory1`, confirm that item's stock dropped.
3. Log in as `admin`, check Reports → Daily Overview reflects the sale.
4. Void the order from Orders → confirm stock is restored.

## Known limitations / next steps

- **GCash/Lalamove integration** is stubbed as a payment-method label only
  (per the paper's own "Limitations" section, this depends on third-party
  API availability outside the team's control) — wiring up real GCash
  payment confirmation would replace the button in `counter/index.handlebars`.
- **Mobile app:** the paper's stack (Flutter) is a separate native project;
  this build is a responsive web app that works on phones/tablets in a
  browser, which covers the "existing low-end devices" constraint from the
  paper's limitations section without needing a native app build.
- Session store is the default in-memory store — fine for a demo/defense,
  but swap in `connect-mysql` or Redis before any real deployment so
  logins survive a server restart.
