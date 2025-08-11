export function sendError(res, httpStatus, errorCode, message) {
    return res.status(httpStatus).json({ errorCode, message });
}