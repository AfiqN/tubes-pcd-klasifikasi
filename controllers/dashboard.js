const { detectNegativeContent } = require('../utils/detector');

module.exports.landingPage = async (req, res) => {
    res.redirect('/dashboard');
}

module.exports.processForm = async (req, res) => {
    const { listUrl, listDb } = req.body;

    const detectionResults = await detectNegativeContent(listUrl.split(/\r?\n/));
    req.session.detectionResults = detectionResults;

    res.redirect(`/dashboard`);
}

module.exports.renderResult = async (req, res) => {
    const detectionResults = req.session.detectionResults;

    console.log(detectionResults);
    res.render('dashboard/dashboard', { results: detectionResults || [] });
}