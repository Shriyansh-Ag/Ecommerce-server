export const errorMiddleware = (err, req, res, next) => {
    err.message || (err.message = "internal server error");
    err.statusCode || (err.statusCode = 500);
    if (err.name === "CastError")
        err.message = "Invalid Id";
    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};
export const TryCatch = (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch((next) => {
    });
};
