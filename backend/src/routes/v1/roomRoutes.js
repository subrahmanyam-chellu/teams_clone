const express = require("express");
const router = express.Router();
const {validate} = require("../../middlewares/validation.js");
const dispatcher = require("../../middlewares/dispatcher");
const { RESOURCES, PERMS } = require("../../utils/constants");
const roomController = require("../../controllers/v1/roomController");
const { auth } = require("../../middlewares/auth");
const upload = require("../../middlewares/upload");
const Joi = require("joi");

//schema for room creation route
const roomSchema = Joi.object({
    roomProfile: Joi.string().optional(),
    roomName: Joi.string().min(3).required(),
    roomType: Joi.string().required(),
    members: Joi.array().min(2).required(),
    lastMessage: Joi.object().optional()
}).unknown(true);
//route for room creation
router.post("/create-room", validate(roomSchema), auth, (req, res, next)=>dispatcher(req, res, next, roomController.createRoom));

//route for getting user rooms
router.get("/my-rooms", auth, (req, res, next)=>dispatcher(req, res, next, roomController.getMyRooms));

//schema for deleting room
const deleteSchema = Joi.object({
    id: Joi.string().required()
});
//route for deleting room by id
router.delete("/delete-room/:id", validate(deleteSchema, "params"), auth, (req, res, next)=>dispatcher(req, res, next, roomController.deleteRoom));

//schema for updating room
const nameSchemaParams = Joi.object({
    id: Joi.string().required()
});
const nameSchemaBody = Joi.object({
    roomName: Joi.string().min(3).required()
}).unknown(true);
//route for updating room by id
router.patch("/update-room-name/:id", validate(nameSchemaParams, "params"), validate(nameSchemaBody), auth, (req, res, next)=>dispatcher(req, res, next, roomController.updateRoomName));

//schema for updating room
const profileSchemaParams = Joi.object({
    id: Joi.string().required()
});
//route for updating room by id
router.patch("/update-room-profile/:id", upload.single("file"), validate(profileSchemaParams, "params"), auth, (req, res, next)=>dispatcher(req, res, next, roomController.updateRoomProfile));

//schema for updating room
const addSchemaParams = Joi.object({
    id: Joi.string().required()
});
const addSchemaBody = Joi.object({
    members: Joi.array().min(1).required()
}).unknown(true);
//route for updating room by id
router.patch("/add-members/:id", validate(addSchemaParams, "params"), validate(addSchemaBody), auth, (req, res, next)=>dispatcher(req, res, next, roomController.addMembers));

//schema for updating room
const deleteSchemaParams = Joi.object({
    id: Joi.string().required()
});
const deleteSchemaBody = Joi.object({
    members: Joi.array().min(1).required()
}).unknown(true);
//route for updating room by id
router.patch("/delete-members/:id", validate(deleteSchemaParams, "params"), validate(deleteSchemaBody), auth, (req, res, next)=>dispatcher(req, res, next, roomController.deleteMembers));

//route for getting invite code
router.get("/invite-code/:id", auth, (req, res, next)=>dispatcher(req, res, next, roomController.getInviteCode));

//route for joining room by invite code
router.post("/join/:inviteCode", auth, (req, res, next)=>dispatcher(req, res, next, roomController.joinByInviteCode));

module.exports = router;