const {Admin, Contributor}= require('../models/role');
const {BaseUser}=require('../models/user');
const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const jwt=require('jsonwebtoken');
const router=express.Router();
const auth=require("../middleware/auth");
const admin = require('../middleware/admin');
const Joi=require('joi');
const {Token}=require('../models/tokens');
const crypto= require('crypto');
const transporter= require("../config/transporter");
const config = require('config');
const request= require('superagent');
const {brandApp, discForm}= require('../models/application')
var generator = require('generate-password');
const permissions=require('../config/persmissions.json');
const {update, load} =require('json-update');
const fs = require('fs');
const {InsightFeed}= require('../models/insight');
const logger=require('../config/logger');
 

//admins should be able to set levels of access and remove levels of access
//accordingly
router.post('/authorize/permissions/admins', [auth,admin], async(req, res) => {

    try{

    //check if the user we want to give admin privileges exists
    const user= await BaseUser.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //check if user is already an admin
    let exists= await Admin.findOne({user: user._id});
    if(exists) return res.status(400).send(["The User is already an admin", exists]);

    const admin= new Admin({user: user._id});
    await admin.save();

    return res.status(200).send({
        user: admin
    })
}

catch(error){
    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");
};

});

//set contributor access
router.post('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    try{

    //check if the user we want to give admin privileges exists
    const user= await BaseUser.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //check if a user is a contributor
    let exists=await Contributor.findOne({user: user._id});
    if(exists) return res.status(400).send("The User is already a contributor");

    const contributor= new Contributor({user: user._id});
    await contributor.save();

    return res.status(200).send({
        user: contributor
    });
   }

   catch(error){
    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");
};

});


//remove admin access
router.delete('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    try{

    //check if the user we want to give admin privileges exists
    const user= await BaseUser.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //check for user in admin database then remove
    let admin=await Admin.findOne({user: user._id});
    if(!admin) return res.status(400).send("The User is not an admin.");

    await admin.remove();

    return res.status(200).send("The user's admin privelges were removed.");
    }

    catch(error){
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };


});


//remove contributor access
router.delete('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    try{

    //check if the user we want to give admin privileges exists
    const user= await BaseUser.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //check if user is already a contributor
    let contributor=await Contributor.findOne({user: user._id});
    if(!contributor) return res.status(400).send("The User is not a contributor.");

    await contributor.remove();
    return res.status(200).send("The user's contributor privelges were removed.");

    }

    catch(error){
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };

});

//get list of all contributors
router.get('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    try{ 
         let contributors=await Contributor.find({}).limit(25);
         return res.status(200).send(contributors);
    }
        catch(error){
            console.error(error);
            logger.error({message:"An error occurred ", error:error})
            return res.status(500).send("Sorry an error occured please try again later.");
        };

});

//get list of administrators
router.get('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    try{

         let admins= await Admin.find({}).limit(25);
         return res.status(200).send(admins);
        }
        catch(error){
            console.error(error);
            logger.error({message:"An error occurred ", error:error})
            return res.status(500).send("Sorry an error occured please try again later.");
        };

});


module.exports=router;