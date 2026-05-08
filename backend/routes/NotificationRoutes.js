const express = require("express");
const { listNotifications, markAsRead } = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

//feature13
router.get("/", requireAuth, listNotifications);
router.put("/:id/read", requireAuth, markAsRead);

module.exports = router;
