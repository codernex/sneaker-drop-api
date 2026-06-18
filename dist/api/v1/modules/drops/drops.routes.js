"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drops_controller_1 = require("./drops.controller");
const router = (0, express_1.Router)();
router.get("/", drops_controller_1.getDrops);
router.get("/:id", drops_controller_1.getDropById);
router.post("/", drops_controller_1.createDrop);
exports.default = router;
//# sourceMappingURL=drops.routes.js.map