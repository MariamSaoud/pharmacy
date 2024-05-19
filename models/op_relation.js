const sequelize=require('../database');
const Sequelize=require('sequelize');
const op_relation=sequelize.define('op_relation',{
    op_relationId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        primaryKey:true,
        autoIncrement:true,
    },
    count:{type:Sequelize.INTEGER,
    defaultValue:1,
    }
});
module.exports=op_relation;