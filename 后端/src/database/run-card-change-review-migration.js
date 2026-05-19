const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_NAME:', process.env.DB_NAME);
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lawapp',
            multipleStatements: true
        });

        console.log('Connected to database');

        const migrationFile = path.join(__dirname, 'migrations', 'add_card_change_review.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        await connection.query(sql);
        console.log('Migration executed successfully');

        console.log('Card change review system has been set up!');
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
