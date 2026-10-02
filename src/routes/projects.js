const express = require("express");
const {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjects,
} = require("../controllers/projects.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const projectRouter = express.Router();

// Create a new project
projectRouter.post("/projects", authenticateJWT, createProject);

// Get all projects
projectRouter.get("/projects", authenticateJWT, getProjects);

// Get a specific project by ID
projectRouter.get("/projects/:id", authenticateJWT, getProjectById);

// Update a specific project by ID
projectRouter.put("/projects/:id", authenticateJWT, updateProject);

// Delete a specific project by ID
projectRouter.delete("/projects/:id", authenticateJWT, deleteProject);

module.exports = projectRouter;
