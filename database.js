const mysql2=require('mysql2');
const Sequelize=require('sequelize');
const sequelize=new Sequelize('pharmacy','root','mariameliassaoud0951489023@@',{dialect:'mysql',host:'localhost'});
//fourth argument options object  
module.exports=sequelize;