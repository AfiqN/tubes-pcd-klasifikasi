const { upload } = require('../utils/mutlerConfig');


module.exports.landingPage = async (req, res) => {
    res.redirect('/dashboard');
}

module.exports.processForm = async (req, res) => {
    // Debug: cek apakah file terbaca
    console.log('req.file:', req.file); 
    
    const uploadedFile = req.file;
    if (!uploadedFile) {
    return res.status(400).send('File gambar tidak ditemukan');
    }

    // Simpan ke session
    req.session.uploadedFileName = uploadedFile.filename;
    req.session.classificationResult = 'Hasil Klasifikasi Dummy';

    res.redirect('/dashboard');
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