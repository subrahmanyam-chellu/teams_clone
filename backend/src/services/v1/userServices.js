const User = require("../../models/User");
const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../../config/cloudinary");
const upload = require("../../middlewares/upload");

// creation of user account
const createUser = async (data) => {
    try {
        let { password } = data;
        password = await bcrypt.hash(password, 12);
        data.password = password;
        const user = new User(data);
        const result = (await user.save()).toObject();
        const { password: _, ...rest } = result;
        return { statusCode: statusCodes.CREATED, data: rest, message: "user created successfully" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// login to user account
const loginUser = async (email, password) => {
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return { statusCode: statusCodes.NOT_FOUND, message: "email not found" };
        }
        if (!await bcrypt.compare(password, user.password)) {
            return { statusCode: statusCodes.UNAUTHORIZED, message: "invalid password" };
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "72h" });
        return { statusCode: statusCodes.OK, data: { user, token }, message: "login successful" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// get user by id
const getUserById = async (id, user) => {
    try {
        if (user.id == id || user.role === "ADMIN") {
            const user = await User.findById(id).lean();
            const { password, ...rest } = user;
            if (!user) {
                return { statusCode: statusCodes.NOT_FOUND, message: "user not found" };
            }
            return { statusCode: statusCodes.OK, data: rest, message: "user details fetched successfully" };
        } else {
            return { statusCode: statusCodes.FORBIDDEN, message: "access denied" };
        }
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//update user
const updateUser = async (data) => {
    try {
        const { id } = data.params;
        const user = await User.findById(id);
        if (!user) {
            return { statusCode: statusCodes.NOT_FOUND, message: "user not found" };
        }
        if (data.user.id == id || data.user.role === "ADMIN") {
            const updatedUser = await User.findByIdAndUpdate(id, data.body, { returnDocument: 'after' });
            return { statusCode: statusCodes.OK, data: updatedUser, message: "user details updated successfully" };
        }
        else {
            return { statusCode: statusCodes.FORBIDDEN, message: "access denied" };
        }
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//update user profile picture
const updateUserProfilePicture = async (req) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return { statusCode: statusCodes.NOT_FOUND, message: "User not found" };
        }

        if (req.user.id === id || req.user.role === "ADMIN") {

            if (!req.file) {
                return { statusCode: statusCodes.BAD_REQUEST, message: "No file uploaded" };
            }
            const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

            const result = await cloudinary.uploader.upload(fileStr, {
                folder: "teamsclone_profile_pics",
                public_id: `user_${id}`,
            });

            if (!result || !result.secure_url) {
                return { statusCode: statusCodes.INTERNAL_SERVER_ERROR, message: "Failed to upload image to Cloudinary" };
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { profilePicture: result.secure_url },
                { returnDocument: "after" }
            );

            return { statusCode: statusCodes.OK, data: updatedUser, message: "User profile picture updated successfully" };
        }

        return { statusCode: statusCodes.FORBIDDEN, message: "Not authorized" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//update user password
const updateUserPassword = async (req) => {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(id);

        if (!user) {
            return { statusCode: statusCodes.NOT_FOUND, message: "User not found" };
        }

        if (req.user.id === id || req.user.role === "ADMIN") {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return { statusCode: statusCodes.UNAUTHORIZED, message: "Old password is incorrect" };
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            user.password = hashedPassword;
            await user.save();
            return { statusCode: statusCodes.OK, data: user, message: "User password updated successfully" };
        }
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//delete user
const deleteUser = async (req) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return { statusCode: statusCodes.NOT_FOUND, message: "User not found" };
        }
        if (req.user.id === id || req.user.role === "ADMIN") {
            await User.findByIdAndDelete(id);
            return { statusCode: statusCodes.OK, message: "User deleted successfully" };
        }
        return { statusCode: statusCodes.FORBIDDEN, message: "Not authorized" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//get-all users
const getAllUsers = async (req, res, next) => {
    try {
        if (req.user.role === "ADMIN") {
            const result = await User.find().lean();
            const result1 = result.map((item) => {
                const { password, ...rest } = item;
                return rest;
            });
            return { statusCode: statusCodes.OK, data: result1, messages: " users fetched successfully" };
        } else {
            return { statusCode: statusCodes.FORBIDDEN, message: "Not authorized" };
        }

    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//delete all users
const deleteAllUsers = async (req, res, next) => {
    try {
        if (req.user.role === "ADMIN") {
            const result = await User.deleteMany();
            return { statusCode: statusCodes.OK, data: result, messages: "all users deleted successfully" };
        } else {
            return { statusCode: statusCodes.FORBIDDEN, message: "Not authorized" };
        }

    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//getting user by search
const getUserBySearch = async (req, res, next) => {
    try {
        const {q} = req.query;
        const query = q.trim();
        const result = await User.find({
            $or: [
                { firstName: { $regex: query, $options: "i" } },
                { lastNameName: { $regex: query, $options: "i" } },
                { phoneNo: { $regex: query, $options: "i" } },
                { email: {$regex: query, $options: "i"}}
            ]
        }).limit(20).lean();
        const result1 = result.map((item) => {
            const { password, ...rest } = item;
            return rest;
        });
        return { statusCode: statusCodes.OK, data: result1, messages: " users fetched successfully" };

    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }

};


module.exports = { createUser, loginUser, getUserById, updateUser, updateUserProfilePicture, updateUserPassword, deleteUser, getAllUsers, deleteAllUsers, getUserBySearch };