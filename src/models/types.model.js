const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database");

class Type extends Model {}

Type.init(
  {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "types",
    tableName: "types",
    timestamps: false,
  }
);

module.exports = { Type };
