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
            WHERE TABLE_SCHEMA = 'lawapp' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
        `);

        if (columns.length === 0) {
            console.log('Adding role column to users table...');
            
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN role VARCHAR(20) DEFAULT 'user' COMMENT '用户角色: admin, user' AFTER gender
            `);
            console.log('Added role column');

            await connection.query(`
                ALTER TABLE users ADD INDEX idx_role (role)
            `);
            console.log('Added role index');

            await connection.query(`
                UPDATE users SET role = 'admin' WHERE openid = 'admin_account'
            `);
            console.log('Updated admin user role');

            console.log('Migration completed successfully!');
        } else {
            console.log('Role column already exists, skipping migration');
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
