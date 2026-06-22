const express = require('express');
const { submitSupportMessage } = require('../controllers/supportController');

const router = express.Router();

router.post('/contact', submitSupportMessage);

module.exports = router;
