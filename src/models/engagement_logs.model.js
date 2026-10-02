const { DataTypes, Model, DATE, DATEONLY, Sequelize } = require("sequelize");
const sequelize = require("../database");
const { User } = require("./user.model");
const { Leads } = require("./leads.model");

class EngagementLogs extends Model {}

EngagementLogs.init(
  {
    platform: {
      type: DataTypes.ENUM([
        "FACEBOOK",
        "LINKEDIN",
        "INSTAGRAM",
      ]),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lead_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
        model: "leads",
        key: "id",
    }},
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      }
    },
    date_completed: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  },
  {
    sequelize,
    modelName: "engagement_logs",
    tableName: "engagement_logs",
    timestamps: true,
  }
);

EngagementLogs.belongsTo(User, { foreignKey: "user_id", targetKey: "id", as:"user" });
EngagementLogs.belongsTo(Leads, { foreignKey: "lead_id", targetKey: "id", as:"lead" });
User.hasMany(EngagementLogs);
Leads.hasMany(EngagementLogs, { foreignKey: "lead_id", targetKey: "id", as: "engagementLogs" });

module.exports = { EngagementLogs };
