const multer = require("multer");

// const storage = multer.diskStorage({});
const upload = multer({ storage: multer.memoryStorage() });

module.exports = upload;
