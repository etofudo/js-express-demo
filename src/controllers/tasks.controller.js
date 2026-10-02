// src/controllers/tasks.controller.js

const { Tasks } = require("../models/tasks.model");
const { Timesheets } = require("../models/timesheets.model");

// Create a new task
const createTask = async (req, res) => {
  try {
    const { task_name, description, hours, timesheet_id } = req.body;

    if(!task_name || !hours || !timesheet_id) {
      res.status(400).json({ message: "Task Name, Time and Timesheet ID is required."});
    }

    const seconds = hours * 60 * 60;

    // Check if the timesheet exists
    const timesheet = await Timesheets.findByPk(timesheet_id);
    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Create the new task
    const task = await Tasks.create({
      task_name,
      description,
      time_spent: seconds,
      timesheet_id,
    });

    return res.status(201).json({ task });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Failed to create task", error });
  }
};

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Tasks.findAll();
    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ message: "Failed to fetch tasks", error });
  }
};

// Get tasks for a specific timesheet
const getTasksByTimesheet = async (req, res) => {
  const { timesheet_id } = req.params;

  try {
    const tasks = await Tasks.findAll({
      where: { timesheet_id },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for this timesheet" });
    }

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ message: "Failed to fetch tasks", error });
  }
};

// Get a specific task by ID
const getTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Tasks.findByPk(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({ message: "Failed to fetch task", error });
  }
};

// Update a task
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { task_name, description, time_spent, timesheet_id } = req.body;

  try {
    const task = await Tasks.findByPk(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the timesheet exists
    const timesheet = await Timesheets.findByPk(timesheet_id);
    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Update the task
    task.task_name = task_name || task.task_name;
    task.description = description || task.description;
    task.time_spent = time_spent || task.time_spent;
    task.timesheet_id = timesheet_id || task.timesheet_id;

    await task.save();

    return res.status(200).json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Failed to update task", error });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Tasks.findByPk(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.destroy();
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Failed to delete task", error });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTasksByTimesheet,
  getTaskById,
  updateTask,
  deleteTask,
};
