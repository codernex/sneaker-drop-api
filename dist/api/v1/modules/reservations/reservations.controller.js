"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelReservationHandler = exports.getReservation = exports.createReservation = void 0;
const zod_1 = require("zod");
const reservations_service_1 = require("./reservations.service");
const request_1 = require("../../../../lib/request");
const createReservationSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "userId is required"),
    dropId: zod_1.z.string().min(1, "dropId is required"),
});
const cancelReservationSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "userId is required"),
});
exports.createReservation = (0, request_1.requestHandler)(async (req, res) => {
    const data = await (0, reservations_service_1.reserveItem)(req.body.userId, req.body.dropId);
    return {
        res,
        message: "Item reserved successfully",
        data,
        statusCode: 201,
    };
}, { body: createReservationSchema });
exports.getReservation = (0, request_1.requestHandler)(async (req, res) => {
    const data = await (0, reservations_service_1.getReservationById)(req.params.id);
    return { res, message: "Reservation fetched successfully", data };
}, {
    params: zod_1.z.object({ id: zod_1.z.string().min(1, "Reservation ID is required") }),
});
exports.cancelReservationHandler = (0, request_1.requestHandler)(async (req, res) => {
    await (0, reservations_service_1.cancelReservation)(req.params.id, req.body.userId);
    return { res, message: "Reservation cancelled" };
}, {
    params: zod_1.z.object({ id: zod_1.z.string().min(1, "Reservation ID is required") }),
    body: cancelReservationSchema,
});
//# sourceMappingURL=reservations.controller.js.map