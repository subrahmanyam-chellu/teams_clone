const express = require("express");
const router = express.Router();
const dispatcher = require("../../middlewares/dispatcher");
const notificationController = require("../../controllers/v1/notificationController");
const { auth } = require("../../middlewares/auth");

router.get("/", auth, (req, res, next) => dispatcher(req, res, next, notificationController.getNotifications));
router.patch("/read", auth, (req, res, next) => dispatcher(req, res, next, notificationController.markAllAsRead));
router.patch("/read/:id", auth, (req, res, next) => dispatcher(req, res, next, notificationController.markAsRead));
router.delete("/", auth, (req, res, next) => dispatcher(req, res, next, notificationController.clearAllNotifications));

module.exports = router;
