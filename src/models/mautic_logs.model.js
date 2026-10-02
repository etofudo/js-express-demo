const { Model, DataTypes } = require("sequelize");
const { Section } = require("./sections.model");
const sequelize = require("../database");

class MauticLogs extends Model {}

MauticLogs.init(
  {
    section: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Section,
        key: "name",
        as: "mautic_log"
      },
    },
    operation: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Describes the operation performed, e.g., 'leads sent', 'error'",
    },
    leadIds: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of lead IDs involved in the operation, if applicable",
    },
    processed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    page: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    message: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Additional information or error messages",
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "mautic_logs",
    tableName: "mautic_logs",
    timestamps: true,
  }
);

MauticLogs.belongsTo(Section, { foreignKey: "section", targetKey: "name", as: "section_name" });
Section.hasMany(MauticLogs, { foreignKey: "section", sourceKey: "name", as: "mauticLogs" });

module.exports = { MauticLogs };
