// db.js — connects our server to PostgreSQL
// Think of this as the "phone line" between our code and the database

const { Pool } = require('pg');
require('dotenv').config();

// Pool = a group of database connections ready to use
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection when server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Could not connect to PostgreSQL:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

module.exports = pool;
