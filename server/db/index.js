const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'Aditya@2906',
  database: process.env.DB_NAME     || 'taskmanager',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;