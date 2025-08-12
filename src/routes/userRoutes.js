const express = require("express");
const router = express.Router();
const authController = require("../controllers/commonController/authController");
const userAuthController = require("../controllers/userController/userAuthController");
const { protect } = require("../utils/jwt");


router.post('/create-user', authController.createUser);
router.put('/verify-email-with-link', authController.verifyEmailWithLink);
router.post('/login-user', authController.loginUser);
router.get('/get-user-profile', protect('user'), authController.getUserProfile);
router.put('/update-user-profile', protect('user'), authController.updateUserProfile);
router.put('/change-password', protect('user'), authController.changePassword);
router.post('/create-address', protect('user'), userAuthController.createAddress);

module.exports = router;
