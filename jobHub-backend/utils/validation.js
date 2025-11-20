import { body } from "express-validator";

// Validation for creating a job
export const jobCreateValidation = [
  body("title").notEmpty().withMessage("Job title is required"),
  body("company").notEmpty().withMessage("Company name is required"),
  body("location").notEmpty().withMessage("Location is required"),
  body("type").notEmpty().withMessage("Job type is required"),
  body("description").notEmpty().withMessage("Job description is required"),
  body("salary")
    .optional()
    .isNumeric()
    .withMessage("Salary must be a number"),
  body("applyLink")
    .optional()
    .isURL()
    .withMessage("Apply link must be a valid URL"),
];
