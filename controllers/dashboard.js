const { detectNegativeContent } = require('../utils/detector');

module.exports.landingPage = async (req, res) => {
    res.redirect('/dashboard');
}

module.exports.processForm = async (req, res) => {
    const { listUrl, listDb } = req.body;
    const result = listUrl

    const detectionResults = await detectNegativeContent(listUrl);
    
    // Proses data yang diterima dari form
    // console.log('List URL:', listUrl);
    // console.log('List DB:', listDb);
    // console.log('Detection Results:', detectionResults);
    // Lakukan sesuatu dengan data yang diterima, misalnya menyimpan ke database


    // Setelah memproses data, arahkan kembali ke halaman dashboard
    res.redirect(`/dashboard?result=${encodeURIComponent(result)}`);
    // res.redirect(`/dashboard?result=${encodeURIComponent(JSON.stringify(detectionResults))}`);
}

module.exports.renderResult = async (req, res) => {
    const result = req.query.result || '';
    res.render('dashboard/dashboard', { result })
}