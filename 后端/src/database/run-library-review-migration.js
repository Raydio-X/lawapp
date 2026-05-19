require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lawapp',
            multipleStatements: true
        });

        console.log('Connected to database');

        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'lawapp'}' 
            AND TABLE_NAME = 'libraries' 
            AND COLUMN_NAME = 'status'
        `);

        if (columns.length === 0) {
            console.log('Adding review fields to libraries table...');
            
            const migrationSql = fs.readFileSync(
                path.join(__dirname, 'migrations', 'add_library_review.sql'),
                'utf8'
            );
            
            await connection.query(migrationSql);
            console.log('Migration completed successfully!');
        } else {
            console.log('Review fields already exist, skipping migration');
        }

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
