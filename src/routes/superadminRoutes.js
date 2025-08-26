const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController/userAuthController");
const authController = require("../controllers/commonController/authController");
const adminManagerController = require("../controllers/adminController/adminManagerController");
const adminGatekeeperController = require("../controllers/adminController/adminGatekeeperController");
const adminProductController = require("../controllers/adminController/adminProductController");
const saleProductValidation = require("../validations/saleProductValidation");
const adminCategoryController = require("../controllers/adminController/adminCategoryController");
const { protect } = require("../utils/jwt");
const { validateBody, validateQuery } = require("../middlewares/validate");
const categoryValidation = require("../validations/categoryValidation");

//roles : superadmin, event_manager, gatekeeper

router.post('/login-admin', authController.loginUser);
router.get('/get-admin-profile', protect('superadmin', 'event_manager', 'gatekeeper'), authController.getUserProfile);
router.put('/update-admin-profile', protect('superadmin', 'event_manager', 'gatekeeper'), authController.updateUserProfile);
router.put('/change-password', protect('superadmin', 'event_manager', 'gatekeeper'), authController.changePassword);
router.post('/forget-password', authController.forgetPassowrd);
router.put('/reset-password', authController.resetPassword);

/**  Event-Manager Management Routes */

router.post('/create-event-manager', protect('superadmin'), adminManagerController.createEventManager);
router.get('/get-all-event-managers', protect('superadmin'), adminManagerController.getAllEventManagers);
router.get('/get-event-manager', protect('superadmin'), adminManagerController.getEventManager);
router.put('/block-unblock-event-manager', protect('superadmin'), adminManagerController.blockUnblockManager);
router.put('/update-event-manager', protect('superadmin'), adminManagerController.updateManagerProfile);
router.put('/delete-event-manager', protect('superadmin'), adminManagerController.deleteEventManager);
router.get('/search-event-manager', protect('superadmin'), adminManagerController.searchEventManager);

/* Gatekeeper Management Routes */
router.post('/create-gatekeeper', protect('superadmin'), adminGatekeeperController.createGatekeeper);
router.get('/get-all-gatekeepers', protect('superadmin'), adminGatekeeperController.getAllGatekeepers);
router.get('/get-gatekeeper', protect('superadmin'), adminGatekeeperController.getGatekeeper);
router.put('/block-unblock-gatekeeper', protect('superadmin'), adminGatekeeperController.blockUnblockGatekeeper);
router.put('/update-gatekeeper', protect('superadmin'), adminGatekeeperController.updateGatekeeperProfile);
router.put('/delete-gatekeeper', protect('superadmin'), adminGatekeeperController.deleteGatekeeper);
router.get('/search-gatekeeper', protect('superadmin'), adminGatekeeperController.searchGateKeeper);

/** Category Management */
router.post('/create-category', protect('superadmin'), validateBody(categoryValidation.createCategoryValidation), adminCategoryController.createCategory);
router.get('/get-categories', protect('superadmin'), adminCategoryController.getCategories);
router.get('/get-category', protect('superadmin'), validateQuery(categoryValidation.getCategoryValidation), adminCategoryController.getCategory);
router.put('/update-category', protect('superadmin'), validateBody(categoryValidation.updateCategoryValidation), adminCategoryController.updateCategory);
router.put('/delete-category', protect('superadmin'), validateBody(categoryValidation.deleteCategoryValidation), adminCategoryController.deleteCategory);

/** Product Management */

router.post('/create-product', protect('superadmin'), validateBody(saleProductValidation.createProductSchema), adminProductController.createSaleProduct);
router.get('/get-all-sale-products', protect('superadmin'), adminProductController.getAllSalesProducts);
router.get('/get-sales-product-by-id', protect('superadmin'), validateQuery(saleProductValidation.getProductByIdValidation), adminProductController.getSaleProductById);
router.put('/update-sale-product', protect('superadmin'), validateBody(saleProductValidation.updateProductValidation), adminProductController.updateSaleProduct);

module.exports = router;
