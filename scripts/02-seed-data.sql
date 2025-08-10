-- Create admin user with hashed password
-- Password: admin123 (hashed with bcrypt)
INSERT INTO admin_users (username, email, password, role) VALUES 
('admin', 'admin@crackershub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');
