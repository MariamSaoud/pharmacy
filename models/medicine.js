const sequelize=require('../database');
const Sequelize=require('sequelize');
const medicine=sequelize.define('medicine',{
    medicineId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true,
    },
    medicineBarcode:{
        type:Sequelize.STRING,
        allowNull:true,},
    medicineName:{type:Sequelize.STRING},
    pharmaceuticalIndications:{type:Sequelize.TEXT},
    pharmaceuticalComposition:{type:Sequelize.TEXT},
    price:{type:Sequelize.INTEGER},
    quantity:{
        type:Sequelize.INTEGER,
        defaultValue:1},
    lowBound:{
        type:Sequelize.INTEGER,
        defaultValue:1},
    pharmaceuticalTiter:{
        type:Sequelize.DOUBLE,
        allowNull:true,},
    medicineImageUrl:{type:Sequelize.STRING},
    expiredDate:{type:Sequelize.DATE,
    defaultValue:'2026-01-01'}
});
module.exports=medicine;