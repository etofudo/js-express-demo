const { Logs } = require("../models/logs.model");
const { User } = require("../models/user.model");
const { getLatestLog } = require("./scrappingState");


const getScrapStatus = async (req, res) => {
    const log = await getLatestLog();
    const state = log ? log.status === "IN_PROGRESS" : false;
    res.status(200).json({ state, log });
}

const getAllLogs = async (req, res) => {
  try {
    const { count, rows } = await Logs.findAndCountAll({
            order: [["createdAt", "DESC"]],
    });
    res.status(200).json({total: count, logs: rows});
  } catch(err) {
    console.log(err);
    res.status(500).json({message: "Internal Server Error!"});
  }
}

const getScrapLogs = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await Logs.findAndCountAll({
            where: {
                type: "SCRAP",
            },
            order: [["createdAt", "DESC"]],
            include: {
                model: User,
                attributes: ["firstName", "lastName"],
            },
            limit: limit,
            offset: offset,
        });

        res.status(200).json({
            logs: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            offset,
            currentPage: page,
            pageSize: limit,
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateLogs = async (req, res) => {
  const offset = parseInt(req.query.offset) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    await Logs.update(
      { read: true }, 
      {
        where: {
          type: "SCRAP",
          read: false
        },
        offset: parseInt(offset),
        limit: parseInt(limit),
      }
    );

    res.status(200).json({ message: "Logs updated successfully" });
  } catch (error) {
    console.error("Error updating logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchUnreadLogs = async (req, res) => {
  try {
    const count = await Logs.count({
      where: {
        type: "SCRAP",
        read: false
      }
    });
    res.status(200).json({ total: count });
  } catch (error) {
    console.error("Error fetching unread logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getScrapStatus, getScrapLogs, updateLogs, fetchUnreadLogs, getAllLogs };