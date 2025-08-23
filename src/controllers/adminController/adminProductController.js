const catchAsync = require("../../utils/catchAsync");
const ProductSale = require("../../models/ProductSale");
const Category = require("../../models/Category");
const { successRes } = require("../../utils/responseFormatter");
const AppError = require("../../utils/AppError");
const QueryBuilder = require("../../services/queryBuilder");
const { mongo, default: mongoose } = require("mongoose");

exports.createSaleProduct = catchAsync(async (req, res, next) => {
    let { title, category, description, tags, variants } = req.body;
    let qb = new QueryBuilder(Category);
    let findCategory = await qb.findOne({ _id: category }).exec();
    if (!findCategory) {
        return next(new AppError("Category not found", 404));
    }
    const product = await ProductSale.create({ title, category, description, tags, variants });
    return successRes(res, 201, true, "Product created successfully", product);
});

exports.getAllSalesProducts = catchAsync(async (req, res, next) => {
    let { page = 1, limit = 10 } = req.query;
    let qb = new QueryBuilder(ProductSale);
    let products = await qb.aggregate([
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ]).exec();
    return successRes(res, 200, true, "Products retrieved successfully", products);
});

exports.getSaleProductById = catchAsync(async (req, res, next) => {
    const { productId } = req.query;
    if (!productId) return next(new AppError("Product id is required", 400));
    const qb = new QueryBuilder(ProductSale);
    const product = await qb.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(productId)
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        }
    ]).exec();
    if (!product || product.length === 0) {
        return next(new AppError("Product not found", 404));
    }
    return successRes(res, 200, true, "Product retrieved successfully", product);
});

exports.updateSaleProduct = catchAsync(async (req, res, next) => {
    const { productId } = req.body;
    if (!productId) return next(new AppError("Product id is required", 400));
    const qb = new QueryBuilder(ProductSale);
    const product = await qb.findOne({ _id: productId }).exec();
    if (!product) {
        return next(new AppError("Product not found", 404));
    }
    if (req.body.category) {
        let qb = new QueryBuilder(Category);
        let findCategory = await qb.findOne({ _id: req.body.category }).exec();
        if (!findCategory) {
            return next(new AppError("Category not found", 404));
        }
    }
    product.title = req.body.title || product.title;
    product.category = req.body.category || product.category;
    product.description = req.body.description || product.description;
    product.tags = req.body.tags || product.tags;
    product.variants = req.body.variants || product.variants;
    await product.save();
    return successRes(res, 200, true, "Product updated successfully", product);
});