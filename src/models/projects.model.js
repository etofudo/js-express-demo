const { DataTypes, Model, Sequelize } = require("sequelize");
const sequelize = require("../database");

class Projects extends Model {}

Projects.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    modelName: "project",
    tableName: "projects",
  }
);

module.exports = { Projects };
