# MySQL to Supabase Migration Guide

This guide explains how to migrate your data from MySQL to Supabase.

## Prerequisites

1. **MySQL Database**: Your MySQL database should be accessible
2. **Supabase Project**: Your Supabase project should be set up with all tables created
3. **Node.js**: Ensure Node.js is installed (v18 or higher)

## Installation

1. Install dependencies:
```bash
npm install
```

## Configuration

### Option 1: Using Configuration File (Recommended)

1. Copy the example configuration file:
```bash
cp mysql.config.json.example mysql.config.json
```

2. Edit `mysql.config.json` with your MySQL connection details:
```json
{
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "your_password",
  "database": "your_database_name",
  "table": "products"
}
```

### Option 2: Using Environment Variables

Set the following environment variables:

```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database_name
MYSQL_TABLE=products  # Optional, defaults to "products"
```

Also ensure your Supabase environment variables are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR use anon key if service role key is not available
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Field Mapping

The script maps MySQL fields to Supabase fields as follows:

| MySQL Field | Supabase Field | Notes |
|------------|---------------|-------|
| `ITEM` | `name` | Product name |
| `quantity` | `stock_quantity` | Stock quantity |
| `buying_price` | `cost_price` | Cost/buying price |
| `selling_price_min` | `selling_price` | Selling price |
| `wholesale` | `wholesale_price` | Wholesale price |

## Customizing Field Mappings

If your MySQL table has different column names, you can modify the `DEFAULT_FIELD_MAPPINGS` array in `scripts/migrate-mysql-to-supabase.ts`:

```typescript
const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    mysqlField: 'your_mysql_column',
    supabaseField: 'supabase_field',
    transform: (val) => val?.toString().trim() || 'default'
  },
  // ... more mappings
];
```

## Running the Migration

1. Ensure your Supabase database schema is set up (run all SQL scripts in the `scripts/` folder)

2. Run the migration:
```bash
npm run migrate:mysql
```

The script will:
- Connect to your MySQL database
- Read data from the specified table
- Transform and map the data to Supabase schema
- Insert data into Supabase in batches
- Create default store, category, and unit if they don't exist

## What Gets Created

The migration script will automatically:
- Create a default "Main Store" if no stores exist
- Create a default "General" category if no categories exist
- Create a default "Piece" unit if no units exist
- Generate unique SKUs for products
- Set default values for required fields

## Troubleshooting

### Connection Errors

- **MySQL Connection Failed**: Check your MySQL credentials and ensure MySQL is running
- **Supabase Connection Failed**: Verify your Supabase URL and API key

### Data Issues

- **Missing Fields**: The script will use default values for missing fields
- **Type Mismatches**: Check the transform functions in the field mappings
- **Duplicate SKUs**: The script generates unique SKUs automatically

### Common Errors

1. **"Table not found"**: Ensure the table name in your config matches your MySQL table name
2. **"Missing Supabase environment variables"**: Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. **"Missing MySQL database name"**: Set `MYSQL_DATABASE` or include it in `mysql.config.json`

## Post-Migration

After migration:
1. Verify data in Supabase dashboard
2. Check that all products have correct relationships (store, category, unit)
3. Update any missing data manually if needed
4. Test your application with the migrated data

## Notes

- The script processes data in batches of 100 records
- Existing data in Supabase will not be overwritten (new UUIDs are generated)
- The script preserves data types and handles null values
- Make sure to backup your data before running the migration
