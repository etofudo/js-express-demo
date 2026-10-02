const { EngagementLogs } = require("../models/engagement_logs.model");
const { Leads } = require("../models/leads.model");


const createEngagementLog = async (req, res) => {
  try {
    const { platform, dateCompleted: date_completed, description } = req.body;
    const { id: user_id } = req.user;
    const { lead_id } = req.params;

    // const log = await EngagementLogs.findOne({
    //   where: {
    //     lead_id,
    //     platform
    //   }
    // });
    
    // if(log) {
    //   res.status(400).json({ message: "A log for the provided platform already exists for this lead!"});
    //   return;
    // }

    const engagementLog = await EngagementLogs.create({
      platform,
      date_completed,
      description,
      user_id,
      lead_id
    });

    res.status(201).json({
      message: "Engagement log created successfully",
      engagementLog,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// GET all engagement logs
const getAllEngagementLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const userSpecific = req.query.only_user || false;
    const { lead_id } = req.params;
    const condition = { };

    if(userSpecific) {
      condition.user_id = req.user.id;
    } else {
      condition.lead_id = lead_id;
    }

    if(condition.lead_id) {
      const lead = await Leads.findByPk(lead_id);
      if(!lead) res.status(404).json({message: "lead not found!"});
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await EngagementLogs.findAndCountAll({
      include: "user",
      limit: limit,    
      offset: offset, 
      where: condition,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      message: "Engagement logs retrieved successfully",
      engagementLogs: rows,
      page: parseInt(page, 10),
      totalPages: totalPages,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error retrieving engagement logs",
      error: error.message,
    });
  }
};

// GET a single engagement log by ID
const getEngagementLogById = async (req, res) => {
  const { id } = req.params;

  try {
    const engagementLog = await EngagementLogs.findByPk(id, {
      include: "user", 
    });

    if (!engagementLog) {
      return res.status(404).json({
        message: `Engagement log with ID ${id} not found`,
      });
    }

    res.status(200).json({
      message: "Engagement log retrieved successfully",
      engagementLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error retrieving engagement log",
      error: error.message,
    });
  }
};

// UPDATE an existing engagement log by ID
const updateEngagementLog = async (req, res) => {
  const { id } = req.params;
  const { platform } = req.body;
  const { id: user_id } = req.user;

  try {
    const [updated] = await EngagementLogs.update(
      { platform, user_id },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        message: `Engagement log with ID ${id} not found`,
      });
    }

    const updatedEngagementLog = await EngagementLogs.findByPk(id);
    res.status(200).json({
      message: "Engagement log updated successfully",
      engagementLog: updatedEngagementLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating engagement log",
      error: error.message,
    });
  }
};

// DELETE an engagement log by ID
const deleteEngagementLog = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await EngagementLogs.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({
        message: `Engagement log with ID ${id} not found`,
      });
    }

    res.status(200).json({
      message: "Engagement log deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting engagement log",
      error: error.message,
    });
  }
};

module.exports = {
  createEngagementLog,
  getAllEngagementLogs,
  getEngagementLogById,
  updateEngagementLog,
  deleteEngagementLog,
};
