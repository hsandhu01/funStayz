// backend/utils/validation.js
const { validationResult } = require('express-validator');

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, _res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) { 
    const errors = {};
    validationErrors
      .array()
      .forEach(error => errors[error.path] = error.msg);

    // const err = Error("Bad request.");
    // err.errors = errors;
    // err.status = 400;
    // err.title = "Bad request.";
    // next(err);

    _res.status(400).json({
      // title: 'Bad request.',
      message: 'Bad request.',
      errors: errors
    });
  }else{
    next();
  }
  // next();
};

module.exports = {
  handleValidationErrors
};