const express = require('express');
const router = express.Router({mergeParams: true});
const dashboard = require('../controllers/dashboard');
const { upload } = require('../utils/mutlerConfig');

router.route('/')
    .get(dashboard.landingPage);

router.route('/dashboard')
    .get(dashboard.renderResult);

router.route('/submit')
    .post(upload.single('imageInput'), dashboard.processForm);

router.post('/clear-uploads', dashboard.clearUploads);

router.post('/clear-session', dashboard.clearSession);

module.exports = router;