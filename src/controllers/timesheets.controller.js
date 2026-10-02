
const { Op, Sequelize } = require("sequelize");
const { Projects } = require("../models/projects.model");
const { Timesheets } = require("../models/timesheets.model");
const { User } = require("../models/user.model");
const moment = require("moment");
const { WorkDays } = require("../models/work_days.model");
// Create a new timesheet
const createTimesheet = async (req, res) => {
  try {
    const {
      user_id,
      status,
      startDate,
      endDate,
      workDays, 
    } = req.body;

    if(status === "APPROVED") res.status(400).json({ message: "Timesheet can only be approved by Admin or the Approver!"});

    // Check if a timesheet exists for the user in the specified date range
    const [existingTimesheet] = await Timesheets.findAll({
      where: {
        user_id,
        date: {
              [Op.gte]: moment(new Date(startDate)).startOf('day').toDate(),  
              [Op.lte]: moment(new Date(endDate)).startOf('day').toDate(), 
        },
      },
    });

    let timesheet;

    if (existingTimesheet) {
      // If a timesheet exists, update it and its associated work days
      timesheet = existingTimesheet;
      await WorkDays.destroy({
        where: {
          timesheet_id: timesheet.id,
        },
      });

      // Reinsert work days for the new date range
      const workDayPromises = workDays.map((workDay) => {
        return WorkDays.create({
          timesheet_id: timesheet.id,
          date: workDay.date,
          start_time: workDay.start_time,
          end_time: workDay.end_time,
        });
      });
      await Promise.all(workDayPromises);

      console.log(status, timesheet.status);
      if(status !== timesheet.status) {
        await timesheet.update({status});
      }

      return res.status(200).json({
        message: "Timesheet updated successfully",
        data: timesheet,
      });
    } else {
      // If no timesheet exists, create a new one
      timesheet = await Timesheets.create({
        user_id,
        date: moment(startDate).toDate(),
        status,
      });

      // Create new work days for the new timesheet
      const workDayPromises = workDays.map((workDay) => {
        return WorkDays.create({
          timesheet_id: timesheet.id,
          date: workDay.date,
          start_time: workDay.start_time,
          end_time: workDay.end_time,
        });
      });

      await Promise.all(workDayPromises);

      return res.status(201).json({
        message: "Timesheet created successfully",
        data: timesheet,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error creating or updating timesheet",
      error: error.message,
    });
  }
};
// Get all timesheets (you can paginate, filter, or modify as needed)
const getAllTimesheets = async (req, res) => {
  try {
    const timesheets = await Timesheets.findAll({
      include: [
        {
          model: User,
          as: "UserInfo",
          attributes: ["id", "firstName", "lastName", "email"], // You can adjust this based on needed user info
        },
        {
          model: User,
          as: "Approver",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Projects,
          as: "ProjectInfo",
          attributes: ["name", "status", "startDate"]
        }
      ],
    });

    return res.status(200).json({
      message: "Timesheets retrieved successfully",
      data: timesheets,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error retrieving timesheets",
      error: error.message,
    });
  }
};

// Get a specific timesheet by ID
const getTimesheetById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const timesheet = await Timesheets.findByPk(id, {
      include: [
        {
          model: User,
          as: "UserInfo",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "Approver",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!timesheet) {
      return res.status(404).json({
        message: `Timesheet with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      message: "Timesheet retrieved successfully",
      data: timesheet,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error retrieving timesheet",
      error: error.message,
    });
  }
};

// Update an existing timesheet
const updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contractor,
      approver,
      client,
      description,
      rate,
      quantity,
      units,
      status,
    } = req.body;

    const timesheet = await Timesheets.findByPk(id);
    
    if (!timesheet) {
      return res.status(404).json({
        message: `Timesheet with ID ${id} not found`,
      });
    }

    await timesheet.update({
      contractor,
      approver,
      client,
      description,
      rate,
      quantity,
      units,
      status,
    });

    return res.status(200).json({
      message: "Timesheet updated successfully",
      data: timesheet,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error updating timesheet",
      error: error.message,
    });
  }
};

// Delete a timesheet
const deleteTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const timesheet = await Timesheets.findByPk(id);
    
    if (!timesheet) {
      return res.status(404).json({
        message: `Timesheet with ID ${id} not found`,
      });
    }

    await timesheet.destroy();

    return res.status(200).json({
      message: "Timesheet deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error deleting timesheet",
      error: error.message,
    });
  }
};

const getTimesheetsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;  

    // Validate date format (ensure they are valid dates)
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate and endDate are required",
      });
    }

    // Parse and adjust the start and end dates
    const start = moment(startDate).startOf('day');  // Ensure we compare the start of the day
    const end = moment(endDate).endOf('day');  // Ensure we compare the end of the day

    // Get the timesheet(s) with associated WorkDays filtered by the date range
    const [timesheet] = await Timesheets.findAll({
      where: {
            date: {
              [Op.gte]: start.toDate(),  
              [Op.lte]: end.toDate(), 
            },
          },
      include: [
        {
          model: User,
          as: "UserInfo",
          attributes: ["id", "firstName", "lastName", "email"], // User info for the timesheet user
        },
        {
          model: User,
          as: "Approver",
          attributes: ["id", "firstName", "lastName", "email"], // Approver info
        },
        {
          model: Projects,
          as: "ProjectInfo",
          attributes: ["name", "status", "startDate"], // Project info related to the timesheet
        },
        {
          model: WorkDays,
          as: "WorkDays", 
          attributes: ["start_time", "end_time", "date"], 
        }
      ],
    });

    // If no timesheets are found within the date range
    if (!timesheet) {
      return res.status(404).json({
        message: `No timesheets found for the provided date range (${startDate} - ${endDate})`,
      });
    }

    return res.status(200).json({
      message: "Timesheets and work days retrieved successfully",
      timesheet: timesheet,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error retrieving timesheets by date range",
      error: error.message,
    });
  }
};

module.exports = {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheet,
  deleteTimesheet,
  getTimesheetsByDateRange
};