-- ============================================================
-- Migration: Create products table
-- Owner: Kishan
-- Run this once in your PostgreSQL database
-- ============================================================

-- First, create the database (run this separately in psql if needed):
-- CREATE DATABASE loopledger;

-- Products table
-- Stores the main product catalogue for Brightloop Software
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)   NOT NULL,
  type        VARCHAR(50)    NOT NULL DEFAULT 'service',  -- 'service' or 'physical'
  sales_price NUMERIC(10, 2) NOT NULL,                    -- price we sell at
  cost_price  NUMERIC(10, 2) NOT NULL DEFAULT 0,          -- price it costs us
  notes       TEXT,
  created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- Add some sample products so you can test immediately
INSERT INTO products (name, type, sales_price, cost_price, notes) VALUES
  ('Brightloop CRM',      'service', 2000.00, 800.00,  'Core CRM software product'),
  ('Brightloop HR Suite', 'service', 3500.00, 1200.00, 'HR management module'),
  ('Brightloop Analytics','service', 1500.00, 500.00,  'Data analytics add-on')
ON CONFLICT DO NOTHING;
