const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database");

class SocialMediaStats extends Model {}

SocialMediaStats.init({
    platform: {
        type: DataTypes.ENUM("facebook", "linkedin"),
        allowNull: false
    },
    followers: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    last_post_date: {
        type: DataTypes.DATE,
        allowNull: true
    }
},
  {
    sequelize,
    modelName: "social_media_stats",
    tableName: "social_media_stats",
    timestamps: false,
  }
);

module.exports = SocialMediaStats;