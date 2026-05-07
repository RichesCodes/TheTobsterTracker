const { Pool } = require('pg');

// pg will read DATABASE_URL from the environment automatically
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase requires SSL in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Verify connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  release();
  console.log('Connected to PostgreSQL');
});

module.exports = pool;
