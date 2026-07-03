const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const userServices = require("../../services/v1/userServices");

// controller for user signup
const signupUser = async (req, res, next) => {
  try {
    const result = await userServices.createUser(req.body);
    return { statusCode: result.statusCode, data: result.data, message: result.message };
  } catch (error) {
    return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

// controller for user login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userServices.loginUser(email, password);
    return { statusCode: result.statusCode, data: result.data, message: result.message };
    }
    catch (error) {
    return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

// controller for get user by id
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const result = await userServices.getUserById(id, user);
    return { statusCode: result.statusCode, data: result.data, message: result.message };
  } catch (error) {
    return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

//controller for update user
const updateUser = async(req, res, next)=>{
  try{
      const result = await userServices.updateUser(req);
      return {statusCode:result.statusCode, data:result.data, message:result.message};
  }catch(error){
      return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

//controller for update user profile picture
const updateUserProfilePicture = async(req, res, next)=>{
  try{
      const result = await userServices.updateUserProfilePicture(req);
      return {statusCode:result.statusCode, data:result.data, message:result.message};
  }catch(error){
      return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

//controller for update user password
const updateUserPassword = async(req, res, next)=>{
  try{
      const result = await userServices.updateUserPassword(req);
      return {statusCode:result.statusCode, data:result.data, message:result.message};
  }catch(error){
      return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

//controller for delete user by id
const deleteUser = async(req, res, next)=>{
  try{
      const result = await userServices.deleteUser(req);
      return {statusCode:result.statusCode, data:result.data, message:result.message};
  }catch(error){
      return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

//controller for get all users
const getAllUsers = async(req, res, next)=>{
  try{
    const result = await userServices.getAllUsers(req);
    return {statusCode:result.statusCode, data:result.data, message:result.message};
  }catch(error){
      return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

//controller for delete all users
const deleteAllUsers = async(req, res, next)=>{
  try{
    const result = await userServices.deleteAllUsers(req);
    return {statusCode:result.statusCode, data:result.data, message:result.message};
  }catch(error){
      return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

//controller for getting user by search
const getUserBySearch = async(req, res, next)=>{
  try{
    const result = await userServices.getUserBySearch(req);
    return {statusCode:result.statusCode, data:result.data, message:result.message};
  }catch(error){
      return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

module.exports = { signupUser, loginUser, getUser, updateUser, updateUserProfilePicture, updateUserPassword, deleteUser, getAllUsers, deleteAllUsers, getUserBySearch };
