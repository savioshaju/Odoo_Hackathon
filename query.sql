-- @@PART 1: BILLING SCHEMA
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS billing;


CREATE OR REPLACE FUNCTION billing.period_start(d0 date, freq text, n int)
RETURNS date
LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT CASE freq
    WHEN 'daily'   THEN d0 + n
    WHEN 'weekly'  THEN d0 + 7 * n
    WHEN 'monthly' THEN (d0 + make_interval(months => n))::date
    WHEN 'yearly'  THEN (d0 + make_interval(years => n))::date
  END
$$;

-- Highest period number n with period_start(n) <= d, or -1 when d is before the first period.
CREATE OR REPLACE FUNCTION billing.last_period_no(d0 date, freq text, d date)
RETURNS int
LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  n int;
BEGIN
  IF d < d0 THEN
    RETURN -1;
  END IF;
  n := CASE freq
    WHEN 'daily'   THEN d - d0
    WHEN 'weekly'  THEN (d - d0) / 7
    WHEN 'monthly' THEN (extract(year FROM d)::int - extract(year FROM d0)::int) * 12
                        + extract(month FROM d)::int - extract(month FROM d0)::int
    WHEN 'yearly'  THEN extract(year FROM d)::int - extract(year FROM d0)::int
  END;
  -- The month/year estimate can be one too high (15 Jan start, today 10 Feb): step back.
  WHILE n >= 0 AND billing.period_start(d0, freq, n) > d LOOP
    n := n - 1;
  END LOOP;
  RETURN n;
END
$$;

-- -----------------------------------------------------------------------------
-- Small shared tables
-- -----------------------------------------------------------------------------

-- Key/value settings. 'simulated_date' is the Time Machine date; no row means real India date.
CREATE TABLE IF NOT EXISTS billing.settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE IF NOT EXISTS billing.counters (
  name       text   PRIMARY KEY,
  last_value bigint NOT NULL CHECK (last_value >= 0)
);
INSERT INTO billing.counters (name, last_value) VALUES ('invoice', 0) ON CONFLICT (name) DO NOTHING;

-- Everything the system "emails" (stand-in for Savio's mail module). Local, offline.
CREATE TABLE IF NOT EXISTS billing.outbox (
  id         bigserial   PRIMARY KEY,
  kind       text        NOT NULL,
  to_email   text,
  subject    text        NOT NULL,
  body       text        NOT NULL,
  invoice_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS billing.invoices (
  id                  bigserial   PRIMARY KEY,
  number_seq          bigint      NOT NULL UNIQUE CHECK (number_seq > 0),
  number              text        NOT NULL UNIQUE,
  subscription_id     bigint      NOT NULL,
  period_start        date        NOT NULL,
  period_end          date        NOT NULL,
  customer_id         bigint      NOT NULL,
  customer_snapshot   jsonb       NOT NULL,
  status              text        NOT NULL DEFAULT 'draft',
  invoice_date        date        NOT NULL,
  due_date            date        NOT NULL,
  supply              text        NOT NULL,
  gross_total         bigint      NOT NULL,
  line_discount_total bigint      NOT NULL,
  sub_discount_total  bigint      NOT NULL,
  taxable_total       bigint      NOT NULL,
  cgst_total          bigint      NOT NULL,
  sgst_total          bigint      NOT NULL,
  igst_total          bigint      NOT NULL,
  total               bigint      NOT NULL,
  paid_total          bigint      NOT NULL DEFAULT 0,
  price_story         jsonb       NOT NULL,
  run_id              bigint,
  created_at          timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz,
  cancelled_at        timestamptz,
  sent_at             timestamptz,
  CONSTRAINT invoices_status_ok CHECK (status IN ('draft', 'confirmed', 'paid', 'cancelled')),
  CONSTRAINT invoices_supply_ok CHECK (supply IN ('intra', 'inter')),
  CONSTRAINT invoices_period_ok CHECK (period_end >= period_start),
  CONSTRAINT invoices_due_ok    CHECK (due_date >= invoice_date),
  CONSTRAINT invoices_amounts_ok CHECK (
    gross_total >= 0 AND line_discount_total >= 0 AND sub_discount_total >= 0 AND taxable_total >= 0
    AND cgst_total >= 0 AND sgst_total >= 0 AND igst_total >= 0 AND total >= 0 AND paid_total >= 0),
  CONSTRAINT invoices_taxable_ok CHECK (taxable_total = gross_total - line_discount_total - sub_discount_total),
  CONSTRAINT invoices_total_ok   CHECK (total = taxable_total + cgst_total + sgst_total + igst_total),
  -- SGST = CGST; within the state only CGST+SGST, between states only IGST
  CONSTRAINT invoices_gst_split_ok CHECK (
    cgst_total = sgst_total
    AND ((supply = 'intra' AND igst_total = 0) OR (supply = 'inter' AND cgst_total = 0))),
  -- the last guard: paid can never go above the total, and the status must agree with the money
  CONSTRAINT invoices_paid_le_total CHECK (paid_total <= total),
  CONSTRAINT invoices_status_paid_ok CHECK (
    (status = 'paid'                     AND paid_total = total)
    OR (status = 'confirmed'             AND paid_total < total)
    OR (status IN ('draft', 'cancelled') AND paid_total = 0))
);

-- Nothing billed twice: one live (not cancelled) invoice per subscription and period.
-- A cancelled invoice keeps its number and frees the period to be billed again.
CREATE UNIQUE INDEX IF NOT EXISTS invoices_one_live_per_period
  ON billing.invoices (subscription_id, period_start) WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS invoices_status_due_idx    ON billing.invoices (status, due_date);
CREATE INDEX IF NOT EXISTS invoices_customer_idx      ON billing.invoices (customer_id, id DESC);
CREATE INDEX IF NOT EXISTS invoices_subscription_idx  ON billing.invoices (subscription_id);
CREATE INDEX IF NOT EXISTS invoices_invoice_date_idx  ON billing.invoices (invoice_date);
CREATE INDEX IF NOT EXISTS invoices_run_idx           ON billing.invoices (run_id);
CREATE INDEX IF NOT EXISTS invoices_number_prefix_idx ON billing.invoices (number text_pattern_ops);

CREATE TABLE IF NOT EXISTS billing.invoice_lines (
  id            bigserial PRIMARY KEY,
  invoice_id    bigint    NOT NULL REFERENCES billing.invoices (id) ON DELETE CASCADE,
  line_no       int       NOT NULL,
  product_id    bigint,
  description   text      NOT NULL,
  quantity      int       NOT NULL CHECK (quantity > 0),
  unit_price    bigint    NOT NULL CHECK (unit_price >= 0),
  tax_rate_bp   int       NOT NULL CHECK (tax_rate_bp BETWEEN 0 AND 10000),
  gross         bigint    NOT NULL,
  line_discount bigint    NOT NULL DEFAULT 0,
  sub_discount  bigint    NOT NULL DEFAULT 0,
  taxable       bigint    NOT NULL,
  cgst          bigint    NOT NULL DEFAULT 0,
  sgst          bigint    NOT NULL DEFAULT 0,
  igst          bigint    NOT NULL DEFAULT 0,
  total         bigint    NOT NULL,
  UNIQUE (invoice_id, line_no),
  CONSTRAINT invoice_lines_gross_ok   CHECK (gross = quantity::bigint * unit_price),
  CONSTRAINT invoice_lines_taxable_ok CHECK (taxable = gross - line_discount - sub_discount AND taxable >= 0),
  CONSTRAINT invoice_lines_total_ok   CHECK (total = taxable + cgst + sgst + igst),
  CONSTRAINT invoice_lines_gst_ok     CHECK (cgst = sgst AND cgst >= 0 AND igst >= 0 AND (cgst = 0 OR igst = 0)),
  CONSTRAINT invoice_lines_discounts_ok CHECK (line_discount >= 0 AND sub_discount >= 0)
);
CREATE INDEX IF NOT EXISTS invoice_lines_invoice_idx ON billing.invoice_lines (invoice_id);

-- One row per discount used on an invoice (one "use" per invoice, however many lines it touched).
-- A discount's used count is derived from the LIVE invoices that have a row here, so cancelling
-- an invoice gives the use back automatically and the count can never go stale.
CREATE TABLE IF NOT EXISTS billing.invoice_discounts (
  invoice_id    bigint NOT NULL REFERENCES billing.invoices (id) ON DELETE CASCADE,
  discount_id   bigint NOT NULL,
  discount_name text   NOT NULL,
  scope         text   NOT NULL CHECK (scope IN ('product', 'subscription')),
  kind          text   NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value         bigint NOT NULL CHECK (value > 0),
  amount        bigint NOT NULL CHECK (amount > 0),
  PRIMARY KEY (invoice_id, discount_id)
);
CREATE INDEX IF NOT EXISTS invoice_discounts_discount_idx ON billing.invoice_discounts (discount_id);

CREATE TABLE IF NOT EXISTS billing.payments (
  id              bigserial   PRIMARY KEY,
  invoice_id      bigint      NOT NULL REFERENCES billing.invoices (id),
  method          text        NOT NULL,
  amount          bigint      NOT NULL CHECK (amount > 0),
  paid_on         date        NOT NULL,
  note            text,
  source          text        NOT NULL DEFAULT 'manual',
  idempotency_key text        UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_method_ok CHECK (method IN ('cash', 'upi', 'card', 'bank_transfer', 'cheque')),
  CONSTRAINT payments_source_ok CHECK (source IN ('manual', 'bank_match'))
);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON billing.payments (invoice_id);
CREATE INDEX IF NOT EXISTS payments_paid_on_idx ON billing.payments (paid_on);


-- @@PART 2: STAND-INS
-- =============================================================================
-- Fake versions of what other teammates own (customers, catalog, subscriptions, discounts, taxes).
-- They have the same inputs and outputs the real modules will give us. docs/handoff.md lists
-- exactly what each real module must provide. At merge time these tables go away and the
-- standin_* queries in PART 3 are pointed at the real tables.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS standin;

CREATE TABLE IF NOT EXISTS standin.customers (
  id         bigserial PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL UNIQUE,
  state_code text NOT NULL DEFAULT 'MH',   -- decides CGST+SGST vs IGST
  gstin      text,
  address    text
);

CREATE TABLE IF NOT EXISTS standin.products (
  id          bigserial PRIMARY KEY,
  name        text   NOT NULL,
  kind        text   NOT NULL DEFAULT 'service',
  sales_price bigint NOT NULL CHECK (sales_price >= 0),   -- paise, before variant extras
  cost_price  bigint NOT NULL DEFAULT 0,
  tax_rate_bp int    NOT NULL DEFAULT 1800
);

CREATE TABLE IF NOT EXISTS standin.plans (
  id             bigserial PRIMARY KEY,
  name           text    NOT NULL,
  frequency      text    NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  min_quantity   int     NOT NULL DEFAULT 1,
  available_from date,
  available_to   date,
  auto_close     boolean NOT NULL DEFAULT false,   -- closes on its own when the plan ends
  closable       boolean NOT NULL DEFAULT true,
  pausable       boolean NOT NULL DEFAULT true,
  renewable      boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS standin.subscriptions (
  id                 bigserial PRIMARY KEY,
  number             text   NOT NULL UNIQUE,
  customer_id        bigint NOT NULL REFERENCES standin.customers (id),
  plan_id            bigint NOT NULL REFERENCES standin.plans (id),
  start_date         date   NOT NULL,
  expiry_date        date,
  payment_terms_days int    NOT NULL DEFAULT 15 CHECK (payment_terms_days >= 0),
  status             text   NOT NULL DEFAULT 'active'
                     CHECK (status IN ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'))
);
CREATE INDEX IF NOT EXISTS standin_subscriptions_status_idx   ON standin.subscriptions (status);
CREATE INDEX IF NOT EXISTS standin_subscriptions_customer_idx ON standin.subscriptions (customer_id);

-- Inclusive ranges when the subscription was Active. to_date NULL = still active.
-- A pause 10 Mar - 20 Apr is the gap between a range ending 9 Mar and one starting 21 Apr.
-- A late activation counts from the start date, so the first range starts on start_date.
CREATE TABLE IF NOT EXISTS standin.subscription_active_ranges (
  id              bigserial PRIMARY KEY,
  subscription_id bigint NOT NULL REFERENCES standin.subscriptions (id) ON DELETE CASCADE,
  from_date       date   NOT NULL,
  to_date         date,
  CHECK (to_date IS NULL OR to_date >= from_date)
);
CREATE INDEX IF NOT EXISTS standin_active_ranges_sub_idx ON standin.subscription_active_ranges (subscription_id);

-- start_date = first day the line applies; end_date = last day it applies (NULL = no end).
-- Mid-period changes take effect next period because lines are judged on the period start.
CREATE TABLE IF NOT EXISTS standin.subscription_lines (
  id              bigserial PRIMARY KEY,
  subscription_id bigint NOT NULL REFERENCES standin.subscriptions (id) ON DELETE CASCADE,
  product_id      bigint NOT NULL REFERENCES standin.products (id),
  description     text   NOT NULL,
  quantity        int    NOT NULL CHECK (quantity > 0),
  unit_price      bigint NOT NULL CHECK (unit_price >= 0),   -- final price incl. variant extra
  tax_rate_bp     int    NOT NULL DEFAULT 1800,
  start_date      date   NOT NULL,
  end_date        date
);
CREATE INDEX IF NOT EXISTS standin_lines_sub_idx ON standin.subscription_lines (subscription_id);

CREATE TABLE IF NOT EXISTS standin.discounts (
  id           bigserial PRIMARY KEY,
  name         text   NOT NULL,
  kind         text   NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value        bigint NOT NULL CHECK (value > 0),         -- basis points, or paise when fixed
  scope        text   NOT NULL CHECK (scope IN ('product', 'subscription')),
  min_amount   bigint NOT NULL DEFAULT 0,
  min_quantity int    NOT NULL DEFAULT 0,
  start_date   date,
  end_date     date,
  usage_limit  int
);

CREATE TABLE IF NOT EXISTS standin.discount_products (
  discount_id bigint NOT NULL REFERENCES standin.discounts (id) ON DELETE CASCADE,
  product_id  bigint NOT NULL REFERENCES standin.products (id) ON DELETE CASCADE,
  PRIMARY KEY (discount_id, product_id)
);


-- =============================================================================
-- CATALOGUE SCHEMA (Owner: Kishan)
-- Real tables for products, variants, plans, and discounts
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS catalogue;

CREATE TABLE IF NOT EXISTS catalogue.products (
  id          bigserial PRIMARY KEY,
  name        text   NOT NULL,
  kind        text   NOT NULL DEFAULT 'service',
  sales_price bigint NOT NULL CHECK (sales_price >= 0),   -- paise, base price
  cost_price  bigint NOT NULL DEFAULT 0,
  tax_rate_bp int    NOT NULL DEFAULT 1800,               -- basis points (1800 = 18%)
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalogue.product_variants (
  id          bigserial PRIMARY KEY,
  product_id  bigint NOT NULL REFERENCES catalogue.products (id) ON DELETE CASCADE,
  name        text   NOT NULL,                            -- e.g. 'Odoo Brand Edition'
  price_addon bigint NOT NULL DEFAULT 0,                  -- paise, e.g. 56000 = ₹560.00
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON catalogue.product_variants (product_id);

CREATE TABLE IF NOT EXISTS catalogue.plans (
  id             bigserial PRIMARY KEY,
  name           text    NOT NULL,
  frequency      text    NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  price          bigint  NOT NULL DEFAULT 0,              -- paise
  min_quantity   int     NOT NULL DEFAULT 1,
  available_from date,
  available_to   date,
  auto_close     boolean NOT NULL DEFAULT false,
  closable       boolean NOT NULL DEFAULT true,
  pausable       boolean NOT NULL DEFAULT true,
  renewable      boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS catalogue.discounts (
  id           bigserial PRIMARY KEY,
  name         text   NOT NULL,
  kind         text   NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value        bigint NOT NULL CHECK (value > 0),         -- basis points (1000 = 10%) or paise
  scope        text   NOT NULL CHECK (scope IN ('product', 'subscription')),
  min_amount   bigint NOT NULL DEFAULT 0,
  min_quantity int    NOT NULL DEFAULT 0,
  start_date   date,
  end_date     date,
  usage_limit  int,
  used_count   int    NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalogue.discount_products (
  discount_id bigint NOT NULL REFERENCES catalogue.discounts (id) ON DELETE CASCADE,
  product_id  bigint NOT NULL REFERENCES catalogue.products (id) ON DELETE CASCADE,
  PRIMARY KEY (discount_id, product_id)
);


-- @@PART 3: QUERIES
-- =============================================================================

-- name: db_ping
SELECT 1 AS ok;

-- name: tx_begin
BEGIN;

-- name: tx_begin_snapshot
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- name: tx_commit
COMMIT;

-- name: tx_rollback
ROLLBACK;

-- name: setting_get
SELECT value FROM billing.settings WHERE key = $1;

-- name: setting_set
INSERT INTO billing.settings (key, value) VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- name: setting_clear
DELETE FROM billing.settings WHERE key = $1;

-- name: outbox_insert
INSERT INTO billing.outbox (kind, to_email, subject, body, invoice_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- name: admin_database_exists
SELECT 1 AS present FROM pg_database WHERE datname = $1;

-- name: admin_create_database_sql
SELECT format('CREATE DATABASE %I', $1::text) AS statement;

-- name: admin_reset_schemas
DROP SCHEMA IF EXISTS billing CASCADE;
DROP SCHEMA IF EXISTS standin CASCADE;
DROP SCHEMA IF EXISTS catalogue CASCADE;

-- name: test_reset
DELETE FROM billing.payments;
DELETE FROM billing.invoice_discounts;
DELETE FROM billing.invoice_lines;
DELETE FROM billing.invoices;
DELETE FROM billing.settings;
DELETE FROM billing.outbox;
UPDATE billing.counters SET last_value = 0;
DELETE FROM standin.discount_products;
DELETE FROM standin.discounts;
DELETE FROM standin.subscription_lines;
DELETE FROM standin.subscription_active_ranges;
DELETE FROM standin.subscriptions;
DELETE FROM standin.plans;
DELETE FROM standin.products;
DELETE FROM standin.customers;
DELETE FROM catalogue.discount_products;
DELETE FROM catalogue.discounts;
DELETE FROM catalogue.product_variants;
DELETE FROM catalogue.plans;
DELETE FROM catalogue.products;
SELECT setval(c.oid::regclass, 1, false)
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'S' AND n.nspname IN ('billing', 'standin', 'catalogue');

-- name: test_insert_invoice
INSERT INTO billing.invoices (
  number_seq, number, subscription_id, period_start, period_end, customer_id, customer_snapshot, status,
  invoice_date, due_date, supply, gross_total, line_discount_total, sub_discount_total, taxable_total,
  cgst_total, sgst_total, igst_total, total, paid_total, price_story)
VALUES (
  $1::bigint, 'INV-' || lpad(($1::bigint)::text, 6, '0'), $2, $3::date, ($3::date + 30), 1, '{}'::jsonb, $4,
  $3::date, ($3::date + 15), $14, $5, $6, $7, $8, $9, $10, $11, $12, $13, '[]'::jsonb)
RETURNING id;

-- name: test_insert_line
INSERT INTO billing.invoice_lines (
  invoice_id, line_no, product_id, description, quantity, unit_price, tax_rate_bp,
  gross, line_discount, sub_discount, taxable, cgst, sgst, igst, total)
VALUES ($1, $2, 1, 'test line', $3, $4, 1800, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING id;

-- name: test_insert_payment
INSERT INTO billing.payments (invoice_id, method, amount, paid_on)
VALUES ($1, $2, $3, '2026-01-01')
RETURNING id;

-- name: test_invoice_numbers
SELECT number, status FROM billing.invoices ORDER BY number_seq;

-- name: test_period_start
SELECT billing.period_start($1::date, $2::text, $3::int) AS d;

-- name: test_last_period_no
SELECT billing.last_period_no($1::date, $2::text, $3::date) AS n;

-- -----------------------------------------------------------------------------
-- Catalogue Queries (Owner: Kishan)
-- -----------------------------------------------------------------------------

-- name: catalogue_product_list
SELECT p.id, p.name, p.kind, p.sales_price, p.cost_price, p.tax_rate_bp, p.notes,
       COALESCE(json_agg(
         json_build_object(
           'id', v.id,
           'name', v.name,
           'price_addon', v.price_addon,
           'total_price', p.sales_price + v.price_addon
         ) ORDER BY v.id
       ) FILTER (WHERE v.id IS NOT NULL), '[]'::json) AS variants
FROM catalogue.products p
LEFT JOIN catalogue.product_variants v ON v.product_id = p.id
GROUP BY p.id
ORDER BY p.id;

-- name: catalogue_product_get
SELECT p.id, p.name, p.kind, p.sales_price, p.cost_price, p.tax_rate_bp, p.notes,
       COALESCE(json_agg(
         json_build_object(
           'id', v.id,
           'name', v.name,
           'price_addon', v.price_addon,
           'total_price', p.sales_price + v.price_addon
         ) ORDER BY v.id
       ) FILTER (WHERE v.id IS NOT NULL), '[]'::json) AS variants
FROM catalogue.products p
LEFT JOIN catalogue.product_variants v ON v.product_id = p.id
WHERE p.id = $1
GROUP BY p.id;

-- name: catalogue_product_insert
INSERT INTO catalogue.products (name, kind, sales_price, cost_price, tax_rate_bp, notes)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: catalogue_variant_insert
INSERT INTO catalogue.product_variants (product_id, name, price_addon)
VALUES ($1, $2, $3)
RETURNING *;

-- name: catalogue_plan_list
SELECT * FROM catalogue.plans ORDER BY id;

-- name: catalogue_plan_insert
INSERT INTO catalogue.plans (name, frequency, price, min_quantity, available_from, available_to, auto_close, closable, pausable, renewable)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: catalogue_discount_list
SELECT * FROM catalogue.discounts ORDER BY id;

-- name: catalogue_discount_insert
INSERT INTO catalogue.discounts (name, kind, value, scope, min_amount, min_quantity, start_date, end_date, usage_limit)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: catalogue_discount_claim
UPDATE catalogue.discounts
SET used_count = used_count + 1
WHERE id = $1 AND (usage_limit IS NULL OR used_count < usage_limit)
RETURNING *;

-- name: catalogue_discount_release
UPDATE catalogue.discounts
SET used_count = GREATEST(0, used_count - 1)
WHERE id = $1
RETURNING *;
