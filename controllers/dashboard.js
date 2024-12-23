const path = require('path');
const fs = require('fs');
const { loadModel, classifyImage } = require('../utils/classifier');
const sharp = require('sharp');
const { exec } = require('child_process');

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

const applyMorphology = async (imagePath, operation) => {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '..', 'utils', 'imageProcessor.py');
        const command = `python "${pythonScript}" "${imagePath}" "${operation}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`Python script stderr: ${stderr}`);
                return reject(new Error(stderr));
            }
            
            const outputPath = stdout.trim();
            resolve(outputPath);
        });
    });
};

// Fungsi untuk menghitung histogram warna
const calculateHistogram = async (imageBuffer) => {
    const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

    const histogram = { red: Array(256).fill(0), green: Array(256).fill(0), blue: Array(256).fill(0) };

    for (let i = 0; i < data.length; i += 3) {
        histogram.red[data[i]]++;
        histogram.green[data[i + 1]]++;
        histogram.blue[data[i + 2]]++;
    }

    return histogram;
};


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
        const imageBuffer = fs.readFileSync(imagePath);
        const results = {};

        const colorHistogram = await calculateHistogram(imageBuffer);
    
        // Konversi ke grayscale
        const grayscaleImage = await sharp(imageBuffer).grayscale().toBuffer();
        const grayscalePath = path.join(__dirname, '..', 'uploads', `grayscale_${uploadedFile.filename}`);
        await sharp(grayscaleImage).toFile(grayscalePath);
        results.grayscale = `grayscale_${uploadedFile.filename}`;

        // Apply morphological operations
        try {
            const [dilatePath, erodePath, openPath, closePath, hitormiss] = await Promise.all([
                applyMorphology(imagePath, 'dilate'),
                applyMorphology(imagePath, 'erode'),
                applyMorphology(imagePath, 'open'),
                applyMorphology(imagePath, 'close'),
                applyMorphology(imagePath, 'hitormiss')
            ]);

            results.dilate = path.basename(dilatePath);
            results.erode = path.basename(erodePath);
            results.open = path.basename(openPath);
            results.close = path.basename(closePath);
            results.hitormiss = path.basename(hitormiss);
        } catch (morphologyError) {
            console.error('Error in morphological operations:', morphologyError);
            return res.status(500).send('Gagal dalam operasi morfologi');
        }
        
        // Klasifikasi gambar
        const result = await classifyImage(imagePath);
        const label = classes[result.classIndex].replace(/_+/g, " ").trim();
        const confidence = result.confidence.toFixed(2) * 100;



        req.session.originalFileName = uploadedFile.originalname;
        req.session.uploadedFileName = uploadedFile.filename;
        req.session.processedImage = `processed_${uploadedFile.filename}`;
        req.session.classificationResult = [label, confidence];
        req.session.colorHistogram = colorHistogram;
        req.session.results = results;

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
    const processedImage = req.session.processedImage;
    const results = req.session.results;

    res.render('dashboard/dashboard', {
        originalFileName,
        uploadedFileName,
        classificationResult,
        colorHistogram,
        processedImage,
        results,
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
