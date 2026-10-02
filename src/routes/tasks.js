const express = require("express");
const {
  createTask,
  getAllTasks,
  getTasksByTimesheet,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/tasks.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const taskRouter = express.Router();

// Create a new task
taskRouter.post("/tasks", authenticateJWT, createTask);

// Get all tasks
taskRouter.get("/tasks", authenticateJWT, getAllTasks);

// Get tasks by timesheet ID
taskRouter.get("/tasks/timesheet/:timesheet_id", authenticateJWT, getTasksByTimesheet);

// Get a specific task by ID
taskRouter.get("/tasks/:id", authenticateJWT, getTaskById);

// Update a specific task by ID
taskRouter.put("/tasks/:id", authenticateJWT, updateTask);

// Delete a specific task by ID
taskRouter.delete("/tasks/:id", authenticateJWT, deleteTask);

module.exports = taskRouter;
