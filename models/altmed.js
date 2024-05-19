const sequelize=require('../database');
const Sequelize=require('sequelize');
const altmed=sequelize.define('altmed',{
    altmedId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true,
    },
    altmed:{type:Sequelize.INTEGER,},
});
module.exports=altmed;