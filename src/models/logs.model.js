const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database");
const { User } = require("./user.model");

class Logs extends Model {}

Logs.init(
  {
    type: {
      type: DataTypes.ENUM([
        "SCRAP",
        "MARKETING"
      ]),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    description: {
      type: DataTypes.STRING(255),
    },
    status: {
      type: DataTypes.STRING(20)
    }
  },
  
  {
    sequelize,
    modelName: "logs",
    tableName: "logs",
    timestamps: true,
  }
);

Logs.belongsTo(User, { foreignKey: "user_id", targetKey: "id" });

module.exports = { Logs };
