const tf = require('@tensorflow/tfjs');
const path = require('path');
const fs = require('fs');
const jpeg = require('jpeg-js');
const PNG = require('pngjs').PNG;

/**
 * Custom IOHandler untuk memuat GraphModel dari file sistem
 */
class FileHandler {
  constructor(modelPath) {
    this.modelPath = modelPath;
    this.modelDir = path.dirname(modelPath);
  }

  async load() {
    try {
      // Baca model.json
      const modelJSON = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
      
      // Baca weight files
      const weightData = [];
      if (modelJSON.weightsManifest) {
        for (const group of modelJSON.weightsManifest) {
          for (const weightPath of group.paths) {
            // Gabungkan path dengan directory model
            const weightsPath = path.join(this.modelDir, weightPath);
            const buffer = fs.readFileSync(weightsPath);
            weightData.push(new Uint8Array(buffer));
          }
        }
      }

      return {
        modelTopology: modelJSON.modelTopology,
        weightSpecs: modelJSON.weightsManifest[0].weights,
        weightData: Buffer.concat(weightData)
      };
    } catch (error) {
      console.error('Error dalam FileHandler.load():', error);
      throw error;
    }
  }
}

let model;

const loadModel = async () => {
  try {
    const modelPath = path.join(__dirname, '..', 'model', 'model.json');
    
    // Gunakan tf.loadGraphModel dengan custom IOHandler
    model = await tf.loadGraphModel({
      load: async () => {
        const handler = new FileHandler(modelPath);
        return handler.load();
      }
    });

    console.log('Model berhasil dimuat.');
    // console.log(model);
    return model;

  } catch (error) {
    console.error('Gagal memuat model:', error);
    throw error;
  }
};

/**
 * Fungsi pembantu untuk membaca file JPG
 */
function decodeImageToTensor(filePath) {
  const imageData = fs.readFileSync(filePath);
  const fileExtension = path.extname(filePath).toLowerCase();
  
  let width, height, data;

  if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
    // Decode JPEG
    const jpegData = jpeg.decode(imageData, { useTArray: true });
    width = jpegData.width;
    height = jpegData.height;
    data = jpegData.data;
  } 
  else if (fileExtension === '.png') {
    // Decode PNG
    const png = PNG.sync.read(imageData);
    width = png.width;
    height = png.height;
    data = new Uint8Array(png.data);
  } 
  else {
    throw new Error('Format gambar tidak didukung. Gunakan JPEG atau PNG.');
  }

  // Buat tensor [height, width, 4]
  let imgTensor = tf.tensor3d(data, [height, width, 4], 'int32');

  // Hilangkan channel alpha (A), ambil hanya RGB => [height, width, 3]
  imgTensor = tf.slice(imgTensor, [0, 0, 0], [-1, -1, 3]);

  // Resize jadi [224, 224]
  imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224]);

  // Tambahkan dimensi batch => [1, 224, 224, 3]
  return imgTensor.expandDims();
}

const classifyImage = async (imagePath) => {
  if (!model) {
    throw new Error('Model belum dimuat.');
  }

  let inputTensor;
  try {
    inputTensor = decodeImageToTensor(imagePath);  // Gunakan fungsi baru
    const prediction = await model.predict(inputTensor);
    const predictionArray = await prediction.data();
    
    const highestIndex = predictionArray.indexOf(Math.max(...predictionArray));
    const confidence = Math.max(...predictionArray);

    return {
      classIndex: highestIndex,
      confidence: confidence,
    };
  } catch (error) {
    console.error('Error saat melakukan klasifikasi:', error);
    throw error;
  } finally {
    if (inputTensor) {
      inputTensor.dispose();
    }
  }
};

module.exports = {
  loadModel,
  classifyImage,
};