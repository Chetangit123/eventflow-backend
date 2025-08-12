const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController/userAuthController");
const { protect } = require("../utils/jwt");


router.post('/create-user', userController.createUser);
router.put('/verify-email-with-link', userController.verifyEmailWithLink);
router.post('/login-user', userController.loginUser);
router.get('/get-user-profile', protect, userController.getUserProfile);
router.post('/create-address', protect, userController.createAddress);

module.exports = router;
