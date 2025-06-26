const bcrypt = require('bcryptjs'); // Or 'bcrypt' if that's what you installed

const passwordToHash = 'AdminP@ss1'; // <-- CHANGE THIS to your chosen password
const saltRounds = 10; // This should match the salt rounds you use in your backend registration

bcrypt.hash(passwordToHash, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed Password:', hash);
    console.log('\nUse this hashed password when inserting into your database.');
});