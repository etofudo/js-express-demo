const { Projects } = require("../models/projects.model");

// Create a new project
const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;

    // Validate required fields
    if (!name || !startDate) {
      return res.status(400).json({ error: "Name and start date are required." });
    }

    // Create the project
    const project = await Projects.create({
      name,
      description: description || null,
      startDate,
      endDate: endDate || null,
      status: status || null,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project." });
  }
};

// Get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await Projects.findAll();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
};

// Get a specific project by ID
const getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Projects.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project." });
  }
};

// Update a project by ID
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, startDate, endDate, status } = req.body;

  try {
    const project = await Projects.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Update the project
    project.name = name || project.name;
    project.description = description || project.description;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;
    project.status = status || project.status;

    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project." });
  }
};

// Delete a project by ID
const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Projects.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Delete the project
    await project.destroy();
    res.status(200).json({ message: "Project deleted successfully." });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project." });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
