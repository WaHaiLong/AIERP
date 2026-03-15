-- ERP System Database Schema
-- Run this in Supabase SQL Editor to initialize the database

-- Enable RLS
-- Note: For simplicity, we disable RLS on all tables (enable for production)

-- ─── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- ─── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  unit VARCHAR(20) DEFAULT 'pcs',
  cost_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) DEFAULT 0,
  stock_quantity DECIMAL(15,3) DEFAULT 0,
  min_stock DECIMAL(15,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- ─── Stock Movements ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  movement_type VARCHAR(20) NOT NULL, -- in, out, adjustment
  quantity DECIMAL(15,3) NOT NULL,
  reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;

-- ─── Customers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- ─── Sales Orders ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  order_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  tax DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sales_orders DISABLE ROW LEVEL SECURITY;

-- ─── Sales Order Items ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
  product_id INT REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL
);
ALTER TABLE sales_order_items DISABLE ROW LEVEL SECURITY;

-- ─── Suppliers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  payment_terms INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- ─── Purchase Orders ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INT REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  order_date DATE NOT NULL,
  expected_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;

-- ─── Purchase Order Items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id INT REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL
);
ALTER TABLE purchase_order_items DISABLE ROW LEVEL SECURITY;

-- ─── Invoices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type VARCHAR(20) NOT NULL, -- receivable, payable
  reference_id INT,
  reference_type VARCHAR(50),
  party_name VARCHAR(200) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- ─── Payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  method VARCHAR(30) DEFAULT 'bank_transfer',
  reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- ─── Departments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- ─── Employees ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(50),
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  position VARCHAR(100),
  hire_date DATE,
  salary DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- ─── Seed Data ────────────────────────────────────────────────
INSERT INTO categories (name, description) VALUES
  ('电子产品', '电子设备及配件'),
  ('办公用品', '办公文具及耗材'),
  ('原材料', '生产所需原材料')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (name, description) VALUES
  ('技术部', '负责系统开发与维护'),
  ('销售部', '负责产品销售'),
  ('财务部', '负责财务管理'),
  ('人事部', '负责人力资源管理')
ON CONFLICT (name) DO NOTHING;
