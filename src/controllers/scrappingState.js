const { Logs } = require("../models/logs.model");
const { User } = require("../models/user.model");

const getScrapingState = async () => {
  try {
    const latestLog = await Logs.findOne({
      where: { type: "SCRAP" },
      order: [["createdAt", "DESC"]],
    });

    if(!latestLog) return false;
    if (latestLog && latestLog.status !== "IN_PROGRESS") {
      return false;
    }

    return true; 
  } catch (error) {
    console.error("Error fetching scraping state:", error);
    return true;
  }
};

const setScrapingState = async (user_id, description, status) => {
  await Logs.create({
    user_id,
    type: "SCRAP",
    description,
    status
  })
};

const getLatestLog = async () =>{
    try {
    const latestLog = await Logs.findOne({
      where: { type: "SCRAP" },
      order: [["createdAt", "DESC"]],
      include: {
        model: User, 
        attributes: ["firstName", "lastName"], 
      },
    });

    if(!latestLog) return null;
    return latestLog; 
  } catch (error) {
    console.error("Error fetching scraping state:", error);
    return null;
  }
}

module.exports = { getScrapingState, setScrapingState, getLatestLog };
