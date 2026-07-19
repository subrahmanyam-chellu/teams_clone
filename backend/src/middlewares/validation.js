// const Joi = require("joi");
// const ErrorHandler = require("../helper/ErrorHandler");
// const statusCodes = require("../helper/statusCodes");

// function validate(schema) {
//   return (req, res, next) => {
//     const { error } = schema.validate(req.body, { abortEarly: false });
//     if (error) {
//       const message = error.details.map((d) => d.message).join(", ");
//       return next(new ErrorHandler(statusCodes.BAD_REQUEST, message));
//     }
//     next();
//   };
// }

// module.exports = { validate };
const Joi = require("joi");
const ErrorHandler = require("../helper/ErrorHandler");
const { statusCodes } = require("../helper/statusCodes");

function validate(schema, property = "body") {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const message = error.details.map((d) => d.message).join(", ");
      return next(new ErrorHandler(statusCodes.BAD_REQUEST, message));
    }
    next();
  };
}

module.exports = { validate };
