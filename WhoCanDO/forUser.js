const express=require('express');
const user=require('../models/user');
exports.forUser=async(req,res,next)=>{
    const id=req.id;
    const c=await user.findOne({where:{userId:id}})
    if(c.role=="user"){
        next()
    }
    else{
        return res.status(400).json({message:"User Can Do It Only!"})
    }
}