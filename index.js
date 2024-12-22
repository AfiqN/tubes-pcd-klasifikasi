const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const routeDashboard = require('./routes/dashboard.js');
const multer = require('multer');
const fs = require('fs');

// Inisialisasi aplikasi
const app = express();

// Middleware untuk view engine EJS
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware untuk parsing form
app.use(express.urlencoded({ extended: true }));

// Middleware untuk override method (untuk form PUT/DELETE)
app.use(methodOverride('_method'));

// Middleware untuk serving file statis
app.use(express.static(path.join(__dirname, 'public')));

// Middleware untuk session
app.use(session({
    secret: process.env.SESSION_SECRET || 'dF9!h3J7kL2pQ5R8T0vW1X4Y6Z9aBcDeFg', // Gunakan environment variable untuk keamanan
    resave: false,
    saveUninitialized: true
}));

// Konfigurasi folder untuk upload file
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware untuk menangani file upload (opsional jika hanya buffer)
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Rute utama
app.use('/', routeDashboard);

// Middleware untuk menangani error
app.use((err, req, res, next) => {
    console.error('Error stack:', err.stack);
    console.error('Error message:', err.message);
    res.status(500).send('Something broke!');
});

// Menjalankan server
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});


// Serve model files statically
app.use('/model', express.static(path.join(__dirname, 'model')));