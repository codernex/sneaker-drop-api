"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDrop = exports.getDropById = exports.getDrops = void 0;
const zod_1 = require("zod");
const drops_service_1 = require("./drops.service");
const request_1 = require("../../../../lib/request");
const createDropSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(120),
    description: zod_1.z.string().max(500).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    totalStock: zod_1.z.number().int().positive("Stock must be a positive integer"),
    price: zod_1.z.number().positive("Price must be positive"),
    startsAt: zod_1.z.string().datetime({ message: "startsAt must be ISO 8601" }),
    endsAt: zod_1.z.string().datetime().optional(),
});
exports.getDrops = (0, request_1.requestHandler)(async (_req, res) => {
    const data = await (0, drops_service_1.getAllDrops)();
    return { res, message: "Drops fetched successfully", data: { drops: data } };
});
exports.getDropById = (0, request_1.requestHandler)(async (req, res) => {
    const data = await (0, drops_service_1.getDropByIdWithPurchasers)(req.params.id);
    return { res, message: "Drop fetched successfully", data: { drop: data } };
}, {
    params: zod_1.z.object({ id: zod_1.z.string().min(1, "Drop ID is required") }),
});
exports.createDrop = (0, request_1.requestHandler)(async (req, res) => {
    const drop = await (0, drops_service_1.initializeDrop)(req.body);
    return {
        success: true,
        message: "Drop created successfully",
        data: drop,
        res,
        statusCode: 201,
    };
}, { body: createDropSchema });
//# sourceMappingURL=drops.controller.js.map