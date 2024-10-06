const Sequelize=require('sequelize');
const fs =require('fs');
const joi=require('joi');
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const sequelize=require('../database');
const nodemailer=require("nodemailer");
const translate=require('translate-google');
const Op=Sequelize.Op;
const SECRET_KEY="NOTESAPI";
//importing models
const otpverification=require('../models/otpVerification');
const user=require('../models/user');
const tokens=require('../models/tokens');
const company=require('../models/company');
const medicine=require('../models/medicine');
const altmed=require('../models/altmed');
const order=require('../models/order');
const op_relation=require('../models/op_relation');
const notification=require('../models/notification');
const { da } = require('translate-google/languages');
const { off } = require('process');
//firebase 
var admin = require("firebase-admin");
var serviceAccount = require("../notification-f0089-firebase-adminsdk-bg4u7-5f5ac86dbb.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId:'notification-f0089'
});
let j,x,y;
let t=new Date();
let year=t.getFullYear();
let month=String(t.getMonth()+1).padStart(2,'0')
let day=String(t.getDate()).padStart(2,'0')
let formattedDate=`${year}-${month}-${day}`
let c=formattedDate.concat('','%');
exports.notifications=async(req,res,next)=>{
    const receivedtoken=req.body.fcmToken;
    const id=req.id;
    if(!receivedtoken){
        return res.status(400).json({msg:"No Token Here!"});
    }
    x=await medicine.findAll({
        attributes:['medicineName'],
        where:{
            expiredDate:c
        }
    })
    if(x.length==0){
        return res.status(202).json({message:"No Expired Date Medicine!"})
    }
    else{
        for(j=0;j<x.length;j++)
        {   let v=await x[j];
            console.log(x[j]);
            await notification.create({description:`Today The Medicine${v.medicineName} Has Expired Please Don't Sale It!`,userUserId:id})
        }
        const message={
            notification:{
                title:"Expired Date Medicine",
                body:`Don't Sale It ${x}`
            },
            token:receivedtoken
        };
        admin.messaging().send(message).then(()=>{console.log("Sent")
        }).catch((error)=>{console.log(error.message)})
        return res.status(202).json({message:"Today There Is Expired Date Medicine :(",x});    
    }
}
//low bound send notifications
let count=0;
exports.lowBoundNotifications=async(req,res,next)=>{
    const receivedtoken=req.body.fcmToken;
    const id=req.id;
    if(!receivedtoken){
        return res.status(400).json({msg:"No Token Here!"});
    }
    const id1=[];
    y=await medicine.findAll();
        for(j=0;j<y.length;j++)
        {   let v=await y[j];
            if(v.quantity<=v.lowBound)
            {   count++;
                await notification.create({description:`Today The Medicine${v.medicineName} Has The Low Bound!, Try To Buy It`,userUserId:id})
                await id1.push(v.medicineName)
            }
        }
        if(count==0){
            return res.status(400).json({message:'No Low Bound!'})
        }
        console.log(count)
        if(count!==0){        
            const message={
            notification:{
                title:"Low Bound Medicine",
                body:`Low Quantity of ${id1}`
            },
            token:receivedtoken
        };
        admin.messaging().send(message).then(()=>{ console.log('sent')
        }).catch((error)=>{console.log(error.message)
        })
            return res.status(202).json({message:`There is Low Bound Medicine!${id1}`})
        }
}

let k;
exports.notificationWant=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        time:joi.number().required(),
        duration:joi.number().required(),
        med:joi.string().required(),
        fcmToken:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error)
    {
        return res.status(400).json({error:result.error.details[0].message})
    }
    const receivedtoken=req.body.fcmToken;
    if(receivedtoken.length==0){
        return res.status(400).json({msg:"No Token Here!"});
    }
    const id=req.id;
    const time=req.body.time;   //time in hour like 8 hours to take the medicine
    const duration=req.body.duration;   //days
    const med=req.body.med;     //medicine to remember user to take it!
    for(k=0;k<duration*((24*3600)/(time*3600));k++){
        setTimeout(()=>{
            const message={
                notification:{
                    title:"Remember Your Medicine",
                    body:`Herry Up Go To Take Your Medicine  ${med}`
                },
                token:receivedtoken
            };
            admin.messaging().send(message).then(()=>{
            const t=notification.create({description:`Take Your Medicine ${med},To Feel Better:)`,userUserId:id})
            }).catch((error)=>{console.log(error.message)})
            
        },time*3600*(k+1)*1000)
    }
    clearInterval();
    res.status(200).json({message:"Remember Your Medicine"})
}