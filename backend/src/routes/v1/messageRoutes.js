const express = require("express");
const router = express.Router();
const {validate} = require("../../middlewares/validation.js");
const dispatcher = require("../../middlewares/dispatcher");
const { RESOURCES, PERMS } = require("../../utils/constants");
const messageController = require("../../controllers/v1/messageController");
const { auth } = require("../../middlewares/auth");
const upload = require("../../middlewares/upload");
const Joi = require("joi");

//schema for creating message
const fileSchema = Joi.object({
  originalname: Joi.string().required(),
  mimetype: Joi.string().required(),
  size: Joi.number().max(5 * 1024 * 1024).required(),
  path: Joi.string().optional()
}).unknown(true); 
const messageSchema = Joi.object({
  roomId: Joi.string().length(24).required(),
  sender: Joi.string().length(24).required(),
  receiver: Joi.string().length(24).optional(),
  content: Joi.string().trim().allow("").optional(),
  files: Joi.array().max(10).optional(), 
  // reactions: Joi.object({
  //     userId: Joi.string().length(24).required(),
  //     emoji: Joi.string().required()
  //   })
  // .optional(),
  parentMessageId: Joi.string().length(24).optional(),
  mentions: Joi.string().length(24).optional(),
//   deliveryReceipts: Joi.array().items(
//     Joi.object({
//       userId: Joi.string().length(24).required(),
//       isDelivered: Joi.boolean().default(false),
//       deliveredAt: Joi.date().optional()
//     })
//   ).optional(),
//   readReceipts: Joi.array().items(
//     Joi.object({
//       userId: Joi.string().length(24).required(),
//       isRead: Joi.boolean().default(false),
//       readAt: Joi.date().optional()
//     })
//   ).optional()
}).unknown(true);

//route for creating or sending message
router.post(
  "/send-message",
  auth,
  upload.array("files", 10),
  (req, res, next) => {
    
    if (req.files && req.files.length > 0) {
      req.body.files = req.files;
    }
    next(); 
  },
  validate(messageSchema), 
  (req, res, next) => dispatcher(req, res, next, messageController.sendMessage)
);

//schema for editing own message, admin editing any message
const editSchemaParams = Joi.object({
  id: Joi.string().length(24).required()
});
const editSchemaBody = Joi.object({
  content: Joi.string().trim().allow("").optional(),
}).unknown(true);
//route for editing message by id
router.patch("/edit-message/:id", validate(editSchemaParams, "params"), validate(editSchemaBody), auth, (req, res, next)=>dispatcher(req, res, next, messageController.editMessage));

//schema for deleting own message, admin deleting any message 
const deleteSchemaParams = Joi.object({
  id: Joi.string().length(24).required()
});
//route for deleting message by id
router.delete("/delete-message/:id", validate(deleteSchemaParams, "params"), auth, (req, res, next)=>dispatcher(req, res, next, messageController.deleteMessage));

//schema for reacting to message
const reactSchemaParams = Joi.object({
  id: Joi.string().length(24).required()
});
const reactSchemaBody = Joi.object({
  userId: Joi.string().length(24).required(),
  sender: Joi.string().length(24).optional(),
  emoji: Joi.string().required()
});
//route for reacting to message by id
router.patch("/react-message/:id", validate(reactSchemaParams, "params"), validate(reactSchemaBody), auth, (req, res, next)=>dispatcher(req, res, next, messageController.reactMessage));

//schema for getting messages by roomId
const getSchemaParams = Joi.object({
  roomId: Joi.string().length(24).required()
});
const getSchemaBody = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional()
}).unknown(true);
//route for getting messages by roomId
router.post("/get-messages/:roomId", validate(getSchemaParams, "params"), validate(getSchemaBody), auth, (req, res, next)=>dispatcher(req, res, next, messageController.getMessagesByRoomId));

//schema for getting all messages
const getSchemaBodyAll = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional()
}).unknown(true);
//route for all messages 
router.post("/get-all-messages", validate(getSchemaBodyAll), auth, (req, res, next)=>dispatcher(req, res, next, messageController.getAllMessages));

module.exports = router;