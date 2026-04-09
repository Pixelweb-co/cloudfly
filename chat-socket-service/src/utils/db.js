const mysql = require('mysql2/promise');
const logger = require('./logger');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'widowmaker',
    database: process.env.DB_NAME || 'cloud_master',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(conn => {
        logger.info('✅ Database pool initialized successfully');
        conn.release();
    })
    .catch(err => {
        logger.error('❌ Error connecting to database:', err.message);
    });

module.exports = pool;
