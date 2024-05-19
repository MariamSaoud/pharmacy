const sequelize = require('../database');
const Sequelize=require('sequelize');
const order=sequelize.define('order',{
    orderId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true,
    },
    state:{
        type:Sequelize.STRING,
        defaultValue:"Waiting!"
    },
})
module.exports=order;