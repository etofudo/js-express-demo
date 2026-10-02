const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database");
const { Leads } = require("./leads.model");
const SocialMediaStats = require("./social_media_stats.model");

class SocialEngagement extends Model {}

SocialEngagement.init({
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Leads,  
        key: "id",     
      },
    },
    linkedin_stats: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: SocialMediaStats,
            key: "id"
        }
    },
    facebook_stats: {
        type: DataTypes.INTEGER,
        allowNull: true, 
        references: {
            model: SocialMediaStats,
            key: "id"
        }
    },
},
  {
    sequelize,
    modelName: "social_engagement",
    tableName: "social_engagement",
    timestamps: false,
  }
);

SocialEngagement.belongsTo(Leads, {
  foreignKey: "lead_id",
  targetKey: "id",
  as: "lead",  
});

Leads.hasMany(SocialEngagement, {
    foreignKey: "lead_id",
    as: "lead_engagement",  
});

SocialEngagement.belongsTo(SocialMediaStats, {
  foreignKey: "linkedin_stats",
  as: "linkedin",
});

SocialEngagement.belongsTo(SocialMediaStats, {
  foreignKey: "facebook_stats",
  as: "facebook",
});

SocialMediaStats.belongsTo(SocialEngagement, {
    foreignKey: "linkedin_stats",
    as: "linkedin"
});

SocialMediaStats.belongsTo(SocialEngagement, {
    foreignKey: "facebook_stats",
    as: "faecbook"
});

module.exports = SocialEngagement;