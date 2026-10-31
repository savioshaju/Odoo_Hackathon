// Catalogue module API (Owner: Kishan)
// Handles Products, Variants, Plans, Discounts, and Taxes.

import { Router } from 'express';
import { badRequest, forbidden, notFound } from '../../errors.js';
import { formatINR, rupees } from '../billing/engine/money.js';
import { getClock, today } from '../billing/clock.js';
import { monthlyEquivalent } from '../billing/engine/mrr.js';

export function createCatalogueRouter(db) {
  const router = Router();

  function requireAdmin(req) {
    if (!req.user || req.user.role !== 'admin') {
      throw forbidden('Only administrators can perform this action');
    }
  }

  function requireStaffOrAdmin(req) {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
      throw forbidden('Only staff or administrators can perform this action');
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PRODUCTS & VARIANTS
  // ───────────────────────────────────────────────────────────────────────────

  // GET /api/catalogue/products
  router.get('/products', async (_req, res) => {
    const products = await db.rows('catalogue_product_list');
    const enriched = products.map((p) => ({
      ...p,
      sales_price_display: formatINR(p.sales_price),
      variants: (p.variants || []).map((v) => ({
        ...v,
        price_addon_display: formatINR(v.price_addon),
        total_price_display: formatINR(v.total_price),
      })),
    }));
    res.json(enriched);
  });

  // GET /api/catalogue/products/:id
  router.get('/products/:id', async (req, res) => {
    const product = await db.maybeOne('catalogue_product_get', [req.params.id]);
    if (!product) throw notFound('Product not found');
    res.json({
      ...product,
      sales_price_display: formatINR(product.sales_price),
      variants: (product.variants || []).map((v) => ({
        ...v,
        price_addon_display: formatINR(v.price_addon),
        total_price_display: formatINR(v.total_price),
      })),
    });
  });

  // POST /api/catalogue/products
  router.post('/products', async (req, res) => {
    requireAdmin(req);
    const { name, kind = 'service', sales_price, cost_price = 0, tax_rate_bp = 1800, notes = '' } = req.body;
    if (!name || sales_price == null) {
      throw badRequest('invalid_product', 'Product name and sales price are required');
    }
    const salesPricePaise = typeof sales_price === 'number' && sales_price >= 10000 ? sales_price : rupees(sales_price);
    const costPricePaise = typeof cost_price === 'number' && cost_price >= 10000 ? cost_price : rupees(cost_price);

    const product = await db.one('catalogue_product_insert', [
      name,
      kind,
      salesPricePaise,
      costPricePaise,
      tax_rate_bp,
      notes,
    ]);
    res.status(201).json(product);
  });

  // POST /api/catalogue/products/:id/variants
  // Variant calculation: Base price + price_addon = display price (e.g. ₹2,000 + ₹560 = ₹2,560)
  router.post('/products/:id/variants', async (req, res) => {
    requireAdmin(req);
    const productId = req.params.id;
    const { name, price_addon = 0 } = req.body;
    if (!name) {
      throw badRequest('invalid_variant', 'Variant name is required');
    }
    const addonPaise = typeof price_addon === 'number' && price_addon >= 10000 ? price_addon : rupees(price_addon);

    const variant = await db.one('catalogue_variant_insert', [productId, name, addonPaise]);
    res.status(201).json(variant);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PLANS
  // ───────────────────────────────────────────────────────────────────────────

  // GET /api/catalogue/plans
  router.get('/plans', async (_req, res) => {
    const plans = await db.rows('catalogue_plan_list');
    res.json(
      plans.map((p) => ({
        ...p,
        price_display: formatINR(p.price),
      })),
    );
  });

  // POST /api/catalogue/plans
  router.post('/plans', async (req, res) => {
    requireAdmin(req);
    const {
      name,
      frequency,
      price = 0,
      min_quantity = 1,
      available_from = null,
      available_to = null,
      auto_close = false,
      closable = true,
      pausable = true,
      renewable = true,
    } = req.body;

    if (!name || !frequency) {
      throw badRequest('invalid_plan', 'Plan name and frequency are required');
    }
    const pricePaise = typeof price === 'number' && price >= 10000 ? price : rupees(price);

    const plan = await db.one('catalogue_plan_insert', [
      name,
      frequency,
      pricePaise,
      min_quantity,
      available_from,
      available_to,
      auto_close,
      closable,
      pausable,
      renewable,
    ]);
    res.status(201).json(plan);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // DISCOUNTS (Admin-Only Creation!)
  // ───────────────────────────────────────────────────────────────────────────

  // GET /api/catalogue/discounts
  router.get('/discounts', async (_req, res) => {
    const discounts = await db.rows('catalogue_discount_list');
    res.json(discounts);
  });

  // POST /api/catalogue/discounts — Enforce ADMIN-ONLY check at API level
  router.post('/discounts', async (req, res) => {
    requireAdmin(req); // Blocks staff and customers with 403 Forbidden!
    const {
      name,
      kind,
      value,
      scope = 'subscription',
      min_amount = 0,
      min_quantity = 0,
      start_date = null,
      end_date = null,
      usage_limit = null,
    } = req.body;

    if (!name || !kind || value == null) {
      throw badRequest('invalid_discount', 'Discount name, kind, and value are required');
    }

    const valueNum = kind === 'fixed' && value < 10000 ? rupees(value) : value;

    const discount = await db.one('catalogue_discount_insert', [
      name,
      kind,
      valueNum,
      scope,
      min_amount,
      min_quantity,
      start_date,
      end_date,
      usage_limit,
    ]);
    res.status(201).json(discount);
  });

  // POST /api/catalogue/discounts/:id/claim — called by billing engine when invoice line is created
  router.post('/discounts/:id/claim', async (req, res) => {
    const updated = await db.maybeOne('catalogue_discount_claim', [req.params.id]);
    if (!updated) {
      throw badRequest('discount_limit_exceeded', 'Discount limit reached or discount not found');
    }
    res.json(updated);
  });

  // POST /api/catalogue/discounts/:id/release — called by billing engine when invoice is cancelled
  router.post('/discounts/:id/release', async (req, res) => {
    const updated = await db.maybeOne('catalogue_discount_release', [req.params.id]);
    res.json(updated || { ok: true });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FINANCE DASHBOARD (Owner: Kishan)
  // Metrics: Active, Invoiced, Collected, Outstanding, Overdue, and MRR
  // ───────────────────────────────────────────────────────────────────────────

  // GET /api/catalogue/dashboard
  router.get('/dashboard', async (_req, res) => {
    const clock = await getClock(db);
    const currentDate = clock.today;

    // 1. Fetch headline financial figures
    const summary = await db.one('finance_summary', [currentDate]);

    // 2. Fetch active subscriptions to compute exact MRR dynamically
    const subs = await db.rows('finance_active_subscriptions_for_mrr');
    const totalMrrPaise = subs.reduce((acc, sub) => {
      try {
        return acc + monthlyEquivalent(sub.subscription_amount, sub.frequency);
      } catch {
        return acc;
      }
    }, 0);

    // 3. Fetch aging buckets for outstanding overdue invoices
    const agingRows = await db.rows('finance_aging_buckets', [currentDate]);
    const agingBuckets = agingRows.map((b) => ({
      ...b,
      overdue_amount_display: formatINR(b.overdue_amount),
    }));

    res.json({
      as_of_date: currentDate,
      simulated: clock.simulated,
      metrics: {
        active_subscriptions: summary.active_subscriptions,
        mrr: totalMrrPaise,
        mrr_display: formatINR(totalMrrPaise),
        invoiced_total: summary.invoiced_total,
        invoiced_total_display: formatINR(summary.invoiced_total),
        collected_total: summary.collected_total,
        collected_total_display: formatINR(summary.collected_total),
        outstanding_total: summary.outstanding_total,
        outstanding_total_display: formatINR(summary.outstanding_total),
        overdue_total: summary.overdue_total,
        overdue_total_display: formatINR(summary.overdue_total),
        overdue_count: summary.overdue_count,
      },
      aging_buckets: agingBuckets,
    });
  });

  return router;
}
