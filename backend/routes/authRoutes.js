const express = require('express');
const router = express.Router();
// This connects the Route to the Controller file you just showed me
const authController = require('../controllers/authController');

// This tells the server: "When someone sends info to /signup, use the signup logic"
router.post('/signup', authController.signup);


//login (checks passwords)
//This tells the server that /login and /logout are now active addresses.

router.post('/login', authController.login);
router.post('/logout', authController.logout);

//makes accessible
module.exports = router;


