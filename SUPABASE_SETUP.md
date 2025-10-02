# Supabase Setup Instructions

## 1. Database Setup

### Step 1: Run the SQL Setup Script
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run** to execute the script

This will create:
- ✅ All necessary tables (materials, stock_rolls, cut_requests, optimization_results, etc.)
- ✅ Indexes for better performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic timestamp updates
- ✅ Sample data for testing
- ✅ Useful views for reporting

### Step 2: Verify Tables Created
After running the SQL script, you should see these tables in your Supabase dashboard:
- `materials` - Material catalog
- `stock_rolls` - Available stock rolls
- `cut_requests` - Cutting requests/orders
- `optimization_results` - Optimization results
- `cutting_patterns` - Detailed cutting patterns
- `request_allocations` - Request-to-pattern allocations

## 2. Application Configuration

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Verify Supabase Connection
The Supabase client is already configured in `src/lib/supabase.js` with your project credentials:
- **Project ID**: `jhoyskraszecvcfsmgzj`
- **Anon Key**: Already configured

### Step 3: Test the Connection
1. Start the development server: `npm run dev`
2. Navigate to the application
3. Try adding a material - it should save to Supabase
4. Check your Supabase dashboard to verify data is being saved

## 3. Database Schema Overview

### Materials Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- code (VARCHAR(50) UNIQUE) - Material code like 'ITXBI'
- name (VARCHAR(255)) - Material name
- specific_weight (DECIMAL(10,2)) - Weight in g/m²
- created_at, updated_at (TIMESTAMPS)
```

### Stock Rolls Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- code (VARCHAR(100) UNIQUE) - Roll code like 'ITXBI1000'
- material_code (VARCHAR(50)) - References materials.code
- width (INTEGER) - Width in mm
- length (DECIMAL(10,2)) - Length in meters
- weight (DECIMAL(10,2)) - Weight in kg
- batch (VARCHAR(100)) - Batch number
- is_available (BOOLEAN) - Availability status
- created_at, updated_at (TIMESTAMPS)
```

### Cut Requests Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- order_number (VARCHAR(100) UNIQUE) - Order number like 'ODP-2024/120'
- material_code (VARCHAR(50)) - References materials.code
- width (INTEGER) - Required width in mm
- length (DECIMAL(10,2)) - Required length in meters
- quantity (INTEGER) - Number of pieces needed
- priority (VARCHAR(20)) - 'high', 'normal', or 'low'
- status (VARCHAR(20)) - 'pending', 'processing', 'completed', 'cancelled'
- created_at, updated_at (TIMESTAMPS)
```

### Optimization Results Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- algorithm_type (VARCHAR(50)) - Algorithm used
- algorithm_settings (JSONB) - Algorithm configuration
- efficiency (DECIMAL(5,2)) - Overall efficiency percentage
- total_waste (DECIMAL(10,2)) - Total waste in m²
- rolls_used (INTEGER) - Number of rolls used
- total_rolls (INTEGER) - Total rolls available
- fulfilled_requests (INTEGER) - Requests fulfilled
- total_requests (INTEGER) - Total requests
- cutting_plans (JSONB) - Complete optimization result
- created_at (TIMESTAMP)
```

## 4. Services Available

The application includes these Supabase services:

### MaterialsService
- `getAll()` - Get all materials
- `getById(id)` - Get material by ID
- `getByCode(code)` - Get material by code
- `create(material)` - Create new material
- `update(id, updates)` - Update material
- `delete(id)` - Delete material
- `checkCodeExists(code, excludeId)` - Check for duplicate codes

### StockService
- `getAll()` - Get all stock rolls
- `getByMaterial(materialCode)` - Get rolls by material
- `getAvailable()` - Get only available rolls
- `create(stockRoll)` - Create new roll
- `update(id, updates)` - Update roll
- `delete(id)` - Delete roll
- `markAsUsed(rollIds)` - Mark rolls as used

### RequestsService
- `getAll()` - Get all requests
- `getByMaterial(materialCode)` - Get requests by material
- `getByPriority(priority)` - Get requests by priority
- `getPending()` - Get pending requests
- `create(request)` - Create new request
- `update(id, updates)` - Update request
- `delete(id)` - Delete request
- `updateStatus(id, status)` - Update request status

### OptimizationService
- `saveResult(result)` - Save optimization result
- `savePatterns(resultId, patterns)` - Save cutting patterns
- `saveAllocations(resultId, allocations)` - Save request allocations
- `getResults(limit)` - Get optimization history
- `getResultById(id)` - Get specific result
- `getResultsByAlgorithm(algorithm, limit)` - Get results by algorithm
- `getAlgorithmComparison()` - Get algorithm performance comparison

## 5. Views Available

### materials_with_rolls
Shows materials with roll statistics:
- Total rolls per material
- Available rolls per material
- Total available length per material

### requests_with_materials
Shows requests with material information:
- Material name and properties
- Calculated total weight

### optimization_summary
Shows optimization results with pattern statistics:
- Average pattern efficiency
- Total patterns created

## 6. Security

- **Row Level Security (RLS)** is enabled on all tables
- **Policies** currently allow all operations (you can restrict later)
- **Authentication** can be added later if needed

## 7. Next Steps

1. **Run the SQL setup script** in your Supabase dashboard
2. **Install dependencies**: `npm install`
3. **Start the app**: `npm run dev`
4. **Test the integration** by adding materials, rolls, and requests
5. **Run optimizations** and verify results are saved to the database

The application will now persist all data to Supabase instead of using local state only!

