const {
  getLeads,
  getTypesWithLeadsStatus,
  getSectionsWithLeadsStatus,
  getLead,
  updateLead,
  addLinksToLead,
  createOrUpdateSocialEngagement,
  getItemNavigation,
  sendLeadsToMautic,
  getTopSectionsWithEngagementStats,
} = require("../controllers/leads.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const leadsRouter = require("express").Router();

leadsRouter.get("/leads/:type/:section", authenticateJWT, getLeads);
leadsRouter.get("/get-lead/:id", authenticateJWT, getLead);
leadsRouter.put("/lead/:id", authenticateJWT, updateLead);
leadsRouter.get("/types", authenticateJWT, getTypesWithLeadsStatus);
leadsRouter.get("/sections/:type", authenticateJWT, getSectionsWithLeadsStatus);
leadsRouter.put("/leads/add-link/:id", authenticateJWT, addLinksToLead);
leadsRouter.post("/leads/social-engagement/:id", authenticateJWT, createOrUpdateSocialEngagement);
leadsRouter.get("/lead-navigation/:lead_id", authenticateJWT, getItemNavigation);
leadsRouter.put("/leads/send/:type/:section", authenticateJWT, sendLeadsToMautic);
leadsRouter.get("/leads/engagement-stats", authenticateJWT, getTopSectionsWithEngagementStats);

module.exports = leadsRouter;