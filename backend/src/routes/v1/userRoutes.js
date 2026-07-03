const express = require("express");
const router = express.Router();
const {validate} = require("../../middlewares/validation.js");
const dispatcher = require("../../middlewares/dispatcher");
const { RESOURCES, PERMS } = require("../../utils/constants");
const userController = require("../../controllers/v1/userController");
const { auth } = require("../../middlewares/auth");
const upload = require("../../middlewares/upload");
const Joi = require("joi");

//schema for user signup validation
const signupSchema = Joi.object({
  firstName: Joi.string().min(3).required(),
  lastName: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  profilePicture: Joi.string().optional(),
  phoneNo:Joi.string().required(),
  role: Joi.string().valid("ADMIN", "MEMBER", "GUEST").optional(),
}).unknown(true);
// route for user signup
router.post(
  "/signup",
  validate(signupSchema),
  (req, res, next) => dispatcher(req, res, next, userController.signupUser)
);

//schema for user login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
}).unknown(true);
// route for user login
router.post(
  "/login",
  validate(loginSchema),
  (req, res, next) => dispatcher(req, res, next, userController.loginUser)
);

//schema for get user validation
const getUserSchema = Joi.object({
  id: Joi.string().required(),
});
// route for get user by id
router.get(
  "/get/:id",
  validate(getUserSchema, "params"),
  auth,
  (req, res, next) => dispatcher(req, res, next, userController.getUser)
);

//schema for user update
const updateUserParamsSchema = Joi.object({
  id: Joi.string().required(),
});
//schema for user update
const updateUserBodySchema = Joi.object({
  firstName: Joi.string().min(3).optional(),
  lastName: Joi.string().min(3).optional(),
  email: Joi.string().email().optional(),
}).unknown(true);
//route for updating user details
router.patch("/update/details/:id", validate(updateUserParamsSchema, "params"), validate(updateUserBodySchema, "body"), auth,
       (req, res, next)=>dispatcher(req, res, next, userController.updateUser) 
);

//schema for user profile picture update
const updateUserProfilePictureSchema = Joi.object({
  id: Joi.string().required(),
});
//route for updating user profile picture
router.patch("/update/profile-picture/:id", validate(updateUserProfilePictureSchema, "params"), auth, upload.single("file"),
       (req, res, next)=>dispatcher(req, res, next, userController.updateUserProfilePicture) 
);

//schema for updating user password
const updateUserPasswordParamsSchema = Joi.object({
  id: Joi.string().required(),
});
//route for updating user password
router.patch("/update/password/:id", validate(updateUserPasswordParamsSchema, "params"), auth,
       (req, res, next)=>dispatcher(req, res, next, userController.updateUserPassword) 
);

//schema for deleting user
const deleteUserSchema = Joi.object({
  id: Joi.string().required(),
});
//route for deleting user
router.delete("/delete/:id", validate(deleteUserSchema, "params"), auth,
       (req, res, next)=>dispatcher(req, res, next, userController.deleteUser) 
);

//route for getting all users
router.get("/get-all", auth, (req, res, next) => dispatcher(req, res, next, userController.getAllUsers));

//route for delete all users
router.delete("/delete-all", auth, (req, res, next)=>dispatcher(req, res, next, userController.deleteAllUsers));

//route for finding user using phone/email/name
router.get("/search", auth, (req, res, next)=>dispatcher(req, res, next, userController.getUserBySearch));

module.exports = router;
