const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const messageServices = require("../../services/v1/messageServices");

//controller for sending messages
const sendMessage = async(req, res, next)=>{
    try{
        const result = await messageServices.sendMessage(req);
        if (result.statusCode === 201 && result.data) {
            const populated = await result.data.populate("sender", "firstName lastName email profilePicture");
            req.io.to(result.data.roomId.toString()).emit("receiveMessage", populated);
        }
        return {statusCode: result.statusCode, data: result.data, message:result.message};
    }catch(error){
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//controller for editing messages
const editMessage = async(req, res, next)=>{
    try{
        const result = await messageServices.editMessage(req);
        return {statusCode: result.statusCode, data: result.data, message:result.message};
    }catch(error){
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//controller for deleting messages
const deleteMessage = async(req, res, next)=>{
    try{
        const result = await messageServices.deleteMessage(req);
        return {statusCode: result.statusCode, data: result.data, message:result.message};
    }catch(error){
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//controller for reacting to messages
const reactMessage = async(req, res, next)=>{
    try{
        const result = await messageServices.reactMessage(req);
        return {statusCode: result.statusCode, data: result.data, message:result.message};
    }catch(error){
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//controller for getting messages for a room
const getMessagesByRoomId = async(req, res, next)=>{
    try{
        const result = await messageServices.getMessagesByRoomId(req);
        return {statusCode: result.statusCode, data: result.data, message:result.message};
    }catch(error){
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//controller for getting all messages
const getAllMessages = async(req, res, next)=>{
    try{
        const result = await messageServices.getAllMessages(req);
        return {statusCode: result.statusCode, data: result.data, message:result.message};
    }catch(error){
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

module.exports = {sendMessage, editMessage, getMessagesByRoomId, deleteMessage, reactMessage, getAllMessages};