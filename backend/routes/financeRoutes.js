const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

router.post('/log-entry', financeController.logEntry);     // Feature 15
router.get('/activity-log', financeController.getLogs);    // Feature 15
router.put('/update-rate', financeController.updateRate);  // Feature 17

module.exports = router;
