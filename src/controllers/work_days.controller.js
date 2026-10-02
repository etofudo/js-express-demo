const { WorkDays } = require("../models/work_days.model");
const moment = require("moment"); // You can use moment.js for easier date manipulation

const getWorkDaysForWeek = async (req, res) => {
    try {
        const { start_date, user_id } = req.params;

        // Validate the input data
        if (!start_date || !user_id) {
            return res.status(400).json({ message: "Start date and user ID are required" });
        }

        // Validate the start_date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start_date)) {
            return res.status(400).json({ message: "Invalid start date format. Use YYYY-MM-DD" });
        }

        // Calculate the next 4 days (to complete 5 days for the week)
        const startMoment = moment(start_date, "YYYY-MM-DD");
        const endMoment = moment(startMoment).add(4, 'days'); // Add 4 days to the start_date

        // Fetch work days for the given user between the start date and end date
        const workDays = await WorkDays.findAll({
            where: {
                user_id,
                date: {
                    [Sequelize.Op.between]: [startMoment.format("YYYY-MM-DD"), endMoment.format("YYYY-MM-DD")],
                },
            },
        });

        if (workDays.length === 0) {
            return res.status(404).json({ message: "No work days found for the given week" });
        }

        // Respond with the work days for the week
        return res.status(200).json({
            message: "Work days for the week retrieved successfully",
            workDays,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const createOrUpdateWorkDay = async (req, res) => {
    try {
        const { start_time, end_time, date } = req.body;
        const { user_id } = req.params;

        if (!start_time || !end_time || !user_id || !date) {
            return res.status(400).json({ message: "Start time, end time, user ID, and date are required" });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
            return res.status(400).json({ message: "Invalid time format. Use HH:MM (24-hour format)" });
        }

        // Use upsert to create or update the work day
        const [workDay, created] = await WorkDays.upsert({
            user_id,
            date,
            start_time,
            end_time
        });

        if (created) {
            return res.status(201).json({
                message: "Work day created successfully",
                workDay
            });
        } else {
            return res.status(200).json({
                message: "Work day updated successfully",
                workDay
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { createOrUpdateWorkDay, getWorkDaysForWeek };
