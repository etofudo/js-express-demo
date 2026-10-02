
const { getMauticLogs, getMauticCampaigns, getMauticCampaignEmails } = require("../controllers/mautic.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const mauticRouter = require("express").Router();

mauticRouter.get("/logs", authenticateJWT, getMauticLogs);
mauticRouter.get("/campaigns", authenticateJWT, getMauticCampaigns);
mauticRouter.get("/campaign-emails", authenticateJWT, getMauticCampaignEmails);

module.exports = mauticRouter;