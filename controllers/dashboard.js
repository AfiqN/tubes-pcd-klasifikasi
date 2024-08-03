module.exports.landingPage = async (req, res) => {
    res.redirect('/dashboard');
}

module.exports.renderResult = async (req, res) => {
    res.render('dashboard/dashboard')
}