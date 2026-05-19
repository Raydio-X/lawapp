require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function migrateKnowledgePacks() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lawapp'
        });

        console.log('Connected to database');

        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'knowledge_packs'"
        );

        if (tables.length === 0) {
            const sqlPath = path.join(__dirname, 'migrations', 'add_knowledge_packs.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');
            
            await connection.query(sql);
            console.log('Created knowledge_packs table');
        } else {
            console.log('knowledge_packs table already exists');
        }

        await connection.end();
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateKnowledgePacks();
