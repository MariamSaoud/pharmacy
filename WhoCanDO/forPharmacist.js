const express=require('express');
const user=require('../models/user');
exports.forPharmacist=async(req,res,next)=>{
    const id=req.id;
    try{    const c=await user.findOne({where:{userId:id}})
    if(c.role=="pharmacist"){
        next()
    }
    else{
        return res.status(400).json({message:"Pharmacist Can Do It Only!"})
    }}
catch(error){
    return res.status(500).json({message:"Error!"})
}
}