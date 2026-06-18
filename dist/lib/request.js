"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestHandler = void 0;
const response_1 = require("./response");
const requestHandler = (handler, config) => {
    return async (req, res, next) => {
        if (config?.query) {
            const result = config.query.safeParse(req.query);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    statusCode: 400,
                    errors: result.error.flatten().fieldErrors,
                });
                return;
            }
            req.query = result.data;
        }
        if (config?.body) {
            const result = config.body.safeParse(req.body);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    statusCode: 400,
                    errors: result.error.flatten().fieldErrors,
                });
                return;
            }
            req.body = result.data;
        }
        if (config?.params) {
            const result = config.params.safeParse(req.params);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    statusCode: 400,
                    errors: result.error.flatten().fieldErrors,
                });
                return;
            }
            req.params = result.data;
        }
        try {
            const result = await Promise.resolve(handler(req, res, next));
            if ((0, response_1.isResponseOptions)(result)) {
                const { res: customRes, message, statusCode = 200, data, ...rest } = result;
                delete rest.res;
                (0, response_1.successResponse)({ res: customRes, message, statusCode, data, ...rest });
            }
        }
        catch (err) {
            next(err);
        }
    };
};
exports.requestHandler = requestHandler;
//# sourceMappingURL=request.js.map