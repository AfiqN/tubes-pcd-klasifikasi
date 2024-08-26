const { detectNegativeContent } = require('../utils/detector');
const XLSX = require('xlsx')

module.exports.landingPage = async (req, res) => {
    res.redirect('/dashboard');
}

module.exports.processForm = async (req, res) => {
    const { listUrl, listDb } = req.body;

    const detectionResults = await detectNegativeContent(
        listUrl.split(/\r?\n/),
        listDb.split(/\r?\n/),
    );
    req.session.detectionResults = detectionResults;

    res.redirect(`/dashboard`);
}

module.exports.renderResult = async (req, res) => {
    const detectionResults = req.session.detectionResults;

    console.log(detectionResults);
    res.render('dashboard/dashboard', { results: detectionResults || [] });
}

module.exports.exportResult = async (req, res) => {
    const detectionResults = req.session.detectionResults;

    // Format data sesuai kebutuhan
    const dataForExcel = detectionResults.map(result => {
        let status = 'normal';
        if (result.error) {
            status = 'error';
        } else if (result.hasNegativeContent) {
            status = 'perjudian';
        } else if (result.hasPornoContent) {
            status = 'pornografi';
        } else if (result.redirect && !result.hasNegativeContent && !result.hasPornoContent) {
            status = 'redirect';
        }

        const keterangan = result.inDB ? 'Ada di DB' : result.error ? 'Error' : '';

        return {
            Domain: result.url,
            Jenis: 'website',
            Status: status,
            Redirect: result.redirect || '',
            Keterangan: keterangan,
        };
    });

    // Membuat Workbook dan Sheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

    // Menambahkan Sheet ke Workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Crawling');

    // Menulis file Excel ke buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Mengirimkan file sebagai respons
    res.setHeader('Content-Disposition', 'attachment; filename="hasil_crawling.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
}