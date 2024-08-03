const express = require('express');
const router = express.Router({mergeParams: true});
const dashboard = require('../controllers/dashboard')

router.route('/')
    .get(dashboard.landingPage);

router.route('/dashboard')
    .get(dashboard.renderResult);

router.route('/submit')
    .post(dashboard.processForm);

module.exports = router;