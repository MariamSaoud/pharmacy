const mysql2=require('mysql2');
const Sequelize=require('sequelize');
require('dotenv').config();
const sequelize=new Sequelize(process.env.DB_NAME,process.env.DB_USERNAME,process.env.DB_PASSWORD,{dialect:'mysql',host:process.env.DB_HOST});
//fourth argument options object  
module.exports=sequelize;