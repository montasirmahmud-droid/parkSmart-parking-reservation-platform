const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

router.get('/revenue-report', financeController.getRevenueReport); //Feature 9
router.post('/preview-entry', financeController.previewEntry);
router.post('/log-entry', financeController.logEntry);     // Feature 15
router.get('/activity-log', financeController.getLogs);    // Feature 15
router.put('/update-rate', financeController.updateRate);  // Feature 17

router.put('/handle-exit', financeController.handleExit);

router.get('/receipt/:id', financeController.getReceipt);

router.delete('/cancel-entry', financeController.cancelEntry);

module.exports = router;
