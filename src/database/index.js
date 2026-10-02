const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("joa_automation", "root", "?Abcd1234", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  // logging: true,
  dialectOptions: {
    connectTimeout: 120000
  },
  pool: {
    max: 10,
    min: 0,  
    acquire: 30000, 
    idle: 10000, 
  },
});

module.exports = sequelize;
