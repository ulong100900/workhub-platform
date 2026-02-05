const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

class Migrator {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  async ensureMigrationsTable() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        description TEXT
      )
    `);
  }

  async getAppliedMigrations() {
    const res = await this.client.query(
      'SELECT version FROM schema_migrations ORDER BY applied_at'
    );
    return res.rows.map(row => row.version);
  }

  async runMigration(filePath, version) {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await this.client.query('BEGIN');
      await this.client.query(sql);
      await this.client.query(
        'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
        [version]
      );
      await this.client.query('COMMIT');
      console.log(`✅ Applied migration: ${version}`);
      return true;
    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error(`❌ Failed migration ${version}:`, error.message);
      return false;
    }
  }

  async up() {
    await this.connect();
    await this.ensureMigrationsTable();
    
    const applied = await this.getAppliedMigrations();
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      const version = file.replace('.sql', '');
      if (!applied.includes(version)) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const success = await this.runMigration(filePath, version);
        if (!success) break;
      }
    }
    
    await this.disconnect();
  }

  async down() {
    await this.connect();
    const applied = await this.getAppliedMigrations();
    
    if (applied.length > 0) {
      const lastVersion = applied[applied.length - 1];
      await this.client.query(
        'DELETE FROM schema_migrations WHERE version = $1',
        [lastVersion]
      );
      console.log(`↩️ Rolled back: ${lastVersion}`);
    }
    
    await this.disconnect();
  }

  async reset() {
    await this.connect();
    
    // Получаем все таблицы
    const tablesRes = await this.client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    await this.client.query('BEGIN');
    
    // Отключаем constraints
    await this.client.query('SET session_replication_role = replica;');
    
    // Удаляем все таблицы
    for (const row of tablesRes.rows) {
      await this.client.query(`DROP TABLE IF EXISTS ${row.table_name} CASCADE`);
    }
    
    // Включаем constraints
    await this.client.query('SET session_replication_role = DEFAULT;');
    await this.client.query('COMMIT');
    
    console.log('🗑️ Database reset complete');
    await this.disconnect();
  }

  async status() {
    await this.connect();
    await this.ensureMigrationsTable();
    
    const res = await this.client.query(`
      SELECT version, applied_at, description 
      FROM schema_migrations 
      ORDER BY applied_at DESC
    `);
    
    console.log('📊 Migration status:');
    console.table(res.rows);
    
    await this.disconnect();
  }
}

async function main() {
  const command = process.argv[2];
  const migrator = new Migrator();
  
  switch (command) {
    case 'up':
      await migrator.up();
      break;
    case 'down':
      await migrator.down();
      break;
    case 'reset':
      await migrator.reset();
      break;
    case 'status':
      await migrator.status();
      break;
    default:
      console.log('Usage: node scripts/migrate.js [up|down|reset|status]');
  }
}

main().catch(console.error);