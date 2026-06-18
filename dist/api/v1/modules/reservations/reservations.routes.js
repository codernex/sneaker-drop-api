"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservations_controller_1 = require("./reservations.controller");
const router = (0, express_1.Router)();
router.post("/", reservations_controller_1.createReservation);
router.get("/:id", reservations_controller_1.getReservation);
router.delete("/:id", reservations_controller_1.cancelReservationHandler);
exports.default = router;
//# sourceMappingURL=reservations.routes.js.map