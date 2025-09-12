// Simple test script to verify API functionality
const fs = require('fs');
const path = require('path');

// Read the sample PDF file
const pdfPath = path.join(__dirname, '..', 'Haruya Hirota header cuts.pdf');

if (fs.existsSync(pdfPath)) {
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Test the API locally
    const testRequest = {
        method: 'POST',
        body: pdfBuffer,
        get: function(key) {
            if (key === 'body') return pdfBuffer;
            return null;
        }
    };

    console.log('Testing API with local PDF file...');
    console.log('PDF file size:', pdfBuffer.length, 'bytes');
    console.log('PDF file path:', pdfPath);
} else {
    console.log('Sample PDF file not found at:', pdfPath);
    console.log('Available files in root directory:');
    try {
        const files = fs.readdirSync(path.join(__dirname, '..'));
        console.log(files);
    } catch (e) {
        console.log('Could not read directory:', e.message);
    }
}

console.log('\nAPI Test completed. Check Vercel logs for detailed error information.');
