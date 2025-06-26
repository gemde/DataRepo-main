const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

// --- MODIFIED: Import auth middleware functions ---
const { authenticateToken, authorizeAdmin } = require('./middleware/authMiddleware');

// App initialization
const app = express();
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// --- PROFILE PICTURE UPLOAD DIRECTORY SETUP ---
const profilePicDir = path.join(__dirname, 'profile_pictures');
if (!fs.existsSync(profilePicDir)) {
    fs.mkdirSync(profilePicDir, { recursive: true }); // Ensure recursive creation
    console.log(`Created profile_pictures directory at: ${profilePicDir}`);
}
// Serve profile pictures statically
app.use('/profile_pictures', express.static(profilePicDir));

// --- DATASET UPLOAD DIRECTORY SETUP ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads directory at: ${uploadDir}`);
}
app.use('/uploads', express.static(uploadDir)); // Serve datasets statically

// Multer storage for datasets
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Multer storage for profile pictures
const profilePictureStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, profilePicDir),
    filename: (req, file, cb) => {
        const userId = req.user.id;
        const fileExtension = path.extname(file.originalname);
        cb(null, `profile_pic_${userId}${fileExtension}`);
    }
});
const uploadProfilePicture = multer({
    storage: profilePictureStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and GIF images are allowed.'));
        }
    }
});


// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Get file type helper
const getFileType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const mapping = {
        '.pdf': 'PDF', '.doc': 'DOC', '.docx': 'DOCX', '.csv': 'CSV',
        '.xlsx': 'XLSX', '.xls': 'XLS', '.txt': 'Text', '.zip': 'ZIP',
        '.json': 'JSON', '.jpg': 'Image', '.jpeg': 'Image', '.png': 'Image', '.gif': 'Image', '.mp4': 'Video',
        '.mp3': 'Audio',
        '.pptx': 'PowerPoint',
        '.ipynb': 'Jupyter Notebook',
        '.py': 'Python Script',
        '.r': 'R Script'
    };
    return mapping[ext] || 'Unknown';
};

// Format bytes helper
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EH', 'ZL', 'YL'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


// --- DATABASE CONNECTION SETUP ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'data_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB connection and make the pool available to routes
pool.getConnection()
    .then(connection => {
        console.log('✅ Connected to MySQL database!');
        connection.release();
        app.set('db', pool);
    })
    .catch(err => {
        console.error('❌ Failed to connect to MySQL database:', err.message);
        process.exit(1);
    });


// --- ROUTES ---

// Signup route
app.post('/api/signup', async (req, res) => {
    const db = req.app.get('db');
    try {
        const {
            first_name, last_name, email, password, gender,
            national_id_passport, country, institution, official_work, agreed
        } = req.body;

        if (!email || !password || !first_name || !last_name || agreed === undefined) {
            return res.status(400).json({ error: 'Missing required fields (First Name, Last Name, Email, Password, and agreement to terms).' });
        }
        if (!agreed) {
            return res.status(400).json({ error: 'You must agree to the Terms of Service and Privacy Policy.' });
        }

        const [emailCheck] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
        if (emailCheck.length > 0) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        if (national_id_passport) {
            const [idCheck] = await db.execute('SELECT national_id_passport FROM users WHERE national_id_passport = ?', [national_id_passport]);
            if (idCheck.length > 0) {
                return res.status(409).json({ error: 'National ID/Passport number already registered.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = 'user';

        const sql = `
            INSERT INTO users (
                first_name, last_name, email, password, gender,
                national_id_passport, country, institution, official_work, role, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `.trim();
        const values = [
            first_name, last_name, email, hashedPassword,
            gender || null, national_id_passport || null, country || null,
            institution || null, official_work || null, userRole
        ];

        const [result] = await db.execute(sql, values);

        const [newUser] = await db.execute(
            'SELECT id, email, role, first_name, last_name, profile_picture_url FROM users WHERE id = ?',
            [result.insertId]
        );

        const token = jwt.sign(
            { id: newUser[0].id, email: newUser[0].email, role: newUser[0].role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User registered successfully!',
            token: token,
            user: newUser[0]
        });

    } catch (error) {
        console.error('Server error during registration:', error);
        if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('national_id_passport')) {
            return res.status(409).json({ error: 'National ID/Passport number already registered.' });
        }
        res.status(500).json({ error: 'Server error during registration.', details: error.message });
    }
});

// LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const db = req.app.get('db');
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const [results] = await db.execute(
            'SELECT id, email, password, role, first_name, last_name, profile_picture_url FROM users WHERE email = ?',
            [email]
        );

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                profile_picture_url: user.profile_picture_url
            }
        });
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    const db = req.app.get('db');
    const { email } = req.body;
    try {
        const [users] = await db.execute('SELECT id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = users[0];
        const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });

        res.json({ message: 'Password reset link sent to your email (check console for token in development).', resetToken: resetToken });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset Password
app.post('/api/reset-password/:token', async (req, res) => {
    const db = req.app.get('db');
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ error: 'Password reset token has expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: 'Invalid password reset token' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// --- DASHBOARD STATS (Accessible by all authenticated users) ---
app.get('/api/stats', authenticateToken, async (req, res) => {
    const db = req.app.get('db');
    try {
        const [userCountResult] = await db.query('SELECT COUNT(id) AS totalUsers FROM users');
        const [datasetCountResult] = await db.query('SELECT COUNT(id) AS totalApprovedDatasets FROM datasets WHERE approved = TRUE');
        const [contestCountResult] = await db.query('SELECT COUNT(id) AS totalApprovedContests FROM contests WHERE approved = TRUE');

        res.json({
            totalUsers: userCountResult[0].totalUsers,
            totalApprovedDatasets: datasetCountResult[0].totalApprovedDatasets,
            totalApprovedContests: contestCountResult[0].totalApprovedContests,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics.', details: error.message });
    }
});

// --- RECENT FILES (Accessible by all authenticated users) ---
app.get('/api/recent-files', authenticateToken, async (req, res) => {
    const db = req.app.get('db');
    try {
        const [recentFiles] = await db.query(`
            SELECT
                d.id, d.name, d.filename, d.filetype, d.size, d.last_updated, d.downloads, d.starred, d.is_public,
                dm.description, dm.tags, u.first_name AS uploader_username, u.email AS uploader_email
            FROM datasets d
            LEFT JOIN dataset_metadata dm ON d.id = dm.dataset_id -- Changed to LEFT JOIN for optional metadata
            JOIN users u ON d.user_id = u.id
            WHERE d.approved = TRUE AND d.is_public = TRUE
            ORDER BY d.last_updated DESC
            LIMIT 5
        `.trim());

        const transformedRecentFiles = recentFiles.map(file => ({
            ...file,
            starred: Boolean(file.starred),
            is_public: Boolean(file.is_public)
        }));

        res.json(transformedRecentFiles);
    } catch (error) { // FIXED: Added proper catch block for this route
        console.error('Error fetching recent files:', error);
        res.status(500).json({ message: 'Failed to fetch recent files.', details: error.message });
    }
});

// GET /api/user/datasets - Get all datasets uploaded by the current logged-in user
app.get('/api/user/datasets', authenticateToken, async (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;

    try {
        const [datasets] = await db.execute(
            `SELECT d.id, d.name, d.filename, d.size, d.category, d.filetype, d.downloads, d.starred, d.last_updated, d.approved, d.is_public,
                    dm.description, dm.tags
             FROM datasets d
             LEFT JOIN dataset_metadata dm ON d.id = dm.dataset_id -- Use LEFT JOIN here too
             WHERE d.user_id = ?
             ORDER BY d.last_updated DESC`.trim(),
            [userId]
        );
        res.status(200).json(datasets);
    } catch (error) {
        console.error('Error fetching user-specific datasets:', error);
        res.status(500).json({ message: 'Failed to fetch your uploaded datasets.' });
    }
});


// GET /api/datasets/:id - Get a single dataset by ID (for detail page)
app.get('/api/datasets/:id', authenticateToken, async (req, res) => {
    const db = req.app.get('db');
    const datasetId = req.params.id;

    try {
        const [datasets] = await db.execute(
            `SELECT
                d.id, d.name, d.filename, d.size, d.category, d.filetype, d.downloads, d.starred, d.last_updated, d.approved, d.is_public, d.user_id,
                dm.description, dm.tags,
                u.first_name AS uploader_first_name, u.last_name AS uploader_last_name, u.email AS uploader_email, u.profile_picture_url AS uploader_profile_pic
             FROM datasets d
             LEFT JOIN dataset_metadata dm ON d.id = dm.dataset_id -- Use LEFT JOIN
             JOIN users u ON d.user_id = u.id
             WHERE d.id = ?`.trim(),
            [datasetId]
        );

        if (datasets.length === 0) {
            return res.status(404).json({ message: 'Dataset not found.' });
        }

        const dataset = datasets[0];

        if (!Boolean(dataset.is_public) && dataset.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied: This dataset is private.' });
        }

        res.status(200).json(dataset);
    } catch (error) {
        console.error('Error fetching single dataset by ID:', error);
        res.status(500).json({ message: 'Failed to fetch dataset details.', details: error.message });
    }
});

// PATCH /api/datasets/:id - Update dataset metadata
app.patch('/api/datasets/:id', authenticateToken, async (req, res) => {
    const db = req.app.get('db');
    const datasetId = req.params.id;
    const { name, category, description, tags, is_public } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [datasetCheck] = await connection.execute(
            'SELECT user_id FROM datasets WHERE id = ?',
            [datasetId]
        );

        if (datasetCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Dataset not found.' });
        }

        const datasetOwnerId = datasetCheck[0].user_id;

        if (datasetOwnerId !== userId && userRole !== 'admin') {
            await connection.rollback();
            return res.status(403).json({ message: 'Access Denied: You can only edit your own datasets or have admin privileges.' });
        }

        const datasetUpdates = [];
        const datasetValues = [];
        const metadataUpdates = [];
        const metadataValues = [];

        if (name !== undefined) { datasetUpdates.push('name = ?'); datasetValues.push(name); }
        if (category !== undefined) { datasetUpdates.push('category = ?'); datasetValues.push(category); }
        if (is_public !== undefined) { datasetUpdates.push('is_public = ?'); datasetValues.push(is_public); }
        datasetUpdates.push('last_updated = NOW()');

        if (description !== undefined) { metadataUpdates.push('description = ?'); metadataValues.push(description || null); } // Ensure null if empty string
        if (tags !== undefined) { metadataUpdates.push('tags = ?'); metadataValues.push(tags || null); } // Ensure null if empty string


        if (datasetUpdates.length > 0) {
            const datasetSql = `UPDATE datasets SET ${datasetUpdates.join(', ')} WHERE id = ?`.trim();
            datasetValues.push(datasetId);
            const [datasetResult] = await connection.execute(datasetSql, datasetValues);
            if (datasetResult.affectedRows === 0) {
                 console.warn(`Dataset ${datasetId} not updated in main table (might be no changes or not found).`);
            }
        }

        // Handle dataset_metadata: UPDATE if exists, INSERT if not (for old datasets or those uploaded without desc/tags)
        const [metadataExists] = await connection.execute('SELECT dataset_id FROM dataset_metadata WHERE dataset_id = ?', [datasetId]);

        if (metadataUpdates.length > 0) {
            if (metadataExists.length > 0) {
                const metadataSql = `UPDATE dataset_metadata SET ${metadataUpdates.join(', ')} WHERE dataset_id = ?`.trim();
                metadataValues.push(datasetId);
                const [metadataResult] = await connection.execute(metadataSql, metadataValues);
                if (metadataResult.affectedRows === 0) {
                    console.warn(`Dataset metadata ${datasetId} not updated (might be no changes).`);
                }
            } else {
                // If metadata record does not exist, insert it
                await connection.execute(
                    `INSERT INTO dataset_metadata (dataset_id, description, tags) VALUES (?, ?, ?)`.trim(),
                    [datasetId, description || null, tags || null]
                );
            }
        }

        await connection.commit();
        res.status(200).json({ message: 'Dataset details updated successfully!' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Server Error: Failed to update dataset details:', error);
        res.status(500).json({ error: 'Failed to update dataset details.', details: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// --- UPLOAD DATASET ROUTE (UPDATED TO MAKE DESCRIPTION/TAGS OPTIONAL) ---
app.post('/api/datasets/upload', authenticateToken, upload.single('datasetFile'), async (req, res) => {
    const db = req.app.get('db');
    let connection;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No dataset file uploaded.' });
        }

        // Removed description and tags from required validation here
        const { datasetName, category, is_public } = req.body;
        // Description and tags will be treated as optional, default to null for insertion
        const description = req.body.description || null; // Explicitly handle as optional
        const tags = req.body.tags || null; // Explicitly handle as optional


        if (!datasetName || !category || is_public === undefined) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Cleanup Error: Could not delete incomplete upload file:', err);
            });
            return res.status(400).json({ error: 'Missing required dataset information (name, category, or visibility).' });
        }

        const userId = req.user.id;
        const filename = req.file.filename;
        const originalname = req.file.originalname;
        const rawSizeInBytes = req.file.size;
        const filetype = getFileType(originalname);
        const formattedSize = formatBytes(rawSizeInBytes);

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [datasetResult] = await connection.execute(
            `INSERT INTO datasets (
                user_id, name, filename, filetype, size, category, downloads, starred, approved, is_public, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`.trim(),
            [
                userId,
                datasetName, // Use datasetName from form
                filename,
                filetype,
                formattedSize,
                category,
                0,
                0,
                0, // Set approved to 0 for pending review
                is_public
            ]
        );

        const datasetId = datasetResult.insertId;

        // Insert into dataset_metadata with potentially null values for description and tags
        await connection.execute(
            `INSERT INTO dataset_metadata (
                dataset_id, description, tags
            ) VALUES (?, ?, ?)`.trim(),
            [
                datasetId,
                description, // Will be null if not provided by frontend
                tags // Will be null if not provided by frontend
            ]
        );

        await connection.commit();

        console.log(`Dataset uploaded and DB entries created. Dataset ID: ${datasetId}, Filename: ${filename}`);
        res.status(201).json({
            message: 'Dataset uploaded and submitted for review successfully!',
            datasetId: datasetId,
            filename: filename,
            fileUrl: `/uploads/${filename}`
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Server Error: Failed to upload dataset or save to DB:', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Cleanup Error: Could not delete uploaded file after DB failure:', unlinkErr);
            });
        }
        res.status(500).json({ error: 'Failed to upload dataset.', details: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// --- ADMIN ROUTES ---

// Admin creation / Register new user by admin (can be admin or user)
app.post('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    const { first_name, last_name, email, password, gender, national_id_passport, country, institution, official_work, role } = req.body;

    if (!email || !password || !first_name || !last_name || !role) {
        return res.status(400).json({ error: 'Missing required fields: first_name, last_name, email, password, and role.' });
    }

    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}` });
    }

    try {
        const [emailCheck] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
        if (emailCheck.length > 0) {
            return res.status(409).json({ error: 'Email already registered.' });
        }
        if (national_id_passport) {
            const [idCheck] = await db.execute('SELECT national_id_passport FROM users WHERE national_id_passport = ?', [national_id_passport]);
            if (idCheck.length > 0) {
                return res.status(409).json({ error: 'National ID/Passport number already registered.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `
            INSERT INTO users (
                first_name, last_name, email, password, gender,
                national_id_passport, country, institution, official_work, role, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `.trim();
        const values = [
            first_name, last_name, email, hashedPassword,
            gender || null, national_id_passport || null, country || null,
            institution || null, official_work || null, role
        ];
        const [result] = await db.execute(sql, values);
        res.status(201).json({ message: `User with role '${role}' registered successfully`, userId: result.insertId });
    } catch (err) {
        console.error('Error creating user by admin:', err);
        res.status(500).json({ error: 'Server error creating user.', details: err.message });
    }
});

// Admin management: Get all users (including admins, users, researchers)
app.get('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    try {
        const [results] = await db.execute('SELECT id, first_name, last_name, email, role, gender, country, institution, official_work, profile_picture_url, created_at FROM users');
        res.status(200).json(results);
    } catch (err) {
        console.error('Failed to fetch all users:', err);
        res.status(500).json({ error: 'Failed to fetch all users' });
    }
});

// Admin management: Update user role/details by ID
app.patch('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    const targetUserId = parseInt(req.params.id, 10);
    const { first_name, last_name, email, gender, national_id_passport, country, institution, official_work, role } = req.body;
    const currentAdminId = req.user.id;

    if (isNaN(targetUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (targetUserId === currentAdminId && role && role !== 'admin') {
        return res.status(403).json({ error: 'An admin cannot demote themselves.' });
    }

    const updates = [];
    const values = [];

    if (first_name !== undefined) { updates.push('first_name = ?'); values.push(first_name); }
    if (last_name !== undefined) { updates.push('last_name = ?'); values.push(last_name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (gender !== undefined) { updates.push('gender = ?'); values.push(gender || null); }
    if (national_id_passport !== undefined) { updates.push('national_id_passport = ?'); values.push(national_id_passport || null); }
    if (country !== undefined) { updates.push('country = ?'); values.push(country || null); }
    if (institution !== undefined) { updates.push('institution = ?'); values.push(institution || null); }
    if (official_work !== undefined) { updates.push('official_work = ?'); values.push(official_work || null); }
    if (role !== undefined) {
        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}` });
        }
        updates.push('role = ?'); values.push(role);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`.trim();
    values.push(targetUserId);

    try {
        const [result] = await db.execute(sql, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or no changes made.' });
        }
        res.status(200).json({ message: 'User updated successfully.' });
    } catch (err) {
        console.error('Error updating user by admin:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email or National ID/Passport already exists for another user.' });
        }
        res.status(500).json({ error: 'Server error updating user.', details: err.message });
    }
});


// Admin management: Delete user by ID
app.delete('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    const userIdToDelete = parseInt(req.params.id, 10);
    const currentAdminId = req.user.id;

    if (isNaN(userIdToDelete)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (userIdToDelete === currentAdminId) {
        return res.status(403).json({ error: 'You cannot delete your own user account.' });
    }

    try {
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [userIdToDelete]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
        console.error('Error deleting user by admin:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'Cannot delete user because they have associated data. Please ensure all related records are removed first.' });
        }
        res.status(500).json({ error: 'Server error deleting user.' });
    }
});

// GET Pending Contests for Admin Review
app.get('/api/admin/contests/pending', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    try {
        const [contests] = await db.execute(
            `SELECT id, user_id, title, description, prize, participants, deadline, status, difficulty, categories, datasets, evaluation, approved, created_at
             FROM contests
             WHERE approved = 0`.trim()
        );
        res.status(200).json(contests);
    } catch (error) {
        console.error('Error fetching pending contests for admin:', error);
        res.status(500).json({ message: 'Failed to fetch pending contests.' });
    }
});

// PATCH Approve/Reject Contest
app.patch('/api/admin/contests/:id/status', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    const { id } = req.params;
    const { approved } = req.body;
    try {
        const [result] = await db.execute(
            `UPDATE contests SET approved = ?, status = ? WHERE id = ?`.trim(),
            [approved ? 1 : 0, approved ? 'Active' : 'Rejected', id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contest not found.' });
        }
        res.status(200).json({ message: 'Contest status updated successfully.' });
    } catch (error) {
        console.error('Error updating contest status:', error);
        res.status(500).json({ message: 'Failed to update contest status.' });
    }
});

// GET Pending Datasets for Admin Review
app.get('/api/admin/datasets/pending', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    try {
        const [datasets] = await db.execute(
            `SELECT d.id, d.name, d.filename, d.size, d.category, d.filetype, d.downloads, d.starred, d.last_updated, d.approved, d.is_public,
                dm.description, dm.tags,
                u.first_name AS uploader_username, u.email AS uploader_email
             FROM datasets d
             LEFT JOIN dataset_metadata dm ON d.id = dm.dataset_id -- Ensure LEFT JOIN for safety
             JOIN users u ON d.user_id = u.id
             WHERE d.approved = 0`.trim()
        );
        res.status(200).json(datasets);
    } catch (error) {
        console.error('Error fetching pending datasets for admin:', error);
        res.status(500).json({ message: 'Failed to fetch pending datasets.' });
    }
});

// PATCH Approve/Reject Dataset
app.patch('/api/admin/datasets/:id/status', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    const { id } = req.params;
    const { action } = req.body;
    let newApprovedStatus;

    if (action === 'approve') {
        newApprovedStatus = 1;
    } else if (action === 'reject') {
        newApprovedStatus = 2;
    } else {
        return res.status(400).json({ message: 'Invalid action specified. Must be "approve" or "reject".' });
    }

    try {
        const [result] = await db.execute(
            `UPDATE datasets SET approved = ? WHERE id = ?`.trim(),
            [newApprovedStatus, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Dataset not found.' });
        }
        res.status(200).json({ message: `Dataset ${action}ed successfully!` });
    } catch (error) {
        console.error(`Error ${action}ing dataset status:`, error);
        res.status(500).json({ message: `Failed to ${action} dataset status.`, details: error.message });
    }
});
// DELETE Dataset (Admin)
app.delete('/api/admin/datasets/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const db = req.app.get('db');
    const { id } = req.params;
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [dataset] = await connection.execute('SELECT filename FROM datasets WHERE id = ?', [id]);
        if (dataset.length === 0) {
            return res.status(404).json({ message: 'Dataset not found.' });
        }
        const filename = dataset[0].filename;

        // Delete from dataset_metadata table first
        await connection.execute('DELETE FROM dataset_metadata WHERE dataset_id = ?', [id]);
        
        // Then delete from datasets table
        const [result] = await connection.execute('DELETE FROM datasets WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Dataset not found.' });
        }

        const filePath = path.join(__dirname, 'uploads', filename);

        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file from filesystem:', err);
                }
            });
        }
        await connection.commit();

        res.status(200).json({ message: 'Dataset and associated metadata/file deleted successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting dataset:', error);
        res.status(500).json({ message: 'Failed to delete dataset.', details: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// --- PROFILE ROUTES ---

// GET User Profile Data
app.get('/api/profile', authenticateToken, async (req, res) => {
    const db = req.app.get('db');
    try {
        const [userProfile] = await db.execute(
            `SELECT
                id, first_name, last_name, email, role, gender, national_id_passport,
                country, institution, official_work, profile_picture_url, created_at
            FROM users
            WHERE id = ?`.trim(),
            [req.user.id]
        );

        if (userProfile.length === 0) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        res.json(userProfile[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Server error fetching profile.', details: err.message });
    }
});

// UPDATE User Profile Data (General Info)
app.put('/api/profile/update', authenticateToken, async (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { first_name, last_name, gender, national_id_passport, country, institution, official_work } = req.body;

    const updates = [];
    const values = [];

    if (first_name !== undefined) { updates.push('first_name = ?'); values.push(first_name); }
    if (last_name !== undefined) { updates.push('last_name = ?'); values.push(last_name); }
    if (gender !== undefined) { updates.push('gender = ?'); values.push(gender || null); }
    if (national_id_passport !== undefined) { updates.push('national_id_passport = ?'); values.push(national_id_passport || null); }
    if (country !== undefined) { updates.push('country = ?'); values.push(country || null); }
    if (institution !== undefined) { updates.push('institution = ?'); values.push(institution || null); }
    if (official_work !== undefined) { updates.push('official_work = ?'); values.push(official_work || null); }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`.trim();
    values.push(userId);

    try {
        const [result] = await db.execute(sql, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or no changes made.' });
        }
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Error updating profile:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'National ID/Passport already exists for another user.' });
        }
        res.status(500).json({ error: 'Server error updating profile.', details: err.message });
    }
});

// UPLOAD PROFILE PICTURE
app.post('/api/profile/picture', authenticateToken, uploadProfilePicture.single('profilePicture'), async (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No profile picture file uploaded or invalid file type.' });
    }

    const newFileName = req.file.filename;
    const profilePictureUrl = `/profile_pictures/${newFileName}`;

    try {
        const [oldPicResult] = await db.execute('SELECT profile_picture_url FROM users WHERE id = ?', [userId]);
        const oldProfilePictureUrl = oldPicResult.length > 0 ? oldPicResult[0].profile_picture_url : null;

        const [result] = await db.execute(
            'UPDATE users SET profile_picture_url = ? WHERE id = ?',
            [profilePictureUrl, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found for profile picture update.' });
        }

        if (oldProfilePictureUrl && oldProfilePictureUrl !== profilePictureUrl) {
            const oldFilePath = path.join(__dirname, oldProfilePictureUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlink(oldFilePath, (err) => {
                    if (err) console.error('Error deleting old profile picture:', err);
                });
            }
        }

        res.status(200).json({
            message: 'Profile picture updated successfully!',
            profile_picture_url: profilePictureUrl
        });

    } catch (err) {
        console.error('Error updating profile picture:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Cleanup Error: Could not delete newly uploaded profile pic after DB failure:', unlinkErr);
            });
        }
        res.status(500).json({ error: 'Failed to update profile picture.', details: err.message });
    }
});


// Error handling middleware (for Multer errors)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ error: err.message });
    } else if (err) {
        console.error('Generic error:', err.message);
        return res.status(500).json({ error: err.message });
    }
    next();
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
