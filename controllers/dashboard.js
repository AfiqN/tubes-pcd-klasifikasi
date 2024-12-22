const path = require('path');
const fs = require('fs');
const { loadModel, classifyImage } = require('../utils/classifier');
const sharp = require('sharp');

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

module.exports.clearSession = async (req, res) => {
    try {

        const uploadDir = path.join(__dirname, '..', 'uploads');

        // Hapus semua file dalam folder uploads
        const files = fs.readdirSync(uploadDir);
        files.forEach((file) => {
            fs.unlinkSync(path.join(uploadDir, file));
        });
        
        // Hapus semua data dari session
        req.session.destroy((err) => {
            if (err) {
                console.error('Gagal menghapus session:', err);
                return res.status(500).send({ message: 'Gagal menghapus session.' });
            }
            res.status(200).send({ message: 'Session berhasil dihapus.' });
        });
    } catch (error) {
        console.error('Error saat menghapus session:', error);
        res.status(500).send({ message: 'Gagal menghapus session.' });
    }

    // res.redirect('/dashboard');
};

module.exports.processForm = async (req, res) => {
    const uploadedFile = req.file;
    if (!uploadedFile) {
        return res.status(400).send('File gambar tidak ditemukan');
    }

    try {
        const imagePath = path.join(__dirname, '..', 'uploads', uploadedFile.filename);
        const result = await classifyImage(imagePath);
        const label = classes[result.classIndex].replace(/_+/g, " ").trim();
        const confidence = result.confidence.toFixed(2) * 100;

        // Baca gambar dengan sharp dan hitung histogram
        const imageBuffer = fs.readFileSync(imagePath);
        const { data, info } = await sharp(imageBuffer)
            .raw()
            .toBuffer({ resolveWithObject: true });

        const histogram = { red: Array(256).fill(0), green: Array(256).fill(0), blue: Array(256).fill(0) };

        for (let i = 0; i < data.length; i += 3) {
            histogram.red[data[i]]++;
            histogram.green[data[i + 1]]++;
            histogram.blue[data[i + 2]]++;
        }

        req.session.originalFileName = uploadedFile.originalname;
        req.session.uploadedFileName = uploadedFile.filename;
        req.session.classificationResult = [label, confidence];
        req.session.colorHistogram = histogram;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error saat memproses gambar:', error);
        res.status(500).send('Gagal memproses gambar.');
    }
};

module.exports.renderResult = async (req, res) => {
    const originalFileName = req.session.originalFileName;
    const uploadedFileName = req.session.uploadedFileName;
    const classificationResult = req.session.classificationResult;
    const colorHistogram = req.session.colorHistogram;

    res.render('dashboard/dashboard', {
        originalFileName,
        uploadedFileName,
        classificationResult,
        colorHistogram,
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
