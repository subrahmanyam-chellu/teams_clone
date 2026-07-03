const cloudinary = require("../config/cloudinary");
const uploadFilesToCloudinary = async (files, senderId) => {
  const uploads = files.map(async (file, index) => {
    const fileStr = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    let resourceType = "raw";
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    const cloudFile = await cloudinary.uploader.upload(fileStr, {
      folder: "teamsclone_files",
      public_id: `message_${senderId}_${Date.now()}_${index}`,
      resource_type: resourceType
    });

    return {
      url: cloudFile.secure_url,
      type: file.mimetype,
      size: file.size,
      originalname: file.originalname
    };
  });

  return Promise.all(uploads);
};

module.exports = uploadFilesToCloudinary;
