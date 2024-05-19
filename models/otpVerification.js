const Sequelize=require('sequelize');
const sequelize=require('../database')
const otpverification=sequelize.define('otpverification',{
    otpverificationId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true,
    },
    userId:{type:Sequelize.INTEGER},
    otp:{type:Sequelize.STRING,},
    expiredAt:{type:Sequelize.DATE},
})
module.exports=otpverification;