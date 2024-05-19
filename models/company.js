const sequelize=require('../database');
const Sequelize=require('sequelize');
const company=sequelize.define('company',{
    companyId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true,
    },
    companyName:{type:Sequelize.STRING},
});
module.exports=company;