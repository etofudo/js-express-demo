const fs = require('fs');
const path = require('path');
const { ServerCpuUsage } = require('../models/server_cpu_usage.model');
const { Sequelize } = require('sequelize');

// Define the path to your memory usage log file
const filePath = '/memory_usage/vmstat_cpu_mem.txt';

const getUsageStats = async (req, res) => {
  try {
    // Destructure the start_date and end_date from query params
    const { start_date, end_date } = req.query;

    // Convert start_date and end_date to Date objects
    const startDate = start_date ? new Date(start_date) : null;
    const endDate = end_date ? new Date(end_date) : null;

    // Validate if dates are valid
    if (startDate && isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Invalid start_date format" });
    }
    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid end_date format" });
    }

    // Build where conditions based on the provided dates
    const whereConditions = {};

    // If start_date exists, filter records greater than or equal to start_date
    if (startDate) {
      whereConditions.createdAt = { [Sequelize.Op.gte]: startDate };
    }

    // If end_date exists, filter records less than or equal to end_date
    if (endDate) {
      whereConditions.createdAt = whereConditions.createdAt
        ? { ...whereConditions.createdAt, [Sequelize.Op.lte]: endDate }
        : { [Sequelize.Op.lte]: endDate };
    }

    // Fetch data from the database
    const stats = await ServerCpuUsage.findAll({
      where: whereConditions,  
      order: [["createdAt", "DESC"]],  
    });

    // Send the result as a response
    res.status(200).json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { getUsageStats };