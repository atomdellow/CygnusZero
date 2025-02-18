const { body, validationResult } = require('express-validator');
const { AppError } = require('./error');

const validateSource = [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL'),
  
  body('schedule')
    .matches(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/)
    .withMessage('Invalid cron schedule format'),
  
  body('contentType')
    .isIn(['article', 'news', 'research', 'blog'])
    .withMessage('Invalid content type'),
  
  body('selectors')
    .isObject()
    .withMessage('Selectors must be an object'),
  
  body('selectors.title')
    .isString()
    .notEmpty()
    .withMessage('Title selector is required'),
  
  body('selectors.content')
    .isString()
    .notEmpty()
    .withMessage('Content selector is required'),
  
  body('selectors.date')
    .isString()
    .notEmpty()
    .withMessage('Date selector is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }
    next();
  }
];

module.exports = validateSource;
