const { DataTypes, Model, Sequelize } = require("sequelize");
const sequelize = require("../database");
const { Type } = require("./types.model");
const { Section } = require("./sections.model");

class Leads extends Model {}

Leads.init(
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
    web_link: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: "types",
        key: "name",
      },
    },
    section: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: "sections",
        key: "name",
      },
    },
    website: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    telephone: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    locality: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    zip_code: {
      type: DataTypes.STRING(255),
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
    modelName: "leads",
    tableName: "leads"
  }
);

Leads.belongsTo(Type, {
  foreignKey: "type",
  targetKey: "name",
  as: "TypeInfo",
});
Leads.belongsTo(Section, { foreignKey: "section", targetKey: "name", as: "SectionInfo" });

module.exports = { Leads };
