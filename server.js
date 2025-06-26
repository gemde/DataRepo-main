// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'data_db'
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected');
});

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mapping = {
    '.pdf': 'PDF',
    '.doc': 'DOC',
    '.docx': 'DOCX',
    '.csv': 'CSV',
    '.xlsx': 'XLSX',
    '.xls': 'XLS',
    '.txt': 'Text',
    '.zip': 'ZIP',
    '.json': 'JSON',
    '.jpg': 'Image',
    '.png': 'Image',
    '.mp4': 'Video',
  };
  return mapping[ext] || 'Unknown';
};

app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (results.length > 0) return res.status(400).json({ error: 'User exists' });

    db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], err => {
      if (err) return res.status(500).json({ error: 'Signup error' });
      res.status(201).json({ message: 'Signup successful' });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ id: results[0].id, email });
    res.json({ token });
  });
});

app.post('/api/upload', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { originalname, size } = req.file;
  const { name, category } = req.body;
  const filetype = getFileType(originalname);
  const sizeMB = `${(size / (1024 * 1024)).toFixed(1)} MB`;
  const now = new Date();

  // Log input for debugging
  console.log('Upload received:', {
    name: name || originalname,
    filename: originalname,
    size: sizeMB,
    category: category || 'Uncategorized',
    downloads: 0,
    starred: false,
    last_updated: now,
    filetype
  });

  const query = `
    INSERT INTO datasets (name, filename, size, category, filetype, downloads, last_updated, starred )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    name || originalname,
    originalname,
    sizeMB,
    category || 'Uncategorized',
    0,
    false,
    now,
    filetype
  ], (err, result) => {
    if (err) {
      console.error('❌ Database insert error:', err);
      return res.status(500).json({ error: 'DB insert error', details: err });
    }
    console.log('✅ Insert result:', result);
    res.status(201).json({ message: 'Upload successful', datasetId: result.insertId });
  });
});

app.get('/api/datasets', verifyToken, (req, res) => {
  db.query('SELECT * FROM datasets', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB fetch error' });
    res.json(results);
  });
});

app.patch('/api/datasets/:filename/star', verifyToken, (req, res) => {
  const { filename } = req.params;
  db.query('SELECT starred FROM datasets WHERE filename = ?', [filename], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB fetch error' });
    if (results.length === 0) return res.status(404).json({ error: 'Dataset not found' });

    const currentStar = results[0].starred;
    db.query('UPDATE datasets SET starred = ? WHERE filename = ?', [!currentStar, filename], (err) => {
      if (err) return res.status(500).json({ error: 'DB update error' });
      res.json({ message: 'Star toggled', starred: !currentStar });
    });
  });
});

app.get('/api/download/:filename', verifyToken, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  db.query('UPDATE datasets SET downloads = downloads + 1 WHERE filename = ?', [filename], (err) => {
    if (err) return res.status(500).json({ error: 'DB update error' });
    res.download(filePath, filename);
  });
});

// Learn content
app.get('/api/learn', verifyToken, (req, res) => {
  db.query('SELECT * FROM learn', (err, results) => {
    if (err) return res.status(500).json({ error: 'Learn fetch error' });
    res.json(results);
  });
});

// Contest content
app.get('/api/contests', verifyToken, (req, res) => {
  db.query('SELECT * FROM contests', (err, results) => {
    if (err) return res.status(500).json({ error: 'Contests fetch error' });
    res.json(results);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
