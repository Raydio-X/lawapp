const db = require('../../config/database');

async function addActivationCodes() {
    try {
        await db.execute(`
            ALTER TABLE users 
            ADD COLUMN is_vip TINYINT DEFAULT 0,
            ADD COLUMN vip_expires_at TIMESTAMP NULL
        `);
        console.log('Added VIP columns to users table');

        await db.execute(`
            CREATE TABLE activation_codes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(10) UNIQUE NOT NULL,
                duration_days INT NOT NULL,
                is_used TINYINT DEFAULT 0,
                used_by INT NULL,
                used_at TIMESTAMP NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_code (code),
                INDEX idx_is_used (is_used),
                FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created activation_codes table');

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
}

if (require.main === module) {
    addActivationCodes()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = addActivationCodes;
