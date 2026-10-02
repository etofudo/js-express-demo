const { updateLogs, fetchUnreadLogs, getAllLogs } = require("../controllers/scrap_status.controller");
const { scrapeLeads, scrapeLead } = require("../controllers/scrape.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const scrapeRouter = require("express").Router();

scrapeRouter.get("/scrape/:country/:type/:section", authenticateJWT, scrapeLeads);
scrapeRouter.post("/lead", authenticateJWT, scrapeLead);
scrapeRouter.put("/update-notifications", authenticateJWT, updateLogs);
scrapeRouter.get("/unread-notifications", authenticateJWT, fetchUnreadLogs);
scrapeRouter.get("/logs", authenticateJWT, getAllLogs);

module.exports = scrapeRouter;
