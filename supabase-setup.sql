-- OptiCUT Pro Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    specific_weight DECIMAL(10,2) NOT NULL CHECK (specific_weight > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_rolls table
CREATE TABLE IF NOT EXISTS stock_rolls (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    material_code VARCHAR(50) NOT NULL REFERENCES materials(code) ON DELETE CASCADE,
    width INTEGER NOT NULL CHECK (width > 0),
    length DECIMAL(10,2) NOT NULL CHECK (length > 0),
    weight DECIMAL(10,2) NOT NULL CHECK (weight > 0),
    batch VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cut_requests table
CREATE TABLE IF NOT EXISTS cut_requests (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    material_code VARCHAR(50) NOT NULL REFERENCES materials(code) ON DELETE CASCADE,
    width INTEGER NOT NULL CHECK (width > 0),
    length DECIMAL(10,2) NOT NULL CHECK (length > 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'normal', 'low')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimization_results table
CREATE TABLE IF NOT EXISTS optimization_results (
    id BIGSERIAL PRIMARY KEY,
    algorithm_type VARCHAR(50) NOT NULL,
    algorithm_settings JSONB,
    efficiency DECIMAL(5,2) NOT NULL,
    total_waste DECIMAL(10,2) NOT NULL,
    rolls_used INTEGER NOT NULL,
    total_rolls INTEGER NOT NULL,
    fulfilled_requests INTEGER NOT NULL,
    total_requests INTEGER NOT NULL,
    cutting_plans JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cutting_patterns table (for detailed pattern storage)
CREATE TABLE IF NOT EXISTS cutting_patterns (
    id BIGSERIAL PRIMARY KEY,
    optimization_result_id BIGINT NOT NULL REFERENCES optimization_results(id) ON DELETE CASCADE,
    roll_id BIGINT NOT NULL REFERENCES stock_rolls(id) ON DELETE CASCADE,
    material_code VARCHAR(50) NOT NULL,
    efficiency DECIMAL(5,2) NOT NULL,
    waste DECIMAL(10,2) NOT NULL,
    used_width INTEGER NOT NULL,
    cuts JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create request_allocations table (for tracking which requests are fulfilled by which patterns)
CREATE TABLE IF NOT EXISTS request_allocations (
    id BIGSERIAL PRIMARY KEY,
    optimization_result_id BIGINT NOT NULL REFERENCES optimization_results(id) ON DELETE CASCADE,
    cutting_pattern_id BIGINT NOT NULL REFERENCES cutting_patterns(id) ON DELETE CASCADE,
    request_id BIGINT NOT NULL REFERENCES cut_requests(id) ON DELETE CASCADE,
    allocated_width INTEGER NOT NULL,
    allocated_length DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_stock_rolls_material ON stock_rolls(material_code);
CREATE INDEX IF NOT EXISTS idx_stock_rolls_available ON stock_rolls(is_available);
CREATE INDEX IF NOT EXISTS idx_cut_requests_material ON cut_requests(material_code);
CREATE INDEX IF NOT EXISTS idx_cut_requests_status ON cut_requests(status);
CREATE INDEX IF NOT EXISTS idx_cut_requests_priority ON cut_requests(priority);
CREATE INDEX IF NOT EXISTS idx_optimization_results_algorithm ON optimization_results(algorithm_type);
CREATE INDEX IF NOT EXISTS idx_optimization_results_created ON optimization_results(created_at);
CREATE INDEX IF NOT EXISTS idx_cutting_patterns_optimization ON cutting_patterns(optimization_result_id);
CREATE INDEX IF NOT EXISTS idx_cutting_patterns_roll ON cutting_patterns(roll_id);
CREATE INDEX IF NOT EXISTS idx_request_allocations_optimization ON request_allocations(optimization_result_id);
CREATE INDEX IF NOT EXISTS idx_request_allocations_request ON request_allocations(request_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_rolls_updated_at BEFORE UPDATE ON stock_rolls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cut_requests_updated_at BEFORE UPDATE ON cut_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE cut_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutting_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - you can restrict later)
CREATE POLICY "Allow all operations on materials" ON materials
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on stock_rolls" ON stock_rolls
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on cut_requests" ON cut_requests
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on optimization_results" ON optimization_results
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on cutting_patterns" ON cutting_patterns
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on request_allocations" ON request_allocations
    FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO materials (code, name, specific_weight) VALUES
('ITXBI', 'Triplex Bianco', 121.10),
('ITXARGLU', 'Triplex Argento Lucido', 114.00),
('IQXBI', 'Quadruplex Bianco', 146.80)
ON CONFLICT (code) DO NOTHING;

INSERT INTO stock_rolls (code, material_code, width, length, weight, batch) VALUES
('ITXBI1000', 'ITXBI', 1000, 3000, 363.3, '2024/03/001'),
('ITXBI1000-2', 'ITXBI', 1000, 2000, 242.2, '2024/03/002'),
('ITXARGLU700', 'ITXARGLU', 700, 4200, 335.16, '2024/03/003')
ON CONFLICT (code) DO NOTHING;

INSERT INTO cut_requests (order_number, material_code, width, length, quantity, priority) VALUES
('ODP-2024/120', 'ITXBI', 220, 2500, 1, 'high'),
('ODP-2024/121', 'ITXBI', 320, 3000, 1, 'normal')
ON CONFLICT (order_number) DO NOTHING;

-- Create views for easier querying
CREATE OR REPLACE VIEW materials_with_rolls AS
SELECT 
    m.*,
    COUNT(sr.id) as total_rolls,
    COUNT(CASE WHEN sr.is_available THEN 1 END) as available_rolls,
    COALESCE(SUM(CASE WHEN sr.is_available THEN sr.length END), 0) as total_available_length
FROM materials m
LEFT JOIN stock_rolls sr ON m.code = sr.material_code
GROUP BY m.id, m.code, m.name, m.specific_weight, m.created_at, m.updated_at;

CREATE OR REPLACE VIEW requests_with_materials AS
SELECT 
    cr.*,
    m.name as material_name,
    m.specific_weight,
    (cr.width * cr.length * cr.quantity * m.specific_weight / 1000000) as total_weight_kg
FROM cut_requests cr
JOIN materials m ON cr.material_code = m.code;

CREATE OR REPLACE VIEW optimization_summary AS
SELECT 
    opt.*,
    COUNT(cp.id) as total_patterns,
    AVG(cp.efficiency) as avg_pattern_efficiency
FROM optimization_results opt
LEFT JOIN cutting_patterns cp ON opt.id = cp.optimization_result_id
GROUP BY opt.id, opt.algorithm_type, opt.algorithm_settings, opt.efficiency, 
         opt.total_waste, opt.rolls_used, opt.total_rolls, opt.fulfilled_requests, 
         opt.total_requests, opt.cutting_plans, opt.created_at;

-- Grant permissions (adjust as needed for your use case)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
