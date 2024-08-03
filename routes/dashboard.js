const express = require('express');
const router = express.Router({mergeParams: true});
const dashboard = require('../controllers/dashboard')

router.route('/')
    .get(dashboard.landingPage);

router.route('/dashboard')
    .get(dashboard.renderResult);

module.exports = router;