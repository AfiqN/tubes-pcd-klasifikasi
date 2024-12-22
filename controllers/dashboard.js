const path = require('path');
const fs = require('fs');
const { loadModel, classifyImage } = require('../utils/classifier');

loadModel()
    .then(() => console.log('Model telah siap.'))
    .catch((error) => console.error('Gagal memuat model:', error));

module.exports.landingPage = async (req, res) => {
    res.redirect('/dashboard');
}

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

        // Simpan hasil ke session
        req.session.uploadedFileName = uploadedFile.filename;
        req.session.classificationResult = `Kelas ${result.classIndex} (Confidence: ${result.confidence.toFixed(2)})`;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error saat memproses gambar:', error);
        res.status(500).send('Gagal memproses gambar.');
    }
};
  
module.exports.renderResult = async (req, res) => {
    const detectionResults = req.session.detectionResults;

    // Ambil uploadedFileName & classificationResult dari session
    const uploadedFileName = req.session.uploadedFileName;
    const classificationResult = req.session.classificationResult;

    res.render('dashboard/dashboard', {
        uploadedFileName,
        classificationResult,
    });
}

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