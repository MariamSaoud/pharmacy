const Sequelize=require('sequelize');
const fs =require('fs');
const joi=require('joi');
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const sequelize=require('../database');
const nodemailer=require("nodemailer");
const translate=require('translate-google');
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
//translate
exports.translate=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        msg:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({ error: result.error.details[0].message });
    }
    const msg=req.body.msg;
    const translation=await translate(msg,{from:'auto',to:'ar'});
    return res.status(200).json(translation)
}
//sendOTP
let config = {
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
    user: "lovelymarmoush.saoud14@gmail.com",
      pass: "ryzpqnddfuizmcjl", //app password not gmail password
    },
};
let transporter = nodemailer.createTransport(config);

exports.sendOTPverification=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        email:joi.string().email().required(),
    })
    const result=await SignUpSchema.validate(req.body);
        if(result.error){
            return res.status(400).json({error:result.error.details[0].message})
        }
        const email=req.body.email;
        const userId=req.params.userId;
        try{
            const otp=`${Math.floor(1000+Math.random()*9000)}`;
            //mailoption
            const mailOption={
                from: "lovelymarmoush.saoud14@gmail.com",
                to: email,
                subject: "Verify your email",
                html: `<p>Enter<b> ${otp} </b>in the app to verify your email and complete the sign-up</p><p>this code <b>expires in 1 hour</b></p>`,};
            let t=Date.now()+1000*60*60;
            const saltRound = await bcrypt.genSalt(10);
            const hashedOTP = await bcrypt.hash(otp, saltRound);
            const newOTPverification = await otpverification.create({
                userId: userId,
                otp: hashedOTP,
                createdAt: Sequelize.DATE.now,
                expiredAt: t,
                });
                await transporter.sendMail(mailOption);
                res.json({
                    status: "pending",
                    message: "verification otp email sent",
                    data: {
                    userId: userId,
                    email,
                    },
                });
            }catch(error){
                res.json({ status: "failed", message: error.message });
            }
        }
//SignUp
exports.SignUp=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        userName:joi.string().min(3).required(),
        email:joi.string().email().required(),
        password:joi.string().min(4).max(25).required(),
        role:joi.string().optional(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message});
    }
    const userName=req.body.userName;
    const email=req.body.email;
    const password=req.body.password;
    const role=req.body.role;
    try{
        const existingUser=await user.findOne({where:{userName:userName}});
        if(existingUser)
        {
            return res.status(405).json({msg:"This Account Is Already Existed, Please Try To SignUp In Different Username!"});
        }
        else{
            const salt=await bcrypt.genSalt(10);
            const hashedPassword=await bcrypt.hash(password,salt);
            const me=await user.create({userName:userName,email:email,password:hashedPassword,role:role});
            return res.status(200).json(me);
        }
    }catch(error){
        return res.status(500).json({msg:"Sorry Something Went Wrong!"})
    }
}
//verifyOTP
exports.verifyOTP=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        otp:joi.string().max(4).required(),
    })
    const result =await SignUpSchema.validate(req.body);
    if(result.error){
    return res.status(400).json({error:result.error.details[0].message});
    }
    const userId=req.params.userId;
    const otp=req.body.otp;
    try{
        if(!userId||!otp)
        {
            throw Error("Empty OTP Details Are Not Allowed:(")
        }
        else{
            const existingUser=await otpverification.findOne({where:{userId:userId}});
            const Myuser=await user.findOne({where: { userId: userId },});
            if(!existingUser)
            {
                throw Error("The Account Is Already Verified!")
            }else{
                const otp1=existingUser.otp;
                const expiredAt=existingUser.expiredAt;
                if(expiredAt<Date.now())
                {
                    await otpverification.destroy({where:{userId:userId}});
                    throw new Error("The Code Has Been Expired Please Request Again:(")
                }
                else{
                    otpverify=await bcrypt.compare(otp,otp1);
                    console.log(otpverify);
                    if(!otpverify)
                    {
                        throw Error("Check Your Inbox And Try Again!")
                    }
                    else{
                        if(Myuser.verified==false)
                        {
                            await user.update({verified:true,verifiedR:true},{where:{userId:userId}})
                            await otpverification.destroy({where:{userId:userId}})
                            setTimeout(()=>{
                                user.update({verifiedR:false},{where:{userId:userId}})
                            },60 * 60 * 1000)
                        }else{
                            await user.update({verifiedR:true},{where:{userId:userId}})
                            setTimeout(()=>{
                                user.update({verifiedR:false},{where:{userId:userId}})
                            },60 * 60 * 1000)
                        }
                        res.status(201).json({status:"verified",message:"The Account Verified Successfully!"})
                    }
                }
            }
        }
    }catch(error){
        return res.status(401).json({status:"failed",message: error.message,})}
}
//login
exports.login=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        userName:joi.string().min(3).required(),
        email:joi.string().email().required(),
        password:joi.string().min(4).max(25).optional(),
        loginType:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error)
    {
        return res.status(400).json({error:result.error.details[0].message})
    }
    const userName=req.body.userName; 
    const email=req.body.email;
    const password=req.body.password;
    const loginType=req.body.loginType;
    if(loginType=='Backend')
    {
        try{
            const existingUser=await user.findOne({where:{userName:userName}})
            if(!existingUser){
                return res.status(401).json({msg:"Sorry You Don't Have An Account In Our Application:("})
            }
            if(existingUser.verified==false){
                return res.status(401).json({msg:"Sorry You Can't Loggin Before You Verify Your Account:("})
            }
            const matchPassword=await bcrypt.compare(password,existingUser.password)
            if(!matchPassword){
                return res.status(400).json({msg:"Are You Sure This Is Your Password? I Don't Think That:("})
            }
            const token=jwt.sign({email:existingUser.email,userId:existingUser.userId},SECRET_KEY);
            await tokens.create({loginType:loginType,tokenValue:token})
            return res.status(201).json({ user: existingUser, token: token });
        }catch(error){
            res.status(500).json({msg: "Something went wrong please check your connection and try again!",});
        }
    }else if(loginType=='Google'){
        const token=jwt.sign({email:email,userName:userName},SECRET_KEY);
            await tokens.create({loginType:loginType,tokenValue:token})
            return res.status(201).json({ user:userName, token: token });
    }
}
exports.resetPassword=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        password:joi.string().min(4).max(45).required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const password=req.body.password;
    const userId=req.params.userId;
    const v=await user.findOne({where:{userId:userId}});
    const saltRound=await bcrypt.genSalt(10);
    const hashed=await bcrypt.hash(password,saltRound);
    if(v.verifiedR==false)
    {
        return res.status(401).json({message:"Before Reset Password, Please Verify Your Account!"})
    }else{
        await user.update({password:hashed},{where:{userId:userId}})
    }
    res.status(201).json({message:"Congrats!,Your Password Changed Successfully:)"})
}
//delete account
exports.deleteaccount=async(req,res,next)=>{
    const userId=req.params.userId;
    const me=await user.findOne({where:{userId:userId}})
    if(!me){
        return res.status(400).json({message:"You Already Don't Have An Account, Try To Create One :)"})
    }
    await user.destroy({where:{userId:userId}});
    return res.status(202).json({message:"Oops!,Your Account Deleted:("})
}
//logout
exports.logout=async(req,res,next)=>{
    if(req.headers.authorization){
        const token=req.headers.authorization.split(" ")[1];
        if(!token){
            return res.status(400).json({message:"Authorization Failed!"})
        }
        const a=await tokens.findOne({where:{tokenValue:token}})
        
        if(!a){
            return res.status(400).json({message:"You Are Not Logged In!"})
        }
        await tokens.destroy({where:{tokenValue:token}})
        return res.status(202).json({message:"You Logged Out Successfully, GoodBye :)"})
    }
}

//create an order
let b,c;
exports.buyAnItem=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        count:joi.number().optional(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const id=req.id;
    const count=req.body.count;
    const medicineMedicineId=req.params.medicineId;
    try{
    const a=await order.findOne({where:{userUserId:id, state:"waiting"}});
    const e=await medicine.findOne({where:{medicineId:medicineMedicineId}})
    if(!a){
        b=await order.create({userUserId:id, state:"waiting"})
        c=await b.orderId;
        if(e.quantity<count)
        {
            return res.status(400).json({message:`We Don't Have This Quantity We Only Have ${e.quantity}`})
        }
        else{
            await op_relation.create({medicineMedicineId:medicineMedicineId,orderOrderId:c,count:count}) 
            return res.status(201).json({message:"Creating Order Successfully!"})}
    }else{
        b=await a;
        c=await b.orderId;
        
        if(e.quantity<count)
        {
            return res.status(400).json({message:`We Don't Have This Quantity We Only Have ${e.quantity}`})
        }
        else{
        await op_relation.create({medicineMedicineId:medicineMedicineId,orderOrderId:c,count:count})
        return res.status(201).json({message:"Storing Order Successfully!"})}
    }
}catch(error){
    return res.status(500).json({error:error.message})}
}
//cancel order
exports.cancelOrder=async(req,res,next)=>{
    const orderId=req.params.orderId;
    try{   
        const o=await order.findOne({where:{orderId:orderId,state:"waiting"}})
        if(o){
            await order.destroy({where:{orderId:orderId}})
            await op_relation.destroy({where:{orderOrderId:orderId}})
            return res.status(202).json({message:"Order Cancelled Successfully:("})
        }
        else{
            return res.status(202).json({message:"There Is No Order To Cancel It :)"})
        }
    }catch(error){
        return res.status(500).json({message:"Server Error"})
    }
}
exports.location=async(req,res,next)=>{
    const SignUpSchema=joi.object({
    location:joi.string().required(),
})
const result=await SignUpSchema.validate(req.body);
if(result.error)
{
    return res.status(400).json({error:result.error.details[0].message})
}
    const location=req.body.location;
    const id=req.id;
    try{
        await user.update({location:location},{where:{userId:id}})
        return res.status(202).json({message:"We Will Send The Order To You :)"})
    }catch(error){
        return res.status(500).json({message:"Server Error"})
    }
}
let k;
exports.notificationWant=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        time:joi.number().required(),
        duration:joi.number().required(),
        med:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error)
    {
        return res.status(400).json({error:result.error.details[0].message})
    }
    const id=req.id;
    const time=req.body.time;   //time in hour like 8 hours to take the medicine
    const duration=req.body.duration;   //days
    const med=req.body.med;     //medicine to remember user to take it!
    for(k=0;k<duration*((24*3600)/(time*3600));k++){
        setTimeout(()=>{
            const t=notification.create({description:`Take Your Medicine ${med},To Feel Better:)`,userUserId:id})
        },time*3600*(k+1)*1000)
    }
    clearInterval();
    res.status(200).json({message:"Remember Your Medicine"})
}
exports.deleteNotifications=async(req,res,next)=>{
    const notificationId=req.params.notificationId;
    try{
    await notification.destroy({where:{notificationId:notificationId}})
    return res.status(202).json({message:"Deleted Successfully:)"})
    }catch(error)
    {
        return res.status(500).json({message:"Server Error!"})
    }
}
exports.showHome=async(req,res,next)=>{
    try{
        const {page, limit}=req.query;
        const offset=(page-1)*limit;
        const [data]=await sequelize.query(`SELECT * FROM medicines limit ${limit} offset ${offset}`);
        let v1=[]
        for(let i=0;i<data.length;i++){
            let v=await company.findOne({where:{companyId:data[i].companyCompanyId}})
            v1.push(v.companyName+' Is The Company For The Medicine '+data[i].medicineName)
        }
        const [totalpageData]=await sequelize.query('SELECT COUNT(*) AS count FROM medicines');
        const f=await totalpageData[0];
        return res.status(202).json({
            data:data,v1,
        pagination:{
            page:+page,
            limit:+limit,
            totalpage:Math.ceil(f.count/limit)
        }})
    }
    catch(error)
    {
        return res.status(500).json({error:error.message})
    }
}

let result;
exports.search=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        medSearch:joi.string().required()
    })
    const myresult=await SignUpSchema.validate(req.body);
    if(myresult.error){
        return res.status(400).json({error:myresult.error.details[0].message})
    }
    const medSearch=req.body.medSearch;
    try{
    const name=await medicine.findAll({where:{medicineName:medSearch}})
    if(name.length!==0){
        result=await name;
    }
    else if (name.length==0) {
        const myCompany=await company.findOne({where:{companyName:medSearch}})
        let medCompany
        if(myCompany){
            medCompany=await medicine.findAll({where:{companyCompanyId:myCompany.companyId}})
            result=medCompany}
            else if(!myCompany){
                const p=medSearch.concat('',' %')
                    const p1='%'.concat('',p)
                const composition=await sequelize.query('SELECT * FROM medicines WHERE pharmaceuticalComposition LIKE :search',{replacements:{search:p1}})
                console.log(composition[0].length)
                if(composition[0].length!==0){
                    result=await composition[0]
                    console.log(composition)
                }
                else if(composition[0].length===0){
                    var l='Try To Search About Another Thing !';
                    result=l;
                }
            }
    }
    return res.status(202).json({result:result})}catch(error){
        return res.status(500).json({message:'There Is An Error:( '})
    }
}
exports.showNotification=async(req,res,next)=>{
    try{
        const {page, limit}=req.query;
        const userId=req.id;
        const offset=(page-1)*limit;
        const [data]=await sequelize.query(`SELECT * FROM notifications where userUserId=${userId} limit ${limit} offset ${offset}`);
        const [totalpageData]=await sequelize.query(`SELECT COUNT(*) AS count  FROM notifications where userUserId=${userId}`);
        const f=await totalpageData[0];
        return res.status(202).json({
            data:data,
        pagination:{
            page:+page,
            limit:+limit,
            totalpage:Math.ceil(f.count/limit)
        }})
    }
    catch(error)
    {
        return res.status(500).json({error:error.message})
    }
}
exports.showPrescription=async(req,res,next)=>{
    var l=[];
    var l1=[];
    var sum=0;
    const orderOrderId=req.params.orderId;
    const x=await op_relation.findAll({where:{orderOrderId:orderOrderId}})
    for(let i=0;i<x.length;i++)
    {
        l.push(x[i].medicineMedicineId)
    }
    for(let j=0;j<l.length;j++)
    {
        const y=await medicine.findOne({where:{medicineId:l[j]}})
        const z=await op_relation.findOne({where:{medicineMedicineId:l[j],orderOrderId:orderOrderId}})
        sum+= await (y.price*z.count)
        var s=await 'The Medicine Is: '+y.medicineName+' The Number Of The Medicine You Bought: '+z.count+' The Price Is: '+(y.price*z.count);
        l1.push(s)
    }
    return res.status(202).json({result:l1,sum:sum})
}
exports.showAltMed=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        medSearchAlt:joi.string().required()
    })
    const myresult=await SignUpSchema.validate(req.body);
    if(myresult.error){
        return res.status(400).json({error:myresult.error.details[0].message})
    }
    const medSearchAlt=req.body.medSearchAlt;
    try
    {   
        const a=await medicine.findOne({where:{medicineName:medSearchAlt}})
        const c=await altmed.findAll({where:{medicineMedicineId:a.medicineId}})
        let altmeds=[]
        let altmeds2=[]
        for (let i=0;i<c.length;i++)
        {
            altmeds.push(c[i].altmed)
        }
        for(let i=0;i<altmeds.length;i++)
        {
            const b=await medicine.findOne({where:{medicineId:altmeds[i]}})
            altmeds2.push(b.medicineName)
        }
        return res.status(201).json({altmeds:altmeds2})
    }catch(error)
    {
        return res.status(500).json({message:'Server Error :('})
    }
}
exports.showMedOrdered=async(req,res,next)=>{
    const id=req.id;
    const {page,limit}=req.query;
    const offset=(page-1)*limit;
    try{
const a=await order.findAll({where:{userUserId:id},
    page: +page?+page:1,
    limit:+limit?+limit:2,
    offset:offset,
    include:{
        required: false,
        model:medicine,attributes:['medicineName','price','medicineImageUrl']
    }})
    const data=await await order.findAndCountAll({where:{userUserId:id}})
    return res.status(202).json({data:a,
        pagination:{
        page:+page,
        limit:+limit,
        totalpage:Math.ceil(data.count/limit)
    }})}
    catch(error){
        return res.status(500).json({message:'Server Error :('})
    }
}
exports.showProfile=async(req,res,next)=>{
    const id=req.id;
    try{
    const a=await user.findOne({where:{userId:id}})
    return res.status(200).json({data:a})}
    catch(error){
        return res.status(500).json({message:'Server Error'})
    }
}
exports.editProfile=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        userName:joi.string().min(3).optional(),
        email:joi.string().email().optional(),
        password:joi.string().min(4).max(25).optional(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message});
    }
    const userName=req.body.userName;
    const email=req.body.email;
    const password=req.body.password;
    const id=req.id;
    try{
        const a=await user.update({userName:userName,email:email,password:password},{where:{userId:id}})
        return res.status(200).json({message:"Updated Successfully"})}
        catch(error){
            return res.status(500).json({message:error.message})
        }
}