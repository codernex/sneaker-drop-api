"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchases_controller_1 = require("./purchases.controller");
const router = (0, express_1.Router)();
router.post("/", purchases_controller_1.purchase);
router.get("/drop/:dropId", purchases_controller_1.getByDrop);
router.get("/user/:userId", purchases_controller_1.getByUser);
exports.default = router;
//# sourceMappingURL=purchases.routes.js.map