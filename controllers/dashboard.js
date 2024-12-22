const path = require('path');
const fs = require('fs');
const { loadModel, classifyImage } = require('../utils/classifier');

// Daftar kelas sesuai dengan label yang diberikan
const classes = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Background_without_leaves',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
];

loadModel()
    .then(() => console.log('Model telah siap.'))
    .catch((error) => console.error('Gagal memuat model:', error));

module.exports.landingPage = async (req, res) => {
    res.redirect('/dashboard');
};

module.exports.processForm = async (req, res) => {
    const uploadedFile = req.file;
    if (!uploadedFile) {
        return res.status(400).send('File gambar tidak ditemukan');
    }

    try {
        // Path ke file gambar yang diunggah
        const imagePath = path.join(__dirname, '..', 'uploads', uploadedFile.filename);

        // Panggil fungsi klasifikasi
        const result = await classifyImage(imagePath);
        
        // Ambil label berdasarkan classIndex
        const label = classes[result.classIndex];
        const confidence = result.confidence.toFixed(2);
        console.log(label);

        // Simpan hasil ke session
        req.session.uploadedFileName = uploadedFile.filename;
        req.session.classificationResult = `Klasifikasi: ${label} (Confidence: ${confidence})`;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error saat memproses gambar:', error);
        res.status(500).send('Gagal memproses gambar.');
    }
};

module.exports.renderResult = async (req, res) => {
    // Ambil uploadedFileName & classificationResult dari session
    const uploadedFileName = req.session.uploadedFileName;
    const classificationResult = req.session.classificationResult;

    res.render('dashboard/dashboard', {
        uploadedFileName,
        classificationResult,
    });
};

module.exports.clearUploads = async (req, res) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    try {
        const files = fs.readdirSync(uploadDir);
        files.forEach((file) => {
            fs.unlinkSync(path.join(uploadDir, file));
        });
        res.status(200).send({ message: 'Semua file berhasil dihapus!' });
    } catch (error) {
        console.error('Gagal menghapus file:', error);
        res.status(500).send({ message: 'Gagal menghapus file.' });
    }
};
