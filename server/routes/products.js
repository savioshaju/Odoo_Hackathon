// products.js — handles all product-related API requests
// This is YOUR module, Kishan. Only you edit this file.

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ─────────────────────────────────────────────
// GET /api/products
// Returns all products from the database
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ─────────────────────────────────────────────
// GET /api/products/:id
// Returns a single product by ID
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching product:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// ─────────────────────────────────────────────
// POST /api/products
// Creates a new product
// Body: { name, type, sales_price, cost_price, notes }
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, type, sales_price, cost_price, notes } = req.body;

    // Basic validation
    if (!name || !sales_price) {
      return res.status(400).json({
        success: false,
        error: 'Name and sales price are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, type, sales_price, cost_price, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, type || 'service', sales_price, cost_price || 0, notes || '']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

module.exports = router;
