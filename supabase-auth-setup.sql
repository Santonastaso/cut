-- OptiCUT Pro - Supabase Authentication Setup
-- This script sets up authentication and user management for OptiCUT Pro

-- Enable Row Level Security (RLS) on auth.users table
-- This is usually enabled by default in Supabase, but we'll ensure it's on
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a function to handle new user registration
-- This function will be called when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile into public.users table
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create users table to store additional user information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing tables to include user_id for data isolation
-- This ensures each user only sees their own data

-- Add user_id to materials table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to stock_rolls table
ALTER TABLE public.stock_rolls 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to cut_requests table
ALTER TABLE public.cut_requests 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to optimization_results table
ALTER TABLE public.optimization_results 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to cutting_patterns table
ALTER TABLE public.cutting_patterns 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to request_allocations table
ALTER TABLE public.request_allocations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for materials table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.materials;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.materials;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.materials;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.materials;

CREATE POLICY "Users can view own materials" ON public.materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materials" ON public.materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own materials" ON public.materials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own materials" ON public.materials
  FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for stock_rolls table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stock_rolls;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.stock_rolls;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.stock_rolls;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.stock_rolls;

CREATE POLICY "Users can view own stock rolls" ON public.stock_rolls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock rolls" ON public.stock_rolls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock rolls" ON public.stock_rolls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock rolls" ON public.stock_rolls
  FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for cut_requests table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cut_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cut_requests;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.cut_requests;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.cut_requests;

CREATE POLICY "Users can view own cut requests" ON public.cut_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cut requests" ON public.cut_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cut requests" ON public.cut_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cut requests" ON public.cut_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for optimization_results table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.optimization_results;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.optimization_results;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.optimization_results;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.optimization_results;

CREATE POLICY "Users can view own optimization results" ON public.optimization_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own optimization results" ON public.optimization_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own optimization results" ON public.optimization_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own optimization results" ON public.optimization_results
  FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for cutting_patterns table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cutting_patterns;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cutting_patterns;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.cutting_patterns;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.cutting_patterns;

CREATE POLICY "Users can view own cutting patterns" ON public.cutting_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cutting patterns" ON public.cutting_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cutting patterns" ON public.cutting_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cutting patterns" ON public.cutting_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for request_allocations table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.request_allocations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.request_allocations;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.request_allocations;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.request_allocations;

CREATE POLICY "Users can view own request allocations" ON public.request_allocations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own request allocations" ON public.request_allocations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own request allocations" ON public.request_allocations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own request allocations" ON public.request_allocations
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to get current user ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to set user_id automatically on insert
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id on insert
CREATE TRIGGER set_materials_user_id
  BEFORE INSERT ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_stock_rolls_user_id
  BEFORE INSERT ON public.stock_rolls
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_cut_requests_user_id
  BEFORE INSERT ON public.cut_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_optimization_results_user_id
  BEFORE INSERT ON public.optimization_results
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_cutting_patterns_user_id
  BEFORE INSERT ON public.cutting_patterns
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_request_allocations_user_id
  BEFORE INSERT ON public.request_allocations
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- Create an admin user (optional - for initial setup)
-- Replace 'admin@example.com' and 'adminpassword' with your desired admin credentials
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   'admin@example.com',
--   crypt('adminpassword', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON public.materials(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_rolls_user_id ON public.stock_rolls(user_id);
CREATE INDEX IF NOT EXISTS idx_cut_requests_user_id ON public.cut_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_results_user_id ON public.optimization_results(user_id);
CREATE INDEX IF NOT EXISTS idx_cutting_patterns_user_id ON public.cutting_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_request_allocations_user_id ON public.request_allocations(user_id);

-- Success message
SELECT 'OptiCUT Pro authentication setup completed successfully!' as message;
