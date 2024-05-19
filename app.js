//1- npm init  2- npm install --save express 3-npm install --save mysql2  4-npm install --save sequelize after mysql2 5-npm install --save body-parser  6- npm install --save multer 7-npm install bcrypt 8- npm install jsonwebtoken 9-npm install joi 10-npm install fs 11-npm install nodemon 12-npm install nodemailer 13- npm install translate-google
const express=require('express');
const app=express();
const path =require('path');
const fs =require('fs');
const bodyParser=require('body-parser');
const multer=require('multer');
const sequelize=require('./database');
const Sequelize=require('sequelize');
//import models
const user=require('./models/user');
const medicine=require('./models/medicine');
const company=require('./models/company');
const notification=require('./models/notification');
const op_relation=require('./models/op_relation');
const order=require('./models/order');
const otpverification=require('./models/otpVerification');
const tokens=require('./models/tokens');
const  altmed=require('./models/altmed');
//body parse
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
//urlencoded a function that have to execute and you can pass options to configurate it but you don't have to here
//it will not parse all possible bodies but it will parse bodies like one we're getting here ,if i have files i will parse different parser
//use path
app.use(express.static(path.join("./images",__dirname,"images")));
app.use(express.static(path.join(__dirname,"pharmacy")));
//setHeader

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type,Authorization");
    next();
});
//multer package
const fileStorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'images');
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+"-"+file.originalname);
    }
})
const fileFilter=(req,file,cb)=>{

    if(file.mimetype==='image/png'||file.mimetype==='image/jpg'||file.mimetype==='image/jpeg')
    {
        cb(null,true)
    }
    else{
        cb(null,false)
    }
}
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'))
//imports routes
const pharmacistRoute=require('./routers/pharmacist');
const userRoute=require('./routers/user');
//router use
app.use('/pharmacist/',pharmacistRoute);
app.use('/user/',userRoute);
//relationShip
medicine.hasMany(altmed);
altmed.belongsTo(medicine);

company.hasMany(medicine);
medicine.belongsTo(company);

medicine.belongsToMany(order,{through:op_relation});
order.belongsToMany(medicine,{through:op_relation});

user.hasMany(order);
order.belongsTo(user);

user.hasMany(notification);
notification.belongsTo(user);

//sequelize.sync({alter:true}); //force:true (no stay data)     alter:true (the data will stay)
sequelize.authenticate(); //connect
app.listen(3000,()=>{
    console.log('my server is running :)')
});