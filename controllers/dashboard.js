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

const applyMorphology = async (imageBuffer, operation, kernelSize = 3) => {
    const image = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });
    const width = image.info.width;
    const height = image.info.height;
    const data = image.data;

    const output = new Uint8Array(data.length);

    const applyKernel = (x, y, kernel) => {
        const values = [];
        for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
                const px = Math.min(Math.max(x + kx, 0), width - 1);
                const py = Math.min(Math.max(y + ky, 0), height - 1);
                values.push(data[py * width + px]);
            }
        }
        if (operation === 'erode') return Math.min(...values);
        if (operation === 'dilate') return Math.max(...values);
        if (operation === 'open') return Math.min(...values); // Opening is erosion followed by dilation
        if (operation === 'close') return Math.max(...values); // Closing is dilation followed by erosion
        return 0;
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            output[y * width + x] = applyKernel(x, y, operation);
        }
    }

    return sharp(Buffer.from(output), { raw: { width, height, channels: 1 } }).toBuffer();
};

module.exports.processForm = async (req, res) => {
    const uploadedFile = req.file;
    if (!uploadedFile) {
        return res.status(400).send('File gambar tidak ditemukan');
    }

    try {
        const imagePath = path.join(__dirname, '..', 'uploads', uploadedFile.filename);
        const imageBuffer = fs.readFileSync(imagePath);

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

        // Fungsi untuk konversi ke grayscale
        const convertToGrayscale = async (imageBuffer) => {
            return await sharp(imageBuffer)
                .grayscale()
                .raw()
                .toBuffer({ resolveWithObject: true });
        };

        // Fungsi untuk operasi morfologi
        const applyMorphology = async (imageBuffer, operation, kernelSize = 3) => {
            const { data, info } = imageBuffer;
            const width = info.width;
            const height = info.height;
            const output = new Uint8Array(data.length);

            const applyKernel = (x, y, kernel) => {
                const values = [];
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const px = Math.min(Math.max(x + kx, 0), width - 1);
                        const py = Math.min(Math.max(y + ky, 0), height - 1);
                        values.push(data[py * width + px]);
                    }
                }
                if (operation === 'erode') return Math.min(...values);  // Erosi
                if (operation === 'dilate') return Math.max(...values); // Dilasi
                return 0; // Default jika tidak ada operasi
            };

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    output[y * width + x] = applyKernel(x, y, operation);
                }
            }

            return {
                data: output,
                info: { width, height, channels: 1 },
            };
        };

        // Hitung histogram warna asli sebelum konversi grayscale
        const colorHistogram = await calculateHistogram(imageBuffer);

        // Konversi gambar ke grayscale
        const grayscaleImage = await convertToGrayscale(imageBuffer);

        // Dapatkan jenis operasi morfologi dari form
        const morphologyType = req.body.morphologyType;

        // Proses gambar berdasarkan operasi morfologi jika dipilih
        let processedBuffer = grayscaleImage;
        if (morphologyType) {
            processedBuffer = await applyMorphology(grayscaleImage, morphologyType);
        }

        // Simpan hasil gambar setelah proses morfologi
        const processedPath = path.join(__dirname, '..', 'uploads', `processed_${uploadedFile.filename}`);
        await sharp(Buffer.from(processedBuffer.data), {
            raw: { width: processedBuffer.info.width, height: processedBuffer.info.height, channels: 1 },
        })
            .toFormat('png')
            .toFile(processedPath);

        // Klasifikasi gambar
        const result = await classifyImage(imagePath);
        const label = classes[result.classIndex].replace(/_+/g, " ").trim();
        const confidence = result.confidence.toFixed(2) * 100;

        req.session.originalFileName = uploadedFile.originalname;
        req.session.uploadedFileName = uploadedFile.filename;
        req.session.processedImage = `processed_${uploadedFile.filename}`;
        req.session.classificationResult = [label, confidence];
        req.session.colorHistogram = colorHistogram;

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

    res.render('dashboard/dashboard', {
        originalFileName,
        uploadedFileName,
        classificationResult,
        colorHistogram,
        processedImage
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
