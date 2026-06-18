"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopExpiryJob = exports.startExpiryJob = void 0;
const drops_service_1 = require("../api/v1/modules/drops/drops.service");
const POLL_INTERVAL_MS = 5000;
let intervalHandle = null;
const startExpiryJob = () => {
    if (intervalHandle)
        return;
    console.log("[expiry-job] Started — polling every 5s for stale reservations");
    intervalHandle = setInterval(async () => {
        try {
            await (0, drops_service_1.expireStaleReservations)();
        }
        catch (error) {
            console.error("[expiry-job] Error during expiry sweep:", error);
        }
    }, POLL_INTERVAL_MS);
    intervalHandle.unref();
};
exports.startExpiryJob = startExpiryJob;
const stopExpiryJob = () => {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        console.log("[expiry-job] Stopped");
    }
};
exports.stopExpiryJob = stopExpiryJob;
//# sourceMappingURL=expiryJob.js.map