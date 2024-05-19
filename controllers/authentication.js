const user=require('../models/user');
const tokens=require('../models/tokens');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const SECRET_KEY="NOTESAPI";
module.exports=async(req,res,next)=>{
    const authHeader=await req.headers.authorization;;
    if(!authHeader){
        return res.status(400).json({message:"Not Authorization!"})
    }
    const authHeader1=authHeader.split(' ')[1];
    const myToken=await tokens.findOne({where:{tokenValue:authHeader1}});
    if(!myToken){
        return res.status(400).json({message:"Not Logged In:("});
    }
    const token=authHeader.split(' ')[1];
    let decodedToken;
    try{
        decodedToken=jwt.verify(token,SECRET_KEY);
    }catch(error){
        res.status(500).json({message:"Server Error:("})
    }
    if(!decodedToken){
        return res.status(400).json({message:"Not Authenticated:("})
    }
    req.id=decodedToken.userId;
    next();
}