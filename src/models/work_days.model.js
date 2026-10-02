const { Model, DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../database");
const { Timesheets } = require("./timesheets.model");
const { User } = require("./user.model");

class WorkDays extends Model {}

WorkDays.init({
    start_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    timesheet_id: {  // Link WorkDay to Timesheet
        type: DataTypes.INTEGER,
        references: {
            model: "timesheets",
            key: "id",
        },
        allowNull: false,
    },
}, {
    modelName: "work_days",
    tableName: "work_days",
    sequelize,
    indexes: [
        {
            unique: true,
            fields: ['date'],
        },
    ],
});

module.exports = { WorkDays };
