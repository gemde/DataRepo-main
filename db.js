const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',          // leave blank if your XAMPP has no MySQL password
  database: 'data_db'     // change this to your actual database name
});

connection.connect(err => {
  if (err) throw err;
  console.log('✅ Connected to MySQL database');
});

module.exports = connection;
