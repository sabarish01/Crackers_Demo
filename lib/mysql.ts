import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  host: 'MYSQL1003.site4now.net',
  user: 'abcc69_cracker',
  password: 'Sabarish01@',
  database: 'db_abcc69_cracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default connection;
