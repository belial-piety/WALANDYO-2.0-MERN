-- Walandyo Tapsilogan Integrated POS System
-- MySQL schema

CREATE DATABASE IF NOT EXISTS walandyo_pos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE walandyo_pos;

-- ---------------------------------------------------------------
-- Branches & food trucks (Scope: 4 branches + 1 food truck)
-- ---------------------------------------------------------------
CREATE TABLE branches (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  type          ENUM('branch','food_truck') NOT NULL DEFAULT 'branch',
  address       VARCHAR(255) DEFAULT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Users / role-based access
-- Roles: admin (Owner/Admin), manager (Branch Manager),
--        cashier (Cashier), inventory (Inventory Clerk)
-- branch_id is NULL for global-access accounts (admin, or an
-- explicit "global access" manager per the Staff mockup)
-- ---------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','manager','cashier','inventory') NOT NULL,
  branch_id     INT DEFAULT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Menu categories & items (Menu Items page)
-- ---------------------------------------------------------------
CREATE TABLE categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE menu_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  category_id   INT DEFAULT NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  image_url     VARCHAR(500) DEFAULT NULL,
  is_available  TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Per-branch inventory / stock levels (Stock pages)
-- One row per (menu_item, branch) combination
-- ---------------------------------------------------------------
CREATE TABLE inventory (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id   INT NOT NULL,
  branch_id      INT NOT NULL,
  current_stock  INT NOT NULL DEFAULT 0,
  min_level      INT NOT NULL DEFAULT 5,
  unit           VARCHAR(20) NOT NULL DEFAULT 'pcs',
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_item_branch (menu_item_id, branch_id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Orders (Counter / POS)
-- ---------------------------------------------------------------
CREATE TABLE orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  cashier_id      INT NOT NULL,
  status          ENUM('completed','voided') NOT NULL DEFAULT 'completed',
  payment_method  ENUM('cash','gcash','card') NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  tax             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total           DECIMAL(10,2) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT NOT NULL,
  menu_item_id   INT NOT NULL,
  item_name      VARCHAR(100) NOT NULL,
  quantity       INT NOT NULL,
  unit_price     DECIMAL(10,2) NOT NULL,
  line_total     DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB;

-- Audit trail for change-order handling (edit/void with reason)
CREATE TABLE order_audit_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  action      ENUM('created','voided','reprinted') NOT NULL,
  notes       VARCHAR(255) DEFAULT NULL,
  staff_id    INT DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Stock ledger: every deduction, restock, or void-restore is logged
CREATE TABLE stock_movements (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  inventory_id        INT NOT NULL,
  change_qty          INT NOT NULL COMMENT 'negative = deduction, positive = restock',
  type                ENUM('sale','restock','adjustment','void_restore') NOT NULL,
  reference_order_id  INT DEFAULT NULL,
  created_by          INT DEFAULT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
  FOREIGN KEY (reference_order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Low-stock alerts (Notification for low stock screen)
CREATE TABLE notifications (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  inventory_id  INT NOT NULL,
  message       VARCHAR(255) NOT NULL,
  is_read       TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Helpful indexes for reporting queries
CREATE INDEX idx_orders_branch_date ON orders (branch_id, created_at);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_inventory_branch ON inventory (branch_id);
CREATE INDEX idx_notifications_unread ON notifications (branch_id, is_read);
