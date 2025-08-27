const User = require("../../models/User");
const Address = require("../../models/Address");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { successRes } = require("../../utils/responseFormatter");
const { default: mongoose } = require("mongoose");

// ================= CREATE =================
exports.createAddress = catchAsync(async (req, res, next) => {
    const userId = req.userId;
    let { label, line1, line2, city, state, pincode, country, isDefault, lat, lng } = req.body;

    if (!line1 || !city || !state || !pincode) {
        return next(new AppError("line1, city, state and pincode are required", 400));
    }

    if (isDefault) {
        await Address.updateMany(
            { user: userId, isDefault: true, isDeleted: { $ne: true } },
            { $set: { isDefault: false } }
        );
    }

    const address = await Address.create({
        user: userId,
        label,
        line1,
        line2,
        city,
        state,
        pincode,
        country: country || "India",
        lat,
        lng,
        isDefault: !!isDefault
    });

    await User.findByIdAndUpdate(userId, { $push: { addresses: address._id } });

    return successRes(res, 201, true, "Address created successfully", address);
});


// ================= GET ALL =================
exports.getAllAddresses = catchAsync(async (req, res, next) => {
    const userId = req.userId;

    const addresses = await Address.find({
        user: userId,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ createdAt: -1 });

    res.status(200).json(formatResponse(200, true, "Addresses fetched", addresses));
});


// ================= GET BY ID =================
exports.getAddressById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.userId;

    const address = await Address.findOne({
        _id: id,
        user: userId,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    res.status(200).json(formatResponse(200, true, "Address fetched", address));
});


// ================= UPDATE =================
exports.updateAddress = catchAsync(async (req, res, next) => {
    const addressId = req.query.addressId;
    const userId = req.userId;
    let validAddressId = mongoose.Types.ObjectId.isValid(addressId);
    if (!validAddressId) {
        return next(new AppError("Invalid addressId", 400));
    }
    let { label, line1, line2, city, state, pincode, country, isDefault, lat, lng } = req.body;
    const address = await Address.findOne({
        _id: id,
        user: userId,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    if (isDefault) {
        await Address.updateMany(
            { user: userId, isDefault: true, isDeleted: { $ne: true } },
            { $set: { isDefault: false } }
        );
    }

    address.label = label || address.label;
    address.line1 = line1 || address.line1;
    address.line2 = line2 || address.line2;
    address.city = city || address.city;
    address.state = state || address.state;
    address.pincode = pincode || address.pincode;
    address.country = country || address.country;
    address.lat = lat ?? address.lat;
    address.lng = lng ?? address.lng;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await address.save();

    res.status(200).json(formatResponse(200, true, "Address updated successfully", address));
});


// ================= DELETE (Soft) =================
exports.deleteAddress = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.userId;

    const address = await Address.findOne({
        _id: id,
        user: userId,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    address.isDeleted = true;
    await address.save();

    res.status(200).json(formatResponse(200, true, "Address deleted successfully"));
});

