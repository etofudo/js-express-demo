const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database");
const { Type } = require("./types.model");

class Section extends Model {}

Section.init(
  {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: "types",
        key: "name",
      },
    },
  },
  {
    sequelize,
    modelName: "sections",
    tableName: "sections",
    timestamps: false,
  }
);

Section.belongsTo(Type, {
  foreignKey: "type",
  targetKey: "name",
  as: "TypeInfo",
});

module.exports = { Section };
