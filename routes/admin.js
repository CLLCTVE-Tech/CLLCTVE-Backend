const {User, validateUser, validateUserName, validateDreamJob, 
    validateSkill, validateEducation}= require('../models/user');
const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const jwt=require('jsonwebtoken');
const router=express.Router();
const bcrypt =require('bcrypt');
const auth=require("../middleware/auth");
const admin = require('../middleware/admin');
const Joi=require('joi');
const {Token}=require('../models/tokens');
const crypto= require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('config');
const request= require('superagent');
const {brandApp}= require('../models/application')
var generator = require('generate-password');
const permissions=require('../config/persmissions.json');
const {update, load} =require('json-update');
const fs = require('fs');

console.log(permissions.admins);


const transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
      user: config.get("emailUser"),
      pass: config.get("emailPass")
    }}));
 

//admins should be able to set levels of access and remove levels of access
//accordingly
router.put('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    //check if the user we want to give admin privileges exists
    const user= await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //write permission to permissions file then update database

    user.isAdmin=true;
    await user.save();

    return res.status(200).send("The User was successfully given Administrative access.")

});

//set contributor access
router.put('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    //check if the user we want to give admin privileges exists
    const user= await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //write permission to permissions file then update database

    user.isContributor=true;
    await user.save();

    return res.status(200).send("The User was successfully given contributor level access.")

});


//remove admin access
router.delete('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    //check if the user we want to give admin privileges exists
    const user= await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //write permission to permissions file then update database

    user.isAdmin=false;
    await user.save();

    return res.status(200).send("The User was successfully given contributor level access.")
});


//remove contributor access
router.delete('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    //check if the user we want to give admin privileges exists
    const user= await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //write permission to permissions file then update database

    user.isContributor=false;
    await user.save();

    return res.status(200).send("The User was successfully given contributor level access.")

});

//get all permissions
router.get('/authorize/permissions', [auth,admin], async (req, res) => {

    try{ return res.status(200).send(permissions);}
        catch(error){
            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
        };

});

//get list of all contributors
router.get('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    try{ 
        users=await User.find({isContributor: true}).limit(25);
         return res.status(200).send(users);
    }
        catch(error){
            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
        };

});

//get list of administrators
router.get('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    try{

        users= await User.find({isAdmin: true}).limit(25);
        console.log(users);
         return res.status(200).send(users);
        }
        catch(error){
            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
        };

});

//get list of current brand applications
router.get('/authorize/brand/applications', [auth,admin], async (req, res) => {

    console.log(req.user);

    try{

    const current= await brandApp.find({status: 'pending'});
    return res.status(200).send(current)
    }
    catch(error){
        
        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});

//view a brands application
router.get('/authorize/brand/applications/:id', [auth,admin], async (req, res) => {
    try{

    const current= await brandApp.find({_id: req.params.id});
    if (!current) return res.status(404).send("The application does not exist");
    return res.status(200).send(current);
    }

    catch(error){
        
        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});


//look up a brand and approve them.
router.post('/authorize/brand/applications/:id', [auth,admin], async (req, res) => {

    try{

        const brand= await brandApp.findOne({_id:req.params.id});
        if (!brand) return res.status(404).send("The brand's application cannot be found");

        if(brand.status=="approved") return res.status(404).send("The brand's application has already been approved.");
        if(brand.status=="denied") return res.status(404).send("The brand's application was already denied.");

        if (!req.body.response) return res.status(404).send("Please provide a response");
         
        if (req.body.response == "false"){

            //send email to let brand know they were not approved.
          
              var mailOptions = {
                from: config.get("emailUser"),
                to: brand.email,
                subject: 'An Update on your CLLCTVE Application',
                text: 'This is an automated email to test CLLCTVE  features. Unfortunalety your brand '+ brand.brandName+' was not approved by the CLLCTVE team' +
                'Thank you for your interest in CLLCTVE and we hope that you stick with us for future oppurtunities. '
            };
          
          
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });

            brand.status= "denied"
            await brand.save()
            return res.status(200).send("The brand was not approved");

        }

    else if(req.body.response == "true"){

        //generate a password for the user and make a request to the brand signup endpoint

        const data = await request.post('http://localhost:3000/api/brands/signup')
        .send({firstName: brand.firstName,
            lastName: brand.lastName,
            email: brand.email,
            username: brand.brandName,
            password: generator.generate({length: 10, numbers: true})
        });

        brand.status="approved"
        await brand.save();
        return res.status(200).send("The brand's application was approved");

    }

    else{
    return res.status(404).send("Provide a valid response");
    }


    } catch(error){
        
        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});  

module.exports=router;