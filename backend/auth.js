// routes/signup.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/signup', async (req, res) => {
  const db = req.app.get('db'); // ✅ Use shared DB connection

  try {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      password,
      gender,
      phone,
      institution,
      official_work,
      id_number,
      role,
      agreed_terms
    } = req.body;

    db.query('SELECT * FROM user_registration WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length > 0) return res.status(400).json({ error: 'Email already registered' });

      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO user_registration (
          first_name, middle_name, last_name, email, password,
          gender, phone, institution, official_work, id_number,
          role, agreed_terms
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        first_name,
        middle_name || null,
        last_name,
        email,
        hashedPassword,
        gender,
        phone,
        institution,
        official_work,
        id_number,
        role || 'user',
        agreed_terms === 'true' ? 1 : 0
      ];

      db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to insert user', details: err });

        const token = jwt.sign(
          { id: result.insertId, role },
          process.env.JWT_SECRET || 'yoursecret',
          { expiresIn: '1d' }
        );

        res.json({ message: 'Signup successful', token });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
