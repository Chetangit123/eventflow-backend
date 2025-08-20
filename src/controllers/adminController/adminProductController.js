const catchAsync = require("../../utils/catchAsync");
const ProductSale = require("../../models/ProductSale");
const Category = require("../../models/Category");
const { successRes } = require("../../utils/responseFormatter");
const AppError = require("../../utils/AppError");

exports.createSaleProduct = catchAsync(async (req, res, next) => {
    let { title, category, description, tags, variants } = req.body;
    let findCategory = await Category.findOne({ _id: category });
    if (!findCategory) {
        return next(new AppError("Category not found", 404));
    }
    const product = await ProductSale.create({ title, category, description, tags, variants });
    return successRes(res, 201, true, "Product created successfully", product);
});