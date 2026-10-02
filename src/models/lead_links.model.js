const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database");
const { Leads } = require("./leads.model");  

class LeadLinks extends Model {}

LeadLinks.init(
  {
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Leads,  
        key: "id",     
      },
    },
    link_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isUrl: {
          args: true,
          msg: "Please provide a valid URL",
        },
      },
    },
  },
  {
    sequelize,
    modelName: "lead_links",
    tableName: "lead_links",
    timestamps: false,
  }
);

LeadLinks.belongsTo(Leads, {
  foreignKey: "lead_id",
  targetKey: "id",
  as: "lead",  
});


Leads.hasMany(LeadLinks, {
    foreignKey: "lead_id",
    as: "lead_links",  
});

module.exports = { LeadLinks };
