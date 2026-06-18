"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByUser = exports.getByDrop = exports.purchase = void 0;
const zod_1 = require("zod");
const purchases_service_1 = require("./purchases.service");
const request_1 = require("../../../../lib/request");
const completePurchaseSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "userId is required"),
    reservationId: zod_1.z.string().min(1, "reservationId is required"),
});
exports.purchase = (0, request_1.requestHandler)(async (req, res) => {
    const data = await (0, purchases_service_1.completePurchase)(req.body.reservationId, req.body.userId);
    return { res, message: "Purchase successful!", data, statusCode: 201 };
}, { body: completePurchaseSchema });
exports.getByDrop = (0, request_1.requestHandler)(async (req, res) => {
    const data = await (0, purchases_service_1.getPurchasesByDrop)(req.params.dropId);
    return {
        res,
        message: "Purchases fetched successfully",
        data: { purchases: data },
    };
}, {
    params: zod_1.z.object({ dropId: zod_1.z.string().min(1, "dropId is required") }),
});
exports.getByUser = (0, request_1.requestHandler)(async (req, res) => {
    const data = await (0, purchases_service_1.getPurchasesByUser)(req.params.userId);
    return {
        res,
        message: "Purchases fetched successfully",
        data: { purchases: data },
    };
}, {
    params: zod_1.z.object({ userId: zod_1.z.string().min(1, "userId is required") }),
});
//# sourceMappingURL=purchases.controller.js.map