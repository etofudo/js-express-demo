const { createOrUpdateWorkDay, getWorkDaysForWeek } = require("../controllers/work_days.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");
const express = require("express");

const workDaysRouter = express.Router();

workDaysRouter.get("/work-days/:start_date/:user_id", authenticateJWT, getWorkDaysForWeek);
workDaysRouter.post("/work-days/:user_id", authenticateJWT, createOrUpdateWorkDay);

module.exports = workDaysRouter;