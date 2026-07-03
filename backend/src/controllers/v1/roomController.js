const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const roomServices = require('../../services/v1/roomServices');

//controller for room creation
const createRoom = async(req, res, next)=>{
    try{
        const result = await roomServices.createRoom(req.body);
        return {statusCode:result.statusCode, data: result.data, message:result.message};

    }catch(error){
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);

    }
};

//controller for room deletion
const deleteRoom = async(req, res, next)=>{
    try{
        const result = await roomServices.deleteRoom(req);
        return {statusCode:result.statusCode, data: result.data, message:result.message};

    }catch(error){
        console.log(error);
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);

    }
};

//controller for room updation
const updateRoomName = async(req, res, next)=>{
    try{
        const result = await roomServices.updateRoomName(req);
        return {statusCode:result.statusCode, data: result.data, message:result.message};
    }catch(error){
        console.log(error);
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//controller for room updation
const updateRoomProfile = async(req, res, next)=>{
    try{
        const result = await roomServices.updateRoomProfile(req);
        return {statusCode:result.statusCode, data: result.data, message:result.message};
    }catch(error){
        console.log(error);
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//controller for adding members
const addMembers = async(req, res, next)=>{
    try{
        const result = await roomServices.addMembers(req);
        return {statusCode:result.statusCode, data: result.data, message:result.message};
    }catch(error){
        console.log(error);
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//controller for deleting members
const deleteMembers = async(req, res, next)=>{
    try{
        const result = await roomServices.deleteMembers(req);
        return {statusCode:result.statusCode, data: result.data, message:result.message};
    }catch(error){
        console.log(error);
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};


module.exports = {createRoom, deleteRoom, updateRoomName, updateRoomProfile, addMembers, deleteMembers};