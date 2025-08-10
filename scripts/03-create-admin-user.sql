-- Create admin user with proper hashed password
-- This script should be run after the tables are created

-- First, let's make sure the admin_users table exists
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert admin user with bcrypt hashed password for 'admin123'
INSERT INTO admin_users (username, email, password_hash, role) 
VALUES (
    'admin', 
    'admin@crackershub.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'super_admin'
) 
ON CONFLICT (username) DO NOTHING;

-- Verify the admin user was created
SELECT * FROM admin_users WHERE username = 'admin';
