#!/usr/bin/env tsx
/**
 * MySQL to Supabase Migration Script
 * 
 * This script migrates data from MySQL database to Supabase (PostgreSQL).
 * 
 * Usage:
 *   1. Configure MySQL connection in .env or mysql.config.json
 *   2. Ensure Supabase environment variables are set
 *   3. Run: npm run migrate:mysql
 * 
 * Field Mapping:
 *   MySQL -> Supabase
 *   - ITEM -> products.name
 *   - quantity -> products.stock_quantity
 *   - buying_price -> products.cost_price
 *   - selling_price_min -> products.selling_price
 *   - wholesale -> products.wholesale_price
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Configuration interface
interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  table?: string; // Optional: specify table name if different from default
}

interface FieldMapping {
  mysqlField: string;
  supabaseField: string;
  transform?: (value: any) => any;
}

// Default field mappings based on the image description
const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    mysqlField: 'ITEM',
    supabaseField: 'name',
    transform: (val) => val?.toString().trim() || 'Unnamed Product'
  },
  {
    mysqlField: 'quantity',
    supabaseField: 'stock_quantity',
    transform: (val) => parseInt(val) || 0
  },
  {
    mysqlField: 'buying_price',
    supabaseField: 'cost_price',
    transform: (val) => parseFloat(val) || 0
  },
  {
    mysqlField: 'selling_price_min',
    supabaseField: 'selling_price',
    transform: (val) => parseFloat(val) || 0
  },
  {
    mysqlField: 'wholesale',
    supabaseField: 'wholesale_price',
    transform: (val) => parseFloat(val) || 0
  }
];

// Load configuration
function loadConfig(): { mysql: MySQLConfig; supabase: { url: string; key: string } } {
  // Try to load from mysql.config.json first
  const configPath = path.join(process.cwd(), 'mysql.config.json');
  let mysqlConfig: MySQLConfig | null = null;

  if (fs.existsSync(configPath)) {
    try {
      const configFile = fs.readFileSync(configPath, 'utf-8');
      mysqlConfig = JSON.parse(configFile);
      console.log('✓ Loaded MySQL config from mysql.config.json');
    } catch (error) {
      console.error('Error reading mysql.config.json:', error);
    }
  }

  // Fallback to environment variables
  if (!mysqlConfig) {
    mysqlConfig = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || '',
      table: process.env.MYSQL_TABLE || 'products' // Default table name
    };
    console.log('✓ Using MySQL config from environment variables');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseKey = serviceRoleKey || anonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }

  if (!serviceRoleKey && anonKey) {
    console.warn('⚠️  WARNING: Using anon key instead of service role key.');
    console.warn('   For migrations, it is recommended to use SUPABASE_SERVICE_ROLE_KEY');
    console.warn('   Get it from: https://supabase.com/dashboard/project/_/settings/api');
    console.warn('   The service role key bypasses Row Level Security (RLS) policies.\n');
  }

  if (!mysqlConfig.database) {
    throw new Error('MySQL database name is required. Set MYSQL_DATABASE or include it in mysql.config.json');
  }

  return {
    mysql: mysqlConfig,
    supabase: {
      url: supabaseUrl,
      key: supabaseKey
    }
  };
}

// Get default store ID or create one
async function getOrCreateDefaultStore(supabase: any): Promise<string> {
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id')
    .limit(1);

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Error checking stores: ${error.message}`);
  }

  if (stores && stores.length > 0) {
    return stores[0].id;
  }

  // Create default store
  const { data: newStore, error: createError } = await supabase
    .from('stores')
    .insert({
      name: 'Main Store',
      address: 'Migrated from MySQL',
      is_active: true
    })
    .select('id')
    .single();

  if (createError) {
    if (createError.message.includes('row-level security')) {
      throw new Error(
        `Error creating default store: Row Level Security (RLS) is blocking the operation.\n` +
        `Please use SUPABASE_SERVICE_ROLE_KEY instead of NEXT_PUBLIC_SUPABASE_ANON_KEY.\n` +
        `Get it from: https://supabase.com/dashboard/project/_/settings/api\n` +
        `See scripts/GET_SERVICE_ROLE_KEY.md for instructions.`
      );
    }
    throw new Error(`Error creating default store: ${createError.message}`);
  }

  console.log('✓ Created default store');
  return newStore.id;
}

// Get or create default category
async function getOrCreateDefaultCategory(supabase: any, storeId: string): Promise<string> {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id')
    .eq('store_id', storeId)
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error checking categories: ${error.message}`);
  }

  if (categories && categories.length > 0) {
    return categories[0].id;
  }

  // Create default category
  const { data: newCategory, error: createError } = await supabase
    .from('categories')
    .insert({
      name: 'General',
      description: 'Default category for migrated products',
      store_id: storeId
    })
    .select('id')
    .single();

  if (createError) {
    if (createError.message.includes('row-level security')) {
      throw new Error(
        `Error creating default category: Row Level Security (RLS) is blocking the operation.\n` +
        `Please use SUPABASE_SERVICE_ROLE_KEY instead of NEXT_PUBLIC_SUPABASE_ANON_KEY.\n` +
        `Get it from: https://supabase.com/dashboard/project/_/settings/api\n` +
        `See scripts/GET_SERVICE_ROLE_KEY.md for instructions.`
      );
    }
    throw new Error(`Error creating default category: ${createError.message}`);
  }

  console.log('✓ Created default category');
  return newCategory.id;
}

// Get or create default unit
async function getOrCreateDefaultUnit(supabase: any): Promise<string> {
  const { data: units, error } = await supabase
    .from('units')
    .select('id')
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error checking units: ${error.message}`);
  }

  if (units && units.length > 0) {
    return units[0].id;
  }

  // Create default unit
  const { data: newUnit, error: createError } = await supabase
    .from('units')
    .insert({
      name: 'Piece',
      short_name: 'pcs'
    })
    .select('id')
    .single();

  if (createError) {
    if (createError.message.includes('row-level security')) {
      throw new Error(
        `Error creating default unit: Row Level Security (RLS) is blocking the operation.\n` +
        `Please use SUPABASE_SERVICE_ROLE_KEY instead of NEXT_PUBLIC_SUPABASE_ANON_KEY.\n` +
        `Get it from: https://supabase.com/dashboard/project/_/settings/api\n` +
        `See scripts/GET_SERVICE_ROLE_KEY.md for instructions.`
      );
    }
    throw new Error(`Error creating default unit: ${createError.message}`);
  }

  console.log('✓ Created default unit');
  return newUnit.id;
}

// Migrate products
async function migrateProducts(
  mysqlConnection: mysql.Connection,
  supabase: any,
  tableName: string,
  fieldMappings: FieldMapping[],
  storeId: string,
  categoryId: string,
  unitId: string
) {
  console.log(`\n📦 Migrating products from MySQL table: ${tableName}`);

  // Get all columns from MySQL table
  const [columns] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SHOW COLUMNS FROM \`${tableName}\``
  );

  const columnNames = columns.map(col => col.Field);
  console.log(`✓ Found columns: ${columnNames.join(', ')}`);

  // Build SELECT query with all columns
  const selectQuery = `SELECT * FROM \`${tableName}\``;
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(selectQuery);

  console.log(`✓ Found ${rows.length} rows to migrate`);

  if (rows.length === 0) {
    console.log('⚠ No data to migrate');
    return;
  }

  // Process rows in batches
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const productsToInsert = [];

    for (const row of batch) {
      try {
        const product: any = {
          id: randomUUID(),
          store_id: storeId,
          category_id: categoryId,
          unit_id: unitId,
          is_active: true,
          min_stock_level: 10,
          tax_rate: 0,
          sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Generate unique SKU
        };

        // Map fields
        for (const mapping of fieldMappings) {
          const mysqlValue = row[mapping.mysqlField];
          if (mysqlValue !== undefined && mysqlValue !== null) {
            product[mapping.supabaseField] = mapping.transform
              ? mapping.transform(mysqlValue)
              : mysqlValue;
          }
        }

        // Ensure required fields have defaults
        if (!product.name) {
          product.name = 'Unnamed Product';
        }
        if (product.stock_quantity === undefined) {
          product.stock_quantity = 0;
        }
        if (product.cost_price === undefined) {
          product.cost_price = 0;
        }
        if (product.selling_price === undefined) {
          product.selling_price = 0;
        }
        if (product.wholesale_price === undefined) {
          product.wholesale_price = 0;
        }

        productsToInsert.push(product);
      } catch (error: any) {
        console.error(`Error processing row ${i + batch.indexOf(row) + 1}:`, error.message);
        errorCount++;
      }
    }

    // Insert batch into Supabase
    if (productsToInsert.length > 0) {
      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        errorCount += productsToInsert.length;
      } else {
        successCount += productsToInsert.length;
        console.log(`✓ Migrated batch ${Math.floor(i / BATCH_SIZE) + 1} (${productsToInsert.length} products)`);
      }
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Success: ${successCount} products`);
  console.log(`   Errors: ${errorCount} products`);
}

// Main migration function
async function main() {
  console.log('🚀 Starting MySQL to Supabase Migration\n');

  try {
    // Load configuration
    const config = loadConfig();

    // Connect to MySQL
    console.log('📡 Connecting to MySQL...');
    const mysqlConnection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database
    });
    console.log('✓ Connected to MySQL');

    // Connect to Supabase
    console.log('📡 Connecting to Supabase...');
    const supabase = createClient(config.supabase.url, config.supabase.key);
    console.log('✓ Connected to Supabase');

    // Get or create default store, category, and unit
    const storeId = await getOrCreateDefaultStore(supabase);
    const categoryId = await getOrCreateDefaultCategory(supabase, storeId);
    const unitId = await getOrCreateDefaultUnit(supabase);

    // Determine table name
    const tableName = config.mysql.table || 'products';

    // Check if table exists in MySQL
    const [tables] = await mysqlConnection.query<mysql.RowDataPacket[]>(
      `SHOW TABLES LIKE '${tableName}'`
    );

    if (tables.length === 0) {
      throw new Error(`Table '${tableName}' not found in MySQL database`);
    }

    // Migrate products
    await migrateProducts(
      mysqlConnection,
      supabase,
      tableName,
      DEFAULT_FIELD_MAPPINGS,
      storeId,
      categoryId,
      unitId
    );

    // Close MySQL connection
    await mysqlConnection.end();
    console.log('\n✓ MySQL connection closed');

    console.log('\n🎉 Migration completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
main();
