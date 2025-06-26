const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'data_db', // <--- CHANGE THIS TO THE EXACT CONFIRMED NAME
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database via Pool!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Failed to connect to MySQL database via Pool:', err);
    process.exit(1);
  });

module.exports = pool;