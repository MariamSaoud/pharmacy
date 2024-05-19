const sequelize=require('../database');
const Sequelize=require('sequelize');
const notification=sequelize.define('notification',{
    notificationId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true,
    },
    description:{type:Sequelize.TEXT},
});
module.exports=notification;