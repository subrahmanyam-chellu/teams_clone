const adminServices = require("../../services/v1/adminServices");

const getUsers = async (req) => {
    return await adminServices.getUsers(req);
};

const toggleBlockUser = async (req) => {
    return await adminServices.toggleBlockUser(req);
};

const deleteUser = async (req) => {
    return await adminServices.deleteUser(req);
};

const getUserActivity = async (req) => {
    return await adminServices.getUserActivity(req);
};

const getTeams = async (req) => {
    return await adminServices.getTeams(req);
};

const deleteTeam = async (req) => {
    return await adminServices.deleteTeam(req);
};

const updateTeamMembers = async (req) => {
    return await adminServices.updateTeamMembers(req);
};

const getChats = async (req) => {
    return await adminServices.getChats(req);
};

const deleteMessage = async (req) => {
    return await adminServices.deleteMessage(req);
};

const flagMessage = async (req) => {
    return await adminServices.flagMessage(req);
};

const getActiveCalls = async (req) => {
    return await adminServices.getActiveCalls(req);
};

const endActiveCall = async (req) => {
    return await adminServices.endActiveCall(req);
};

const getAnalytics = async (req) => {
    return await adminServices.getAnalytics(req);
};

const getSystemConfig = async (req) => {
    return await adminServices.getSystemConfig(req);
};

const updateSystemConfig = async (req) => {
    return await adminServices.updateSystemConfig(req);
};

const getJobs = async (req) => {
    return await adminServices.getJobs(req);
};

const runJob = async (req) => {
    return await adminServices.runJob(req);
};

const broadcastNotification = async (req) => {
    return await adminServices.broadcastNotification(req);
};

module.exports = {
    getUsers,
    toggleBlockUser,
    deleteUser,
    getUserActivity,
    getTeams,
    deleteTeam,
    updateTeamMembers,
    getChats,
    deleteMessage,
    flagMessage,
    getActiveCalls,
    endActiveCall,
    getAnalytics,
    getSystemConfig,
    updateSystemConfig,
    getJobs,
    runJob,
    broadcastNotification
};
