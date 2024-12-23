// utils/imageProcessor.js
const { spawn } = require('child_process');
const path = require('path');

/**
 * Process image using Python script
 * @param {string} imagePath - Path to the image file
 * @param {string} outputDir - Directory for processed images
 * @returns {Promise<string[]>} Array of processed image paths
 */
const processImage = (imagePath) => {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'preprocessingImg.py');
        console.log('Executing Python script:', pythonScript);
        const pythonProcess = spawn('python', [pythonScript, imagePath]);
        
        // Add more detailed logging
        pythonProcess.stdout.on('data', (data) => {
            console.log('Python output:', data.toString());
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error('Python error:', data.toString());
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python process failed: ${errorOutput}`));
            } else {
                resolve(processedImages);
            }
        });

        pythonProcess.on('error', (error) => {
            reject(new Error(`Failed to start Python process: ${error.message}`));
        });
    });
};

module.exports = {
    processImage
};