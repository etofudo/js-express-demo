const { DataTypes, Model, Sequelize } = require("sequelize");
const sequelize = require("../database");
const { User } = require("./user.model");
const { Projects } = require("./projects.model");
const { Tasks } = require("./tasks.model");
const { WorkDays } = require("./work_days.model");

class Timesheets extends Model {}

Timesheets.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, 
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
    project_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "projects",
        key: "id"
      },
      allowNull: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true
    },
    contractor: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    approver: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    client: {
        type: DataTypes.STRING(100),
        allowNull: true
    },  
    description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("DRAFT", "SUBMITTED", "APPROVED"),
        allowNull: true
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn("now"),  
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn("now"),  
      allowNull: true,
      onUpdate: Sequelize.fn("now"), 
    },
  },
  {
    sequelize,
    modelName: "timesheets",
    tableName: "timesheets"
  }
);

Timesheets.belongsTo(User, {
  foreignKey: "user_id",
  targetKey: "id",
  as: "UserInfo",
});

Timesheets.hasMany(WorkDays, {  // Add relation to WorkDays
  foreignKey: "timesheet_id",
  targetKey: "id",
  as: "WorkDays",
});


Timesheets.hasOne(User, {
    foreignKey: "id",
    targetKey: "approver_id",
    as: "Approver"
});

Timesheets.belongsTo(Projects, {
  foreignKey: "project_id",
  targetKey: "id",
  as: "ProjectInfo",
});

Timesheets.hasMany(Tasks, {
  foreignKey: "timesheet_id", 
  as: "Tasks"
});

module.exports = { Timesheets };
