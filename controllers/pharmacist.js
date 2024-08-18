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
const { messaging } = require('firebase-admin');
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
//signUp
exports.signUp=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        userName:joi.string().min(3).required(),
        email:joi.string().email().required(),
        password:joi.string().min(4).max(25).required(),
        role:joi.string().optional(),
        mobileNumber:joi.string().required()
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message});
    }
    const userName=req.body.userName;
    const email=req.body.email;
    const password=req.body.password;
    const role=req.body.role;
    const mobileNumber=req.body.mobileNumber;
    try{
        const existingUser=await user.findOne({where:{userName:userName}});
        if(existingUser)
        {
            return res.status(405).json({msg:"This Account Is Already Existed, Please Try To SignUp In Different Username!"});
        }
        else{
            const salt=await bcrypt.genSalt(10);
            const hashedPassword=await bcrypt.hash(password,salt);
            const me=await user.create({userName:userName,email:email,password:hashedPassword,role:role,mobileNumber:mobileNumber});
            return res.status(200).json(me);
        }
    }catch(error){
        return res.status(500).json({msg:error.message})
    }
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
            if(existingUser.role=='user'){
                return res.status(401).json({msg:"Sorry You Can't Loggin Because you are user not pharmacist:("})
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
//reset_password
exports.resetPassword=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        password:joi.string().min(4).max(45).required(),
        email:joi.string().email().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const password=req.body.password;
    const email=req.body.email;
    const v=await user.findOne({where:{email:email}});
    const saltRound=await bcrypt.genSalt(10);
    const hashed=await bcrypt.hash(password,saltRound);
    if(v.verifiedR==false)
    {
        return res.status(401).json({message:"Before Reset Password, Please Verify Your Account!"})
    }else{
        await user.update({password:hashed},{where:{email:email}})
    }
    res.status(201).json({message:"Congrats!,Your Password Changed Successfully:)"})
}
exports.deleteaccount=async(req,res,next)=>{
    const userId=req.id;
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
//addcompany
exports.addCompany=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        companyName:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error)
    {
        return res.status(400).json({error:result.error.details[0].message})
    }
    const companyName=req.body.companyName;
    await company.create({companyName:companyName})
    .then(data=>{return res.status(201).json({data})})
    .catch(error=>{return res.status(500).json({message:error.message})})
}
//updatecompany
exports.updateCompanyName=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        companyName:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error)
    {
        return res.status(400).json({error:result.error.details[0].message})
    }
    const companyName=req.body.companyName;
    const companyId=req.params.companyId;
    try{
        await company.update({companyName:companyName},{where:{companyId:companyId}})
        return res.status(202).json({message:"updated successfully!"})
    }catch(error){
        return res.status(500).json({message:error.message})
    }
}
exports.deleteCompany=async(req,res,next)=>{
    const companyId=req.params.companyId;
    try{
        await company.destroy({where:{companyId:companyId}})
        return res.status(202).json({message:"deleted successfully!"})
    }catch(error){
        return res.status(500).json({message:error.message})
    }
}
//add medicine
exports.addmedicine=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        medicineBarcode:joi.string().optional(),
        medicineName:joi.string().required(),
        pharmaceuticalIndications:joi.required(),
        pharmaceuticalComposition:joi.required(),
        price:joi.number().required(),
        quantity:joi.number().required(),
        lowBound:joi.number().optional(),
        pharmaceuticalTiter:joi.number().optional(),
        medicineImageUrl:joi.string().optional(),
        expiredDate:joi.date().optional()
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const companyId=req.params.companyId;
    const medicineBarcode=req.body.medicineBarcode;
    const medicineName=req.body.medicineName;
    const pharmaceuticalIndications=req.body.pharmaceuticalIndications;
    const pharmaceuticalComposition=req.body.pharmaceuticalComposition;
    const price=req.body.price;
    const quantity=req.body.quantity;
    const lowBound=req.body.lowBound;
    const expiredDate=req.body.expiredDate;
    const pharmaceuticalTiter=req.body.pharmaceuticalTiter;
    const Image=req.file;
    try{
        if(!Image){
            return res.status(422).json({message:"Attach File Is Not A Message!"})
        }
        const medicineImageUrl=Image.path;
        const med=await medicine.create({companyCompanyId:companyId,medicineBarcode:medicineBarcode,medicineName:medicineName
        ,pharmaceuticalIndications:pharmaceuticalIndications,pharmaceuticalComposition:pharmaceuticalComposition
    ,price:price,quantity:quantity,lowBound:lowBound,pharmaceuticalTiter:pharmaceuticalTiter,medicineImageUrl:medicineImageUrl,expiredDate:expiredDate
})
return res.status(201).json({med});
    }catch(error)
    {return res.status(500).json({message:error.message})}
}
//add medicine with it's company
exports.addmedicineCompany=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        medicineBarcode:joi.string().optional(),
        medicineName:joi.string().required(),
        pharmaceuticalIndications:joi.required(),
        pharmaceuticalComposition:joi.required(),
        price:joi.number().required(),
        quantity:joi.number().required(),
        lowBound:joi.number().optional(),
        pharmaceuticalTiter:joi.number().optional(),
        medicineImageUrl:joi.string().optional(),
        expiredDate:joi.date().optional(),
        companyName:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    let t,med;
    const companyName=req.body.companyName;
    const medicineBarcode=req.body.medicineBarcode;
    const medicineName=req.body.medicineName;
    const pharmaceuticalIndications=req.body.pharmaceuticalIndications;
    const pharmaceuticalComposition=req.body.pharmaceuticalComposition;
    const price=req.body.price;
    const quantity=req.body.quantity;
    const lowBound=req.body.lowBound;
    const expiredDate=req.body.expiredDate;
    const pharmaceuticalTiter=req.body.pharmaceuticalTiter;
    const Image=req.file;
    try{
        if(!Image){
            return res.status(422).json({message:"Attach File Is Not A Message!"})
        }
        const medicineImageUrl=Image.path;
        const t2=await company.findOne({where:{companyName:companyName}});
        if(!t2){
            t=await company.create({companyName:companyName});
            med=await medicine.create({companyCompanyId:t.companyId,medicineBarcode:medicineBarcode,medicineName:medicineName
            ,pharmaceuticalIndications:pharmaceuticalIndications,pharmaceuticalComposition:pharmaceuticalComposition
        ,price:price,quantity:quantity,lowBound:lowBound,pharmaceuticalTiter:pharmaceuticalTiter,medicineImageUrl:medicineImageUrl,expiredDate:expiredDate
    })
        }
        else{
            t=t2;
            med=await medicine.create({companyCompanyId:t.companyId,medicineBarcode:medicineBarcode,medicineName:medicineName
            ,pharmaceuticalIndications:pharmaceuticalIndications,pharmaceuticalComposition:pharmaceuticalComposition
        ,price:price,quantity:quantity,lowBound:lowBound,pharmaceuticalTiter:pharmaceuticalTiter,medicineImageUrl:medicineImageUrl,expiredDate:expiredDate
    })
        }
return res.status(201).json({med});
    }catch(error)
    {return res.status(500).json({error:error.message})}
}
//update price
exports.updateprice=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        price:joi.number().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const medicineId=req.params.medicineId;
    const price=req.body.price;
    try{ 
        await medicine.update({price:price},{where:{medicineId:medicineId}})
        return res.status(202).json({message:"Update Price Successfully :)"})
    }catch(error){
        return res.status(500).json({message:error.message})}
}
//increase quantity
exports.increaseQuantity=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        quantity:joi.number().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const medicineId=req.params.medicineId;
    const quantity=req.body.quantity;
    try{ 
        const a=await medicine.findOne({where:{medicineId:medicineId}});
        const b=await a.quantity;
        await medicine.update({quantity:b+quantity},{where:{medicineId:medicineId}})
        return res.status(202).json({message:"Update Quantity Successfully :)"})
    }catch(error){
        return res.status(500).json({message:error.message})}
}
//delete medicine
exports.deletemedicine=async(req,res,next)=>{
    const medicineId=req.params.medicineId;
    try{ let image;
        const d=await medicine.findOne({where:{medicineId:medicineId}})
        image=await d.medicineImageUrl;
        fs.unlinkSync(image); 
        await medicine.destroy({where:{medicineId:medicineId}})
        return res.status(202).json({message:"Delete Medicine Successfully :)"})
    }catch(error){
        return res.status(500).json({message:error.message})}
}
//add_alternative_med
exports.addAlternativeMed=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        alt_name:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const alt_name=req.body.alt_name;
    const medicineId=req.params.medicineId;
    try{ 
        const a=await medicine.findOne({where:{medicineName:alt_name}});
        const b=await a.medicineId;
        const c=await medicine.findOne({where:{medicineId:medicineId}});
        const d=await c.medicineName;
        await altmed.create({altmed:b,medicineMedicineId:medicineId})
        return res.status(202).json({message:`Create An Alternative Medicine To ${d} Successfully :)`})
    }catch(error){
        return res.status(500).json({message:error.message})}
}
//update_alternative_med
exports.updateAlteernativeMed=async(req,res,next)=>{
    const SignUpSchema=joi.object({
        alt_name:joi.string().required(),
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const alt_name=req.body.alt_name;
    const altmedId=req.params.altmedId;
    try{ 
        const a=await medicine.findOne({where:{medicineName:alt_name}});
        const b=await a.medicineId;
        await altmed.update({altmed:b},{where:{altmedId:altmedId}})
        return res.status(202).json({message:"Updated Successfully :)"})
    }catch(error){
        return res.status(500).json({message:error.message})}
}
//delete_alternative_med
exports.deleteAlternativeMed=async(req,res,next)=>{
    const altmedId=req.params.altmedId;
    try{ 
        await altmed.destroy({where:{altmedId:altmedId}});
        return res.status(202).json({message:"Deleted Successfully!"})
    }catch(error){
        return res.status(500).json({message:error.message})}
}
//update medicine price from percentage
let i=0;
exports.updatepricepercentage=async(req,res,next)=>{
        const SignUpSchema=joi.object({
        ids:joi.required(),
        percentage:joi.number().required()
    })
    const result=await SignUpSchema.validate(req.body);
    if(result.error){
        return res.status(400).json({error:result.error.details[0].message})
    }
    const ids=req.body.ids;
    const percentage=req.body.percentage;
    try{
    for(i=0;i<ids.length;i++)
    {
        const m=await medicine.findOne({where:{medicineId:ids[i]}});
        const beforeUpdate=await m.price;
        const percentageNew=await m.price*(percentage/100);
        await medicine.update({price:beforeUpdate+percentageNew},{where:{medicineId:ids[i]}})
        return res.status(202).json({message:"Update By Percentage Done Successfully"})
    }
}catch(error){
    return res.status(500).json({message:error.message})}
}
exports.confirmOrder=async(req,res,next)=>{ 
    const orderId=req.params.orderId;
    try{
        const a=await order.findOne({where:{state:"waiting",orderId:orderId}})
            if(!a){
            return res.status(400).json({msg:"Maybe Confirmed Previously, Don't Repeate The Confirm Process On This Order!"})
        }
        
        const x=await op_relation.findAll({where:{orderOrderId:orderId}})
        const v=await order.findOne({where:{orderId:orderId}})
        for(let i=0;i<x.length;i++)
        {   
            const c=await medicine.findOne({where:{medicineId:x[i].medicineMedicineId}})
            if(c.quantity<x[i].count){
                await notification.create({description:`Cannot Confirm It Because The Quantity Of ${c.medicineName} Decreased Try To Delete It From Order To Buy Less Or Equal TO ${c.quantity}`,userUserId:v.userUserId})
                return res.status(400).json({message:`Cannot Confirm It Because The Quantity Of ${c.medicineName} Decreased Try To Delete It From Order To Buy Less Or Equal TO ${c.quantity}`})
            }
            await medicine.update({quantity:c.quantity-x[i].count},{where:{medicineId:x[i].medicineMedicineId}})
        }
        await order.update({state:"Buy"},{where:{state:"waiting",orderId:orderId}})
        await notification.create({description:'Your Order Confirmed :)',userUserId:v.userUserId})
        return res.status(201).json({message:"Order Confirmed!"})}
        catch(error){
        return res.status(500).json({error:error.message})
    }
}
//delete notifications
exports.deleteNotifications=async(req,res,next)=>{
    const notificationId=req.params.notificationId;
    try{
    await notification.destroy({where:{notificationId:notificationId}})
    return res.status(202).json({message:"Deleted Successfully:)"})
    }catch(error)
    {
        return res.status(500).json({message:error.message})
    }
}
//begin of statistics 
exports.maxSelling=async(req,res,next)=>{
    try{ 
    //the way here to use sum columns
    //const a=await op_relation.findAll({
    //attributes: [
        //'medicineMedicineId',
        //  [sequelize.fn('SUM', sequelize.col('count')), 'sum_col']
        //],
    //  group:'medicineMedicineId'
    //})
    //raw query to find max(sum())
    //const b=await sequelize.query('SELECT medicineMedicineId, SUM(count) AS mycount FROM  op_relations GROUP BY medicineMedicineId order by mycount desc limit 1')
    //the best methode of all to find max(sum())
    const b=await sequelize.query('SELECT medicineMedicineId, MAX(SumCount.mycount) AS myMax FROM (SELECT medicineMedicineId, SUM(count) AS mycount FROM  op_relations GROUP BY medicineMedicineId order by mycount desc limit 1)  SumCount GROUP BY medicineMedicineId')
    const c=await b[0];
    const d=await medicine.findOne({where:{medicineId:c[0].medicineMedicineId}})
    return res.status(202).json({Max:c[0].myMax,Name:d.medicineName,photo:d.medicineImageUrl})
}catch(error){
    return res.status(500).json({error:error.message})
    }
}
exports.minSelling=async(req,res,next)=>{
    try{ 
    const med=await medicine.findAll();
    const buyedMed=await op_relation.findAll();
    let id=[],id2=[],id3=[];
    let i;
    for(i=0;i<med.length;i++)
        {
            id.push(med[i].medicineId)
        }
    for(i=0;i<buyedMed.length;i++)
        {
            id2.push(buyedMed[i].medicineMedicineId)
        }
        id2=[...new Set(id2)];
        id2.sort()
if(id.length==id2.length){
    const b=await sequelize.query(' SELECT medicineMedicineId, MIN(SumCount.mycount) AS myMin FROM (SELECT medicineMedicineId, SUM(count) AS mycount FROM  op_relations GROUP BY medicineMedicineId order by mycount  limit 1)  SumCount GROUP BY medicineMedicineId')
    const c=await b[0];
    console.log(c);
    let ids3=[],ids4=[];
    for(i=0;i<c.length;i++){
        const d=await medicine.findAll({where:{medicineId:c[i].medicineMedicineId}})
        ids3.push(d[i].medicineName)
        ids4.push(d[i].medicineImageUrl)
    }
    return res.status(202).json({Min:c[0].myMin,Name:ids3,photo:ids4})
    }
    else{
    for(i=0;i<id.length;i++){
        console.log(id[i])
        if(id2.indexOf(id[i])==-1)
            {
                id3.push(id[i])
            }
    }
    let id4=[],id5=[];
    for(i=0;i<id3.length;i++){
        const t=await medicine.findOne({where:{medicineId:id3[i]}})
        id4.push(t.medicineName)
        id5.push(t.medicineImageUrl)
    }
    return res.status(202).json({Min:"0",Name:id4,photo:id5})
    }
}catch(error){
    console.log(error)
    return res.status(500).json({error:error.message})
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
    }}
exports.dailyInventory=async(req,res,next)=>{
    let t=new Date();
    try{
    let year=t.getFullYear();
    let month=String(t.getMonth()+1).padStart(2,'0')
    let day=String(t.getDate()).padStart(2,'0')
    let formattedDate=`${year}-${month}-${day}`
    let c=formattedDate.concat(' ','%');
    let d=c.toString();
    const a=await sequelize.query('SELECT * FROM op_relations WHERE createdAt LIKE :search',{replacements:{search:d}})
    if(!a){
        return res.status(400).json({message:'Sorry Today No Medicine Bought :('})
    }
    else{
    var ids = [];
    var ids3 = [];
    for(let i=0;i<a[0].length;i++)
    {   const m=await order.findOne({where:{orderId:a[0][i].orderOrderId}})
        if(m.state=='Buy'){
            ids.push(a[0][i].medicineMedicineId)
            ids3.push(a[0][i].orderOrderId)
        }
    }
}
    //ids=[...new Set(ids)]                //to find unique ids
    if(ids.length==0){
        return res.status(400).json({message:'Sorry Today No Medicine Bought !'})
    }
    else{var ids2 = [];
        var sum=0;
        console.log(ids);
        for(let i=0;i<ids.length;i++){
            const n=await medicine.findOne({where:{medicineId:ids[i]}})
            const o=await op_relation.findOne({where:{medicineMedicineId:ids[i],orderOrderId:ids3[i]}})
            sum=await sum+n.price*o.count;
            ids2.push(n.medicineName+'With Price'+-n.price+'With Count'+-o.count)
        }
        return res.status(202).json({result:ids2,sum:sum})}}
    catch(error){
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
    const p=medSearch.concat('','%')
    const p1='%'.concat('',p)
    const name= await sequelize.query('SELECT * FROM medicines WHERE medicineName LIKE :search',{replacements:{search:p1}})
    if(name[0].length!==0){
        result=await name[0];
    }
    else if (name[0].length===0) {
        const myCompany=await sequelize.query('SELECT * FROM companies WHERE companyName LIKE :search',{replacements:{search:p1}})
        let medCompany
        if(myCompany[0].length!==0){
            medCompany=await medicine.findAll({where:{companyCompanyId:myCompany[0][0].companyId}})
            result=medCompany}
            else if(myCompany[0].length===0){
                const composition=await sequelize.query('SELECT * FROM medicines WHERE pharmaceuticalComposition LIKE :search',{replacements:{search:p1}})
                if(composition[0].length!==0){
                    result=await composition[0]
                }
                else if(composition[0].length===0){
                    var l=[];
                    result=l;
                }
            }
    }
    return res.status(202).json({result:result})}catch(error){
        return res.status(500).json({message:error.message})
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
exports.showFromBarcode=async(req,res,next)=>{
    const medicineBarcode=req.body.medicineBarcode;
    try{
        const p=await medicine.findOne({where:{medicineBarcode:medicineBarcode}})
        return res.status(202).json({data:p})}
    catch(error){
        return res.status(500).json({message:error.message})
    }
}
exports.showOrdersDetails=async(req,res,next)=>{
    const {page,limit}=req.query;
    const offset=(page-1)*limit;
    try{
        const o=await order.findAll({
            page: +page?+page:1,
            limit:+limit?+limit:2,
            offset:offset,
            include:[{
                required: false,
                model:medicine,attributes:['medicineName','price']
            },
        {
            required: false,
            model:user,attributes:['userName','location','mobileNumber']
        }
        ]
        })
        const data=await await order.findAndCountAll()
        return res.status(202).json({
            data:o,
        pagination:{
            page:+page,
            limit:+limit,
            totalpage:Math.ceil(data.count/limit)
        }})
    }
    catch(error)
    {
        return res.status(500).json({message:error.message})
    }
}
exports.showCompanies=async(req,res,next)=>{
    const {page,limit}=req.query;
    const offset=(page-1)*limit;
    try{
        const d=await company.findAll({
            page: +page?+page:1,
            limit:+limit?+limit:2,
            offset:offset,
        })
        const data=await await company.findAndCountAll()
        return res.status(202).json({
            data:d,
        pagination:{
            page:+page,
            limit:+limit,
            totalpage:Math.ceil(data.count/limit)
        }})
    }
    catch(error)
    {
        return res.status(500).json({message:error.message})
    }
}
exports.showAltForAllMed=async(req,res,next)=>{
    const {page,limit}=req.query;
    const offset=(page-1)*limit;
    try{
        const d=await medicine.findAll({
            page: +page?+page:1,
            limit:+limit?+limit:2,
            offset:offset,
            include:{
                model:altmed
            }
        })
        const data=await await medicine.findAndCountAll()
        return res.status(202).json({
            data:d[0],
        pagination:{
            page:+page,
            limit:+limit,
            totalpage:Math.ceil(data.count/limit)
        }})
    }
    catch(error)
    {
        return res.status(500).json({message:error.message})
    }
}

exports.showAltForMed=async(req,res,next)=>{
    const medicineMedicineId=req.params.medicineId;
    try{
        const d=await altmed.findAll({where:{medicineMedicineId:medicineMedicineId}})
        if(d.length==0){
            return res.status(400).json({message:"There Is No Alternative :("})
        }
        let id=[],id2=[];  
        for (let i=0;i<d.length;i++){
            id.push(d[i].altmed)
        }
        for(let i=0;i<id.length;i++){
            const s=await medicine.findAll({where:{medicineId:id[i]}})
            id2.push(s[0])
        }
        return res.status(202).json({
            data:id2})
    }
    catch(error)
    {
        return res.status(500).json({message:error.message})
    }
}
exports.showProfile=async(req,res,next)=>{
    const id=req.id;
    try{
    const a=await user.findOne({where:{userId:id}})
    return res.status(200).json({data:a})}
    catch(error){
        return res.status(500).json({message:error.message})
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
        const saltRound=await bcrypt.genSalt(10);
        const hashed=await bcrypt.hash(password,saltRound);
        const a=await user.update({userName:userName,email:email,password:hashed},{where:{userId:id}})
        return res.status(200).json({message:"Updated Successfully"})}
        catch(error){
            return res.status(500).json({message:error.message})
        }
}
exports.findId=async(req,res,next)=>{
const SignUpSchema=joi.object({
    input:joi.string().optional(),
    type:joi.string().required(),
})
const result=await SignUpSchema.validate(req.body);
if(result.error)
{
    return res.status(400).json({error:result.error.details[0].message})
}
const input=req.body.input;
const type=req.body.type;
let myresult;
try{switch(type){
    case("medicine"):
    {
        const medName=await medicine.findOne({where:{medicineName:input}})
        if(medName){myresult=medName.medicineId}
        else{myresult="There is Wrong Here!"}
        break;
    }
    case("company"):
    {
        const compName=await company.findOne({where:{companyName:input}})
        if(compName){myresult=compName.companyId}
        else{myresult="There is Wrong Here!"}
        break;
    }
    case("notification"):
    {
        const descr=await notification.findOne({where:{description:input,userUserId:req.id}})
        if(descr){myresult=descr.notificationId}
        else{myresult="There is Wrong Here!"}
        break;
    }
    case("order"):
    {
        const orderN=await order.findOne({where:{state:"waiting",userUserId:req.id}})
        if(orderN){myresult=orderN.orderId}
        else{myresult="There is Wrong Here!"}
        break;
    }
    
    case("altmed"):
    {   const m=await medicine.findOne({where:{medicineName:input}})
        const altmedN=await altmed.findOne({where:{altmed:m.medicineId}})
        if(altmedN){myresult=altmedN.altmedId}
        else{myresult="There is Wrong Here!"}
        break;
    }
    case("op_relation"):
    {
        const orderN=await order.findOne({where:{state:"waiting",userUserId:req.id}})
        const m=await medicine.findOne({where:{medicineName:input}})
        const op_relationN=await op_relation.findOne({where:{orderOrderId:orderN.orderId,medicineMedicineId:m.medicineId}})
        if(op_relationN){myresult=op_relationN.op_relationId}        
        else{myresult="There is Wrong Here!"}
        break;
    }
    default:
        myresult="Wrong Values"
}
    return res.status(201).json({myresult:myresult})}catch(error){return res.status(500).json({msg:error.message})}
}