import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // return first error messages array
    return res.status(400).json({ errors: errors.array().map(e => ({ param: e.param, msg: e.msg })) });
  }
  next();
};
