const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController/userAuthController");
const { protect } = require("../utils/jwt");


router.post('/create-user', userController.createUser);
router.put('/verify-email-with-link', userController.verifyEmailWithLink);
router.post('/login-user', userController.loginUser);
router.get('/get-user-profile', protect('user'), userController.getUserProfile);
router.put('/update-user-profile', protect('user'), userController.updateUserProfile);
router.put('/change-password', protect('user'), userController.changePassword);
router.post('/create-address', protect('user'), userController.createAddress);

module.exports = router;
