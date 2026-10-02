// src/models/tasks.model.js

const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database");

class Tasks extends Model {}

Tasks.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    task_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    time_spent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timesheet_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "timesheets", // Name of the timesheet model
        key: "id",
      },
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.fn("now"),
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.fn("now"),
      allowNull: true,
      onUpdate: sequelize.fn("now"),
    },
  },
  {
    sequelize,
    modelName: "tasks",
    tableName: "tasks",
  }
);

module.exports = { Tasks };
