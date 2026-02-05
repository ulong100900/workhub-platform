#!/usr/bin/env node
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Получаем строку подключения из переменных окружения
const getConnectionString = () => {
  // Используем DATABASE_URL если есть, иначе собираем из переменных
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Или SUPABASE_DB_URL
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }
  
  // Или собираем из отдельных переменных
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || 5432;
  const database = process.env.PGDATABASE || 'postgres';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '';
  
  return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;
};

async function createClient() {
  const connectionString = getConnectionString();
  console.log('🔗 Connecting to:', connectionString.replace(/:[^:]*@/, ':****@'));
  
  return new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false, // Важно для Supabase
      require: true
    }
  });
}

async function checkHealth() {
  const client = await createClient();
  
  try {
    await client.connect();
    console.log('✅ Database Connection: OK');
    
    const versionRes = await client.query('SELECT version()');
    console.log(`📊 Version: ${versionRes.rows[0].version.split(',')[0]}`);
    
    const timeRes = await client.query('SELECT NOW() as current_time');
    console.log(`🕐 Current time: ${timeRes.rows[0].current_time}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('💡 Проверьте:');
    console.log('   1. Правильный ли пароль в .env.local');
    console.log('   2. Доступна ли база данных из вашей сети');
    console.log('   3. Настройки SSL');
    return false;
  } finally {
    await client.end();
  }
}

async function listTables() {
  const client = await createClient();
  
  try {
    await client.connect();
    
    // Список таблиц
    const tablesRes = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Таблицы в базе данных:');
    console.log('='.repeat(50));
    
    if (tablesRes.rows.length === 0) {
      console.log('Нет таблиц в схеме public');
    } else {
      for (const table of tablesRes.rows) {
        console.log(`📄 ${table.table_name} (${table.column_count} колонок)`);
        
        // Показываем колонки для таблицы projects если она есть
        if (table.table_name === 'projects') {
          const columnsRes = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'projects'
            ORDER BY ordinal_position
          `);
          
          console.log('   Колонки:');
          for (const col of columnsRes.rows) {
            console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error listing tables:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function showSchema() {
  const client = await createClient();
  
  try {
    await client.connect();
    
    // Показываем структуру всех таблиц
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    for (const table of tablesRes.rows) {
      console.log(`\n📊 Таблица: ${table.table_name}`);
      console.log('-'.repeat(40));
      
      const columnsRes = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      for (const col of columnsRes.rows) {
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT: ${col.column_default}` : ''}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error showing schema:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function runAllChecks() {
  console.log('🔍 Проверка базы данных...\n');
  
  const healthOk = await checkHealth();
  if (!healthOk) return;
  
  console.log('\n📋 Список таблиц...\n');
  await listTables();
  
  console.log('\n📊 Структура таблиц...\n');
  await showSchema();
}

// Обработка команд
const command = process.argv[2] || 'all';

switch (command) {
  case 'health':
    checkHealth();
    break;
  case 'tables':
    listTables();
    break;
  case 'schema':
    showSchema();
    break;
  case 'all':
    runAllChecks();
    break;
  default:
    console.log('Usage: node scripts/db-check.js [health|tables|schema|all]');
    console.log('  health  - Проверить подключение к БД');
    console.log('  tables  - Показать список таблиц');
    console.log('  schema  - Показать структуру всех таблиц');
    console.log('  all     - Выполнить все проверки');
}