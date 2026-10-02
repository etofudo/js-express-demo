const express = require("express");
const router = express.Router();
const {
  createEngagementLog,
  getAllEngagementLogs,
  getEngagementLogById,
  updateEngagementLog,
  deleteEngagementLog,
} = require("../controllers/engagementLogs.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

router.post("/engagement-logs/:lead_id", authenticateJWT, createEngagementLog);
router.get("/engagement-logs/:lead_id", authenticateJWT,getAllEngagementLogs);
router.get("/engagement-logs/log/:id", authenticateJWT,getEngagementLogById);
router.put("/engagement-logs/log/:id", authenticateJWT,updateEngagementLog);
router.delete("/engagement-logs/log/:id", authenticateJWT,deleteEngagementLog);

module.exports = router;
