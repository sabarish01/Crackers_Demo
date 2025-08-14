const mysql = require('mysql2/promise');
const connection = mysql.createPool({
  host: 'MYSQL1003.site4now.net',
  user: 'abcc69_cracker',
  password: 'Sabarish01@',
  database: 'db_abcc69_cracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkCustomersTable() {
  try {
    const [rows] = await connection.query('DESCRIBE customers');
    console.log('customers table structure:', rows);
    process.exit(0);
  } catch (error) {
    console.error('Error describing customers table:', error);
    process.exit(1);
  }
}

checkCustomersTable();
