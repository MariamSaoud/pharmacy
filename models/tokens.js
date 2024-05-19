const sequelize=require('../database');
const Sequelize=require('sequelize');
const token=sequelize.define('token',{
    tokenId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    loginType:{type:Sequelize.STRING},
    tokenValue:{type:Sequelize.STRING},
});
module.exports=token;