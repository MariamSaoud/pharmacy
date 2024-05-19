const { allow } = require('joi');
const sequelize=require('../database');
const Sequelize=require('sequelize');
const user=sequelize.define('user',{
    userId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        primaryKey:true,
        autoIncrement:true,
    },
    userName:{
        type:Sequelize.STRING,
        unique:true,
    },
    email:{type:Sequelize.STRING,},
    password:{type:Sequelize.STRING,},
    role:{
        type:Sequelize.STRING,
        defaultValue:'user',
    },
    verified:{
        type:Sequelize.BOOLEAN,
        defaultValue:false,
    },
    verifiedR:{
        type:Sequelize.BOOLEAN,
        defaultValue:false,
    },
    location:{
        type:Sequelize.STRING,
        allowNull:true,
    }
});
module.exports=user;