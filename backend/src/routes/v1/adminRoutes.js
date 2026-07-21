const express = require("express");
const router = express.Router();
const { auth } = require("../../middlewares/auth");
const dispatcher = require("../../middlewares/dispatcher");
const adminController = require("../../controllers/v1/adminController");

// Super Admin authorization middleware
const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Access denied. Super Admin role required." });
    }
};

// Apply auth and superAdminOnly to all admin routes
router.use(auth, superAdminOnly);

// User Management
router.get("/users", (req, res, next) => dispatcher(req, res, next, adminController.getUsers));
router.patch("/users/:id/block", (req, res, next) => dispatcher(req, res, next, adminController.toggleBlockUser));
router.delete("/users/:id", (req, res, next) => dispatcher(req, res, next, adminController.deleteUser));
router.get("/users/:id/activity", (req, res, next) => dispatcher(req, res, next, adminController.getUserActivity));

// Team Management
router.get("/teams", (req, res, next) => dispatcher(req, res, next, adminController.getTeams));
router.delete("/teams/:id", (req, res, next) => dispatcher(req, res, next, adminController.deleteTeam));
router.patch("/teams/:id/members", (req, res, next) => dispatcher(req, res, next, adminController.updateTeamMembers));

// Chat Moderation
router.get("/chats", (req, res, next) => dispatcher(req, res, next, adminController.getChats));
router.delete("/messages/:id", (req, res, next) => dispatcher(req, res, next, adminController.deleteMessage));
router.patch("/messages/:id/flag", (req, res, next) => dispatcher(req, res, next, adminController.flagMessage));

// Video Call Control
router.get("/calls/active", (req, res, next) => dispatcher(req, res, next, adminController.getActiveCalls));
router.post("/calls/:roomId/end", (req, res, next) => dispatcher(req, res, next, adminController.endActiveCall));

// Analytics & Monitoring
router.get("/analytics", (req, res, next) => dispatcher(req, res, next, adminController.getAnalytics));

// System Control
router.get("/config", (req, res, next) => dispatcher(req, res, next, adminController.getSystemConfig));
router.patch("/config", (req, res, next) => dispatcher(req, res, next, adminController.updateSystemConfig));

// Jobs Panel
router.get("/jobs", (req, res, next) => dispatcher(req, res, next, adminController.getJobs));
router.post("/jobs/:id/run", (req, res, next) => dispatcher(req, res, next, adminController.runJob));

// Notifications Broadcaster
router.post("/broadcast", (req, res, next) => dispatcher(req, res, next, adminController.broadcastNotification));

module.exports = router;
