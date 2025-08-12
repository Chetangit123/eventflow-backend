module.exports.successRes = (res, status, success, message, data) => {
    return res.status(status).json({
        success: success,
        status: status,
        message: message,
        data: data ? data : null
    })
}
