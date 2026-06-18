"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const router = (0, express_1.Router)();
router.post("/", users_controller_1.register);
router.get("/", users_controller_1.getUsers);
router.get("/:id", users_controller_1.getUser);
exports.default = router;
//# sourceMappingURL=users.routes.js.map