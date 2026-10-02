const { getPopulatedSections } = require("../controllers/sections.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const sectionsRouter = require("express").Router();

sectionsRouter.get("/most-populated-sections", authenticateJWT, getPopulatedSections);

module.exports = sectionsRouter;