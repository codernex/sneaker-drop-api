"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = void 0;
exports.isResponseOptions = isResponseOptions;
const successResponse = ({ res, message, statusCode = 200, data, ...rest }) => {
    const response = {
        statusCode,
        success: true,
        message,
    };
    const extra = { ...rest };
    delete extra.res;
    if (data !== undefined || Object.keys(extra).length > 0) {
        response.data = { ...extra, ...data };
    }
    return res.status(statusCode).json(response);
};
exports.successResponse = successResponse;
function isResponseOptions(obj) {
    return (obj !== null &&
        obj !== undefined &&
        typeof obj === "object" &&
        "res" in obj &&
        "message" in obj &&
        typeof obj.res?.status === "function" &&
        typeof obj.message === "string");
}
//# sourceMappingURL=response.js.map