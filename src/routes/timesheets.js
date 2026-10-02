const express = require("express");
const {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheet,
  deleteTimesheet,
  getTimesheetsByDateRange,
} = require("../controllers/timesheets.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const timesheetRouter = express.Router();

timesheetRouter.post("/timesheets", authenticateJWT, createTimesheet); // Create a new timesheet
timesheetRouter.get("/timesheet", authenticateJWT, getTimesheetsByDateRange); // Get all timesheets
timesheetRouter.get("/timesheets/:id", authenticateJWT, getTimesheetById); // Get a specific timesheet by ID
timesheetRouter.put("/timesheets/:id", authenticateJWT, updateTimesheet); // Update a specific timesheet
timesheetRouter.delete("/timesheets/:id", authenticateJWT, deleteTimesheet); 


module.exports = timesheetRouter;