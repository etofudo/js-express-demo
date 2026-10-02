const { Model, DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../database");

class ServerCpuUsage extends Model {}

ServerCpuUsage.init({
        usage: {
            type: DataTypes.STRING,
            allowNull: false
        },
        most_intensive_task: {
            type: DataTypes.STRING,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.fn("now"),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "server_cpu_usage",
        tableName: "server_cpu_usage",
    }
);

module.exports = { ServerCpuUsage };