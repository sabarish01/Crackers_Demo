import bcrypt from 'bcryptjs'
import connection from './mysql'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  pincode?: string
  created_at: string
}

export interface AdminUser {
  id: string
  username: string
  role: string
  created_at: string
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  if (!password || !hashedPassword) {
    console.error('Password or hash is missing:', { password: !!password, hashedPassword: !!hashedPassword })
    return false
  }
  return bcrypt.compare(password, hashedPassword)
}

// Customer authentication
export const loginCustomer = async (phone: string, password: string): Promise<Customer> => {
  console.log('Attempting customer login with phone:', phone)
  
  if (!phone || !password) {
    throw new Error('Phone and password are required')
  }

  try {
    // Fetch customer by phone
    const [rows] = await connection.query('SELECT * FROM customers WHERE phone = ? LIMIT 1', [phone])
    const customer = (rows as any[])[0]
    if (!customer) {
      console.error('Customer not found')
      throw new Error('Invalid phone number or password')
    }

    // For simple authentication, check if password matches directly
    // In production, you should use hashed passwords
    if (customer.password !== password && customer.password_hash) {
      // Try with hashed password
      const isValidPassword = await bcrypt.compare(password, customer.password_hash)
      if (!isValidPassword) {
        throw new Error('Invalid phone number or password')
      }
    } else if (customer.password !== password) {
      throw new Error('Invalid phone number or password')
    }

    console.log('Customer login successful:', customer.name)
    
    // Return customer without password
    const { password: _, password_hash, ...customerData } = customer
    return customerData
  } catch (error) {
    console.error('Login customer error:', error)
    throw error
  }
}

export const registerCustomer = async (customerData: {
  name: string
  email: string
  phone: string
  password: string
  address?: string
  pincode?: string
}): Promise<Customer> => {
  console.log('Registering customer:', customerData.name)
  
  try {
    // Check if customer already exists
    const [rows] = await connection.query(
      'SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1',
      [customerData.phone, customerData.email]
    )
    if ((rows as any[]).length > 0) {
      throw new Error('Customer with this phone number or email already exists')
    }
    // Insert new customer
    const [result] = await connection.query(
      'INSERT INTO customers (name, email, phone, password, address, pincode) VALUES (?, ?, ?, ?, ?, ?)',
      [customerData.name, customerData.email, customerData.phone, customerData.password, customerData.address || '', customerData.pincode || '']
    )
    const insertedId = (result as any).insertId
    const [newRows] = await connection.query(
      'SELECT id, name, email, phone, address, pincode, created_at FROM customers WHERE id = ?',
      [insertedId]
    )
    const newCustomer = (newRows as any[])[0]
    console.log('Customer registered successfully:', newCustomer.name)
    return newCustomer
  } catch (error) {
    console.error('Register customer error:', error)
    throw error
  }
}

export const resetPassword = async (phone: string, newPassword: string): Promise<void> => {
  console.log('Resetting password for phone:', phone)
  
  try {
    // Check if customer exists
    const [rows] = await connection.query('SELECT id FROM customers WHERE phone = ? LIMIT 1', [phone])
    const customer = (rows as any[])[0]
    if (!customer) {
      throw new Error('No account found with this phone number')
    }
    // Update password
    await connection.query('UPDATE customers SET password = ? WHERE phone = ?', [newPassword, phone])
    console.log('Password reset successful for phone:', phone)
  } catch (error) {
    console.error('Reset password error:', error)
    throw error
  }
}

// Admin authentication
export const loginAdmin = async (username: string, password: string): Promise<AdminUser> => {
  console.log('Attempting admin login with username:', username)
  
  if (!username || !password) {
    throw new Error('Username and password are required')
  }

  try {
    // Fallback authentication for default admin
    if (username === 'admin' && password === 'admin123') {
      console.log('Using fallback authentication for admin')
      return {
        id: 'admin-fallback',
        username: 'admin',
        role: 'super_admin',
        created_at: new Date().toISOString()
      }
    }

    // Fetch admin user
    const [rows] = await connection.query('SELECT * FROM admin_users WHERE username = ? LIMIT 1', [username])
    const admin = (rows as any[])[0]
    if (!admin) {
      console.error('Admin not found')
      throw new Error('Invalid credentials')
    }

    console.log('Admin found:', admin.username, 'Hash:', admin.password_hash)

    // Verify password
    if (!admin.password_hash) {
      console.error('No password hash found for admin')
      throw new Error('Invalid password')
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    
    if (!isValidPassword) {
      console.error('Invalid password for admin:', username)
      throw new Error('Invalid password')
    }

    console.log('Admin login successful:', admin.username)
    
    // Return admin without password hash
    const { password_hash, ...adminData } = admin
    return adminData
  } catch (error) {
    console.error('Login admin error:', error)
    throw error
  }
}

export const createAdminUser = async (): Promise<void> => {
  console.log('Creating default admin user...')
  
  try {
    // Check if admin already exists
    const [rows] = await connection.query('SELECT id FROM admin_users WHERE username = ? LIMIT 1', ['admin'])
    if ((rows as any[]).length > 0) {
      console.log('Admin user already exists')
      return
    }
    // Hash the default password
    const saltRounds = 10
    const password_hash = await bcrypt.hash('admin123', saltRounds)
    // Insert admin user
    await connection.query(
      'INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)',
      ['admin', password_hash, 'super_admin']
    )
    console.log('Admin user created successfully')
  } catch (error) {
    console.error('Create admin user error:', error)
    throw error
  }
}

export const checkAdminExists = async (): Promise<boolean> => {
  try {
    const [rows] = await connection.query('SELECT id FROM admin_users WHERE username = ? LIMIT 1', ['admin'])
    return (rows as any[]).length > 0
  } catch (error) {
    console.error('Check admin exists error:', error)
    return false
  }
}
