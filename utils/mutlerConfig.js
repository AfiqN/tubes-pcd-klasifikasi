const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder 'uploads' sudah ada atau buat jika belum
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Gunakan diskStorage, BUKAN memoryStorage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Pastikan folder benar
      cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
      // Beri nama file unik
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  });

const fileFilter = (req, file, cb) => {
// Hanya terima file yang diawali 'image/'
if (file.mimetype.startsWith('image/')) {
    cb(null, true);
} else {
    cb(new Error('Hanya file gambar yang diizinkan!'), false);
}
};
  
const upload = multer({ storage, fileFilter });
module.exports.upload = upload;
  
