const express = require("express");
const router = express.Router();
const dispatcher = require("../../middlewares/dispatcher");
const meetingController = require("../../controllers/v1/meetingController");
const { auth } = require("../../middlewares/auth");

router.post("/", auth, (req, res, next) => dispatcher(req, res, next, meetingController.scheduleMeeting));
router.get("/my-meetings", auth, (req, res, next) => dispatcher(req, res, next, meetingController.getMyMeetings));
router.delete("/:id", auth, (req, res, next) => dispatcher(req, res, next, meetingController.cancelMeeting));

module.exports = router;
